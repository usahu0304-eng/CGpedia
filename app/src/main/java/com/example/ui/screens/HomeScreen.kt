package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.model.CurrentAffairItem
import com.example.data.model.ExamFolder
import com.example.data.model.PurchaseRecord
import com.example.data.model.SubjectFolder
import com.example.data.model.TestAttempt
import com.example.data.model.TestSeriesItem
import com.example.data.model.UiState
import com.example.data.model.isSubscriptionExpired
import com.example.data.model.remainingValidityDays
import com.example.ui.i18n.CgUiStrings
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.NotoDevanagariFamily

private data class SelectedFolderInfo(
    val folderType: String, // "exam" or "subject"
    val folderId: String,
    val titleHi: String,
    val titleEn: String,
    val descriptionHi: String,
    val descriptionEn: String,
    val isFreeFolder: Boolean,
    val priceInr: Long,
    val validityDays: Long = 180L
)

private data class CheckoutTarget(
    val id: String,
    val titleHi: String,
    val titleEn: String,
    val priceInr: Long,
    val validityDays: Long = 180L
)

@Composable
fun HomeScreen(
    strings: CgUiStrings,
    examFoldersState: UiState<List<ExamFolder>>,
    subjectFoldersState: UiState<List<SubjectFolder>>,
    publishedTestsState: UiState<List<TestSeriesItem>>,
    currentAffairsItems: List<CurrentAffairItem>,
    purchases: List<PurchaseRecord>,
    attempts: List<TestAttempt>,
    whatsappSupportNumber: String,
    onStartTest: (TestSeriesItem) -> Unit,
    onPurchaseItem: (
        id: String,
        titleHi: String,
        titleEn: String,
        amountInr: Long,
        method: String,
        validityDays: Long,
        onDone: () -> Unit
    ) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedCategoryTab by rememberSaveable { mutableIntStateOf(0) } // 0 = Exam-Wise, 1 = Subject-Wise
    var activeFolder by remember { mutableStateOf<SelectedFolderInfo?>(null) }
    var checkoutTarget by remember { mutableStateOf<CheckoutTarget?>(null) }

    // Activation-Based Validity Rule: Only non-expired purchases unlock access!
    val nowMillis = System.currentTimeMillis()
    val activePurchaseByItemId = remember(purchases, nowMillis / 60_000L) {
        purchases.filter { !it.isSubscriptionExpired(nowMillis) }
            .associateBy { it.testId }
    }
    val unlockedIds = remember(activePurchaseByItemId) { activePurchaseByItemId.keys }
    val expiredIds = remember(purchases, unlockedIds, nowMillis / 60_000L) {
        purchases.filter { it.isSubscriptionExpired(nowMillis) && it.testId !in unlockedIds }
            .map { it.testId }
            .toSet()
    }
    val publishedTests = (publishedTestsState as? UiState.Success)?.data.orEmpty()

    if (activeFolder != null) {
        BackHandler {
            activeFolder = null
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        val currentFolder = activeFolder
        if (currentFolder != null) {
            FolderDetailTestListView(
                strings = strings,
                folder = currentFolder,
                testsInFolder = publishedTests.filter {
                    it.folderType == currentFolder.folderType && it.folderId == currentFolder.folderId
                },
                unlockedIds = unlockedIds,
                expiredIds = expiredIds,
                activePurchaseByItemId = activePurchaseByItemId,
                attempts = attempts,
                whatsappSupportNumber = whatsappSupportNumber,
                onBack = { activeFolder = null },
                onStartTest = onStartTest,
                onRequestUnlock = { target -> checkoutTarget = target }
            )
        } else {
            // Top Category Switcher: Exam-Wise Folders vs Subject-Wise Folders
            TabRow(
                selectedTabIndex = selectedCategoryTab,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary,
                modifier = Modifier.fillMaxWidth()
            ) {
                Tab(
                    selected = selectedCategoryTab == 0,
                    onClick = { selectedCategoryTab = 0 },
                    text = {
                        Text(
                            text = strings.examWiseFolderTitle,
                            fontWeight = if (selectedCategoryTab == 0) FontWeight.Bold else FontWeight.Medium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    },
                    modifier = Modifier.testTag("home_tab_exam_wise")
                )
                Tab(
                    selected = selectedCategoryTab == 1,
                    onClick = { selectedCategoryTab = 1 },
                    text = {
                        Text(
                            text = strings.subjectWiseFolderTitle,
                            fontWeight = if (selectedCategoryTab == 1) FontWeight.Bold else FontWeight.Medium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    },
                    modifier = Modifier.testTag("home_tab_subject_wise")
                )
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .widthIn(max = 840.dp),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Instagram-Style Current Affairs 24h Stories Bar at Top of Screen
                if (currentAffairsItems.isNotEmpty()) {
                    item(key = "home_instagram_stories_bar") {
                        CurrentAffairsStoriesBar(
                            items = currentAffairsItems
                        )
                    }
                }

                item {
                    WhatsAppSupportBannerCard(
                        whatsappNumber = whatsappSupportNumber,
                        subtitle = if (selectedCategoryTab == 0) strings.examWiseFolderDesc else strings.subjectWiseFolderDesc
                    )
                }

                if (selectedCategoryTab == 0) {
                    when (examFoldersState) {
                        is UiState.Loading -> {
                            item {
                                Box(
                                    modifier = Modifier.fillMaxWidth().padding(32.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator()
                                }
                            }
                        }
                        is UiState.Error -> {
                            item {
                                Text(
                                    text = examFoldersState.message,
                                    color = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                        is UiState.Success -> {
                            items(examFoldersState.data, key = { it.id }) { folder ->
                                val countInFolder = publishedTests.count {
                                    it.folderType == "exam" && it.folderId == folder.id
                                }.takeIf { it > 0 } ?: folder.testCount.toInt()
                                val isUnlocked = folder.isFreeFolder || folder.id in unlockedIds
                                val isExpired = !isUnlocked && folder.id in expiredIds
                                val remDays = activePurchaseByItemId[folder.id]?.remainingValidityDays(nowMillis)

                                FolderCardItem(
                                    folderId = folder.id,
                                    titleHi = folder.titleHi,
                                    titleEn = folder.titleEn,
                                    descHi = folder.descriptionHi,
                                    descEn = folder.descriptionEn,
                                    codeBadge = folder.examCode,
                                    testCount = countInFolder,
                                    isFree = folder.isFreeFolder,
                                    priceInr = folder.priceInr,
                                    validityDays = folder.validityDays,
                                    isUnlocked = isUnlocked,
                                    isExpired = isExpired,
                                    remainingDays = remDays,
                                    strings = strings,
                                    onClick = {
                                        activeFolder = SelectedFolderInfo(
                                            folderType = "exam",
                                            folderId = folder.id,
                                            titleHi = folder.titleHi,
                                            titleEn = folder.titleEn,
                                            descriptionHi = folder.descriptionHi,
                                            descriptionEn = folder.descriptionEn,
                                            isFreeFolder = folder.isFreeFolder,
                                            priceInr = folder.priceInr,
                                            validityDays = folder.validityDays
                                        )
                                    }
                                )
                            }
                        }
                    }
                } else {
                    when (subjectFoldersState) {
                        is UiState.Loading -> {
                            item {
                                Box(
                                    modifier = Modifier.fillMaxWidth().padding(32.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator()
                                }
                            }
                        }
                        is UiState.Error -> {
                            item {
                                Text(
                                    text = subjectFoldersState.message,
                                    color = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                        is UiState.Success -> {
                            items(subjectFoldersState.data, key = { it.id }) { folder ->
                                val countInFolder = publishedTests.count {
                                    it.folderType == "subject" && it.folderId == folder.id
                                }.takeIf { it > 0 } ?: folder.testCount.toInt()
                                val isUnlocked = folder.isFreeFolder || folder.id in unlockedIds
                                val isExpired = !isUnlocked && folder.id in expiredIds
                                val remDays = activePurchaseByItemId[folder.id]?.remainingValidityDays(nowMillis)

                                FolderCardItem(
                                    folderId = folder.id,
                                    titleHi = folder.titleHi,
                                    titleEn = folder.titleEn,
                                    descHi = folder.descriptionHi,
                                    descEn = folder.descriptionEn,
                                    codeBadge = folder.subjectCode,
                                    testCount = countInFolder,
                                    isFree = folder.isFreeFolder,
                                    priceInr = folder.priceInr,
                                    validityDays = folder.validityDays,
                                    isUnlocked = isUnlocked,
                                    isExpired = isExpired,
                                    remainingDays = remDays,
                                    strings = strings,
                                    onClick = {
                                        activeFolder = SelectedFolderInfo(
                                            folderType = "subject",
                                            folderId = folder.id,
                                            titleHi = folder.titleHi,
                                            titleEn = folder.titleEn,
                                            descriptionHi = folder.descriptionHi,
                                            descriptionEn = folder.descriptionEn,
                                            isFreeFolder = folder.isFreeFolder,
                                            priceInr = folder.priceInr,
                                            validityDays = folder.validityDays
                                        )
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    val currentCheckout = checkoutTarget
    if (currentCheckout != null) {
        PaymentUnlockDialog(
            target = currentCheckout,
            whatsappSupportNumber = whatsappSupportNumber,
            onDismiss = { checkoutTarget = null },
            onConfirmPayment = { method ->
                onPurchaseItem(
                    currentCheckout.id,
                    currentCheckout.titleHi,
                    currentCheckout.titleEn,
                    currentCheckout.priceInr,
                    method,
                    currentCheckout.validityDays
                ) {
                    checkoutTarget = null
                }
            }
        )
    }
}

@Composable
private fun WhatsAppSupportBannerCard(
    whatsappNumber: String,
    subtitle: String
) {
    val context = LocalContext.current
    val cleanNumber = whatsappNumber.ifBlank { "9238810070" }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("whatsapp_support_banner"),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "भुगतान एवं टेस्ट अनलॉक सहायता WhatsApp: $cleanNumber",
                    fontFamily = NotoDevanagariFamily,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            FilledTonalButton(
                onClick = {
                    val digits = cleanNumber.filter(Char::isDigit).ifBlank { "9238810070" }
                    val waUrl = "https://wa.me/91$digits?text=Hello%20CGpedia%20Support%2C%20I%20need%20help%20unlocking%20a%20Paid%20Test%20Series."
                    runCatching {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(waUrl)))
                    }
                },
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.testTag("whatsapp_support_button")
            ) {
                Icon(
                    imageVector = Icons.Filled.SupportAgent,
                    contentDescription = "WhatsApp Support",
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = cleanNumber,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun FolderCardItem(
    folderId: String,
    titleHi: String,
    titleEn: String,
    descHi: String,
    descEn: String,
    codeBadge: String,
    testCount: Int,
    isFree: Boolean,
    priceInr: Long,
    validityDays: Long,
    isUnlocked: Boolean,
    isExpired: Boolean,
    remainingDays: Long?,
    strings: CgUiStrings,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .testTag("folder_card_$folderId"),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Folder,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = codeBadge,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "$testCount Tests",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }

                // Free vs Paid/Unlocked/Expired Badge
                val badgeBg = when {
                    isFree || isUnlocked -> ExamAnsweredGreen.copy(alpha = 0.16f)
                    isExpired -> MaterialTheme.colorScheme.errorContainer
                    else -> MaterialTheme.colorScheme.secondaryContainer
                }
                val badgeFg = when {
                    isFree || isUnlocked -> ExamAnsweredGreen
                    isExpired -> MaterialTheme.colorScheme.onErrorContainer
                    else -> MaterialTheme.colorScheme.onSecondaryContainer
                }
                val badgeText = when {
                    isFree -> strings.freeBadge
                    isUnlocked && remainingDays != null -> "${strings.unlockedBadge} • ${remainingDays}d Left"
                    isUnlocked -> strings.unlockedBadge
                    isExpired -> "EXPIRED • RENEW ₹$priceInr"
                    else -> "PAID • ₹$priceInr (${validityDays}d)"
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = badgeBg
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (isFree || isUnlocked) Icons.Filled.LockOpen else Icons.Filled.Lock,
                            contentDescription = null,
                            tint = badgeFg,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = badgeText,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = badgeFg
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 1st Language: Hindi (Devanagari)
            Text(
                text = titleHi,
                fontFamily = NotoDevanagariFamily,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            // 2nd Language: English
            Text(
                text = titleEn,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.secondary
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = descHi,
                fontFamily = NotoDevanagariFamily,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = descEn,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (strings.isHindi) "फ़ोल्डर खोलें" else "Open Folder",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
private fun FolderDetailTestListView(
    strings: CgUiStrings,
    folder: SelectedFolderInfo,
    testsInFolder: List<TestSeriesItem>,
    unlockedIds: Set<String>,
    expiredIds: Set<String>,
    activePurchaseByItemId: Map<String, PurchaseRecord>,
    attempts: List<TestAttempt>,
    whatsappSupportNumber: String,
    onBack: () -> Unit,
    onStartTest: (TestSeriesItem) -> Unit,
    onRequestUnlock: (CheckoutTarget) -> Unit
) {
    val nowMillis = System.currentTimeMillis()
    val folderUnlocked = folder.isFreeFolder || folder.folderId in unlockedIds
    val folderExpired = !folderUnlocked && folder.folderId in expiredIds
    val folderRemDays = activePurchaseByItemId[folder.folderId]?.remainingValidityDays(nowMillis)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .widthIn(max = 840.dp)
    ) {
        Surface(
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 2.dp,
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
                        modifier = Modifier.testTag("folder_back_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back to Folders"
                        )
                    }
                    Column {
                        Text(
                            text = folder.titleHi,
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = if (folderRemDays != null) {
                                "${folder.titleEn} • Active (${folderRemDays}d validity left)"
                            } else {
                                folder.titleEn
                            },
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.secondary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                if (!folderUnlocked && folder.priceInr > 0L) {
                    FilledTonalButton(
                        onClick = {
                            onRequestUnlock(
                                CheckoutTarget(
                                    id = folder.folderId,
                                    titleHi = folder.titleHi,
                                    titleEn = folder.titleEn,
                                    priceInr = folder.priceInr,
                                    validityDays = folder.validityDays
                                )
                            )
                        },
                        modifier = Modifier.testTag("unlock_entire_folder_button")
                    ) {
                        Icon(Icons.Filled.Lock, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(if (folderExpired) "Renew ₹${folder.priceInr}" else "Unlock All ₹${folder.priceInr}")
                    }
                }
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                WhatsAppSupportBannerCard(
                    whatsappNumber = whatsappSupportNumber,
                    subtitle = "${folder.titleHi} • ${folder.titleEn} (Validity: ${folder.validityDays} Days from activation)"
                )
            }

            if (testsInFolder.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "इस फ़ोल्डर में जल्द ही नए द्विभाषी टेस्ट प्रकाशित किए जाएंगे।",
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.titleMedium
                            )
                            Text(
                                text = "New bilingual tests will be published inside this folder soon.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(testsInFolder, key = { it.id }) { test ->
                    val isTestUnlocked = !test.isPaid || folderUnlocked || test.id in unlockedIds
                    val isTestExpired = !isTestUnlocked && (folderExpired || test.id in expiredIds)
                    val testRemDays = activePurchaseByItemId[test.id]?.remainingValidityDays(nowMillis) ?: folderRemDays
                    val previousBest = attempts.filter { it.testId == test.id }.maxByOrNull { it.score }

                    TestSeriesCardItem(
                        test = test,
                        isUnlocked = isTestUnlocked,
                        isExpired = isTestExpired,
                        remainingDays = testRemDays,
                        previousAttempt = previousBest,
                        strings = strings,
                        onStartTest = { onStartTest(test) },
                        onUnlockTest = {
                            onRequestUnlock(
                                CheckoutTarget(
                                    id = test.id,
                                    titleHi = test.titleHi,
                                    titleEn = test.titleEn,
                                    priceInr = test.priceInr.coerceAtLeast(49L),
                                    validityDays = test.validityDays
                                )
                            )
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun TestSeriesCardItem(
    test: TestSeriesItem,
    isUnlocked: Boolean,
    isExpired: Boolean,
    remainingDays: Long?,
    previousAttempt: TestAttempt?,
    strings: CgUiStrings,
    onStartTest: () -> Unit,
    onUnlockTest: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("test_card_${test.id}"),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
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
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Timer,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSecondaryContainer,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${test.durationMinutes}m • ${test.questionCount} MCQs • +${test.marksPerQuestion}/-${test.negativeMarking}",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                    }
                }

                val statusText = when {
                    !test.isPaid -> strings.freeBadge
                    isUnlocked && remainingDays != null -> "${strings.unlockedBadge} (${remainingDays}d)"
                    isUnlocked -> strings.unlockedBadge
                    isExpired -> "EXPIRED • ₹${test.priceInr}"
                    else -> "PAID • ₹${test.priceInr}"
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = when {
                        isUnlocked -> ExamAnsweredGreen.copy(alpha = 0.16f)
                        isExpired -> MaterialTheme.colorScheme.errorContainer
                        else -> MaterialTheme.colorScheme.primaryContainer
                    }
                ) {
                    Text(
                        text = statusText,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = when {
                            isUnlocked -> ExamAnsweredGreen
                            isExpired -> MaterialTheme.colorScheme.onErrorContainer
                            else -> MaterialTheme.colorScheme.primary
                        },
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 1st Language: Hindi (Devanagari)
            Text(
                text = test.titleHi,
                fontFamily = NotoDevanagariFamily,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            // 2nd Language: English
            Text(
                text = test.titleEn,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.secondary
            )

            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Topic: ${test.topic}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (previousAttempt != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = ExamAnsweredGreen.copy(alpha = 0.12f)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.CheckCircle,
                            contentDescription = null,
                            tint = ExamAnsweredGreen,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Best Score: ${previousAttempt.score}/${previousAttempt.maxScore} (${previousAttempt.accuracyPercent}% Accuracy)",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = ExamAnsweredGreen
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (isUnlocked) {
                Button(
                    onClick = onStartTest,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("start_test_button_${test.id}")
                ) {
                    Icon(Icons.Filled.PlayArrow, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = strings.startTestBtn,
                        fontWeight = FontWeight.Bold
                    )
                }
            } else {
                OutlinedButton(
                    onClick = onUnlockTest,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("unlock_test_button_${test.id}")
                ) {
                    Icon(Icons.Filled.Lock, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isExpired) {
                            "Renew Subscription (₹${test.priceInr} • ${test.validityDays}d)"
                        } else {
                            "${strings.unlockTestBtn} (₹${test.priceInr} • ${test.validityDays}d)"
                        },
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun PaymentUnlockDialog(
    target: CheckoutTarget,
    whatsappSupportNumber: String,
    onDismiss: () -> Unit,
    onConfirmPayment: (String) -> Unit
) {
    val context = LocalContext.current
    val cleanNumber = whatsappSupportNumber.ifBlank { "9238810070" }
    var selectedMethod by remember { mutableStateOf("UPI (PhonePe / GPay / Paytm)") }
    val methods = listOf(
        "UPI (PhonePe / GPay / Paytm)",
        "RuPay / Debit Card",
        "NetBanking (SBI / PNB / HDFC)"
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(
                    text = "प्रीमियम टेस्ट सीरीज अनलॉक करें",
                    fontFamily = NotoDevanagariFamily,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Unlock Paid Test Series (${target.validityDays} Days Validity)",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = target.titleHi,
                    fontFamily = NotoDevanagariFamily,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = target.titleEn,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Amount Payable:", fontWeight = FontWeight.Medium)
                            Text(
                                text = "₹${target.priceInr}",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Validity Countdown: ${target.validityDays} Days starting strictly from activation date & time.",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }

                // WhatsApp Support 9238810070 Notice inside Payment Modal
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "भुगतान सहायता (WhatsApp: $cleanNumber): भुगतान के बाद स्क्रीनशॉट एवं अपनी ईमेल/यूजर आईडी व्हाट्सएप पर भेजकर तुरंत अनलॉक करा सकते हैं।",
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        TextButton(
                            onClick = {
                                val digits = cleanNumber.filter(Char::isDigit).ifBlank { "9238810070" }
                                val url = "https://wa.me/91$digits?text=Hello%20CGpedia%2C%20I%20want%20to%20unlock%20${Uri.encode(target.titleEn)}%20(Rs.${target.priceInr})."
                                runCatching {
                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                }
                            },
                            modifier = Modifier.testTag("checkout_whatsapp_help_button")
                        ) {
                            Icon(Icons.Filled.SupportAgent, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Contact WhatsApp Support ($cleanNumber)", fontWeight = FontWeight.Bold)
                        }
                    }
                }

                HorizontalDivider()

                methods.forEach { method ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedMethod = method }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedMethod == method,
                            onClick = { selectedMethod = method }
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = method, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirmPayment(selectedMethod) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = Color.White
                ),
                modifier = Modifier.testTag("confirm_payment_button")
            ) {
                Text("Pay ₹${target.priceInr} & Unlock")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
