package com.example.ui.viewmodel

import android.app.Activity
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.Firebase
import com.google.firebase.FirebaseException
import com.google.firebase.FirebaseTooManyRequestsException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthMissingActivityForRecaptchaException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.auth.auth
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

private const val TAG = "PhoneAuthViewModel"

enum class PhoneAuthStep {
    ENTER_PHONE,
    VERIFY_OTP
}

data class PhoneAuthUiState(
    val countryCode: String = "+91",
    val phoneNumberInput: String = "",
    val formattedE164: String = "",
    val otpCode: String = "",
    val step: PhoneAuthStep = PhoneAuthStep.ENTER_PHONE,
    val isLoading: Boolean = false,
    val verificationId: String? = null,
    val resendCooldownSeconds: Int = 0,
    val phoneFieldError: String? = null,
    val otpFieldError: String? = null,
    val statusBannerError: String? = null,
    val isOperationNotAllowed: Boolean = false,
    val isWebVerificationCanceled: Boolean = false,
    val infoMessage: String? = null,
    val isAuthenticated: Boolean = false
)

class PhoneAuthViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(PhoneAuthUiState())
    val uiState: StateFlow<PhoneAuthUiState> = _uiState.asStateFlow()

    private var resendToken: PhoneAuthProvider.ForceResendingToken? = null
    private var cooldownJob: Job? = null

    fun onCountryCodeChanged(newCode: String) {
        val cleaned = buildString {
            val trimmed = newCode.trim()
            if (trimmed.isNotEmpty() && !trimmed.startsWith("+")) append("+")
            trimmed.forEachIndexed { idx, ch ->
                if ((idx == 0 && ch == '+') || ch.isDigit()) append(ch)
            }
        }.take(5)

        _uiState.update { current ->
            val updatedCode = cleaned.ifBlank { "+" }
            current.copy(
                countryCode = updatedCode,
                formattedE164 = normalizeToE164(updatedCode, current.phoneNumberInput),
                phoneFieldError = null,
                statusBannerError = null
            )
        }
    }

    fun onPhoneNumberChanged(newInput: String) {
        // Allow pasted E.164 numbers (+91 9876543210) or local 10-digit numbers without truncating digits prematurely
        val sanitized = newInput.filter { it.isDigit() || it == '+' || it == ' ' || it == '-' }.take(18)
        _uiState.update { current ->
            current.copy(
                phoneNumberInput = sanitized,
                formattedE164 = normalizeToE164(current.countryCode, sanitized),
                phoneFieldError = null,
                statusBannerError = null
            )
        }
    }

    fun applyPresetPhoneNumber(countryCode: String, tenDigitNumber: String) {
        _uiState.update { current ->
            current.copy(
                countryCode = countryCode,
                phoneNumberInput = tenDigitNumber,
                formattedE164 = normalizeToE164(countryCode, tenDigitNumber),
                phoneFieldError = null,
                statusBannerError = null
            )
        }
    }

    fun onOtpCodeChanged(newOtp: String) {
        val digits = newOtp.filter(Char::isDigit).take(6)
        _uiState.update { current ->
            current.copy(
                otpCode = digits,
                otpFieldError = null,
                statusBannerError = null
            )
        }
    }

    fun returnToPhoneEntry() {
        cooldownJob?.cancel()
        _uiState.update { current ->
            current.copy(
                step = PhoneAuthStep.ENTER_PHONE,
                otpCode = "",
                isLoading = false,
                otpFieldError = null,
                statusBannerError = null,
                infoMessage = null
            )
        }
    }

    fun requestOtp(activity: Activity?, isResend: Boolean = false) {
        val snapshot = _uiState.value
        val e164 = normalizeToE164(snapshot.countryCode, snapshot.phoneNumberInput)

        if (!isValidE164Phone(e164)) {
            _uiState.update {
                it.copy(
                    phoneFieldError = "Enter a valid mobile number (e.g., 10-digit mobile number with +91)."
                )
            }
            return
        }

        if (activity == null) {
            _uiState.update {
                it.copy(
                    statusBannerError = "Unable to start Firebase Phone verification: host Activity not available."
                )
            }
            return
        }

        _uiState.update {
            it.copy(
                formattedE164 = e164,
                isLoading = true,
                phoneFieldError = null,
                statusBannerError = null,
                infoMessage = null
            )
        }

        val firebaseAuth = Firebase.auth
        firebaseAuth.useAppLanguage()

        val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
            override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                Log.d(TAG, "Instant SMS auto-verification completed for $e164")
                val smsCode = credential.smsCode
                if (!smsCode.isNullOrBlank()) {
                    _uiState.update { it.copy(otpCode = smsCode) }
                }
                signInWithPhoneCredential(credential)
            }

            override fun onVerificationFailed(exception: FirebaseException) {
                Log.e(
                    TAG,
                    "Firebase PhoneAuth failed (${exception.javaClass.simpleName}): ${exception.message}",
                    exception
                )
                val raw = exception.localizedMessage.orEmpty()
                val isNotAllowed = raw.contains("not allowed", ignoreCase = true) ||
                    raw.contains("disabled", ignoreCase = true) ||
                    raw.contains("17006")
                val isCanceled = raw.contains("canceled by the user", ignoreCase = true) ||
                    raw.contains("cancelled by user", ignoreCase = true)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        statusBannerError = mapFirebasePhoneError(exception, e164),
                        isOperationNotAllowed = isNotAllowed,
                        isWebVerificationCanceled = isCanceled
                    )
                }
            }

            override fun onCodeSent(
                verId: String,
                token: PhoneAuthProvider.ForceResendingToken
            ) {
                Log.d(TAG, "OTP sent successfully to $e164")
                resendToken = token
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        step = PhoneAuthStep.VERIFY_OTP,
                        verificationId = verId,
                        otpCode = "",
                        statusBannerError = null,
                        isOperationNotAllowed = false,
                        isWebVerificationCanceled = false,
                        infoMessage = "6-digit OTP sent to $e164"
                    )
                }
                startResendCooldown(30)
            }

            override fun onCodeAutoRetrievalTimeOut(verId: String) {
                Log.d(TAG, "SMS auto-retrieval timed out for verificationId=$verId")
                _uiState.update { current ->
                    current.copy(verificationId = verId)
                }
            }
        }

        val optionsBuilder = PhoneAuthOptions.newBuilder(firebaseAuth)
            .setPhoneNumber(e164)
            .setTimeout(60L, TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(callbacks)

        if (isResend && resendToken != null) {
            optionsBuilder.setForceResendingToken(resendToken!!)
        }

        PhoneAuthProvider.verifyPhoneNumber(optionsBuilder.build())
    }

    fun verifyOtp() {
        val current = _uiState.value
        val code = current.otpCode.trim()
        if (code.length != 6) {
            _uiState.update {
                it.copy(otpFieldError = "Please enter the complete 6-digit OTP code.")
            }
            return
        }
        val verId = current.verificationId
        if (verId.isNullOrBlank()) {
            _uiState.update {
                it.copy(statusBannerError = "Verification session expired. Please request a new OTP.")
            }
            return
        }

        val credential = PhoneAuthProvider.getCredential(verId, code)
        signInWithPhoneCredential(credential)
    }

    private fun signInWithPhoneCredential(credential: PhoneAuthCredential) {
        _uiState.update {
            it.copy(
                isLoading = true,
                otpFieldError = null,
                statusBannerError = null
            )
        }
        viewModelScope.launch {
            try {
                Firebase.auth.signInWithCredential(credential).await()
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        isAuthenticated = true
                    )
                }
            } catch (e: FirebaseAuthInvalidCredentialsException) {
                Log.w(TAG, "Invalid OTP entered", e)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        otpFieldError = "Incorrect or expired OTP code. Please double-check the 6 digits."
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "signInWithCredential failed", e)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        statusBannerError = e.localizedMessage ?: "OTP verification failed. Please try again."
                    )
                }
            }
        }
    }

    private fun startResendCooldown(seconds: Int) {
        cooldownJob?.cancel()
        cooldownJob = viewModelScope.launch {
            for (remaining in seconds downTo 0) {
                _uiState.update { it.copy(resendCooldownSeconds = remaining) }
                if (remaining > 0) delay(1000L)
            }
        }
    }

    companion object {
        private val E164_REGEX = Regex("^\\+[1-9]\\d{9,14}$")

        fun normalizeToE164(countryCode: String, rawInput: String): String {
            val trimmed = rawInput.trim()
            if (trimmed.isEmpty()) return ""

            if (trimmed.startsWith("+")) {
                return "+" + trimmed.drop(1).filter(Char::isDigit)
            }

            val cleanDialCode = "+" + countryCode.filter(Char::isDigit).ifEmpty { "91" }
            var digits = trimmed.filter(Char::isDigit)
            if (digits.isEmpty()) return ""

            // Strip Trunk Prefix '0' (e.g. 09876543210 -> 9876543210)
            if (digits.length == 11 && digits.startsWith("0")) {
                digits = digits.drop(1)
            }
            // Prevent duplicate +9191... if user typed 919876543210 without '+'
            val dialDigits = cleanDialCode.drop(1)
            if (dialDigits == "91" && digits.length == 12 && digits.startsWith("91")) {
                digits = digits.drop(2)
            }

            return "$cleanDialCode$digits"
        }

        fun isValidE164Phone(e164: String): Boolean {
            if (!E164_REGEX.matches(e164)) return false
            // Enforce exact 10 subscriber digits when country code is +91
            if (e164.startsWith("+91")) {
                return e164.length == 13
            }
            return true
        }

        private fun mapFirebasePhoneError(e: FirebaseException, e164: String): String {
            val raw = e.localizedMessage.orEmpty()
            return buildString {
                when {
                    raw.contains("not allowed", ignoreCase = true) ||
                        raw.contains("disabled", ignoreCase = true) ||
                        raw.contains("17006") -> {
                        append(
                            "Firebase Console Action Required (Status 17006):\n'Phone' sign-in provider is disabled in project 'cgpedia-2bd5c'.\n\n1. Open Firebase Console -> Authentication -> Sign-in method -> Phone.\n2. Turn ON the 'Enable' toggle.\n3. CRITICAL: Click the blue 'Save' button at the bottom of the dialog!\n\nAlternatively, use 'Continue with Google Account' below for 1-tap instant sign-in."
                        )
                    }
                    raw.contains("canceled by the user", ignoreCase = true) ||
                        raw.contains("cancelled by user", ignoreCase = true) -> {
                        append(
                            "Device Security Verification (reCAPTCHA) was closed or canceled. Please complete the browser verification prompt when it appears, or use 'Continue with Google Account' below."
                        )
                    }
                    e is FirebaseAuthMissingActivityForRecaptchaException -> {
                        append("reCAPTCHA verification requires an active foreground Activity. Please try again.")
                    }
                    raw.contains("BILLING", ignoreCase = true) ||
                        raw.contains("Spark plan", ignoreCase = true) ||
                        raw.contains("quota", ignoreCase = true) -> {
                        append(
                            "Firebase Spark Plan Limit: Live carrier SMS requires upgrading cgpedia-2bd5c to the Blaze plan, OR adding a Test Phone Number (+91 9999999999 / code 123456) in Firebase Console -> Authentication -> Sign-in method -> Phone."
                        )
                    }
                    raw.contains("unusual activity", ignoreCase = true) ||
                        raw.contains("BLOCKED", ignoreCase = true) -> {
                        append(
                            "Device/emulator SMS check blocked carrier dispatch. Add a Test Phone Number (+91 9999999999 / 123456) in Firebase Console or continue with Google Sign-In below."
                        )
                    }
                    e is FirebaseAuthInvalidCredentialsException -> {
                        append("Invalid mobile number format ($e164). Please enter a valid 10-digit mobile number.")
                    }
                    e is FirebaseTooManyRequestsException -> {
                        append("Too many OTP requests for $e164. Please wait a few minutes or sign in with Google.")
                    }
                    else -> {
                        append(raw.ifBlank { "Could not send OTP right now. Check network or Firebase Phone Auth configuration." })
                    }
                }
                append("\n[${e.javaClass.simpleName}]")
            }
        }
    }
}
