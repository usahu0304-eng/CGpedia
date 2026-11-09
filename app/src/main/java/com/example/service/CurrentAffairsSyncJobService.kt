package com.example.service

import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.util.Log
import com.example.data.ai.CgpediaAiService
import com.example.data.repository.CgpediaRepository
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * Scheduled Background Service (`JobService`) that automatically checks for
 * Bilingual Current Affairs across Chhattisgarh, India, and World every 3 hours
 * and triggers a device notification bar alert only when new updates arrive.
 */
class CurrentAffairsSyncJobService : JobService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onStartJob(params: JobParameters?): Boolean {
        val authorUid = Firebase.auth.currentUser?.uid ?: "system_auto_sync"

        serviceScope.launch {
            runCatching {
                val aiService = CgpediaAiService()
                val repository = CgpediaRepository(applicationContext)
                val grounded = aiService.fetchGroundedCurrentAffairs(authorUid).getOrNull()
                if (!grounded.isNullOrEmpty()) {
                    val savedCount = repository.saveCurrentAffairsBatch(grounded).getOrDefault(0)
                    if (savedCount > 0) {
                        val first = grounded.first()
                        CgpediaNotificationHelper.notifyNewCurrentAffairs(
                            context = applicationContext,
                            savedCount = savedCount,
                            topHeadlineHi = first.headlineHi,
                            topHeadlineEn = first.headlineEn
                        )
                    }
                    applicationContext.getSharedPreferences("cgpedia_sync_prefs", Context.MODE_PRIVATE)
                        .edit()
                        .putLong("last_ca_sync_epoch_ms", System.currentTimeMillis())
                        .apply()
                }
            }.onFailure { err ->
                Log.w("CurrentAffairsSyncJob", "Background Current Affairs sync skipped: ${err.message}")
            }
            jobFinished(params, false)
        }
        return true
    }

    override fun onStopJob(params: JobParameters?): Boolean {
        serviceScope.cancel()
        return true
    }

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }

    companion object {
        private const val JOB_ID_CURRENT_AFFAIRS_SYNC = 4401
        private const val THREE_HOURS_MS = 3L * 60L * 60L * 1000L // 3 hours auto-sync interval

        fun schedulePeriodicSync(context: Context) {
            runCatching {
                val scheduler = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as? JobScheduler ?: return
                val existing = scheduler.allPendingJobs.any { it.id == JOB_ID_CURRENT_AFFAIRS_SYNC }
                if (existing) return

                val component = ComponentName(context, CurrentAffairsSyncJobService::class.java)
                val jobInfo = JobInfo.Builder(JOB_ID_CURRENT_AFFAIRS_SYNC, component)
                    .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                    .setPeriodic(THREE_HOURS_MS)
                    .build()
                scheduler.schedule(jobInfo)
            }.onFailure { e ->
                Log.w("CurrentAffairsSyncJob", "Unable to schedule periodic job: ${e.message}")
            }
        }
    }
}
