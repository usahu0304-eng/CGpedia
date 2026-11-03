package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.FolderSpecial
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.CurrentAffairItem
import com.example.data.model.ExamFolder
import com.example.data.model.PurchaseRecord
import com.example.data.model.SubjectFolder
import com.example.data.model.TestAttempt
import com.example.data.model.TestSeriesItem
import com.example.data.model.UiState
import com.example.data.seed.CgpediaStarterCatalog
import com.example.ui.i18n.CgUiStrings
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.ExamFreeTeal
import com.example.ui.theme.ExamPaidIndigo
import com.example.ui.theme.NotoDevanagariFamily

@Composable
fun HomeScreen(
    strings: CgUiStrings,
    examFoldersState: UiState<List<ExamFolder>>,
    subjectFoldersState: UiState<List<SubjectFolder>>,
    publishedTestsState: UiState<List<TestSeriesItem>>,
    purchases: List<PurchaseRecord>,
    attempts: List<TestAttempt>,
    onStartTest: (TestSeriesItem) -> Unit,
    onPurchaseItem: (id: String, titleHi: String, titleEn: String, amountInr: Long, method: String, onDone: () -> Unit) -> Unit,
    modifier: Modifier = Modifier,
    currentAffairsItems: List<CurrentAffairItem> = CgpediaStarterCatalog.defaultCurrentAffairs(),
    whatsappSupportNumber: String = "9238810070"
) {
    var examSectionExpanded by rememberSaveable { mutableStateOf(true) }
    var subjectSectionExpanded by rememberSaveable { mutableStateOf(true) }
    var openedFolderType by rememberSaveable { mutableStateOf<String?>(null) }
    var openedFolderId by rememberSaveable { mutableStateOf<String?>(null) }
    var openedFolderTitleHi by rememberSaveable { mutableStateOf("") }
    var openedFolderTitleEn by rememberSaveable { mutableStateOf("") }
    var openedFolderPrice by rememberSaveable { mutableStateOf(99L) }
    var openedFolderIsFree by rememberSaveable { mutableStateOf(true) }

    var pendingUnlockTest by remember { mutableStateOf<TestSeriesItem?>(null) }

    val purchasedIds = remember(purchases) { purchases.map { it.testId }.toSet() }
    val allUnlockedByMasterGrant = "ALL_PAID_SERIES" in purchasedIds
    val allTests = (publishedTestsState as? UiState.Success)?.data
        .orEmpty()
        .ifEmpty { CgpediaStarterCatalog.defaultTests() }

    val supportPhone = whatsappSupportNumber.ifBlank { "9238810070" }

    if (openedFolderId != null) {
        BackHandler {
            openedFolderId = null
            openedFolderType = null
        }

        val folderTests = allTests.filter {
            it.folderId == openedFolderId ||
                (openedFolderId == "cgpsc_pre_2026_series" && it.folderId == "cgpsc_prelims") ||
                (openedFolderType == "subject" && it.folderId.isBlank() && openedFolderId == "subj_indian_polity")
        }
        val isFolderUnlocked = openedFolderIsFree ||
            openedFolderId in purchasedIds ||
            allUnlockedByMasterGrant ||
            (openedFolderId == "cgpsc_prelims" && "cgpsc_pre_2026_series" in purchasedIds)

        Column(modifier = modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = {
                        openedFolderId = null
                        openedFolderType = null
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .testTag("folder_back_button")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back"
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (strings.isHindi) openedFolderTitleHi else openedFolderTitleEn,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (strings.isHindi) openedFolderTitleEn else openedFolderTitleHi,
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (!isFolderUnlocked) {
                    Button(
                        onClick = {
                            pendingUnlockTest = TestSeriesItem(
                                id = openedFolderId.orEmpty(),
                                folderType = openedFolderType ?: "exam",
                                folderId = openedFolderId.orEmpty(),
                                titleHi = openedFolderTitleHi,
                                titleEn = openedFolderTitleEn,
                                isPaid = true,
                                priceInr = openedFolderPrice.coerceAtLeast(99L)
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ExamPaidIndigo),
                        modifier = Modifier.testTag("unlock_entire_folder_button")
                    ) {
                        Icon(Icons.Filled.LockOpen, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Unlock ₹${openedFolderPrice.coerceAtLeast(99L)}")
                    }
                }
            }

            if (folderTests.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (strings.isHindi) {
                            "इस फ़ोल्डर में जल्द ही नए द्विभाषी टेस्ट प्रकाशित किए जाएंगे।"
                        } else {
                            "New bilingual mock tests will be published in this folder soon."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(folderTests, key = { it.id }) { test ->
                        val isUnlocked = !test.isPaid ||
                            isFolderUnlocked ||
                            test.id in purchasedIds ||
                            test.folderId in purchasedIds ||
                            "cgpsc_pre_2026_series" in purchasedIds
                        TestSeriesCard(
                            test = test,
                            strings = strings,
                            isUnlocked = isUnlocked,
                            onActionClick = {
                                if (isUnlocked) {
                                    onStartTest(test)
                                } else {
                                    pendingUnlockTest = test
                                }
                            }
                        )
                    }
                }
            }
        }
    } else {
        LazyColumn(
            modifier = modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. Instagram-Stories-style Bilingual Current Affairs Bar at the Top of the Screen
            item {
                CurrentAffairsStoriesBar(items = currentAffairsItems)
            }

            // 2. Featured Paid Test Series Package (CGPSC Pre 2026 Test Series @ ₹99) + WhatsApp 9238810070 Support Banner
            item {
                val isPre2026Unlocked = "cgpsc_pre_2026_series" in purchasedIds || allUnlockedByMasterGrant
                PaidSeriesFeaturedBanner(
                    isUnlocked = isPre2026Unlocked,
                    whatsappNumber = supportPhone,
                    onOpenOrUnlock = {
                        if (isPre2026Unlocked) {
                            openedFolderType = "exam"
                            openedFolderId = "cgpsc_pre_2026_series"
                            openedFolderTitleHi = "सीजीपीएससी प्री 2026 टेस्ट सीरीज"
                            openedFolderTitleEn = "CGPSC Pre 2026 Test Series"
                            openedFolderPrice = 99L
                            openedFolderIsFree = false
                        } else {
                            pendingUnlockTest = TestSeriesItem(
                                id = "cgpsc_pre_2026_series",
                                folderType = "exam",
                                folderId = "cgpsc_pre_2026_series",
                                titleHi = "सीजीपीएससी प्री 2026 टेस्ट सीरीज",
                                titleEn = "CGPSC Pre 2026 Test Series",
                                isPaid = true,
                                priceInr = 99L
                            )
                        }
                    },
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }

            if (attempts.isNotEmpty()) {
                item {
                    Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                        RecentPerformanceStrip(attempts = attempts, isHindi = strings.isHindi)
                    }
                }
            }

            // Parent Folder 1: Exam-Wise Test Series
            item {
                Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                    ParentFolderHeaderCard(
                        title = strings.examWiseFolderTitle,
                        subtitle = strings.examWiseFolderDesc,
                        isExpanded = examSectionExpanded,
                        isPrimaryAccent = true,
                        tag = "parent_folder_exam_wise",
                        onToggle = { examSectionExpanded = !examSectionExpanded }
                    )
                }
            }

            item {
                AnimatedVisibility(visible = examSectionExpanded) {
                    Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                        when (examFoldersState) {
                            is UiState.Loading -> LoadingRow()
                            is UiState.Error -> ErrorNote(examFoldersState.message)
                            is UiState.Success -> {
                                val examList = examFoldersState.data.ifEmpty { CgpediaStarterCatalog.defaultExamFolders() }
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    examList.forEach { folder ->
                                        val count = allTests.count { it.folderId == folder.id }
                                        val unlocked = folder.isFreeFolder ||
                                            folder.id in purchasedIds ||
                                            allUnlockedByMasterGrant
                                        SubFolderItemCard(
                                            titleHi = folder.titleHi,
                                            titleEn = folder.titleEn,
                                            descHi = folder.descriptionHi,
                                            descEn = folder.descriptionEn,
                                            isFree = folder.isFreeFolder,
                                            isUnlocked = unlocked,
                                            priceInr = folder.priceInr,
                                            testCount = count.coerceAtLeast(folder.testCount.toInt()),
                                            strings = strings,
                                            tag = "subfolder_${folder.id}",
                                            onClick = {
                                                openedFolderType = "exam"
                                                openedFolderId = folder.id
                                                openedFolderTitleHi = folder.titleHi
                                                openedFolderTitleEn = folder.titleEn
                                                openedFolderPrice = folder.priceInr
                                                openedFolderIsFree = folder.isFreeFolder
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Parent Folder 2: Subject-Wise Test Series
            item {
                Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                    ParentFolderHeaderCard(
                        title = strings.subjectWiseFolderTitle,
                        subtitle = strings.subjectWiseFolderDesc,
                        isExpanded = subjectSectionExpanded,
                        isPrimaryAccent = false,
                        tag = "parent_folder_subject_wise",
                        onToggle = { subjectSectionExpanded = !subjectSectionExpanded }
                    )
                }
            }

            item {
                AnimatedVisibility(visible = subjectSectionExpanded) {
                    Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                        when (subjectFoldersState) {
                            is UiState.Loading -> LoadingRow()
                            is UiState.Error -> ErrorNote(subjectFoldersState.message)
                            is UiState.Success -> {
                                val subjList = subjectFoldersState.data.ifEmpty { CgpediaStarterCatalog.defaultSubjectFolders() }
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    subjList.forEach { folder ->
                                        val count = allTests.count {
                                            it.folderId == folder.id || (it.folderId.isBlank() && folder.id == "subj_indian_polity")
                                        }
                                        val unlocked = folder.isFreeFolder ||
                                            folder.id in purchasedIds ||
                                            allUnlockedByMasterGrant
                                        SubFolderItemCard(
                                            titleHi = folder.titleHi,
                                            titleEn = folder.titleEn,
                                            descHi = folder.descriptionHi,
                                            descEn = folder.descriptionEn,
                                            isFree = folder.isFreeFolder,
                                            isUnlocked = unlocked,
                                            priceInr = folder.priceInr,
                                            testCount = count.coerceAtLeast(folder.testCount.toInt()),
                                            strings = strings,
                                            tag = "subfolder_${folder.id}",
                                            onClick = {
                                                openedFolderType = "subject"
                                                openedFolderId = folder.id
                                                openedFolderTitleHi = folder.titleHi
                                                openedFolderTitleEn = folder.titleEn
                                                openedFolderPrice = folder.priceInr
                                                openedFolderIsFree = folder.isFreeFolder
                                            }
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

    pendingUnlockTest?.let { lockedTest ->
        PaymentCheckoutDialog(
            test = lockedTest,
            isHindi = strings.isHindi,
            whatsappSupportNumber = supportPhone,
            onDismiss = { pendingUnlockTest = null },
            onConfirmPay = { method ->
                onPurchaseItem(
                    lockedTest.id,
                    lockedTest.titleHi,
                    lockedTest.titleEn,
                    lockedTest.priceInr.coerceAtLeast(1L),
                    method
                ) {
                    val unlocked = lockedTest
                    pendingUnlockTest = null
                    // If this was a single test (not a folder container), start it immediately
                    if (unlocked.questionCount > 0L) {
                        onStartTest(unlocked)
                    }
                }
            }
        )
    }
}

@Composable
private fun PaidSeriesFeaturedBanner(
    isUnlocked: Boolean,
    whatsappNumber: String,
    onOpenOrUnlock: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    Card(
        shape = RoundedCornerShape(20.dp),
        modifier = modifier
            .fillMaxWidth()
            .testTag("paid_series_featured_card")
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.primary,
                            ExamPaidIndigo
                        )
                    )
                )
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "सीजीपीएससी प्री 2026 टेस्ट सीरीज",
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Text(
                            text = "CGPSC Pre 2026 Test Series • Full Bilingual Package",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.90f)
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = if (isUnlocked) ExamAnsweredGreen else MaterialTheme.colorScheme.tertiaryContainer
                    ) {
                        Text(
                            text = if (isUnlocked) "UNLOCKED" else "₹99 ONLY",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (isUnlocked) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onTertiaryContainer,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }

                // Payment Support Note with WhatsApp 9238810070
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.14f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("whatsapp_payment_support_banner")
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.SupportAgent,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = "Payment Assistance & Queries WhatsApp: $whatsappNumber",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                                Text(
                                    text = "भुगतान सहायता एवं अनलॉक हेतु WhatsApp: $whatsappNumber पर अपनी User ID / Email भेजें",
                                    fontFamily = NotoDevanagariFamily,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.88f)
                                )
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onOpenOrUnlock,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.surface,
                            contentColor = MaterialTheme.colorScheme.primary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("featured_series_action_button")
                    ) {
                        Icon(
                            imageVector = if (isUnlocked) Icons.Filled.PlayArrow else Icons.Filled.LockOpen,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isUnlocked) "Open Test Series" else "Unlock @ ₹99",
                            fontWeight = FontWeight.Bold
                        )
                    }

                    AssistChip(
                        onClick = {
                            val cleanDigits = whatsappNumber.filter(Char::isDigit).takeLast(10)
                            runCatching {
                                context.startActivity(
                                    Intent(
                                        Intent.ACTION_VIEW,
                                        Uri.parse("https://wa.me/91$cleanDigits")
                                    )
                                )
                            }
                        },
                        label = {
                            Text(
                                text = "WhatsApp",
                                color = MaterialTheme.colorScheme.onPrimary,
                                fontWeight = FontWeight.SemiBold
                            )
                        },
                        modifier = Modifier.height(48.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun RecentPerformanceStrip(attempts: List<TestAttempt>, isHindi: Boolean) {
    val latest = attempts.first()
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Icon(
                    imageVector = Icons.Filled.WorkspacePremium,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = if (isHindi) "नवीनतम प्रदर्शन: ${latest.testTitleHi}" else "Last Attempt: ${latest.testTitleEn}",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        maxLines = 1
                    )
                    Text(
                        text = "Score: ${latest.score}/${latest.maxScore} • Accuracy: ${latest.accuracyPercent}% (${attempts.size} tests taken)",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.85f)
                    )
                }
            }
        }
    }
}

@Composable
private fun ParentFolderHeaderCard(
    title: String,
    subtitle: String,
    isExpanded: Boolean,
    isPrimaryAccent: Boolean,
    tag: String,
    onToggle: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .clickable(onClick = onToggle)
            .testTag(tag),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isPrimaryAccent) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.secondary
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.FolderSpecial,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.size(30.dp)
            )
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimary
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.88f)
                )
            }
            Icon(
                imageVector = if (isExpanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                contentDescription = if (isExpanded) "Collapse" else "Expand",
                tint = MaterialTheme.colorScheme.onPrimary
            )
        }
    }
}

@Composable
private fun SubFolderItemCard(
    titleHi: String,
    titleEn: String,
    descHi: String,
    descEn: String,
    isFree: Boolean,
    isUnlocked: Boolean,
    priceInr: Long,
    testCount: Int,
    strings: CgUiStrings,
    tag: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .testTag(tag),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Folder,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = if (strings.isHindi) titleHi else titleEn,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    AccessTagBadge(isFree = isFree, isUnlocked = isUnlocked, priceInr = priceInr, strings = strings)
                }
                Text(
                    text = if (strings.isHindi) descHi else descEn,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "$testCount Bilingual Tests • हिंदी + English",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun AccessTagBadge(
    isFree: Boolean,
    isUnlocked: Boolean,
    priceInr: Long,
    strings: CgUiStrings
) {
    val bgColor = when {
        isFree -> ExamFreeTeal.copy(alpha = 0.14f)
        isUnlocked -> MaterialTheme.colorScheme.secondaryContainer
        else -> ExamPaidIndigo.copy(alpha = 0.14f)
    }
    val contentColor = when {
        isFree -> ExamFreeTeal
        isUnlocked -> MaterialTheme.colorScheme.secondary
        else -> ExamPaidIndigo
    }
    val text = when {
        isFree -> strings.freeBadge
        isUnlocked -> strings.unlockedBadge
        else -> "₹$priceInr • LOCKED"
    }

    Surface(
        shape = RoundedCornerShape(50),
        color = bgColor
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = contentColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

@Composable
private fun TestSeriesCard(
    test: TestSeriesItem,
    strings: CgUiStrings,
    isUnlocked: Boolean,
    onActionClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("test_card_${test.id}"),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = test.titleHi,
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = test.titleEn,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                AccessTagBadge(
                    isFree = !test.isPaid,
                    isUnlocked = isUnlocked,
                    priceInr = test.priceInr,
                    strings = strings
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.Timer,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${test.durationMinutes} mins",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    text = "• ${test.questionCount} Qs (+${test.marksPerQuestion} / -${test.negativeMarking})",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "• ${test.difficulty.replace("_", " ")}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.tertiary
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = onActionClick,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isUnlocked) MaterialTheme.colorScheme.primary else ExamPaidIndigo
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("test_action_btn_${test.id}")
            ) {
                Icon(
                    imageVector = if (isUnlocked) Icons.Filled.PlayArrow else Icons.Filled.Lock,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isUnlocked) {
                        strings.startTestBtn
                    } else {
                        "${strings.unlockTestBtn} • ₹${test.priceInr}"
                    }
                )
            }
        }
    }
}

@Composable
private fun PaymentCheckoutDialog(
    test: TestSeriesItem,
    isHindi: Boolean,
    whatsappSupportNumber: String,
    onDismiss: () -> Unit,
    onConfirmPay: (String) -> Unit
) {
    val context = LocalContext.current
    var selectedMethod by remember { mutableStateOf("UPI") }
    val methods = listOf("UPI", "Card", "NetBanking")
    val cleanWhatsapp = whatsappSupportNumber.ifBlank { "9238810070" }

    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                imageVector = Icons.Filled.AccountBalanceWallet,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
        },
        title = {
            Text(
                text = if (isHindi) "प्रीमियम टेस्ट अनलॉक गेटवे" else "CGpedia Secure Payment Gateway",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = test.titleHi,
                    fontFamily = NotoDevanagariFamily,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = test.titleEn,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Payable Amount", style = MaterialTheme.typography.labelLarge)
                        Text(
                            text = "₹${test.priceInr}",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                Text(
                    text = "Select Payment Method:",
                    style = MaterialTheme.typography.labelMedium
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    methods.forEach { m ->
                        FilterChip(
                            selected = selectedMethod == m,
                            onClick = { selectedMethod = m },
                            label = { Text(m) }
                        )
                    }
                }

                // Payment Support Note showing WhatsApp 9238810070
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.65f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val digits = cleanWhatsapp.filter(Char::isDigit).takeLast(10)
                            runCatching {
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/91$digits")))
                            }
                        }
                        .testTag("payment_whatsapp_support_note")
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "Payment Support & Queries WhatsApp: $cleanWhatsapp",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                        Text(
                            text = "भुगतान सहायता या मैनुअल अनलॉक के लिए WhatsApp नंबर $cleanWhatsapp पर अपनी रजिस्टर्ड User ID या Email ID भेजें।",
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirmPay(selectedMethod) },
                modifier = Modifier.testTag("confirm_payment_button")
            ) {
                Icon(Icons.Filled.LockOpen, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Pay ₹${test.priceInr} & Unlock")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun LoadingRow() {
    Box(modifier = Modifier.fillMaxWidth().padding(20.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
private fun ErrorNote(msg: String) {
    Text(
        text = msg,
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.error,
        modifier = Modifier.padding(8.dp)
    )
}
