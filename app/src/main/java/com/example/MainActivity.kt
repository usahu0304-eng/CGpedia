package com.example

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Bundle
import android.os.ParcelFileDescriptor
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
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
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
    private val pdfUploadBuffers = ConcurrentHashMap<String, ByteArrayOutputStream>()
    private val pdfUploadFiles = ConcurrentHashMap<String, File>()
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
    fun initPdfUpload(): String {
        val uploadId = "pdf_" + UUID.randomUUID().toString().replace("-", "")
        pdfUploadBuffers[uploadId] = ByteArrayOutputStream()
        return uploadId
    }

    @JavascriptInterface
    fun appendPdfChunk(uploadId: String, base64Chunk: String): Boolean {
        return try {
            val buffer = pdfUploadBuffers[uploadId] ?: return false
            val clean = base64Chunk.substringAfter("base64,", base64Chunk).trim()
            if (clean.isNotEmpty()) {
                val bytes = Base64.decode(clean, Base64.DEFAULT)
                synchronized(buffer) {
                    buffer.write(bytes)
                }
            }
            true
        } catch (_: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun finalizePdfUpload(uploadId: String): Int {
        return try {
            val buffer = pdfUploadBuffers.remove(uploadId) ?: return 0
            val bytes = synchronized(buffer) { buffer.toByteArray() }
            if (bytes.isEmpty()) return 0
            val outFile = File(activity.cacheDir, "$uploadId.pdf")
            outFile.writeBytes(bytes)
            pdfUploadFiles[uploadId] = outFile
            ParcelFileDescriptor.open(outFile, ParcelFileDescriptor.MODE_READ_ONLY).use { pfd ->
                PdfRenderer(pfd).use { renderer ->
                    renderer.pageCount
                }
            }
        } catch (_: Exception) {
            0
        }
    }

    @JavascriptInterface
    fun cleanupPdfUpload(uploadId: String) {
        pdfUploadBuffers.remove(uploadId)
        pdfUploadFiles.remove(uploadId)?.let { file ->
            runCatching { file.delete() }
        }
    }

    @JavascriptInterface
    fun analyzePdfPagesWithAi(
        uploadId: String,
        startPageOneBased: Int,
        endPageOneBased: Int,
        promptText: String,
        callbackId: String
    ) {
        ioScope.launch {
            val bitmaps = mutableListOf<Bitmap>()
            try {
                val pdfFile = pdfUploadFiles[uploadId]
                    ?: File(activity.cacheDir, "$uploadId.pdf").takeIf { it.exists() }
                    ?: throw IllegalArgumentException("Uploaded PDF file not found")

                ParcelFileDescriptor.open(pdfFile, ParcelFileDescriptor.MODE_READ_ONLY).use { pfd ->
                    PdfRenderer(pfd).use { renderer ->
                        val total = renderer.pageCount
                        if (total <= 0) throw IllegalArgumentException("PDF has 0 pages")
                        val firstIdx = (startPageOneBased - 1).coerceIn(0, total - 1)
                        val lastIdx = (endPageOneBased - 1).coerceIn(firstIdx, total - 1)
                        for (pageIdx in firstIdx..lastIdx) {
                            renderer.openPage(pageIdx).use { page ->
                                val maxSide = maxOf(page.width, page.height, 1)
                                val scale = (1550f / maxSide.toFloat()).coerceIn(1.25f, 2.6f)
                                val bmpW = (page.width * scale).toInt().coerceAtLeast(1)
                                val bmpH = (page.height * scale).toInt().coerceAtLeast(1)
                                val bitmap = Bitmap.createBitmap(bmpW, bmpH, Bitmap.Config.ARGB_8888)
                                Canvas(bitmap).drawColor(Color.WHITE)
                                page.render(
                                    bitmap,
                                    null,
                                    null,
                                    PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY
                                )
                                bitmaps.add(bitmap)
                            }
                        }
                    }
                }

                val inputContent = content {
                    bitmaps.forEach { bmp -> image(bmp) }
                    text(promptText)
                }
                val jsonOut = generateWithModelFallback(inputContent, 90_000L)
                deliverResultToWeb(callbackId, true, jsonOut)
            } catch (e: Exception) {
                deliverResultToWeb(callbackId, false, e.message ?: "PDF Vision AI error")
            } finally {
                bitmaps.forEach { bmp ->
                    runCatching {
                        if (!bmp.isRecycled) bmp.recycle()
                    }
                }
            }
        }
    }

    @JavascriptInterface
    fun analyzeQuestionsWithAi(promptText: String, callbackId: String) {
        ioScope.launch {
            try {
                val inputContent = content {
                    text(promptText)
                }
                val jsonOut = generateWithModelFallback(inputContent, 75_000L)
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
                val inputContent = content {
                    image(bitmap)
                    text(promptText)
                }
                val jsonOut = generateWithModelFallback(inputContent, 75_000L)
                deliverResultToWeb(callbackId, true, jsonOut)
            } catch (e: Exception) {
                deliverResultToWeb(callbackId, false, e.message ?: "AI image scan error")
            }
        }
    }

    private suspend fun generateWithModelFallback(
        inputContent: com.google.firebase.ai.type.Content,
        timeoutMs: Long
    ): String {
        val candidateModels = listOf("gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash")
        var lastError: Exception? = null
        for (modelId in candidateModels) {
            try {
                val model = Firebase.ai.generativeModel(
                    modelName = modelId,
                    generationConfig = generationConfig {
                        responseMimeType = "application/json"
                        temperature = 0.1f
                    }
                )
                val response = withTimeout(timeoutMs) {
                    model.generateContent(inputContent)
                }
                val txt = response.text.orEmpty().trim()
                if (txt.isNotEmpty()) {
                    return txt
                }
            } catch (e: Exception) {
                lastError = e
            }
        }
        throw (lastError ?: IllegalStateException("All Gemini models failed"))
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
