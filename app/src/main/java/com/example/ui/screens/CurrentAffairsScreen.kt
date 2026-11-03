package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.CurrentAffairItem
import com.example.data.model.UiState
import com.example.data.seed.CgpediaStarterCatalog
import com.example.ui.i18n.CgUiStrings
import com.example.ui.theme.CgCobaltSecondaryLight
import com.example.ui.theme.CgNavyPrimaryLight
import com.example.ui.theme.CgTealTertiaryLight
import com.example.ui.theme.ExamPaidIndigo
import com.example.ui.theme.ExamReviewViolet
import com.example.ui.theme.NotoDevanagariFamily
import kotlinx.coroutines.delay

/**
 * Reusable Instagram-Stories-style Current Affairs Bar rendered at the top of the screen
 * in strict Bilingual (1st Hindi Devanagari, 2nd English) format.
 * Students never see any AI branding or manual sync controls; stories update automatically in the background.
 */
@Composable
fun CurrentAffairsStoriesBar(
    items: List<CurrentAffairItem>,
    modifier: Modifier = Modifier
) {
    val storyItems = remember(items) {
        items.ifEmpty { CgpediaStarterCatalog.defaultCurrentAffairs() }
    }
    var activeStoryIndex by rememberSaveable { mutableIntStateOf(-1) }
    val viewedIds = remember { mutableStateListOf<String>() }

    Surface(
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp,
        modifier = modifier
            .fillMaxWidth()
            .testTag("ca_instagram_stories_bar")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp, bottom = 12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.AutoStories,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "समसामयिकी स्टोरीज़ • Daily Current Affairs Stories",
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                Text(
                    text = "हिंदी + EN",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.tertiary
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            LazyRow(
                contentPadding = PaddingValues(horizontal = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("ca_stories_lazy_row")
            ) {
                itemsIndexed(storyItems, key = { idx, item -> item.id.ifBlank { "story_$idx" } }) { index, item ->
                    val isViewed = viewedIds.contains(item.id)
                    InstagramStoryBubble(
                        item = item,
                        index = index,
                        isViewed = isViewed,
                        onClick = {
                            if (item.id.isNotBlank() && !viewedIds.contains(item.id)) {
                                viewedIds.add(item.id)
                            }
                            activeStoryIndex = index
                        }
                    )
                }
            }
        }
    }

    if (activeStoryIndex in storyItems.indices) {
        BilingualInstagramStoryDialog(
            stories = storyItems,
            currentIndex = activeStoryIndex,
            onNavigateIndex = { nextIdx ->
                if (nextIdx in storyItems.indices) {
                    val nextId = storyItems[nextIdx].id
                    if (nextId.isNotBlank() && !viewedIds.contains(nextId)) {
                        viewedIds.add(nextId)
                    }
                    activeStoryIndex = nextIdx
                } else {
                    activeStoryIndex = -1
                }
            },
            onDismiss = { activeStoryIndex = -1 }
        )
    }
}

@Composable
private fun InstagramStoryBubble(
    item: CurrentAffairItem,
    index: Int,
    isViewed: Boolean,
    onClick: () -> Unit
) {
    // Zero-Orange multi-stop gradient ring for unviewed stories
    val ringBrush = if (isViewed) {
        Brush.linearGradient(
            colors = listOf(
                MaterialTheme.colorScheme.outline.copy(alpha = 0.45f),
                MaterialTheme.colorScheme.outlineVariant
            )
        )
    } else {
        Brush.sweepGradient(
            colors = listOf(
                CgCobaltSecondaryLight,
                ExamPaidIndigo,
                ExamReviewViolet,
                CgTealTertiaryLight,
                CgCobaltSecondaryLight
            )
        )
    }

    val categoryBadge = when (item.category.lowercase()) {
        "chhattisgarh" -> "CG • छ.ग."
        "national" -> "IND • राष्ट्रीय"
        else -> "INTL • विश्व"
    }

    val centerGradient = when (item.category.lowercase()) {
        "chhattisgarh" -> listOf(CgNavyPrimaryLight, CgCobaltSecondaryLight)
        "national" -> listOf(ExamPaidIndigo, CgTealTertiaryLight)
        else -> listOf(ExamReviewViolet, CgCobaltSecondaryLight)
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .width(86.dp)
            .clickable(onClick = onClick)
            .testTag("ca_story_circle_$index")
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .border(width = 3.dp, brush = ringBrush, shape = CircleShape)
                .padding(5.dp)
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .background(Brush.linearGradient(centerGradient))
                    .padding(6.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = categoryBadge.substringBefore(" •"),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                    Text(
                        text = categoryBadge.substringAfter("• "),
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.92f),
                        maxLines = 1
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(5.dp))

        // 1st Hindi (Devanagari), 2nd English compact story label
        Text(
            text = item.headlineHi,
            fontFamily = NotoDevanagariFamily,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = if (isViewed) FontWeight.Normal else FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center
        )
        Text(
            text = item.headlineEn,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.secondary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun BilingualInstagramStoryDialog(
    stories: List<CurrentAffairItem>,
    currentIndex: Int,
    onNavigateIndex: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val story = stories.getOrNull(currentIndex) ?: return
    var elapsedTicks by remember(currentIndex) { mutableIntStateOf(0) }
    val totalTicks = 80 // 8 seconds per story (100ms ticks)

    LaunchedEffect(currentIndex) {
        elapsedTicks = 0
        while (elapsedTicks < totalTicks) {
            delay(100L)
            elapsedTicks++
        }
        if (currentIndex + 1 < stories.size) {
            onNavigateIndex(currentIndex + 1)
        } else {
            onDismiss()
        }
    }

    val currentSegmentProgress by animateFloatAsState(
        targetValue = (elapsedTicks.toFloat() / totalTicks.toFloat()).coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 100, easing = LinearEasing),
        label = "storySegmentProgress"
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            dismissOnBackPress = true,
            dismissOnClickOutside = false
        )
    ) {
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .testTag("ca_story_fullscreen_viewer"),
            color = CgNavyPrimaryLight
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                CgNavyPrimaryLight,
                                CgCobaltSecondaryLight.copy(alpha = 0.85f),
                                CgNavyPrimaryLight
                            )
                        )
                    )
                    .windowInsetsPadding(WindowInsets.safeDrawing)
                    .padding(16.dp)
            ) {
                // 1. Instagram-style Segmented Story Progress Bars at the top
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    stories.forEachIndexed { idx, _ ->
                        val segProgress = when {
                            idx < currentIndex -> 1f
                            idx == currentIndex -> currentSegmentProgress
                            else -> 0f
                        }
                        LinearProgressIndicator(
                            progress = { segProgress },
                            color = Color.White,
                            trackColor = Color.White.copy(alpha = 0.28f),
                            modifier = Modifier
                                .weight(1f)
                                .height(4.dp)
                                .clip(RoundedCornerShape(50))
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // 2. Story Header Bar (Category Avatar + Source + Close Button)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = CgTealTertiaryLight,
                            modifier = Modifier.size(38.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Filled.Public,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "CGpedia • CGPSC & CGSSB Stories (${currentIndex + 1}/${stories.size})",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "${story.sourceName} • ${story.dateLabel}",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.82f)
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .size(48.dp)
                            .testTag("story_viewer_close_button")
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Close,
                            contentDescription = "Close Story",
                            tint = Color.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // 3. Main Bilingual Story Content Card (1st Hindi Devanagari, 2nd English)
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(20.dp)
                    ) {
                        // Category Pill
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Text(
                                text = when (story.category.lowercase()) {
                                    "chhattisgarh" -> "छत्तीसगढ़ समसामयिकी • Chhattisgarh Current Affairs"
                                    "national" -> "राष्ट्रीय समसामयिकी • National Current Affairs"
                                    else -> "अंतरराष्ट्रीय समसामयिकी • International Current Affairs"
                                },
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // --- 1ST LANGUAGE: HINDI (DEVANAGARI) ---
                        Text(
                            text = "1. हिंदी (द्विभाषी सार एवं परीक्षा तथ्य)",
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = story.headlineHi,
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.testTag("story_headline_hi")
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = story.summaryHi,
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        if (story.examKeyPointsHi.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = "परीक्षा उपयोगी मुख्य बिंदु (Hindi):",
                                        fontFamily = NotoDevanagariFamily,
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    story.examKeyPointsHi.forEach { ptHi ->
                                        Text(
                                            text = "• $ptHi",
                                            fontFamily = NotoDevanagariFamily,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurface,
                                            modifier = Modifier.padding(bottom = 4.dp)
                                        )
                                    }
                                }
                            }
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))

                        // --- 2ND LANGUAGE: ENGLISH ---
                        Text(
                            text = "2. ENGLISH (Bilingual Summary & Exam Key Points)",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.secondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = story.headlineEn,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.testTag("story_headline_en")
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = story.summaryEn,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        if (story.examKeyPointsEn.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.45f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = "Exam Key Points (English):",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    story.examKeyPointsEn.forEach { ptEn ->
                                        Text(
                                            text = "• $ptEn",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurface,
                                            modifier = Modifier.padding(bottom = 4.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // 4. Bottom Story Navigation Controls (Previous / Source / Next)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = {
                            if (currentIndex > 0) onNavigateIndex(currentIndex - 1)
                        },
                        enabled = currentIndex > 0,
                        modifier = Modifier
                            .height(48.dp)
                            .testTag("story_prev_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Previous Story",
                            tint = Color.White
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Previous", color = Color.White)
                    }

                    if (story.sourceUrl.startsWith("http")) {
                        AssistChip(
                            onClick = {
                                runCatching {
                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(story.sourceUrl)))
                                }
                            },
                            label = { Text("Source", color = Color.White) },
                            trailingIcon = {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                                    contentDescription = "Open source URL",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        )
                    }

                    Button(
                        onClick = {
                            if (currentIndex + 1 < stories.size) {
                                onNavigateIndex(currentIndex + 1)
                            } else {
                                onDismiss()
                            }
                        },
                        modifier = Modifier
                            .height(48.dp)
                            .testTag("story_next_button")
                    ) {
                        Text(if (currentIndex + 1 < stories.size) "Next Story" else "Done")
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = "Next Story"
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CurrentAffairsScreen(
    strings: CgUiStrings,
    currentAffairsState: UiState<List<CurrentAffairItem>>,
    isSyncing: Boolean,
    isOwnerAdmin: Boolean,
    onRefreshGroundedNews: () -> Unit,
    onDeleteItemAdmin: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTabIndex by rememberSaveable { mutableIntStateOf(0) }
    val categories = listOf("chhattisgarh", "national", "international")
    val tabLabels = listOf(
        strings.caTabChhattisgarh,
        strings.caTabNational,
        strings.caTabInternational
    )

    val allItems = when (currentAffairsState) {
        is UiState.Success -> currentAffairsState.data.ifEmpty { CgpediaStarterCatalog.defaultCurrentAffairs() }
        else -> CgpediaStarterCatalog.defaultCurrentAffairs()
    }

    Column(modifier = modifier.fillMaxSize()) {
        // 1. Instagram Stories Bar at the Top of the Screen (Strict Bilingual: Hindi + English)
        CurrentAffairsStoriesBar(items = allItems)

        // 2. Category Tabs (Chhattisgarh | National | International)
        PrimaryTabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary
        ) {
            tabLabels.forEachIndexed { index, label ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = if (selectedTabIndex == index) FontWeight.Bold else FontWeight.Medium
                        )
                    },
                    modifier = Modifier.testTag("ca_tab_${categories[index]}")
                )
            }
        }

        // 3. Admin-Only Manual Sync Bar (Hidden from Regular Students so students see zero AI branding)
        if (isOwnerAdmin) {
            Surface(
                color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.55f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.AdminPanelSettings,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.tertiary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Admin Exclusive: Background Current Affairs Control",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                    }

                    FilledTonalButton(
                        onClick = onRefreshGroundedNews,
                        enabled = !isSyncing,
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        modifier = Modifier.testTag("ca_sync_grounded_button")
                    ) {
                        if (isSyncing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Updating...", style = MaterialTheme.typography.labelMedium)
                        } else {
                            Icon(
                                imageVector = Icons.Filled.Refresh,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Admin Sync", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }
            }
        }

        val activeCategory = categories[selectedTabIndex]
        val filtered = allItems.filter { it.category == activeCategory }
            .ifEmpty { CgpediaStarterCatalog.defaultCurrentAffairs().filter { it.category == activeCategory } }

        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(filtered, key = { it.id }) { item ->
                CurrentAffairCard(
                    item = item,
                    isOwnerAdmin = isOwnerAdmin,
                    onDelete = { onDeleteItemAdmin(item.id) }
                )
            }
        }
    }
}

@Composable
private fun CurrentAffairCard(
    item: CurrentAffairItem,
    isOwnerAdmin: Boolean,
    onDelete: () -> Unit
) {
    val context = LocalContext.current

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("ca_card_${item.id}"),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.Verified,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.tertiary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "${item.sourceName} • ${item.dateLabel}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.tertiary,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                if (isOwnerAdmin) {
                    IconButton(onClick = onDelete, modifier = Modifier.size(36.dp)) {
                        Icon(
                            imageVector = Icons.Filled.DeleteOutline,
                            contentDescription = "Delete news",
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Strict Bilingual Presentation: 1st Hindi (Devanagari), 2nd English
            Text(
                text = item.headlineHi,
                fontFamily = NotoDevanagariFamily,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(3.dp))
            Text(
                text = item.headlineEn,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.secondary
            )

            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = item.summaryHi,
                fontFamily = NotoDevanagariFamily,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = item.summaryEn,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (item.examKeyPointsHi.isNotEmpty() || item.examKeyPointsEn.isNotEmpty()) {
                HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp))
                Text(
                    text = "परीक्षा उपयोगी तथ्य • Exam Key Points",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(6.dp))
                val maxPts = maxOf(item.examKeyPointsHi.size, item.examKeyPointsEn.size)
                for (idx in 0 until maxPts) {
                    item.examKeyPointsHi.getOrNull(idx)?.let { ptHi ->
                        Text(
                            text = "• $ptHi",
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    item.examKeyPointsEn.getOrNull(idx)?.let { ptEn ->
                        Text(
                            text = "  $ptEn",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                }
            }

            if (item.sourceUrl.startsWith("http")) {
                Spacer(modifier = Modifier.height(6.dp))
                AssistChip(
                    onClick = {
                        runCatching {
                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(item.sourceUrl)))
                        }
                    },
                    label = { Text("Official Source Link") },
                    trailingIcon = {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                            contentDescription = "Open source URL",
                            modifier = Modifier.size(15.dp)
                        )
                    }
                )
            }
        }
    }
}
