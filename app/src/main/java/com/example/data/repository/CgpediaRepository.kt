package com.example.data.repository

import android.content.Context
import android.util.Base64
import com.example.R
import com.example.data.error.OperationType
import com.example.data.error.handleFirestoreError
import com.example.data.model.AnthemAudioChunk
import com.example.data.model.AppConfig
import com.example.data.model.BilingualQuestion
import com.example.data.model.BookmarkedQuestion
import com.example.data.model.CurrentAffairItem
import com.example.data.model.ExamFolder
import com.example.data.model.PurchaseRecord
import com.example.data.model.SubjectFolder
import com.example.data.model.TestAttempt
import com.example.data.model.TestSeriesItem
import com.example.data.model.UserProfile
import com.example.data.seed.CgpediaStarterCatalog
import com.google.firebase.Firebase
import com.google.firebase.Timestamp
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.snapshots
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await

/**
 * Primary Cloud Firestore Repository for CGpedia.
 * Always initialized with the named database ID (R.string.firestore_database_id).
 */
class CgpediaRepository(private val db: FirebaseFirestore) {

    constructor(context: Context) : this(
        FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        )
    )

    private val auth = Firebase.auth

    private fun requireUserId(): String {
        return auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google before accessing Firestore.")
    }

    // --- 1. Admin Registry Check ---
    suspend fun checkTrustedAdminDoc(uid: String): Boolean {
        val path = "admins/$uid"
        return try {
            db.collection("admins").document(uid).get().await().exists()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.GET, path)
            false
        }
    }

    // --- 2. User Profile & Settings ---
    fun observeUserProfile(userId: String): Flow<UserProfile?> {
        val path = "users/$userId"
        return db.collection("users").document(userId)
            .snapshots()
            .map { snap ->
                if (snap.exists()) {
                    snap.toObject(UserProfile::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                } else null
            }
            .catch { e ->
                if (e is Exception) handleFirestoreError(e, OperationType.GET, path)
                throw e
            }
    }

    suspend fun ensureUserProfile(
        displayName: String,
        email: String,
        photoUrl: String,
        isVerifiedAdmin: Boolean,
        phoneNumber: String = ""
    ): Result<UserProfile> {
        val uid = requireUserId()
        val docRef = db.collection("users").document(uid)
        return try {
            val snap = docRef.get().await()
            if (snap.exists()) {
                val existingProfile = snap.toObject(
                    UserProfile::class.java,
                    DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                ) ?: UserProfile(id = uid, userId = uid)
                Result.success(existingProfile)
            } else {
                val fallbackName = if (phoneNumber.length >= 4) {
                    "Aspirant (${phoneNumber.takeLast(4)})"
                } else {
                    "CGpedia Aspirant"
                }
                val newProfile = UserProfile(
                    id = uid,
                    userId = uid,
                    displayName = displayName.ifBlank { fallbackName },
                    email = email,
                    phoneNumber = phoneNumber.take(20),
                    photoUrl = photoUrl,
                    targetExam = "CGPSC & CGSSB",
                    preferredLanguage = "en",
                    darkMode = false,
                    notifyCurrentAffairs = true,
                    notifyNewTests = true,
                    role = if (isVerifiedAdmin) "admin" else "student"
                )
                docRef.set(newProfile.toCreateMap()).await()
                Result.success(newProfile)
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, docRef.path)
            Result.failure(e)
        }
    }

    suspend fun updateUserProfileSettings(
        displayName: String,
        phoneNumber: String,
        photoUrl: String,
        targetExam: String,
        preferredLanguage: String,
        darkMode: Boolean,
        notifyCurrentAffairs: Boolean,
        notifyNewTests: Boolean
    ): Result<Unit> {
        val uid = requireUserId()
        val docRef = db.collection("users").document(uid)
        return try {
            val updates = mapOf(
                "displayName" to displayName.ifBlank { "CGpedia Aspirant" }.take(80),
                "phoneNumber" to phoneNumber.take(20),
                "photoUrl" to photoUrl.take(500),
                "targetExam" to targetExam,
                "preferredLanguage" to preferredLanguage,
                "darkMode" to darkMode,
                "notifyCurrentAffairs" to notifyCurrentAffairs,
                "notifyNewTests" to notifyNewTests,
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.update(updates).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, docRef.path)
            Result.failure(e)
        }
    }

    suspend fun getUserProfileById(targetUserId: String): Result<UserProfile?> {
        val docRef = db.collection("users").document(targetUserId)
        return try {
            val snap = docRef.get().await()
            Result.success(snap.toObject(UserProfile::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.GET, docRef.path)
            Result.failure(e)
        }
    }

    // --- 3. Student Purchases, Attempts & Bookmarks ---
    fun observeUserPurchases(userId: String): Flow<List<PurchaseRecord>> = flow {
        val path = "users/$userId/purchases"
        emitAll(
            db.collection("users").document(userId).collection("purchases")
                .whereEqualTo("userId", userId)
                .snapshots()
                .map { snap ->
                    snap.toObjects(PurchaseRecord::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .catch { e ->
                    if (e is Exception) handleFirestoreError(e, OperationType.LIST, path)
                    throw e
                }
        )
    }

    suspend fun recordTestPurchase(
        testId: String,
        testTitleHi: String,
        testTitleEn: String,
        amountInr: Long,
        paymentMethod: String
    ): Result<String> {
        val uid = requireUserId()
        val purchaseId = "pay_${UUID.randomUUID().toString().replace("-", "").take(16)}"
        val docRef = db.collection("users").document(uid).collection("purchases").document(purchaseId)
        val record = PurchaseRecord(
            id = purchaseId,
            userId = uid,
            testId = testId,
            testTitleHi = testTitleHi,
            testTitleEn = testTitleEn,
            amountInr = amountInr,
            paymentMethod = paymentMethod,
            transactionRef = "CGP-${System.currentTimeMillis()}-${purchaseId.takeLast(4).uppercase()}"
        )
        return try {
            docRef.set(record.toCreateMap()).await()
            Result.success(purchaseId)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, docRef.path)
            Result.failure(e)
        }
    }

    /**
     * Observes all registered users for the Owner Admin to easily view User IDs / Emails
     * and grant manual access to Paid Test Series packages.
     */
    fun observeAllUsersForAdmin(): Flow<List<UserProfile>> =
        db.collection("users")
            .whereIn("role", listOf("student", "admin"))
            .snapshots()
            .map { snap ->
                snap.toObjects(UserProfile::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    .sortedByDescending { it.updatedAt ?: Timestamp(0, 0) }
            }
            .catch { e ->
                if (e is Exception) handleFirestoreError(e, OperationType.LIST, "users")
                throw e
            }

    /**
     * Observes unlocked purchases for a specific student UID in the Admin Panel.
     */
    fun observeStudentPurchasesForAdmin(targetUserId: String): Flow<List<PurchaseRecord>> =
        db.collection("users").document(targetUserId).collection("purchases")
            .snapshots()
            .map { snap ->
                snap.toObjects(PurchaseRecord::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
            }
            .catch { e ->
                if (e is Exception) handleFirestoreError(e, OperationType.LIST, "users/$targetUserId/purchases")
                throw e
            }

    /**
     * Manual Access Control: Allows the Admin to unlock or grant paid test series / folder access
     * to a specific student by entering their registered User ID or Email ID after payment confirmation.
     */
    suspend fun grantPaidAccessByAdmin(
        studentIdentifier: String,
        itemId: String,
        titleHi: String,
        titleEn: String,
        amountInr: Long
    ): Result<String> {
        requireUserId()
        val trimmedInput = studentIdentifier.trim()
        if (trimmedInput.isBlank()) {
            return Result.failure(IllegalArgumentException("Please enter a valid Student User ID or Email ID."))
        }
        return try {
            val matchedUids = linkedSetOf<String>()
            var matchedDisplayLabel = trimmedInput

            // 1. Check direct userId document if input is a valid Firestore document ID
            val validIdRegex = Regex("^[a-zA-Z0-9_\\-]+$")
            if (validIdRegex.matches(trimmedInput)) {
                val directSnap = db.collection("users").document(trimmedInput).get().await()
                if (directSnap.exists()) {
                    matchedUids.add(trimmedInput)
                    val p = directSnap.toObject(UserProfile::class.java)
                    if (p != null) {
                        matchedDisplayLabel = "${p.displayName} (${p.email.ifBlank { p.userId }})"
                    }
                }
            }

            // 2. Search registered users by Email ID, User ID, or Phone number (case-insensitive)
            val allUsersSnap = db.collection("users")
                .whereIn("role", listOf("student", "admin"))
                .get()
                .await()
            val allProfiles = allUsersSnap.toObjects(UserProfile::class.java)
            val inputDigits = trimmedInput.filter(Char::isDigit).takeLast(10)
            for (profile in allProfiles) {
                val uidMatch = profile.userId.equals(trimmedInput, ignoreCase = true) ||
                    profile.id.equals(trimmedInput, ignoreCase = true)
                val emailMatch = profile.email.isNotBlank() &&
                    profile.email.equals(trimmedInput, ignoreCase = true)
                val phoneMatch = inputDigits.length == 10 &&
                    profile.phoneNumber.filter(Char::isDigit).takeLast(10) == inputDigits
                if (uidMatch || emailMatch || phoneMatch) {
                    val targetUid = profile.userId.ifBlank { profile.id }
                    if (targetUid.isNotBlank() && validIdRegex.matches(targetUid)) {
                        matchedUids.add(targetUid)
                        matchedDisplayLabel = "${profile.displayName} (${profile.email.ifBlank { targetUid }})"
                    }
                }
            }

            // 3. If no existing user profile matched yet, allow direct UID unlock if valid ID
            if (matchedUids.isEmpty()) {
                if (validIdRegex.matches(trimmedInput)) {
                    matchedUids.add(trimmedInput)
                } else {
                    return Result.failure(
                        IllegalArgumentException(
                            "No registered student found with Email '$trimmedInput'. Please ask the student to sign in once or enter their User ID."
                        )
                    )
                }
            }

            val sanitizedItemId = itemId.replace(Regex("[^a-zA-Z0-9_\\-]"), "_").take(60)
            val purchaseId = "admin_grant_${sanitizedItemId.ifBlank { "pkg" }}"
            for (targetUid in matchedUids) {
                val docRef = db.collection("users")
                    .document(targetUid)
                    .collection("purchases")
                    .document(purchaseId)
                val record = PurchaseRecord(
                    id = purchaseId,
                    userId = targetUid,
                    testId = itemId,
                    testTitleHi = titleHi.ifBlank { "सीजीपीएससी प्री 2026 टेस्ट सीरीज" },
                    testTitleEn = titleEn.ifBlank { "CGPSC Pre 2026 Test Series" },
                    amountInr = amountInr.coerceIn(0L, 50000L),
                    paymentMethod = "AdminGrant",
                    transactionRef = "ADMIN-UNLOCK-${System.currentTimeMillis().toString().takeLast(6)}",
                    status = "completed"
                )
                docRef.set(record.toCreateMap()).await()
            }

            Result.success("Unlocked '$titleEn' for $matchedDisplayLabel")
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, "users/$trimmedInput/purchases")
            Result.failure(e)
        }
    }

    suspend fun revokePaidAccessByAdmin(targetUserId: String, purchaseId: String): Result<Unit> {
        val docRef = db.collection("users").document(targetUserId).collection("purchases").document(purchaseId)
        return try {
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, docRef.path)
            Result.failure(e)
        }
    }

    fun observeUserAttempts(userId: String): Flow<List<TestAttempt>> = flow {
        val path = "users/$userId/attempts"
        emitAll(
            db.collection("users").document(userId).collection("attempts")
                .whereEqualTo("userId", userId)
                .snapshots()
                .map { snap ->
                    snap.toObjects(TestAttempt::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .catch { e ->
                    if (e is Exception) handleFirestoreError(e, OperationType.LIST, path)
                    throw e
                }
        )
    }

    suspend fun submitTestAttempt(attempt: TestAttempt): Result<String> {
        val uid = requireUserId()
        val attemptId = "att_${UUID.randomUUID().toString().replace("-", "").take(16)}"
        val docRef = db.collection("users").document(uid).collection("attempts").document(attemptId)
        val scoped = attempt.copy(id = attemptId, userId = uid)
        return try {
            docRef.set(scoped.toCreateMap()).await()
            Result.success(attemptId)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, docRef.path)
            Result.failure(e)
        }
    }

    fun observeUserBookmarks(userId: String): Flow<List<BookmarkedQuestion>> = flow {
        val path = "users/$userId/bookmarks"
        emitAll(
            db.collection("users").document(userId).collection("bookmarks")
                .whereEqualTo("userId", userId)
                .snapshots()
                .map { snap ->
                    snap.toObjects(BookmarkedQuestion::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .catch { e ->
                    if (e is Exception) handleFirestoreError(e, OperationType.LIST, path)
                    throw e
                }
        )
    }

    suspend fun toggleBookmarkQuestion(question: BilingualQuestion, currentlyBookmarkedId: String?): Result<Boolean> {
        val uid = requireUserId()
        return try {
            if (!currentlyBookmarkedId.isNullOrBlank()) {
                val docRef = db.collection("users").document(uid).collection("bookmarks").document(currentlyBookmarkedId)
                docRef.delete().await()
                Result.success(false)
            } else {
                val safeId = "bm_${question.id.replace(Regex("[^a-zA-Z0-9_\\-]"), "").take(60).ifBlank { UUID.randomUUID().toString().take(12) }}"
                val docRef = db.collection("users").document(uid).collection("bookmarks").document(safeId)
                val bm = BookmarkedQuestion(
                    id = safeId,
                    userId = uid,
                    questionId = question.id.ifBlank { safeId },
                    testId = question.testId.ifBlank { "general" },
                    questionHi = question.questionHi,
                    questionEn = question.questionEn,
                    optionsHi = question.optionsHi,
                    optionsEn = question.optionsEn,
                    correctOptionIndex = question.correctOptionIndex,
                    explanationHi = question.explanationHi,
                    explanationEn = question.explanationEn,
                    subjectTag = question.subjectTag,
                    isOfflineCached = true
                )
                docRef.set(bm.toCreateMap()).await()
                Result.success(true)
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, "users/$uid/bookmarks")
            Result.failure(e)
        }
    }

    // --- 4. Current Affairs (Auto-Updated Background Pipeline) ---
    fun observePublishedCurrentAffairs(): Flow<List<CurrentAffairItem>> =
        db.collection("current_affairs")
            .whereEqualTo("visibility", "published")
            .snapshots()
            .map { snap ->
                val cloud = snap.toObjects(CurrentAffairItem::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                cloud.ifEmpty { CgpediaStarterCatalog.defaultCurrentAffairs() }
            }
            .catch { e ->
                if (e is Exception) handleFirestoreError(e, OperationType.LIST, "current_affairs")
                throw e
            }

    suspend fun saveGroundedCurrentAffairsBatch(items: List<CurrentAffairItem>): Result<Int> {
        val uid = requireUserId()
        return try {
            var saved = 0
            for (item in items) {
                val docId = "ca_${item.category}_${UUID.randomUUID().toString().replace("-", "").take(12)}"
                val docRef = db.collection("current_affairs").document(docId)
                docRef.set(item.copy(authorUid = uid, visibility = "published", sourceModule = "ai_grounding_pipeline").toCreateMap()).await()
                saved++
            }
            Result.success(saved)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, "current_affairs")
            Result.failure(e)
        }
    }

    suspend fun deleteCurrentAffairAdmin(articleId: String): Result<Unit> {
        val docRef = db.collection("current_affairs").document(articleId)
        return try {
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, docRef.path)
            Result.failure(e)
        }
    }

    // --- 5. Exam & Subject Folders (Student Published Stream + Admin CRUD) ---
    fun observeExamFolders(): Flow<List<ExamFolder>> =
        db.collection("exam_folders")
            .whereEqualTo("visibility", "published")
            .snapshots()
            .map { snap ->
                val cloud = snap.toObjects(ExamFolder::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    .sortedBy { it.sortOrder }
                cloud.ifEmpty { CgpediaStarterCatalog.defaultExamFolders() }
            }
            .catch { e ->
                if (e is Exception) handleFirestoreError(e, OperationType.LIST, "exam_folders")
                throw e
            }

    fun observeSubjectFolders(): Flow<List<SubjectFolder>> =
        db.collection("subject_folders")
            .whereEqualTo("visibility", "published")
            .snapshots()
            .map { snap ->
                val cloud = snap.toObjects(SubjectFolder::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    .sortedBy { it.sortOrder }
                cloud.ifEmpty { CgpediaStarterCatalog.defaultSubjectFolders() }
            }
            .catch { e ->
                if (e is Exception) handleFirestoreError(e, OperationType.LIST, "subject_folders")
                throw e
            }

    suspend fun seedDefaultCatalogIfEmptyAdmin(): Result<Boolean> {
        val adminUid = requireUserId()
        return try {
            val batch = db.batch()
            CgpediaStarterCatalog.defaultExamFolders(adminUid).forEach { folder ->
                batch.set(db.collection("exam_folders").document(folder.id), folder.toCreateMap())
            }
            CgpediaStarterCatalog.defaultSubjectFolders(adminUid).forEach { folder ->
                batch.set(db.collection("subject_folders").document(folder.id), folder.toCreateMap())
            }
            CgpediaStarterCatalog.defaultTests(adminUid).forEach { test ->
                batch.set(db.collection("tests").document(test.id), test.toCreateMap())
            }
            CgpediaStarterCatalog.defaultQuestions(adminUid).forEach { q ->
                batch.set(db.collection("questions").document(q.id), q.toCreateMap())
            }
            CgpediaStarterCatalog.defaultCurrentAffairs(adminUid).forEach { ca ->
                batch.set(db.collection("current_affairs").document(ca.id), ca.toCreateMap())
            }
            val existingConfigSnap = db.collection("app_config").document("main").get().await()
            if (!existingConfigSnap.exists()) {
                val defaultConfig = AppConfig(updatedBy = adminUid)
                batch.set(db.collection("app_config").document("main"), defaultConfig.toCreateMap())
            }
            batch.commit().await()
            Result.success(true)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, "catalog_seed")
            Result.failure(e)
        }
    }

    suspend fun saveExamFolderAdmin(folder: ExamFolder): Result<String> {
        val adminUid = requireUserId()
        val docId = folder.id.ifBlank { "ef_${UUID.randomUUID().toString().replace("-", "").take(12)}" }
        val docRef = db.collection("exam_folders").document(docId)
        return try {
            val snap = docRef.get().await()
            if (snap.exists()) {
                docRef.update(
                    mapOf(
                        "titleHi" to folder.titleHi.take(120),
                        "titleEn" to folder.titleEn.take(120),
                        "descriptionHi" to folder.descriptionHi.take(400),
                        "descriptionEn" to folder.descriptionEn.take(400),
                        "examCode" to folder.examCode.take(40),
                        "sortOrder" to folder.sortOrder.coerceIn(0L, 1000L),
                        "isFreeFolder" to folder.isFreeFolder,
                        "priceInr" to folder.priceInr.coerceIn(0L, 50000L),
                        "testCount" to folder.testCount.coerceIn(0L, 500L),
                        "visibility" to folder.visibility,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                docRef.set(folder.copy(id = docId, createdBy = adminUid).toCreateMap()).await()
            }
            Result.success(docId)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, docRef.path)
            Result.failure(e)
        }
    }

    suspend fun deleteExamFolderAdmin(folderId: String): Result<Unit> {
        val docRef = db.collection("exam_folders").document(folderId)
        return try {
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, docRef.path)
            Result.failure(e)
        }
    }

    suspend fun saveSubjectFolderAdmin(folder: SubjectFolder): Result<String> {
        val adminUid = requireUserId()
        val docId = folder.id.ifBlank { "sf_${UUID.randomUUID().toString().replace("-", "").take(12)}" }
        val docRef = db.collection("subject_folders").document(docId)
        return try {
            val snap = docRef.get().await()
            if (snap.exists()) {
                docRef.update(
                    mapOf(
                        "titleHi" to folder.titleHi.take(120),
                        "titleEn" to folder.titleEn.take(120),
                        "descriptionHi" to folder.descriptionHi.take(400),
                        "descriptionEn" to folder.descriptionEn.take(400),
                        "subjectCode" to folder.subjectCode.take(40),
                        "sortOrder" to folder.sortOrder.coerceIn(0L, 1000L),
                        "isFreeFolder" to folder.isFreeFolder,
                        "priceInr" to folder.priceInr.coerceIn(0L, 50000L),
                        "testCount" to folder.testCount.coerceIn(0L, 500L),
                        "visibility" to folder.visibility,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                docRef.set(folder.copy(id = docId, createdBy = adminUid).toCreateMap()).await()
            }
            Result.success(docId)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, docRef.path)
            Result.failure(e)
        }
    }

    suspend fun deleteSubjectFolderAdmin(folderId: String): Result<Unit> {
        val docRef = db.collection("subject_folders").document(folderId)
        return try {
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, docRef.path)
            Result.failure(e)
        }
    }

    // --- 6. Tests & Bilingual Questions (Student Published + Admin Draft & Publish) ---
    fun observePublishedTests(): Flow<List<TestSeriesItem>> =
        db.collection("tests")
            .whereEqualTo("status", "published")
            .snapshots()
            .map { snap ->
                val cloud = snap.toObjects(TestSeriesItem::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                cloud.ifEmpty { CgpediaStarterCatalog.defaultTests() }
            }
            .catch { e ->
                if (e is Exception) handleFirestoreError(e, OperationType.LIST, "tests")
                throw e
            }

    fun observeAllTestsForAdmin(): Flow<List<TestSeriesItem>> =
        db.collection("tests")
            .snapshots()
            .map { snap ->
                snap.toObjects(TestSeriesItem::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    .sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
            }
            .catch { e ->
                if (e is Exception) handleFirestoreError(e, OperationType.LIST, "tests")
                throw e
            }

    suspend fun getPublishedQuestionsForTest(testId: String): Result<List<BilingualQuestion>> {
        val path = "questions"
        return try {
            val snap = db.collection("questions")
                .whereEqualTo("testId", testId)
                .whereEqualTo("visibility", "published")
                .get()
                .await()
            val cloud = snap.toObjects(BilingualQuestion::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                .sortedBy { it.orderIndex }
            val result = cloud.ifEmpty {
                CgpediaStarterCatalog.defaultQuestions().filter { it.testId == testId }.sortedBy { it.orderIndex }
            }
            Result.success(result)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.LIST, path)
            Result.failure(e)
        }
    }

    fun observeQuestionsForAdmin(testId: String): Flow<List<BilingualQuestion>> =
        db.collection("questions")
            .whereEqualTo("testId", testId)
            .snapshots()
            .map { snap ->
                snap.toObjects(BilingualQuestion::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    .sortedBy { it.orderIndex }
            }
            .catch { e ->
                if (e is Exception) handleFirestoreError(e, OperationType.LIST, "questions")
                throw e
            }

    suspend fun createDraftTestWithQuestionsAdmin(
        testMeta: TestSeriesItem,
        questions: List<BilingualQuestion>
    ): Result<String> {
        val adminUid = requireUserId()
        val testId = testMeta.id.ifBlank { "test_${UUID.randomUUID().toString().replace("-", "").take(14)}" }
        return try {
            val limitedQuestions = questions.take(testMeta.questionLimit.toInt().coerceIn(1, 100))
            val testDocRef = db.collection("tests").document(testId)
            val draftTest = testMeta.copy(
                id = testId,
                questionCount = limitedQuestions.size.toLong(),
                status = "draft",
                createdBy = adminUid
            )
            testDocRef.set(draftTest.toCreateMap()).await()

            for ((idx, q) in limitedQuestions.withIndex()) {
                val qId = "q_${testId.takeLast(8)}_${idx}_${UUID.randomUUID().toString().replace("-", "").take(6)}"
                val qDoc = q.copy(
                    id = qId,
                    testId = testId,
                    orderIndex = idx.toLong(),
                    visibility = "draft",
                    createdBy = adminUid
                )
                db.collection("questions").document(qId).set(qDoc.toCreateMap()).await()
            }
            Result.success(testId)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, "tests/$testId")
            Result.failure(e)
        }
    }

    suspend fun updateTestSettingsAndStatusAdmin(
        test: TestSeriesItem,
        publishNow: Boolean
    ): Result<Unit> {
        val testRef = db.collection("tests").document(test.id)
        val targetStatus = if (publishNow) "published" else test.status
        return try {
            val qSnap = db.collection("questions")
                .whereEqualTo("testId", test.id)
                .get()
                .await()
            val activeQuestionCount = qSnap.size().toLong().coerceAtMost(test.questionLimit)

            val batch = db.batch()
            batch.update(
                testRef,
                mapOf(
                    "titleHi" to test.titleHi.take(200),
                    "titleEn" to test.titleEn.take(200),
                    "topic" to test.topic.take(200),
                    "difficulty" to test.difficulty,
                    "durationMinutes" to test.durationMinutes.coerceIn(1L, 240L),
                    "questionLimit" to test.questionLimit.coerceIn(1L, 100L),
                    "questionCount" to activeQuestionCount,
                    "marksPerQuestion" to test.marksPerQuestion.coerceIn(0.5, 10.0),
                    "negativeMarking" to test.negativeMarking.coerceIn(0.0, 5.0),
                    "isPaid" to test.isPaid,
                    "priceInr" to (if (test.isPaid) test.priceInr.coerceIn(1L, 50000L) else 0L),
                    "status" to targetStatus,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )

            qSnap.documents.forEach { doc ->
                batch.update(
                    doc.reference,
                    mapOf(
                        "visibility" to targetStatus,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                )
            }
            batch.commit().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, testRef.path)
            Result.failure(e)
        }
    }

    suspend fun saveSingleQuestionAdmin(question: BilingualQuestion, parentTestStatus: String): Result<String> {
        val adminUid = requireUserId()
        val qId = question.id.ifBlank { "q_${UUID.randomUUID().toString().replace("-", "").take(14)}" }
        val docRef = db.collection("questions").document(qId)
        val vis = if (parentTestStatus == "published") "published" else "draft"
        return try {
            val snap = docRef.get().await()
            if (snap.exists()) {
                docRef.update(
                    mapOf(
                        "orderIndex" to question.orderIndex.coerceIn(0L, 99L),
                        "questionHi" to question.questionHi.take(2000),
                        "questionEn" to question.questionEn.take(2000),
                        "optionsHi" to BilingualQuestion.padFourOptions(question.optionsHi),
                        "optionsEn" to BilingualQuestion.padFourOptions(question.optionsEn),
                        "correctOptionIndex" to question.correctOptionIndex.coerceIn(0L, 3L),
                        "explanationHi" to question.explanationHi.take(4000),
                        "explanationEn" to question.explanationEn.take(4000),
                        "subjectTag" to question.subjectTag.take(120),
                        "visibility" to vis,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                docRef.set(
                    question.copy(id = qId, visibility = vis, createdBy = adminUid).toCreateMap()
                ).await()
            }
            Result.success(qId)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, docRef.path)
            Result.failure(e)
        }
    }

    suspend fun deleteQuestionAdmin(questionId: String, testId: String): Result<Unit> {
        val docRef = db.collection("questions").document(questionId)
        return try {
            docRef.delete().await()
            val remaining = db.collection("questions").whereEqualTo("testId", testId).get().await().size().toLong()
            db.collection("tests").document(testId).update(
                mapOf(
                    "questionCount" to remaining.coerceIn(0L, 100L),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, docRef.path)
            Result.failure(e)
        }
    }

    suspend fun deleteTestAdmin(testId: String): Result<Unit> {
        return try {
            val qSnap = db.collection("questions").whereEqualTo("testId", testId).get().await()
            val batch = db.batch()
            qSnap.documents.forEach { batch.delete(it.reference) }
            batch.delete(db.collection("tests").document(testId))
            batch.commit().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, "tests/$testId")
            Result.failure(e)
        }
    }

    // --- 7. Global App Config & Channel Anthem Song Manager ---
    fun observeAppConfig(): Flow<AppConfig> =
        db.collection("app_config")
            .whereEqualTo("configKey", "global")
            .snapshots()
            .map { snap ->
                snap.documents.firstOrNull()
                    ?.toObject(AppConfig::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                    ?: AppConfig()
            }
            .catch { e ->
                if (e is Exception) handleFirestoreError(e, OperationType.LIST, "app_config")
                throw e
            }

    suspend fun uploadAnthemBytesAdmin(
        rawBytes: ByteArray,
        mimeType: String,
        titleHi: String,
        titleEn: String
    ): Result<Unit> {
        val adminUid = requireUserId()
        return try {
            // Maximum ~6 MB (18 chunks x 340 KB raw -> ~455 KB base64 per doc < 600KB limit)
            val maxRawPerChunk = 340 * 1024
            val chunks = rawBytes.asList().chunked(maxRawPerChunk).map { it.toByteArray() }
            require(chunks.isNotEmpty() && chunks.size <= 20) {
                "Anthem file must be under 6.5 MB for direct cloud sync."
            }

            // Clear old chunks first
            val existingChunks = db.collection("anthem_chunks").whereEqualTo("configKey", "global").get().await()
            for (oldDoc in existingChunks.documents) {
                oldDoc.reference.delete().await()
            }

            // Write new chunks sequentially
            for ((index, chunkBytes) in chunks.withIndex()) {
                val b64 = Base64.encodeToString(chunkBytes, Base64.NO_WRAP)
                val chunkDocRef = db.collection("anthem_chunks").document("chunk_$index")
                chunkDocRef.set(
                    mapOf(
                        "chunkIndex" to index.toLong(),
                        "base64Data" to b64,
                        "configKey" to "global",
                        "uploadedBy" to adminUid,
                        "createdAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }

            val existingSnap = db.collection("app_config").document("main").get().await()
            val existingConfig = existingSnap.toObject(AppConfig::class.java) ?: AppConfig()
            saveAppConfigAdmin(
                existingConfig.copy(
                    id = "main",
                    anthemTitleHi = titleHi.ifBlank { existingConfig.anthemTitleHi },
                    anthemTitleEn = titleEn.ifBlank { existingConfig.anthemTitleEn },
                    anthemSourceType = "cloud_chunks",
                    anthemAudioUrl = "",
                    anthemChunkCount = chunks.size.toLong(),
                    anthemMimeType = mimeType.ifBlank { "audio/mpeg" },
                    updatedBy = adminUid
                )
            )
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, "anthem_chunks")
            Result.failure(e)
        }
    }

    suspend fun fetchCloudAnthemBytes(): Result<ByteArray> {
        return try {
            val snap = db.collection("anthem_chunks")
                .whereEqualTo("configKey", "global")
                .get()
                .await()
            val sorted = snap.toObjects(AnthemAudioChunk::class.java)
                .sortedBy { it.chunkIndex }
            val out = java.io.ByteArrayOutputStream()
            for (chunk in sorted) {
                val decoded = Base64.decode(chunk.base64Data, Base64.DEFAULT)
                out.write(decoded)
            }
            Result.success(out.toByteArray())
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.LIST, "anthem_chunks")
            Result.failure(e)
        }
    }

    suspend fun saveAppConfigAdmin(config: AppConfig): Result<Unit> {
        val adminUid = requireUserId()
        val docRef = db.collection("app_config").document("main")
        return try {
            val snap = docRef.get().await()
            if (snap.exists()) {
                docRef.update(
                    mapOf(
                        "anthemTitleHi" to config.anthemTitleHi.ifBlank { "सीजीपीडिया आधिकारिक एंथम" }.take(150),
                        "anthemTitleEn" to config.anthemTitleEn.ifBlank { "CGpedia Official Aspirant Anthem" }.take(150),
                        "anthemSourceType" to config.anthemSourceType.ifBlank { "bundled" },
                        "anthemAudioUrl" to config.anthemAudioUrl.take(1000),
                        "anthemChunkCount" to config.anthemChunkCount.coerceIn(0L, 20L),
                        "anthemMimeType" to config.anthemMimeType.ifBlank { "audio/wav" }.take(60),
                        "telegramChannelUrl" to config.telegramChannelUrl.take(300),
                        "supportEmail" to config.supportEmail.take(120),
                        "whatsappSupportNumber" to config.whatsappSupportNumber.ifBlank { "9238810070" }.take(40),
                        "supportPolicyHi" to config.supportPolicyHi.take(4000),
                        "supportPolicyEn" to config.supportPolicyEn.take(4000),
                        "latestVersionCode" to config.latestVersionCode.coerceIn(1L, 10000L),
                        "latestVersionName" to config.latestVersionName.ifBlank { "2.0.0" }.take(40),
                        "apkDownloadUrl" to config.apkDownloadUrl.ifBlank { "https://t.me/CGpediaOfficial" }.take(1000),
                        "updateNotesHi" to config.updateNotesHi.take(2000),
                        "updateNotesEn" to config.updateNotesEn.take(2000),
                        "updatedBy" to adminUid,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                docRef.set(config.copy(updatedBy = adminUid).toCreateMap()).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, docRef.path)
            Result.failure(e)
        }
    }
}
