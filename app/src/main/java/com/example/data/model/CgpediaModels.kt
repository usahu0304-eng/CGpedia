package com.example.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp

@IgnoreExtraProperties
data class UserProfile(
    @DocumentId val id: String = "",
    val userId: String = "",
    val displayName: String = "",
    val email: String = "",
    val phoneNumber: String = "",
    val photoUrl: String = "",
    val targetExam: String = "CGPSC & CGSSB",
    val preferredLanguage: String = "en",
    val darkMode: Boolean = false,
    val notifyCurrentAffairs: Boolean = true,
    val notifyNewTests: Boolean = true,
    val role: String = "student",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "userId" to userId,
        "displayName" to displayName.ifBlank { "CGpedia Aspirant" }.take(80),
        "email" to email.take(120),
        "phoneNumber" to phoneNumber.take(20),
        "photoUrl" to photoUrl.take(500),
        "targetExam" to targetExam,
        "preferredLanguage" to preferredLanguage,
        "darkMode" to darkMode,
        "notifyCurrentAffairs" to notifyCurrentAffairs,
        "notifyNewTests" to notifyNewTests,
        "role" to role,
        "createdAt" to FieldValue.serverTimestamp(),
        "updatedAt" to FieldValue.serverTimestamp()
    )
}

@IgnoreExtraProperties
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
    @ServerTimestamp val createdAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "userId" to userId,
        "testId" to testId,
        "testTitleHi" to testTitleHi.take(200),
        "testTitleEn" to testTitleEn.take(200),
        "amountInr" to amountInr.coerceIn(1L, 50000L),
        "paymentMethod" to paymentMethod,
        "transactionRef" to transactionRef.take(80),
        "status" to "completed",
        "createdAt" to FieldValue.serverTimestamp()
    )
}

@IgnoreExtraProperties
data class TestAttempt(
    @DocumentId val id: String = "",
    val userId: String = "",
    val testId: String = "",
    val testTitleHi: String = "",
    val testTitleEn: String = "",
    val totalQuestions: Long = 1L,
    val attemptedCount: Long = 0L,
    val correctCount: Long = 0L,
    val incorrectCount: Long = 0L,
    val score: Double = 0.0,
    val maxScore: Double = 2.0,
    val accuracyPercent: Long = 0L,
    val timeTakenSeconds: Long = 0L,
    val selectedAnswers: Map<String, Long> = emptyMap(),
    val status: String = "submitted",
    @ServerTimestamp val createdAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "userId" to userId,
        "testId" to testId,
        "testTitleHi" to testTitleHi.take(200),
        "testTitleEn" to testTitleEn.take(200),
        "totalQuestions" to totalQuestions.coerceIn(1L, 100L),
        "attemptedCount" to attemptedCount.coerceIn(0L, 100L),
        "correctCount" to correctCount.coerceIn(0L, 100L),
        "incorrectCount" to incorrectCount.coerceIn(0L, 100L),
        "score" to score.coerceIn(-200.0, 400.0),
        "maxScore" to maxScore.coerceIn(1.0, 400.0),
        "accuracyPercent" to accuracyPercent.coerceIn(0L, 100L),
        "timeTakenSeconds" to timeTakenSeconds.coerceIn(0L, 21600L),
        "selectedAnswers" to selectedAnswers,
        "status" to "submitted",
        "createdAt" to FieldValue.serverTimestamp()
    )
}

@IgnoreExtraProperties
data class BookmarkedQuestion(
    @DocumentId val id: String = "",
    val userId: String = "",
    val questionId: String = "",
    val testId: String = "",
    val questionHi: String = "",
    val questionEn: String = "",
    val optionsHi: List<String> = emptyList(),
    val optionsEn: List<String> = emptyList(),
    val correctOptionIndex: Long = 0L,
    val explanationHi: String = "",
    val explanationEn: String = "",
    val subjectTag: String = "",
    val isOfflineCached: Boolean = true,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "userId" to userId,
        "questionId" to questionId.take(128),
        "testId" to testId.take(128),
        "questionHi" to questionHi.take(2000),
        "questionEn" to questionEn.take(2000),
        "optionsHi" to optionsHi.take(4).map { it.ifBlank { "-" }.take(800) },
        "optionsEn" to optionsEn.take(4).map { it.ifBlank { "-" }.take(800) },
        "correctOptionIndex" to correctOptionIndex.coerceIn(0L, 3L),
        "explanationHi" to explanationHi.ifBlank { "-" }.take(4000),
        "explanationEn" to explanationEn.ifBlank { "-" }.take(4000),
        "subjectTag" to subjectTag.ifBlank { "CGPSC" }.take(120),
        "isOfflineCached" to isOfflineCached,
        "createdAt" to FieldValue.serverTimestamp(),
        "updatedAt" to FieldValue.serverTimestamp()
    )
}

@IgnoreExtraProperties
data class CurrentAffairItem(
    @DocumentId val id: String = "",
    val category: String = "chhattisgarh", // chhattisgarh | national | international
    val headlineHi: String = "",
    val headlineEn: String = "",
    val summaryHi: String = "",
    val summaryEn: String = "",
    val examKeyPointsHi: List<String> = emptyList(),
    val examKeyPointsEn: List<String> = emptyList(),
    val sourceName: String = "DPR Chhattisgarh / PIB",
    val sourceUrl: String = "",
    val dateLabel: String = "",
    val visibility: String = "published",
    val sourceModule: String = "ai_grounding_pipeline",
    val authorUid: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "category" to category,
        "headlineHi" to headlineHi.ifBlank { "समसामयिकी अपडेट" }.take(300),
        "headlineEn" to headlineEn.ifBlank { "Current Affairs Update" }.take(300),
        "summaryHi" to summaryHi.ifBlank { "-" }.take(3000),
        "summaryEn" to summaryEn.ifBlank { "-" }.take(3000),
        "examKeyPointsHi" to examKeyPointsHi.take(8).map { it.ifBlank { "-" }.take(500) },
        "examKeyPointsEn" to examKeyPointsEn.take(8).map { it.ifBlank { "-" }.take(500) },
        "sourceName" to sourceName.ifBlank { "PIB / DPR CG" }.take(120),
        "sourceUrl" to sourceUrl.take(500),
        "dateLabel" to dateLabel.ifBlank { "2026-11-02" }.take(40),
        "visibility" to visibility,
        "sourceModule" to sourceModule,
        "authorUid" to authorUid,
        "createdAt" to FieldValue.serverTimestamp(),
        "updatedAt" to FieldValue.serverTimestamp()
    )
}

@IgnoreExtraProperties
data class ExamFolder(
    @DocumentId val id: String = "",
    val titleHi: String = "",
    val titleEn: String = "",
    val descriptionHi: String = "",
    val descriptionEn: String = "",
    val examCode: String = "CGPSC_PRE",
    val sortOrder: Long = 0L,
    val isFreeFolder: Boolean = true,
    val priceInr: Long = 0L,
    val testCount: Long = 0L,
    val visibility: String = "published",
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "titleHi" to titleHi.ifBlank { titleEn }.take(120),
        "titleEn" to titleEn.ifBlank { titleHi }.take(120),
        "descriptionHi" to descriptionHi.take(400),
        "descriptionEn" to descriptionEn.take(400),
        "examCode" to examCode.ifBlank { "CGPSC" }.take(40),
        "sortOrder" to sortOrder.coerceIn(0L, 1000L),
        "isFreeFolder" to isFreeFolder,
        "priceInr" to priceInr.coerceIn(0L, 50000L),
        "testCount" to testCount.coerceIn(0L, 500L),
        "visibility" to visibility,
        "createdBy" to createdBy,
        "createdAt" to FieldValue.serverTimestamp(),
        "updatedAt" to FieldValue.serverTimestamp()
    )
}

@IgnoreExtraProperties
data class SubjectFolder(
    @DocumentId val id: String = "",
    val titleHi: String = "",
    val titleEn: String = "",
    val descriptionHi: String = "",
    val descriptionEn: String = "",
    val subjectCode: String = "CG_GS",
    val sortOrder: Long = 0L,
    val isFreeFolder: Boolean = true,
    val priceInr: Long = 0L,
    val testCount: Long = 0L,
    val visibility: String = "published",
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "titleHi" to titleHi.ifBlank { titleEn }.take(120),
        "titleEn" to titleEn.ifBlank { titleHi }.take(120),
        "descriptionHi" to descriptionHi.take(400),
        "descriptionEn" to descriptionEn.take(400),
        "subjectCode" to subjectCode.ifBlank { "GS" }.take(40),
        "sortOrder" to sortOrder.coerceIn(0L, 1000L),
        "isFreeFolder" to isFreeFolder,
        "priceInr" to priceInr.coerceIn(0L, 50000L),
        "testCount" to testCount.coerceIn(0L, 500L),
        "visibility" to visibility,
        "createdBy" to createdBy,
        "createdAt" to FieldValue.serverTimestamp(),
        "updatedAt" to FieldValue.serverTimestamp()
    )
}

@IgnoreExtraProperties
data class TestSeriesItem(
    @DocumentId val id: String = "",
    val folderType: String = "exam", // exam | subject
    val folderId: String = "",
    val titleHi: String = "",
    val titleEn: String = "",
    val topic: String = "",
    val difficulty: String = "CGPSC_Level", // Easy | Moderate | Hard | CGPSC_Level
    val durationMinutes: Long = 60L,
    val questionLimit: Long = 50L,
    val questionCount: Long = 0L,
    val marksPerQuestion: Double = 2.0,
    val negativeMarking: Double = 0.66,
    val isPaid: Boolean = false,
    val priceInr: Long = 0L,
    val status: String = "draft", // draft | published
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "folderType" to folderType,
        "folderId" to folderId.take(128),
        "titleHi" to titleHi.ifBlank { titleEn }.take(200),
        "titleEn" to titleEn.ifBlank { titleHi }.take(200),
        "topic" to topic.ifBlank { "General Studies" }.take(200),
        "difficulty" to difficulty,
        "durationMinutes" to durationMinutes.coerceIn(1L, 240L),
        "questionLimit" to questionLimit.coerceIn(1L, 100L),
        "questionCount" to questionCount.coerceIn(0L, 100L),
        "marksPerQuestion" to marksPerQuestion.coerceIn(0.5, 10.0),
        "negativeMarking" to negativeMarking.coerceIn(0.0, 5.0),
        "isPaid" to isPaid,
        "priceInr" to (if (isPaid) priceInr.coerceIn(1L, 50000L) else 0L),
        "status" to status,
        "createdBy" to createdBy,
        "createdAt" to FieldValue.serverTimestamp(),
        "updatedAt" to FieldValue.serverTimestamp()
    )
}

@IgnoreExtraProperties
data class BilingualQuestion(
    @DocumentId val id: String = "",
    val testId: String = "",
    val orderIndex: Long = 0L,
    val questionHi: String = "", // 1st Language: Hindi (Devanagari)
    val questionEn: String = "", // 2nd Language: English
    val optionsHi: List<String> = listOf("", "", "", ""),
    val optionsEn: List<String> = listOf("", "", "", ""),
    val correctOptionIndex: Long = 0L,
    val explanationHi: String = "",
    val explanationEn: String = "",
    val subjectTag: String = "Chhattisgarh GS",
    val visibility: String = "draft", // draft | published
    val createdBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "testId" to testId.take(128),
        "orderIndex" to orderIndex.coerceIn(0L, 99L),
        "questionHi" to questionHi.ifBlank { "-" }.take(2000),
        "questionEn" to questionEn.ifBlank { "-" }.take(2000),
        "optionsHi" to padFourOptions(optionsHi),
        "optionsEn" to padFourOptions(optionsEn),
        "correctOptionIndex" to correctOptionIndex.coerceIn(0L, 3L),
        "explanationHi" to explanationHi.ifBlank { "-" }.take(4000),
        "explanationEn" to explanationEn.ifBlank { "-" }.take(4000),
        "subjectTag" to subjectTag.ifBlank { "CGPSC" }.take(120),
        "visibility" to visibility,
        "createdBy" to createdBy,
        "createdAt" to FieldValue.serverTimestamp(),
        "updatedAt" to FieldValue.serverTimestamp()
    )

    companion object {
        fun padFourOptions(list: List<String>): List<String> {
            val padded = (list + listOf("विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D")).take(4)
            return padded.map { it.ifBlank { "-" }.take(800) }
        }
    }
}

@IgnoreExtraProperties
data class AppConfig(
    @DocumentId val id: String = "main",
    val configKey: String = "global",
    val anthemTitleHi: String = "सीजीपीडिया आधिकारिक एंथम",
    val anthemTitleEn: String = "CGpedia Official Aspirant Anthem",
    val anthemSourceType: String = "bundled", // bundled | url | cloud_chunks | none
    val anthemAudioUrl: String = "",
    val anthemChunkCount: Long = 0L,
    val anthemMimeType: String = "audio/wav",
    val telegramChannelUrl: String = "https://t.me/CGpediaOfficial",
    val supportEmail: String = "support@cgpedia.in",
    val whatsappSupportNumber: String = "9238810070",
    val supportPolicyHi: String = "भुगतान सहायता एवं किसी भी समस्या के लिए WhatsApp नंबर 9238810070 पर संपर्क करें। भुगतान की पुष्टि के बाद एडमिन द्वारा आपकी रजिस्टर्ड User ID या Email ID से पेड टेस्ट सीरीज तुरंत अनलॉक कर दी जाएगी।",
    val supportPolicyEn: String = "For payment assistance and queries, contact WhatsApp: 9238810070. After payment confirmation, Admin will unlock your paid test series using your registered User ID or Email ID.",
    val latestVersionCode: Long = 2L,
    val latestVersionName: String = "2.0.0",
    val apkDownloadUrl: String = "https://t.me/CGpediaOfficial",
    val updateNotesHi: String = "नया अपडेट उपलब्ध: सीजीपीएससी प्री 2026 टेस्ट सीरीज (₹99), इंस्टाग्राम स्टोरीज समसामयिकी बार, सुरक्षित सबमिट बटन और स्क्रीनशॉट सुरक्षा।",
    val updateNotesEn: String = "New Update Available: CGPSC Pre 2026 Test Series (₹99), Instagram Stories Current Affairs Bar, Safe Submit Button & Screenshot Protection.",
    val updatedBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
) {
    fun toCreateMap(): Map<String, Any> = mapOf(
        "configKey" to "global",
        "anthemTitleHi" to anthemTitleHi.ifBlank { "सीजीपीडिया एंथम" }.take(150),
        "anthemTitleEn" to anthemTitleEn.ifBlank { "CGpedia Official Anthem" }.take(150),
        "anthemSourceType" to anthemSourceType,
        "anthemAudioUrl" to anthemAudioUrl.take(1000),
        "anthemChunkCount" to anthemChunkCount.coerceIn(0L, 20L),
        "anthemMimeType" to anthemMimeType.take(60),
        "telegramChannelUrl" to telegramChannelUrl.take(300),
        "supportEmail" to supportEmail.take(120),
        "whatsappSupportNumber" to whatsappSupportNumber.ifBlank { "9238810070" }.take(40),
        "supportPolicyHi" to supportPolicyHi.take(4000),
        "supportPolicyEn" to supportPolicyEn.take(4000),
        "latestVersionCode" to latestVersionCode.coerceIn(1L, 10000L),
        "latestVersionName" to latestVersionName.ifBlank { "2.0.0" }.take(40),
        "apkDownloadUrl" to apkDownloadUrl.ifBlank { "https://t.me/CGpediaOfficial" }.take(1000),
        "updateNotesHi" to updateNotesHi.take(2000),
        "updateNotesEn" to updateNotesEn.take(2000),
        "updatedBy" to updatedBy,
        "createdAt" to FieldValue.serverTimestamp(),
        "updatedAt" to FieldValue.serverTimestamp()
    )
}

@IgnoreExtraProperties
data class AnthemAudioChunk(
    @DocumentId val id: String = "",
    val chunkIndex: Long = 0L,
    val base64Data: String = "",
    val configKey: String = "global",
    val uploadedBy: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null
)

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}
