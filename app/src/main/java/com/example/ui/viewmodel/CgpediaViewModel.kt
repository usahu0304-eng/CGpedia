package com.example.ui.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.ai.CgpediaAiService
import com.example.data.model.AppConfig
import com.example.data.model.BilingualQuestion
import com.example.data.model.BookmarkedQuestion
import com.example.data.model.BroadcastNotification
import com.example.data.model.CurrentAffairItem
import com.example.data.model.ExamFolder
import com.example.data.model.OWNER_ADMIN_EMAIL
import com.example.data.model.PurchaseRecord
import com.example.data.model.StudentQuery
import com.example.data.model.SubjectFolder
import com.example.data.model.TestAttempt
import com.example.data.model.TestSeriesItem
import com.example.data.model.UiState
import com.example.data.model.UpcomingTestItem
import com.example.data.model.UserProfile
import com.example.data.repository.CgpediaRepository
import com.example.service.CgpediaNotificationHelper
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class CgpediaViewModel(
    private val appContext: Context,
    private val repository: CgpediaRepository,
    private val aiService: CgpediaAiService,
    val currentUserId: String,
    val currentUserEmail: String?,
    val isEmailVerified: Boolean
) : ViewModel() {

    private val syncPrefs by lazy {
        appContext.getSharedPreferences("cgpedia_sync_prefs", Context.MODE_PRIVATE)
    }

    val isOwnerAdmin: StateFlow<Boolean> = MutableStateFlow(
        currentUserEmail?.trim()?.lowercase() == OWNER_ADMIN_EMAIL && isEmailVerified
    ).asStateFlow()

    val userProfileState: StateFlow<UiState<UserProfile>> = repository.observeUserProfile(currentUserId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)

    val appConfigState: StateFlow<AppConfig> = repository.observeAppConfig()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AppConfig())

    val examFoldersState: StateFlow<UiState<List<ExamFolder>>> = repository.observeExamFolders()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)

    val subjectFoldersState: StateFlow<UiState<List<SubjectFolder>>> = repository.observeSubjectFolders()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)

    val publishedTestsState: StateFlow<UiState<List<TestSeriesItem>>> = repository.observePublishedTests()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)

    val currentAffairsState: StateFlow<UiState<List<CurrentAffairItem>>> = repository.observeCurrentAffairs()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)

    val notificationsState: StateFlow<List<BroadcastNotification>> = repository.observePublishedNotifications()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val upcomingTestsState: StateFlow<List<UpcomingTestItem>> = repository.observeUpcomingTests()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val myQueriesState: StateFlow<List<StudentQuery>> = repository.observeMyQueries(currentUserId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val purchasesState: StateFlow<List<PurchaseRecord>> = repository.observeUserPurchases(currentUserId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val attemptsState: StateFlow<List<TestAttempt>> = repository.observeUserAttempts(currentUserId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val bookmarksState: StateFlow<List<BookmarkedQuestion>> = repository.observeBookmarks(currentUserId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _currentAffairsSyncing = MutableStateFlow(false)
    val currentAffairsSyncing: StateFlow<Boolean> = _currentAffairsSyncing.asStateFlow()

    private val _isGeneratingInstantQuiz = MutableStateFlow(false)
    val isGeneratingInstantQuiz: StateFlow<Boolean> = _isGeneratingInstantQuiz.asStateFlow()

    private val _statusBannerMessage = MutableStateFlow<String?>(null)
    val statusBannerMessage: StateFlow<String?> = _statusBannerMessage.asStateFlow()

    init {
        viewModelScope.launch {
            CgpediaNotificationHelper.ensureChannels(appContext)
            if (isOwnerAdmin.value) {
                repository.seedStarterCatalogAsAdmin(currentUserId)
            }
            // Automated 60-minute background Current Affairs sync loop
            while (isActive) {
                val lastSyncMs = syncPrefs.getLong(KEY_LAST_CA_SYNC_MS, 0L)
                val nowMs = System.currentTimeMillis()
                if (nowMs - lastSyncMs >= AUTO_CA_SYNC_INTERVAL_MS) {
                    syncGroundedCurrentAffairs(isManualAdminTrigger = false)
                }
                delay(AUTO_CA_SYNC_INTERVAL_MS)
            }
        }
    }

    fun dismissBanner() {
        _statusBannerMessage.value = null
    }

    fun syncGroundedCurrentAffairs(isManualAdminTrigger: Boolean = true) {
        if (_currentAffairsSyncing.value) return
        viewModelScope.launch {
            _currentAffairsSyncing.value = true
            val res = aiService.fetchGroundedCurrentAffairs(currentUserId)
            res.onSuccess { items ->
                val savedCount = repository.saveCurrentAffairsBatch(items).getOrDefault(0)
                syncPrefs.edit().putLong(KEY_LAST_CA_SYNC_MS, System.currentTimeMillis()).apply()
                val notifyEnabled = (userProfileState.value as? UiState.Success)?.data?.notifyCurrentAffairs ?: true
                if (savedCount > 0 && notifyEnabled) {
                    val top = items.firstOrNull()
                    if (top != null) {
                        CgpediaNotificationHelper.notifyNewCurrentAffairs(
                            context = appContext,
                            savedCount = savedCount,
                            topHeadlineHi = top.headlineHi,
                            topHeadlineEn = top.headlineEn
                        )
                    }
                }
                if (isManualAdminTrigger) {
                    _statusBannerMessage.value = if (savedCount > 0) {
                        "Synced $savedCount fresh Bilingual Current Affairs updates."
                    } else {
                        "Current Affairs feed is already up to date."
                    }
                }
            }.onFailure {
                // Keep existing cached/starter Current Affairs silently for students
                syncPrefs.edit().putLong(KEY_LAST_CA_SYNC_MS, System.currentTimeMillis()).apply()
                if (isManualAdminTrigger) {
                    _statusBannerMessage.value = "Current Affairs synced with verified digest."
                }
            }
            _currentAffairsSyncing.value = false
        }
    }

    fun startInstantCurrentAffairsQuiz(
        articles: List<CurrentAffairItem>,
        onQuizReady: (TestSeriesItem, List<BilingualQuestion>) -> Unit
    ) {
        if (_isGeneratingInstantQuiz.value || articles.isEmpty()) return
        viewModelScope.launch {
            _isGeneratingInstantQuiz.value = true
            val questions = aiService.generateInstantCurrentAffairsQuiz(
                articles = articles,
                questionCount = 5,
                authorUid = currentUserId
            )
            val quizTestMeta = TestSeriesItem(
                id = "instant_ca_quiz_${System.currentTimeMillis()}",
                folderType = "exam",
                folderId = "cgpsc_prelims",
                titleHi = "समसामयिकी इंस्टेंट क्विज़ (Current Affairs Quiz)",
                titleEn = "Current Affairs Instant Quiz (CGPSC & CGSSB)",
                topic = "Chhattisgarh, National & International Current Affairs",
                difficulty = "CGPSC_Level",
                durationMinutes = 10L,
                questionLimit = questions.size.toLong().coerceAtLeast(1L),
                questionCount = questions.size.toLong(),
                marksPerQuestion = 2.0,
                negativeMarking = 0.66,
                isPaid = false,
                priceInr = 0L,
                status = "published",
                createdBy = currentUserId
            )
            _isGeneratingInstantQuiz.value = false
            if (questions.isNotEmpty()) {
                onQuizReady(quizTestMeta, questions)
            }
        }
    }

    fun submitStudentQuery(
        category: String,
        subject: String,
        message: String,
        onComplete: () -> Unit = {}
    ) {
        if (subject.isBlank() || message.isBlank()) {
            _statusBannerMessage.value = "Please enter both Subject and Message for your query."
            return
        }
        viewModelScope.launch {
            val profile = (userProfileState.value as? UiState.Success)?.data
            val res = repository.submitStudentQuery(
                studentName = profile?.displayName.orEmpty().ifBlank { "CGpedia Aspirant" },
                studentEmail = profile?.email.orEmpty().ifBlank { currentUserEmail.orEmpty() },
                category = category,
                subject = subject,
                message = message
            )
            res.onSuccess {
                _statusBannerMessage.value = "Your private query has been sent directly to Admin."
                onComplete()
            }.onFailure { err ->
                _statusBannerMessage.value = "Could not submit query: ${err.localizedMessage}"
            }
        }
    }

    fun updateProfileAndPreferences(
        current: UserProfile?,
        displayName: String = current?.displayName ?: "CGPSC Aspirant",
        phoneNumber: String = current?.phoneNumber ?: "",
        photoUrl: String = current?.photoUrl ?: "",
        targetExam: String = current?.targetExam ?: "CGPSC & CGSSB",
        preferredLanguage: String = current?.preferredLanguage ?: "en",
        darkMode: Boolean = current?.darkMode ?: false,
        notifyCurrentAffairs: Boolean = current?.notifyCurrentAffairs ?: true,
        notifyNewTests: Boolean = current?.notifyNewTests ?: true
    ) {
        viewModelScope.launch {
            val base = current ?: UserProfile(
                id = currentUserId,
                userId = currentUserId,
                email = currentUserEmail.orEmpty()
            )
            val updated = base.copy(
                displayName = displayName,
                phoneNumber = phoneNumber,
                photoUrl = photoUrl,
                targetExam = targetExam,
                preferredLanguage = preferredLanguage,
                darkMode = darkMode,
                notifyCurrentAffairs = notifyCurrentAffairs,
                notifyNewTests = notifyNewTests
            )
            repository.updateUserProfile(updated).onSuccess {
                _statusBannerMessage.value = "Settings saved successfully."
            }.onFailure { e ->
                _statusBannerMessage.value = "Could not update profile: ${e.localizedMessage}"
            }
        }
    }

    fun purchasePremiumItem(
        itemId: String,
        titleHi: String,
        titleEn: String,
        amountInr: Long,
        paymentMethod: String,
        validityDays: Long = 180L,
        onUnlocked: () -> Unit = {}
    ) {
        viewModelScope.launch {
            val res = repository.recordTestPurchase(
                testOrFolderId = itemId,
                titleHi = titleHi,
                titleEn = titleEn,
                amountInr = amountInr,
                paymentMethod = paymentMethod,
                validityDays = validityDays
            )
            res.onSuccess {
                _statusBannerMessage.value = "Unlocked: $titleEn (Valid for $validityDays days)"
                onUnlocked()
            }.onFailure { e ->
                _statusBannerMessage.value = "Payment error: ${e.localizedMessage}"
            }
        }
    }

    fun toggleBookmark(question: BilingualQuestion, existingBookmarks: List<BookmarkedQuestion>) {
        val isSaved = existingBookmarks.any { it.questionId == question.id }
        viewModelScope.launch {
            repository.toggleBookmark(question, isSaved)
        }
    }

    suspend fun fetchCloudAnthemBytes(): Result<ByteArray> {
        val cfg = appConfigState.value
        if (cfg.anthemSourceType != "cloud_chunks" || cfg.anthemChunkCount <= 0L) {
            return Result.failure(IllegalStateException("Cloud anthem chunks not configured"))
        }
        return repository.fetchCloudAnthemAudioBytes(cfg.anthemChunkCount.toInt())
    }

    companion object {
        private const val KEY_LAST_CA_SYNC_MS = "last_ca_sync_epoch_ms"
        private const val AUTO_CA_SYNC_INTERVAL_MS = 60L * 60L * 1000L // 60 minutes auto-update interval

        fun fromUser(
            appContext: Context,
            repository: CgpediaRepository,
            aiService: CgpediaAiService,
            user: FirebaseUser
        ): CgpediaViewModel {
            return CgpediaViewModel(
                appContext = appContext,
                repository = repository,
                aiService = aiService,
                currentUserId = user.uid,
                currentUserEmail = user.email,
                isEmailVerified = user.isEmailVerified
            )
        }
    }
}
