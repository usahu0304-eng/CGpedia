package com.example

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.test.core.app.ApplicationProvider
import com.example.data.ai.CgpediaAiService
import com.example.data.model.AppConfig
import com.example.data.model.CurrentAffairItem
import com.example.data.model.PurchaseRecord
import com.example.data.model.UiState
import com.example.data.model.isSubscriptionExpired
import com.example.data.model.isWithin24Hours
import com.example.data.model.remainingValidityDays
import com.example.data.seed.CgpediaStarterCatalog
import com.example.ui.components.CgpediaTopHeader
import com.example.ui.i18n.AppStrings
import com.example.ui.screens.BilingualTestScreen
import com.example.ui.screens.CurrentAffairsScreen
import com.example.ui.screens.NotificationsAndQueriesScreen
import com.example.ui.screens.PhoneAuthenticationContent
import com.example.ui.theme.CGpediaTheme
import com.example.ui.viewmodel.ActiveTestSession
import com.example.ui.viewmodel.PhoneAuthStep
import com.example.ui.viewmodel.PhoneAuthUiState
import com.example.ui.viewmodel.PhoneAuthViewModel
import com.google.firebase.Timestamp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "w412dp-h915dp")
class ExampleRobolectricTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun `read string from context and verify CGPSC and CGSSB subtitle and paid 99 series`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val appName = context.getString(R.string.app_name)
        assertEquals("CGpedia", appName)
        assertEquals("CGPSC & CGSSB", AppStrings.English.appSubtitle)

        val defaultConfig = AppConfig()
        assertEquals("9238810070", defaultConfig.whatsappSupportNumber)

        val paid2026Folder = CgpediaStarterCatalog.defaultExamFolders("admin")
            .firstOrNull { it.id == "cgpsc_pre_2026_series" }
        assertNotNull("Expected CGPSC Pre 2026 Test Series folder", paid2026Folder)
        assertEquals("CGPSC Pre 2026 Test Series", paid2026Folder?.titleEn)
        assertEquals(99L, paid2026Folder?.priceInr)
        assertFalse(paid2026Folder?.isFreeFolder ?: true)
    }

    @Test
    fun `CgpediaTopHeader displays CGPSC and CGSSB subtitle and CurrentAffairsScreen shows Instagram Stories without AI branding for students`() {
        val articles = CgpediaStarterCatalog.defaultCurrentAffairs("system")

        composeTestRule.setContent {
            CGpediaTheme(darkTheme = false) {
                androidx.compose.foundation.layout.Column {
                    CgpediaTopHeader(
                        strings = AppStrings.English,
                        targetExam = "CGPSC & CGSSB",
                        isOwnerAdmin = false,
                        onToggleLanguage = {},
                        onOpenAdminConsole = {}
                    )
                    CurrentAffairsScreen(
                        strings = AppStrings.English,
                        currentAffairsState = UiState.Success(articles),
                        isGeneratingQuiz = false,
                        isOwnerAdmin = false,
                        onStartInstantQuiz = {},
                        onDeleteItemAdmin = {}
                    )
                }
            }
        }

        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("header_cgpedia_subtitle")
            .assertIsDisplayed()
            .assertTextContains("CGPSC & CGSSB", substring = true)

        composeTestRule.onNodeWithTag("ca_instagram_stories_bar").assertIsDisplayed()
        // Regular students see the top-right Quiz button in Current Affairs
        composeTestRule.onNodeWithTag("ca_instant_quiz_button").assertIsDisplayed()
        // Regular students must NOT see the manual admin AI sync button
        composeTestRule.onNodeWithTag("ca_sync_grounded_button").assertDoesNotExist()
    }

    @Test
    fun `BilingualTestScreen separates Submit button in top header from Save and Next and shows security protection badge`() {
        val testItem = CgpediaStarterCatalog.defaultTests("admin").first()
        val questions = CgpediaStarterCatalog.defaultQuestions("admin").filter { it.testId == testItem.id }
        val session = ActiveTestSession(
            test = testItem,
            questions = questions,
            currentQuestionIndex = 0,
            selectedOptions = emptyMap(),
            markedForReview = emptySet(),
            visitedQuestionIds = setOf(questions.first().id),
            remainingSeconds = 1800,
            isLoading = false
        )

        composeTestRule.setContent {
            CGpediaTheme(darkTheme = false) {
                BilingualTestScreen(
                    session = session,
                    bookmarks = emptyList(),
                    onSelectOption = { _, _ -> },
                    onClearResponse = {},
                    onToggleReview = {},
                    onJumpToQuestion = {},
                    onToggleBookmark = {},
                    onSubmitTest = {},
                    onExitTest = {}
                )
            }
        }

        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("cbt_security_badge").assertIsDisplayed()
        composeTestRule.onNodeWithTag("cbt_submit_button").assertIsDisplayed()
        composeTestRule.onNodeWithTag("cbt_next_button").assertIsDisplayed()

        // Clicking Submit opens confirmation dialog preventing premature submission
        composeTestRule.onNodeWithTag("cbt_submit_button").performClick()
        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("confirm_submit_test_button").assertIsDisplayed()
    }

    @Test
    fun `normalizeToE164 handles 10-digit, trunk prefix 0, and pasted +91 phone inputs`() {
        assertEquals(
            "+919876543210",
            PhoneAuthViewModel.normalizeToE164("+91", "9876543210")
        )
        assertEquals(
            "+919876543210",
            PhoneAuthViewModel.normalizeToE164("+91", "09876543210")
        )
        assertEquals(
            "+919876543210",
            PhoneAuthViewModel.normalizeToE164("+91", "+91 98765-43210")
        )
        assertEquals(
            "+919876543210",
            PhoneAuthViewModel.normalizeToE164("+91", "919876543210")
        )
        assertTrue(PhoneAuthViewModel.isValidE164Phone("+919876543210"))
        assertFalse(PhoneAuthViewModel.isValidE164Phone("+9198765"))
    }

    @Test
    fun `PhoneAuthenticationScreen renders phone input and triggers OTP request`() {
        var state by mutableStateOf(PhoneAuthUiState())
        var otpRequestedCount = 0

        composeTestRule.setContent {
            CGpediaTheme(darkTheme = false) {
                PhoneAuthenticationContent(
                    uiState = state,
                    onCountryCodeChange = { code -> state = state.copy(countryCode = code) },
                    onPhoneNumberChange = { num ->
                        state = state.copy(
                            phoneNumberInput = num,
                            formattedE164 = PhoneAuthViewModel.normalizeToE164(state.countryCode, num)
                        )
                    },
                    onApplyDemoNumber = {},
                    onRequestOtpClick = {
                        otpRequestedCount++
                        state = state.copy(
                            step = PhoneAuthStep.VERIFY_OTP,
                            verificationId = "ver_123"
                        )
                    },
                    onOtpCodeChange = { otp -> state = state.copy(otpCode = otp) },
                    onVerifyOtpClick = {},
                    onResendOtpClick = {},
                    onEditPhoneNumberClick = { state = state.copy(step = PhoneAuthStep.ENTER_PHONE) }
                )
            }
        }

        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("phone_number_input").performScrollTo().assertIsDisplayed()
        composeTestRule.onNodeWithTag("request_otp_button").performScrollTo().assertIsDisplayed()

        composeTestRule.onNodeWithTag("phone_number_input").performTextInput("9876543210")
        composeTestRule.waitForIdle()
        assertEquals("+919876543210", state.formattedE164)

        composeTestRule.onNodeWithTag("request_otp_button").performClick()
        composeTestRule.waitForIdle()

        assertEquals(1, otpRequestedCount)
        composeTestRule.onNodeWithTag("otp_code_input").performScrollTo().assertIsDisplayed()
        composeTestRule.onNodeWithTag("verify_otp_button").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `PhoneAuthenticationContent displays status 17006 recovery banner with Google Sign In button`() {
        var googleClicked = false
        val state = PhoneAuthUiState(
            statusBannerError = "Firebase Console Action Required (Status 17006): Phone sign-in provider is disabled in project 'cgpedia-2bd5c'.",
            isOperationNotAllowed = true
        )

        composeTestRule.setContent {
            CGpediaTheme(darkTheme = false) {
                PhoneAuthenticationContent(
                    uiState = state,
                    onCountryCodeChange = {},
                    onPhoneNumberChange = {},
                    onApplyDemoNumber = {},
                    onRequestOtpClick = {},
                    onOtpCodeChange = {},
                    onVerifyOtpClick = {},
                    onResendOtpClick = {},
                    onEditPhoneNumberClick = {},
                    onGoogleSignInClick = { googleClicked = true }
                )
            }
        }

        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("phone_auth_error_banner").performScrollTo().assertIsDisplayed()
        composeTestRule.onNodeWithTag("error_banner_google_fallback_button").performScrollTo().assertIsDisplayed()
        composeTestRule.onNodeWithTag("error_banner_google_fallback_button").performClick()
        assertTrue(googleClicked)
    }

    @Test
    fun `AI test generation timeout is at least 5 minutes and 24h story plus subscription validity rules work`() {
        assertTrue(
            "AI generation timeout must be at least 300,000 ms (5 minutes)",
            CgpediaAiService.AI_GENERATION_TIMEOUT_MS >= 300_000L
        )

        val nowMs = System.currentTimeMillis()
        val recentStory = CurrentAffairItem(
            id = "s1",
            headlineHi = "ताज़ा खबर",
            headlineEn = "Fresh Story",
            createdAt = Timestamp((nowMs - 3_600_000L) / 1000L, 0)
        )
        val expiredStory = CurrentAffairItem(
            id = "s2",
            headlineHi = "पुरानी खबर",
            headlineEn = "Expired Story",
            createdAt = Timestamp((nowMs - 26L * 3_600_000L) / 1000L, 0)
        )
        assertTrue("Story posted 1 hour ago must be within 24 hours", recentStory.isWithin24Hours(nowMs))
        assertFalse("Story posted 26 hours ago must expire after 24 hours", expiredStory.isWithin24Hours(nowMs))

        val activePurchase = PurchaseRecord(
            id = "p1",
            testId = "cgpsc_pre_2026_series",
            validityDays = 180L,
            expiresAtMillis = nowMs + (30L * 86_400_000L)
        )
        val expiredPurchase = PurchaseRecord(
            id = "p2",
            testId = "cgpsc_pre_2026_series",
            validityDays = 30L,
            expiresAtMillis = nowMs - 86_400_000L
        )
        assertFalse(activePurchase.isSubscriptionExpired(nowMs))
        assertEquals(30L, activePurchase.remainingValidityDays(nowMs))
        assertTrue(expiredPurchase.isSubscriptionExpired(nowMs))
        assertEquals(0L, expiredPurchase.remainingValidityDays(nowMs))

        composeTestRule.setContent {
            CGpediaTheme(darkTheme = false) {
                NotificationsAndQueriesScreen(
                    notifications = CgpediaStarterCatalog.defaultBroadcastNotifications("admin"),
                    upcomingTests = CgpediaStarterCatalog.defaultUpcomingTests("admin"),
                    myQueries = emptyList(),
                    whatsappSupportNumber = "9238810070",
                    onSubmitQuery = { _, _, _ -> }
                )
            }
        }

        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("hub_subtab_0").assertIsDisplayed()
        composeTestRule.onNodeWithTag("hub_subtab_1").assertIsDisplayed()
        composeTestRule.onNodeWithTag("hub_subtab_2").assertIsDisplayed()
    }

    @Test
    fun `CgpediaInAppUpdateDialog displays bilingual update notes and optional Remind Me Later button`() {
        var remindLaterClicked = false
        val installed = com.example.ui.components.InstalledAppVersionInfo(versionCode = 2L, versionName = "2.0.0")
        val newerCloudConfig = AppConfig(
            latestVersionCode = 3L,
            latestVersionName = "2.1.0",
            apkDownloadUrl = "https://t.me/CGpediaOfficial",
            updateNotesHi = "नया अपडेट उपलब्ध: सीजीपीएससी प्री 2026 टेस्ट सीरीज (₹99)",
            updateNotesEn = "New Update Available: CGPSC Pre 2026 Test Series (₹99)"
        )

        composeTestRule.setContent {
            CGpediaTheme(darkTheme = false) {
                com.example.ui.components.CgpediaInAppUpdateDialog(
                    installedVersion = installed,
                    appConfig = newerCloudConfig,
                    onRemindLater = { remindLaterClicked = true }
                )
            }
        }

        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("in_app_update_download_button").assertIsDisplayed()
        composeTestRule.onNodeWithTag("in_app_update_remind_later_button").assertIsDisplayed()
        composeTestRule.onNodeWithTag("in_app_update_remind_later_button").performClick()
        assertTrue("Expected Remind Me Later button to dismiss dialog", remindLaterClicked)
    }
}

