package com.example.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Publish
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.BilingualQuestion
import com.example.data.model.TestSeriesItem
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.NotoDevanagariFamily

@Composable
fun AdminTestEditorView(
    test: TestSeriesItem,
    questions: List<BilingualQuestion>,
    onBack: () -> Unit,
    onSaveTestMeta: (TestSeriesItem) -> Unit,
    onPublishLive: () -> Unit,
    onAddQuestion: () -> Unit,
    onSaveQuestion: (BilingualQuestion) -> Unit,
    onDeleteQuestion: (String) -> Unit,
    onDeleteTest: () -> Unit
) {
    var titleHi by remember(test.id) { mutableStateOf(test.titleHi) }
    var titleEn by remember(test.id) { mutableStateOf(test.titleEn) }
    var durationStr by remember(test.id) { mutableStateOf(test.durationMinutes.toString()) }
    var limitStr by remember(test.id) { mutableStateOf(test.questionLimit.toString()) }
    var marksPerQStr by remember(test.id) { mutableStateOf(test.marksPerQuestion.toString()) }
    var negMarkingStr by remember(test.id) { mutableStateOf(test.negativeMarking.toString()) }
    var validityDaysStr by remember(test.id) { mutableStateOf(test.validityDays.toString()) }
    var isPaid by remember(test.id, test.isPaid) { mutableStateOf(test.isPaid) }
    var priceStr by remember(test.id, test.priceInr) { mutableStateOf(test.priceInr.toString()) }

    Column(modifier = Modifier.fillMaxSize()) {
        // Editor Header
        Surface(
            color = MaterialTheme.colorScheme.secondaryContainer,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.testTag("editor_back_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back to Admin")
                    }
                    Column {
                        Text(
                            text = "Test Editor • ${test.status.uppercase()}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Text(
                            text = "${questions.size} Bilingual Questions • +${test.marksPerQuestion} / -${test.negativeMarking}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }

                Button(
                    onClick = onPublishLive,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ExamAnsweredGreen,
                        contentColor = Color.White
                    ),
                    modifier = Modifier.testTag("editor_publish_live_button")
                ) {
                    Icon(Icons.Filled.Publish, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Publish Live", fontWeight = FontWeight.Bold)
                }
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Test Metadata, Marks, Negative Marking, Timer & Paid/Free Customization Card
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Test Configuration (Titles, Marks, Negative Marking, Timer & Paid/Free)",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        OutlinedTextField(
                            value = titleHi,
                            onValueChange = { titleHi = it },
                            label = { Text("Hindi Title (1st Language)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("editor_title_hi")
                        )

                        OutlinedTextField(
                            value = titleEn,
                            onValueChange = { titleEn = it },
                            label = { Text("English Title (2nd Language)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("editor_title_en")
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = durationStr,
                                onValueChange = { durationStr = it.filter(Char::isDigit) },
                                label = { Text("Timer (Minutes)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f).testTag("editor_duration_input")
                            )
                            OutlinedTextField(
                                value = limitStr,
                                onValueChange = { limitStr = it.filter(Char::isDigit) },
                                label = { Text("Max Q Limit (1-100)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f).testTag("editor_limit_input")
                            )
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = marksPerQStr,
                                onValueChange = { marksPerQStr = it },
                                label = { Text("Marks / Question (e.g. 2.0)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f).testTag("editor_marks_per_q_input")
                            )
                            OutlinedTextField(
                                value = negMarkingStr,
                                onValueChange = { negMarkingStr = it },
                                label = { Text("Negative Mark (e.g. 0.66)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f).testTag("editor_negative_marking_input")
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Paid Test Series Toggle", fontWeight = FontWeight.SemiBold)
                                Text(
                                    text = if (isPaid) "Students must unlock or be activated by Admin" else "Free Open Mock Test for all students",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = isPaid,
                                onCheckedChange = { isPaid = it },
                                modifier = Modifier.testTag("editor_paid_switch")
                            )
                        }

                        if (isPaid) {
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                OutlinedTextField(
                                    value = priceStr,
                                    onValueChange = { priceStr = it.filter(Char::isDigit) },
                                    label = { Text("Price (INR ₹)") },
                                    singleLine = true,
                                    modifier = Modifier.weight(1f).testTag("editor_price_input")
                                )
                                OutlinedTextField(
                                    value = validityDaysStr,
                                    onValueChange = { validityDaysStr = it.filter(Char::isDigit) },
                                    label = { Text("Validity (Days)") },
                                    singleLine = true,
                                    modifier = Modifier.weight(1f).testTag("editor_validity_days_input")
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            OutlinedButton(
                                onClick = onDeleteTest,
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = MaterialTheme.colorScheme.error
                                ),
                                modifier = Modifier.testTag("editor_delete_test_button")
                            ) {
                                Icon(Icons.Filled.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Delete Test")
                            }

                            FilledTonalButton(
                                onClick = {
                                    onSaveTestMeta(
                                        test.copy(
                                            titleHi = titleHi,
                                            titleEn = titleEn,
                                            durationMinutes = (durationStr.toLongOrNull() ?: 30L).coerceIn(1L, 240L),
                                            questionLimit = (limitStr.toLongOrNull() ?: 10L).coerceIn(1L, 100L),
                                            marksPerQuestion = (marksPerQStr.toDoubleOrNull() ?: 2.0).coerceIn(0.5, 10.0),
                                            negativeMarking = (negMarkingStr.toDoubleOrNull() ?: 0.66).coerceIn(0.0, 5.0),
                                            isPaid = isPaid,
                                            priceInr = if (isPaid) (priceStr.toLongOrNull() ?: 99L).coerceAtLeast(1L) else 0L,
                                            validityDays = (validityDaysStr.toLongOrNull() ?: 180L).coerceIn(1L, 3650L)
                                        )
                                    )
                                },
                                modifier = Modifier.testTag("editor_save_meta_button")
                            ) {
                                Icon(Icons.Filled.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Save Test Settings")
                            }
                        }
                    }
                }
            }

            // 2. Add New Question Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Bilingual Questions (${questions.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    FilledTonalButton(
                        onClick = onAddQuestion,
                        modifier = Modifier.testTag("editor_add_question_button")
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add New Question")
                    }
                }
            }

            // 3. Editable Question Cards
            itemsIndexed(questions, key = { _, q -> q.id }) { idx, question ->
                EditableBilingualQuestionCard(
                    index = idx,
                    question = question,
                    onSave = onSaveQuestion,
                    onDelete = { onDeleteQuestion(question.id) }
                )
            }
        }
    }
}

@Composable
private fun EditableBilingualQuestionCard(
    index: Int,
    question: BilingualQuestion,
    onSave: (BilingualQuestion) -> Unit,
    onDelete: () -> Unit
) {
    var qHi by remember(question.id, question.questionHi) { mutableStateOf(question.questionHi) }
    var qEn by remember(question.id, question.questionEn) { mutableStateOf(question.questionEn) }
    var optHi0 by remember(question.id) { mutableStateOf(question.optionsHi.getOrElse(0) { "" }) }
    var optHi1 by remember(question.id) { mutableStateOf(question.optionsHi.getOrElse(1) { "" }) }
    var optHi2 by remember(question.id) { mutableStateOf(question.optionsHi.getOrElse(2) { "" }) }
    var optHi3 by remember(question.id) { mutableStateOf(question.optionsHi.getOrElse(3) { "" }) }

    var optEn0 by remember(question.id) { mutableStateOf(question.optionsEn.getOrElse(0) { "" }) }
    var optEn1 by remember(question.id) { mutableStateOf(question.optionsEn.getOrElse(1) { "" }) }
    var optEn2 by remember(question.id) { mutableStateOf(question.optionsEn.getOrElse(2) { "" }) }
    var optEn3 by remember(question.id) { mutableStateOf(question.optionsEn.getOrElse(3) { "" }) }

    var correctIdx by remember(question.id, question.correctOptionIndex) {
        mutableLongStateOf(question.correctOptionIndex)
    }
    var expHi by remember(question.id, question.explanationHi) { mutableStateOf(question.explanationHi) }
    var expEn by remember(question.id, question.explanationEn) { mutableStateOf(question.explanationEn) }

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("editor_question_card_$index")
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Text(
                        text = "Q.${index + 1} • ${question.visibility.uppercase()}",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }

                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.testTag("editor_delete_q_$index")
                ) {
                    Icon(
                        imageVector = Icons.Filled.Delete,
                        contentDescription = "Delete Question",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }

            OutlinedTextField(
                value = qHi,
                onValueChange = { qHi = it },
                label = { Text("1. प्रश्न (हिंदी - देवनागरी)") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = qEn,
                onValueChange = { qEn = it },
                label = { Text("2. Question (English)") },
                modifier = Modifier.fillMaxWidth()
            )

            HorizontalDivider()

            Text(
                text = "Options (Select RadioButton for Correct Answer):",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.secondary
            )

            val hiRefs = listOf(
                optHi0 to { v: String -> optHi0 = v },
                optHi1 to { v: String -> optHi1 = v },
                optHi2 to { v: String -> optHi2 = v },
                optHi3 to { v: String -> optHi3 = v }
            )
            val enRefs = listOf(
                optEn0 to { v: String -> optEn0 = v },
                optEn1 to { v: String -> optEn1 = v },
                optEn2 to { v: String -> optEn2 = v },
                optEn3 to { v: String -> optEn3 = v }
            )
            val letters = listOf("A", "B", "C", "D")

            for (i in 0..3) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = correctIdx == i.toLong(),
                        onClick = { correctIdx = i.toLong() }
                    )
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        OutlinedTextField(
                            value = hiRefs[i].first,
                            onValueChange = hiRefs[i].second,
                            label = { Text("Option ${letters[i]} (Hindi)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = enRefs[i].first,
                            onValueChange = enRefs[i].second,
                            label = { Text("Option ${letters[i]} (English)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            OutlinedTextField(
                value = expHi,
                onValueChange = { expHi = it },
                label = { Text("Explanation (Hindi - व्याख्या)") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = expEn,
                onValueChange = { expEn = it },
                label = { Text("Explanation (English)") },
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = {
                    onSave(
                        question.copy(
                            questionHi = qHi,
                            questionEn = qEn,
                            optionsHi = listOf(optHi0, optHi1, optHi2, optHi3),
                            optionsEn = listOf(optEn0, optEn1, optEn2, optEn3),
                            correctOptionIndex = correctIdx,
                            explanationHi = expHi,
                            explanationEn = expEn
                        )
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("editor_save_q_$index")
            ) {
                Icon(Icons.Filled.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Save Question #${index + 1}",
                    fontFamily = NotoDevanagariFamily,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
