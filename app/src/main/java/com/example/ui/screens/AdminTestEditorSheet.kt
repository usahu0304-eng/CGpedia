package com.example.ui.screens

import androidx.activity.compose.BackHandler
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Publish
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.data.model.BilingualQuestion
import com.example.data.model.TestSeriesItem
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.ExamPaidIndigo
import com.example.ui.theme.NotoDevanagariFamily

@Composable
fun AdminTestEditorView(
    test: TestSeriesItem,
    questions: List<BilingualQuestion>,
    onBack: () -> Unit,
    onSaveSettingsOrPublish: (TestSeriesItem, Boolean) -> Unit,
    onSaveQuestion: (BilingualQuestion) -> Unit,
    onDeleteQuestion: (String) -> Unit,
    onDeleteEntireTest: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var titleHi by remember(test.id) { mutableStateOf(test.titleHi) }
    var titleEn by remember(test.id) { mutableStateOf(test.titleEn) }
    var durationText by remember(test.id) { mutableStateOf(test.durationMinutes.toString()) }
    var limitText by remember(test.id) { mutableStateOf(test.questionLimit.toString()) }
    var isPaid by remember(test.id) { mutableStateOf(test.isPaid) }
    var priceText by remember(test.id) { mutableStateOf(test.priceInr.toString()) }

    var editingQuestion by remember { mutableStateOf<BilingualQuestion?>(null) }

    BackHandler {
        onBack()
    }

    fun buildUpdatedMeta(): TestSeriesItem {
        val dur = durationText.toLongOrNull()?.coerceIn(1L, 240L) ?: 60L
        val lim = limitText.toLongOrNull()?.coerceIn(1L, 100L) ?: 50L
        val prc = priceText.toLongOrNull()?.coerceIn(1L, 50000L) ?: 99L
        return test.copy(
            titleHi = titleHi.trim().ifBlank { test.titleHi },
            titleEn = titleEn.trim().ifBlank { test.titleEn },
            durationMinutes = dur,
            questionLimit = lim,
            questionCount = questions.size.toLong(),
            isPaid = isPaid,
            priceInr = if (isPaid) prc else 0L
        )
    }

    Column(modifier = modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.size(48.dp).testTag("admin_editor_back_button")
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back to Admin")
                }
                Column {
                    Text(
                        text = "Draft & Publish Editor (${test.status.uppercase()})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${questions.size} Bilingual Questions Loaded",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }

            IconButton(
                onClick = { onDeleteEntireTest(test.id) },
                modifier = Modifier.size(48.dp).testTag("admin_delete_test_button")
            ) {
                Icon(
                    imageVector = Icons.Filled.Delete,
                    contentDescription = "Delete Entire Test",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }

        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Test Configuration & Monetization",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )

                        OutlinedTextField(
                            value = titleHi,
                            onValueChange = { titleHi = it },
                            label = { Text("Hindi Title (1st Language)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = titleEn,
                            onValueChange = { titleEn = it },
                            label = { Text("English Title (2nd Language)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = durationText,
                                onValueChange = { durationText = it.filter(Char::isDigit) },
                                label = { Text("Timer (Mins)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = limitText,
                                onValueChange = { limitText = it.filter(Char::isDigit) },
                                label = { Text("Q Limit (1-100)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = if (isPaid) "Paid / Locked Test (INR)" else "Free Open Access Test",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                            Switch(
                                checked = isPaid,
                                onCheckedChange = { isPaid = it },
                                modifier = Modifier.testTag("admin_editor_paid_switch")
                            )
                        }

                        if (isPaid) {
                            OutlinedTextField(
                                value = priceText,
                                onValueChange = { priceText = it.filter(Char::isDigit) },
                                label = { Text("Unlock Price (₹ INR)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            FilledTonalButton(
                                onClick = { onSaveSettingsOrPublish(buildUpdatedMeta(), false) },
                                modifier = Modifier.weight(1f).height(48.dp)
                            ) {
                                Icon(Icons.Filled.Save, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Save Settings")
                            }

                            Button(
                                onClick = { onSaveSettingsOrPublish(buildUpdatedMeta(), true) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = ExamAnsweredGreen
                                ),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp)
                                    .testTag("admin_publish_test_button")
                            ) {
                                Icon(Icons.Filled.Publish, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Publish Live")
                            }
                        }
                    }
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Bilingual Questions (${questions.size} / 100)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    FilledTonalButton(
                        onClick = {
                            editingQuestion = BilingualQuestion(
                                id = "",
                                testId = test.id,
                                orderIndex = questions.size.toLong().coerceAtMost(99L),
                                subjectTag = test.topic.ifBlank { "CGPSC" },
                                visibility = test.status
                            )
                        },
                        enabled = questions.size < 100,
                        modifier = Modifier.testTag("admin_add_question_button")
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Add Question")
                    }
                }
            }

            itemsIndexed(questions, key = { _, q -> q.id }) { idx, q ->
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = ExamPaidIndigo.copy(alpha = 0.14f)
                            ) {
                                val ansLetter = listOf("A", "B", "C", "D")[q.correctOptionIndex.toInt().coerceIn(0, 3)]
                                Text(
                                    text = "Q${idx + 1} • Ans: $ansLetter",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = ExamPaidIndigo,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                            Row {
                                IconButton(
                                    onClick = { editingQuestion = q },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(Icons.Filled.Edit, contentDescription = "Edit Question")
                                }
                                IconButton(
                                    onClick = { onDeleteQuestion(q.id) },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        Icons.Filled.Delete,
                                        contentDescription = "Delete Question",
                                        tint = MaterialTheme.colorScheme.error
                                    )
                                }
                            }
                        }

                        Text(
                            text = q.questionHi,
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = q.questionEn,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }

    editingQuestion?.let { q ->
        BilingualQuestionEditorDialog(
            initial = q,
            onDismiss = { editingQuestion = null },
            onConfirm = { saved ->
                editingQuestion = null
                onSaveQuestion(saved)
            }
        )
    }
}

@Composable
private fun BilingualQuestionEditorDialog(
    initial: BilingualQuestion,
    onDismiss: () -> Unit,
    onConfirm: (BilingualQuestion) -> Unit
) {
    var qHi by remember { mutableStateOf(initial.questionHi) }
    var qEn by remember { mutableStateOf(initial.questionEn) }
    var optAHi by remember { mutableStateOf(initial.optionsHi.getOrElse(0) { "" }) }
    var optBHi by remember { mutableStateOf(initial.optionsHi.getOrElse(1) { "" }) }
    var optCHi by remember { mutableStateOf(initial.optionsHi.getOrElse(2) { "" }) }
    var optDHi by remember { mutableStateOf(initial.optionsHi.getOrElse(3) { "" }) }
    var optAEn by remember { mutableStateOf(initial.optionsEn.getOrElse(0) { "" }) }
    var optBEn by remember { mutableStateOf(initial.optionsEn.getOrElse(1) { "" }) }
    var optCEn by remember { mutableStateOf(initial.optionsEn.getOrElse(2) { "" }) }
    var optDEn by remember { mutableStateOf(initial.optionsEn.getOrElse(3) { "" }) }
    var correctIdx by remember { mutableLongStateOf(initial.correctOptionIndex.coerceIn(0L, 3L)) }
    var expHi by remember { mutableStateOf(initial.explanationHi) }
    var expEn by remember { mutableStateOf(initial.explanationEn) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial.id.isBlank()) "Add Bilingual Question" else "Edit Bilingual Question") },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(value = qHi, onValueChange = { qHi = it }, label = { Text("1st: Hindi Question") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = qEn, onValueChange = { qEn = it }, label = { Text("2nd: English Question") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = optAHi, onValueChange = { optAHi = it }, label = { Text("Option A (Hindi)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = optAEn, onValueChange = { optAEn = it }, label = { Text("Option A (English)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = optBHi, onValueChange = { optBHi = it }, label = { Text("Option B (Hindi)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = optBEn, onValueChange = { optBEn = it }, label = { Text("Option B (English)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = optCHi, onValueChange = { optCHi = it }, label = { Text("Option C (Hindi)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = optCEn, onValueChange = { optCEn = it }, label = { Text("Option C (English)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = optDHi, onValueChange = { optDHi = it }, label = { Text("Option D (Hindi)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = optDEn, onValueChange = { optDEn = it }, label = { Text("Option D (English)") }, singleLine = true, modifier = Modifier.fillMaxWidth())

                Text("Correct Answer:", style = MaterialTheme.typography.labelMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("A", "B", "C", "D").forEachIndexed { i, lbl ->
                        FilterChip(
                            selected = correctIdx.toInt() == i,
                            onClick = { correctIdx = i.toLong() },
                            label = { Text(lbl) }
                        )
                    }
                }

                OutlinedTextField(value = expHi, onValueChange = { expHi = it }, label = { Text("1st: Hindi Explanation") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = expEn, onValueChange = { expEn = it }, label = { Text("2nd: English Explanation") }, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onConfirm(
                        initial.copy(
                            questionHi = qHi.ifBlank { "-" },
                            questionEn = qEn.ifBlank { "-" },
                            optionsHi = listOf(optAHi, optBHi, optCHi, optDHi),
                            optionsEn = listOf(optAEn, optBEn, optCEn, optDEn),
                            correctOptionIndex = correctIdx,
                            explanationHi = expHi.ifBlank { "-" },
                            explanationEn = expEn.ifBlank { "-" }
                        )
                    )
                }
            ) {
                Text("Save Question")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
