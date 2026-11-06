package com.example

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBars
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView
import com.example.security.configureAppCheck
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.content
import com.google.firebase.ai.type.generationConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import org.json.JSONObject

class MainActivity : ComponentActivity() {

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        fileUploadCallback?.onReceiveValue(uris.toTypedArray())
        fileUploadCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configureAppCheck(this, intent)
        enableEdgeToEdge()
        // Default exam security flag; dynamically controlled via AndroidBridge.setSecureScreen(...)
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
        setContent {
            CgpediaWebAppHost(
                activity = this,
                onLaunchFilePicker = { rawMimeType ->
                    val cleaned = rawMimeType.trim()
                    val safeMime = if (
                        cleaned.isBlank() ||
                        cleaned.contains(",") ||
                        cleaned.startsWith(".") ||
                        !cleaned.contains("/")
                    ) {
                        "*/*"
                    } else {
                        cleaned
                    }
                    runCatching {
                        filePickerLauncher.launch(safeMime)
                    }.onFailure {
                        runCatching {
                            filePickerLauncher.launch("*/*")
                        }.onFailure {
                            fileUploadCallback?.onReceiveValue(null)
                            fileUploadCallback = null
                        }
                    }
                },
                onSetUploadCallback = { callback ->
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = callback
                }
            )
        }
    }
}

class CgpediaAndroidBridge(private val activity: Activity) {
    private val ioScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    var webViewRef: WebView? = null

    @JavascriptInterface
    fun setSecureScreen(enabled: Boolean) {
        activity.runOnUiThread {
            if (enabled) {
                activity.window.setFlags(
                    WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE
                )
            } else {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
            }
        }
    }

    @JavascriptInterface
    fun analyzeQuestionsWithAi(promptText: String, callbackId: String) {
        ioScope.launch {
            try {
                val model = Firebase.ai.generativeModel(
                    modelName = "gemini-3.8-flash",
                    generationConfig = generationConfig {
                        responseMimeType = "application/json"
                        temperature = 0.15f
                    }
                )
                val response = withTimeout(60_000L) {
                    model.generateContent(promptText)
                }
                val jsonOut = response.text.orEmpty()
                deliverResultToWeb(callbackId, true, jsonOut)
            } catch (e: Exception) {
                deliverResultToWeb(callbackId, false, e.message ?: "AI scan error")
            }
        }
    }

    @JavascriptInterface
    fun analyzeQuestionImageWithAi(base64DataUrl: String, promptText: String, callbackId: String) {
        ioScope.launch {
            try {
                val cleanBase64 = base64DataUrl.substringAfter("base64,", base64DataUrl)
                val bytes = Base64.decode(cleanBase64, Base64.DEFAULT)
                val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                    ?: throw IllegalArgumentException("Could not decode image bytes")
                val model = Firebase.ai.generativeModel(
                    modelName = "gemini-3.8-flash",
                    generationConfig = generationConfig {
                        responseMimeType = "application/json"
                        temperature = 0.15f
                    }
                )
                val inputContent = content {
                    image(bitmap)
                    text(promptText)
                }
                val response = withTimeout(60_000L) {
                    model.generateContent(inputContent)
                }
                val jsonOut = response.text.orEmpty()
                deliverResultToWeb(callbackId, true, jsonOut)
            } catch (e: Exception) {
                deliverResultToWeb(callbackId, false, e.message ?: "AI image scan error")
            }
        }
    }

    private fun deliverResultToWeb(callbackId: String, ok: Boolean, payload: String) {
        val safeId = JSONObject.quote(callbackId)
        val safePayload = JSONObject.quote(payload)
        val js = "if(window.__onAiQuestionScanResult){window.__onAiQuestionScanResult($safeId,$ok,$safePayload);}"
        activity.runOnUiThread {
            webViewRef?.evaluateJavascript(js, null)
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun CgpediaWebAppHost(
    activity: Activity,
    onLaunchFilePicker: (String) -> Unit,
    onSetUploadCallback: (ValueCallback<Array<Uri>>?) -> Unit
) {
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    BackHandler(enabled = webViewRef?.canGoBack() == true) {
        webViewRef?.goBack()
    }

    Scaffold(
        contentWindowInsets = WindowInsets.systemBars,
        modifier = Modifier.fillMaxSize()
    ) { innerPadding ->
        AndroidView(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("cgpedia_pwa_webview"),
            factory = { context ->
                val bridge = CgpediaAndroidBridge(activity)
                WebView(context).apply {
                    bridge.webViewRef = this
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        databaseEnabled = true
                        allowFileAccess = true
                        allowContentAccess = true
                        allowFileAccessFromFileURLs = true
                        allowUniversalAccessFromFileURLs = true
                        mediaPlaybackRequiresUserGesture = false
                        cacheMode = WebSettings.LOAD_NO_CACHE
                    }

                    addJavascriptInterface(bridge, "AndroidBridge")

                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(
                            view: WebView?,
                            request: WebResourceRequest?
                        ): Boolean {
                            val url = request?.url?.toString().orEmpty()
                            if (url.startsWith("https://wa.me/") ||
                                url.startsWith("whatsapp://") ||
                                url.startsWith("upi://") ||
                                url.startsWith("mailto:") ||
                                url.startsWith("tel:")
                            ) {
                                runCatching {
                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                }
                                return true
                            }
                            return false
                        }
                    }

                    webChromeClient = object : WebChromeClient() {
                        override fun onShowFileChooser(
                            webView: WebView?,
                            filePathCallback: ValueCallback<Array<Uri>>?,
                            fileChooserParams: FileChooserParams?
                        ): Boolean {
                            onSetUploadCallback(filePathCallback)
                            val nonBlankTypes = fileChooserParams?.acceptTypes
                                ?.flatMap { it.split(",") }
                                ?.map { it.trim() }
                                ?.filter { it.isNotBlank() }
                                .orEmpty()
                            val resolvedMime = when {
                                nonBlankTypes.isEmpty() -> "*/*"
                                nonBlankTypes.size == 1 &&
                                    nonBlankTypes[0].contains("/") &&
                                    !nonBlankTypes[0].startsWith(".") -> nonBlankTypes[0]
                                nonBlankTypes.all { it.startsWith("image/") } -> "image/*"
                                nonBlankTypes.all { it.startsWith("audio/") || it == ".mp3" || it == ".wav" || it == ".m4a" } -> "audio/*"
                                else -> "*/*"
                            }
                            onLaunchFilePicker(resolvedMime)
                            return true
                        }
                    }

                    clearCache(true)
                    loadUrl("file:///android_asset/index.html")
                    webViewRef = this
                }
            }
        )
    }
}
