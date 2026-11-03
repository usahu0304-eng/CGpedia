package com.example.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.ai.CgpediaAiService
import com.example.data.model.AppConfig
import com.example.data.model.BilingualQuestion
import com.example.data.model.BroadcastNotification
import com.example.data.model.CurrentAffairItem
import com.example.data.model.ExamFolder
import com.example.data.model.PurchaseRecord
import com.example.data.model.StudentQuery
import com.example.data.model.SubjectFolder
import com.example.data.model.TestSeriesItem
import com.example.data.model.UiState
import com.example.data.model.UpcomingTestItem
import com.example.data.model.UserProfile
import com.example.data.repository.CgpediaRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AdminViewModel(
    private val repository: CgpediaRepository,
    private val aiService: CgpediaAiService,
    private val adminUid: String
) : ViewModel() {

    val allTestsState: StateFlow<UiState<List<TestSeriesItem>>> = repository.observeAllTestsForAdmin()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)

    val allStudentsState: StateFlow<List<UserProfile>> = repository.observeAllUsersForAdmin()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allPurchasesState: StateFlow<List<PurchaseRecord>> = repository.observeAllPurchasesForAdmin()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val broadcastNotificationsState: StateFlow<List<BroadcastNotification>> = repository.observePublishedNotifications()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val upcomingTestsState: StateFlow<List<UpcomingTestItem>> = repository.observeUpcomingTests()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val studentQueriesState: StateFlow<List<StudentQuery>> = repository.observeAllQueriesForAdmin()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _selectedTestForEdit = MutableStateFlow<TestSeriesItem?>(null)
    val selectedTestForEdit: StateFlow<TestSeriesItem?> = _selectedTestForEdit.asStateFlow()

    private val _editingQuestions = MutableStateFlow<List<BilingualQuestion>>(emptyList())
    val editingQuestions: StateFlow<List<BilingualQuestion>> = _editingQuestions.asStateFlow()

    private val _isBusy = MutableStateFlow(false)
    val isBusy: StateFlow<Boolean> = _isBusy.asStateFlow()

    private val _aiGenerationProgressText = MutableStateFlow<String?>(null)
    val aiGenerationProgressText: StateFlow<String?> = _aiGenerationProgressText.asStateFlow()

    private val _adminFeedback = MutableStateFlow<String?>(null)
    val adminFeedback: StateFlow<String?> = _adminFeedback.asStateFlow()

    fun clearFeedback() {
        _adminFeedback.value = null
    }

    /**
     * Creates a Manual Test from scratch inside the selected Exam or Subject folder (without AI),
     * with customizable marks per question, negative marking, timer, Paid/Free toggle, and validity days.
     */
    fun createManualTestFromScratch(
        folderType: String,
        folderId: String,
        titleHi: String,
        titleEn: String,
        topic: String,
        difficulty: String,
        questionLimit: Int,
        durationMinutes: Int,
        marksPerQuestion: Double = 2.0,
        negativeMarking: Double = 0.66,
        isPaid: Boolean,
        priceInr: Long,
        validityDays: Long = 180L,
        publishImmediately: Boolean = false
    ) {
        if (titleHi.isBlank() || titleEn.isBlank() || folderId.isBlank()) {
            _adminFeedback.value = "Please fill Hindi Title, English Title, and select a target Folder."
            return
        }
        viewModelScope.launch {
            _isBusy.value = true
            val testId = "test_manual_${System.currentTimeMillis()}"
            val meta = TestSeriesItem(
                id = testId,
                folderType = folderType,
                folderId = folderId,
                titleHi = titleHi.trim(),
                titleEn = titleEn.trim(),
                topic = topic.trim().ifBlank { titleEn.trim() },
                difficulty = difficulty,
                durationMinutes = durationMinutes.coerceIn(1, 240).toLong(),
                questionLimit = questionLimit.coerceIn(1, 100).toLong(),
                questionCount = 1L,
                marksPerQuestion = marksPerQuestion.coerceIn(0.5, 10.0),
                negativeMarking = negativeMarking.coerceIn(0.0, 5.0),
                isPaid = isPaid,
                priceInr = if (isPaid) priceInr.coerceAtLeast(1L) else 0L,
                validityDays = validityDays.coerceIn(1L, 3650L),
                status = if (publishImmediately) "published" else "draft",
                createdBy = adminUid
            )
            val saveRes = repository.createManualTestAdmin(meta)
            saveRes.onSuccess { createdId ->
                if (publishImmediately) {
                    repository.publishTestAndQuestionsAdmin(createdId)
                }
                _adminFeedback.value = "Manual Test '${meta.titleEn}' created! Opening Question Editor..."
                openTestForReview(meta.copy(id = createdId))
            }.onFailure { err ->
                _adminFeedback.value = "Failed to create manual test: ${err.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    /**
     * AI Bilingual Test Generator with custom Admin prompt support and 5-minute (300,000 ms) timeout.
     */
    fun generateAiDraftTest(
        folderType: String,
        folderId: String,
        titleHi: String,
        titleEn: String,
        topic: String,
        difficulty: String,
        questionCount: Int,
        durationMinutes: Int,
        marksPerQuestion: Double = 2.0,
        negativeMarking: Double = 0.66,
        isPaid: Boolean,
        priceInr: Long,
        validityDays: Long = 180L,
        customPrompt: String = "",
        publishImmediately: Boolean = false
    ) {
        if (topic.isBlank() || titleHi.isBlank() || titleEn.isBlank() || folderId.isBlank()) {
            _adminFeedback.value = "Please fill Topic, Hindi Title, English Title, and Target Folder."
            return
        }
        viewModelScope.launch {
            _isBusy.value = true
            val count = questionCount.coerceIn(1, 100)
            _aiGenerationProgressText.value = "Generating questions, please wait... (0/$count)"
            val testId = "test_${System.currentTimeMillis()}"

            val aiRes = aiService.generateBilingualTestQuestions(
                testId = testId,
                topic = topic,
                difficulty = difficulty,
                questionCount = count,
                authorUid = adminUid,
                customPrompt = customPrompt,
                onProgress = { progressMsg ->
                    _aiGenerationProgressText.value = progressMsg
                }
            )

            aiRes.onSuccess { generatedQuestions ->
                val meta = TestSeriesItem(
                    id = testId,
                    folderType = folderType,
                    folderId = folderId,
                    titleHi = titleHi,
                    titleEn = titleEn,
                    topic = topic,
                    difficulty = difficulty,
                    durationMinutes = durationMinutes.coerceIn(1, 240).toLong(),
                    questionLimit = count.toLong(),
                    questionCount = generatedQuestions.size.toLong(),
                    marksPerQuestion = marksPerQuestion.coerceIn(0.5, 10.0),
                    negativeMarking = negativeMarking.coerceIn(0.0, 5.0),
                    isPaid = isPaid,
                    priceInr = if (isPaid) priceInr.coerceAtLeast(1L) else 0L,
                    validityDays = validityDays.coerceIn(1L, 3650L),
                    status = "draft",
                    createdBy = adminUid
                )
                val saveRes = repository.createDraftTestWithQuestionsAdmin(meta, generatedQuestions)
                saveRes.onSuccess { createdId ->
                    if (publishImmediately) {
                        repository.publishTestAndQuestionsAdmin(createdId)
                        _adminFeedback.value =
                            "Generated ${generatedQuestions.size} Bilingual MCQs & Published '$titleEn' live!"
                        openTestForReview(meta.copy(id = createdId, status = "published"))
                    } else {
                        _adminFeedback.value =
                            "Draft Test Created with ${generatedQuestions.size} Bilingual MCQs! Review & Publish when ready."
                        openTestForReview(meta.copy(id = createdId))
                    }
                }.onFailure { err ->
                    _adminFeedback.value = "Failed to save draft test: ${err.localizedMessage}"
                }
            }.onFailure { err ->
                _adminFeedback.value = "AI Generation failed: ${err.localizedMessage}"
            }
            _aiGenerationProgressText.value = null
            _isBusy.value = false
        }
    }

    fun triggerManualGroundedCurrentAffairsSync() {
        if (_isBusy.value) return
        viewModelScope.launch {
            _isBusy.value = true
            _adminFeedback.value = "Syncing real-time Chhattisgarh, National & International Current Affairs..."
            val res = aiService.fetchGroundedCurrentAffairs(adminUid)
            res.onSuccess { items ->
                val saved = repository.saveCurrentAffairsBatch(items).getOrDefault(0)
                _adminFeedback.value = "Synced $saved fresh Current Affairs items (visible for 24h in Stories)."
            }.onFailure { err ->
                _adminFeedback.value = "Current Affairs sync error: ${err.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun grantStudentAccess(
        studentIdentifier: String,
        targetId: String,
        titleHi: String,
        titleEn: String,
        amountInr: Long,
        validityDays: Long = 180L
    ) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.grantPaidAccessByAdmin(
                studentIdentifier = studentIdentifier,
                targetTestOrFolderId = targetId,
                titleHi = titleHi,
                titleEn = titleEn,
                amountInr = amountInr,
                validityDays = validityDays
            ).onSuccess { resolvedUid ->
                _adminFeedback.value =
                    "Activated '$titleEn' for student ($resolvedUid) • Valid for $validityDays days from today!"
            }.onFailure { err ->
                _adminFeedback.value = "Unlock failed: ${err.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun openTestForReview(test: TestSeriesItem) {
        _selectedTestForEdit.value = test
        viewModelScope.launch {
            _isBusy.value = true
            val res = repository.getAllQuestionsForTestAdmin(test.id)
            res.onSuccess { list ->
                _editingQuestions.value = list
            }.onFailure { e ->
                _adminFeedback.value = "Could not load questions: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun closeTestEditor() {
        _selectedTestForEdit.value = null
        _editingQuestions.value = emptyList()
    }

    fun saveEditedQuestion(question: BilingualQuestion) {
        val test = _selectedTestForEdit.value ?: return
        viewModelScope.launch {
            _isBusy.value = true
            repository.saveQuestionAdmin(test.id, question).onSuccess {
                _adminFeedback.value = "Question #${question.orderIndex + 1} saved."
                val refreshed = repository.getAllQuestionsForTestAdmin(test.id).getOrDefault(emptyList())
                _editingQuestions.value = refreshed
            }.onFailure { e ->
                _adminFeedback.value = "Failed to save question: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun addBlankQuestionToCurrentTest() {
        val test = _selectedTestForEdit.value ?: return
        val nextIndex = _editingQuestions.value.size.toLong()
        val blank = BilingualQuestion(
            id = "${test.id}_q_${System.currentTimeMillis()}",
            testId = test.id,
            orderIndex = nextIndex,
            questionHi = "नया हिंदी प्रश्न यहाँ लिखें...",
            questionEn = "Enter English question text here...",
            optionsHi = listOf("विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"),
            optionsEn = listOf("Option A", "Option B", "Option C", "Option D"),
            correctOptionIndex = 0L,
            explanationHi = "हिंदी व्याख्या...",
            explanationEn = "English explanation...",
            subjectTag = test.topic.ifBlank { "CGPSC & CGSSB" },
            visibility = test.status.takeIf { it in listOf("draft", "published") } ?: "draft",
            createdBy = adminUid
        )
        saveEditedQuestion(blank)
    }

    fun deleteQuestion(questionId: String) {
        val test = _selectedTestForEdit.value ?: return
        viewModelScope.launch {
            _isBusy.value = true
            repository.deleteQuestionAdmin(test.id, questionId).onSuccess {
                val refreshed = repository.getAllQuestionsForTestAdmin(test.id).getOrDefault(emptyList())
                _editingQuestions.value = refreshed
                _adminFeedback.value = "Question deleted."
            }
            _isBusy.value = false
        }
    }

    fun updateTestMeta(updatedTest: TestSeriesItem) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.updateTestMetadataAdmin(updatedTest).onSuccess {
                _selectedTestForEdit.value = updatedTest
                _adminFeedback.value = "Test settings (Marks, Negative Marking, Timer & Paid/Free) updated."
            }.onFailure { e ->
                _adminFeedback.value = "Update failed: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun publishTestLive(testId: String) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.publishTestAndQuestionsAdmin(testId).onSuccess {
                _selectedTestForEdit.value = _selectedTestForEdit.value?.copy(status = "published")
                val refreshed = repository.getAllQuestionsForTestAdmin(testId).getOrDefault(emptyList())
                _editingQuestions.value = refreshed
                _adminFeedback.value = "Test Published Live to all CGpedia students!"
            }.onFailure { e ->
                _adminFeedback.value = "Publish failed: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun deleteTest(testId: String) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.deleteTestAdmin(testId).onSuccess {
                if (_selectedTestForEdit.value?.id == testId) {
                    closeTestEditor()
                }
                _adminFeedback.value = "Test deleted."
            }
            _isBusy.value = false
        }
    }

    fun saveExamFolder(folder: ExamFolder) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.saveExamFolderAdmin(folder).onSuccess {
                _adminFeedback.value = "Exam folder '${folder.titleEn}' saved."
            }.onFailure { e ->
                _adminFeedback.value = "Folder error: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun deleteExamFolder(folderId: String) {
        viewModelScope.launch {
            repository.deleteExamFolderAdmin(folderId).onSuccess {
                _adminFeedback.value = "Exam folder removed."
            }
        }
    }

    fun saveSubjectFolder(folder: SubjectFolder) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.saveSubjectFolderAdmin(folder).onSuccess {
                _adminFeedback.value = "Subject folder '${folder.titleEn}' saved."
            }.onFailure { e ->
                _adminFeedback.value = "Subject folder error: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun deleteSubjectFolder(folderId: String) {
        viewModelScope.launch {
            repository.deleteSubjectFolderAdmin(folderId).onSuccess {
                _adminFeedback.value = "Subject folder removed."
            }
        }
    }

    fun saveManualCurrentAffair(item: CurrentAffairItem) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.saveCurrentAffairsBatch(listOf(item.copy(sourceModule = "admin_curated")))
                .onSuccess {
                    _adminFeedback.value = "Current Affairs item published (24h story active)."
                }.onFailure { e ->
                    _adminFeedback.value = "Error saving news: ${e.localizedMessage}"
                }
            _isBusy.value = false
        }
    }

    fun saveBroadcastNotification(notification: BroadcastNotification) {
        if (notification.titleHi.isBlank() && notification.titleEn.isBlank()) {
            _adminFeedback.value = "Please enter a notification title."
            return
        }
        viewModelScope.launch {
            _isBusy.value = true
            repository.saveBroadcastNotificationAdmin(notification).onSuccess {
                _adminFeedback.value = "Broadcast notification sent to all students!"
            }.onFailure { e ->
                _adminFeedback.value = "Notification error: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun togglePinBroadcastNotification(notification: BroadcastNotification) {
        viewModelScope.launch {
            repository.togglePinNotificationAdmin(notification).onSuccess {
                _adminFeedback.value = if (!notification.isPinned) {
                    "Notification Pinned to top of student feed."
                } else {
                    "Notification Unpinned."
                }
            }
        }
    }

    fun deleteBroadcastNotification(notificationId: String) {
        viewModelScope.launch {
            repository.deleteBroadcastNotificationAdmin(notificationId).onSuccess {
                _adminFeedback.value = "Broadcast notification removed."
            }
        }
    }

    fun saveUpcomingTest(item: UpcomingTestItem) {
        if (item.titleHi.isBlank() && item.titleEn.isBlank()) {
            _adminFeedback.value = "Please enter the upcoming test series title."
            return
        }
        viewModelScope.launch {
            _isBusy.value = true
            repository.saveUpcomingTestAdmin(item).onSuccess {
                _adminFeedback.value = "Upcoming Test Series scheduled & published!"
            }.onFailure { e ->
                _adminFeedback.value = "Error saving upcoming test: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun deleteUpcomingTest(upcomingId: String) {
        viewModelScope.launch {
            repository.deleteUpcomingTestAdmin(upcomingId).onSuccess {
                _adminFeedback.value = "Upcoming test schedule removed."
            }
        }
    }

    fun replyToStudentQuery(query: StudentQuery, replyText: String, markResolved: Boolean = true) {
        if (replyText.isBlank()) {
            _adminFeedback.value = "Please enter a reply for the student."
            return
        }
        viewModelScope.launch {
            _isBusy.value = true
            repository.replyToStudentQueryAdmin(query, replyText, markResolved).onSuccess {
                _adminFeedback.value = "Reply sent privately to ${query.studentName}."
            }.onFailure { e ->
                _adminFeedback.value = "Reply failed: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun updateGlobalConfig(config: AppConfig) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.saveAppConfigAdmin(config).onSuccess {
                _adminFeedback.value = "Live Support Policy, WhatsApp & App Settings updated immediately!"
            }.onFailure { e ->
                _adminFeedback.value = "Config update error: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }

    fun uploadAnthemFile(bytes: ByteArray, mimeType: String, titleHi: String, titleEn: String) {
        viewModelScope.launch {
            _isBusy.value = true
            repository.uploadCustomAnthemAudioAdmin(bytes, mimeType, titleHi, titleEn).onSuccess { chunks ->
                _adminFeedback.value = "Custom CGpedia Anthem uploaded ($chunks chunks) & activated!"
            }.onFailure { e ->
                _adminFeedback.value = "Anthem upload failed: ${e.localizedMessage}"
            }
            _isBusy.value = false
        }
    }
}
