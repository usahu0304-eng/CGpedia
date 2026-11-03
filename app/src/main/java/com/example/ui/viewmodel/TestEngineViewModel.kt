package com.example.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.BilingualQuestion
import com.example.data.model.TestAttempt
import com.example.data.model.TestSeriesItem
import com.example.data.repository.CgpediaRepository
import kotlin.math.roundToInt
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class ActiveTestSession(
    val test: TestSeriesItem,
    val questions: List<BilingualQuestion>,
    val currentQuestionIndex: Int = 0,
    val selectedOptions: Map<String, Int> = emptyMap(),
    val markedForReview: Set<String> = emptySet(),
    val visitedQuestionIds: Set<String> = emptySet(),
    val remainingSeconds: Int = 0,
    val totalSeconds: Int = 0,
    val isLoading: Boolean = false,
    val isSubmitted: Boolean = false,
    val evaluatedAttempt: TestAttempt? = null,
    val errorMessage: String? = null
)

class TestEngineViewModel(
    private val repository: CgpediaRepository
) : ViewModel() {

    private val _session = MutableStateFlow<ActiveTestSession?>(null)
    val session: StateFlow<ActiveTestSession?> = _session.asStateFlow()

    private var timerJob: Job? = null

    fun startTest(test: TestSeriesItem) {
        timerJob?.cancel()
        val totalSecs = (test.durationMinutes.coerceIn(1L, 240L) * 60L).toInt()
        _session.value = ActiveTestSession(
            test = test,
            questions = emptyList(),
            remainingSeconds = totalSecs,
            totalSeconds = totalSecs,
            isLoading = true
        )

        viewModelScope.launch {
            val res = repository.getPublishedQuestionsForTest(test.id)
            res.onSuccess { list ->
                val limited = list.take(test.questionLimit.toInt().coerceIn(1, 100))
                if (limited.isEmpty()) {
                    _session.value = _session.value?.copy(
                        isLoading = false,
                        errorMessage = "No published questions found in this test yet."
                    )
                } else {
                    val firstId = limited.first().id
                    _session.value = _session.value?.copy(
                        questions = limited,
                        currentQuestionIndex = 0,
                        visitedQuestionIds = setOf(firstId),
                        isLoading = false,
                        errorMessage = null
                    )
                    startCountdown()
                }
            }.onFailure { err ->
                _session.value = _session.value?.copy(
                    isLoading = false,
                    errorMessage = err.localizedMessage ?: "Failed to load test questions."
                )
            }
        }
    }

    /**
     * Launches an instant quiz with preloaded Bilingual Questions (such as the Current Affairs Instant Quiz).
     */
    fun startPreloadedQuiz(test: TestSeriesItem, questions: List<BilingualQuestion>) {
        if (questions.isEmpty()) return
        timerJob?.cancel()
        val totalSecs = (test.durationMinutes.coerceIn(1L, 240L) * 60L).toInt()
        val firstId = questions.first().id
        _session.value = ActiveTestSession(
            test = test,
            questions = questions,
            currentQuestionIndex = 0,
            visitedQuestionIds = setOf(firstId),
            remainingSeconds = totalSecs,
            totalSeconds = totalSecs,
            isLoading = false,
            errorMessage = null
        )
        startCountdown()
    }

    private fun startCountdown() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (isActive) {
                delay(1000L)
                val cur = _session.value ?: break
                if (cur.isSubmitted) break
                val nextSec = cur.remainingSeconds - 1
                if (nextSec <= 0) {
                    _session.value = cur.copy(remainingSeconds = 0)
                    submitTest() // Auto-submit on timeout
                    break
                } else {
                    _session.value = cur.copy(remainingSeconds = nextSec)
                }
            }
        }
    }

    fun selectOption(questionId: String, optionIndex: Int) {
        val cur = _session.value ?: return
        if (cur.isSubmitted) return
        _session.value = cur.copy(
            selectedOptions = cur.selectedOptions + (questionId to optionIndex)
        )
    }

    fun clearResponse(questionId: String) {
        val cur = _session.value ?: return
        if (cur.isSubmitted) return
        _session.value = cur.copy(
            selectedOptions = cur.selectedOptions - questionId
        )
    }

    fun toggleMarkForReview(questionId: String) {
        val cur = _session.value ?: return
        if (cur.isSubmitted) return
        val updated = if (questionId in cur.markedForReview) {
            cur.markedForReview - questionId
        } else {
            cur.markedForReview + questionId
        }
        _session.value = cur.copy(markedForReview = updated)
    }

    fun jumpToQuestion(index: Int) {
        val cur = _session.value ?: return
        if (index !in cur.questions.indices) return
        val qId = cur.questions[index].id
        _session.value = cur.copy(
            currentQuestionIndex = index,
            visitedQuestionIds = cur.visitedQuestionIds + qId
        )
    }

    fun submitTest() {
        val cur = _session.value ?: return
        if (cur.isSubmitted || cur.questions.isEmpty()) return
        timerJob?.cancel()

        var correct = 0
        var incorrect = 0
        cur.questions.forEach { q ->
            val picked = cur.selectedOptions[q.id]
            if (picked != null) {
                if (picked.toLong() == q.correctOptionIndex) correct++ else incorrect++
            }
        }
        val attempted = correct + incorrect
        val rawScore = (correct * cur.test.marksPerQuestion) - (incorrect * cur.test.negativeMarking)
        val roundedScore = (rawScore * 100.0).roundToInt() / 100.0
        val maxScore = cur.questions.size * cur.test.marksPerQuestion
        val accuracy = if (attempted > 0) ((correct * 100.0) / attempted.toDouble()).roundToInt() else 0
        val elapsed = (cur.totalSeconds - cur.remainingSeconds).coerceAtLeast(1)

        val attempt = TestAttempt(
            testId = cur.test.id,
            testTitleHi = cur.test.titleHi,
            testTitleEn = cur.test.titleEn,
            totalQuestions = cur.questions.size.toLong(),
            attemptedCount = attempted.toLong(),
            correctCount = correct.toLong(),
            incorrectCount = incorrect.toLong(),
            score = roundedScore,
            maxScore = maxScore,
            accuracyPercent = accuracy.toLong(),
            timeTakenSeconds = elapsed.toLong(),
            selectedAnswers = cur.selectedOptions.mapValues { it.value.toLong() },
            status = "submitted"
        )

        _session.value = cur.copy(
            isSubmitted = true,
            evaluatedAttempt = attempt
        )

        viewModelScope.launch {
            repository.submitTestAttempt(attempt)
        }
    }

    fun exitSession() {
        timerJob?.cancel()
        _session.value = null
    }

    override fun onCleared() {
        timerJob?.cancel()
        super.onCleared()
    }
}
