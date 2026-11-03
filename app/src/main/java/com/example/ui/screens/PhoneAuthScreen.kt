package com.example.ui.screens

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.R
import com.example.ui.theme.NotoDevanagariFamily
import com.example.ui.viewmodel.PhoneAuthStep
import com.example.ui.viewmodel.PhoneAuthUiState
import com.example.ui.viewmodel.PhoneAuthViewModel

internal fun Context.findHostActivity(): Activity? {
    var ctx = this
    while (ctx is ContextWrapper) {
        if (ctx is Activity) return ctx
        ctx = ctx.baseContext
    }
    return null
}

/**
 * Dedicated Jetpack Compose Phone Authentication Screen powered by Firebase Auth
 * (`PhoneAuthOptions` & `PhoneAuthProvider.verifyPhoneNumber`).
 */
@Composable
fun PhoneAuthenticationScreen(
    onAuthSuccess: () -> Unit,
    modifier: Modifier = Modifier,
    phoneAuthViewModel: PhoneAuthViewModel = viewModel(),
    onGoogleSignInClick: (() -> Unit)? = null,
    secondaryAuthSlot: (@Composable () -> Unit)? = null
) {
    val context = LocalContext.current
    val uiState by phoneAuthViewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState.isAuthenticated) {
        if (uiState.isAuthenticated) {
            onAuthSuccess()
        }
    }

    if (uiState.step == PhoneAuthStep.VERIFY_OTP) {
        BackHandler {
            phoneAuthViewModel.returnToPhoneEntry()
        }
    }

    PhoneAuthenticationContent(
        uiState = uiState,
        onCountryCodeChange = phoneAuthViewModel::onCountryCodeChanged,
        onPhoneNumberChange = phoneAuthViewModel::onPhoneNumberChanged,
        onApplyDemoNumber = { phoneAuthViewModel.applyPresetPhoneNumber("+91", "9999999999") },
        onRequestOtpClick = {
            phoneAuthViewModel.requestOtp(
                activity = context.findHostActivity(),
                isResend = false
            )
        },
        onOtpCodeChange = phoneAuthViewModel::onOtpCodeChanged,
        onVerifyOtpClick = phoneAuthViewModel::verifyOtp,
        onResendOtpClick = {
            phoneAuthViewModel.requestOtp(
                activity = context.findHostActivity(),
                isResend = true
            )
        },
        onEditPhoneNumberClick = phoneAuthViewModel::returnToPhoneEntry,
        onGoogleSignInClick = onGoogleSignInClick,
        secondaryAuthSlot = secondaryAuthSlot,
        modifier = modifier
    )
}

@Composable
fun PhoneAuthenticationContent(
    uiState: PhoneAuthUiState,
    onCountryCodeChange: (String) -> Unit,
    onPhoneNumberChange: (String) -> Unit,
    onApplyDemoNumber: () -> Unit,
    onRequestOtpClick: () -> Unit,
    onOtpCodeChange: (String) -> Unit,
    onVerifyOtpClick: () -> Unit,
    onResendOtpClick: () -> Unit,
    onEditPhoneNumberClick: () -> Unit,
    modifier: Modifier = Modifier,
    onGoogleSignInClick: (() -> Unit)? = null,
    secondaryAuthSlot: (@Composable () -> Unit)? = null
) {
    val focusManager = LocalFocusManager.current
    var showTestingGuide by rememberSaveable { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.primary,
                        MaterialTheme.colorScheme.secondary.copy(alpha = 0.90f),
                        MaterialTheme.colorScheme.background
                    )
                )
            )
            .windowInsetsPadding(WindowInsets.safeDrawing),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 520.dp)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Official CGpedia Emblem & Branding Header
            Image(
                painter = painterResource(id = R.drawable.img_cgpedia_logo_1793611333499),
                contentDescription = stringResource(R.string.logo_content_description),
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(104.dp)
                    .clip(CircleShape)
                    .border(3.dp, MaterialTheme.colorScheme.primaryContainer, CircleShape)
                    .testTag("auth_cgpedia_logo")
            )

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = stringResource(R.string.app_name),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimary
            )

            Text(
                text = "CGPSC & CGSSB",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimary,
                textAlign = TextAlign.Center,
                modifier = Modifier.testTag("auth_cgpedia_subtitle")
            )

            Text(
                text = "छत्तीसगढ़ लोक सेवा एवं व्यापम परीक्षा पोर्टल",
                fontFamily = NotoDevanagariFamily,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.90f),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(22.dp))

            // Main Phone Authentication Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("phone_auth_card"),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(22.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Step Badge + Testing Guide Toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.PhoneAndroid,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (uiState.step == PhoneAuthStep.ENTER_PHONE) {
                                        "Step 1 of 2 • Mobile Input"
                                    } else {
                                        "Step 2 of 2 • OTP Verification"
                                    },
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }

                        TextButton(
                            onClick = { showTestingGuide = !showTestingGuide },
                            modifier = Modifier.testTag("phone_testing_guide_toggle")
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Info,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(if (showTestingGuide) "Hide Tip" else "Test OTP")
                        }
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = stringResource(R.string.phone_auth_title),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = stringResource(R.string.phone_auth_subtitle),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    AnimatedVisibility(visible = showTestingGuide) {
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.55f)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = "Instant Emulator / Spark Plan Testing:",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer
                                )
                                Text(
                                    text = "In Firebase Console (cgpedia-2bd5c -> Authentication -> Sign-in method -> Phone -> Phone numbers for testing), add +91 9999999999 with code 123456 for instant zero-cost OTP sign-in.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer
                                )
                                AssistChip(
                                    onClick = onApplyDemoNumber,
                                    label = { Text("Fill +91 9999999999") },
                                    colors = AssistChipDefaults.assistChipColors(
                                        containerColor = MaterialTheme.colorScheme.surface
                                    ),
                                    modifier = Modifier.testTag("fill_demo_phone_chip")
                                )
                            }
                        }
                    }

                    // Error or Info Banner
                    if (!uiState.statusBannerError.isNullOrBlank()) {
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.errorContainer
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("phone_auth_error_banner")
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Warning,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onErrorContainer,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = when {
                                            uiState.isOperationNotAllowed -> "Firebase Config Required: Status 17006"
                                            uiState.isWebVerificationCanceled -> "Device Verification Dismissed"
                                            else -> "Authentication Error"
                                        },
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onErrorContainer
                                    )
                                }

                                Text(
                                    text = uiState.statusBannerError,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )

                                if (onGoogleSignInClick != null) {
                                    Button(
                                        onClick = onGoogleSignInClick,
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = MaterialTheme.colorScheme.primary,
                                            contentColor = MaterialTheme.colorScheme.onPrimary
                                        ),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .testTag("error_banner_google_fallback_button")
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.VerifiedUser,
                                            contentDescription = null,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Continue with Google Account (1-Tap)",
                                            style = MaterialTheme.typography.labelLarge,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    }

                    if (!uiState.infoMessage.isNullOrBlank()) {
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.tertiaryContainer
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.CheckCircle,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.tertiary,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = uiState.infoMessage,
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onTertiaryContainer
                                )
                            }
                        }
                    }

                    // Animated Transition between Phone Number Entry and OTP Verification
                    AnimatedContent(
                        targetState = uiState.step,
                        transitionSpec = {
                            fadeIn(spring(stiffness = Spring.StiffnessMediumLow)) togetherWith
                                fadeOut(spring(stiffness = Spring.StiffnessMediumLow))
                        },
                        label = "phone_auth_step_transition"
                    ) { step ->
                        when (step) {
                            PhoneAuthStep.ENTER_PHONE -> {
                                PhoneEntryStepSection(
                                    uiState = uiState,
                                    onCountryCodeChange = onCountryCodeChange,
                                    onPhoneNumberChange = onPhoneNumberChange,
                                    onRequestOtpClick = {
                                        focusManager.clearFocus()
                                        onRequestOtpClick()
                                    }
                                )
                            }

                            PhoneAuthStep.VERIFY_OTP -> {
                                OtpVerificationStepSection(
                                    uiState = uiState,
                                    onOtpCodeChange = onOtpCodeChange,
                                    onVerifyOtpClick = {
                                        focusManager.clearFocus()
                                        onVerifyOtpClick()
                                    },
                                    onResendOtpClick = onResendOtpClick,
                                    onEditPhoneNumberClick = onEditPhoneNumberClick
                                )
                            }
                        }
                    }

                    if (secondaryAuthSlot != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            HorizontalDivider(modifier = Modifier.weight(1f))
                            Text(
                                text = "  OR  ",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            HorizontalDivider(modifier = Modifier.weight(1f))
                        }

                        secondaryAuthSlot()
                    }
                }
            }
        }
    }
}

@Composable
private fun PhoneEntryStepSection(
    uiState: PhoneAuthUiState,
    onCountryCodeChange: (String) -> Unit,
    onPhoneNumberChange: (String) -> Unit,
    onRequestOtpClick: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.Top
        ) {
            OutlinedTextField(
                value = uiState.countryCode,
                onValueChange = onCountryCodeChange,
                label = { Text(stringResource(R.string.phone_country_code_label)) },
                singleLine = true,
                enabled = !uiState.isLoading,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Phone,
                    imeAction = ImeAction.Next
                ),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .width(88.dp)
                    .testTag("country_code_input")
            )

            OutlinedTextField(
                value = uiState.phoneNumberInput,
                onValueChange = onPhoneNumberChange,
                label = { Text(stringResource(R.string.phone_number_label)) },
                placeholder = { Text(stringResource(R.string.phone_number_placeholder)) },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Filled.PhoneAndroid,
                        contentDescription = null
                    )
                },
                isError = !uiState.phoneFieldError.isNullOrBlank(),
                supportingText = {
                    when {
                        !uiState.phoneFieldError.isNullOrBlank() -> {
                            Text(
                                text = uiState.phoneFieldError,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                        uiState.formattedE164.isNotBlank() -> {
                            Text(
                                text = "E.164 target: ${uiState.formattedE164}",
                                color = MaterialTheme.colorScheme.secondary
                            )
                        }
                        else -> {
                            Text("10-digit mobile number (द्विभाषी टेस्ट एवं करंट अफेयर्स सिंक)")
                        }
                    }
                },
                singleLine = true,
                enabled = !uiState.isLoading,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Phone,
                    imeAction = ImeAction.Send
                ),
                keyboardActions = KeyboardActions(
                    onSend = { onRequestOtpClick() }
                ),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .weight(1f)
                    .testTag("phone_number_input")
            )
        }

        Button(
            onClick = onRequestOtpClick,
            enabled = !uiState.isLoading,
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            ),
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp)
                .testTag("request_otp_button")
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(22.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.5.dp
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = stringResource(R.string.requesting_otp_label),
                    style = MaterialTheme.typography.labelLarge
                )
            } else {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Send,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = stringResource(R.string.request_otp_button),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun OtpVerificationStepSection(
    uiState: PhoneAuthUiState,
    onOtpCodeChange: (String) -> Unit,
    onVerifyOtpClick: () -> Unit,
    onResendOtpClick: () -> Unit,
    onEditPhoneNumberClick: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Code sent to ${uiState.formattedE164}",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary,
                fontWeight = FontWeight.SemiBold
            )
            TextButton(
                onClick = onEditPhoneNumberClick,
                enabled = !uiState.isLoading,
                modifier = Modifier.testTag("change_phone_button")
            ) {
                Icon(
                    imageVector = Icons.Filled.Edit,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(stringResource(R.string.change_phone_button))
            }
        }

        // Visual 6-Digit Preview Boxes
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            repeat(6) { index ->
                val char = uiState.otpCode.getOrNull(index)?.toString().orEmpty()
                val isCurrent = uiState.otpCode.length == index
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            if (char.isNotEmpty()) {
                                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.65f)
                            } else {
                                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
                            }
                        )
                        .border(
                            width = if (isCurrent) 2.dp else 1.dp,
                            color = if (isCurrent) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                MaterialTheme.colorScheme.outline.copy(alpha = 0.45f)
                            },
                            shape = RoundedCornerShape(12.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = char,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }

        OutlinedTextField(
            value = uiState.otpCode,
            onValueChange = onOtpCodeChange,
            label = { Text(stringResource(R.string.otp_code_label)) },
            placeholder = { Text("123456") },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Filled.Lock,
                    contentDescription = null
                )
            },
            isError = !uiState.otpFieldError.isNullOrBlank(),
            supportingText = {
                if (!uiState.otpFieldError.isNullOrBlank()) {
                    Text(
                        text = uiState.otpFieldError,
                        color = MaterialTheme.colorScheme.error
                    )
                } else {
                    Text("Enter the 6-digit SMS code sent by Firebase Auth")
                }
            },
            singleLine = true,
            enabled = !uiState.isLoading,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.NumberPassword,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(
                onDone = { onVerifyOtpClick() }
            ),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("otp_code_input")
        )

        Button(
            onClick = onVerifyOtpClick,
            enabled = !uiState.isLoading && uiState.otpCode.length == 6,
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            ),
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp)
                .testTag("verify_otp_button")
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(22.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.5.dp
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = stringResource(R.string.verifying_otp_label),
                    style = MaterialTheme.typography.labelLarge
                )
            } else {
                Icon(
                    imageVector = Icons.Filled.CheckCircle,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = stringResource(R.string.verify_otp_button),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(
                onClick = onResendOtpClick,
                enabled = !uiState.isLoading && uiState.resendCooldownSeconds == 0,
                modifier = Modifier.testTag("resend_otp_button")
            ) {
                Icon(
                    imageVector = Icons.Filled.Refresh,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = if (uiState.resendCooldownSeconds > 0) {
                        "Resend OTP in ${uiState.resendCooldownSeconds}s"
                    } else {
                        stringResource(R.string.resend_otp_button)
                    }
                )
            }
        }
    }
}
