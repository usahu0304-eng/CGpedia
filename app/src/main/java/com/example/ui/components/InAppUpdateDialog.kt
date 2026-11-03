package com.example.ui.components

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.SystemUpdateAlt
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.AppConfig
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.NotoDevanagariFamily

data class InstalledAppVersionInfo(
    val versionCode: Long,
    val versionName: String
)

fun Context.getInstalledAppVersionInfo(): InstalledAppVersionInfo {
    return runCatching {
        val pkgInfo = packageManager.getPackageInfo(packageName, 0)
        val code = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            pkgInfo.longVersionCode
        } else {
            @Suppress("DEPRECATION")
            pkgInfo.versionCode.toLong()
        }
        val name = pkgInfo.versionName?.ifBlank { "2.0.0" } ?: "2.0.0"
        InstalledAppVersionInfo(versionCode = code, versionName = name)
    }.getOrDefault(InstalledAppVersionInfo(versionCode = 2L, versionName = "2.0.0"))
}

@Composable
fun CgpediaInAppUpdateDialog(
    installedVersion: InstalledAppVersionInfo,
    appConfig: AppConfig,
    onRemindLater: () -> Unit
) {
    val context = LocalContext.current
    val isUpdateAvailable = appConfig.latestVersionCode > installedVersion.versionCode
    val downloadUrl = appConfig.apkDownloadUrl.ifBlank {
        appConfig.telegramChannelUrl.ifBlank { "https://t.me/CGpediaOfficial" }
    }
    val notesHi = appConfig.updateNotesHi.ifBlank {
        "नया अपडेट उपलब्ध: सीजीपीएससी प्री 2026 टेस्ट सीरीज (₹99), इंस्टाग्राम स्टोरीज समसामयिकी बार, सुरक्षित सबमिट बटन और स्क्रीनशॉट सुरक्षा।"
    }
    val notesEn = appConfig.updateNotesEn.ifBlank {
        "New Update Available: CGPSC Pre 2026 Test Series (₹99), Instagram Stories Current Affairs Bar, Safe Submit Button & Screenshot Protection."
    }

    AlertDialog(
        onDismissRequest = onRemindLater,
        shape = RoundedCornerShape(24.dp),
        icon = {
            Icon(
                imageVector = if (isUpdateAvailable) Icons.Filled.SystemUpdateAlt else Icons.Filled.CheckCircle,
                contentDescription = "App Update Status",
                tint = if (isUpdateAvailable) MaterialTheme.colorScheme.primary else ExamAnsweredGreen,
                modifier = Modifier.size(32.dp)
            )
        },
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = if (isUpdateAvailable) {
                        "नया ऐप अपडेट उपलब्ध है!"
                    } else {
                        "आपका ऐप पूरी तरह अपडेटेड है"
                    },
                    fontFamily = NotoDevanagariFamily,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = if (isUpdateAvailable) {
                        "New CGpedia APK Update Available"
                    } else {
                        "Your CGpedia App is Up to Date"
                    },
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Installed: v${installedVersion.versionName} (#${installedVersion.versionCode})",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Text(
                            text = "Latest: v${appConfig.latestVersionName.ifBlank { "2.0.0" }} (#${appConfig.latestVersionCode})",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                // 1st Language: Hindi (Devanagari)
                Text(
                    text = notesHi,
                    fontFamily = NotoDevanagariFamily,
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                HorizontalDivider()

                // 2nd Language: English
                Text(
                    text = notesEn,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Text(
                    text = "नोट: नया APK सीधे पुराने ऐप के ऊपर इंस्टॉल (Update) हो जाएगा, आपका लॉगिन और डेटा सुरक्षित रहेगा। / Note: Installing the latest APK updates your existing app without losing any data.",
                    fontFamily = NotoDevanagariFamily,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    runCatching {
                        val targetUri = if (downloadUrl.startsWith("http")) {
                            Uri.parse(downloadUrl)
                        } else {
                            Uri.parse("https://wa.me/91${appConfig.whatsappSupportNumber.ifBlank { "9238810070" }.filter(Char::isDigit)}")
                        }
                        context.startActivity(Intent(Intent.ACTION_VIEW, targetUri))
                    }
                    onRemindLater()
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = Color.White
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("in_app_update_download_button")
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "अभी अपडेट डाउनलोड करें / Download Latest APK",
                    fontFamily = NotoDevanagariFamily,
                    fontWeight = FontWeight.Bold
                )
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = onRemindLater,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("in_app_update_remind_later_button")
            ) {
                Text(
                    text = if (isUpdateAvailable) {
                        "बाद में याद दिलाएं / Remind Me Later"
                    } else {
                        "बंद करें / Close"
                    },
                    fontFamily = NotoDevanagariFamily,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    )
}
