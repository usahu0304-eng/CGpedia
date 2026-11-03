package com.example.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.util.Log
import com.example.R
import com.example.data.model.AppConfig
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class AnthemPlaybackState(
    val isPlaying: Boolean = false,
    val isBuffering: Boolean = false,
    val progressFraction: Float = 0f,
    val positionSeconds: Int = 0,
    val durationSeconds: Int = 0,
    val errorMsg: String? = null
)

class AnthemPlayerController(
    private val appContext: Context,
    private val scope: CoroutineScope
) {
    private var mediaPlayer: MediaPlayer? = null
    private var tickerJob: Job? = null
    private var activeSourceKey: String? = null

    private val _state = MutableStateFlow(AnthemPlaybackState())
    val state: StateFlow<AnthemPlaybackState> = _state.asStateFlow()

    fun togglePlayPause(
        config: AppConfig,
        fetchCloudChunks: suspend () -> Result<ByteArray>
    ) {
        val currentMp = mediaPlayer
        val desiredSourceKey = "${config.anthemSourceType}|${config.anthemAudioUrl}|${config.anthemChunkCount}|${config.updatedAt?.seconds ?: 0L}"

        if (currentMp != null && activeSourceKey == desiredSourceKey) {
            if (currentMp.isPlaying) {
                currentMp.pause()
                stopTicker()
                _state.value = _state.value.copy(isPlaying = false)
            } else {
                currentMp.start()
                startTicker()
                _state.value = _state.value.copy(isPlaying = true, errorMsg = null)
            }
            return
        }

        // Prepare fresh MediaPlayer for current config
        releasePlayerOnly()
        if (config.anthemSourceType == "none") {
            _state.value = AnthemPlaybackState(errorMsg = "Anthem currently disabled by Admin")
            return
        }

        _state.value = _state.value.copy(isBuffering = true, errorMsg = null)
        scope.launch(Dispatchers.IO) {
            try {
                val mp = when (config.anthemSourceType) {
                    "url" -> {
                        require(config.anthemAudioUrl.startsWith("http")) { "Invalid Anthem audio URL" }
                        MediaPlayer().apply {
                            setAudioAttributes(
                                AudioAttributes.Builder()
                                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                                    .setUsage(AudioAttributes.USAGE_MEDIA)
                                    .build()
                            )
                            setDataSource(config.anthemAudioUrl)
                            prepare()
                        }
                    }
                    "cloud_chunks" -> {
                        val bytes = fetchCloudChunks().getOrThrow()
                        val ext = if (config.anthemMimeType.contains("aac")) "aac" else "mp3"
                        val cacheFile = File(appContext.cacheDir, "cgpedia_cloud_anthem.$ext")
                        cacheFile.writeBytes(bytes)
                        MediaPlayer().apply {
                            setAudioAttributes(
                                AudioAttributes.Builder()
                                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                                    .setUsage(AudioAttributes.USAGE_MEDIA)
                                    .build()
                            )
                            setDataSource(cacheFile.absolutePath)
                            prepare()
                        }
                    }
                    else -> {
                        // Bundled official CGpedia anthem WAV
                        MediaPlayer.create(appContext, R.raw.cgpedia_anthem)
                            ?: throw IllegalStateException("Bundled CGpedia anthem resource missing")
                    }
                }

                mp.isLooping = false
                mp.setOnCompletionListener {
                    stopTicker()
                    _state.value = _state.value.copy(
                        isPlaying = false,
                        progressFraction = 0f,
                        positionSeconds = 0
                    )
                }

                mediaPlayer = mp
                activeSourceKey = desiredSourceKey
                val durSec = (mp.duration.coerceAtLeast(1000)) / 1000
                mp.start()
                _state.value = AnthemPlaybackState(
                    isPlaying = true,
                    isBuffering = false,
                    progressFraction = 0f,
                    positionSeconds = 0,
                    durationSeconds = durSec
                )
                startTicker()
            } catch (e: Exception) {
                Log.e("AnthemPlayer", "Failed to play CGpedia anthem", e)
                _state.value = AnthemPlaybackState(
                    isPlaying = false,
                    isBuffering = false,
                    errorMsg = e.localizedMessage ?: "Unable to play anthem"
                )
            }
        }
    }

    fun stopAndReset() {
        releasePlayerOnly()
        _state.value = AnthemPlaybackState()
    }

    private fun startTicker() {
        tickerJob?.cancel()
        tickerJob = scope.launch(Dispatchers.Main) {
            while (isActive) {
                val mp = mediaPlayer
                if (mp != null && mp.isPlaying) {
                    val dur = mp.duration.coerceAtLeast(1)
                    val pos = mp.currentPosition.coerceAtLeast(0)
                    _state.value = _state.value.copy(
                        isPlaying = true,
                        progressFraction = (pos.toFloat() / dur.toFloat()).coerceIn(0f, 1f),
                        positionSeconds = pos / 1000,
                        durationSeconds = dur / 1000
                    )
                }
                delay(300L)
            }
        }
    }

    private fun stopTicker() {
        tickerJob?.cancel()
        tickerJob = null
    }

    private fun releasePlayerOnly() {
        stopTicker()
        try {
            mediaPlayer?.stop()
        } catch (_: Exception) {
        }
        try {
            mediaPlayer?.release()
        } catch (_: Exception) {
        }
        mediaPlayer = null
        activeSourceKey = null
    }

    fun release() {
        releasePlayerOnly()
    }
}
