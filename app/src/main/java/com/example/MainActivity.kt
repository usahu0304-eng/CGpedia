package com.example

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.automirrored.outlined.MenuBook
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Newspaper
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Newspaper
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.audio.AnthemPlayerController
import com.example.data.ai.CgpediaAiService
import com.example.data.model.UiState
import com.example.data.repository.CgpediaRepository
import com.example.security.configureAppCheck
import com.example.service.CurrentAffairsSyncJobService
import com.example.ui.components.AnthemPlayerWidget
import com.example.ui.components.CgpediaInAppUpdateDialog
import com.example.ui.components.CgpediaTopHeader
import com.example.ui.components.getInstalledAppVersionInfo
import com.example.ui.i18n.AppStrings
import com.example.ui.screens.AdminDashboardScreen
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.BilingualTestScreen
import com.example.ui.screens.BookmarksScreen
import com.example.ui.screens.CurrentAffairsScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.screens.TestResultScreen
import com.example.ui.screens.performFullSignOut
import com.example.ui.screens.toBilingualQuestion
import com.example.ui.theme.CGpediaTheme
import com.example.ui.viewmodel.AdminViewModel
import com.example.ui.viewmodel.CgpediaViewModel
import com.example.ui.viewmodel.TestEngineViewModel
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Enforce screenshot & screen recording restriction across the application
        window?.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
        // CRITICAL: Initialize Firebase App Check BEFORE any Firebase service, ViewModel, or setContent
        configureAppCheck(this, intent)
        enableEdgeToEdge()
        setContent {
            CgpediaRootApp()
        }
    }
}

private data class NavDestination(
    val index: Int,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val tag: String
)

@Composable
fun CgpediaRootApp() {
    val context = LocalContext.current
    val appScope = rememberCoroutineScope()

    var currentUser by remember { mutableStateOf(Firebase.auth.currentUser) }

    DisposableEffect(Unit) {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            currentUser = auth.currentUser
        }
        Firebase.auth.addAuthStateListener(listener)
        onDispose {
            Firebase.auth.removeAuthStateListener(listener)
        }
    }

    val user = currentUser
    if (user == null) {
        CGpediaTheme(darkTheme = false) {
            AuthScreen(
                onAuthSuccess = {
                    currentUser = Firebase.auth.currentUser
                }
            )
        }
        return
    }

    // Schedule 6-hour AI Grounded Current Affairs background job once authenticated
    LaunchedEffect(user.uid) {
        CurrentAffairsSyncJobService.schedulePeriodicSync(context.applicationContext)
    }

    val repository = remember(user.uid) { CgpediaRepository(context.applicationContext) }
    val aiService = remember(user.uid) { CgpediaAiService() }

    val mainViewModel: CgpediaViewModel = viewModel(
        key = "cgpedia_main_${user.uid}",
        factory = viewModelFactory {
            initializer { CgpediaViewModel.fromUser(repository, aiService, user) }
        }
    )

    val testEngineViewModel: TestEngineViewModel = viewModel(
        key = "cgpedia_cbt_${user.uid}",
        factory = viewModelFactory {
            initializer { TestEngineViewModel(repository) }
        }
    )

    val userProfileState by mainViewModel.userProfileState.collectAsStateWithLifecycle()
    val appConfig by mainViewModel.appConfigState.collectAsStateWithLifecycle()
    val examFoldersState by mainViewModel.examFoldersState.collectAsStateWithLifecycle()
    val subjectFoldersState by mainViewModel.subjectFoldersState.collectAsStateWithLifecycle()
    val publishedTestsState by mainViewModel.publishedTestsState.collectAsStateWithLifecycle()
    val currentAffairsState by mainViewModel.currentAffairsState.collectAsStateWithLifecycle()
    val isCaSyncing by mainViewModel.currentAffairsSyncing.collectAsStateWithLifecycle()
    val purchases by mainViewModel.purchasesState.collectAsStateWithLifecycle()
    val attempts by mainViewModel.attemptsState.collectAsStateWithLifecycle()
    val bookmarks by mainViewModel.bookmarksState.collectAsStateWithLifecycle()
    val isOwnerAdmin by mainViewModel.isOwnerAdmin.collectAsStateWithLifecycle()
    val bannerMessage by mainViewModel.statusBannerMessage.collectAsStateWithLifecycle()
    val activeTestSession by testEngineViewModel.session.collectAsStateWithLifecycle()

    val userProfile = (userProfileState as? UiState.Success)?.data
    val uiLanguage = userProfile?.preferredLanguage ?: "en"
    val darkModeEnabled = userProfile?.darkMode ?: false
    val strings = remember(uiLanguage) { AppStrings.forCode(uiLanguage) }

    val anthemController = remember(user.uid) {
        AnthemPlayerController(context.applicationContext, appScope)
    }
    val anthemPlaybackState by anthemController.state.collectAsStateWithLifecycle()

    DisposableEffect(anthemController) {
        onDispose { anthemController.release() }
    }

    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    var showAdminConsole by rememberSaveable { mutableStateOf(false) }
    var isUpdateDismissedForSession by rememberSaveable { mutableStateOf(false) }
    val installedVersion = remember(context) { context.getInstalledAppVersionInfo() }

    // Return to Home tab on back press when viewing secondary tabs
    if (activeTestSession == null && !showAdminConsole && selectedTab != 0) {
        BackHandler {
            selectedTab = 0
        }
    }

    CGpediaTheme(darkTheme = darkModeEnabled) {
        // 1. Active CBT Exam or Result Evaluation Overlay
        val currentSession = activeTestSession
        if (currentSession != null) {
            if (currentSession.isSubmitted && currentSession.evaluatedAttempt != null) {
                TestResultScreen(
                    session = currentSession,
                    attempt = currentSession.evaluatedAttempt,
                    bookmarks = bookmarks,
                    onToggleBookmark = { q -> mainViewModel.toggleBookmark(q, bookmarks) },
                    onCloseResult = { testEngineViewModel.exitSession() }
                )
            } else {
                BilingualTestScreen(
                    session = currentSession,
                    bookmarks = bookmarks,
                    onSelectOption = { qId, optIdx -> testEngineViewModel.selectOption(qId, optIdx) },
                    onClearResponse = { qId -> testEngineViewModel.clearResponse(qId) },
                    onToggleReview = { qId -> testEngineViewModel.toggleMarkForReview(qId) },
                    onJumpToQuestion = { idx -> testEngineViewModel.jumpToQuestion(idx) },
                    onToggleBookmark = { q -> mainViewModel.toggleBookmark(q, bookmarks) },
                    onSubmitTest = { testEngineViewModel.submitTest() },
                    onExitTest = { testEngineViewModel.exitSession() }
                )
            }
            return@CGpediaTheme
        }

        // 2. Exclusive Owner Admin Dashboard Overlay (Strictly RBAC Gated)
        if (showAdminConsole && isOwnerAdmin) {
            val adminViewModel: AdminViewModel = viewModel(
                key = "cgpedia_admin_${user.uid}",
                factory = viewModelFactory {
                    initializer { AdminViewModel(repository, aiService, user.uid) }
                }
            )
            AdminDashboardScreen(
                adminViewModel = adminViewModel,
                examFolders = (examFoldersState as? UiState.Success)?.data.orEmpty(),
                subjectFolders = (subjectFoldersState as? UiState.Success)?.data.orEmpty(),
                appConfig = appConfig,
                onCloseAdmin = { showAdminConsole = false }
            )
            return@CGpediaTheme
        }

        val destinations = buildList {
            add(NavDestination(0, strings.tabHome, Icons.AutoMirrored.Filled.MenuBook, Icons.AutoMirrored.Outlined.MenuBook, "nav_tab_home"))
            add(NavDestination(1, strings.tabCurrentAffairs, Icons.Filled.Newspaper, Icons.Outlined.Newspaper, "nav_tab_ca"))
            add(NavDestination(2, strings.tabSaved, Icons.Filled.Bookmark, Icons.Outlined.BookmarkBorder, "nav_tab_saved"))
            add(NavDestination(3, strings.tabSettings, Icons.Filled.Settings, Icons.Outlined.Settings, "nav_tab_settings"))
            if (isOwnerAdmin) {
                add(NavDestination(4, strings.tabAdmin, Icons.Filled.AdminPanelSettings, Icons.Filled.AdminPanelSettings, "nav_tab_admin"))
            }
        }

        // Optional In-App APK Update Popup controlled from Admin Panel (with Remind Me Later button)
        if (appConfig.latestVersionCode > installedVersion.versionCode && !isUpdateDismissedForSession) {
            CgpediaInAppUpdateDialog(
                installedVersion = installedVersion,
                appConfig = appConfig,
                onRemindLater = { isUpdateDismissedForSession = true }
            )
        }

        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            val isExpandedScreen = maxWidth >= 600.dp

            Scaffold(
                contentWindowInsets = WindowInsets(0, 0, 0, 0),
                bottomBar = {
                    if (!isExpandedScreen) {
                        NavigationBar {
                            destinations.forEach { dest ->
                                val selected = selectedTab == dest.index
                                NavigationBarItem(
                                    selected = selected,
                                    onClick = {
                                        if (dest.index == 4 && isOwnerAdmin) {
                                            showAdminConsole = true
                                        } else {
                                            selectedTab = dest.index
                                        }
                                    },
                                    icon = {
                                        Icon(
                                            imageVector = if (selected) dest.selectedIcon else dest.unselectedIcon,
                                            contentDescription = dest.label
                                        )
                                    },
                                    label = { Text(dest.label) },
                                    modifier = Modifier.testTag(dest.tag)
                                )
                            }
                        }
                    }
                }
            ) { innerPadding ->
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    if (isExpandedScreen) {
                        NavigationRail(modifier = Modifier.fillMaxHeight()) {
                            destinations.forEach { dest ->
                                val selected = selectedTab == dest.index
                                NavigationRailItem(
                                    selected = selected,
                                    onClick = {
                                        if (dest.index == 4 && isOwnerAdmin) {
                                            showAdminConsole = true
                                        } else {
                                            selectedTab = dest.index
                                        }
                                    },
                                    icon = {
                                        Icon(
                                            imageVector = if (selected) dest.selectedIcon else dest.unselectedIcon,
                                            contentDescription = dest.label
                                        )
                                    },
                                    label = { Text(dest.label) },
                                    modifier = Modifier.testTag(dest.tag)
                                )
                            }
                        }
                    }

                    Column(modifier = Modifier.weight(1f).fillMaxHeight()) {
                        // Top App Bar prominently displaying processed CGpedia Logo + "CGpedia"
                        CgpediaTopHeader(
                            strings = strings,
                            targetExam = userProfile?.targetExam.orEmpty(),
                            isOwnerAdmin = isOwnerAdmin,
                            onToggleLanguage = {
                                val nextLang = if (uiLanguage == "hi") "en" else "hi"
                                mainViewModel.updateProfileAndPreferences(
                                    current = userProfile,
                                    preferredLanguage = nextLang
                                )
                            },
                            onOpenAdminConsole = {
                                if (isOwnerAdmin) showAdminConsole = true
                            }
                        )

                        // Sleek, compact Channel Anthem Audio Player directly below the Top Header
                        AnthemPlayerWidget(
                            config = appConfig,
                            playbackState = anthemPlaybackState,
                            isHindiUi = strings.isHindi,
                            onTogglePlayPause = {
                                anthemController.togglePlayPause(
                                    config = appConfig,
                                    fetchCloudChunks = { mainViewModel.fetchCloudAnthemBytes() }
                                )
                            }
                        )

                        if (!bannerMessage.isNullOrBlank()) {
                            Surface(
                                color = MaterialTheme.colorScheme.secondaryContainer,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { mainViewModel.dismissBanner() }
                            ) {
                                Text(
                                    text = bannerMessage.orEmpty(),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                                )
                            }
                        }

                        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                            when (selectedTab) {
                                0 -> HomeScreen(
                                    strings = strings,
                                    examFoldersState = examFoldersState,
                                    subjectFoldersState = subjectFoldersState,
                                    publishedTestsState = publishedTestsState,
                                    currentAffairsItems = (currentAffairsState as? UiState.Success)?.data.orEmpty(),
                                    purchases = purchases,
                                    attempts = attempts,
                                    whatsappSupportNumber = appConfig.whatsappSupportNumber.ifBlank { "9238810070" },
                                    onStartTest = { test ->
                                        anthemController.stopAndReset()
                                        testEngineViewModel.startTest(test)
                                    },
                                    onPurchaseItem = { id, hi, en, amount, method, onDone ->
                                        mainViewModel.purchasePremiumItem(id, hi, en, amount, method, onDone)
                                    }
                                )
                                1 -> CurrentAffairsScreen(
                                    strings = strings,
                                    currentAffairsState = currentAffairsState,
                                    isSyncing = isCaSyncing,
                                    isOwnerAdmin = isOwnerAdmin,
                                    onRefreshGroundedNews = {
                                        mainViewModel.syncGroundedCurrentAffairs(isManualAdminTrigger = true)
                                    },
                                    onDeleteItemAdmin = { articleId ->
                                        if (isOwnerAdmin) {
                                            appScope.launch {
                                                repository.deleteCurrentAffairAdmin(articleId)
                                            }
                                        }
                                    }
                                )
                                2 -> BookmarksScreen(
                                    strings = strings,
                                    bookmarks = bookmarks,
                                    onRemoveBookmark = { bm ->
                                        mainViewModel.toggleBookmark(bm.toBilingualQuestion(), bookmarks)
                                    }
                                )
                                3 -> SettingsScreen(
                                    strings = strings,
                                    userProfile = userProfile,
                                    purchases = purchases,
                                    bookmarks = bookmarks,
                                    appConfig = appConfig,
                                    onUpdateProfile = { name, phone, photo, target, lang, dark, nCa, nTest ->
                                        mainViewModel.updateProfileAndPreferences(
                                            current = userProfile,
                                            displayName = name,
                                            phoneNumber = phone,
                                            photoUrl = photo,
                                            targetExam = target,
                                            preferredLanguage = lang,
                                            darkMode = dark,
                                            notifyCurrentAffairs = nCa,
                                            notifyNewTests = nTest
                                        )
                                    },
                                    onNavigateToBookmarks = { selectedTab = 2 },
                                    onSignOut = {
                                        anthemController.stopAndReset()
                                        performFullSignOut(
                                            context = context,
                                            scope = appScope,
                                            onComplete = { currentUser = null }
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
}
