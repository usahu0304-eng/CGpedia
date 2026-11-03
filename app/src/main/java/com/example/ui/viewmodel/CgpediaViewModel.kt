package com.example.ui.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.ai.CgpediaAiService
import com.example.data.model.AppConfig
import com.example.data.model.BilingualQuestion
import com.example.data.model.BookmarkedQuestion
import com.example.data.model.CurrentAffairItem
import com.example.data.model.ExamFolder
import com.example.data.model.PurchaseRecord
import com.example.data.model.SubjectFolder
import com.example.data.model.TestAttempt
import com.example.data.model.TestSeriesItem
import com.example.data.model.UiState
import com.example.data.model.UserProfile
import com.example.data.repository.CgpediaRepository
import com.example.security.AdminConfig
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class CgpediaViewModel(
    private val repository: CgpediaRepository,
    private val aiService: CgpediaAiService,
    private val currentUserId: String,
    initialEmail: String,
    initialDisplayName: String,
    initialPhotoUrl: String,
    initialEmailVerified: Boolean,
    initialPhoneNumber: String = ""
) : ViewModel() {

    private val _isOwnerAdmin = MutableStateFlow(
        initialEmail.equals(AdminConfig.OWNER_ADMIN_EMAIL, ignoreCase = true) && initialEmailVerified
    )
    val isOwnerAdmin: StateFlow<Boolean> = _isOwnerAdmin.asStateFlow()

    private val _currentAffairsSyncing = MutableStateFlow(false)
    val currentAffairsSyncing: StateFlow<Boolean> = _currentAffairsSyncing.asStateFlow()

    private val _statusBannerMessage = MutableStateFlow<String?>(null)
    val statusBannerMessage: StateFlow<String?> = _statusBannerMessage.asStateFlow()

    private var autoSyncTriggeredThisSession = false

    val userProfileState: StateFlow<UiState<UserProfile?>> = repository.observeUserProfile(currentUserId)
        .map<UserProfile?, UiState<UserProfile?>> { UiState.Success(it) }
        .catch { e ->
            Log.w(TAG, "Error observing userProfile", e)
            emit(UiState.Error(e.message ?: "Failed to load profile"))
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), UiState.Loading)

    val appConfigState: StateFlow<AppConfig> = repository.observeAppConfig()
        .catch { e ->
            Log.w(TAG, "Error observing appConfig", e)
            emit(AppConfig())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), AppConfig())

    val examFoldersState: StateFlow<UiState<List<ExamFolder>>> = repository.observeExamFolders()
        .map<List<ExamFolder>, UiState<List<ExamFolder>>> { UiState.Success(it) }
        .catch { e ->
            Log.w(TAG, "Error observing exam folders", e)
            emit(UiState.Error(e.message ?: "Failed to load exam folders"))
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), UiState.Loading)

    val subjectFoldersState: StateFlow<UiState<List<SubjectFolder>>> = repository.observeSubjectFolders()
        .map<List<SubjectFolder>, UiState<List<SubjectFolder>>> { UiState.Success(it) }
        .catch { e ->
            Log.w(TAG, "Error observing subject folders", e)
            emit(UiState.Error(e.message ?: "Failed to load subject folders"))
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), UiState.Loading)

    val publishedTestsState: StateFlow<UiState<List<TestSeriesItem>>> = repository.observePublishedTests()
        .map<List<TestSeriesItem>, UiState<List<TestSeriesItem>>> { UiState.Success(it) }
        .catch { e ->
            Log.w(TAG, "Error observing published tests", e)
            emit(UiState.Error(e.message ?: "Failed to load tests"))
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), UiState.Loading)

    val currentAffairsState: StateFlow<UiState<List<CurrentAffairItem>>> = repository.observePublishedCurrentAffairs()
        .map<List<CurrentAffairItem>, UiState<List<CurrentAffairItem>>> { items ->
            if (items.isEmpty() && !autoSyncTriggeredThisSession) {
                autoSyncTriggeredThisSession = true
                syncGroundedCurrentAffairs()
            } else if (items.isNotEmpty() && !autoSyncTriggeredThisSession) {
                val newestMillis = (items.firstOrNull()?.createdAt?.seconds ?: 0L) * 1000L
                val sixHoursMs = 6L * 60L * 60L * 1000L
                if (newestMillis > 0L && (System.currentTimeMillis() - newestMillis) > sixHoursMs) {
                    autoSyncTriggeredThisSession = true
                    syncGroundedCurrentAffairs()
                }
            }
            UiState.Success(items)
        }
        .catch { e ->
            Log.w(TAG, "Error observing current affairs", e)
            emit(UiState.Error(e.message ?: "Failed to load current affairs"))
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), UiState.Loading)

    val purchasesState: StateFlow<List<PurchaseRecord>> = repository.observeUserPurchases(currentUserId)
        .catch { e ->
            Log.w(TAG, "Error observing purchases", e)
            emit(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), emptyList())

    val attemptsState: StateFlow<List<TestAttempt>> = repository.observeUserAttempts(currentUserId)
        .catch { e ->
            Log.w(TAG, "Error observing attempts", e)
            emit(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), emptyList())

    val bookmarksState: StateFlow<List<BookmarkedQuestion>> = repository.observeUserBookmarks(currentUserId)
        .catch { e ->
            Log.w(TAG, "Error observing bookmarks", e)
            emit(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), emptyList())

    init {
        viewModelScope.launch {
            val trustedAdmin = repository.checkTrustedAdminDoc(currentUserId)
            val verifiedAdmin = (_isOwnerAdmin.value || trustedAdmin)
            _isOwnerAdmin.value = verifiedAdmin
            repository.ensureUserProfile(
                displayName = initialDisplayName,
                email = initialEmail,
                photoUrl = initialPhotoUrl,
                isVerifiedAdmin = verifiedAdmin,
                phoneNumber = initialPhoneNumber
            )
            if (verifiedAdmin) {
                repository.seedDefaultCatalogIfEmptyAdmin()
            }
        }
    }

    fun syncGroundedCurrentAffairs(isManualAdminTrigger: Boolean = false) {
        if (_currentAffairsSyncing.value) return
        viewModelScope.launch {
            _currentAffairsSyncing.value = true
            if (isManualAdminTrigger) {
                _statusBannerMessage.value = null
            }
            val res = aiService.fetchGroundedCurrentAffairs(currentUserId)
            res.onSuccess { articles ->
                val saveRes = repository.saveGroundedCurrentAffairsBatch(articles)
                if (isManualAdminTrigger) {
                    saveRes.onSuccess { count ->
                        _statusBannerMessage.value = "Synced $count bilingual Current Affairs stories."
                    }.onFailure { err ->
                        _statusBannerMessage.value = err.localizedMessage ?: "Failed to save grounded news"
                    }
                }
            }.onFailure { err ->
                Log.w(TAG, "Background current affairs sync warning: ${err.message}")
                if (isManualAdminTrigger) {
                    _statusBannerMessage.value = err.localizedMessage ?: "Current Affairs sync failed"
                }
            }
            _currentAffairsSyncing.value = false
        }
    }

    fun updateProfileAndPreferences(
        current: UserProfile?,
        displayName: String = current?.displayName ?: "CGpedia Aspirant",
        phoneNumber: String = current?.phoneNumber ?: "",
        photoUrl: String = current?.photoUrl ?: "",
        targetExam: String = current?.targetExam ?: "CGPSC & CGSSB",
        preferredLanguage: String = current?.preferredLanguage ?: "en",
        darkMode: Boolean = current?.darkMode ?: false,
        notifyCurrentAffairs: Boolean = current?.notifyCurrentAffairs ?: true,
        notifyNewTests: Boolean = current?.notifyNewTests ?: true
    ) {
        viewModelScope.launch {
            val res = repository.updateUserProfileSettings(
                displayName = displayName,
                phoneNumber = phoneNumber,
                photoUrl = photoUrl,
                targetExam = targetExam,
                preferredLanguage = preferredLanguage,
                darkMode = darkMode,
                notifyCurrentAffairs = notifyCurrentAffairs,
                notifyNewTests = notifyNewTests
            )
            res.onFailure { err ->
                _statusBannerMessage.value = err.localizedMessage ?: "Failed to save settings"
            }
        }
    }

    fun purchasePremiumItem(
        itemId: String,
        titleHi: String,
        titleEn: String,
        amountInr: Long,
        paymentMethod: String,
        onCompleted: () -> Unit
    ) {
        viewModelScope.launch {
            val res = repository.recordTestPurchase(
                testId = itemId,
                testTitleHi = titleHi,
                testTitleEn = titleEn,
                amountInr = amountInr,
                paymentMethod = paymentMethod
            )
            res.onSuccess {
                _statusBannerMessage.value = "Payment successful! Test unlocked."
                onCompleted()
            }.onFailure { err ->
                _statusBannerMessage.value = err.localizedMessage ?: "Payment verification failed."
            }
        }
    }

    fun toggleBookmark(question: BilingualQuestion, existingBookmarks: List<BookmarkedQuestion>) {
        viewModelScope.launch {
            val match = existingBookmarks.firstOrNull { it.questionId == question.id && question.id.isNotBlank() }
                ?: existingBookmarks.firstOrNull { it.questionHi == question.questionHi }
            repository.toggleBookmarkQuestion(question, match?.id)
        }
    }

    suspend fun fetchCloudAnthemBytes(): Result<ByteArray> = repository.fetchCloudAnthemBytes()

    fun dismissBanner() {
        _statusBannerMessage.value = null
    }

    companion object {
        private const val TAG = "CgpediaVM"

        fun fromUser(
            repository: CgpediaRepository,
            aiService: CgpediaAiService,
            user: FirebaseUser
        ): CgpediaViewModel = CgpediaViewModel(
            repository = repository,
            aiService = aiService,
            currentUserId = user.uid,
            initialEmail = user.email.orEmpty(),
            initialDisplayName = user.displayName.orEmpty(),
            initialPhotoUrl = user.photoUrl?.toString().orEmpty(),
            initialEmailVerified = user.isEmailVerified,
            initialPhoneNumber = user.phoneNumber.orEmpty()
        )
    }
}
