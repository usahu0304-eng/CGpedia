package com.example.ui.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.ai.CgpediaAiService
import com.example.data.model.AppConfig
import com.example.data.model.BilingualQuestion
import com.example.data.model.ExamFolder
import com.example.data.model.PurchaseRecord
import com.example.data.model.SubjectFolder
import com.example.data.model.TestSeriesItem
import com.example.data.model.UserProfile
import com.example.data.repository.CgpediaRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class AdminAiGenerationProgress(
    val isGenerating: Boolean = false,
    val generatedCount: Int = 0,
    val targetCount: Int = 0,
    val currentBatch: Int = 0,
    val totalBatches: Int = 0,
    val statusMessage: String = "Generating questions, please wait...",
    val errorMessage: String? = null,
    val createdDraftTestId: String? = null
) {
    val progressFraction: Float
        get() = if (targetCount > 0) {
            (generatedCount.toFloat() / targetCount.toFloat()).coerceIn(0f, 1f)
        } else 0f
}

class AdminViewModel(
    private val repository: CgpediaRepository,
    private val aiService: CgpediaAiService,
    private val adminUid: String
) : ViewModel() {

    private val _genProgress = MutableStateFlow(AdminAiGenerationProgress())
    val genProgress: StateFlow<AdminAiGenerationProgress> = _genProgress.asStateFlow()

    private val _selectedTestForEdit = MutableStateFlow<TestSeriesItem?>(null)
    val selectedTestForEdit: StateFlow<TestSeriesItem?> = _selectedTestForEdit.asStateFlow()

    private val _editingQuestions = MutableStateFlow<List<BilingualQuestion>>(emptyList())
    val editingQuestions: StateFlow<List<BilingualQuestion>> = _editingQuestions.asStateFlow()

    private val _adminFeedback = MutableStateFlow<String?>(null)
    val adminFeedback: StateFlow<String?> = _adminFeedback.asStateFlow()

    private val _isUploadingAnthem = MutableStateFlow(false)
    val isUploadingAnthem: StateFlow<Boolean> = _isUploadingAnthem.asStateFlow()

    val allTests: StateFlow<List<TestSeriesItem>> = repository.observeAllTestsForAdmin()
        .catch { e ->
            Log.w(TAG, "Error observing admin tests", e)
            emit(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), emptyList())

    val allUsers: StateFlow<List<UserProfile>> = repository.observeAllUsersForAdmin()
        .catch { e ->
            Log.w(TAG, "Error observing registered users for admin", e)
            emit(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000L), emptyList())

    private val _isGrantingAccess = MutableStateFlow(false)
    val isGrantingAccess: StateFlow<Boolean> = _isGrantingAccess.asStateFlow()

    fun generateDraftTestSeries(
        folderType: String,
        folderId: String,
        folderName: String,
        titleHi: String,
        titleEn: String,
        topic: String,
        difficulty: String,
        questionCount: Int,
        durationMinutes: Int,
        isPaid: Boolean,
        priceInr: Long
    ) {
        if (_genProgress.value.isGenerating) return
        val clampedCount = questionCount.coerceIn(1, 100)
        val estimatedBatches = (clampedCount + 14) / 15

        viewModelScope.launch {
            _genProgress.value = AdminAiGenerationProgress(
                isGenerating = true,
                generatedCount = 0,
                targetCount = clampedCount,
                currentBatch = 1,
                totalBatches = estimatedBatches,
                statusMessage = "Generating questions, please wait..."
            )
            val tempTestId = "test_${System.currentTimeMillis()}"
            val aiResult = aiService.generateBilingualTestQuestions(
                examOrSubjectName = folderName,
                topic = topic,
                difficulty = difficulty,
                totalQuestions = clampedCount,
                testId = tempTestId,
                adminUid = adminUid,
                onBatchProgress = { done, total, batch, batches ->
                    _genProgress.value = _genProgress.value.copy(
                        generatedCount = done,
                        targetCount = total,
                        currentBatch = batch,
                        totalBatches = batches,
                        statusMessage = "Generating questions, please wait..."
                    )
                }
            )

            aiResult.onSuccess { generatedQuestions ->
                _genProgress.value = _genProgress.value.copy(
                    generatedCount = generatedQuestions.size,
                    statusMessage = "Generating questions, please wait... Saving draft to cloud..."
                )
                val draftMeta = TestSeriesItem(
                    id = tempTestId,
                    folderType = folderType,
                    folderId = folderId,
                    titleHi = titleHi.ifBlank { "$topic मॉक टेस्ट" },
                    titleEn = titleEn.ifBlank { "$topic Mock Test" },
                    topic = topic,
                    difficulty = difficulty,
                    durationMinutes = durationMinutes.coerceIn(1, 240).toLong(),
                    questionLimit = clampedCount.toLong(),
                    questionCount = generatedQuestions.size.toLong(),
                    marksPerQuestion = 2.0,
                    negativeMarking = 0.66,
                    isPaid = isPaid,
                    priceInr = if (isPaid) priceInr.coerceAtLeast(1L) else 0L,
                    status = "draft",
                    createdBy = adminUid
                )
                val saveRes = repository.createDraftTestWithQuestionsAdmin(draftMeta, generatedQuestions)
                saveRes.onSuccess { savedId ->
                    _genProgress.value = AdminAiGenerationProgress(
                        isGenerating = false,
                        generatedCount = generatedQuestions.size,
                        targetCount = clampedCount,
                        currentBatch = estimatedBatches,
                        totalBatches = estimatedBatches,
                        createdDraftTestId = savedId
                    )
                    _adminFeedback.value = "Draft created with ${generatedQuestions.size} bilingual questions! Review & click Publish when ready."
                    openTestForEdit(draftMeta.copy(id = savedId))
                }.onFailure { err ->
                    _genProgress.value = AdminAiGenerationProgress(
                        isGenerating = false,
                        errorMessage = err.localizedMessage ?: "Failed to save draft test to Firestore."
                    )
                }
            }.onFailure { err ->
                _genProgress.value = AdminAiGenerationProgress(
                    isGenerating = false,
                    errorMessage = err.localizedMessage ?: "AI Test Generation failed."
                )
            }
        }
    }

    fun openTestForEdit(test: TestSeriesItem) {
        _selectedTestForEdit.value = test
        viewModelScope.launch {
            repository.observeQuestionsForAdmin(test.id)
                .catch { e -> Log.e(TAG, "Failed observing draft questions", e) }
                .collect { list ->
                    if (_selectedTestForEdit.value?.id == test.id) {
                        _editingQuestions.value = list
                    }
                }
        }
    }

    fun closeTestEditor() {
        _selectedTestForEdit.value = null
        _editingQuestions.value = emptyList()
    }

    fun saveTestSettingsOrPublish(updatedTest: TestSeriesItem, publishNow: Boolean) {
        viewModelScope.launch {
            val res = repository.updateTestSettingsAndStatusAdmin(updatedTest, publishNow)
            res.onSuccess {
                val newState = if (publishNow) updatedTest.copy(status = "published") else updatedTest
                _selectedTestForEdit.value = newState
                _adminFeedback.value = if (publishNow) {
                    "Test is now LIVE and Published for all students!"
                } else {
                    "Draft test settings saved."
                }
            }.onFailure { err ->
                _adminFeedback.value = err.localizedMessage ?: "Failed to update test."
            }
        }
    }

    fun saveQuestionInEditor(question: BilingualQuestion) {
        val parent = _selectedTestForEdit.value ?: return
        viewModelScope.launch {
            val res = repository.saveSingleQuestionAdmin(question, parent.status)
            res.onSuccess {
                _adminFeedback.value = "Bilingual question saved."
            }.onFailure { err ->
                _adminFeedback.value = err.localizedMessage ?: "Failed to save question."
            }
        }
    }

    fun deleteQuestionInEditor(questionId: String) {
        val parent = _selectedTestForEdit.value ?: return
        viewModelScope.launch {
            repository.deleteQuestionAdmin(questionId, parent.id)
                .onSuccess { _adminFeedback.value = "Question deleted." }
                .onFailure { _adminFeedback.value = it.localizedMessage }
        }
    }

    fun deleteEntireTest(testId: String) {
        viewModelScope.launch {
            repository.deleteTestAdmin(testId)
                .onSuccess {
                    if (_selectedTestForEdit.value?.id == testId) closeTestEditor()
                    _adminFeedback.value = "Test deleted."
                }
                .onFailure { _adminFeedback.value = it.localizedMessage }
        }
    }

    // --- Folder CRUD ---
    fun saveExamFolder(folder: ExamFolder) {
        viewModelScope.launch {
            repository.saveExamFolderAdmin(folder)
                .onSuccess { _adminFeedback.value = "Exam folder saved." }
                .onFailure { _adminFeedback.value = it.localizedMessage }
        }
    }

    fun deleteExamFolder(folderId: String) {
        viewModelScope.launch {
            repository.deleteExamFolderAdmin(folderId)
                .onSuccess { _adminFeedback.value = "Exam folder deleted." }
                .onFailure { _adminFeedback.value = it.localizedMessage }
        }
    }

    fun saveSubjectFolder(folder: SubjectFolder) {
        viewModelScope.launch {
            repository.saveSubjectFolderAdmin(folder)
                .onSuccess { _adminFeedback.value = "Subject folder saved." }
                .onFailure { _adminFeedback.value = it.localizedMessage }
        }
    }

    fun deleteSubjectFolder(folderId: String) {
        viewModelScope.launch {
            repository.deleteSubjectFolderAdmin(folderId)
                .onSuccess { _adminFeedback.value = "Subject folder deleted." }
                .onFailure { _adminFeedback.value = it.localizedMessage }
        }
    }

    // --- Anthem Song Manager ---
    fun uploadAnthemFile(
        bytes: ByteArray,
        mimeType: String,
        titleHi: String,
        titleEn: String
    ) {
        viewModelScope.launch {
            _isUploadingAnthem.value = true
            repository.uploadAnthemBytesAdmin(bytes, mimeType, titleHi, titleEn)
                .onSuccess {
                    _adminFeedback.value = "New CGpedia Anthem uploaded & synced to all students!"
                }
                .onFailure { err ->
                    _adminFeedback.value = err.localizedMessage ?: "Failed to upload anthem."
                }
            _isUploadingAnthem.value = false
        }
    }

    fun updateAnthemConfig(config: AppConfig) {
        viewModelScope.launch {
            repository.saveAppConfigAdmin(config)
                .onSuccess {
                    _adminFeedback.value = "App Update (v${config.latestVersionName} #${config.latestVersionCode}), Support Policy & WhatsApp (${config.whatsappSupportNumber}) saved & published!"
                }
                .onFailure {
                    _adminFeedback.value = it.localizedMessage ?: "Failed to save configuration."
                }
        }
    }

    fun grantStudentPaidAccess(
        studentIdentifier: String,
        itemId: String,
        titleHi: String,
        titleEn: String,
        amountInr: Long
    ) {
        if (_isGrantingAccess.value) return
        viewModelScope.launch {
            _isGrantingAccess.value = true
            repository.grantPaidAccessByAdmin(
                studentIdentifier = studentIdentifier,
                itemId = itemId,
                titleHi = titleHi,
                titleEn = titleEn,
                amountInr = amountInr
            ).onSuccess { msg ->
                _adminFeedback.value = msg
            }.onFailure { err ->
                _adminFeedback.value = err.localizedMessage ?: "Failed to unlock access for student."
            }
            _isGrantingAccess.value = false
        }
    }

    fun revokeStudentPaidAccess(targetUserId: String, purchaseId: String) {
        viewModelScope.launch {
            repository.revokePaidAccessByAdmin(targetUserId, purchaseId)
                .onSuccess { _adminFeedback.value = "Access revoked for student ($targetUserId)." }
                .onFailure { _adminFeedback.value = it.localizedMessage ?: "Failed to revoke access." }
        }
    }

    fun observeStudentPurchases(targetUserId: String): Flow<List<PurchaseRecord>> =
        repository.observeStudentPurchasesForAdmin(targetUserId)

    fun deleteCurrentAffair(articleId: String) {
        viewModelScope.launch {
            repository.deleteCurrentAffairAdmin(articleId)
                .onSuccess { _adminFeedback.value = "Current Affairs item removed." }
        }
    }

    fun clearFeedback() {
        _adminFeedback.value = null
    }

    companion object {
        private const val TAG = "AdminVM"
    }
}
