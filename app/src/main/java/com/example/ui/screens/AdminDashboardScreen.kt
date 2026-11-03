package com.example.ui.screens

import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Publish
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.model.AppConfig
import com.example.data.model.BroadcastNotification
import com.example.data.model.CurrentAffairItem
import com.example.data.model.ExamFolder
import com.example.data.model.OWNER_ADMIN_EMAIL
import com.example.data.model.PurchaseRecord
import com.example.data.model.StudentQuery
import com.example.data.model.SubjectFolder
import com.example.data.model.TestSeriesItem
import com.example.data.model.UiState
import com.example.data.model.UpcomingTestItem
import com.example.data.model.UserProfile
import com.example.data.model.isSubscriptionExpired
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.NotoDevanagariFamily
import com.example.ui.viewmodel.AdminViewModel
import java.time.LocalDate

@Composable
fun AdminDashboardScreen(
    adminViewModel: AdminViewModel,
    examFolders: List<ExamFolder>,
    subjectFolders: List<SubjectFolder>,
    appConfig: AppConfig,
    onCloseAdmin: () -> Unit
) {
    val allTestsState by adminViewModel.allTestsState.collectAsStateWithLifecycle()
    val allStudents by adminViewModel.allStudentsState.collectAsStateWithLifecycle()
    val allPurchases by adminViewModel.allPurchasesState.collectAsStateWithLifecycle()
    val broadcastNotifications by adminViewModel.broadcastNotificationsState.collectAsStateWithLifecycle()
    val upcomingTests by adminViewModel.upcomingTestsState.collectAsStateWithLifecycle()
    val studentQueries by adminViewModel.studentQueriesState.collectAsStateWithLifecycle()
    val selectedTest by adminViewModel.selectedTestForEdit.collectAsStateWithLifecycle()
    val editingQuestions by adminViewModel.editingQuestions.collectAsStateWithLifecycle()
    val isBusy by adminViewModel.isBusy.collectAsStateWithLifecycle()
    val aiProgressText by adminViewModel.aiGenerationProgressText.collectAsStateWithLifecycle()
    val feedback by adminViewModel.adminFeedback.collectAsStateWithLifecycle()

    var selectedAdminTab by rememberSaveable { mutableIntStateOf(0) }
    val openQueriesCount = remember(studentQueries) { studentQueries.count { it.status == "open" } }
    val tabLabels = listOf(
        "Tests (Manual + AI)",
        "Folders",
        "Analytics & Access",
        "Broadcast & Upcoming",
        "Queries ($openQueriesCount) & News",
        "Policy & Config"
    )

    BackHandler {
        if (selectedTest != null) {
            adminViewModel.closeTestEditor()
        } else {
            onCloseAdmin()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Exclusive Owner Admin Header Banner
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
                .windowInsetsPadding(WindowInsets.statusBars)
                .padding(horizontal = 12.dp, vertical = 10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = {
                            if (selectedTest != null) adminViewModel.closeTestEditor() else onCloseAdmin()
                        },
                        modifier = Modifier.testTag("admin_back_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                    Icon(
                        imageVector = Icons.Filled.AdminPanelSettings,
                        contentDescription = null,
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "CGpedia Admin Console • CGPSC & CGSSB",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Verified Owner: $OWNER_ADMIN_EMAIL",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White.copy(alpha = 0.88f)
                        )
                    }
                }

                if (isBusy) {
                    CircularProgressIndicator(
                        color = Color.White,
                        strokeWidth = 2.5.dp,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }

        if (!feedback.isNullOrBlank()) {
            Surface(
                color = MaterialTheme.colorScheme.secondaryContainer,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { adminViewModel.clearFeedback() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = feedback.orEmpty(),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = "Dismiss",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        // If a Draft or Published Test is open for Question Review & Editing
        val activeEditTest = selectedTest
        if (activeEditTest != null) {
            AdminTestEditorView(
                test = activeEditTest,
                questions = editingQuestions,
                onBack = { adminViewModel.closeTestEditor() },
                onSaveTestMeta = { updated -> adminViewModel.updateTestMeta(updated) },
                onPublishLive = { adminViewModel.publishTestLive(activeEditTest.id) },
                onAddQuestion = { adminViewModel.addBlankQuestionToCurrentTest() },
                onSaveQuestion = { q -> adminViewModel.saveEditedQuestion(q) },
                onDeleteQuestion = { qId -> adminViewModel.deleteQuestion(qId) },
                onDeleteTest = { adminViewModel.deleteTest(activeEditTest.id) }
            )
            return@Column
        }

        ScrollableTabRow(
            selectedTabIndex = selectedAdminTab,
            edgePadding = 16.dp,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary,
            modifier = Modifier.fillMaxWidth()
        ) {
            tabLabels.forEachIndexed { index, label ->
                Tab(
                    selected = selectedAdminTab == index,
                    onClick = { selectedAdminTab = index },
                    text = {
                        Text(
                            text = label,
                            fontWeight = if (selectedAdminTab == index) FontWeight.Bold else FontWeight.Medium
                        )
                    },
                    modifier = Modifier.testTag("admin_tab_$index")
                )
            }
        }

        when (selectedAdminTab) {
            0 -> AdminTestsCreatorAndListTab(
                allTestsState = allTestsState,
                examFolders = examFolders,
                subjectFolders = subjectFolders,
                isBusy = isBusy,
                aiProgressText = aiProgressText,
                onCreateManualTest = { fType, fId, hi, en, topic, diff, count, dur, marks, neg, paid, price, valDays, pubNow ->
                    adminViewModel.createManualTestFromScratch(
                        fType, fId, hi, en, topic, diff, count, dur, marks, neg, paid, price, valDays, pubNow
                    )
                },
                onGenerateAiTest = { fType, fId, hi, en, topic, diff, count, dur, marks, neg, paid, price, valDays, prompt, pubNow ->
                    adminViewModel.generateAiDraftTest(
                        fType, fId, hi, en, topic, diff, count, dur, marks, neg, paid, price, valDays, prompt, pubNow
                    )
                },
                onOpenTestEditor = { test -> adminViewModel.openTestForReview(test) },
                onPublishDirect = { testId -> adminViewModel.publishTestLive(testId) },
                onDeleteTest = { testId -> adminViewModel.deleteTest(testId) }
            )
            1 -> AdminFoldersControlTab(
                examFolders = examFolders,
                subjectFolders = subjectFolders,
                onSaveExamFolder = { adminViewModel.saveExamFolder(it) },
                onDeleteExamFolder = { adminViewModel.deleteExamFolder(it) },
                onSaveSubjectFolder = { adminViewModel.saveSubjectFolder(it) },
                onDeleteSubjectFolder = { adminViewModel.deleteSubjectFolder(it) }
            )
            2 -> AdminAnalyticsAndStudentAccessTab(
                examFolders = examFolders,
                subjectFolders = subjectFolders,
                allTests = (allTestsState as? UiState.Success)?.data.orEmpty(),
                allStudents = allStudents,
                allPurchases = allPurchases,
                isBusy = isBusy,
                onGrantStudentAccess = { identifier, targetId, hi, en, amount, validityDays ->
                    adminViewModel.grantStudentAccess(identifier, targetId, hi, en, amount, validityDays)
                }
            )
            3 -> AdminBroadcastAndUpcomingTestsTab(
                notifications = broadcastNotifications,
                upcomingTests = upcomingTests,
                isBusy = isBusy,
                onSaveNotification = { adminViewModel.saveBroadcastNotification(it) },
                onTogglePin = { adminViewModel.togglePinBroadcastNotification(it) },
                onDeleteNotification = { adminViewModel.deleteBroadcastNotification(it) },
                onSaveUpcomingTest = { adminViewModel.saveUpcomingTest(it) },
                onDeleteUpcomingTest = { adminViewModel.deleteUpcomingTest(it) }
            )
            4 -> AdminQueriesAndCurrentAffairsTab(
                queries = studentQueries,
                isBusy = isBusy,
                onReplyToQuery = { q, reply, resolved ->
                    adminViewModel.replyToStudentQuery(q, reply, resolved)
                },
                onSyncGroundedNews = { adminViewModel.triggerManualGroundedCurrentAffairsSync() },
                onSaveManualNews = { adminViewModel.saveManualCurrentAffair(it) }
            )
            5 -> AdminPolicyAndConfigTab(
                appConfig = appConfig,
                onSaveConfig = { adminViewModel.updateGlobalConfig(it) },
                onUploadAnthemBytes = { bytes, mime, hi, en ->
                    adminViewModel.uploadAnthemFile(bytes, mime, hi, en)
                }
            )
        }
    }
}

@Composable
private fun AdminTestsCreatorAndListTab(
    allTestsState: UiState<List<TestSeriesItem>>,
    examFolders: List<ExamFolder>,
    subjectFolders: List<SubjectFolder>,
    isBusy: Boolean,
    aiProgressText: String?,
    onCreateManualTest: (
        folderType: String,
        folderId: String,
        titleHi: String,
        titleEn: String,
        topic: String,
        difficulty: String,
        questionLimit: Int,
        durationMinutes: Int,
        marksPerQuestion: Double,
        negativeMarking: Double,
        isPaid: Boolean,
        priceInr: Long,
        validityDays: Long,
        publishImmediately: Boolean
    ) -> Unit,
    onGenerateAiTest: (
        folderType: String,
        folderId: String,
        titleHi: String,
        titleEn: String,
        topic: String,
        difficulty: String,
        questionCount: Int,
        durationMinutes: Int,
        marksPerQuestion: Double,
        negativeMarking: Double,
        isPaid: Boolean,
        priceInr: Long,
        validityDays: Long,
        customPrompt: String,
        publishImmediately: Boolean
    ) -> Unit,
    onOpenTestEditor: (TestSeriesItem) -> Unit,
    onPublishDirect: (String) -> Unit,
    onDeleteTest: (String) -> Unit
) {
    var creationMode by rememberSaveable { mutableStateOf("manual") } // "manual" or "ai"
    var folderType by rememberSaveable { mutableStateOf("exam") }
    var selectedFolderId by rememberSaveable {
        mutableStateOf(examFolders.firstOrNull()?.id ?: "cgpsc_pre_2026_series")
    }
    var titleHi by rememberSaveable { mutableStateOf("") }
    var titleEn by rememberSaveable { mutableStateOf("") }
    var topic by rememberSaveable { mutableStateOf("") }
    var customAiPrompt by rememberSaveable { mutableStateOf("") }
    var difficulty by rememberSaveable { mutableStateOf("CGPSC_Level") }
    var questionCountStr by rememberSaveable { mutableStateOf("10") }
    var durationStr by rememberSaveable { mutableStateOf("30") }
    var marksPerQStr by rememberSaveable { mutableStateOf("2.0") }
    var negativeMarkStr by rememberSaveable { mutableStateOf("0.66") }
    var isPaid by rememberSaveable { mutableStateOf(true) }
    var priceStr by rememberSaveable { mutableStateOf("99") }
    var validityDaysStr by rememberSaveable { mutableStateOf("180") }
    var publishImmediately by rememberSaveable { mutableStateOf(true) }

    val availableFolders = if (folderType == "exam") {
        examFolders.map { it.id to "${it.titleHi} (${it.titleEn})" }
    } else {
        subjectFolders.map { it.id to "${it.titleHi} (${it.titleEn})" }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .widthIn(max = 840.dp),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Test Creation Dashboard (Manual Scratch Editor + AI Prompt Generator)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    // Switch between Manual Test Creation & AI Prompt Generator
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AssistChip(
                            onClick = { creationMode = "manual" },
                            label = { Text("1. Manual Test from Scratch") },
                            leadingIcon = {
                                Icon(Icons.Filled.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                            },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (creationMode == "manual") {
                                    MaterialTheme.colorScheme.primaryContainer
                                } else {
                                    MaterialTheme.colorScheme.surface
                                }
                            ),
                            modifier = Modifier.testTag("mode_manual_test_chip")
                        )
                        AssistChip(
                            onClick = { creationMode = "ai" },
                            label = { Text("2. AI Prompt Test Generator (5m Timeout)") },
                            leadingIcon = {
                                Icon(Icons.Filled.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                            },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (creationMode == "ai") {
                                    MaterialTheme.colorScheme.primaryContainer
                                } else {
                                    MaterialTheme.colorScheme.surface
                                }
                            ),
                            modifier = Modifier.testTag("mode_ai_test_chip")
                        )
                    }

                    // Folder Type Switcher
                    Text(
                        text = "Target Exam-Wise or Subject-Wise Folder:",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AssistChip(
                            onClick = {
                                folderType = "exam"
                                selectedFolderId = examFolders.firstOrNull()?.id ?: "cgpsc_pre_2026_series"
                            },
                            label = { Text("Exam-Wise Folder") },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (folderType == "exam") {
                                    MaterialTheme.colorScheme.secondaryContainer
                                } else {
                                    MaterialTheme.colorScheme.surface
                                }
                            )
                        )
                        AssistChip(
                            onClick = {
                                folderType = "subject"
                                selectedFolderId = subjectFolders.firstOrNull()?.id ?: "subj_cg_gs"
                            },
                            label = { Text("Subject-Wise Folder") },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (folderType == "subject") {
                                    MaterialTheme.colorScheme.secondaryContainer
                                } else {
                                    MaterialTheme.colorScheme.surface
                                }
                            )
                        )
                    }

                    // Folder Selection Chips
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        availableFolders.take(4).forEach { (id, name) ->
                            val selected = selectedFolderId == id
                            AssistChip(
                                onClick = { selectedFolderId = id },
                                label = {
                                    Text(
                                        text = name.take(22),
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = if (selected) {
                                        MaterialTheme.colorScheme.primaryContainer
                                    } else {
                                        MaterialTheme.colorScheme.surface
                                    }
                                )
                            )
                        }
                    }

                    OutlinedTextField(
                        value = titleHi,
                        onValueChange = { titleHi = it },
                        label = { Text("1. Test Title in Hindi (Devanagari)") },
                        placeholder = { Text("सीजीपीएससी प्री 2026 टेस्ट सीरीज - मॉक 1") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("admin_test_title_hi")
                    )

                    OutlinedTextField(
                        value = titleEn,
                        onValueChange = { titleEn = it },
                        label = { Text("2. Test Title in English") },
                        placeholder = { Text("CGPSC Pre 2026 Test Series - Mock 1") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("admin_test_title_en")
                    )

                    OutlinedTextField(
                        value = topic,
                        onValueChange = { topic = it },
                        label = { Text("Syllabus / Topic") },
                        placeholder = { Text("Chhattisgarh History, Panchayati Raj, Tribes & Economic Survey") },
                        modifier = Modifier.fillMaxWidth().testTag("admin_test_topic")
                    )

                    if (creationMode == "ai") {
                        OutlinedTextField(
                            value = customAiPrompt,
                            onValueChange = { customAiPrompt = it },
                            label = { Text("Custom AI Prompt / Command Instructions (Optional)") },
                            placeholder = { Text("e.g., Include statement-based CGPSC questions and match-the-following on Bastar tribes...") },
                            minLines = 2,
                            modifier = Modifier.fillMaxWidth().testTag("admin_ai_custom_prompt")
                        )
                    }

                    // Difficulty Selector
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Easy", "Moderate", "Hard", "CGPSC_Level").forEach { diff ->
                            AssistChip(
                                onClick = { difficulty = diff },
                                label = { Text(diff) },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = if (difficulty == diff) {
                                        MaterialTheme.colorScheme.primaryContainer
                                    } else {
                                        MaterialTheme.colorScheme.surface
                                    }
                                )
                            )
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = questionCountStr,
                            onValueChange = { questionCountStr = it.filter(Char::isDigit) },
                            label = { Text("Questions (1-100)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f).testTag("admin_question_count")
                        )
                        OutlinedTextField(
                            value = durationStr,
                            onValueChange = { durationStr = it.filter(Char::isDigit) },
                            label = { Text("Timer (Minutes)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f).testTag("admin_test_duration")
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = marksPerQStr,
                            onValueChange = { marksPerQStr = it },
                            label = { Text("Marks / Question (2.0)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f).testTag("admin_marks_per_q")
                        )
                        OutlinedTextField(
                            value = negativeMarkStr,
                            onValueChange = { negativeMarkStr = it },
                            label = { Text("Negative Mark (0.66)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f).testTag("admin_negative_marking")
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
                                text = if (isPaid) "Paid Test (Requires Student Unlock / Admin Activation)" else "Free Open Mock Test",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Switch(
                            checked = isPaid,
                            onCheckedChange = { isPaid = it },
                            modifier = Modifier.testTag("admin_paid_toggle")
                        )
                    }

                    if (isPaid) {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = priceStr,
                                onValueChange = { priceStr = it.filter(Char::isDigit) },
                                label = { Text("Price (INR ₹)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f).testTag("admin_test_price")
                            )
                            OutlinedTextField(
                                value = validityDaysStr,
                                onValueChange = { validityDaysStr = it.filter(Char::isDigit) },
                                label = { Text("Validity (Days)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f).testTag("admin_test_validity_days")
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Publish Live Immediately", fontWeight = FontWeight.SemiBold)
                            Text(
                                text = if (publishImmediately) {
                                    "Test will be visible inside its folder immediately"
                                } else {
                                    "Save as Draft first to review before publishing"
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Switch(
                            checked = publishImmediately,
                            onCheckedChange = { publishImmediately = it },
                            modifier = Modifier.testTag("admin_publish_immediately_toggle")
                        )
                    }

                    if (isBusy && !aiProgressText.isNullOrBlank()) {
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = MaterialTheme.colorScheme.primaryContainer,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("ai_generation_progress_banner")
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = aiProgressText,
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                LinearProgressIndicator(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp),
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "5-Minute Extended Timeout Active (300,000 ms) • Generating Bilingual Hindi & English MCQs...",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }

                    Button(
                        onClick = {
                            val qCount = (questionCountStr.toIntOrNull() ?: 10).coerceIn(1, 100)
                            val dur = (durationStr.toIntOrNull() ?: 30).coerceIn(1, 240)
                            val marks = (marksPerQStr.toDoubleOrNull() ?: 2.0).coerceIn(0.5, 10.0)
                            val neg = (negativeMarkStr.toDoubleOrNull() ?: 0.66).coerceIn(0.0, 5.0)
                            val pr = if (isPaid) (priceStr.toLongOrNull() ?: 99L).coerceAtLeast(1L) else 0L
                            val valDays = (validityDaysStr.toLongOrNull() ?: 180L).coerceIn(1L, 3650L)

                            if (creationMode == "manual") {
                                onCreateManualTest(
                                    folderType, selectedFolderId, titleHi, titleEn, topic, difficulty,
                                    qCount, dur, marks, neg, isPaid, pr, valDays, publishImmediately
                                )
                            } else {
                                onGenerateAiTest(
                                    folderType, selectedFolderId, titleHi, titleEn, topic, difficulty,
                                    qCount, dur, marks, neg, isPaid, pr, valDays, customAiPrompt, publishImmediately
                                )
                            }
                        },
                        enabled = !isBusy,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                            .testTag("admin_generate_ai_test_button")
                    ) {
                        Icon(
                            imageVector = if (creationMode == "manual") Icons.Filled.Edit else Icons.Filled.AutoAwesome,
                            contentDescription = null
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = when {
                                isBusy -> "Generating questions, please wait..."
                                creationMode == "manual" -> "Create Manual Test & Open Question Editor"
                                publishImmediately -> "Generate with AI Prompt & Publish Live"
                                else -> "Generate Draft Test with AI Prompt"
                            },
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // All Existing Tests (Draft & Published) inside their Folders
        item {
            Text(
                text = "All Tests — Click any test to Edit Questions, Options, Marks, Timer & Paid/Free Status",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        when (allTestsState) {
            is UiState.Loading -> {
                item { CircularProgressIndicator() }
            }
            is UiState.Error -> {
                item { Text(allTestsState.message, color = MaterialTheme.colorScheme.error) }
            }
            is UiState.Success -> {
                items(allTestsState.data, key = { it.id }) { test ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (test.status == "published") {
                                        ExamAnsweredGreen.copy(alpha = 0.16f)
                                    } else {
                                        MaterialTheme.colorScheme.secondaryContainer
                                    }
                                ) {
                                    Text(
                                        text = "${test.status.uppercase()} • ${test.folderType.uppercase()}: ${test.folderId}",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = if (test.status == "published") {
                                            ExamAnsweredGreen
                                        } else {
                                            MaterialTheme.colorScheme.onSecondaryContainer
                                        },
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }

                                Text(
                                    text = if (test.isPaid) "PAID ₹${test.priceInr} (${test.validityDays}d)" else "FREE",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }

                            Text(
                                text = test.titleHi,
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = test.titleEn,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.secondary
                            )
                            Text(
                                text = "${test.questionCount} MCQs • ${test.durationMinutes} Mins • +${test.marksPerQuestion} / -${test.negativeMarking}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                FilledTonalButton(
                                    onClick = { onOpenTestEditor(test) },
                                    modifier = Modifier
                                        .weight(1f)
                                        .testTag("admin_edit_test_${test.id}")
                                ) {
                                    Icon(Icons.Filled.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Edit Questions & Settings")
                                }

                                if (test.status != "published") {
                                    Button(
                                        onClick = { onPublishDirect(test.id) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = ExamAnsweredGreen,
                                            contentColor = Color.White
                                        ),
                                        modifier = Modifier.testTag("admin_publish_test_${test.id}")
                                    ) {
                                        Icon(Icons.Filled.Publish, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Publish")
                                    }
                                }

                                IconButton(onClick = { onDeleteTest(test.id) }) {
                                    Icon(
                                        imageVector = Icons.Filled.Delete,
                                        contentDescription = "Delete Test",
                                        tint = MaterialTheme.colorScheme.error
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminFoldersControlTab(
    examFolders: List<ExamFolder>,
    subjectFolders: List<SubjectFolder>,
    onSaveExamFolder: (ExamFolder) -> Unit,
    onDeleteExamFolder: (String) -> Unit,
    onSaveSubjectFolder: (SubjectFolder) -> Unit,
    onDeleteSubjectFolder: (String) -> Unit
) {
    var folderKind by rememberSaveable { mutableStateOf("exam") }
    var titleHi by rememberSaveable { mutableStateOf("सीजीपीएससी प्री 2026 टेस्ट सीरीज") }
    var titleEn by rememberSaveable { mutableStateOf("CGPSC Pre 2026 Test Series") }
    var descHi by rememberSaveable { mutableStateOf("सीजीपीएससी प्रारंभिक परीक्षा 2026 के लिए पूर्ण द्विभाषी टेस्ट सीरीज") }
    var descEn by rememberSaveable { mutableStateOf("Complete Bilingual Test Series for CGPSC & CGSSB 2026") }
    var code by rememberSaveable { mutableStateOf("CGPSC_PRE_2026") }
    var isFree by rememberSaveable { mutableStateOf(false) }
    var priceStr by rememberSaveable { mutableStateOf("99") }
    var validityDaysStr by rememberSaveable { mutableStateOf("180") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .widthIn(max = 840.dp),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Create Exam-Wise or Subject-Wise Folder (Nested Tests Container)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AssistChip(
                            onClick = { folderKind = "exam" },
                            label = { Text("Exam-Wise Folder") },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (folderKind == "exam") {
                                    MaterialTheme.colorScheme.primaryContainer
                                } else {
                                    MaterialTheme.colorScheme.surface
                                }
                            )
                        )
                        AssistChip(
                            onClick = { folderKind = "subject" },
                            label = { Text("Subject-Wise Folder") },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (folderKind == "subject") {
                                    MaterialTheme.colorScheme.primaryContainer
                                } else {
                                    MaterialTheme.colorScheme.surface
                                }
                            )
                        )
                    }

                    OutlinedTextField(
                        value = titleHi,
                        onValueChange = { titleHi = it },
                        label = { Text("Folder Title (Hindi)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = titleEn,
                        onValueChange = { titleEn = it },
                        label = { Text("Folder Title (English)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = descHi,
                        onValueChange = { descHi = it },
                        label = { Text("Description (Hindi)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = descEn,
                        onValueChange = { descEn = it },
                        label = { Text("Description (English)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = code,
                        onValueChange = { code = it },
                        label = { Text("Folder Code (e.g., CGPSC_PRE_2026, CGSSB)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Free Folder for All Students")
                        Switch(checked = isFree, onCheckedChange = { isFree = it })
                    }

                    if (!isFree) {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = priceStr,
                                onValueChange = { priceStr = it.filter(Char::isDigit) },
                                label = { Text("Folder Price (INR ₹)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = validityDaysStr,
                                onValueChange = { validityDaysStr = it.filter(Char::isDigit) },
                                label = { Text("Validity Duration (Days)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Button(
                        onClick = {
                            val pr = if (isFree) 0L else (priceStr.toLongOrNull() ?: 99L)
                            val valDays = (validityDaysStr.toLongOrNull() ?: 180L).coerceIn(1L, 3650L)
                            val slugId = code.trim().lowercase().replace(Regex("[^a-z0-9]+"), "_")
                                .ifBlank { "folder_${System.currentTimeMillis()}" }
                            if (folderKind == "exam") {
                                onSaveExamFolder(
                                    ExamFolder(
                                        id = slugId,
                                        titleHi = titleHi,
                                        titleEn = titleEn,
                                        descriptionHi = descHi,
                                        descriptionEn = descEn,
                                        examCode = code.ifBlank { "CGPSC" },
                                        sortOrder = examFolders.size.toLong(),
                                        isFreeFolder = isFree,
                                        priceInr = pr,
                                        validityDays = valDays
                                    )
                                )
                            } else {
                                onSaveSubjectFolder(
                                    SubjectFolder(
                                        id = slugId,
                                        titleHi = titleHi,
                                        titleEn = titleEn,
                                        descriptionHi = descHi,
                                        descriptionEn = descEn,
                                        subjectCode = code.ifBlank { "CG_GS" },
                                        sortOrder = subjectFolders.size.toLong(),
                                        isFreeFolder = isFree,
                                        priceInr = pr,
                                        validityDays = valDays
                                    )
                                )
                            }
                        },
                        modifier = Modifier.fillMaxWidth().testTag("admin_save_folder_button")
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Save / Update Folder")
                    }
                }
            }
        }

        item {
            Text("Exam-Wise Folders (${examFolders.size})", fontWeight = FontWeight.Bold)
        }
        items(examFolders, key = { "ex_${it.id}" }) { ef ->
            Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(ef.titleHi, fontFamily = NotoDevanagariFamily, fontWeight = FontWeight.Bold)
                        Text(
                            text = "${ef.titleEn} • ${if (ef.isFreeFolder) "FREE" else "₹${ef.priceInr} (${ef.validityDays}d Validity)"}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    IconButton(onClick = { onDeleteExamFolder(ef.id) }) {
                        Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }

        item {
            Text("Subject-Wise Folders (${subjectFolders.size})", fontWeight = FontWeight.Bold)
        }
        items(subjectFolders, key = { "sub_${it.id}" }) { sf ->
            Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(sf.titleHi, fontFamily = NotoDevanagariFamily, fontWeight = FontWeight.Bold)
                        Text(
                            text = "${sf.titleEn} • ${if (sf.isFreeFolder) "FREE" else "₹${sf.priceInr} (${sf.validityDays}d Validity)"}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    IconButton(onClick = { onDeleteSubjectFolder(sf.id) }) {
                        Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}

/**
 * Tab 3: Admin Visual Analytics Charts (Paid vs Free Users, Active Subscriptions, Expired Accounts)
 * + Manual Student Access Activation with Activation-Based Validity Countdown.
 */
@Composable
private fun AdminAnalyticsAndStudentAccessTab(
    examFolders: List<ExamFolder>,
    subjectFolders: List<SubjectFolder>,
    allTests: List<TestSeriesItem>,
    allStudents: List<UserProfile>,
    allPurchases: List<PurchaseRecord>,
    isBusy: Boolean,
    onGrantStudentAccess: (
        studentIdentifier: String,
        targetId: String,
        titleHi: String,
        titleEn: String,
        amountInr: Long,
        validityDays: Long
    ) -> Unit
) {
    val nowMillis = System.currentTimeMillis()
    val totalUsersCount = allStudents.size.coerceAtLeast(1)
    val activePurchases = remember(allPurchases, nowMillis / 60_000L) {
        allPurchases.filter { !it.isSubscriptionExpired(nowMillis) }
    }
    val expiredPurchases = remember(allPurchases, nowMillis / 60_000L) {
        allPurchases.filter { it.isSubscriptionExpired(nowMillis) }
    }
    val paidUserIds = remember(activePurchases) { activePurchases.map { it.userId }.toSet() }
    val expiredUserIds = remember(expiredPurchases, paidUserIds) {
        expiredPurchases.map { it.userId }.filter { it !in paidUserIds }.toSet()
    }
    val paidUsersCount = paidUserIds.size
    val expiredUsersCount = expiredUserIds.size
    val freeUsersCount = (allStudents.size - paidUsersCount - expiredUsersCount).coerceAtLeast(0)

    var studentInput by rememberSaveable { mutableStateOf("") }
    var validityDaysInput by rememberSaveable { mutableStateOf("180") }

    val unlockTargets = remember(examFolders, subjectFolders, allTests) {
        buildList {
            examFolders.filter { !it.isFreeFolder }.forEach {
                add(Triple(it.id, it.titleHi, "${it.titleEn} (Folder • ₹${it.priceInr})") to (it.priceInr to it.validityDays))
            }
            subjectFolders.filter { !it.isFreeFolder }.forEach {
                add(Triple(it.id, it.titleHi, "${it.titleEn} (Subject • ₹${it.priceInr})") to (it.priceInr to it.validityDays))
            }
            allTests.filter { it.isPaid }.forEach {
                add(Triple(it.id, it.titleHi, "${it.titleEn} (Test • ₹${it.priceInr})") to (it.priceInr to it.validityDays))
            }
        }
    }

    var selectedTargetId by rememberSaveable {
        mutableStateOf(unlockTargets.firstOrNull()?.first?.first ?: "cgpsc_pre_2026_series")
    }

    val selectedTarget = unlockTargets.firstOrNull { it.first.first == selectedTargetId }
        ?: (Triple("cgpsc_pre_2026_series", "सीजीपीएससी प्री 2026 टेस्ट सीरीज", "CGPSC Pre 2026 Test Series") to (99L to 180L))

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .widthIn(max = 840.dp),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Visual Analytics Charts & Graphs Card
        item {
            AdminAnalyticsChartCard(
                totalUsers = totalUsersCount,
                paidUsersCount = paidUsersCount,
                freeUsersCount = freeUsersCount,
                activeSubscriptionsCount = activePurchases.size,
                expiredAccountsCount = expiredPurchases.size
            )
        }

        // 2. Manual Admin Activation with Activation-Based Validity Countdown
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.LockOpen,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Manual Student Activation (WhatsApp 9238810070 Verification)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "Activation-Based Validity Rule: Student's countdown starts strictly from the exact date & time you click Activate below.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    OutlinedTextField(
                        value = studentInput,
                        onValueChange = { studentInput = it },
                        label = { Text("Student Email ID, User ID (UID), or Mobile Number") },
                        placeholder = { Text("student@gmail.com or UID") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_unlock_student_input")
                    )

                    OutlinedTextField(
                        value = validityDaysInput,
                        onValueChange = { validityDaysInput = it.filter(Char::isDigit) },
                        label = { Text("Subscription Validity Duration (in Days from Activation)") },
                        placeholder = { Text("180 (6 Months) or 365 (1 Year)") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_unlock_validity_days_input")
                    )

                    Text(
                        text = "Select Paid Test Series / Folder to Unlock:",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        unlockTargets.forEach { (triple, priceAndVal) ->
                            val (id, hi, enLabel) = triple
                            val isSelected = selectedTargetId == id
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (isSelected) {
                                    MaterialTheme.colorScheme.primaryContainer
                                } else {
                                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selectedTargetId = id
                                        validityDaysInput = priceAndVal.second.toString()
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = hi,
                                            fontFamily = NotoDevanagariFamily,
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = enLabel,
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                    if (isSelected) {
                                        Icon(
                                            imageVector = Icons.Filled.CheckCircle,
                                            contentDescription = "Selected",
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Button(
                        onClick = {
                            val valDays = (validityDaysInput.toLongOrNull() ?: 180L).coerceIn(1L, 3650L)
                            onGrantStudentAccess(
                                studentInput,
                                selectedTarget.first.first,
                                selectedTarget.first.second,
                                selectedTarget.first.third,
                                selectedTarget.second.first.coerceAtLeast(1L),
                                valDays
                            )
                        },
                        enabled = !isBusy && studentInput.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ExamAnsweredGreen,
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("admin_grant_access_button")
                    ) {
                        Icon(Icons.Filled.LockOpen, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Activate Student Access (${validityDaysInput.ifBlank { "180" }} Days Validity)",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Registered Students Quick-Select List
        item {
            Text(
                text = "Registered Students (${allStudents.size}) — Tap any student to fill their Email/UID",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
        }

        items(allStudents, key = { it.id.ifBlank { it.userId } }) { student ->
            val isStudentPaid = student.userId in paidUserIds
            val isStudentExpired = student.userId in expiredUserIds
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        studentInput = student.email.ifBlank { student.userId }
                    }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = student.displayName.ifBlank { "Student" },
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Email: ${student.email.ifBlank { "N/A" }} • UID: ${student.userId}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = when {
                            isStudentPaid -> ExamAnsweredGreen.copy(alpha = 0.16f)
                            isStudentExpired -> MaterialTheme.colorScheme.errorContainer
                            else -> MaterialTheme.colorScheme.secondaryContainer
                        }
                    ) {
                        Text(
                            text = when {
                                isStudentPaid -> "PAID ACTIVE"
                                isStudentExpired -> "EXPIRED"
                                else -> "FREE USER"
                            },
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = when {
                                isStudentPaid -> ExamAnsweredGreen
                                isStudentExpired -> MaterialTheme.colorScheme.onErrorContainer
                                else -> MaterialTheme.colorScheme.onSecondaryContainer
                            },
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminAnalyticsChartCard(
    totalUsers: Int,
    paidUsersCount: Int,
    freeUsersCount: Int,
    activeSubscriptionsCount: Int,
    expiredAccountsCount: Int
) {
    val primaryColor = MaterialTheme.colorScheme.primary
    val secondaryColor = MaterialTheme.colorScheme.secondary
    val errorColor = MaterialTheme.colorScheme.error
    val greenColor = ExamAnsweredGreen

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("admin_analytics_chart_card")
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Filled.BarChart,
                    contentDescription = null,
                    tint = primaryColor
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "Student Subscriptions & Revenue Analytics",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = primaryColor
                    )
                    Text(
                        text = "Live comparison: Paid Users vs. Free Users, Active Subscriptions & Expired Accounts",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // KPI Summary Pills
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                AnalyticsMetricPill(
                    label = "Paid Users",
                    value = paidUsersCount.toString(),
                    color = greenColor,
                    modifier = Modifier.weight(1f)
                )
                AnalyticsMetricPill(
                    label = "Free Users",
                    value = freeUsersCount.toString(),
                    color = secondaryColor,
                    modifier = Modifier.weight(1f)
                )
                AnalyticsMetricPill(
                    label = "Active Subs",
                    value = activeSubscriptionsCount.toString(),
                    color = primaryColor,
                    modifier = Modifier.weight(1f)
                )
                AnalyticsMetricPill(
                    label = "Expired",
                    value = expiredAccountsCount.toString(),
                    color = errorColor,
                    modifier = Modifier.weight(1f)
                )
            }

            // Visual Donut + Bar Comparison Canvas
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp)
                    .padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Donut Chart: Paid vs Free vs Expired Users
                Box(
                    modifier = Modifier.size(120.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val strokeWidth = 18.dp.toPx()
                        val total = (paidUsersCount + freeUsersCount + expiredAccountsCount).coerceAtLeast(1).toFloat()
                        val paidSweep = (paidUsersCount / total) * 360f
                        val freeSweep = (freeUsersCount / total) * 360f
                        val expSweep = 360f - paidSweep - freeSweep

                        var startAngle = -90f
                        drawArc(
                            color = greenColor,
                            startAngle = startAngle,
                            sweepAngle = paidSweep.coerceAtLeast(8f),
                            useCenter = false,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Butt)
                        )
                        startAngle += paidSweep
                        drawArc(
                            color = secondaryColor,
                            startAngle = startAngle,
                            sweepAngle = freeSweep.coerceAtLeast(8f),
                            useCenter = false,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Butt)
                        )
                        startAngle += freeSweep
                        if (expSweep > 1f) {
                            drawArc(
                                color = errorColor,
                                startAngle = startAngle,
                                sweepAngle = expSweep,
                                useCenter = false,
                                style = Stroke(width = strokeWidth, cap = StrokeCap.Butt)
                            )
                        }
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "$totalUsers",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            text = "Students",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Horizontal Bar Chart comparing all 4 metrics
                val maxBarValue = maxOf(paidUsersCount, freeUsersCount, activeSubscriptionsCount, expiredAccountsCount, 1).toFloat()
                val bars = listOf(
                    Triple("Paid Users ($paidUsersCount)", paidUsersCount.toFloat() / maxBarValue, greenColor),
                    Triple("Free Users ($freeUsersCount)", freeUsersCount.toFloat() / maxBarValue, secondaryColor),
                    Triple("Active Subs ($activeSubscriptionsCount)", activeSubscriptionsCount.toFloat() / maxBarValue, primaryColor),
                    Triple("Expired ($expiredAccountsCount)", expiredAccountsCount.toFloat() / maxBarValue, errorColor)
                )

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    bars.forEach { (title, ratio, barColor) ->
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                text = title,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.SemiBold
                            )
                            Canvas(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(10.dp)
                            ) {
                                drawRoundRect(
                                    color = barColor.copy(alpha = 0.18f),
                                    size = size,
                                    cornerRadius = CornerRadius(8f, 8f)
                                )
                                drawRoundRect(
                                    color = barColor,
                                    size = Size(
                                        width = (size.width * ratio.coerceIn(0.06f, 1f)),
                                        height = size.height
                                    ),
                                    cornerRadius = CornerRadius(8f, 8f)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AnalyticsMetricPill(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.12f),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
                color = color
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

/**
 * Tab 4: Admin Broadcast Notification Hub (Rich Media + Pin) & Upcoming Test Series Manager.
 */
@Composable
private fun AdminBroadcastAndUpcomingTestsTab(
    notifications: List<BroadcastNotification>,
    upcomingTests: List<UpcomingTestItem>,
    isBusy: Boolean,
    onSaveNotification: (BroadcastNotification) -> Unit,
    onTogglePin: (BroadcastNotification) -> Unit,
    onDeleteNotification: (String) -> Unit,
    onSaveUpcomingTest: (UpcomingTestItem) -> Unit,
    onDeleteUpcomingTest: (String) -> Unit
) {
    var notifTitleHi by rememberSaveable { mutableStateOf("") }
    var notifTitleEn by rememberSaveable { mutableStateOf("") }
    var notifMsgHi by rememberSaveable { mutableStateOf("") }
    var notifMsgEn by rememberSaveable { mutableStateOf("") }
    var mediaType by rememberSaveable { mutableStateOf("none") }
    var mediaUrl by rememberSaveable { mutableStateOf("") }
    var mediaTitle by rememberSaveable { mutableStateOf("") }
    var isPinned by rememberSaveable { mutableStateOf(true) }

    // Upcoming Test form state
    var upTitleHi by rememberSaveable { mutableStateOf("") }
    var upTitleEn by rememberSaveable { mutableStateOf("") }
    var upExamCategory by rememberSaveable { mutableStateOf("CGPSC & CGSSB") }
    var upDateLabel by rememberSaveable { mutableStateOf("Sunday, 22 March 2026 • 10:00 AM") }
    var upSyllabusHi by rememberSaveable { mutableStateOf("") }
    var upSyllabusEn by rememberSaveable { mutableStateOf("") }
    var upIsPaid by rememberSaveable { mutableStateOf(true) }
    var upPriceStr by rememberSaveable { mutableStateOf("99") }
    var upValidityStr by rememberSaveable { mutableStateOf("180") }

    val mediaFilePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            mediaUrl = uri.toString()
            if (mediaTitle.isBlank()) {
                mediaTitle = uri.lastPathSegment ?: "Attached_${mediaType.uppercase()}"
            }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .widthIn(max = 840.dp),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Broadcast Notification Composer
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.NotificationsActive,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Send Broadcast Notification (Rich Media + Pin to Top)",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    OutlinedTextField(
                        value = notifTitleHi,
                        onValueChange = { notifTitleHi = it },
                        label = { Text("1. Notification Title (Hindi)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("admin_notif_title_hi")
                    )
                    OutlinedTextField(
                        value = notifTitleEn,
                        onValueChange = { notifTitleEn = it },
                        label = { Text("2. Notification Title (English)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("admin_notif_title_en")
                    )
                    OutlinedTextField(
                        value = notifMsgHi,
                        onValueChange = { notifMsgHi = it },
                        label = { Text("Message Body (Hindi)") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth().testTag("admin_notif_msg_hi")
                    )
                    OutlinedTextField(
                        value = notifMsgEn,
                        onValueChange = { notifMsgEn = it },
                        label = { Text("Message Body (English)") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth().testTag("admin_notif_msg_en")
                    )

                    Text(
                        text = "Rich Media Attachment Type (PDF/Docs, Image, Audio, Video):",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf(
                            "none" to "Text Only",
                            "pdf" to "PDF/Doc",
                            "image" to "Image",
                            "audio" to "Audio",
                            "video" to "Video"
                        ).forEach { (key, label) ->
                            AssistChip(
                                onClick = { mediaType = key },
                                label = { Text(label, style = MaterialTheme.typography.labelSmall) },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = if (mediaType == key) {
                                        MaterialTheme.colorScheme.primaryContainer
                                    } else {
                                        MaterialTheme.colorScheme.surface
                                    }
                                )
                            )
                        }
                    }

                    if (mediaType != "none") {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = mediaUrl,
                                onValueChange = { mediaUrl = it },
                                label = { Text("${mediaType.uppercase()} URL or Picked File URI") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            FilledTonalButton(
                                onClick = {
                                    val mime = when (mediaType) {
                                        "pdf" -> "application/pdf"
                                        "image" -> "image/*"
                                        "audio" -> "audio/*"
                                        "video" -> "video/*"
                                        else -> "*/*"
                                    }
                                    mediaFilePicker.launch(mime)
                                }
                            ) {
                                Icon(Icons.Filled.UploadFile, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Attach")
                            }
                        }

                        OutlinedTextField(
                            value = mediaTitle,
                            onValueChange = { mediaTitle = it },
                            label = { Text("Attachment Display Name (e.g., CGPSC_Syllabus_2026.pdf)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Pin Important Message to Top", fontWeight = FontWeight.SemiBold)
                            Text(
                                text = "Pinned messages remain fixed at the top of students' notification feed",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Switch(checked = isPinned, onCheckedChange = { isPinned = it })
                    }

                    Button(
                        onClick = {
                            onSaveNotification(
                                BroadcastNotification(
                                    titleHi = notifTitleHi.ifBlank { notifTitleEn },
                                    titleEn = notifTitleEn.ifBlank { notifTitleHi },
                                    messageHi = notifMsgHi.ifBlank { notifMsgEn },
                                    messageEn = notifMsgEn.ifBlank { notifMsgHi },
                                    mediaType = mediaType,
                                    mediaUrl = if (mediaType == "none") "" else mediaUrl,
                                    mediaTitle = if (mediaType == "none") "" else mediaTitle,
                                    isPinned = isPinned,
                                    visibility = "published"
                                )
                            )
                            notifTitleHi = ""
                            notifTitleEn = ""
                            notifMsgHi = ""
                            notifMsgEn = ""
                            mediaUrl = ""
                            mediaTitle = ""
                        },
                        enabled = !isBusy,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_send_broadcast_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Broadcast Notification to All Students", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Active Broadcast Notifications List (with Pin/Unpin & Delete)
        item {
            Text(
                text = "Live Broadcast Notifications (${notifications.size})",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
        }
        items(notifications, key = { "adm_notif_${it.id}" }) { notif ->
            Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "${if (notif.isPinned) "[PINNED] " else ""}${notif.titleHi}",
                            fontFamily = NotoDevanagariFamily,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${notif.titleEn} • Media: ${notif.mediaType.uppercase()}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                    Row {
                        IconButton(onClick = { onTogglePin(notif) }) {
                            Icon(
                                imageVector = Icons.Filled.PushPin,
                                contentDescription = "Toggle Pin",
                                tint = if (notif.isPinned) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                            )
                        }
                        IconButton(onClick = { onDeleteNotification(notif.id) }) {
                            Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }

        // 2. Upcoming Test Series Scheduler
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Schedule 'Upcoming Test Series' Announcement",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    OutlinedTextField(
                        value = upTitleHi,
                        onValueChange = { upTitleHi = it },
                        label = { Text("Upcoming Test Series Title (Hindi)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = upTitleEn,
                        onValueChange = { upTitleEn = it },
                        label = { Text("Upcoming Test Series Title (English)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = upExamCategory,
                            onValueChange = { upExamCategory = it },
                            label = { Text("Exam Category") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = upDateLabel,
                            onValueChange = { upDateLabel = it },
                            label = { Text("Scheduled Date & Time") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    OutlinedTextField(
                        value = upSyllabusHi,
                        onValueChange = { upSyllabusHi = it },
                        label = { Text("Syllabus Summary (Hindi)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = upSyllabusEn,
                        onValueChange = { upSyllabusEn = it },
                        label = { Text("Syllabus Summary (English)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Paid Upcoming Test Series")
                        Switch(checked = upIsPaid, onCheckedChange = { upIsPaid = it })
                    }

                    if (upIsPaid) {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = upPriceStr,
                                onValueChange = { upPriceStr = it.filter(Char::isDigit) },
                                label = { Text("Package Price (INR ₹)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = upValidityStr,
                                onValueChange = { upValidityStr = it.filter(Char::isDigit) },
                                label = { Text("Validity (Days)") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Button(
                        onClick = {
                            onSaveUpcomingTest(
                                UpcomingTestItem(
                                    titleHi = upTitleHi.ifBlank { upTitleEn },
                                    titleEn = upTitleEn.ifBlank { upTitleHi },
                                    examCategory = upExamCategory.ifBlank { "CGPSC & CGSSB" },
                                    scheduledDateLabel = upDateLabel.ifBlank { "Coming Soon" },
                                    syllabusSummaryHi = upSyllabusHi.ifBlank { upSyllabusEn },
                                    syllabusSummaryEn = upSyllabusEn.ifBlank { upSyllabusHi },
                                    isPaid = upIsPaid,
                                    priceInr = if (upIsPaid) (upPriceStr.toLongOrNull() ?: 99L) else 0L,
                                    validityDays = (upValidityStr.toLongOrNull() ?: 180L).coerceIn(1L, 3650L),
                                    visibility = "published"
                                )
                            )
                            upTitleHi = ""
                            upTitleEn = ""
                            upSyllabusHi = ""
                            upSyllabusEn = ""
                        },
                        enabled = !isBusy,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_save_upcoming_test_button")
                    ) {
                        Icon(Icons.Filled.Publish, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Publish Upcoming Test Series Schedule", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        items(upcomingTests, key = { "adm_up_${it.id}" }) { up ->
            Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(up.titleHi, fontFamily = NotoDevanagariFamily, fontWeight = FontWeight.Bold)
                        Text(
                            text = "${up.titleEn} • ${up.scheduledDateLabel}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                    IconButton(onClick = { onDeleteUpcomingTest(up.id) }) {
                        Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}

/**
 * Tab 5: Private Student Queries Inbox (Strictly Visible to Student & Admin) +
 * Exclusive Admin Manual Current Affairs Sync & Publisher.
 */
@Composable
private fun AdminQueriesAndCurrentAffairsTab(
    queries: List<StudentQuery>,
    isBusy: Boolean,
    onReplyToQuery: (query: StudentQuery, replyText: String, markResolved: Boolean) -> Unit,
    onSyncGroundedNews: () -> Unit,
    onSaveManualNews: (CurrentAffairItem) -> Unit
) {
    var category by rememberSaveable { mutableStateOf("chhattisgarh") }
    var headlineHi by rememberSaveable { mutableStateOf("") }
    var headlineEn by rememberSaveable { mutableStateOf("") }
    var summaryHi by rememberSaveable { mutableStateOf("") }
    var summaryEn by rememberSaveable { mutableStateOf("") }
    var pointHi by rememberSaveable { mutableStateOf("") }
    var pointEn by rememberSaveable { mutableStateOf("") }
    var sourceName by rememberSaveable { mutableStateOf("DPR Chhattisgarh / PIB") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .widthIn(max = 840.dp),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Exclusive Admin Manual Current Affairs Sync Card
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.65f)
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Current Affairs Auto-Sync (Every 60 Minutes)",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = "Manual sync is restricted exclusively to this Admin Panel. Stories expire automatically after 24 hours.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Button(
                        onClick = onSyncGroundedNews,
                        enabled = !isBusy,
                        modifier = Modifier.testTag("admin_ca_sync_grounded_button")
                    ) {
                        Icon(Icons.Filled.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Sync Now")
                    }
                }
            }
        }

        // 2. Private Student Queries Inbox
        item {
            Text(
                text = "Private Student Support Queries (${queries.size}) — Visible Only to Student & Admin",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        if (queries.isEmpty()) {
            item {
                Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "No student queries submitted yet.",
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        } else {
            items(queries, key = { "adm_q_${it.id}" }) { q ->
                var replyInput by remember(q.id, q.adminReply) { mutableStateOf(q.adminReply) }
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${q.studentName} (${q.studentEmail.ifBlank { q.userId }})",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (q.status == "resolved") {
                                    ExamAnsweredGreen.copy(alpha = 0.16f)
                                } else {
                                    MaterialTheme.colorScheme.secondaryContainer
                                }
                            ) {
                                Text(
                                    text = "${q.category.uppercase()} • ${q.status.uppercase()}",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = if (q.status == "resolved") {
                                        ExamAnsweredGreen
                                    } else {
                                        MaterialTheme.colorScheme.onSecondaryContainer
                                    },
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Text(text = q.subject, fontWeight = FontWeight.Bold)
                        Text(
                            text = q.message,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        OutlinedTextField(
                            value = replyInput,
                            onValueChange = { replyInput = it },
                            label = { Text("Admin Reply to ${q.studentName}") },
                            minLines = 2,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Button(
                            onClick = { onReplyToQuery(q, replyInput, true) },
                            enabled = !isBusy && replyInput.isNotBlank(),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Send Private Reply & Mark Resolved")
                        }
                    }
                }
            }
        }

        // 3. Manual Current Affairs Story & Digest Publisher
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Publish Custom Bilingual Current Affairs (24h Story + Digest)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("chhattisgarh", "national", "international").forEach { cat ->
                            AssistChip(
                                onClick = { category = cat },
                                label = { Text(cat.replaceFirstChar { it.uppercase() }) },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = if (category == cat) {
                                        MaterialTheme.colorScheme.primaryContainer
                                    } else {
                                        MaterialTheme.colorScheme.surface
                                    }
                                )
                            )
                        }
                    }

                    OutlinedTextField(
                        value = headlineHi,
                        onValueChange = { headlineHi = it },
                        label = { Text("1. Headline in Hindi (Devanagari)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = headlineEn,
                        onValueChange = { headlineEn = it },
                        label = { Text("2. Headline in English") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = summaryHi,
                        onValueChange = { summaryHi = it },
                        label = { Text("Summary in Hindi") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = summaryEn,
                        onValueChange = { summaryEn = it },
                        label = { Text("Summary in English") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = pointHi,
                        onValueChange = { pointHi = it },
                        label = { Text("Key Exam Point (Hindi)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = pointEn,
                        onValueChange = { pointEn = it },
                        label = { Text("Key Exam Point (English)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = sourceName,
                        onValueChange = { sourceName = it },
                        label = { Text("Official Source (e.g., DPR Chhattisgarh / PIB)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Button(
                        onClick = {
                            onSaveManualNews(
                                CurrentAffairItem(
                                    id = "ca_manual_${System.currentTimeMillis()}",
                                    category = category,
                                    headlineHi = headlineHi.ifBlank { "छत्तीसगढ़ समसामयिकी अपडेट" },
                                    headlineEn = headlineEn.ifBlank { "Chhattisgarh Current Affairs Update" },
                                    summaryHi = summaryHi.ifBlank { headlineHi },
                                    summaryEn = summaryEn.ifBlank { headlineEn },
                                    examKeyPointsHi = listOf(pointHi.ifBlank { "परीक्षा उपयोगी तथ्य" }),
                                    examKeyPointsEn = listOf(pointEn.ifBlank { "Important exam fact" }),
                                    sourceName = sourceName,
                                    sourceUrl = "https://dprcg.gov.in",
                                    dateLabel = LocalDate.now().toString(),
                                    visibility = "published",
                                    sourceModule = "admin_curated"
                                )
                            )
                            headlineHi = ""
                            headlineEn = ""
                            summaryHi = ""
                            summaryEn = ""
                            pointHi = ""
                            pointEn = ""
                        },
                        modifier = Modifier.fillMaxWidth().testTag("admin_publish_ca_button")
                    ) {
                        Icon(Icons.Filled.Publish, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Publish 24h Story & Current Affairs")
                    }
                }
            }
        }
    }
}

/**
 * Tab 6: Live Support & Help Policy Editor (Immediate Save/Publish),
 * WhatsApp Support (`9238810070`), Channel Anthem, and In-App APK Update Broadcaster.
 */
@Composable
private fun AdminPolicyAndConfigTab(
    appConfig: AppConfig,
    onSaveConfig: (AppConfig) -> Unit,
    onUploadAnthemBytes: (ByteArray, String, String, String) -> Unit
) {
    val context = LocalContext.current
    var titleHi by rememberSaveable { mutableStateOf(appConfig.anthemTitleHi) }
    var titleEn by rememberSaveable { mutableStateOf(appConfig.anthemTitleEn) }
    var audioUrl by rememberSaveable { mutableStateOf(appConfig.anthemAudioUrl) }
    var telegramUrl by rememberSaveable { mutableStateOf(appConfig.telegramChannelUrl) }
    var supportEmail by rememberSaveable { mutableStateOf(appConfig.supportEmail) }
    var whatsappNumber by rememberSaveable {
        mutableStateOf(appConfig.whatsappSupportNumber.ifBlank { "9238810070" })
    }
    var supportPolicyHi by rememberSaveable { mutableStateOf(appConfig.supportPolicyHi) }
    var supportPolicyEn by rememberSaveable { mutableStateOf(appConfig.supportPolicyEn) }
    var latestVersionCodeStr by rememberSaveable {
        mutableStateOf(appConfig.latestVersionCode.coerceAtLeast(2L).toString())
    }
    var latestVersionName by rememberSaveable {
        mutableStateOf(appConfig.latestVersionName.ifBlank { "2.0.0" })
    }
    var apkDownloadUrl by rememberSaveable {
        mutableStateOf(appConfig.apkDownloadUrl.ifBlank { "https://ais-dev-vv2z3zjsjlbt4utl2wktpm-618149121535.asia-northeast1.run.app/CGpedia.apk" })
    }
    var updateNotesHi by rememberSaveable { mutableStateOf(appConfig.updateNotesHi) }
    var updateNotesEn by rememberSaveable { mutableStateOf(appConfig.updateNotesEn) }

    // Sync local fields when cloud config updates for the first time if untouched
    LaunchedEffect(appConfig.updatedAt) {
        if (supportPolicyHi.isBlank() && appConfig.supportPolicyHi.isNotBlank()) {
            supportPolicyHi = appConfig.supportPolicyHi
        }
        if (supportPolicyEn.isBlank() && appConfig.supportPolicyEn.isNotBlank()) {
            supportPolicyEn = appConfig.supportPolicyEn
        }
    }

    val audioPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            runCatching {
                val mime = context.contentResolver.getType(uri) ?: "audio/mpeg"
                val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                if (bytes != null && bytes.isNotEmpty()) {
                    onUploadAnthemBytes(bytes, mime, titleHi, titleEn)
                }
            }
        }
    }

    val buildUpdatedConfig = {
        appConfig.copy(
            anthemTitleHi = titleHi,
            anthemTitleEn = titleEn,
            anthemSourceType = if (audioUrl.isNotBlank()) "url" else appConfig.anthemSourceType,
            anthemAudioUrl = audioUrl,
            telegramChannelUrl = telegramUrl,
            supportEmail = supportEmail,
            whatsappSupportNumber = whatsappNumber.ifBlank { "9238810070" },
            supportPolicyHi = supportPolicyHi,
            supportPolicyEn = supportPolicyEn,
            latestVersionCode = (latestVersionCodeStr.toLongOrNull() ?: 2L).coerceIn(1L, 100000L),
            latestVersionName = latestVersionName.ifBlank { "2.0.0" },
            apkDownloadUrl = apkDownloadUrl,
            updateNotesHi = updateNotesHi,
            updateNotesEn = updateNotesEn
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .widthIn(max = 840.dp),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Dedicated Support & Help Policy Live Editor Card
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
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
                                text = "Support & Help Policy Live Editor (Immediate Publish)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "Typing below and clicking Save & Publish updates the live Support & Help policy for all users immediately.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    OutlinedTextField(
                        value = whatsappNumber,
                        onValueChange = { whatsappNumber = it },
                        label = { Text("WhatsApp Support Number (Default: 9238810070)") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_whatsapp_support_input")
                    )

                    OutlinedTextField(
                        value = supportPolicyHi,
                        onValueChange = { supportPolicyHi = it },
                        label = { Text("1. Support & Help Policy (Hindi - देवनागरी)") },
                        minLines = 3,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_support_policy_hi_input")
                    )

                    OutlinedTextField(
                        value = supportPolicyEn,
                        onValueChange = { supportPolicyEn = it },
                        label = { Text("2. Support & Help Policy (English)") },
                        minLines = 3,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_support_policy_en_input")
                    )

                    OutlinedTextField(
                        value = telegramUrl,
                        onValueChange = { telegramUrl = it },
                        label = { Text("Telegram Support Channel URL") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = supportEmail,
                        onValueChange = { supportEmail = it },
                        label = { Text("Support Email") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
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
                            .testTag("admin_save_policy_live_button")
                    ) {
                        Icon(Icons.Filled.Save, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Save & Publish Support Policy Live", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // 2. Channel Anthem Audio & In-App Update Configuration
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.MusicNote, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Channel Anthem & In-App APK Update Broadcaster",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    OutlinedTextField(
                        value = titleHi,
                        onValueChange = { titleHi = it },
                        label = { Text("Anthem Title (Hindi)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = titleEn,
                        onValueChange = { titleEn = it },
                        label = { Text("Anthem Title (English)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    FilledTonalButton(
                        onClick = { audioPicker.launch("audio/*") },
                        modifier = Modifier.fillMaxWidth().testTag("admin_pick_anthem_file_button")
                    ) {
                        Icon(Icons.Filled.UploadFile, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Select & Upload Custom Anthem Audio File (.mp3 / .wav)")
                    }

                    OutlinedTextField(
                        value = audioUrl,
                        onValueChange = { audioUrl = it },
                        label = { Text("Or Direct Audio Stream URL (Optional)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    HorizontalDivider()

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = latestVersionCodeStr,
                            onValueChange = { latestVersionCodeStr = it.filter(Char::isDigit) },
                            label = { Text("Latest Version Code") },
                            singleLine = true,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("admin_latest_version_code_input")
                        )
                        OutlinedTextField(
                            value = latestVersionName,
                            onValueChange = { latestVersionName = it },
                            label = { Text("Version Name (2.0.0)") },
                            singleLine = true,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("admin_latest_version_name_input")
                        )
                    }

                    OutlinedTextField(
                        value = apkDownloadUrl,
                        onValueChange = { apkDownloadUrl = it },
                        label = { Text("Direct APK Download Link") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_apk_download_url_input")
                    )

                    OutlinedTextField(
                        value = updateNotesHi,
                        onValueChange = { updateNotesHi = it },
                        label = { Text("What's New / Update Notes (Hindi)") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = updateNotesEn,
                        onValueChange = { updateNotesEn = it },
                        label = { Text("What's New / Update Notes (English)") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Button(
                        onClick = { onSaveConfig(buildUpdatedConfig()) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("admin_save_global_config_button")
                    ) {
                        Text("Save All Configuration & Broadcast Update", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
