package com.example.ui.screens

import android.view.WindowManager
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.outlined.Flag
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.BilingualQuestion
import com.example.data.model.BookmarkedQuestion
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.ExamReviewViolet
import com.example.ui.theme.NotoDevanagariFamily
import com.example.ui.viewmodel.ActiveTestSession
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun BilingualTestScreen(
    session: ActiveTestSession,
    bookmarks: List<BookmarkedQuestion>,
    onSelectOption: (questionId: String, optionIndex: Int) -> Unit,
    onClearResponse: (questionId: String) -> Unit,
    onToggleReview: (questionId: String) -> Unit,
    onJumpToQuestion: (index: Int) -> Unit,
    onToggleBookmark: (BilingualQuestion) -> Unit,
    onSubmitTest: () -> Unit,
    onExitTest: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var showPaletteSheet by remember { mutableStateOf(false) }
    var showSubmitConfirm by remember { mutableStateOf(false) }
    var showExitConfirm by remember { mutableStateOf(false) }
    var securityWarningToast by remember { mutableStateOf(false) }

    // Enforce anti-screenshot & anti-screen-recording protection on the host Window
    DisposableEffect(context) {
        val window = context.findHostActivity()?.window
        window?.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
        onDispose {
            // Keep FLAG_SECURE active on MainActivity window to protect test content
            window?.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        }
    }

    BackHandler {
        showExitConfirm = true
    }

    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top CBT Header Bar (Strictly Navy / Cobalt / Crimson — Zero Orange)
            // Submit button is safely located here in the top header bar, away from "Save & Next"
            Surface(
                color = MaterialTheme.colorScheme.primary,
                tonalElevation = 4.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .windowInsetsPadding(WindowInsets.statusBars)
                        .padding(horizontal = 10.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        IconButton(
                            onClick = { showExitConfirm = true },
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("cbt_exit_button")
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Exit Test",
                                tint = MaterialTheme.colorScheme.onPrimary
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = session.test.titleHi,
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimary,
                                maxLines = 1
                            )
                            Text(
                                text = session.test.titleEn,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f),
                                maxLines = 1
                            )
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        val isLowTime = session.remainingSeconds in 1..300
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = if (isLowTime) {
                                MaterialTheme.colorScheme.errorContainer
                            } else {
                                MaterialTheme.colorScheme.primaryContainer
                            }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Timer,
                                    contentDescription = "Remaining Time",
                                    tint = if (isLowTime) {
                                        MaterialTheme.colorScheme.onErrorContainer
                                    } else {
                                        MaterialTheme.colorScheme.onPrimaryContainer
                                    },
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = formatCountdown(session.remainingSeconds),
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isLowTime) {
                                        MaterialTheme.colorScheme.onErrorContainer
                                    } else {
                                        MaterialTheme.colorScheme.onPrimaryContainer
                                    },
                                    modifier = Modifier.testTag("cbt_countdown_timer")
                                )
                            }
                        }

                        IconButton(
                            onClick = { showPaletteSheet = true },
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("cbt_palette_button")
                        ) {
                            Icon(
                                imageVector = Icons.Filled.GridView,
                                contentDescription = "Open Question Palette",
                                tint = MaterialTheme.colorScheme.onPrimary
                            )
                        }

                        // SAFE SEPARATE LOCATION FOR SUBMIT BUTTON (Top Header Bar, far from Next Question)
                        Button(
                            onClick = { showSubmitConfirm = true },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = ExamAnsweredGreen,
                                contentColor = Color.White
                            ),
                            modifier = Modifier
                                .height(48.dp)
                                .testTag("cbt_submit_button")
                        ) {
                            Text(
                                text = "Submit",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Anti-Screenshot / Screen Recording & Content Protection Banner
            Surface(
                color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.7f),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("cbt_security_badge")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Security,
                            contentDescription = "Protected Content",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (securityWarningToast) {
                                "Copying, context menu & screenshots are disabled in Exam Mode"
                            } else {
                                "Protected Exam Mode • Screenshot, Recording & Copy Disabled"
                            },
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }
            }

            when {
                session.isLoading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator()
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Loading Bilingual Questions (हिंदी + English)...",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
                session.errorMessage != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize().padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = session.errorMessage,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodyLarge
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = onExitTest) {
                                Text("Return to Test Series")
                            }
                        }
                    }
                }
                session.questions.isNotEmpty() -> {
                    val qIndex = session.currentQuestionIndex.coerceIn(session.questions.indices)
                    val currentQ = session.questions[qIndex]
                    val selectedOpt = session.selectedOptions[currentQ.id]
                    val isMarkedReview = currentQ.id in session.markedForReview
                    val isBookmarked = bookmarks.any {
                        (it.questionId == currentQ.id && currentQ.id.isNotBlank()) ||
                            it.questionHi == currentQ.questionHi
                    }

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Column(modifier = Modifier.fillMaxWidth().widthIn(max = 720.dp)) {
                            // Question Metadata Strip
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = MaterialTheme.colorScheme.secondaryContainer
                                    ) {
                                        Text(
                                            text = "प्रश्न / Q ${qIndex + 1} of ${session.questions.size}",
                                            style = MaterialTheme.typography.labelLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                        )
                                    }
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = MaterialTheme.colorScheme.tertiaryContainer
                                    ) {
                                        Text(
                                            text = "+${session.test.marksPerQuestion} / -${session.test.negativeMarking}",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.onTertiaryContainer,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp)
                                        )
                                    }
                                }

                                IconButton(
                                    onClick = { onToggleBookmark(currentQ) },
                                    modifier = Modifier
                                        .size(48.dp)
                                        .testTag("cbt_bookmark_button")
                                ) {
                                    Icon(
                                        imageVector = if (isBookmarked) Icons.Filled.Bookmark else Icons.Filled.BookmarkBorder,
                                        contentDescription = "Bookmark Question",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // STRICT BILINGUAL QUESTION CARD: 1st Hindi (Devanagari), 2nd English
                            // Selection and long-press copy/context menu disabled
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .pointerInput(currentQ.id) {
                                        detectTapGestures(
                                            onLongPress = {
                                                securityWarningToast = true
                                            }
                                        )
                                    }
                                    .semantics {
                                        customActions = emptyList<CustomAccessibilityAction>()
                                    }
                                    .testTag("cbt_question_card"),
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surface
                                ),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                            ) {
                                Column(modifier = Modifier.fillMaxWidth().padding(18.dp)) {
                                    Text(
                                        text = currentQ.questionHi,
                                        fontFamily = NotoDevanagariFamily,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    HorizontalDivider(
                                        modifier = Modifier.padding(vertical = 10.dp),
                                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.25f)
                                    )
                                    Text(
                                        text = currentQ.questionEn,
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // 4 BILINGUAL OPTIONS: Strictly 1st Hindi, 2nd English directly below
                            val optionLabels = listOf("A", "B", "C", "D")
                            for (optIdx in 0 until 4) {
                                val optHi = currentQ.optionsHi.getOrElse(optIdx) { "-" }
                                val optEn = currentQ.optionsEn.getOrElse(optIdx) { "-" }
                                val isSelected = selectedOpt == optIdx

                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 10.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .clickable { onSelectOption(currentQ.id, optIdx) }
                                        .testTag("cbt_option_$optIdx"),
                                    shape = RoundedCornerShape(16.dp),
                                    border = BorderStroke(
                                        width = if (isSelected) 2.dp else 1.dp,
                                        color = if (isSelected) {
                                            MaterialTheme.colorScheme.primary
                                        } else {
                                            MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)
                                        }
                                    ),
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (isSelected) {
                                            MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f)
                                        } else {
                                            MaterialTheme.colorScheme.surface
                                        }
                                    )
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(14.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .clip(CircleShape)
                                                .background(
                                                    if (isSelected) {
                                                        MaterialTheme.colorScheme.primary
                                                    } else {
                                                        MaterialTheme.colorScheme.surfaceVariant
                                                    }
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = optionLabels[optIdx],
                                                style = MaterialTheme.typography.titleSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isSelected) {
                                                    MaterialTheme.colorScheme.onPrimary
                                                } else {
                                                    MaterialTheme.colorScheme.onSurfaceVariant
                                                }
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(12.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = optHi,
                                                fontFamily = NotoDevanagariFamily,
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.SemiBold,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            Spacer(modifier = Modifier.height(2.dp))
                                            Text(
                                                text = optEn,
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        if (isSelected) {
                                            Icon(
                                                imageVector = Icons.Filled.CheckCircle,
                                                contentDescription = "Selected",
                                                tint = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(22.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Bottom Question Navigation Bar (ONLY Previous & Save & Next — Submit moved to Top Bar & Palette)
                    Surface(
                        tonalElevation = 6.dp,
                        shadowElevation = 6.dp,
                        color = MaterialTheme.colorScheme.surface
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .windowInsetsPadding(WindowInsets.navigationBars)
                                .padding(horizontal = 14.dp, vertical = 10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                TextButton(
                                    onClick = { onToggleReview(currentQ.id) },
                                    modifier = Modifier.testTag("cbt_mark_review_button")
                                ) {
                                    Icon(
                                        imageVector = if (isMarkedReview) Icons.Filled.Flag else Icons.Outlined.Flag,
                                        contentDescription = null,
                                        tint = ExamReviewViolet,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = if (isMarkedReview) "Marked for Review" else "Mark for Review",
                                        color = ExamReviewViolet
                                    )
                                }

                                TextButton(
                                    onClick = { onClearResponse(currentQ.id) },
                                    enabled = selectedOpt != null,
                                    modifier = Modifier.testTag("cbt_clear_response_button")
                                ) {
                                    Text("Clear Response")
                                }
                            }

                            Spacer(modifier = Modifier.height(6.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                OutlinedButton(
                                    onClick = { onJumpToQuestion(qIndex - 1) },
                                    enabled = qIndex > 0,
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(48.dp)
                                        .testTag("cbt_prev_button")
                                ) {
                                    Icon(
                                        Icons.AutoMirrored.Filled.ArrowBack,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Previous")
                                }

                                if (qIndex < session.questions.lastIndex) {
                                    FilledTonalButton(
                                        onClick = { onJumpToQuestion(qIndex + 1) },
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(48.dp)
                                            .testTag("cbt_next_button")
                                    ) {
                                        Text("Save & Next")
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Icon(
                                            Icons.AutoMirrored.Filled.ArrowForward,
                                            contentDescription = null,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                } else {
                                    FilledTonalButton(
                                        onClick = { showPaletteSheet = true },
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(48.dp)
                                            .testTag("cbt_next_button")
                                    ) {
                                        Icon(
                                            Icons.Filled.GridView,
                                            contentDescription = null,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Review Palette")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showPaletteSheet) {
        ModalBottomSheet(onDismissRequest = { showPaletteSheet = false }) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Text(
                    text = "Interactive Question Palette",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    PaletteLegendDot("Answered (${session.selectedOptions.size})", ExamAnsweredGreen)
                    PaletteLegendDot("Review (${session.markedForReview.size})", ExamReviewViolet)
                    PaletteLegendDot(
                        "Unanswered (${session.questions.size - session.selectedOptions.size})",
                        MaterialTheme.colorScheme.secondary
                    )
                }
                Spacer(modifier = Modifier.height(14.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    content = {
                        session.questions.forEachIndexed { idx, q ->
                            val isAns = session.selectedOptions.containsKey(q.id)
                            val isRev = q.id in session.markedForReview
                            val isVis = q.id in session.visitedQuestionIds
                            val bg = when {
                                isRev -> ExamReviewViolet
                                isAns -> ExamAnsweredGreen
                                isVis -> MaterialTheme.colorScheme.secondaryContainer
                                else -> MaterialTheme.colorScheme.surfaceVariant
                            }
                            val fg = when {
                                isRev || isAns -> Color.White
                                isVis -> MaterialTheme.colorScheme.onSecondaryContainer
                                else -> MaterialTheme.colorScheme.onSurfaceVariant
                            }
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(bg)
                                    .clickable {
                                        onJumpToQuestion(idx)
                                        showPaletteSheet = false
                                    }
                                    .testTag("palette_q_$idx"),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${idx + 1}",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = fg
                                )
                            }
                        }
                    }
                )
                Spacer(modifier = Modifier.height(18.dp))
                Button(
                    onClick = {
                        showPaletteSheet = false
                        showSubmitConfirm = true
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ExamAnsweredGreen,
                        contentColor = Color.White
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .testTag("palette_submit_test_button")
                ) {
                    Text("Submit Final Test • टेस्ट सबमिट करें", fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    if (showSubmitConfirm) {
        val answered = session.selectedOptions.size
        val unanswered = (session.questions.size - answered).coerceAtLeast(0)
        AlertDialog(
            onDismissRequest = { showSubmitConfirm = false },
            title = { Text("Submit Bilingual Test?") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Are you sure you want to submit this test for final evaluation?")
                    Text("Total Questions: ${session.questions.size}")
                    Text("Answered: $answered")
                    Text("Unanswered: $unanswered")
                    Text("Marked for Review: ${session.markedForReview.size}")
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showSubmitConfirm = false
                        onSubmitTest()
                    },
                    modifier = Modifier.testTag("confirm_submit_test_button")
                ) {
                    Text("Submit & Evaluate")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showSubmitConfirm = false }) {
                    Text("Continue Test")
                }
            }
        )
    }

    if (showExitConfirm) {
        AlertDialog(
            onDismissRequest = { showExitConfirm = false },
            title = { Text("Leave Active Test?") },
            text = { Text("Your unsubmitted responses in this session will be discarded.") },
            confirmButton = {
                Button(
                    onClick = {
                        showExitConfirm = false
                        onExitTest()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Exit Test")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showExitConfirm = false }) {
                    Text("Stay")
                }
            }
        )
    }
}

@Composable
private fun PaletteLegendDot(label: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(12.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(text = label, style = MaterialTheme.typography.labelSmall)
    }
}

private fun formatCountdown(seconds: Int): String {
    val hrs = seconds / 3600
    val mins = (seconds % 3600) / 60
    val secs = seconds % 60
    return if (hrs > 0) {
        String.format(Locale.US, "%02d:%02d:%02d", hrs, mins, secs)
    } else {
        String.format(Locale.US, "%02d:%02d", mins, secs)
    }
}
