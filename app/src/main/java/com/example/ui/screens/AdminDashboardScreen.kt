package com.example.ui.screens

import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.AudioFile
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreateNewFolder
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.MusicOff
import androidx.compose.material.icons.filled.PersonSearch
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.model.AppConfig
import com.example.data.model.ExamFolder
import com.example.data.model.SubjectFolder
import com.example.data.model.TestSeriesItem
import com.example.data.model.UserProfile
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.ExamPaidIndigo
import com.example.ui.theme.NotoDevanagariFamily
import com.example.ui.viewmodel.AdminAiGenerationProgress
import com.example.ui.viewmodel.AdminViewModel

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    adminViewModel: AdminViewModel,
    examFolders: List<ExamFolder>,
    subjectFolders: List<SubjectFolder>,
    appConfig: AppConfig,
    onCloseAdmin: () -> Unit,
    modifier: Modifier = Modifier
) {
    val genProgress by adminViewModel.genProgress.collectAsStateWithLifecycle()
    val selectedTest by adminViewModel.selectedTestForEdit.collectAsStateWithLifecycle()
    val editingQuestions by adminViewModel.editingQuestions.collectAsStateWithLifecycle()
    val allTests by adminViewModel.allTests.collectAsStateWithLifecycle()
    val allUsers by adminViewModel.allUsers.collectAsStateWithLifecycle()
    val isGrantingAccess by adminViewModel.isGrantingAccess.collectAsStateWithLifecycle()
    val feedback by adminViewModel.adminFeedback.collectAsStateWithLifecycle()
    val isUploadingAnthem by adminViewModel.isUploadingAnthem.collectAsStateWithLifecycle()

    var activeTab by rememberSaveable { mutableIntStateOf(0) }

    BackHandler {
        if (selectedTest != null) {
            adminViewModel.closeTestEditor()
        } else {
            onCloseAdmin()
        }
    }

    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        if (selectedTest != null) {
            AdminTestEditorView(
                test = selectedTest!!,
                questions = editingQuestions,
                onBack = { adminViewModel.closeTestEditor() },
                onSaveSettingsOrPublish = { updated, publish ->
                    adminViewModel.saveTestSettingsOrPublish(updated, publish)
                },
                onSaveQuestion = { adminViewModel.saveQuestionInEditor(it) },
                onDeleteQuestion = { adminViewModel.deleteQuestionInEditor(it) },
                onDeleteEntireTest = { adminViewModel.deleteEntireTest(it) },
                modifier = Modifier.windowInsetsPadding(WindowInsets.statusBars)
            )
            return@Surface
        }

        Column(modifier = Modifier.fillMaxSize()) {
            Surface(color = MaterialTheme.colorScheme.primary, tonalElevation = 4.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .windowInsetsPadding(WindowInsets.statusBars)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onCloseAdmin,
                        modifier = Modifier.size(48.dp).testTag("admin_close_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "CGpedia Exclusive Owner Admin Panel",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Text(
                            text = "CGPSC & CGSSB • AI Tests • Folders • Student Access • Support Policy",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f)
                        )
                    }
                }
            }

            if (!feedback.isNullOrBlank()) {
                Surface(
                    color = MaterialTheme.colorScheme.tertiaryContainer,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { adminViewModel.clearFeedback() }
                        .testTag("admin_feedback_banner")
                ) {
                    Text(
                        text = feedback.orEmpty(),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onTertiaryContainer,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }

            PrimaryScrollableTabRow(selectedTabIndex = activeTab, edgePadding = 12.dp) {
                listOf(
                    "AI Tests & Drafts",
                    "Folders CRUD",
                    "Student Access (₹99)",
                    "Support & Anthem"
                ).forEachIndexed { idx, lbl ->
                    Tab(
                        selected = activeTab == idx,
                        onClick = { activeTab = idx },
                        text = { Text(lbl, style = MaterialTheme.typography.labelLarge) },
                        modifier = Modifier.testTag("admin_tab_$idx")
                    )
                }
            }

            when (activeTab) {
                0 -> AdminAiTestGeneratorTab(
                    examFolders = examFolders,
                    subjectFolders = subjectFolders,
                    genProgress = genProgress,
                    allTests = allTests,
                    onGenerate = { fType, fId, fName, tHi, tEn, topic, diff, qCnt, dur, paid, price ->
                        adminViewModel.generateDraftTestSeries(
                            folderType = fType,
                            folderId = fId,
                            folderName = fName,
                            titleHi = tHi,
                            titleEn = tEn,
                            topic = topic,
                            difficulty = diff,
                            questionCount = qCnt,
                            durationMinutes = dur,
                            isPaid = paid,
                            priceInr = price
                        )
                    },
                    onOpenTestEditor = { adminViewModel.openTestForEdit(it) }
                )
                1 -> AdminFolderCrudTab(
                    examFolders = examFolders,
                    subjectFolders = subjectFolders,
                    onSaveExam = { adminViewModel.saveExamFolder(it) },
                    onDeleteExam = { adminViewModel.deleteExamFolder(it) },
                    onSaveSubject = { adminViewModel.saveSubjectFolder(it) },
                    onDeleteSubject = { adminViewModel.deleteSubjectFolder(it) }
                )
                2 -> AdminStudentAccessControlTab(
                    examFolders = examFolders,
                    subjectFolders = subjectFolders,
                    allTests = allTests,
                    allUsers = allUsers,
                    whatsappSupportNumber = appConfig.whatsappSupportNumber.ifBlank { "9238810070" },
                    isGrantingAccess = isGrantingAccess,
                    onGrantAccess = { identifier, itemId, titleHi, titleEn, amountInr ->
                        adminViewModel.grantStudentPaidAccess(
                            studentIdentifier = identifier,
                            itemId = itemId,
                            titleHi = titleHi,
                            titleEn = titleEn,
                            amountInr = amountInr
                        )
                    }
                )
                3 -> AdminSupportAndAnthemTab(
                    appConfig = appConfig,
                    isUploading = isUploadingAnthem,
                    onUploadBytes = { bytes, mime, hi, en ->
                        adminViewModel.uploadAnthemFile(bytes, mime, hi, en)
                    },
                    onSaveConfig = { adminViewModel.updateAnthemConfig(it) }
                )
            }
        }
    }
}

private data class GrantPackageOption(
    val id: String,
    val titleHi: String,
    val titleEn: String,
    val priceInr: Long
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AdminStudentAccessControlTab(
    examFolders: List<ExamFolder>,
    subjectFolders: List<SubjectFolder>,
    allTests: List<TestSeriesItem>,
    allUsers: List<UserProfile>,
    whatsappSupportNumber: String,
    isGrantingAccess: Boolean,
    onGrantAccess: (String, String, String, String, Long) -> Unit
) {
    var studentIdentifier by rememberSaveable { mutableStateOf("") }
    var customAmountText by rememberSaveable { mutableStateOf("99") }

    val packageOptions = remember(examFolders, subjectFolders, allTests) {
        buildList {
            // Primary Paid Test Series Package: CGPSC Pre 2026 Test Series (₹99)
            add(
                GrantPackageOption(
                    id = "cgpsc_pre_2026_series",
                    titleHi = "सीजीपीएससी प्री 2026 टेस्ट सीरीज",
                    titleEn = "CGPSC Pre 2026 Test Series",
                    priceInr = 99L
                )
            )
            add(
                GrantPackageOption(
                    id = "ALL_PAID_SERIES",
                    titleHi = "सभी पेड टेस्ट सीरीज अनलॉक (Full Pass)",
                    titleEn = "All Paid Test Series Pass",
                    priceInr = 99L
                )
            )
            examFolders.filter { !it.isFreeFolder && it.id != "cgpsc_pre_2026_series" }.forEach { f ->
                add(
                    GrantPackageOption(
                        id = f.id,
                        titleHi = f.titleHi,
                        titleEn = f.titleEn,
                        priceInr = f.priceInr.coerceAtLeast(99L)
                    )
                )
            }
            subjectFolders.filter { !it.isFreeFolder }.forEach { f ->
                add(
                    GrantPackageOption(
                        id = f.id,
                        titleHi = f.titleHi,
                        titleEn = f.titleEn,
                        priceInr = f.priceInr.coerceAtLeast(99L)
                    )
                )
            }
            allTests.filter { it.isPaid }.forEach { t ->
                add(
                    GrantPackageOption(
                        id = t.id,
                        titleHi = t.titleHi,
                        titleEn = t.titleEn,
                        priceInr = t.priceInr.coerceAtLeast(99L)
                    )
                )
            }
        }.distinctBy { it.id }
    }

    var selectedPackageId by rememberSaveable { mutableStateOf("cgpsc_pre_2026_series") }
    val activePackage = packageOptions.firstOrNull { it.id == selectedPackageId } ?: packageOptions.first()

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
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.LockOpen,
                            contentDescription = null,
                            tint = ExamPaidIndigo
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Manual Paid Test Series Access Control",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Unlock paid test packages for students by User ID or Email ID after WhatsApp ($whatsappSupportNumber) / UPI payment confirmation.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    OutlinedTextField(
                        value = studentIdentifier,
                        onValueChange = { studentIdentifier = it },
                        label = { Text("Student Registered User ID or Email ID") },
                        placeholder = { Text("e.g. student@gmail.com or Firebase UID") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_student_identifier_input")
                    )

                    Text(
                        text = "Select Paid Test Series Package to Unlock:",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold
                    )

                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        packageOptions.forEach { pkg ->
                            FilterChip(
                                selected = activePackage.id == pkg.id,
                                onClick = {
                                    selectedPackageId = pkg.id
                                    customAmountText = pkg.priceInr.toString()
                                },
                                label = {
                                    Text("${pkg.titleEn} (₹${pkg.priceInr})", style = MaterialTheme.typography.labelSmall)
                                }
                            )
                        }
                    }

                    OutlinedTextField(
                        value = customAmountText,
                        onValueChange = { customAmountText = it.filter(Char::isDigit) },
                        label = { Text("Confirmed Payment Amount (₹ INR)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Button(
                        onClick = {
                            val amt = customAmountText.toLongOrNull()?.coerceAtLeast(0L) ?: activePackage.priceInr
                            onGrantAccess(
                                studentIdentifier.trim(),
                                activePackage.id,
                                activePackage.titleHi,
                                activePackage.titleEn,
                                amt
                            )
                        },
                        enabled = !isGrantingAccess && studentIdentifier.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ExamAnsweredGreen,
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("admin_grant_access_button")
                    ) {
                        if (isGrantingAccess) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Unlocking Paid Access...")
                        } else {
                            Icon(Icons.Filled.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Unlock '${activePackage.titleEn}' for Student", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        item {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Filled.PersonSearch, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Text(
                    text = "Registered Students (${allUsers.size}) — Tap to Auto-Fill User ID / Email",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        items(allUsers, key = { it.id.ifBlank { it.userId } }) { user ->
            val resolvedUid = user.userId.ifBlank { user.id }
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        studentIdentifier = user.email.ifBlank { resolvedUid }
                    }
                    .testTag("admin_user_row_$resolvedUid"),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = user.displayName.ifBlank { "CGpedia Student" },
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Email: ${user.email.ifBlank { "N/A" }}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "User ID: $resolvedUid",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                    FilledTonalButton(
                        onClick = {
                            studentIdentifier = user.email.ifBlank { resolvedUid }
                        }
                    ) {
                        Text("Select")
                    }
                }
            }
        }
    }
}

@Composable
fun AiTestGenerationProgressBanner(
    genProgress: AdminAiGenerationProgress,
    modifier: Modifier = Modifier
) {
    val animatedFraction by animateFloatAsState(
        targetValue = genProgress.progressFraction,
        label = "aiGenerationProgress"
    )
    val percentComplete = (genProgress.progressFraction * 100).toInt().coerceIn(0, 100)

    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.65f)
        ),
        modifier = modifier
            .fillMaxWidth()
            .testTag("ai_generation_loading_card")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                CircularProgressIndicator(
                    modifier = Modifier
                        .size(26.dp)
                        .testTag("ai_generation_spinner"),
                    strokeWidth = 3.dp,
                    color = MaterialTheme.colorScheme.primary
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = genProgress.statusMessage.ifBlank { "Generating questions, please wait..." },
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        modifier = Modifier.testTag("ai_generation_status_text")
                    )
                    Text(
                        text = "Batch ${genProgress.currentBatch.coerceAtLeast(1)} of ${genProgress.totalBatches.coerceAtLeast(1)} • ${genProgress.generatedCount} / ${genProgress.targetCount} bilingual questions ready ($percentComplete%)",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.testTag("ai_generation_counter_text")
                    )
                }
            }

            if (genProgress.generatedCount > 0 && genProgress.targetCount > 0) {
                LinearProgressIndicator(
                    progress = { animatedFraction },
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .testTag("ai_generation_progress_bar")
                )
            } else {
                LinearProgressIndicator(
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .testTag("ai_generation_progress_bar")
                )
            }

            Text(
                text = "Running in the background (up to 5-minute timeout window for large batches). Please keep the app open.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.85f)
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AdminAiTestGeneratorTab(
    examFolders: List<ExamFolder>,
    subjectFolders: List<SubjectFolder>,
    genProgress: AdminAiGenerationProgress,
    allTests: List<com.example.data.model.TestSeriesItem>,
    onGenerate: (String, String, String, String, String, String, String, Int, Int, Boolean, Long) -> Unit,
    onOpenTestEditor: (com.example.data.model.TestSeriesItem) -> Unit
) {
    var folderType by rememberSaveable { mutableStateOf("exam") }
    var selectedFolderId by rememberSaveable { mutableStateOf(examFolders.firstOrNull()?.id.orEmpty()) }
    var titleHi by rememberSaveable { mutableStateOf("") }
    var titleEn by rememberSaveable { mutableStateOf("") }
    var topic by rememberSaveable { mutableStateOf("Chhattisgarh History & Panchayati Raj") }
    var difficulty by rememberSaveable { mutableStateOf("CGPSC_Level") }
    var qCountText by rememberSaveable { mutableStateOf("10") }
    var durationText by rememberSaveable { mutableStateOf("30") }
    var isPaid by rememberSaveable { mutableStateOf(false) }
    var priceText by rememberSaveable { mutableStateOf("99") }

    val availablePairs = if (folderType == "exam") {
        examFolders.map { it.id to it.titleEn }
    } else {
        subjectFolders.map { it.id to it.titleEn }
    }
    val activePair = availablePairs.firstOrNull { it.first == selectedFolderId } ?: availablePairs.firstOrNull()

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
                        text = "Manual AI Bilingual Test Generator (Up to 100 Qs)",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = folderType == "exam",
                            onClick = {
                                folderType = "exam"
                                selectedFolderId = examFolders.firstOrNull()?.id.orEmpty()
                            },
                            label = { Text("Exam-Wise Folder") }
                        )
                        FilterChip(
                            selected = folderType == "subject",
                            onClick = {
                                folderType = "subject"
                                selectedFolderId = subjectFolders.firstOrNull()?.id.orEmpty()
                            },
                            label = { Text("Subject-Wise Folder") }
                        )
                    }

                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        availablePairs.forEach { (id, name) ->
                            FilterChip(
                                selected = activePair?.first == id,
                                onClick = { selectedFolderId = id },
                                label = { Text(name, style = MaterialTheme.typography.labelSmall) }
                            )
                        }
                    }

                    OutlinedTextField(
                        value = topic,
                        onValueChange = { topic = it },
                        label = { Text("Exam Syllabus Topic") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("admin_ai_topic_input")
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = titleHi,
                            onValueChange = { titleHi = it },
                            label = { Text("Hindi Title (Optional)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = titleEn,
                            onValueChange = { titleEn = it },
                            label = { Text("English Title (Optional)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Easy", "Moderate", "Hard", "CGPSC_Level").forEach { diff ->
                            FilterChip(
                                selected = difficulty == diff,
                                onClick = { difficulty = diff },
                                label = { Text(diff.replace("_", " ")) }
                            )
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = qCountText,
                            onValueChange = { qCountText = it.filter(Char::isDigit) },
                            label = { Text("Questions (1-100)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.weight(1f).testTag("admin_ai_qcount_input")
                        )
                        OutlinedTextField(
                            value = durationText,
                            onValueChange = { durationText = it.filter(Char::isDigit) },
                            label = { Text("Timer (Minutes)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(if (isPaid) "Paid / Locked Test" else "Free Open Test")
                        Switch(checked = isPaid, onCheckedChange = { isPaid = it })
                    }

                    if (isPaid) {
                        OutlinedTextField(
                            value = priceText,
                            onValueChange = { priceText = it.filter(Char::isDigit) },
                            label = { Text("Price (₹ INR)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    if (genProgress.isGenerating) {
                        AiTestGenerationProgressBanner(genProgress = genProgress)
                    }

                    if (!genProgress.errorMessage.isNullOrBlank()) {
                        Text(
                            text = genProgress.errorMessage,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.testTag("ai_generation_error_text")
                        )
                    }

                    Button(
                        onClick = {
                            val folderId = activePair?.first ?: return@Button
                            val folderName = activePair.second
                            val cnt = qCountText.toIntOrNull()?.coerceIn(1, 100) ?: 10
                            val dur = durationText.toIntOrNull()?.coerceIn(1, 240) ?: 30
                            val prc = priceText.toLongOrNull()?.coerceAtLeast(1L) ?: 99L
                            onGenerate(
                                folderType,
                                folderId,
                                folderName,
                                titleHi,
                                titleEn,
                                topic,
                                difficulty,
                                cnt,
                                dur,
                                isPaid,
                                prc
                            )
                        },
                        enabled = !genProgress.isGenerating && activePair != null && topic.isNotBlank(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("admin_generate_draft_button")
                    ) {
                        if (genProgress.isGenerating) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Generating questions, please wait...")
                        } else {
                            Icon(Icons.Filled.AutoAwesome, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Generate Draft Bilingual Test Series")
                        }
                    }
                }
            }
        }

        item {
            Text(
                text = "All Drafts & Published Tests (${allTests.size}) — Tap to Edit / Publish",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
        }

        items(allTests, key = { it.id }) { test ->
            val isDraft = test.status == "draft"
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onOpenTestEditor(test) }
                    .testTag("admin_test_row_${test.id}"),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = test.titleHi,
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${test.titleEn} • ${test.questionCount} Qs • ${test.durationMinutes}m",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = if (isDraft) {
                            ExamPaidIndigo.copy(alpha = 0.14f)
                        } else {
                            ExamAnsweredGreen.copy(alpha = 0.14f)
                        }
                    ) {
                        Text(
                            text = if (isDraft) "DRAFT" else "LIVE",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (isDraft) ExamPaidIndigo else ExamAnsweredGreen,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminFolderCrudTab(
    examFolders: List<ExamFolder>,
    subjectFolders: List<SubjectFolder>,
    onSaveExam: (ExamFolder) -> Unit,
    onDeleteExam: (String) -> Unit,
    onSaveSubject: (SubjectFolder) -> Unit,
    onDeleteSubject: (String) -> Unit
) {
    var editingExam by remember { mutableStateOf<ExamFolder?>(null) }
    var editingSubject by remember { mutableStateOf<SubjectFolder?>(null) }

    // Inline dynamic folder creator state
    var newCategoryType by rememberSaveable { mutableStateOf("exam") }
    var newFolderHi by rememberSaveable { mutableStateOf("") }
    var newFolderEn by rememberSaveable { mutableStateOf("") }
    var newFolderDesc by rememberSaveable { mutableStateOf("") }
    var newFolderIsPaid by rememberSaveable { mutableStateOf(true) }
    var newFolderPriceText by rememberSaveable { mutableStateOf("99") }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        // Inline Dynamic Test Folder / Category Creator Card
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
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.CreateNewFolder,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Create New Test Folder / Category Dynamically",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = newCategoryType == "exam",
                            onClick = { newCategoryType = "exam" },
                            label = { Text("Exam-Wise Category") }
                        )
                        FilterChip(
                            selected = newCategoryType == "subject",
                            onClick = { newCategoryType = "subject" },
                            label = { Text("Subject-Wise Category") }
                        )
                    }

                    OutlinedTextField(
                        value = newFolderHi,
                        onValueChange = { newFolderHi = it },
                        label = { Text("Folder Title in Hindi (e.g. सीजीपीएससी प्री 2026 टेस्ट सीरीज)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("admin_new_folder_hi_input")
                    )

                    OutlinedTextField(
                        value = newFolderEn,
                        onValueChange = { newFolderEn = it },
                        label = { Text("Folder Title in English (e.g. CGPSC Pre 2026 Test Series)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("admin_new_folder_en_input")
                    )

                    OutlinedTextField(
                        value = newFolderDesc,
                        onValueChange = { newFolderDesc = it },
                        label = { Text("Folder Subtitle / Description") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(if (newFolderIsPaid) "Paid Test Series Folder (₹)" else "Free Open Folder")
                        Switch(checked = newFolderIsPaid, onCheckedChange = { newFolderIsPaid = it })
                    }

                    if (newFolderIsPaid) {
                        OutlinedTextField(
                            value = newFolderPriceText,
                            onValueChange = { newFolderPriceText = it.filter(Char::isDigit) },
                            label = { Text("Package Price (₹ INR)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    Button(
                        onClick = {
                            val hi = newFolderHi.ifBlank { newFolderEn }.trim()
                            val en = newFolderEn.ifBlank { newFolderHi }.trim()
                            if (hi.isBlank() && en.isBlank()) return@Button
                            val desc = newFolderDesc.ifBlank { "$en Bilingual Test Series" }
                            val prc = if (newFolderIsPaid) (newFolderPriceText.toLongOrNull() ?: 99L) else 0L
                            if (newCategoryType == "exam") {
                                onSaveExam(
                                    ExamFolder(
                                        titleHi = hi,
                                        titleEn = en,
                                        descriptionHi = desc,
                                        descriptionEn = desc,
                                        sortOrder = (examFolders.size + 1).toLong(),
                                        isFreeFolder = !newFolderIsPaid,
                                        priceInr = prc
                                    )
                                )
                            } else {
                                onSaveSubject(
                                    SubjectFolder(
                                        titleHi = hi,
                                        titleEn = en,
                                        descriptionHi = desc,
                                        descriptionEn = desc,
                                        sortOrder = (subjectFolders.size + 1).toLong(),
                                        isFreeFolder = !newFolderIsPaid,
                                        priceInr = prc
                                    )
                                )
                            }
                            newFolderHi = ""
                            newFolderEn = ""
                            newFolderDesc = ""
                        },
                        enabled = newFolderHi.isNotBlank() || newFolderEn.isNotBlank(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("admin_quick_create_folder_button")
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Create Folder / Category Now")
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
                Text("Exam-Wise Folders (${examFolders.size})", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                FilledTonalButton(onClick = { editingExam = ExamFolder(sortOrder = (examFolders.size + 1).toLong()) }) {
                    Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("New Exam Folder")
                }
            }
        }

        items(examFolders, key = { it.id }) { f ->
            FolderAdminRow(
                titleHi = f.titleHi,
                titleEn = f.titleEn,
                sortOrder = f.sortOrder,
                isFree = f.isFreeFolder,
                priceInr = f.priceInr,
                onMoveUp = { onSaveExam(f.copy(sortOrder = (f.sortOrder - 1L).coerceAtLeast(0L))) },
                onMoveDown = { onSaveExam(f.copy(sortOrder = f.sortOrder + 1L)) },
                onEdit = { editingExam = f },
                onDelete = { onDeleteExam(f.id) }
            )
        }

        item {
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Subject-Wise Folders (${subjectFolders.size})", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                FilledTonalButton(onClick = { editingSubject = SubjectFolder(sortOrder = (subjectFolders.size + 1).toLong()) }) {
                    Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("New Subject Folder")
                }
            }
        }

        items(subjectFolders, key = { it.id }) { f ->
            FolderAdminRow(
                titleHi = f.titleHi,
                titleEn = f.titleEn,
                sortOrder = f.sortOrder,
                isFree = f.isFreeFolder,
                priceInr = f.priceInr,
                onMoveUp = { onSaveSubject(f.copy(sortOrder = (f.sortOrder - 1L).coerceAtLeast(0L))) },
                onMoveDown = { onSaveSubject(f.copy(sortOrder = f.sortOrder + 1L)) },
                onEdit = { editingSubject = f },
                onDelete = { onDeleteSubject(f.id) }
            )
        }
    }

    editingExam?.let { folder ->
        FolderEditDialog(
            initialHi = folder.titleHi,
            initialEn = folder.titleEn,
            initialDescEn = folder.descriptionEn,
            initialIsFree = folder.isFreeFolder,
            initialPrice = folder.priceInr,
            onDismiss = { editingExam = null },
            onSave = { hi, en, desc, free, prc ->
                editingExam = null
                onSaveExam(
                    folder.copy(
                        titleHi = hi,
                        titleEn = en,
                        descriptionHi = desc,
                        descriptionEn = desc,
                        isFreeFolder = free,
                        priceInr = if (free) 0L else prc
                    )
                )
            }
        )
    }

    editingSubject?.let { folder ->
        FolderEditDialog(
            initialHi = folder.titleHi,
            initialEn = folder.titleEn,
            initialDescEn = folder.descriptionEn,
            initialIsFree = folder.isFreeFolder,
            initialPrice = folder.priceInr,
            onDismiss = { editingSubject = null },
            onSave = { hi, en, desc, free, prc ->
                editingSubject = null
                onSaveSubject(
                    folder.copy(
                        titleHi = hi,
                        titleEn = en,
                        descriptionHi = desc,
                        descriptionEn = desc,
                        isFreeFolder = free,
                        priceInr = if (free) 0L else prc
                    )
                )
            }
        )
    }
}

@Composable
private fun FolderAdminRow(
    titleHi: String,
    titleEn: String,
    sortOrder: Long,
    isFree: Boolean,
    priceInr: Long,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(titleHi, fontFamily = NotoDevanagariFamily, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                val badge = if (isFree) "FREE" else "PAID ₹$priceInr"
                Text("$titleEn • $badge (Order #$sortOrder)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            IconButton(onClick = onMoveUp) { Icon(Icons.Filled.ArrowUpward, contentDescription = "Move Up") }
            IconButton(onClick = onMoveDown) { Icon(Icons.Filled.ArrowDownward, contentDescription = "Move Down") }
            IconButton(onClick = onEdit) { Icon(Icons.Filled.Edit, contentDescription = "Rename Folder") }
            IconButton(onClick = onDelete) {
                Icon(Icons.Filled.DeleteOutline, contentDescription = "Delete Folder", tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
private fun FolderEditDialog(
    initialHi: String,
    initialEn: String,
    initialDescEn: String,
    initialIsFree: Boolean,
    initialPrice: Long,
    onDismiss: () -> Unit,
    onSave: (String, String, String, Boolean, Long) -> Unit
) {
    var hi by remember { mutableStateOf(initialHi) }
    var en by remember { mutableStateOf(initialEn) }
    var desc by remember { mutableStateOf(initialDescEn) }
    var isFree by remember { mutableStateOf(initialIsFree) }
    var price by remember { mutableStateOf(initialPrice.toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create / Edit Folder") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = hi, onValueChange = { hi = it }, label = { Text("Hindi Folder Title") }, singleLine = true)
                OutlinedTextField(value = en, onValueChange = { en = it }, label = { Text("English Folder Title") }, singleLine = true)
                OutlinedTextField(value = desc, onValueChange = { desc = it }, label = { Text("Subtitle / Description") }, singleLine = true)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(if (isFree) "Free Folder" else "Paid Folder")
                    Switch(checked = !isFree, onCheckedChange = { isFree = !it })
                }
                if (!isFree) {
                    OutlinedTextField(
                        value = price,
                        onValueChange = { price = it.filter(Char::isDigit) },
                        label = { Text("Folder Unlock Price (₹)") },
                        singleLine = true
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (hi.isNotBlank() || en.isNotBlank()) {
                        onSave(hi.ifBlank { en }, en.ifBlank { hi }, desc, isFree, price.toLongOrNull() ?: 99L)
                    }
                }
            ) {
                Text("Save")
            }
        },
        dismissButton = { OutlinedButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun AdminSupportAndAnthemTab(
    appConfig: AppConfig,
    isUploading: Boolean,
    onUploadBytes: (ByteArray, String, String, String) -> Unit,
    onSaveConfig: (AppConfig) -> Unit
) {
    val context = LocalContext.current
    var titleHi by rememberSaveable { mutableStateOf(appConfig.anthemTitleHi) }
    var titleEn by rememberSaveable { mutableStateOf(appConfig.anthemTitleEn) }
    var audioUrl by rememberSaveable { mutableStateOf(appConfig.anthemAudioUrl) }
    var telegramUrl by rememberSaveable { mutableStateOf(appConfig.telegramChannelUrl) }
    var supportEmail by rememberSaveable { mutableStateOf(appConfig.supportEmail) }
    var whatsappNumber by rememberSaveable { mutableStateOf(appConfig.whatsappSupportNumber.ifBlank { "9238810070" }) }
    var supportPolicyHi by rememberSaveable { mutableStateOf(appConfig.supportPolicyHi) }
    var supportPolicyEn by rememberSaveable { mutableStateOf(appConfig.supportPolicyEn) }
    var latestVersionCodeText by rememberSaveable { mutableStateOf(appConfig.latestVersionCode.coerceAtLeast(2L).toString()) }
    var latestVersionName by rememberSaveable { mutableStateOf(appConfig.latestVersionName.ifBlank { "2.0.0" }) }
    var apkDownloadUrl by rememberSaveable { mutableStateOf(appConfig.apkDownloadUrl.ifBlank { appConfig.telegramChannelUrl }) }
    var updateNotesHi by rememberSaveable { mutableStateOf(appConfig.updateNotesHi) }
    var updateNotesEn by rememberSaveable { mutableStateOf(appConfig.updateNotesEn) }

    fun buildUpdatedConfig(
        overrideSourceType: String = appConfig.anthemSourceType,
        overrideAudioUrl: String = appConfig.anthemAudioUrl
    ): AppConfig {
        val parsedVerCode = latestVersionCodeText.toLongOrNull()?.coerceIn(1L, 10000L) ?: 2L
        return appConfig.copy(
            anthemTitleHi = titleHi.ifBlank { "छत्तीसगढ़ राज्य गीत — अरपा पैरी के धार" },
            anthemTitleEn = titleEn.ifBlank { "Chhattisgarh State Song — Arpa Pairi Ke Dhar" },
            anthemSourceType = overrideSourceType,
            anthemAudioUrl = overrideAudioUrl,
            telegramChannelUrl = telegramUrl.ifBlank { "https://t.me/CGpediaOfficial" },
            supportEmail = supportEmail.ifBlank { "support@cgpedia.in" },
            whatsappSupportNumber = whatsappNumber.ifBlank { "9238810070" },
            supportPolicyHi = supportPolicyHi,
            supportPolicyEn = supportPolicyEn,
            latestVersionCode = parsedVerCode,
            latestVersionName = latestVersionName.ifBlank { "2.0.0" },
            apkDownloadUrl = apkDownloadUrl.ifBlank { telegramUrl.ifBlank { "https://t.me/CGpediaOfficial" } },
            updateNotesHi = updateNotesHi,
            updateNotesEn = updateNotesEn
        )
    }

    val audioPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri != null) {
            val mime = context.contentResolver.getType(uri) ?: "audio/mpeg"
            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            if (bytes != null && bytes.isNotEmpty()) {
                onUploadBytes(bytes, mime, titleHi, titleEn)
            }
        }
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        // 1. In-App APK Update & Version Alert Manager Card (Remind Later Popup Control)
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
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.AutoAwesome,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "In-App APK Update & Version Alert Manager",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Increase 'Latest Version Code' (e.g. from 2 to 3) whenever you release a new APK so students automatically see the optional Update Popup.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = latestVersionCodeText,
                            onValueChange = { latestVersionCodeText = it.filter(Char::isDigit) },
                            label = { Text("Latest Version Code (e.g. 2, 3)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("admin_latest_version_code_input")
                        )

                        OutlinedTextField(
                            value = latestVersionName,
                            onValueChange = { latestVersionName = it },
                            label = { Text("Version Name (e.g. 2.0.0)") },
                            singleLine = true,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("admin_latest_version_name_input")
                        )
                    }

                    OutlinedTextField(
                        value = apkDownloadUrl,
                        onValueChange = { apkDownloadUrl = it },
                        label = { Text("Direct APK Download Link / Telegram / Drive URL") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_apk_download_url_input")
                    )

                    OutlinedTextField(
                        value = updateNotesHi,
                        onValueChange = { updateNotesHi = it },
                        label = { Text("What's New Release Notes (1st Hindi / हिंदी)") },
                        minLines = 2,
                        maxLines = 4,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_update_notes_hi_input")
                    )

                    OutlinedTextField(
                        value = updateNotesEn,
                        onValueChange = { updateNotesEn = it },
                        label = { Text("What's New Release Notes (2nd English)") },
                        minLines = 2,
                        maxLines = 4,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_update_notes_en_input")
                    )

                    Button(
                        onClick = { onSaveConfig(buildUpdatedConfig()) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("admin_save_app_update_button")
                    ) {
                        Icon(Icons.Filled.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Save & Broadcast In-App Update Alert", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // 2. Support, WhatsApp (9238810070) & Help Policy Editor Card (Instant Save & Publish)
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
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.SupportAgent,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Support, WhatsApp Assistance & Help Policy",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Edit WhatsApp support number, Telegram channel, Support Email, and Bilingual Help Policy.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    OutlinedTextField(
                        value = whatsappNumber,
                        onValueChange = { whatsappNumber = it },
                        label = { Text("Payment Support WhatsApp Number") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_whatsapp_support_input")
                    )

                    OutlinedTextField(
                        value = supportEmail,
                        onValueChange = { supportEmail = it },
                        label = { Text("Student Support Email") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_support_email_input")
                    )

                    OutlinedTextField(
                        value = telegramUrl,
                        onValueChange = { telegramUrl = it },
                        label = { Text("Official Telegram Channel URL") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_telegram_url_input")
                    )

                    OutlinedTextField(
                        value = supportPolicyHi,
                        onValueChange = { supportPolicyHi = it },
                        label = { Text("Support & Help Policy (Hindi / हिंदी)") },
                        minLines = 2,
                        maxLines = 5,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_support_policy_hi_input")
                    )

                    OutlinedTextField(
                        value = supportPolicyEn,
                        onValueChange = { supportPolicyEn = it },
                        label = { Text("Support & Help Policy (English)") },
                        minLines = 2,
                        maxLines = 5,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_support_policy_en_input")
                    )

                    Button(
                        onClick = { onSaveConfig(buildUpdatedConfig()) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ExamAnsweredGreen,
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("admin_save_support_policy_button")
                    ) {
                        Icon(Icons.Filled.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Save & Publish Support & Help Policy", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // 3. CGpedia Channel Anthem Manager Card
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "CGpedia Channel Anthem Manager (Active: ${appConfig.anthemSourceType})",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )

                    OutlinedTextField(value = titleHi, onValueChange = { titleHi = it }, label = { Text("Anthem Title (Hindi)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = titleEn, onValueChange = { titleEn = it }, label = { Text("Anthem Title (English)") }, singleLine = true, modifier = Modifier.fillMaxWidth())

                    Button(
                        onClick = { audioPicker.launch("audio/*") },
                        enabled = !isUploading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("admin_upload_anthem_button")
                    ) {
                        if (isUploading) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Uploading MP3/AAC to Cloud...")
                        } else {
                            Icon(Icons.Filled.AudioFile, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Upload MP3 / AAC Anthem from Device")
                        }
                    }

                    OutlinedTextField(
                        value = audioUrl,
                        onValueChange = { audioUrl = it },
                        label = { Text("Or Stream HTTPS Audio URL (MP3/AAC)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        FilledTonalButton(
                            onClick = {
                                onSaveConfig(
                                    buildUpdatedConfig(
                                        overrideSourceType = if (audioUrl.startsWith("http")) "url" else "bundled",
                                        overrideAudioUrl = audioUrl
                                    )
                                )
                            },
                            modifier = Modifier.weight(1f).height(48.dp)
                        ) {
                            Text(if (audioUrl.startsWith("http")) "Use Stream URL" else "Use Bundled Anthem")
                        }

                        OutlinedButton(
                            onClick = {
                                onSaveConfig(
                                    buildUpdatedConfig(overrideSourceType = "none")
                                )
                            },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                            modifier = Modifier.weight(1f).height(48.dp)
                        ) {
                            Icon(Icons.Filled.MusicOff, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Remove Anthem")
                        }
                    }
                }
            }
        }
    }
}
