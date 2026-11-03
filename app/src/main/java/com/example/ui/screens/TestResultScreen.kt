package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.BilingualQuestion
import com.example.data.model.BookmarkedQuestion
import com.example.data.model.TestAttempt
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.NotoDevanagariFamily
import com.example.ui.viewmodel.ActiveTestSession

@Composable
fun TestResultScreen(
    session: ActiveTestSession,
    attempt: TestAttempt,
    bookmarks: List<BookmarkedQuestion>,
    onToggleBookmark: (BilingualQuestion) -> Unit,
    onCloseResult: () -> Unit,
    modifier: Modifier = Modifier
) {
    var activeFilter by rememberSaveable { mutableStateOf("ALL") }

    BackHandler {
        onCloseResult()
    }

    val filteredIndexed = session.questions.mapIndexed { idx, q -> idx to q }.filter { (_, q) ->
        val picked = session.selectedOptions[q.id]
        when (activeFilter) {
            "CORRECT" -> picked != null && picked.toLong() == q.correctOptionIndex
            "INCORRECT" -> picked != null && picked.toLong() != q.correctOptionIndex
            "SKIPPED" -> picked == null
            else -> true
        }
    }

    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Surface(
                color = MaterialTheme.colorScheme.primary,
                tonalElevation = 4.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .windowInsetsPadding(WindowInsets.statusBars)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onCloseResult,
                        modifier = Modifier
                            .size(48.dp)
                            .testTag("result_back_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back to Home",
                            tint = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "परीक्षा परिणाम एवं विस्तृत व्याख्या • Evaluation",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Text(
                            text = session.test.titleEn,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f),
                            maxLines = 1
                        )
                    }
                }
            }

            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item {
                    ScorecardBanner(attempt = attempt)
                }

                item {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        val skipped = (attempt.totalQuestions - attempt.attemptedCount).coerceAtLeast(0L)
                        FilterChip(
                            selected = activeFilter == "ALL",
                            onClick = { activeFilter = "ALL" },
                            label = { Text("All (${attempt.totalQuestions})") }
                        )
                        FilterChip(
                            selected = activeFilter == "CORRECT",
                            onClick = { activeFilter = "CORRECT" },
                            label = { Text("Correct (${attempt.correctCount})") }
                        )
                        FilterChip(
                            selected = activeFilter == "INCORRECT",
                            onClick = { activeFilter = "INCORRECT" },
                            label = { Text("Wrong (${attempt.incorrectCount})") }
                        )
                        FilterChip(
                            selected = activeFilter == "SKIPPED",
                            onClick = { activeFilter = "SKIPPED" },
                            label = { Text("Skipped ($skipped)") }
                        )
                    }
                }

                itemsIndexed(filteredIndexed, key = { _, pair -> pair.second.id }) { _, (origIndex, q) ->
                    val picked = session.selectedOptions[q.id]
                    val isBookmarked = bookmarks.any {
                        (it.questionId == q.id && q.id.isNotBlank()) || it.questionHi == q.questionHi
                    }
                    BilingualSolutionCard(
                        questionNumber = origIndex + 1,
                        question = q,
                        pickedOption = picked,
                        isBookmarked = isBookmarked,
                        onToggleBookmark = { onToggleBookmark(q) }
                    )
                }

                item {
                    Button(
                        onClick = onCloseResult,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("result_done_button")
                    ) {
                        Text("Back to Test Series Dashboard")
                    }
                }
            }
        }
    }
}

@Composable
private fun ScorecardBanner(attempt: TestAttempt) {
    val mins = attempt.timeTakenSeconds / 60
    val secs = attempt.timeTakenSeconds % 60
    val skipped = (attempt.totalQuestions - attempt.attemptedCount).coerceAtLeast(0L)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("result_scorecard"),
        shape = RoundedCornerShape(22.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.horizontalGradient(
                        listOf(
                            MaterialTheme.colorScheme.primary,
                            MaterialTheme.colorScheme.secondary
                        )
                    )
                )
                .padding(20.dp)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        Text(
                            text = "Final Score • कुल प्राप्तांक",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.88f)
                        )
                        Text(
                            text = "${attempt.score} / ${attempt.maxScore}",
                            style = MaterialTheme.typography.displaySmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                    Icon(
                        imageVector = Icons.Filled.WorkspacePremium,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.tertiaryContainer,
                        modifier = Modifier.size(44.dp)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    MetricPill("Accuracy", "${attempt.accuracyPercent}%")
                    MetricPill("Correct", "${attempt.correctCount}")
                    MetricPill("Wrong", "${attempt.incorrectCount}")
                    MetricPill("Skipped", "$skipped")
                    MetricPill("Time", "${mins}m ${secs}s")
                }
            }
        }
    }
}

@Composable
private fun MetricPill(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onPrimary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.82f)
        )
    }
}

@Composable
private fun BilingualSolutionCard(
    questionNumber: Int,
    question: BilingualQuestion,
    pickedOption: Int?,
    isBookmarked: Boolean,
    onToggleBookmark: () -> Unit
) {
    val correctIdx = question.correctOptionIndex.toInt().coerceIn(0, 3)
    val optionLabels = listOf("A", "B", "C", "D")

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("solution_card_$questionNumber"),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                val statusText = when {
                    pickedOption == null -> "Unattempted • अनुत्तरित"
                    pickedOption == correctIdx -> "Correct • सही उत्तर"
                    else -> "Incorrect • गलत उत्तर"
                }
                val statusColor = when {
                    pickedOption == null -> MaterialTheme.colorScheme.secondary
                    pickedOption == correctIdx -> ExamAnsweredGreen
                    else -> MaterialTheme.colorScheme.error
                }

                Text(
                    text = "Q$questionNumber • $statusText",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = statusColor
                )

                IconButton(onClick = onToggleBookmark, modifier = Modifier.size(48.dp)) {
                    Icon(
                        imageVector = if (isBookmarked) Icons.Filled.Bookmark else Icons.Filled.BookmarkBorder,
                        contentDescription = "Save Question",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // 1st Hindi Devanagari, 2nd English
            Text(
                text = question.questionHi,
                fontFamily = NotoDevanagariFamily,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = question.questionEn,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(12.dp))

            for (idx in 0 until 4) {
                val isCorrectOpt = idx == correctIdx
                val isWrongPick = pickedOption == idx && !isCorrectOpt
                val borderColor = when {
                    isCorrectOpt -> ExamAnsweredGreen
                    isWrongPick -> MaterialTheme.colorScheme.error
                    else -> MaterialTheme.colorScheme.outline.copy(alpha = 0.25f)
                }
                val containerColor = when {
                    isCorrectOpt -> ExamAnsweredGreen.copy(alpha = 0.12f)
                    isWrongPick -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.55f)
                    else -> Color.Transparent
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, borderColor),
                    color = containerColor,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${optionLabels[idx]}.",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.width(26.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = question.optionsHi.getOrElse(idx) { "-" },
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = question.optionsEn.getOrElse(idx) { "-" },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        if (isCorrectOpt) {
                            Icon(
                                imageVector = Icons.Filled.CheckCircle,
                                contentDescription = "Correct Answer",
                                tint = ExamAnsweredGreen,
                                modifier = Modifier.size(20.dp)
                            )
                        } else if (isWrongPick) {
                            Icon(
                                imageVector = Icons.Filled.Cancel,
                                contentDescription = "Your Wrong Pick",
                                tint = MaterialTheme.colorScheme.error,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Verified Bilingual Explanation Box (1st Hindi, 2nd English)
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Lightbulb,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "विस्तृत प्रमाणित व्याख्या • Verified Explanation",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = question.explanationHi,
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = 8.dp),
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.25f)
                    )
                    Text(
                        text = question.explanationEn,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
