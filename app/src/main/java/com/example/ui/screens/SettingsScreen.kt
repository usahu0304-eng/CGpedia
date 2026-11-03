package com.example.ui.screens

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Payment
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.SystemUpdateAlt
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.data.model.AppConfig
import com.example.data.model.BookmarkedQuestion
import com.example.data.model.PurchaseRecord
import com.example.data.model.UserProfile
import com.example.ui.components.CgpediaInAppUpdateDialog
import com.example.ui.components.getInstalledAppVersionInfo
import com.example.ui.i18n.CgUiStrings
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.NotoDevanagariFamily

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    strings: CgUiStrings,
    userProfile: UserProfile?,
    purchases: List<PurchaseRecord>,
    bookmarks: List<BookmarkedQuestion>,
    appConfig: AppConfig,
    onUpdateProfile: (
        displayName: String,
        phoneNumber: String,
        photoUrl: String,
        targetExam: String,
        preferredLanguage: String,
        darkMode: Boolean,
        notifyCa: Boolean,
        notifyTests: Boolean
    ) -> Unit,
    onNavigateToBookmarks: () -> Unit,
    onSignOut: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val installedVersion = remember(context) { context.getInstalledAppVersionInfo() }
    var showEditProfileDialog by remember { mutableStateOf(false) }
    var showPurchasesDialog by remember { mutableStateOf(false) }
    var showSupportPrivacyDialog by remember { mutableStateOf(false) }
    var showAppUpdateDialog by remember { mutableStateOf(false) }

    val curName = userProfile?.displayName?.ifBlank { "CGpedia Aspirant" } ?: "CGpedia Aspirant"
    val curPhone = userProfile?.phoneNumber.orEmpty()
    val curPhoto = userProfile?.photoUrl.orEmpty()
    val curTarget = userProfile?.targetExam?.ifBlank { "CGPSC & CGSSB" } ?: "CGPSC & CGSSB"
    val curLang = userProfile?.preferredLanguage ?: "en"
    val curDark = userProfile?.darkMode ?: false
    val curNotifyCa = userProfile?.notifyCurrentAffairs ?: true
    val curNotifyTests = userProfile?.notifyNewTests ?: true
    val whatsappSupport = appConfig.whatsappSupportNumber.ifBlank { "9238810070" }

    val notifPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ -> }

    // Zero-permission Android Photo Picker for Student Avatar
    val photoPickerLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            onUpdateProfile(
                curName,
                curPhone,
                uri.toString(),
                curTarget,
                curLang,
                curDark,
                curNotifyCa,
                curNotifyTests
            )
        }
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Student Profile Summary Card (with Registered Email & User ID for Payment Unlock)
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("settings_profile_card"),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primaryContainer)
                                .clickable {
                                    photoPickerLauncher.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            if (curPhoto.isNotBlank()) {
                                AsyncImage(
                                    model = curPhoto,
                                    contentDescription = "Student Profile Photo",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.Filled.Person,
                                    contentDescription = "Pick Avatar Photo",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(14.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = curName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            if (!userProfile?.email.isNullOrBlank()) {
                                Text(
                                    text = "Email: ${userProfile?.email}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            val resolvedUserId = userProfile?.userId?.ifBlank { userProfile.id }.orEmpty()
                            if (resolvedUserId.isNotBlank()) {
                                Text(
                                    text = "User ID: $resolvedUserId",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.secondary
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.secondaryContainer
                            ) {
                                Text(
                                    text = "CGPSC & CGSSB • $curTarget",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        OutlinedButton(
                            onClick = { showEditProfileDialog = true },
                            modifier = Modifier.testTag("settings_edit_profile_button")
                        ) {
                            Icon(Icons.Filled.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(if (strings.isHindi) "संपादित" else "Edit")
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Filled.SupportAgent,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (strings.isHindi) {
                                    "पेड टेस्ट सीरीज (₹99) अनलॉक या भुगतान सहायता हेतु WhatsApp करें: $whatsappSupport (अपना Email या User ID भेजें)"
                                } else {
                                    "For Paid Test Series (₹99) unlock & payment assistance, WhatsApp: $whatsappSupport with your Email or User ID."
                                },
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                    }
                }
            }
        }

        // 2. App Language Toggle (Default English, Switchable to Hindi; Tests stay Bilingual)
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Translate, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(strings.langToggleLabel, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                            Text(
                                text = "Note: Mock test questions always remain Bilingual (1st हिंदी, 2nd English).",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                        SegmentedButton(
                            selected = curLang != "hi",
                            onClick = {
                                onUpdateProfile(curName, curPhone, curPhoto, curTarget, "en", curDark, curNotifyCa, curNotifyTests)
                            },
                            shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                            modifier = Modifier.testTag("lang_option_english")
                        ) {
                            Text("English (Default)")
                        }
                        SegmentedButton(
                            selected = curLang == "hi",
                            onClick = {
                                onUpdateProfile(curName, curPhone, curPhoto, curTarget, "hi", curDark, curNotifyCa, curNotifyTests)
                            },
                            shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                            modifier = Modifier.testTag("lang_option_hindi")
                        ) {
                            Text("हिंदी (Hindi)", fontFamily = NotoDevanagariFamily)
                        }
                    }
                }
            }
        }

        // 3. Appearance & Notification Preferences
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Icon(Icons.Filled.DarkMode, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(strings.darkModeLabel, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                                Text("Chhattisgarh Navy Dark Palette", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Switch(
                            checked = curDark,
                            onCheckedChange = { enabled ->
                                onUpdateProfile(curName, curPhone, curPhoto, curTarget, curLang, enabled, curNotifyCa, curNotifyTests)
                            },
                            modifier = Modifier.testTag("settings_dark_mode_switch")
                        )
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Icon(Icons.Filled.Notifications, contentDescription = null, tint = MaterialTheme.colorScheme.tertiary)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("Daily Current Affairs Alerts", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                                Text("Verified PIB & DPR Chhattisgarh updates", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Switch(
                            checked = curNotifyCa,
                            onCheckedChange = { enabled ->
                                if (enabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                    notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                                }
                                onUpdateProfile(curName, curPhone, curPhoto, curTarget, curLang, curDark, enabled, curNotifyTests)
                            }
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "New CGPSC & CGSSB Test Publish Alerts",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.weight(1f)
                        )
                        Switch(
                            checked = curNotifyTests,
                            onCheckedChange = { enabled ->
                                if (enabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                    notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                                }
                                onUpdateProfile(curName, curPhone, curPhoto, curTarget, curLang, curDark, curNotifyCa, enabled)
                            }
                        )
                    }
                }
            }
        }

        // 4. Purchases, Bookmarks/Offline Cache, and Help/Telegram/Privacy
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    SettingsNavRow(
                        icon = Icons.Filled.Payment,
                        title = strings.purchasesHistoryLabel,
                        subtitle = "${purchases.size} Unlocked Premium Tests & Receipts",
                        tag = "settings_purchases_row",
                        onClick = { showPurchasesDialog = true }
                    )
                    HorizontalDivider()
                    SettingsNavRow(
                        icon = Icons.Filled.Bookmark,
                        title = strings.savedOfflineLabel,
                        subtitle = "${bookmarks.size} Bilingual Questions Cached Offline",
                        tag = "settings_bookmarks_row",
                        onClick = onNavigateToBookmarks
                    )
                    HorizontalDivider()
                    SettingsNavRow(
                        icon = Icons.Filled.SupportAgent,
                        title = strings.supportTelegramPrivacyLabel,
                        subtitle = "WhatsApp Support ($whatsappSupport), Official Channel & Help Policy",
                        tag = "settings_support_privacy_row",
                        onClick = { showSupportPrivacyDialog = true }
                    )
                    HorizontalDivider()
                    val hasUpdate = appConfig.latestVersionCode > installedVersion.versionCode
                    SettingsNavRow(
                        icon = Icons.Filled.SystemUpdateAlt,
                        title = if (strings.isHindi) "ऐप अपडेट एवं वर्जन जांचें" else "App Version & Check for Updates",
                        subtitle = if (hasUpdate) {
                            "New APK Update Available: v${appConfig.latestVersionName} (Installed: v${installedVersion.versionName})"
                        } else {
                            "Installed: v${installedVersion.versionName} (#${installedVersion.versionCode}) • Up to Date"
                        },
                        tag = "settings_check_update_row",
                        onClick = { showAppUpdateDialog = true }
                    )
                }
            }
        }

        // 5. Sign Out
        item {
            OutlinedButton(
                onClick = onSignOut,
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.error
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("settings_sign_out_button")
            ) {
                Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(strings.signOutLabel, fontWeight = FontWeight.SemiBold)
            }
        }
    }

    if (showEditProfileDialog) {
        var editName by remember { mutableStateOf(curName) }
        var editPhone by remember { mutableStateOf(curPhone) }
        var editTarget by remember { mutableStateOf(curTarget) }
        val targets = listOf(
            "CGPSC & CGSSB",
            "CGPSC Prelims",
            "CGPSC Mains",
            "CGSSB / Vyapam",
            "CGPSC + CGSSB Combined"
        )

        AlertDialog(
            onDismissRequest = { showEditProfileDialog = false },
            title = { Text(strings.editProfileLabel) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = editName,
                        onValueChange = { editName = it },
                        label = { Text("Full Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editPhone,
                        onValueChange = { editPhone = it },
                        label = { Text("Mobile Number") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text("Target Competitive Exam:", style = MaterialTheme.typography.labelLarge)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        targets.forEach { t ->
                            FilterChip(
                                selected = editTarget == t,
                                onClick = { editTarget = t },
                                label = { Text(t, style = MaterialTheme.typography.labelSmall) }
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showEditProfileDialog = false
                        onUpdateProfile(editName, editPhone, curPhoto, editTarget, curLang, curDark, curNotifyCa, curNotifyTests)
                    }
                ) {
                    Text("Save Profile")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showEditProfileDialog = false }) { Text("Cancel") }
            }
        )
    }

    if (showPurchasesDialog) {
        AlertDialog(
            onDismissRequest = { showPurchasesDialog = false },
            title = { Text(strings.purchasesHistoryLabel) },
            text = {
                if (purchases.isEmpty()) {
                    Text("No paid test purchases yet. For 'CGPSC Pre 2026 Test Series' (₹99) assistance or manual unlock, contact WhatsApp Support: $whatsappSupport.")
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        purchases.forEach { p ->
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(p.testTitleEn.ifBlank { p.testTitleHi }, fontWeight = FontWeight.Bold)
                                    Text(
                                        "Paid ₹${p.amountInr} via ${p.paymentMethod} • Ref: ${p.transactionRef}",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(onClick = { showPurchasesDialog = false }) { Text("Close") }
            }
        )
    }

    if (showSupportPrivacyDialog) {
        AlertDialog(
            onDismissRequest = { showSupportPrivacyDialog = false },
            icon = { Icon(Icons.Filled.PrivacyTip, contentDescription = null) },
            title = { Text("Help, Support Policy & WhatsApp Assistance") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    if (appConfig.supportPolicyHi.isNotBlank()) {
                        Text(
                            text = appConfig.supportPolicyHi,
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    if (appConfig.supportPolicyEn.isNotBlank()) {
                        Text(
                            text = appConfig.supportPolicyEn,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    HorizontalDivider()
                    Text(
                        text = "Payment Support Note: For 'CGPSC Pre 2026 Test Series (₹99)' payment queries or manual access unlock, message WhatsApp Support $whatsappSupport with your registered Email ID or User ID.",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Button(
                        onClick = {
                            runCatching {
                                context.startActivity(
                                    Intent(
                                        Intent.ACTION_VIEW,
                                        Uri.parse("https://wa.me/91${whatsappSupport.filter(Char::isDigit)}")
                                    )
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ExamAnsweredGreen,
                            contentColor = Color.White
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Filled.SupportAgent, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("WhatsApp Support: $whatsappSupport")
                    }
                    Button(
                        onClick = {
                            runCatching {
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(appConfig.telegramChannelUrl)))
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Join Official CGpedia Channel")
                    }
                    OutlinedButton(
                        onClick = {
                            runCatching {
                                context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:${appConfig.supportEmail}")))
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Email Support (${appConfig.supportEmail})")
                    }
                }
            },
            confirmButton = {
                Button(onClick = { showSupportPrivacyDialog = false }) { Text("Done") }
            }
        )
    }

    if (showAppUpdateDialog) {
        CgpediaInAppUpdateDialog(
            installedVersion = installedVersion,
            appConfig = appConfig,
            onRemindLater = { showAppUpdateDialog = false }
        )
    }
}

@Composable
private fun SettingsNavRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    tag: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp)
            .testTag(tag),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Icon(
            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
