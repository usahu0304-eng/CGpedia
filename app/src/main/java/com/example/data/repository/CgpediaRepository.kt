package com.example.data.repository

import android.content.Context
import android.util.Base64
import android.util.Log
import com.example.data.model.AppConfig
import com.example.data.model.BilingualQuestion
import com.example.data.model.BookmarkedQuestion
import com.example.data.model.BroadcastNotification
import com.example.data.model.CurrentAffairItem
import com.example.data.model.ExamFolder
import com.example.data.model.GLOBAL_CONFIG_DOC_ID
import com.example.data.model.OWNER_ADMIN_EMAIL
import com.example.data.model.PurchaseRecord
import com.example.data.model.StudentQuery
import com.example.data.model.SubjectFolder
import com.example.data.model.TestAttempt
import com.example.data.model.TestSeriesItem
import com.example.data.model.UiState
import com.example.data.model.UpcomingTestItem
import com.example.data.model.UserProfile
import com.example.data.seed.CgpediaStarterCatalog
import com.google.firebase.Firebase
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.firestore.firestore
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import org.json.JSONArray
import org.json.JSONObject

class CgpediaRepository(
    private val context: Context? = null,
    private val db: FirebaseFirestore = Firebase.firestore
) {
    constructor(db: FirebaseFirestore) : this(context = null, db = db)

    private val prefs by lazy {
        context?.getSharedPreferences("cgpedia_offline_cache", Context.MODE_PRIVATE)
    }

    private fun logFirestoreFailure(operation: String, path: String, error: Throwable) {
        Log.e("CgpediaRepository", "Firestore $operation failed on $path: ${error.message}", error)
    }

    private fun currentUid(): String? = Firebase.auth.currentUser?.uid

    fun isVerifiedOwnerAdmin(user: FirebaseUser? = Firebase.auth.currentUser): Boolean {
        val email = user?.email?.trim()?.lowercase() ?: return false
        return email == OWNER_ADMIN_EMAIL && user.isEmailVerified
    }

    // =========================================================================
    // 1. User Profile & Student Settings
    // =========================================================================
    suspend fun ensureUserProfile(user: FirebaseUser): Result<UserProfile> = runCatching {
        val uid = user.uid
        val docRef = db.collection("users").document(uid)
        val snap = docRef.get().await()
        val isAdminUser = isVerifiedOwnerAdmin(user)
        val expectedRole = if (isAdminUser) "admin" else "student"

        if (snap.exists()) {
            val existing = snap.toObject(UserProfile::class.java)?.copy(id = snap.id) ?: UserProfile(id = uid, userId = uid)
            if (isAdminUser && existing.role != "admin") {
                val updatedMap = mapOf(
                    "userId" to uid,
                    "displayName" to existing.displayName.ifBlank { user.displayName ?: "CGpedia Admin" }.take(100),
                    "email" to (user.email ?: existing.email).take(160),
                    "phoneNumber" to existing.phoneNumber.take(25),
                    "photoUrl" to existing.photoUrl.take(1200),
                    "targetExam" to existing.targetExam.ifBlank { "CGPSC & CGSSB" }.take(80),
                    "preferredLanguage" to existing.preferredLanguage.takeIf { it in listOf("en", "hi") }.orEmpty().ifBlank { "en" },
                    "darkMode" to existing.darkMode,
                    "notifyCurrentAffairs" to existing.notifyCurrentAffairs,
                    "notifyNewTests" to existing.notifyNewTests,
                    "role" to "admin",
                    "createdAt" to (existing.createdAt ?: Timestamp.now()),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                docRef.set(updatedMap).await()
                return@runCatching existing.copy(role = "admin")
            }
            return@runCatching existing
        } else {
            val now = Timestamp.now()
            val newProfile = UserProfile(
                id = uid,
                userId = uid,
                displayName = (user.displayName ?: "CGPSC Aspirant").ifBlank { "CGPSC Aspirant" }.take(100),
                email = (user.email ?: "").take(160),
                phoneNumber = (user.phoneNumber ?: "").take(25),
                photoUrl = (user.photoUrl?.toString() ?: "").take(1200),
                targetExam = "CGPSC & CGSSB",
                preferredLanguage = "en",
                darkMode = false,
                notifyCurrentAffairs = true,
                notifyNewTests = true,
                role = expectedRole,
                createdAt = now,
                updatedAt = now
            )
            val payload = mapOf(
                "userId" to newProfile.userId,
                "displayName" to newProfile.displayName,
                "email" to newProfile.email,
                "phoneNumber" to newProfile.phoneNumber,
                "photoUrl" to newProfile.photoUrl,
                "targetExam" to newProfile.targetExam,
                "preferredLanguage" to newProfile.preferredLanguage,
                "darkMode" to newProfile.darkMode,
                "notifyCurrentAffairs" to newProfile.notifyCurrentAffairs,
                "notifyNewTests" to newProfile.notifyNewTests,
                "role" to newProfile.role,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(payload).await()
            newProfile
        }
    }.onFailure { e ->
        logFirestoreFailure("ensureUserProfile", "users/${user.uid}", e)
    }

    fun observeUserProfile(uid: String): Flow<UiState<UserProfile>> = callbackFlow {
        trySend(UiState.Loading)
        val reg = db.collection("users").document(uid)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeUserProfile", "users/$uid", err)
                    trySend(UiState.Error(err.localizedMessage ?: "Failed to load profile"))
                    return@addSnapshotListener
                }
                val profile = snap?.toObject(UserProfile::class.java)?.copy(id = snap.id)
                if (profile != null) {
                    trySend(UiState.Success(profile))
                }
            }
        awaitClose { reg.remove() }
    }

    suspend fun updateUserProfile(updated: UserProfile): Result<Unit> = runCatching {
        val uid = currentUid() ?: error("Not signed in")
        val docRef = db.collection("users").document(uid)
        val snap = docRef.get().await()
        val existingCreatedAt = snap.getTimestamp("createdAt") ?: updated.createdAt ?: Timestamp.now()
        val existingRole = snap.getString("role") ?: updated.role.ifBlank { "student" }

        val payload = mapOf(
            "userId" to uid,
            "displayName" to updated.displayName.trim().ifBlank { "CGPSC Aspirant" }.take(100),
            "email" to updated.email.trim().take(160),
            "phoneNumber" to updated.phoneNumber.trim().take(25),
            "photoUrl" to updated.photoUrl.trim().take(1200),
            "targetExam" to updated.targetExam.trim().ifBlank { "CGPSC & CGSSB" }.take(80),
            "preferredLanguage" to (if (updated.preferredLanguage == "hi") "hi" else "en"),
            "darkMode" to updated.darkMode,
            "notifyCurrentAffairs" to updated.notifyCurrentAffairs,
            "notifyNewTests" to updated.notifyNewTests,
            "role" to existingRole,
            "createdAt" to existingCreatedAt,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        docRef.set(payload).await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("updateUserProfile", "users/${updated.userId}", e)
    }

    // =========================================================================
    // 2. Global App Config & Channel Anthem Audio Chunks
    // =========================================================================
    fun observeAppConfig(): Flow<AppConfig> = callbackFlow {
        val reg = db.collection("app_config").document(GLOBAL_CONFIG_DOC_ID)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeAppConfig", "app_config/global", err)
                    trySend(AppConfig())
                    return@addSnapshotListener
                }
                val cfg = snap?.toObject(AppConfig::class.java)?.copy(id = snap.id) ?: AppConfig()
                trySend(cfg)
            }
        awaitClose { reg.remove() }
    }

    suspend fun saveAppConfigAdmin(config: AppConfig): Result<Unit> = runCatching {
        val uid = currentUid() ?: error("Admin authentication required")
        val docRef = db.collection("app_config").document(GLOBAL_CONFIG_DOC_ID)
        val snap = docRef.get().await()
        val createdAtVal = snap.getTimestamp("createdAt") ?: Timestamp.now()

        val payload = mapOf(
            "configKey" to "global",
            "anthemTitleHi" to config.anthemTitleHi.trim().ifBlank { "सीजीपीडिया चैनल एंथम" }.take(160),
            "anthemTitleEn" to config.anthemTitleEn.trim().ifBlank { "CGpedia Official Channel Anthem" }.take(160),
            "anthemSourceType" to config.anthemSourceType.takeIf { it in listOf("bundled", "url", "cloud_chunks") }.orEmpty().ifBlank { "bundled" },
            "anthemAudioUrl" to config.anthemAudioUrl.trim().take(1200),
            "anthemChunkCount" to config.anthemChunkCount.coerceIn(0L, 25L),
            "anthemMimeType" to config.anthemMimeType.ifBlank { "audio/mpeg" }.take(80),
            "telegramChannelUrl" to config.telegramChannelUrl.trim().take(500),
            "supportEmail" to config.supportEmail.trim().ifBlank { OWNER_ADMIN_EMAIL }.take(160),
            "whatsappSupportNumber" to config.whatsappSupportNumber.trim().ifBlank { "9238810070" }.take(40),
            "supportPolicyHi" to config.supportPolicyHi.trim().ifBlank {
                "भुगतान, टेस्ट सीरीज अनलॉक या तकनीकी सहायता के लिए कृपया हमारे आधिकारिक व्हाट्सएप नंबर 9238810070 पर संपर्क करें।"
            }.take(4000),
            "supportPolicyEn" to config.supportPolicyEn.trim().ifBlank {
                "For test series activation, payment receipts, or technical help, message our official WhatsApp support at 9238810070."
            }.take(4000),
            "latestVersionCode" to config.latestVersionCode.coerceIn(1L, 100000L),
            "latestVersionName" to config.latestVersionName.trim().ifBlank { "2.0.0" }.take(40),
            "apkDownloadUrl" to config.apkDownloadUrl.trim().take(1200),
            "updateNotesHi" to config.updateNotesHi.trim().take(2000),
            "updateNotesEn" to config.updateNotesEn.trim().take(2000),
            "updatedBy" to uid,
            "createdAt" to createdAtVal,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        docRef.set(payload).await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("saveAppConfigAdmin", "app_config/global", e)
    }

    suspend fun uploadCustomAnthemAudioAdmin(
        rawBytes: ByteArray,
        mimeType: String,
        titleHi: String,
        titleEn: String
    ): Result<Int> = runCatching {
        val uid = currentUid() ?: error("Admin authentication required")
        val chunkByteSize = 350_000
        val chunks = rawBytes.toList().chunked(chunkByteSize).take(20)
        if (chunks.isEmpty()) error("Selected audio file is empty")

        val total = chunks.size
        chunks.forEachIndexed { idx, byteList ->
            val b64 = Base64.encodeToString(byteList.toByteArray(), Base64.NO_WRAP)
            val chunkPayload = mapOf(
                "chunkIndex" to idx.toLong(),
                "totalChunks" to total.toLong(),
                "base64Data" to b64,
                "updatedBy" to uid,
                "updatedAt" to FieldValue.serverTimestamp()
            )
            db.collection("anthem_chunks").document("chunk_$idx").set(chunkPayload).await()
        }

        val currentSnap = db.collection("app_config").document(GLOBAL_CONFIG_DOC_ID).get().await()
        val existingConfig = currentSnap.toObject(AppConfig::class.java) ?: AppConfig()
        saveAppConfigAdmin(
            existingConfig.copy(
                anthemTitleHi = titleHi.ifBlank { existingConfig.anthemTitleHi },
                anthemTitleEn = titleEn.ifBlank { existingConfig.anthemTitleEn },
                anthemSourceType = "cloud_chunks",
                anthemAudioUrl = "",
                anthemChunkCount = total.toLong(),
                anthemMimeType = mimeType.ifBlank { "audio/mpeg" }
            )
        ).getOrThrow()
        total
    }.onFailure { e ->
        logFirestoreFailure("uploadCustomAnthemAudioAdmin", "anthem_chunks", e)
    }

    suspend fun fetchCloudAnthemAudioBytes(chunkCount: Int): Result<ByteArray> = runCatching {
        val count = chunkCount.coerceIn(1, 25)
        val output = ArrayList<Byte>()
        for (idx in 0 until count) {
            val doc = db.collection("anthem_chunks").document("chunk_$idx").get().await()
            val b64 = doc.getString("base64Data").orEmpty()
            if (b64.isNotBlank()) {
                val decoded = Base64.decode(b64, Base64.DEFAULT)
                output.addAll(decoded.toList())
            }
        }
        output.toByteArray()
    }.onFailure { e ->
        logFirestoreFailure("fetchCloudAnthemAudioBytes", "anthem_chunks", e)
    }

    // =========================================================================
    // 3. Exam-Wise & Subject-Wise Folders
    // =========================================================================
    fun observeExamFolders(): Flow<UiState<List<ExamFolder>>> = callbackFlow {
        trySend(UiState.Loading)
        val reg = db.collection("exam_folders")
            .whereEqualTo("visibility", "published")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeExamFolders", "exam_folders", err)
                    trySend(UiState.Success(CgpediaStarterCatalog.defaultExamFolders()))
                    return@addSnapshotListener
                }
                val items = snap?.documents?.mapNotNull { d ->
                    d.toObject(ExamFolder::class.java)?.copy(id = d.id)
                }?.sortedBy { it.sortOrder }.orEmpty()
                trySend(
                    UiState.Success(
                        if (items.isNotEmpty()) items else CgpediaStarterCatalog.defaultExamFolders()
                    )
                )
            }
        awaitClose { reg.remove() }
    }

    fun observeSubjectFolders(): Flow<UiState<List<SubjectFolder>>> = callbackFlow {
        trySend(UiState.Loading)
        val reg = db.collection("subject_folders")
            .whereEqualTo("visibility", "published")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeSubjectFolders", "subject_folders", err)
                    trySend(UiState.Success(CgpediaStarterCatalog.defaultSubjectFolders()))
                    return@addSnapshotListener
                }
                val items = snap?.documents?.mapNotNull { d ->
                    d.toObject(SubjectFolder::class.java)?.copy(id = d.id)
                }?.sortedBy { it.sortOrder }.orEmpty()
                trySend(
                    UiState.Success(
                        if (items.isNotEmpty()) items else CgpediaStarterCatalog.defaultSubjectFolders()
                    )
                )
            }
        awaitClose { reg.remove() }
    }

    suspend fun saveExamFolderAdmin(folder: ExamFolder): Result<Unit> = runCatching {
        val uid = currentUid() ?: error("Admin authentication required")
        val docId = folder.id.ifBlank { "exam_${System.currentTimeMillis()}" }
        val docRef = db.collection("exam_folders").document(docId)
        val snap = docRef.get().await()
        val createdAtVal = snap.getTimestamp("createdAt") ?: Timestamp.now()

        val payload = mapOf(
            "titleHi" to folder.titleHi.trim().take(160),
            "titleEn" to folder.titleEn.trim().take(160),
            "descriptionHi" to folder.descriptionHi.trim().ifBlank { folder.titleHi }.take(600),
            "descriptionEn" to folder.descriptionEn.trim().ifBlank { folder.titleEn }.take(600),
            "examCode" to folder.examCode.trim().ifBlank { "CGPSC" }.take(50),
            "sortOrder" to folder.sortOrder.coerceIn(0L, 1000L),
            "isFreeFolder" to folder.isFreeFolder,
            "priceInr" to (if (folder.isFreeFolder) 0L else folder.priceInr.coerceIn(1L, 50000L)),
            "validityDays" to folder.validityDays.coerceIn(1L, 3650L),
            "testCount" to folder.testCount.coerceAtLeast(0L),
            "visibility" to folder.visibility.takeIf { it in listOf("published", "archived") }.orEmpty().ifBlank { "published" },
            "createdBy" to uid,
            "createdAt" to createdAtVal,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        docRef.set(payload).await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("saveExamFolderAdmin", "exam_folders/${folder.id}", e)
    }

    suspend fun deleteExamFolderAdmin(folderId: String): Result<Unit> = runCatching {
        db.collection("exam_folders").document(folderId).delete().await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("deleteExamFolderAdmin", "exam_folders/$folderId", e)
    }

    suspend fun saveSubjectFolderAdmin(folder: SubjectFolder): Result<Unit> = runCatching {
        val uid = currentUid() ?: error("Admin authentication required")
        val docId = folder.id.ifBlank { "subj_${System.currentTimeMillis()}" }
        val docRef = db.collection("subject_folders").document(docId)
        val snap = docRef.get().await()
        val createdAtVal = snap.getTimestamp("createdAt") ?: Timestamp.now()

        val payload = mapOf(
            "titleHi" to folder.titleHi.trim().take(160),
            "titleEn" to folder.titleEn.trim().take(160),
            "descriptionHi" to folder.descriptionHi.trim().ifBlank { folder.titleHi }.take(600),
            "descriptionEn" to folder.descriptionEn.trim().ifBlank { folder.titleEn }.take(600),
            "subjectCode" to folder.subjectCode.trim().ifBlank { "CG_GS" }.take(50),
            "sortOrder" to folder.sortOrder.coerceIn(0L, 1000L),
            "isFreeFolder" to folder.isFreeFolder,
            "priceInr" to (if (folder.isFreeFolder) 0L else folder.priceInr.coerceIn(1L, 50000L)),
            "validityDays" to folder.validityDays.coerceIn(1L, 3650L),
            "testCount" to folder.testCount.coerceAtLeast(0L),
            "visibility" to folder.visibility.takeIf { it in listOf("published", "archived") }.orEmpty().ifBlank { "published" },
            "createdBy" to uid,
            "createdAt" to createdAtVal,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        docRef.set(payload).await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("saveSubjectFolderAdmin", "subject_folders/${folder.id}", e)
    }

    suspend fun deleteSubjectFolderAdmin(folderId: String): Result<Unit> = runCatching {
        db.collection("subject_folders").document(folderId).delete().await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("deleteSubjectFolderAdmin", "subject_folders/$folderId", e)
    }

    // =========================================================================
    // 4. Tests & Bilingual Questions (Student Published Feed + Admin Draft/Published)
    // =========================================================================
    fun observePublishedTests(): Flow<UiState<List<TestSeriesItem>>> = callbackFlow {
        trySend(UiState.Loading)
        val reg = db.collection("tests")
            .whereEqualTo("status", "published")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observePublishedTests", "tests?status=published", err)
                    trySend(UiState.Success(CgpediaStarterCatalog.defaultTests()))
                    return@addSnapshotListener
                }
                val items = snap?.documents?.mapNotNull { d ->
                    d.toObject(TestSeriesItem::class.java)?.copy(id = d.id)
                }?.sortedByDescending { it.createdAt?.seconds ?: 0L }.orEmpty()
                trySend(
                    UiState.Success(
                        if (items.isNotEmpty()) items else CgpediaStarterCatalog.defaultTests()
                    )
                )
            }
        awaitClose { reg.remove() }
    }

    fun observeAllTestsForAdmin(): Flow<UiState<List<TestSeriesItem>>> = callbackFlow {
        trySend(UiState.Loading)
        val reg = db.collection("tests")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeAllTestsForAdmin", "tests", err)
                    trySend(UiState.Error(err.localizedMessage ?: "Failed to load admin tests"))
                    return@addSnapshotListener
                }
                val items = snap?.documents?.mapNotNull { d ->
                    d.toObject(TestSeriesItem::class.java)?.copy(id = d.id)
                }?.sortedByDescending { it.updatedAt?.seconds ?: 0L }.orEmpty()
                trySend(UiState.Success(items))
            }
        awaitClose { reg.remove() }
    }

    suspend fun getPublishedQuestionsForTest(testId: String): Result<List<BilingualQuestion>> = runCatching {
        val snap = db.collection("tests").document(testId)
            .collection("questions")
            .whereEqualTo("visibility", "published")
            .get()
            .await()

        val cloudQuestions = snap.documents.mapNotNull { d ->
            d.toObject(BilingualQuestion::class.java)?.copy(id = d.id)
        }.sortedBy { it.orderIndex }

        if (cloudQuestions.isNotEmpty()) {
            cloudQuestions
        } else {
            CgpediaStarterCatalog.defaultQuestions().filter { it.testId == testId }.sortedBy { it.orderIndex }
        }
    }.onFailure { e ->
        logFirestoreFailure("getPublishedQuestionsForTest", "tests/$testId/questions", e)
    }

    suspend fun getAllQuestionsForTestAdmin(testId: String): Result<List<BilingualQuestion>> = runCatching {
        val snap = db.collection("tests").document(testId)
            .collection("questions")
            .get()
            .await()

        snap.documents.mapNotNull { d ->
            d.toObject(BilingualQuestion::class.java)?.copy(id = d.id)
        }.sortedBy { it.orderIndex }
    }.onFailure { e ->
        logFirestoreFailure("getAllQuestionsForTestAdmin", "tests/$testId/questions", e)
    }

    /**
     * Creates a brand-new manual test from scratch inside an Exam or Subject folder (without AI)
     * with an initial editable Bilingual MCQ so the Admin can customize questions manually.
     */
    suspend fun createManualTestAdmin(testMeta: TestSeriesItem): Result<String> = runCatching {
        val uid = currentUid() ?: error("Admin authentication required")
        val testId = testMeta.id.ifBlank { "test_manual_${System.currentTimeMillis()}" }
        val testRef = db.collection("tests").document(testId)

        val starterQuestion = BilingualQuestion(
            id = "${testId}_q_1",
            testId = testId,
            orderIndex = 0L,
            questionHi = "यहाँ अपना हिंदी (देवनागरी) प्रश्न लिखें...",
            questionEn = "Enter your English question text here...",
            optionsHi = listOf("विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"),
            optionsEn = listOf("Option A", "Option B", "Option C", "Option D"),
            correctOptionIndex = 0L,
            explanationHi = "सही उत्तर की हिंदी व्याख्या...",
            explanationEn = "Detailed explanation in English...",
            subjectTag = testMeta.topic.ifBlank { "CGPSC & CGSSB" }.take(100),
            visibility = testMeta.status.takeIf { it in listOf("draft", "published") } ?: "draft",
            createdBy = uid
        )

        val testPayload = mapOf(
            "folderType" to testMeta.folderType.takeIf { it in listOf("exam", "subject") }.orEmpty().ifBlank { "exam" },
            "folderId" to testMeta.folderId.trim().take(100),
            "titleHi" to testMeta.titleHi.trim().take(200),
            "titleEn" to testMeta.titleEn.trim().take(200),
            "topic" to testMeta.topic.trim().ifBlank { testMeta.titleEn }.take(300),
            "difficulty" to testMeta.difficulty.takeIf { it in listOf("Easy", "Moderate", "Hard", "CGPSC_Level") }.orEmpty().ifBlank { "CGPSC_Level" },
            "durationMinutes" to testMeta.durationMinutes.coerceIn(1L, 240L),
            "questionLimit" to testMeta.questionLimit.coerceIn(1L, 100L),
            "questionCount" to 1L,
            "marksPerQuestion" to testMeta.marksPerQuestion.coerceIn(0.5, 10.0),
            "negativeMarking" to testMeta.negativeMarking.coerceIn(0.0, 5.0),
            "isPaid" to testMeta.isPaid,
            "priceInr" to (if (testMeta.isPaid) testMeta.priceInr.coerceIn(1L, 50000L) else 0L),
            "validityDays" to testMeta.validityDays.coerceIn(1L, 3650L),
            "status" to (testMeta.status.takeIf { it in listOf("draft", "published", "archived") } ?: "draft"),
            "createdBy" to uid,
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        testRef.set(testPayload).await()
        saveQuestionAdmin(testId, starterQuestion).getOrThrow()
        testId
    }.onFailure { e ->
        logFirestoreFailure("createManualTestAdmin", "tests/${testMeta.id}", e)
    }

    suspend fun createDraftTestWithQuestionsAdmin(
        testMeta: TestSeriesItem,
        questions: List<BilingualQuestion>
    ): Result<String> = runCatching {
        val uid = currentUid() ?: error("Admin authentication required")
        val testId = testMeta.id.ifBlank { "test_${System.currentTimeMillis()}" }
        val testRef = db.collection("tests").document(testId)

        val testPayload = mapOf(
            "folderType" to testMeta.folderType.takeIf { it in listOf("exam", "subject") }.orEmpty().ifBlank { "exam" },
            "folderId" to testMeta.folderId.trim().take(100),
            "titleHi" to testMeta.titleHi.trim().take(200),
            "titleEn" to testMeta.titleEn.trim().take(200),
            "topic" to testMeta.topic.trim().take(300),
            "difficulty" to testMeta.difficulty.takeIf { it in listOf("Easy", "Moderate", "Hard", "CGPSC_Level") }.orEmpty().ifBlank { "CGPSC_Level" },
            "durationMinutes" to testMeta.durationMinutes.coerceIn(1L, 240L),
            "questionLimit" to testMeta.questionLimit.coerceIn(1L, 100L),
            "questionCount" to questions.size.coerceIn(0, 100).toLong(),
            "marksPerQuestion" to testMeta.marksPerQuestion.coerceIn(0.5, 10.0),
            "negativeMarking" to testMeta.negativeMarking.coerceIn(0.0, 5.0),
            "isPaid" to testMeta.isPaid,
            "priceInr" to (if (testMeta.isPaid) testMeta.priceInr.coerceIn(1L, 50000L) else 0L),
            "validityDays" to testMeta.validityDays.coerceIn(1L, 3650L),
            "status" to "draft",
            "createdBy" to uid,
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        testRef.set(testPayload).await()

        questions.take(100).forEachIndexed { idx, q ->
            val qId = q.id.ifBlank { "${testId}_q_${idx + 1}" }
            val qRef = testRef.collection("questions").document(qId)
            val qPayload = mapOf(
                "testId" to testId,
                "orderIndex" to idx.toLong(),
                "questionHi" to q.questionHi.trim().take(2500),
                "questionEn" to q.questionEn.trim().take(2500),
                "optionsHi" to q.optionsHi.take(4).let { if (it.size == 4) it else it + List(4 - it.size) { "विकल्प" } },
                "optionsEn" to q.optionsEn.take(4).let { if (it.size == 4) it else it + List(4 - it.size) { "Option" } },
                "correctOptionIndex" to q.correctOptionIndex.coerceIn(0L, 3L),
                "explanationHi" to q.explanationHi.trim().take(4000),
                "explanationEn" to q.explanationEn.trim().take(4000),
                "subjectTag" to q.subjectTag.trim().ifBlank { testMeta.topic }.take(100),
                "visibility" to "draft",
                "createdBy" to uid,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            qRef.set(qPayload).await()
        }
        testId
    }.onFailure { e ->
        logFirestoreFailure("createDraftTestWithQuestionsAdmin", "tests/${testMeta.id}", e)
    }

    suspend fun saveQuestionAdmin(testId: String, question: BilingualQuestion): Result<Unit> = runCatching {
        val uid = currentUid() ?: error("Admin authentication required")
        val qId = question.id.ifBlank { "${testId}_q_${System.currentTimeMillis()}" }
        val qRef = db.collection("tests").document(testId).collection("questions").document(qId)
        val snap = qRef.get().await()
        val createdAtVal = snap.getTimestamp("createdAt") ?: Timestamp.now()

        val payload = mapOf(
            "testId" to testId,
            "orderIndex" to question.orderIndex.coerceIn(0L, 99L),
            "questionHi" to question.questionHi.trim().ifBlank { "प्रश्न" }.take(2500),
            "questionEn" to question.questionEn.trim().ifBlank { "Question" }.take(2500),
            "optionsHi" to question.optionsHi.take(4).let { if (it.size == 4) it else it + List(4 - it.size) { "विकल्प" } },
            "optionsEn" to question.optionsEn.take(4).let { if (it.size == 4) it else it + List(4 - it.size) { "Option" } },
            "correctOptionIndex" to question.correctOptionIndex.coerceIn(0L, 3L),
            "explanationHi" to question.explanationHi.trim().take(4000),
            "explanationEn" to question.explanationEn.trim().take(4000),
            "subjectTag" to question.subjectTag.trim().ifBlank { "General Studies" }.take(100),
            "visibility" to question.visibility.takeIf { it in listOf("draft", "published") }.orEmpty().ifBlank { "draft" },
            "createdBy" to uid,
            "createdAt" to createdAtVal,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        qRef.set(payload).await()
        recountTestQuestionsAdmin(testId)
    }.onFailure { e ->
        logFirestoreFailure("saveQuestionAdmin", "tests/$testId/questions/${question.id}", e)
    }

    suspend fun deleteQuestionAdmin(testId: String, questionId: String): Result<Unit> = runCatching {
        db.collection("tests").document(testId).collection("questions").document(questionId).delete().await()
        recountTestQuestionsAdmin(testId)
    }.onFailure { e ->
        logFirestoreFailure("deleteQuestionAdmin", "tests/$testId/questions/$questionId", e)
    }

    private suspend fun recountTestQuestionsAdmin(testId: String) {
        val testRef = db.collection("tests").document(testId)
        val qSnap = testRef.collection("questions").get().await()
        val count = qSnap.size().toLong().coerceIn(0L, 100L)
        testRef.update(
            mapOf(
                "questionCount" to count,
                "updatedAt" to FieldValue.serverTimestamp()
            )
        ).await()
    }

    suspend fun updateTestMetadataAdmin(test: TestSeriesItem): Result<Unit> = runCatching {
        val testRef = db.collection("tests").document(test.id)
        testRef.update(
            mapOf(
                "titleHi" to test.titleHi.trim().take(200),
                "titleEn" to test.titleEn.trim().take(200),
                "topic" to test.topic.trim().ifBlank { test.titleEn }.take(300),
                "durationMinutes" to test.durationMinutes.coerceIn(1L, 240L),
                "questionLimit" to test.questionLimit.coerceIn(1L, 100L),
                "marksPerQuestion" to test.marksPerQuestion.coerceIn(0.5, 10.0),
                "negativeMarking" to test.negativeMarking.coerceIn(0.0, 5.0),
                "isPaid" to test.isPaid,
                "priceInr" to (if (test.isPaid) test.priceInr.coerceIn(1L, 50000L) else 0L),
                "validityDays" to test.validityDays.coerceIn(1L, 3650L),
                "status" to test.status.takeIf { it in listOf("draft", "published", "archived") }.orEmpty().ifBlank { "draft" },
                "updatedAt" to FieldValue.serverTimestamp()
            )
        ).await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("updateTestMetadataAdmin", "tests/${test.id}", e)
    }

    suspend fun publishTestAndQuestionsAdmin(testId: String): Result<Unit> = runCatching {
        val testRef = db.collection("tests").document(testId)
        val qSnap = testRef.collection("questions").get().await()
        val batch = db.batch()
        qSnap.documents.forEach { doc ->
            batch.update(
                doc.reference,
                mapOf(
                    "visibility" to "published",
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
        }
        batch.update(
            testRef,
            mapOf(
                "status" to "published",
                "questionCount" to qSnap.size().toLong().coerceIn(0L, 100L),
                "updatedAt" to FieldValue.serverTimestamp()
            )
        )
        batch.commit().await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("publishTestAndQuestionsAdmin", "tests/$testId", e)
    }

    suspend fun deleteTestAdmin(testId: String): Result<Unit> = runCatching {
        val testRef = db.collection("tests").document(testId)
        val qSnap = testRef.collection("questions").get().await()
        qSnap.documents.forEach { it.reference.delete().await() }
        testRef.delete().await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("deleteTestAdmin", "tests/$testId", e)
    }

    // =========================================================================
    // 5. Bilingual Current Affairs (Chhattisgarh, National, International)
    // =========================================================================
    fun observeCurrentAffairs(): Flow<UiState<List<CurrentAffairItem>>> = callbackFlow {
        trySend(UiState.Loading)
        val reg = db.collection("current_affairs")
            .whereEqualTo("visibility", "published")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeCurrentAffairs", "current_affairs?visibility=published", err)
                    trySend(UiState.Success(CgpediaStarterCatalog.defaultCurrentAffairs()))
                    return@addSnapshotListener
                }
                val items = snap?.documents?.mapNotNull { d ->
                    d.toObject(CurrentAffairItem::class.java)?.copy(id = d.id)
                }?.sortedByDescending { it.dateLabel + "_" + (it.createdAt?.seconds ?: 0L) }.orEmpty()

                trySend(
                    UiState.Success(
                        if (items.isNotEmpty()) items else CgpediaStarterCatalog.defaultCurrentAffairs()
                    )
                )
            }
        awaitClose { reg.remove() }
    }

    suspend fun saveCurrentAffairsBatch(items: List<CurrentAffairItem>): Result<Int> = runCatching {
        val uid = currentUid() ?: error("Sign in required to sync Current Affairs")
        val isAdminUser = isVerifiedOwnerAdmin()
        var saved = 0
        for (item in items) {
            val docId = item.id.ifBlank { "ca_${System.currentTimeMillis()}_${saved}_${uid.take(6)}" }
            val docRef = db.collection("current_affairs").document(docId)
            val createdAtVal: Any = if (isAdminUser) {
                val snap = runCatching { docRef.get().await() }.getOrNull()
                if (snap != null && snap.exists()) (snap.getTimestamp("createdAt") ?: Timestamp.now()) else FieldValue.serverTimestamp()
            } else {
                FieldValue.serverTimestamp()
            }
            val payload = mapOf(
                "category" to item.category.takeIf { it in listOf("chhattisgarh", "national", "international") }.orEmpty().ifBlank { "chhattisgarh" },
                "headlineHi" to item.headlineHi.trim().ifBlank { "समसामयिकी अपडेट" }.take(350),
                "headlineEn" to item.headlineEn.trim().ifBlank { "Current Affairs Update" }.take(350),
                "summaryHi" to item.summaryHi.trim().ifBlank { item.headlineHi }.take(4500),
                "summaryEn" to item.summaryEn.trim().ifBlank { item.headlineEn }.take(4500),
                "examKeyPointsHi" to item.examKeyPointsHi.take(10).ifEmpty { listOf("महत्वपूर्ण तथ्य") },
                "examKeyPointsEn" to item.examKeyPointsEn.take(10).ifEmpty { listOf("Key exam takeaway") },
                "sourceName" to item.sourceName.trim().ifBlank { "PIB / DPR Chhattisgarh" }.take(160),
                "sourceUrl" to item.sourceUrl.trim().take(1200),
                "dateLabel" to item.dateLabel.trim().ifBlank { "2026-03-01" }.take(40),
                "visibility" to "published",
                "sourceModule" to (if (isAdminUser && item.sourceModule == "admin_curated") "admin_curated" else "ai_grounded"),
                "authorUid" to uid,
                "createdAt" to createdAtVal,
                "updatedAt" to FieldValue.serverTimestamp()
            )
            runCatching {
                docRef.set(payload).await()
                saved++
            }.onFailure { err ->
                if (isAdminUser || items.size == 1) throw err
            }
        }
        saved
    }.onFailure { e ->
        logFirestoreFailure("saveCurrentAffairsBatch", "current_affairs", e)
    }

    suspend fun deleteCurrentAffairAdmin(articleId: String): Result<Unit> = runCatching {
        db.collection("current_affairs").document(articleId).delete().await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("deleteCurrentAffairAdmin", "current_affairs/$articleId", e)
    }

    // =========================================================================
    // 6. Admin Broadcast Notifications (Rich Media + Pin) & Upcoming Tests
    // =========================================================================
    fun observePublishedNotifications(): Flow<List<BroadcastNotification>> = callbackFlow {
        val reg = db.collection("broadcast_notifications")
            .whereEqualTo("visibility", "published")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observePublishedNotifications", "broadcast_notifications", err)
                    trySend(CgpediaStarterCatalog.defaultBroadcastNotifications())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { d ->
                    d.toObject(BroadcastNotification::class.java)?.copy(id = d.id)
                }?.sortedWith(
                    compareByDescending<BroadcastNotification> { it.isPinned }
                        .thenByDescending { it.createdAt?.seconds ?: 0L }
                ).orEmpty()
                trySend(
                    if (list.isNotEmpty()) list else CgpediaStarterCatalog.defaultBroadcastNotifications()
                )
            }
        awaitClose { reg.remove() }
    }

    suspend fun saveBroadcastNotificationAdmin(notification: BroadcastNotification): Result<Unit> = runCatching {
        val uid = currentUid() ?: error("Admin authentication required")
        val docId = notification.id.ifBlank { "notif_${System.currentTimeMillis()}" }
        val docRef = db.collection("broadcast_notifications").document(docId)
        val snap = docRef.get().await()
        val createdAtVal = snap.getTimestamp("createdAt") ?: Timestamp.now()

        val payload = mapOf(
            "titleHi" to notification.titleHi.trim().ifBlank { "महत्वपूर्ण सूचना" }.take(250),
            "titleEn" to notification.titleEn.trim().ifBlank { "Important Notification" }.take(250),
            "messageHi" to notification.messageHi.trim().ifBlank { notification.titleHi }.take(5000),
            "messageEn" to notification.messageEn.trim().ifBlank { notification.titleEn }.take(5000),
            "mediaType" to notification.mediaType.takeIf { it in listOf("none", "image", "pdf", "audio", "video") }.orEmpty().ifBlank { "none" },
            "mediaUrl" to notification.mediaUrl.trim().take(2000),
            "mediaTitle" to notification.mediaTitle.trim().take(250),
            "isPinned" to notification.isPinned,
            "visibility" to notification.visibility.takeIf { it in listOf("published", "archived") }.orEmpty().ifBlank { "published" },
            "createdBy" to uid,
            "createdAt" to createdAtVal,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        docRef.set(payload).await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("saveBroadcastNotificationAdmin", "broadcast_notifications/${notification.id}", e)
    }

    suspend fun togglePinNotificationAdmin(notification: BroadcastNotification): Result<Unit> = runCatching {
        saveBroadcastNotificationAdmin(notification.copy(isPinned = !notification.isPinned)).getOrThrow()
    }

    suspend fun deleteBroadcastNotificationAdmin(notificationId: String): Result<Unit> = runCatching {
        db.collection("broadcast_notifications").document(notificationId).delete().await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("deleteBroadcastNotificationAdmin", "broadcast_notifications/$notificationId", e)
    }

    fun observeUpcomingTests(): Flow<List<UpcomingTestItem>> = callbackFlow {
        val reg = db.collection("upcoming_tests")
            .whereEqualTo("visibility", "published")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeUpcomingTests", "upcoming_tests", err)
                    trySend(CgpediaStarterCatalog.defaultUpcomingTests())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { d ->
                    d.toObject(UpcomingTestItem::class.java)?.copy(id = d.id)
                }?.sortedByDescending { it.createdAt?.seconds ?: 0L }.orEmpty()
                trySend(
                    if (list.isNotEmpty()) list else CgpediaStarterCatalog.defaultUpcomingTests()
                )
            }
        awaitClose { reg.remove() }
    }

    suspend fun saveUpcomingTestAdmin(item: UpcomingTestItem): Result<Unit> = runCatching {
        val uid = currentUid() ?: error("Admin authentication required")
        val docId = item.id.ifBlank { "upcoming_${System.currentTimeMillis()}" }
        val docRef = db.collection("upcoming_tests").document(docId)
        val snap = docRef.get().await()
        val createdAtVal = snap.getTimestamp("createdAt") ?: Timestamp.now()

        val payload = mapOf(
            "titleHi" to item.titleHi.trim().ifBlank { "आगामी टेस्ट सीरीज" }.take(250),
            "titleEn" to item.titleEn.trim().ifBlank { "Upcoming Test Series" }.take(250),
            "examCategory" to item.examCategory.trim().ifBlank { "CGPSC & CGSSB" }.take(120),
            "scheduledDateLabel" to item.scheduledDateLabel.trim().ifBlank { "Coming Soon" }.take(100),
            "syllabusSummaryHi" to item.syllabusSummaryHi.trim().ifBlank { item.titleHi }.take(3000),
            "syllabusSummaryEn" to item.syllabusSummaryEn.trim().ifBlank { item.titleEn }.take(3000),
            "isPaid" to item.isPaid,
            "priceInr" to (if (item.isPaid) item.priceInr.coerceIn(1L, 50000L) else 0L),
            "validityDays" to item.validityDays.coerceIn(1L, 3650L),
            "visibility" to item.visibility.takeIf { it in listOf("published", "archived") }.orEmpty().ifBlank { "published" },
            "createdBy" to uid,
            "createdAt" to createdAtVal,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        docRef.set(payload).await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("saveUpcomingTestAdmin", "upcoming_tests/${item.id}", e)
    }

    suspend fun deleteUpcomingTestAdmin(upcomingId: String): Result<Unit> = runCatching {
        db.collection("upcoming_tests").document(upcomingId).delete().await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("deleteUpcomingTestAdmin", "upcoming_tests/$upcomingId", e)
    }

    // =========================================================================
    // 7. Private Student Query / Support Section (Strictly Isolated to Student & Admin)
    // =========================================================================
    fun observeMyQueries(uid: String): Flow<List<StudentQuery>> = callbackFlow {
        val reg = db.collection("student_queries")
            .whereEqualTo("userId", uid)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeMyQueries", "student_queries?userId=$uid", err)
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { d ->
                    d.toObject(StudentQuery::class.java)?.copy(id = d.id)
                }?.sortedByDescending { it.createdAt?.seconds ?: 0L }.orEmpty()
                trySend(list)
            }
        awaitClose { reg.remove() }
    }

    fun observeAllQueriesForAdmin(): Flow<List<StudentQuery>> = callbackFlow {
        val reg = db.collection("student_queries")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeAllQueriesForAdmin", "student_queries", err)
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { d ->
                    d.toObject(StudentQuery::class.java)?.copy(id = d.id)
                }?.sortedWith(
                    compareBy<StudentQuery> { it.status == "resolved" }
                        .thenByDescending { it.createdAt?.seconds ?: 0L }
                ).orEmpty()
                trySend(list)
            }
        awaitClose { reg.remove() }
    }

    suspend fun submitStudentQuery(
        studentName: String,
        studentEmail: String,
        category: String,
        subject: String,
        message: String
    ): Result<Unit> = runCatching {
        val uid = currentUid() ?: error("Not signed in")
        val docId = "query_${uid.take(8)}_${System.currentTimeMillis()}"
        val payload = mapOf(
            "userId" to uid,
            "studentName" to studentName.trim().ifBlank { "CGpedia Student" }.take(120),
            "studentEmail" to studentEmail.trim().take(160),
            "category" to category.takeIf { it in listOf("doubt", "payment", "technical") }.orEmpty().ifBlank { "doubt" },
            "subject" to subject.trim().ifBlank { "Student Support Query" }.take(250),
            "message" to message.trim().take(4000),
            "adminReply" to "",
            "status" to "open",
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        db.collection("student_queries").document(docId).set(payload).await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("submitStudentQuery", "student_queries", e)
    }

    suspend fun replyToStudentQueryAdmin(
        query: StudentQuery,
        adminReplyText: String,
        markResolved: Boolean = true
    ): Result<Unit> = runCatching {
        val docRef = db.collection("student_queries").document(query.id)
        val snap = docRef.get().await()
        val createdAtVal = snap.getTimestamp("createdAt") ?: query.createdAt ?: Timestamp.now()
        val payload = mapOf(
            "userId" to query.userId,
            "studentName" to query.studentName.take(120),
            "studentEmail" to query.studentEmail.take(160),
            "category" to query.category.takeIf { it in listOf("doubt", "payment", "technical") }.orEmpty().ifBlank { "doubt" },
            "subject" to query.subject.take(250),
            "message" to query.message.take(4000),
            "adminReply" to adminReplyText.trim().take(4000),
            "status" to (if (markResolved) "resolved" else "open"),
            "createdAt" to createdAtVal,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        docRef.set(payload).await()
        Unit
    }.onFailure { e ->
        logFirestoreFailure("replyToStudentQueryAdmin", "student_queries/${query.id}", e)
    }

    // =========================================================================
    // 8. Student Attempts, Paid Test Series Purchases (with Validity) & Bookmarks
    // =========================================================================
    fun observeUserPurchases(uid: String): Flow<List<PurchaseRecord>> = callbackFlow {
        val reg = db.collection("users").document(uid).collection("purchases")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeUserPurchases", "users/$uid/purchases", err)
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { d ->
                    d.toObject(PurchaseRecord::class.java)?.copy(id = d.id)
                }?.sortedByDescending { it.createdAt?.seconds ?: 0L }.orEmpty()
                trySend(list)
            }
        awaitClose { reg.remove() }
    }

    fun observeAllPurchasesForAdmin(): Flow<List<PurchaseRecord>> = callbackFlow {
        val reg = db.collectionGroup("purchases")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeAllPurchasesForAdmin", "collectionGroup(purchases)", err)
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { d ->
                    d.toObject(PurchaseRecord::class.java)?.copy(id = d.id)
                }.orEmpty()
                trySend(list)
            }
        awaitClose { reg.remove() }
    }

    suspend fun recordTestPurchase(
        testOrFolderId: String,
        titleHi: String,
        titleEn: String,
        amountInr: Long,
        paymentMethod: String,
        validityDays: Long = 180L
    ): Result<PurchaseRecord> = runCatching {
        val uid = currentUid() ?: error("Not signed in")
        val txRef = "CGP-${System.currentTimeMillis()}"
        val docId = "pur_${testOrFolderId}_${System.currentTimeMillis()}"
        val validDays = validityDays.coerceIn(1L, 3650L)
        val expiresAtMillis = System.currentTimeMillis() + (validDays * 86_400_000L)
        val payload = mapOf(
            "userId" to uid,
            "testId" to testOrFolderId.take(100),
            "testTitleHi" to titleHi.ifBlank { "प्रीमियम टेस्ट" }.take(200),
            "testTitleEn" to titleEn.ifBlank { "Premium Test" }.take(200),
            "amountInr" to amountInr.coerceIn(1L, 50000L),
            "paymentMethod" to paymentMethod.ifBlank { "UPI" }.take(50),
            "transactionRef" to txRef,
            "status" to "completed",
            "validityDays" to validDays,
            "expiresAtMillis" to expiresAtMillis,
            "createdAt" to FieldValue.serverTimestamp()
        )
        db.collection("users").document(uid).collection("purchases").document(docId).set(payload).await()
        PurchaseRecord(
            id = docId,
            userId = uid,
            testId = testOrFolderId,
            testTitleHi = titleHi,
            testTitleEn = titleEn,
            amountInr = amountInr,
            paymentMethod = paymentMethod,
            transactionRef = txRef,
            status = "completed",
            validityDays = validDays,
            expiresAtMillis = expiresAtMillis,
            createdAt = Timestamp.now()
        )
    }.onFailure { e ->
        logFirestoreFailure("recordTestPurchase", "users/${currentUid()}/purchases", e)
    }

    /**
     * Allows Owner Admin to manually unlock/activate any Paid Test Series or Folder
     * for a student by entering their User ID (UID) or Registered Email ID,
     * with activation-based validity starting strictly at the moment of activation.
     */
    fun observeAllUsersForAdmin(): Flow<List<UserProfile>> = callbackFlow {
        val reg = db.collection("users")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeAllUsersForAdmin", "users", err)
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { d ->
                    d.toObject(UserProfile::class.java)?.copy(id = d.id)
                }?.sortedByDescending { it.updatedAt?.seconds ?: 0L }.orEmpty()
                trySend(list)
            }
        awaitClose { reg.remove() }
    }

    suspend fun grantPaidAccessByAdmin(
        studentIdentifier: String,
        targetTestOrFolderId: String,
        titleHi: String,
        titleEn: String,
        amountInr: Long,
        validityDays: Long = 180L
    ): Result<String> = runCatching {
        val cleanInput = studentIdentifier.trim()
        if (cleanInput.isBlank()) error("Please enter Student Email ID or User ID (UID)")

        val resolvedUid = if (cleanInput.contains("@")) {
            val emailSnap = db.collection("users").get().await()
            val matched = emailSnap.documents.firstOrNull { doc ->
                doc.getString("email")?.trim()?.equals(cleanInput, ignoreCase = true) == true
            } ?: error("No registered student found with email: $cleanInput")
            matched.id
        } else {
            val directSnap = db.collection("users").document(cleanInput).get().await()
            if (directSnap.exists()) {
                directSnap.id
            } else {
                val allSnap = db.collection("users").get().await()
                val byPhoneOrUid = allSnap.documents.firstOrNull { doc ->
                    doc.id.equals(cleanInput, ignoreCase = true) ||
                        doc.getString("userId")?.equals(cleanInput, ignoreCase = true) == true ||
                        doc.getString("phoneNumber")?.contains(cleanInput) == true
                } ?: error("No registered student found with ID/Mobile: $cleanInput")
                byPhoneOrUid.id
            }
        }

        val validDays = validityDays.coerceIn(1L, 3650L)
        val activatedNowMillis = System.currentTimeMillis()
        val expiresAtMillis = activatedNowMillis + (validDays * 86_400_000L)
        val docId = "admin_grant_${targetTestOrFolderId.take(50)}"
        val txRef = "ADMIN-WHATSAPP-${CgpediaStarterCatalog.SUPPORT_WHATSAPP_NUMBER}-${activatedNowMillis % 100000}"
        val payload = mapOf(
            "userId" to resolvedUid,
            "testId" to targetTestOrFolderId.take(100),
            "testTitleHi" to titleHi.ifBlank { "प्रीमियम टेस्ट सीरीज" }.take(200),
            "testTitleEn" to titleEn.ifBlank { "Premium Test Series" }.take(200),
            "amountInr" to amountInr.coerceIn(1L, 50000L),
            "paymentMethod" to "AdminGrant",
            "transactionRef" to txRef.take(120),
            "status" to "completed",
            "validityDays" to validDays,
            "expiresAtMillis" to expiresAtMillis,
            "createdAt" to FieldValue.serverTimestamp()
        )
        db.collection("users")
            .document(resolvedUid)
            .collection("purchases")
            .document(docId)
            .set(payload)
            .await()

        resolvedUid
    }.onFailure { e ->
        logFirestoreFailure("grantPaidAccessByAdmin", "users/$studentIdentifier/purchases", e)
    }

    fun observeUserAttempts(uid: String): Flow<List<TestAttempt>> = callbackFlow {
        val reg = db.collection("users").document(uid).collection("attempts")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeUserAttempts", "users/$uid/attempts", err)
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { d ->
                    d.toObject(TestAttempt::class.java)?.copy(id = d.id)
                }?.sortedByDescending { it.createdAt?.seconds ?: 0L }.orEmpty()
                trySend(list)
            }
        awaitClose { reg.remove() }
    }

    suspend fun submitTestAttempt(attempt: TestAttempt): Result<String> = runCatching {
        val uid = currentUid() ?: error("Not signed in")
        val docId = attempt.id.ifBlank { "att_${attempt.testId}_${System.currentTimeMillis()}" }
        val payload = mapOf(
            "userId" to uid,
            "testId" to attempt.testId.take(100),
            "testTitleHi" to attempt.testTitleHi.ifBlank { "टेस्ट" }.take(200),
            "testTitleEn" to attempt.testTitleEn.ifBlank { "Test" }.take(200),
            "totalQuestions" to attempt.totalQuestions.coerceIn(1L, 100L),
            "attemptedCount" to attempt.attemptedCount.coerceIn(0L, attempt.totalQuestions.coerceAtLeast(1L)),
            "correctCount" to attempt.correctCount.coerceIn(0L, attempt.attemptedCount),
            "incorrectCount" to attempt.incorrectCount.coerceIn(0L, attempt.attemptedCount),
            "score" to attempt.score,
            "maxScore" to attempt.maxScore.coerceAtLeast(1.0),
            "accuracyPercent" to attempt.accuracyPercent.coerceIn(0L, 100L),
            "timeTakenSeconds" to attempt.timeTakenSeconds.coerceIn(0L, 86400L),
            "selectedAnswers" to attempt.selectedAnswers,
            "status" to "submitted",
            "createdAt" to FieldValue.serverTimestamp()
        )
        db.collection("users").document(uid).collection("attempts").document(docId).set(payload).await()
        docId
    }.onFailure { e ->
        logFirestoreFailure("submitTestAttempt", "users/${currentUid()}/attempts", e)
    }

    fun observeBookmarks(uid: String): Flow<List<BookmarkedQuestion>> = callbackFlow {
        val reg = db.collection("users").document(uid).collection("bookmarks")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observeBookmarks", "users/$uid/bookmarks", err)
                    trySend(readOfflineBookmarksCache())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { d ->
                    d.toObject(BookmarkedQuestion::class.java)?.copy(id = d.id)
                }?.sortedByDescending { it.createdAt?.seconds ?: 0L }.orEmpty()
                writeOfflineBookmarksCache(list)
                trySend(list)
            }
        awaitClose { reg.remove() }
    }

    suspend fun toggleBookmark(question: BilingualQuestion, currentlyBookmarked: Boolean): Result<Boolean> = runCatching {
        val uid = currentUid() ?: error("Not signed in")
        val docId = "bm_${question.id}"
        val ref = db.collection("users").document(uid).collection("bookmarks").document(docId)
        if (currentlyBookmarked) {
            ref.delete().await()
            false
        } else {
            val payload = mapOf(
                "userId" to uid,
                "questionId" to question.id.take(100),
                "testId" to question.testId.ifBlank { "general" }.take(100),
                "questionHi" to question.questionHi.take(2500),
                "questionEn" to question.questionEn.take(2500),
                "optionsHi" to question.optionsHi.take(4).let { if (it.size == 4) it else it + List(4 - it.size) { "विकल्प" } },
                "optionsEn" to question.optionsEn.take(4).let { if (it.size == 4) it else it + List(4 - it.size) { "Option" } },
                "correctOptionIndex" to question.correctOptionIndex.coerceIn(0L, 3L),
                "explanationHi" to question.explanationHi.take(4000),
                "explanationEn" to question.explanationEn.take(4000),
                "subjectTag" to question.subjectTag.ifBlank { "General Studies" }.take(100),
                "createdAt" to FieldValue.serverTimestamp()
            )
            ref.set(payload, SetOptions.merge()).await()
            true
        }
    }.onFailure { e ->
        logFirestoreFailure("toggleBookmark", "users/${currentUid()}/bookmarks/bm_${question.id}", e)
    }

    private fun writeOfflineBookmarksCache(list: List<BookmarkedQuestion>) {
        runCatching {
            val arr = JSONArray()
            list.forEach { b ->
                val obj = JSONObject()
                obj.put("id", b.id)
                obj.put("userId", b.userId)
                obj.put("questionId", b.questionId)
                obj.put("testId", b.testId)
                obj.put("questionHi", b.questionHi)
                obj.put("questionEn", b.questionEn)
                obj.put("optionsHi", JSONArray(b.optionsHi))
                obj.put("optionsEn", JSONArray(b.optionsEn))
                obj.put("correctOptionIndex", b.correctOptionIndex)
                obj.put("explanationHi", b.explanationHi)
                obj.put("explanationEn", b.explanationEn)
                obj.put("subjectTag", b.subjectTag)
                arr.put(obj)
            }
            prefs?.edit()?.putString("bookmarks_json", arr.toString())?.apply()
        }.onFailure { Log.w("CgpediaRepo", "Offline cache write failed", it) }
    }

    fun readOfflineBookmarksCache(): List<BookmarkedQuestion> = runCatching {
        val raw = prefs?.getString("bookmarks_json", null) ?: return emptyList()
        val arr = JSONArray(raw)
        val out = mutableListOf<BookmarkedQuestion>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            val optsHi = mutableListOf<String>()
            val hiArr = o.optJSONArray("optionsHi")
            if (hiArr != null) for (j in 0 until hiArr.length()) optsHi.add(hiArr.getString(j))
            val optsEn = mutableListOf<String>()
            val enArr = o.optJSONArray("optionsEn")
            if (enArr != null) for (j in 0 until enArr.length()) optsEn.add(enArr.getString(j))
            out.add(
                BookmarkedQuestion(
                    id = o.optString("id"),
                    userId = o.optString("userId"),
                    questionId = o.optString("questionId"),
                    testId = o.optString("testId"),
                    questionHi = o.optString("questionHi"),
                    questionEn = o.optString("questionEn"),
                    optionsHi = if (optsHi.size == 4) optsHi else listOf("", "", "", ""),
                    optionsEn = if (optsEn.size == 4) optsEn else listOf("", "", "", ""),
                    correctOptionIndex = o.optLong("correctOptionIndex", 0L),
                    explanationHi = o.optString("explanationHi"),
                    explanationEn = o.optString("explanationEn"),
                    subjectTag = o.optString("subjectTag", "General Studies")
                )
            )
        }
        out
    }.getOrDefault(emptyList())

    // =========================================================================
    // 9. Owner Admin Starter Cloud Seed (Only callable when signed in as Admin)
    // =========================================================================
    suspend fun seedStarterCatalogAsAdmin(adminUid: String) {
        if (!isVerifiedOwnerAdmin()) return
        runCatching {
            val examSnap = db.collection("exam_folders").limit(1).get().await()
            if (examSnap.isEmpty) {
                CgpediaStarterCatalog.defaultExamFolders(adminUid).forEach { saveExamFolderAdmin(it) }
            }
            val subjSnap = db.collection("subject_folders").limit(1).get().await()
            if (subjSnap.isEmpty) {
                CgpediaStarterCatalog.defaultSubjectFolders(adminUid).forEach { saveSubjectFolderAdmin(it) }
            }
            val testsSnap = db.collection("tests").limit(1).get().await()
            if (testsSnap.isEmpty) {
                val allQuestions = CgpediaStarterCatalog.defaultQuestions(adminUid)
                CgpediaStarterCatalog.defaultTests(adminUid).forEach { test ->
                    val qs = allQuestions.filter { it.testId == test.id }
                    createDraftTestWithQuestionsAdmin(test, qs)
                    publishTestAndQuestionsAdmin(test.id)
                }
            }
            val caSnap = db.collection("current_affairs").limit(1).get().await()
            if (caSnap.isEmpty) {
                saveCurrentAffairsBatch(CgpediaStarterCatalog.defaultCurrentAffairs(adminUid))
            }
            val notifSnap = db.collection("broadcast_notifications").limit(1).get().await()
            if (notifSnap.isEmpty) {
                CgpediaStarterCatalog.defaultBroadcastNotifications(adminUid).forEach {
                    saveBroadcastNotificationAdmin(it)
                }
            }
            val upcomingSnap = db.collection("upcoming_tests").limit(1).get().await()
            if (upcomingSnap.isEmpty) {
                CgpediaStarterCatalog.defaultUpcomingTests(adminUid).forEach {
                    saveUpcomingTestAdmin(it)
                }
            }
        }.onFailure { e ->
            Log.w("CgpediaRepo", "Starter catalog seed skipped: ${e.message}")
        }
    }

    // =========================================================================
    // 10. Overloaded Helpers for Emulator & Unit Testing
    // =========================================================================
    suspend fun ensureUserProfile(
        displayName: String,
        email: String,
        photoUrl: String,
        isVerifiedAdmin: Boolean
    ): Result<UserProfile> = runCatching {
        val uid = currentUid() ?: error("Must be signed in")
        val role = if (isVerifiedAdmin) "admin" else "student"
        val docRef = db.collection("users").document(uid)
        val payload = mapOf(
            "userId" to uid,
            "displayName" to displayName.ifBlank { "CGPSC Aspirant" }.take(100),
            "email" to email.take(160),
            "phoneNumber" to "",
            "photoUrl" to photoUrl.take(1200),
            "targetExam" to "CGPSC & CGSSB",
            "preferredLanguage" to "en",
            "darkMode" to false,
            "notifyCurrentAffairs" to true,
            "notifyNewTests" to true,
            "role" to role,
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        docRef.set(payload).await()
        UserProfile(
            id = uid,
            userId = uid,
            displayName = displayName,
            email = email,
            photoUrl = photoUrl,
            role = role
        )
    }.onFailure { e ->
        logFirestoreFailure("ensureUserProfile", "users/${currentUid()}", e)
    }

    suspend fun getUserProfileById(uid: String): Result<UserProfile> = runCatching {
        val snap = db.collection("users").document(uid).get().await()
        snap.toObject(UserProfile::class.java)?.copy(id = snap.id)
            ?: throw IllegalStateException("Profile not found for $uid")
    }.onFailure { e ->
        logFirestoreFailure("getUserProfileById", "users/$uid", e)
    }

    suspend fun recordTestPurchase(
        testId: String,
        testTitleHi: String,
        testTitleEn: String,
        amountInr: Long,
        paymentMethod: String
    ): Result<PurchaseRecord> = recordTestPurchase(
        testOrFolderId = testId,
        titleHi = testTitleHi,
        titleEn = testTitleEn,
        amountInr = amountInr,
        paymentMethod = paymentMethod,
        validityDays = 180L
    )

    suspend fun toggleBookmarkQuestion(
        question: BilingualQuestion,
        currentlyBookmarkedId: String?
    ): Result<Boolean> = toggleBookmark(
        question = question,
        currentlyBookmarked = !currentlyBookmarkedId.isNullOrBlank()
    )

    suspend fun saveGroundedCurrentAffairsBatch(
        items: List<CurrentAffairItem>
    ): Result<Int> = saveCurrentAffairsBatch(items)

    suspend fun submitStudentQuery(
        userName: String,
        userEmail: String,
        category: String,
        subject: String,
        messageText: String,
        attachmentUrl: String = ""
    ): Result<String> = runCatching {
        val uid = currentUid() ?: error("Not signed in")
        val docId = "query_${uid.take(8)}_${System.currentTimeMillis()}"
        val payload = mapOf(
            "userId" to uid,
            "studentName" to userName.trim().ifBlank { "CGpedia Student" }.take(120),
            "studentEmail" to userEmail.trim().take(160),
            "category" to category.takeIf { it in listOf("doubt", "payment", "technical") }.orEmpty().ifBlank { "doubt" },
            "subject" to (if (attachmentUrl.isNotBlank()) "$subject [Ref]" else subject).trim().ifBlank { "Student Support Query" }.take(250),
            "message" to messageText.trim().take(4000),
            "adminReply" to "",
            "status" to "open",
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        db.collection("student_queries").document(docId).set(payload).await()
        docId
    }.onFailure { e ->
        logFirestoreFailure("submitStudentQuery", "student_queries", e)
    }

    fun observeMyStudentQueries(uid: String): Flow<List<StudentQuery>> = observeMyQueries(uid)

    fun observePublishedCurrentAffairs(): Flow<List<CurrentAffairItem>> = callbackFlow {
        val reg = db.collection("current_affairs")
            .whereEqualTo("visibility", "published")
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    logFirestoreFailure("observePublishedCurrentAffairs", "current_affairs", err)
                    close(err)
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { d ->
                    d.toObject(CurrentAffairItem::class.java)?.copy(id = d.id)
                }.orEmpty()
                trySend(list)
            }
        awaitClose { reg.remove() }
    }
}
