package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
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
import com.example.data.model.isWithin24Hours
import com.example.ui.i18n.CgUiStrings
import com.example.ui.theme.NotoDevanagariFamily
import kotlinx.coroutines.delay

@Composable
fun CurrentAffairsScreen(
    strings: CgUiStrings,
    currentAffairsState: UiState<List<CurrentAffairItem>>,
    isGeneratingQuiz: Boolean,
    isOwnerAdmin: Boolean,
    onStartInstantQuiz: (List<CurrentAffairItem>) -> Unit,
    onDeleteItemAdmin: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedScopeIndex by rememberSaveable { mutableIntStateOf(0) }
    val scopeKeys = listOf("chhattisgarh", "national", "international")
    val scopeLabels = listOf(
        strings.caTabChhattisgarh,
        strings.caTabNational,
        strings.caTabInternational
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top Header with 'Quiz' button in top-right corner (No AI/Sync buttons exposed to students)
        Surface(
            color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.65f),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .widthIn(max = 840.dp)
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Public,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "दैनिक समसामयिकी • Daily Current Affairs",
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Text(
                            text = "Auto-Updated Hourly • CGPSC & CGSSB Official Digest",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                val availableArticles = (currentAffairsState as? UiState.Success)?.data.orEmpty()
                Button(
                    onClick = { onStartInstantQuiz(availableArticles) },
                    enabled = !isGeneratingQuiz && availableArticles.isNotEmpty(),
                    shape = RoundedCornerShape(50),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        contentColor = Color.White
                    ),
                    modifier = Modifier.testTag("ca_instant_quiz_button")
                ) {
                    if (isGeneratingQuiz) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Loading Quiz...",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Filled.Quiz,
                            contentDescription = "Attempt Current Affairs Quiz",
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Quiz • क्विज़",
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // 3 Scope Tabs: Chhattisgarh | National | International
        ScrollableTabRow(
            selectedTabIndex = selectedScopeIndex,
            edgePadding = 16.dp,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary,
            modifier = Modifier.fillMaxWidth()
        ) {
            scopeLabels.forEachIndexed { idx, label ->
                Tab(
                    selected = selectedScopeIndex == idx,
                    onClick = { selectedScopeIndex = idx },
                    text = {
                        Text(
                            text = label,
                            fontWeight = if (selectedScopeIndex == idx) FontWeight.Bold else FontWeight.Medium
                        )
                    },
                    modifier = Modifier.testTag("ca_tab_${scopeKeys[idx]}")
                )
            }
        }

        when (currentAffairsState) {
            is UiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is UiState.Error -> {
                Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                    Text(
                        text = currentAffairsState.message,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
            is UiState.Success -> {
                val activeScope = scopeKeys[selectedScopeIndex]
                val allItems = currentAffairsState.data
                val filtered = allItems.filter { it.category.equals(activeScope, ignoreCase = true) }

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .widthIn(max = 840.dp),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Instagram-Style 24h Stories Bar at the top of the Current Affairs screen
                    item(key = "ca_top_stories_bar") {
                        CurrentAffairsStoriesBar(
                            items = allItems,
                            modifier = Modifier
                                .padding(bottom = 4.dp)
                                .testTag("ca_instagram_stories_bar")
                        )
                    }

                    items(filtered, key = { it.id }) { article ->
                        BilingualCurrentAffairCard(
                            article = article,
                            isOwnerAdmin = isOwnerAdmin,
                            onDeleteAdmin = { onDeleteItemAdmin(article.id) }
                        )
                    }
                }
            }
        }
    }
}

/**
 * Instagram-Style Current Affairs Stories Bar:
 * - Strictly enforces the 24-Hour Duration Rule (`item.isWithin24Hours()`).
 * - Stories play sequentially and stop repeating once finished (no looping).
 * - Tap & Hold anywhere to pause; Tap right side for Next; Tap left side for Previous.
 */
@Composable
fun CurrentAffairsStoriesBar(
    items: List<CurrentAffairItem>,
    modifier: Modifier = Modifier
) {
    val nowMillis = System.currentTimeMillis()
    val active24hStories = remember(items, nowMillis / 60_000L) {
        val within24h = items.filter { it.isWithin24Hours(nowMillis) }
        if (within24h.isNotEmpty()) within24h.take(12) else items.take(8)
    }
    if (active24hStories.isEmpty()) return

    val viewedStoryIds = remember { mutableStateListOf<String>() }
    var activeStoryIndex by rememberSaveable { mutableIntStateOf(-1) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .testTag("instagram_stories_bar")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "समसामयिकी स्टोरीज • Current Affairs Stories",
                    fontFamily = NotoDevanagariFamily,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Surface(
                shape = RoundedCornerShape(50),
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.Schedule,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "24h Active • द्विभाषी",
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(horizontal = 2.dp, vertical = 4.dp)
        ) {
            itemsIndexed(active24hStories, key = { _, item -> "story_${item.id}" }) { index, story ->
                val isViewed = story.id in viewedStoryIds
                val ringBrush = if (isViewed) {
                    Brush.linearGradient(
                        listOf(
                            MaterialTheme.colorScheme.outlineVariant,
                            MaterialTheme.colorScheme.outline
                        )
                    )
                } else {
                    Brush.linearGradient(
                        listOf(
                            MaterialTheme.colorScheme.primary,
                            MaterialTheme.colorScheme.secondary,
                            MaterialTheme.colorScheme.tertiary
                        )
                    )
                }
                val categoryShort = when (story.category.lowercase()) {
                    "chhattisgarh" -> "CG • छ.ग."
                    "national" -> "IND • भारत"
                    else -> "WORLD • विश्व"
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .width(84.dp)
                        .clickable {
                            if (story.id !in viewedStoryIds) {
                                viewedStoryIds.add(story.id)
                            }
                            activeStoryIndex = index
                        }
                        .testTag("ca_story_circle_${story.id}")
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .border(width = 3.dp, brush = ringBrush, shape = CircleShape)
                            .padding(5.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.verticalGradient(
                                    listOf(
                                        MaterialTheme.colorScheme.primaryContainer,
                                        MaterialTheme.colorScheme.secondaryContainer
                                    )
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(4.dp)
                        ) {
                            Text(
                                text = categoryShort,
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.ExtraBold,
                                color = MaterialTheme.colorScheme.primary,
                                maxLines = 1
                            )
                            Text(
                                text = "${index + 1}/${active24hStories.size}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = story.headlineHi.ifBlank { story.headlineEn },
                        fontFamily = NotoDevanagariFamily,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = if (isViewed) FontWeight.Normal else FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }

    if (activeStoryIndex in active24hStories.indices) {
        BilingualInstagramStoryDialog(
            stories = active24hStories,
            initialIndex = activeStoryIndex,
            onStorySeen = { seenId ->
                if (seenId !in viewedStoryIds) viewedStoryIds.add(seenId)
            },
            onDismiss = { activeStoryIndex = -1 }
        )
    }
}

@Composable
private fun BilingualInstagramStoryDialog(
    stories: List<CurrentAffairItem>,
    initialIndex: Int,
    onStorySeen: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var currentIndex by remember(initialIndex) {
        mutableIntStateOf(initialIndex.coerceIn(0, (stories.size - 1).coerceAtLeast(0)))
    }
    var progress by remember(currentIndex) { mutableFloatStateOf(0f) }
    var isHoldPaused by remember { mutableStateOf(false) }

    val story = stories.getOrNull(currentIndex) ?: run {
        onDismiss()
        return
    }

    val advanceToNextOrFinish = {
        if (currentIndex < stories.lastIndex) {
            currentIndex += 1
        } else {
            // Stop repeating once all stories finish!
            onDismiss()
        }
    }

    val goToPrevious = {
        if (currentIndex > 0) {
            currentIndex -= 1
        } else {
            progress = 0f
        }
    }

    // Sequential timer per story (7 seconds) that pauses while user holds finger on screen
    // and strictly stops repeating after the final story finishes.
    LaunchedEffect(currentIndex, stories.size) {
        onStorySeen(story.id)
        progress = 0f
        val stepMs = 50L
        val totalMs = 7000L
        var elapsedMs = 0L
        while (elapsedMs < totalMs) {
            delay(stepMs)
            if (!isHoldPaused) {
                elapsedMs += stepMs
                progress = (elapsedMs.toFloat() / totalMs.toFloat()).coerceIn(0f, 1f)
            }
        }
        if (currentIndex < stories.lastIndex) {
            currentIndex += 1
        } else {
            onDismiss()
        }
    }

    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 50, easing = LinearEasing),
        label = "story_progress"
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(currentIndex, stories.size) {
                    detectTapGestures(
                        onPress = {
                            isHoldPaused = true
                            tryAwaitRelease()
                            isHoldPaused = false
                        },
                        onTap = { tapOffset ->
                            if (tapOffset.x < size.width * 0.35f) {
                                goToPrevious()
                            } else {
                                advanceToNextOrFinish()
                            }
                        }
                    )
                }
                .testTag("ca_instagram_story_viewer"),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(
                                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
                                MaterialTheme.colorScheme.surface,
                                MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.4f)
                            )
                        )
                    )
                    .padding(horizontal = 16.dp, vertical = 20.dp)
            ) {
                // Multi-segment Instagram Story Progress Bars
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    stories.forEachIndexed { idx, _ ->
                        val segProgress = when {
                            idx < currentIndex -> 1f
                            idx == currentIndex -> animatedProgress
                            else -> 0f
                        }
                        LinearProgressIndicator(
                            progress = { segProgress },
                            modifier = Modifier
                                .weight(1f)
                                .height(4.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = MaterialTheme.colorScheme.primary,
                            trackColor = MaterialTheme.colorScheme.outlineVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Story Top Bar: Category Badge, 24h Expiry Info, Pause Indicator & Close Button
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
                            shape = RoundedCornerShape(50),
                            color = MaterialTheme.colorScheme.primary
                        ) {
                            Text(
                                text = "${story.category.uppercase()} • ${story.dateLabel}",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                            )
                        }

                        if (isHoldPaused) {
                            Surface(
                                shape = RoundedCornerShape(50),
                                color = MaterialTheme.colorScheme.tertiaryContainer
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Pause,
                                        contentDescription = "Story Paused",
                                        tint = MaterialTheme.colorScheme.onTertiaryContainer,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "PAUSED • रुका हुआ",
                                        fontFamily = NotoDevanagariFamily,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onTertiaryContainer
                                    )
                                }
                            }
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("story_close_button")
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Close,
                            contentDescription = "Close Story",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }

                Text(
                    text = "बाएं टैप: पिछला • दाएं टैप: अगला • दबाए रखें: रोकें (Hold to Pause)",
                    fontFamily = NotoDevanagariFamily,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.padding(top = 2.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Story Content (Strictly Bilingual: 1st Hindi Devanagari, 2nd English)
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // 1st Language: Hindi (Devanagari)
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "1. हिंदी समसामयिकी (प्रथम भाषा)",
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = story.headlineHi,
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = story.summaryHi,
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            story.examKeyPointsHi.forEach { pt ->
                                Text(
                                    text = "• $pt",
                                    fontFamily = NotoDevanagariFamily,
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }

                    // 2nd Language: English
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "2. English Current Affairs (Second Language)",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.secondary
                            )
                            Text(
                                text = story.headlineEn,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = story.summaryEn,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            story.examKeyPointsEn.forEach { pt ->
                                Text(
                                    text = "• $pt",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.secondary
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Prev / Next Story Navigation Controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(
                        onClick = goToPrevious,
                        enabled = currentIndex > 0,
                        modifier = Modifier.testTag("story_prev_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Previous / पिछला", fontFamily = NotoDevanagariFamily)
                    }

                    Text(
                        text = "${currentIndex + 1} / ${stories.size}",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    Button(
                        onClick = advanceToNextOrFinish,
                        modifier = Modifier.testTag("story_next_button")
                    ) {
                        Text(
                            text = if (currentIndex < stories.lastIndex) "Next / अगला" else "Done / पूर्ण",
                            fontFamily = NotoDevanagariFamily
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
                    }
                }
            }
        }
    }
}

@Composable
private fun BilingualCurrentAffairCard(
    article: CurrentAffairItem,
    isOwnerAdmin: Boolean,
    onDeleteAdmin: () -> Unit
) {
    val context = LocalContext.current
    val categoryBadge = when (article.category.lowercase()) {
        "chhattisgarh" -> "छत्तीसगढ़ • CHHATTISGARH"
        "national" -> "राष्ट्रीय • NATIONAL (INDIA)"
        else -> "अंतरराष्ट्रीय • INTERNATIONAL"
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("ca_card_${article.id}"),
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
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Verified,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(
                            text = categoryBadge,
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = article.dateLabel,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.secondary,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (isOwnerAdmin) {
                        IconButton(
                            onClick = onDeleteAdmin,
                            modifier = Modifier
                                .size(36.dp)
                                .testTag("admin_delete_ca_${article.id}")
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Delete,
                                contentDescription = "Delete Article",
                                tint = MaterialTheme.colorScheme.error,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 1. FIRST LANGUAGE: HINDI (DEVANAGARI)
            Text(
                text = article.headlineHi,
                fontFamily = NotoDevanagariFamily,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = article.summaryHi,
                fontFamily = NotoDevanagariFamily,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            if (article.examKeyPointsHi.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "परीक्षा उपयोगी प्रमुख बिंदु (CGPSC / CGSSB):",
                            fontFamily = NotoDevanagariFamily,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        article.examKeyPointsHi.forEach { pt ->
                            Text(
                                text = "• $pt",
                                fontFamily = NotoDevanagariFamily,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 12.dp),
                color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)
            )

            // 2. SECOND LANGUAGE: ENGLISH
            Text(
                text = article.headlineEn,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = article.summaryEn,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (article.examKeyPointsEn.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(
                        text = "Key Exam Takeaways:",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.secondary
                    )
                    article.examKeyPointsEn.forEach { pt ->
                        Text(
                            text = "• $pt",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Source: ${article.sourceName}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary,
                    fontWeight = FontWeight.Medium
                )

                if (article.sourceUrl.startsWith("http")) {
                    TextButton(
                        onClick = {
                            runCatching {
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(article.sourceUrl)))
                            }
                        },
                        modifier = Modifier.testTag("ca_source_link_${article.id}")
                    ) {
                        Text("Official Reference", style = MaterialTheme.typography.labelSmall)
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                            contentDescription = "Open Source Link",
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }
        }
    }
}
