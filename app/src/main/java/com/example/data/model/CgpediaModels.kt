package com.example.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.ServerTimestamp

const val OWNER_ADMIN_EMAIL = "usahu0304@gmail.com"
const val GLOBAL_CONFIG_DOC_ID = "global"

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String, val isAdminFixable: Boolean = false) : UiState<Nothing>
}

data class UserProfile(
    @DocumentId val id: String = "",
    val userId: String = "",
    val displayName: String = "",
    val email: String = "",
    val phoneNumber: String = "",
    val photoUrl: String = "",
    val targetExam: String = "CGPSC & CGSSB",
    val preferredLanguage: String = "en", // "en" (default UI) or "hi"
    val darkMode: Boolean = false,
    val notifyCurrentAffairs: Boolean = true,
    val notifyNewTests: Boolean = true,
    val role: String = "student", // "student" or "admin"
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class AppConfig(
    @DocumentId val id: String = GLOBAL_CONFIG_DOC_ID,
    val configKey: String = GLOBAL_CONFIG_DOC_ID,
    val anthemTitleHi: String = "सीजीपीडिया चैनल एंथम - जय जोहार छत्तीसगढ़",
    val anthemTitleEn: String = "CGpedia Official Channel Anthem",
    val anthemSourceType: String = "bundled", // "bundled", "url", "cloud_chunks"
    val anthemAudioUrl: String = "",
    val anthemChunkCount: Long = 0L,
    val anthemMimeType: String = "audio/wav",
    val telegramChannelUrl: String = "https://t.me/CGpediaOfficial",
    val supportEmail: String = OWNER_ADMIN_EMAIL,
    val whatsappSupportNumber: String = "9238810070",
    val supportPolicyHi: String = "भुगतान, टेस्ट सीरीज अनलॉक या तकनीकी सहायता के लिए कृपया हमारे आधिकारिक व्हाट्सएप नंबर 9238810070 पर संपर्क करें।",
    val supportPolicyEn: String = "For test series activation, payment receipts, or technical help, message our official WhatsApp support at 9238810070.",
    val latestVersionCode: Long = 2L,
    val latestVersionName: String = "2.0.0",
    val apkDownloadUrl: String = "https://ais-dev-vv2z3zjsjlbt4utl2wktpm-618149121535.asia-northeast1.run.app/CGpedia.apk",
    val updateNotesHi: String = "नया अपडेट उपलब्ध: सीजीपीएससी एवं सीजीएसएसबी टेस्ट सीरीज, इंस्टाग्राम स्टोरीज समसामयिकी (24 घंटे), लाइव नोटिफिकेशन हब और डाउट सपोर्ट।",
    val updateNotesEn: String = "New Update Available: CGPSC & CGSSB Test Series, 24h Instagram Stories Current Affairs, Broadcast Notification Hub & Private Query Support.",
    val updatedBy: String = "system",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class AnthemChunk(
    @DocumentId val id: String = "",
    val chunkIndex: Long = 0L,
    val totalChunks: Long = 1L,
    val base64Data: String = "",
    val updatedBy: String = "",
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class ExamFolder(
    @DocumentId val id: String = "",
    val titleHi: String = "",
    val titleEn: String = "",
    val descriptionHi: String = "",
    val descriptionEn: String = "",
    val examCode: String = "",
    val sortOrder: Long = 0L,
    val isFreeFolder: Boolean = true,
    val priceInr: Long = 0L,
    val validityDays: Long = 180L,
    val testCount: Long = 0L,
    val visibility: String = "published",
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class SubjectFolder(
    @DocumentId val id: String = "",
    val titleHi: String = "",
    val titleEn: String = "",
    val descriptionHi: String = "",
    val descriptionEn: String = "",
    val subjectCode: String = "",
    val sortOrder: Long = 0L,
    val isFreeFolder: Boolean = true,
    val priceInr: Long = 0L,
    val validityDays: Long = 180L,
    val testCount: Long = 0L,
    val visibility: String = "published",
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class TestSeriesItem(
    @DocumentId val id: String = "",
    val folderType: String = "exam", // "exam" or "subject"
    val folderId: String = "",
    val titleHi: String = "",
    val titleEn: String = "",
    val topic: String = "",
    val difficulty: String = "CGPSC_Level", // "Easy", "Moderate", "Hard", "CGPSC_Level"
    val durationMinutes: Long = 30L,
    val questionLimit: Long = 10L,
    val questionCount: Long = 0L,
    val marksPerQuestion: Double = 2.0,
    val negativeMarking: Double = 0.66,
    val isPaid: Boolean = false,
    val priceInr: Long = 0L,
    val validityDays: Long = 180L,
    val status: String = "draft", // "draft", "published", "archived"
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class BilingualQuestion(
    @DocumentId val id: String = "",
    val testId: String = "",
    val orderIndex: Long = 0L,
    val questionHi: String = "",
    val questionEn: String = "",
    val optionsHi: List<String> = listOf("", "", "", ""),
    val optionsEn: List<String> = listOf("", "", "", ""),
    val correctOptionIndex: Long = 0L,
    val explanationHi: String = "",
    val explanationEn: String = "",
    val subjectTag: String = "General Studies",
    val visibility: String = "draft", // "draft" or "published"
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class CurrentAffairItem(
    @DocumentId val id: String = "",
    val category: String = "chhattisgarh", // "chhattisgarh", "national", "international"
    val headlineHi: String = "",
    val headlineEn: String = "",
    val summaryHi: String = "",
    val summaryEn: String = "",
    val examKeyPointsHi: List<String> = emptyList(),
    val examKeyPointsEn: List<String> = emptyList(),
    val sourceName: String = "PIB / DPR Chhattisgarh",
    val sourceUrl: String = "https://dprcg.gov.in",
    val dateLabel: String = "",
    val visibility: String = "published",
    val sourceModule: String = "ai_grounded", // "ai_grounded" or "admin_curated"
    val authorUid: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class BroadcastNotification(
    @DocumentId val id: String = "",
    val titleHi: String = "",
    val titleEn: String = "",
    val messageHi: String = "",
    val messageEn: String = "",
    val mediaType: String = "none", // "none", "image", "pdf", "audio", "video"
    val mediaUrl: String = "",
    val mediaTitle: String = "",
    val isPinned: Boolean = false,
    val visibility: String = "published", // "published" or "archived"
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class UpcomingTestItem(
    @DocumentId val id: String = "",
    val titleHi: String = "",
    val titleEn: String = "",
    val examCategory: String = "CGPSC & CGSSB",
    val scheduledDateLabel: String = "",
    val syllabusSummaryHi: String = "",
    val syllabusSummaryEn: String = "",
    val isPaid: Boolean = true,
    val priceInr: Long = 99L,
    val validityDays: Long = 180L,
    val visibility: String = "published", // "published" or "archived"
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class StudentQuery(
    @DocumentId val id: String = "",
    val userId: String = "",
    val studentName: String = "",
    val studentEmail: String = "",
    val category: String = "doubt", // "doubt", "payment", "technical"
    val subject: String = "",
    val message: String = "",
    val adminReply: String = "",
    val status: String = "open", // "open" or "resolved"
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class TestAttempt(
    @DocumentId val id: String = "",
    val userId: String = "",
    val testId: String = "",
    val testTitleHi: String = "",
    val testTitleEn: String = "",
    val totalQuestions: Long = 0L,
    val attemptedCount: Long = 0L,
    val correctCount: Long = 0L,
    val incorrectCount: Long = 0L,
    val score: Double = 0.0,
    val maxScore: Double = 0.0,
    val accuracyPercent: Long = 0L,
    val timeTakenSeconds: Long = 0L,
    val selectedAnswers: Map<String, Long> = emptyMap(),
    val status: String = "submitted",
    @ServerTimestamp val createdAt: Timestamp? = null
)

data class PurchaseRecord(
    @DocumentId val id: String = "",
    val userId: String = "",
    val testId: String = "",
    val testTitleHi: String = "",
    val testTitleEn: String = "",
    val amountInr: Long = 0L,
    val paymentMethod: String = "UPI",
    val transactionRef: String = "",
    val status: String = "completed",
    val validityDays: Long = 180L,
    val expiresAtMillis: Long = 0L,
    @ServerTimestamp val createdAt: Timestamp? = null
)

data class BookmarkedQuestion(
    @DocumentId val id: String = "",
    val userId: String = "",
    val questionId: String = "",
    val testId: String = "",
    val questionHi: String = "",
    val questionEn: String = "",
    val optionsHi: List<String> = listOf("", "", "", ""),
    val optionsEn: List<String> = listOf("", "", "", ""),
    val correctOptionIndex: Long = 0L,
    val explanationHi: String = "",
    val explanationEn: String = "",
    val subjectTag: String = "General Studies",
    @ServerTimestamp val createdAt: Timestamp? = null
)

/**
 * Activation-based validity helpers for [PurchaseRecord]:
 * Countdown starts strictly from the activation/purchase timestamp (`createdAt`) for `validityDays`.
 * Once expired (`nowMillis > effectiveExpiryMillis()`), paid access is automatically revoked.
 */
fun PurchaseRecord.effectiveExpiryMillis(): Long {
    if (expiresAtMillis > 0L) return expiresAtMillis
    val activatedMillis = (createdAt?.seconds ?: 0L) * 1000L
    val validDays = validityDays.coerceAtLeast(1L)
    return if (activatedMillis > 0L) {
        activatedMillis + (validDays * 86_400_000L)
    } else {
        Long.MAX_VALUE
    }
}

fun PurchaseRecord.isSubscriptionExpired(nowMillis: Long = System.currentTimeMillis()): Boolean {
    val expiry = effectiveExpiryMillis()
    return expiry != Long.MAX_VALUE && nowMillis > expiry
}

fun PurchaseRecord.remainingValidityDays(nowMillis: Long = System.currentTimeMillis()): Long {
    val expiry = effectiveExpiryMillis()
    if (expiry == Long.MAX_VALUE) return validityDays.coerceAtLeast(1L)
    val diff = expiry - nowMillis
    return if (diff <= 0L) 0L else (diff + 86_399_999L) / 86_400_000L
}

/**
 * 24-Hour Expiry Rule for Current Affairs Stories:
 * Stories remain visible in the top Instagram-style Stories bar for 24 hours from `createdAt`.
 */
fun CurrentAffairItem.isWithin24Hours(nowMillis: Long = System.currentTimeMillis()): Boolean {
    val postedMillis = (createdAt?.seconds ?: 0L) * 1000L
    if (postedMillis <= 0L) return true // Freshly created local/starter item before server timestamp resolves
    val ageMillis = nowMillis - postedMillis
    return ageMillis <= 24L * 60L * 60L * 1000L
}
