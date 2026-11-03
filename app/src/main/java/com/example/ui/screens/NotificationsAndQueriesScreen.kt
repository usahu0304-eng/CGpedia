package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AudioFile
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.VideoFile
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.data.model.BroadcastNotification
import com.example.data.model.StudentQuery
import com.example.data.model.UpcomingTestItem
import com.example.ui.theme.ExamAnsweredGreen
import com.example.ui.theme.NotoDevanagariFamily

@Composable
fun NotificationsAndQueriesScreen(
    notifications: List<BroadcastNotification>,
    upcomingTests: List<UpcomingTestItem>,
    myQueries: List<StudentQuery>,
    whatsappSupportNumber: String,
    onSubmitQuery: (category: String, subject: String, message: String) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedSection by rememberSaveable { mutableIntStateOf(0) }
    val sectionTitles = listOf(
        "सूचनाएं (${notifications.size})",
        "आगामी टेस्ट (${upcomingTests.size})",
        "सहायता (${myQueries.size})"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TabRow(
            selectedTabIndex = selectedSection,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary,
            modifier = Modifier.fillMaxWidth()
        ) {
            sectionTitles.forEachIndexed { idx, title ->
                Tab(
                    selected = selectedSection == idx,
                    onClick = { selectedSection = idx },
                    text = {
                        Text(
                            text = title,
                            fontFamily = NotoDevanagariFamily,
                            fontWeight = if (selectedSection == idx) FontWeight.Bold else FontWeight.Medium
                        )
                    },
                    modifier = Modifier.testTag("hub_subtab_$idx")
                )
            }
        }

        when (selectedSection) {
            0 -> BroadcastNotificationFeedSection(notifications = notifications)
            1 -> UpcomingTestSeriesSection(
                upcomingTests = upcomingTests,
                whatsappSupportNumber = whatsappSupportNumber
            )
            2 -> PrivateStudentQuerySection(
                myQueries = myQueries,
                whatsappSupportNumber = whatsappSupportNumber,
                onSubmitQuery = onSubmitQuery
            )
        }
    }
}

@Composable
private fun BroadcastNotificationFeedSection(
    notifications: List<BroadcastNotification>
) {
    val context = LocalContext.current
    val sorted = notifications.sortedWith(
        compareByDescending<BroadcastNotification> { it.isPinned }
            .thenByDescending { it.createdAt?.seconds ?: 0L }
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .widthIn(max = 840.dp),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.7f)
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.NotificationsActive,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "आधिकारिक सूचना केंद्र • Official Broadcast Notification Hub",
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = "Pinned announcements stay at the top • Supports PDF/Docs, Images, Audio & Video attachments",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        items(sorted, key = { it.id }) { notif ->
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (notif.isPinned) {
                        MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.45f)
                    } else {
                        MaterialTheme.colorScheme.surface
                    }
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = if (notif.isPinned) 4.dp else 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("broadcast_card_${notif.id}")
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (notif.isPinned) {
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = MaterialTheme.colorScheme.primary
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.PushPin,
                                    contentDescription = "Pinned Notification",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "PINNED • पिन किया गया महत्वपूर्ण संदेश",
                                    fontFamily = NotoDevanagariFamily,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }

                    // 1st Language: Hindi (Devanagari)
                    Text(
                        text = notif.titleHi,
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = notif.messageHi,
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                    // 2nd Language: English
                    Text(
                        text = notif.titleEn,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.secondary
                    )
                    Text(
                        text = notif.messageEn,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    // Rich Media Attachment Section (PDF/Docs, Image, Audio, Video)
                    if (notif.mediaType != "none" && notif.mediaUrl.isNotBlank()) {
                        if (notif.mediaType == "image" && notif.mediaUrl.startsWith("http")) {
                            AsyncImage(
                                model = notif.mediaUrl,
                                contentDescription = notif.mediaTitle.ifBlank { notif.titleEn },
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(180.dp)
                                    .clip(RoundedCornerShape(12.dp))
                            )
                        }

                        val mediaIcon = when (notif.mediaType) {
                            "pdf" -> Icons.Filled.PictureAsPdf
                            "image" -> Icons.Filled.Image
                            "audio" -> Icons.Filled.AudioFile
                            "video" -> Icons.Filled.VideoFile
                            else -> Icons.AutoMirrored.Filled.OpenInNew
                        }
                        val mediaBadge = when (notif.mediaType) {
                            "pdf" -> "PDF / Document Attachment"
                            "image" -> "Image Attachment"
                            "audio" -> "Audio Clip"
                            "video" -> "Video Lecture / Notice"
                            else -> "Attachment"
                        }

                        OutlinedButton(
                            onClick = {
                                runCatching {
                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(notif.mediaUrl)))
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("broadcast_media_btn_${notif.id}")
                        ) {
                            Icon(imageVector = mediaIcon, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = notif.mediaTitle.ifBlank { "Open $mediaBadge" },
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun UpcomingTestSeriesSection(
    upcomingTests: List<UpcomingTestItem>,
    whatsappSupportNumber: String
) {
    val context = LocalContext.current
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .widthIn(max = 840.dp),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.CalendarMonth,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "आगामी टेस्ट सीरीज समय-सारणी • Upcoming Test Series Schedule",
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Text(
                            text = "Advance schedule of upcoming CGPSC & CGSSB mock tests and packages",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        items(upcomingTests, key = { it.id }) { item ->
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("upcoming_test_card_${item.id}")
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
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Text(
                                text = "${item.examCategory} • ${item.scheduledDateLabel}",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (item.isPaid) MaterialTheme.colorScheme.secondaryContainer else ExamAnsweredGreen.copy(alpha = 0.16f)
                        ) {
                            Text(
                                text = if (item.isPaid) "₹${item.priceInr} • ${item.validityDays}d Validity" else "FREE MOCK",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = if (item.isPaid) MaterialTheme.colorScheme.onSecondaryContainer else ExamAnsweredGreen,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Text(
                        text = item.titleHi,
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "पाठ्यक्रम: ${item.syllabusSummaryHi}",
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                    Text(
                        text = item.titleEn,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.secondary
                    )
                    Text(
                        text = "Syllabus: ${item.syllabusSummaryEn}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    if (item.isPaid) {
                        OutlinedButton(
                            onClick = {
                                val digits = whatsappSupportNumber.filter(Char::isDigit).ifBlank { "9238810070" }
                                runCatching {
                                    context.startActivity(
                                        Intent(
                                            Intent.ACTION_VIEW,
                                            Uri.parse("https://wa.me/91$digits?text=Hello%20CGpedia%2C%20I%20want%20to%20pre-book%20${Uri.encode(item.titleEn)}")
                                        )
                                    )
                                }
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(
                                text = "Pre-Book / Enquire on WhatsApp ($whatsappSupportNumber)",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PrivateStudentQuerySection(
    myQueries: List<StudentQuery>,
    whatsappSupportNumber: String,
    onSubmitQuery: (category: String, subject: String, message: String) -> Unit
) {
    var category by rememberSaveable { mutableStateOf("doubt") }
    var subject by rememberSaveable { mutableStateOf("") }
    var message by rememberSaveable { mutableStateOf("") }

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
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Lock,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "निजी छात्र सहायता एवं डाउट पोर्टल • Private Student Query",
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "100% गोपनीय: आपका प्रश्न केवल आपको और एडमिन को दिखाई देगा (Never visible to other users)",
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(
                            "doubt" to "Exam Doubt / डाउट",
                            "payment" to "Payment / भुगतान",
                            "technical" to "Technical / तकनीकी"
                        ).forEach { (key, label) ->
                            AssistChip(
                                onClick = { category = key },
                                label = {
                                    Text(
                                        text = label,
                                        fontFamily = NotoDevanagariFamily,
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = if (category == key) {
                                        MaterialTheme.colorScheme.primaryContainer
                                    } else {
                                        MaterialTheme.colorScheme.surface
                                    }
                                ),
                                modifier = Modifier.testTag("query_cat_$key")
                            )
                        }
                    }

                    OutlinedTextField(
                        value = subject,
                        onValueChange = { subject = it },
                        label = { Text("विषय / Subject (e.g., CGPSC Pre 2026 Payment or Question Doubt)") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("student_query_subject_input")
                    )

                    OutlinedTextField(
                        value = message,
                        onValueChange = { message = it },
                        label = { Text("अपना प्रश्न या समस्या विस्तार से लिखें / Describe your query privately to Admin") },
                        minLines = 3,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("student_query_message_input")
                    )

                    Button(
                        onClick = {
                            onSubmitQuery(category, subject, message)
                            subject = ""
                            message = ""
                        },
                        enabled = subject.isNotBlank() && message.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("student_query_submit_button")
                    ) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "एडमिन को निजी प्रश्न भेजें / Submit Private Query",
                            fontFamily = NotoDevanagariFamily,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        item {
            Text(
                text = "मेरे पूछे गए निजी प्रश्न (${myQueries.size}) • My Private Queries",
                fontFamily = NotoDevanagariFamily,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        if (myQueries.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "आपने अभी तक कोई निजी प्रश्न नहीं भेजा है। (WhatsApp Support: $whatsappSupportNumber)",
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        } else {
            items(myQueries, key = { it.id }) { q ->
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("my_query_card_${q.id}")
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
                                color = MaterialTheme.colorScheme.secondaryContainer
                            ) {
                                Text(
                                    text = "PRIVATE • ${q.category.uppercase()}",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (q.status == "resolved") {
                                    ExamAnsweredGreen.copy(alpha = 0.16f)
                                } else {
                                    MaterialTheme.colorScheme.primaryContainer
                                }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (q.status == "resolved") {
                                        Icon(
                                            imageVector = Icons.Filled.CheckCircle,
                                            contentDescription = null,
                                            tint = ExamAnsweredGreen,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                    }
                                    Text(
                                        text = if (q.status == "resolved") "RESOLVED • समाधान पूर्ण" else "OPEN • समीक्षाधीन",
                                        fontFamily = NotoDevanagariFamily,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = if (q.status == "resolved") ExamAnsweredGreen else MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }

                        Text(
                            text = q.subject,
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = q.message,
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        if (q.adminReply.isNotBlank()) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Filled.SupportAgent,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Admin Reply • एडमिन का उत्तर:",
                                            fontFamily = NotoDevanagariFamily,
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                    Text(
                                        text = q.adminReply,
                                        fontFamily = NotoDevanagariFamily,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface
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
