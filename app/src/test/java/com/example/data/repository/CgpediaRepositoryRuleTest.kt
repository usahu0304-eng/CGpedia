package com.example.data.repository

import com.example.base.FirestoreEmulatorTestBase
import com.example.data.model.BilingualQuestion
import com.example.data.model.CurrentAffairItem
import com.example.data.model.ExamFolder
import com.example.data.model.TestAttempt
import com.google.firebase.firestore.FirebaseFirestoreException
import java.util.UUID
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class CgpediaRepositoryRuleTest : FirestoreEmulatorTestBase() {

    @Test
    fun ensureUserProfile_studentValidPayload_createsAndReadsOwnProfile() = runBlocking {
        val aliceEmail = "alice_${UUID.randomUUID().toString().take(8)}@test.com"
        val aliceUid = signInTestUser(aliceEmail)
        val repository = CgpediaRepository(firestore)

        val createRes = withTimeout(DEFAULT_TIMEOUT_MS) {
            repository.ensureUserProfile(
                displayName = "Alice Sahu",
                email = aliceEmail,
                photoUrl = "",
                isVerifiedAdmin = false
            )
        }
        assertTrue("Expected ensureUserProfile to succeed: ${createRes.exceptionOrNull()}", createRes.isSuccess)

        val fetchedRes = withTimeout(DEFAULT_TIMEOUT_MS) {
            repository.getUserProfileById(aliceUid)
        }
        assertTrue(fetchedRes.isSuccess)
        assertEquals("Alice Sahu", fetchedRes.getOrNull()?.displayName)
        assertEquals("student", fetchedRes.getOrNull()?.role)
    }

    @Test
    fun getUserProfileById_crossUserPiiAccess_failsWithPermissionDenied() = runBlocking {
        val aliceEmail = "alice_${UUID.randomUUID().toString().take(8)}@test.com"
        val aliceUid = signInTestUser(aliceEmail)
        val repo = CgpediaRepository(firestore)
        withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.ensureUserProfile("Alice", aliceEmail, "", isVerifiedAdmin = false).getOrThrow()
        }

        val bobEmail = "bob_${UUID.randomUUID().toString().take(8)}@test.com"
        signInTestUser(bobEmail)
        val crossRead = withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.getUserProfileById(aliceUid)
        }
        assertTrue("Cross-user PII read must fail", crossRead.isFailure)
        val fsEx = crossRead.exceptionOrNull()?.unwrapFirestoreException()
        assertNotNull(fsEx)
        assertEquals(FirebaseFirestoreException.Code.PERMISSION_DENIED, fsEx?.code)
    }

    @Test
    fun nonAdminStudent_cannotWriteExamFolders_failsWithPermissionDenied() = runBlocking {
        val studentEmail = "student_${UUID.randomUUID().toString().take(8)}@test.com"
        signInTestUser(studentEmail)
        val repo = CgpediaRepository(firestore)

        val unauthorizedFolderWrite = withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.saveExamFolderAdmin(
                ExamFolder(
                    id = "illegal_folder_${UUID.randomUUID().toString().take(6)}",
                    titleHi = "अवैध फोल्डर",
                    titleEn = "Illegal Folder",
                    examCode = "HACK"
                )
            )
        }
        assertTrue("Student write to exam_folders must fail", unauthorizedFolderWrite.isFailure)
        val fsEx = unauthorizedFolderWrite.exceptionOrNull()?.unwrapFirestoreException()
        assertNotNull(fsEx)
        assertEquals(FirebaseFirestoreException.Code.PERMISSION_DENIED, fsEx?.code)
    }

    @Test
    fun studentPurchasesAttemptsBookmarksAndGroundedCurrentAffairs_roundTripSucceeds() = runBlocking {
        val email = "aspirant_${UUID.randomUUID().toString().take(8)}@test.com"
        val uid = signInTestUser(email)
        val repo = CgpediaRepository(firestore)

        // 1. Purchase a paid test
        val payRes = withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.recordTestPurchase(
                testId = "test_cgpsc_pre_paid_2",
                testTitleHi = "सीजीपीएससी प्रीमियम मॉक",
                testTitleEn = "CGPSC Premium Mock",
                amountInr = 99L,
                paymentMethod = "UPI"
            )
        }
        assertTrue("Purchase write failed: ${payRes.exceptionOrNull()}", payRes.isSuccess)

        val purchases = withTimeout(FLOW_TIMEOUT_MS) {
            repo.observeUserPurchases(uid).first { it.isNotEmpty() }
        }
        assertEquals("test_cgpsc_pre_paid_2", purchases.first().testId)

        // 2. Submit test attempt
        val attRes = withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.submitTestAttempt(
                TestAttempt(
                    testId = "test_cgpsc_pre_free_1",
                    testTitleHi = "मॉक 1",
                    testTitleEn = "Mock 1",
                    totalQuestions = 5L,
                    attemptedCount = 5L,
                    correctCount = 4L,
                    incorrectCount = 1L,
                    score = 7.34,
                    maxScore = 10.0,
                    accuracyPercent = 80L,
                    timeTakenSeconds = 310L,
                    selectedAnswers = mapOf("q1" to 0L, "q2" to 1L)
                )
            )
        }
        assertTrue("Attempt write failed: ${attRes.exceptionOrNull()}", attRes.isSuccess)

        // 3. Bookmark bilingual question
        val bmRes = withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.toggleBookmarkQuestion(
                question = BilingualQuestion(
                    id = "q_cgpre1_1",
                    testId = "test_cgpsc_pre_free_1",
                    questionHi = "छत्तीसगढ़ का गठन कब हुआ?",
                    questionEn = "When was Chhattisgarh formed?",
                    optionsHi = listOf("1 नवंबर 2000", "9 नवंबर 2000", "15 नवंबर 2000", "25 अगस्त 2000"),
                    optionsEn = listOf("1 Nov 2000", "9 Nov 2000", "15 Nov 2000", "25 Aug 2000"),
                    correctOptionIndex = 0L,
                    explanationHi = "1 नवंबर 2000 को गठन हुआ।",
                    explanationEn = "Formed on 1 November 2000.",
                    subjectTag = "CG GS"
                ),
                currentlyBookmarkedId = null
            )
        }
        assertTrue("Bookmark write failed: ${bmRes.exceptionOrNull()}", bmRes.isSuccess)

        // 4. Save AI-grounded Current Affair & observe published stream
        val caRes = withTimeout(DEFAULT_TIMEOUT_MS) {
            repo.saveGroundedCurrentAffairsBatch(
                listOf(
                    CurrentAffairItem(
                        category = "chhattisgarh",
                        headlineHi = "छत्तीसगढ़ आर्थिक सर्वेक्षण विशेषांक",
                        headlineEn = "Chhattisgarh Economic Survey Highlights",
                        summaryHi = "राज्य के सकल घरेलू उत्पाद में वृद्धि दर्ज की गई।",
                        summaryEn = "GSDP growth recorded across primary and tertiary sectors.",
                        examKeyPointsHi = listOf("तथ्य 1", "तथ्य 2"),
                        examKeyPointsEn = listOf("Fact 1", "Fact 2"),
                        sourceName = "DPR Chhattisgarh",
                        sourceUrl = "https://dprcg.gov.in",
                        dateLabel = "2026-11-02"
                    )
                )
            )
        }
        assertTrue("Current affair save failed: ${caRes.exceptionOrNull()}", caRes.isSuccess)

        val emittedCa = withTimeout(FLOW_TIMEOUT_MS) {
            repo.observePublishedCurrentAffairs().first { it.isNotEmpty() }
        }
        assertTrue(emittedCa.any { it.category == "chhattisgarh" })
    }

    @Test
    fun observePublishedCurrentAffairs_unauthenticatedUser_failsWithPermissionDenied() = runBlocking {
        auth.signOut()
        val repo = CgpediaRepository(firestore)
        try {
            withTimeout(FLOW_TIMEOUT_MS) {
                repo.observePublishedCurrentAffairs().first()
            }
            fail("Expected unauthenticated query to fail with PERMISSION_DENIED")
        } catch (e: Exception) {
            val fsEx = checkNotNull(e.unwrapFirestoreException()) {
                "Expected nested FirebaseFirestoreException, got $e"
            }
            assertEquals(FirebaseFirestoreException.Code.PERMISSION_DENIED, fsEx.code)
        }
    }

    private companion object {
        const val DEFAULT_TIMEOUT_MS = 5000L
        const val FLOW_TIMEOUT_MS = 4000L
    }
}
