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
 * Automated Background Cron JobService (scheduled every 6 hours via Android JobScheduler)
 * EXCLUSIVELY for Current Affairs using Gemini AI with Google Search Grounding.
 * Test Series generation is strictly manual and restricted to the Owner Admin.
 */
class CurrentAffairsSyncJobService : JobService() {

    private val jobScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onStartJob(params: JobParameters?): Boolean {
        val currentUser = Firebase.auth.currentUser
        if (currentUser == null) {
            jobFinished(params, false)
            return false
        }

        jobScope.launch {
            try {
                Log.d(TAG, "Starting scheduled AI Grounded Current Affairs sync...")
                val aiService = CgpediaAiService()
                val repository = CgpediaRepository(applicationContext)
                val result = aiService.fetchGroundedCurrentAffairs(currentUser.uid)
                result.onSuccess { articles ->
                    repository.saveGroundedCurrentAffairsBatch(articles)
                    Log.d(TAG, "Saved ${articles.size} grounded Current Affairs articles.")
                }.onFailure { err ->
                    Log.w(TAG, "Scheduled Current Affairs sync failed: ${err.message}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected error in CurrentAffairsSyncJobService", e)
            } finally {
                jobFinished(params, false)
            }
        }
        return true
    }

    override fun onStopJob(params: JobParameters?): Boolean {
        jobScope.cancel()
        return true
    }

    override fun onDestroy() {
        jobScope.cancel()
        super.onDestroy()
    }

    companion object {
        private const val TAG = "CurrentAffairsCron"
        private const val JOB_ID = 4201
        private const val SIX_HOURS_MS = 6L * 60L * 60L * 1000L

        fun schedulePeriodicSync(context: Context) {
            val scheduler = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as? JobScheduler ?: return
            val alreadyScheduled = scheduler.allPendingJobs.any { it.id == JOB_ID }
            if (alreadyScheduled) return

            val component = ComponentName(context, CurrentAffairsSyncJobService::class.java)
            val jobInfo = JobInfo.Builder(JOB_ID, component)
                .setPeriodic(SIX_HOURS_MS)
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .build()
            scheduler.schedule(jobInfo)
        }
    }
}
