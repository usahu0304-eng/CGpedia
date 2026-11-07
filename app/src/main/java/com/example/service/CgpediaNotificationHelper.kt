package com.example.service

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.example.MainActivity
import com.example.R

/**
 * Helper for posting native Android push/local notifications when new Current Affairs
 * or Admin Broadcast Notifications arrive.
 */
object CgpediaNotificationHelper {

    private const val CHANNEL_ID_CURRENT_AFFAIRS = "cgpedia_current_affairs_channel"
    private const val CHANNEL_ID_BROADCAST = "cgpedia_broadcast_channel"

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
            val caChannel = NotificationChannel(
                CHANNEL_ID_CURRENT_AFFAIRS,
                "CGpedia Current Affairs Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Hourly Chhattisgarh, National & International Current Affairs alerts"
            }
            val broadcastChannel = NotificationChannel(
                CHANNEL_ID_BROADCAST,
                "CGpedia Official Announcements",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Admin Broadcast Notifications & Upcoming Test Series schedules"
            }
            manager.createNotificationChannel(caChannel)
            manager.createNotificationChannel(broadcastChannel)
        }
    }

    fun canPostNotifications(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    fun notifyGenericAlert(
        context: Context,
        title: String,
        message: String,
        category: String,
        notificationKey: String
    ) {
        if (!canPostNotifications(context)) return
        runCatching {
            ensureChannels(context)
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val notifId = (notificationKey.ifBlank { title + message }.hashCode() and 0x7FFFFFFF).coerceAtLeast(3000)
            val pendingIntent = PendingIntent.getActivity(
                context,
                notifId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val channelId = if (category.equals("stories", ignoreCase = true) || category.equals("current_affairs", ignoreCase = true)) {
                CHANNEL_ID_CURRENT_AFFAIRS
            } else {
                CHANNEL_ID_BROADCAST
            }
            val cleanTitle = title.ifBlank { "CGpedia Update" }
            val cleanMsg = message.ifBlank { "Tap to view the latest update on CGpedia." }
            val notification = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(cleanTitle)
                .setContentText(cleanMsg)
                .setStyle(NotificationCompat.BigTextStyle().bigText("$cleanTitle\n$cleanMsg"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()

            NotificationManagerCompat.from(context).notify(notifId, notification)
        }
    }

    fun notifyNewCurrentAffairs(context: Context, savedCount: Int, topHeadlineHi: String, topHeadlineEn: String) {
        if (savedCount <= 0 || !canPostNotifications(context)) return
        runCatching {
            ensureChannels(context)
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                1001,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val notification = NotificationCompat.Builder(context, CHANNEL_ID_CURRENT_AFFAIRS)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("CGpedia • $savedCount नए समसामयिकी अपडेट (CGPSC & CGSSB)")
                .setContentText(topHeadlineHi.ifBlank { topHeadlineEn })
                .setStyle(
                    NotificationCompat.BigTextStyle()
                        .bigText("$topHeadlineHi\n$topHeadlineEn")
                )
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()

            NotificationManagerCompat.from(context).notify(2001, notification)
        }
    }

    fun notifyBroadcastMessage(context: Context, titleHi: String, titleEn: String, messageHi: String) {
        if (!canPostNotifications(context)) return
        runCatching {
            ensureChannels(context)
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                1002,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val notification = NotificationCompat.Builder(context, CHANNEL_ID_BROADCAST)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("CGpedia • ${titleHi.ifBlank { titleEn }}")
                .setContentText(messageHi.ifBlank { titleEn })
                .setStyle(NotificationCompat.BigTextStyle().bigText("$titleHi\n$messageHi"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()

            NotificationManagerCompat.from(context).notify(2002, notification)
        }
    }
}
