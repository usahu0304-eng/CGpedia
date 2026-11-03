package com.example.service

import android.content.Context

/**
 * Compatibility helper for posting hourly Current Affairs push notifications.
 * Delegates to [CgpediaNotificationHelper] so both background JobService and ViewModel
 * sync paths share the same notification channel configuration.
 */
object CurrentAffairsNotificationHelper {

    fun ensureChannel(context: Context) {
        CgpediaNotificationHelper.ensureChannels(context)
    }

    fun notifyNewCurrentAffairs(
        context: Context,
        savedCount: Int,
        topHeadlineHi: String = "छत्तीसगढ़ एवं राष्ट्रीय समसामयिकी के नए अपडेट उपलब्ध हैं।",
        topHeadlineEn: String = "New Chhattisgarh & National Current Affairs updates are live."
    ) {
        CgpediaNotificationHelper.notifyNewCurrentAffairs(
            context = context,
            savedCount = savedCount,
            topHeadlineHi = topHeadlineHi,
            topHeadlineEn = topHeadlineEn
        )
    }
}
