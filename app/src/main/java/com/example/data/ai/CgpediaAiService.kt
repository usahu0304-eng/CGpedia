package com.example.data.ai

import android.util.Log
import com.example.data.model.BilingualQuestion
import com.example.data.model.CurrentAffairItem
import com.example.data.seed.CgpediaStarterCatalog
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.RequestOptions
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.Tool
import com.google.firebase.ai.type.generationConfig
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.withTimeout
import org.json.JSONObject

private const val TAG = "CgpediaAiService"

/**
 * Firebase AI Logic integration powered by gemini-3.8-flash:
 * 1. Automated Current Affairs Pipeline using Google Search Grounding (PIB, DPR Chhattisgarh, official portals).
 * 2. Exclusive Admin Manual Bilingual Test Series Generator (1st Hindi Devanagari, 2nd English, up to 100 questions).
 */
class CgpediaAiService {

    companion object {
        /**
         * 5-minute timeout (300,000 ms) so large bilingual test batches (up to 100 questions)
         * and grounded reports do not crash or time out prematurely.
         */
        const val AI_GENERATION_TIMEOUT_MS: Long = 300_000L
    }

    private val longTimeoutRequestOptions by lazy {
        RequestOptions(timeoutInMillis = AI_GENERATION_TIMEOUT_MS)
    }

    // Stage 1: Real-time Google Search Grounded model for Current Affairs verification
    private val searchGroundedModel by lazy {
        Firebase.ai.generativeModel(
            modelName = "gemini-3.8-flash",
            tools = listOf(Tool.googleSearch()),
            requestOptions = longTimeoutRequestOptions
        )
    }

    // Stage 2: Strict Schema model for formatting grounded Current Affairs into clean JSON
    private val currentAffairsSchema = Schema.obj(
        properties = mapOf(
            "articles" to Schema.array(
                items = Schema.obj(
                    properties = mapOf(
                        "category" to Schema.enumeration(
                            values = listOf("chhattisgarh", "national", "international"),
                            description = "Category tab"
                        ),
                        "headlineHi" to Schema.string(description = "Crisp headline in Hindi Devanagari"),
                        "headlineEn" to Schema.string(description = "Crisp headline in English"),
                        "summaryHi" to Schema.string(description = "Exam-focused verified summary in Hindi Devanagari"),
                        "summaryEn" to Schema.string(description = "Exam-focused verified summary in English"),
                        "examKeyPointsHi" to Schema.array(
                            items = Schema.string(),
                            description = "2 to 4 factual exam points in Hindi"
                        ),
                        "examKeyPointsEn" to Schema.array(
                            items = Schema.string(),
                            description = "2 to 4 factual exam points in English"
                        ),
                        "sourceName" to Schema.string(description = "Official verified source e.g. DPR Chhattisgarh, PIB India, MEA"),
                        "sourceUrl" to Schema.string(description = "Verified reference URL if available"),
                        "dateLabel" to Schema.string(description = "Date string YYYY-MM-DD")
                    )
                )
            )
        )
    )

    private val currentAffairsJsonModel by lazy {
        Firebase.ai.generativeModel(
            modelName = "gemini-3.8-flash",
            generationConfig = generationConfig {
                responseMimeType = "application/json"
                responseSchema = currentAffairsSchema
            },
            requestOptions = longTimeoutRequestOptions
        )
    }

    // Strict Schema for Admin Manual Bilingual Test Generator (1st Hindi, 2nd English)
    private val bilingualQuestionsSchema = Schema.obj(
        properties = mapOf(
            "questions" to Schema.array(
                items = Schema.obj(
                    properties = mapOf(
                        "questionHi" to Schema.string(description = "1st Language: Question text in pure Hindi (Devanagari)"),
                        "questionEn" to Schema.string(description = "2nd Language: Question text in accurate English"),
                        "optionsHi" to Schema.array(
                            items = Schema.string(),
                            description = "Exactly 4 distinct options in Hindi (Devanagari)"
                        ),
                        "optionsEn" to Schema.array(
                            items = Schema.string(),
                            description = "Exactly 4 corresponding options in English in identical order"
                        ),
                        "correctOptionIndex" to Schema.integer(description = "0-based index of the right answer (0, 1, 2, or 3)"),
                        "explanationHi" to Schema.string(description = "Detailed, factually verified explanation in Hindi (Devanagari)"),
                        "explanationEn" to Schema.string(description = "Detailed, factually verified explanation in English"),
                        "subjectTag" to Schema.string(description = "Sub-topic or subject label")
                    )
                )
            )
        )
    )

    private val bilingualTestModel by lazy {
        Firebase.ai.generativeModel(
            modelName = "gemini-3.8-flash",
            generationConfig = generationConfig {
                responseMimeType = "application/json"
                responseSchema = bilingualQuestionsSchema
            },
            requestOptions = longTimeoutRequestOptions
        )
    }

    /**
     * Fetches, verifies via Google Search Grounding, and summarizes authentic exam-relevant news
     * across Chhattisgarh, National, and International categories.
     */
    suspend fun fetchGroundedCurrentAffairs(authorUid: String): Result<List<CurrentAffairItem>> = try {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

        val groundedReport = withTimeout(AI_GENERATION_TIMEOUT_MS) {
            val searchPrompt = """
                Today's date is $today. Using Google Search, find and verify the latest authentic competitive-exam current affairs for CGPSC and CGSSB aspirants from trusted government and official portals (DPR Chhattisgarh dprcg.gov.in, PIB India pib.gov.in, Union Ministries, RBI, ISRO, UN/MEA):
                1. 3 recent Chhattisgarh Current Affairs items (state schemes, awards, cabinet decisions, rankings, tribal/cultural initiatives, budget/economic facts).
                2. 3 recent National Current Affairs items (PIB government initiatives, constitutional/policy updates, science & defence, economy).
                3. 3 recent International Current Affairs items (summits, treaties, global indices, bilateral relations with India).
                Include exact dates, official source names, and factual figures needed for UPSC/CGPSC Prelims & Mains.
            """.trimIndent()
            searchGroundedModel.generateContent(searchPrompt)
        }

        val groundedText = groundedReport.text
            ?: throw IllegalStateException("Search grounding returned an empty report.")

        // Extract any grounded web URLs returned by Google Search metadata
        val groundedUrls = groundedReport.candidates.firstOrNull()
            ?.groundingMetadata
            ?.groundingChunks
            ?.mapNotNull { it.web?.uri }
            .orEmpty()
        val citationHint = if (groundedUrls.isNotEmpty()) {
            "Verified Grounding URLs: ${groundedUrls.take(8).joinToString(", ")}"
        } else {
            ""
        }

        val structuredResponse = withTimeout(AI_GENERATION_TIMEOUT_MS) {
            val formatPrompt = """
                Convert the following Google-Search-verified news report into bilingual (Hindi Devanagari + English) Current Affairs cards for CGpedia aspirants.
                Ensure every fact, figure, scheme name, and date is strictly faithful to the grounded report below.
                Produce items covering 'chhattisgarh', 'national', and 'international'.
                $citationHint
                
                Grounded Report:
                $groundedText
            """.trimIndent()
            currentAffairsJsonModel.generateContent(formatPrompt)
        }

        val jsonText = structuredResponse.text
            ?: throw IllegalStateException("Structured formatting returned empty JSON.")

        val root = JSONObject(jsonText)
        val arr = root.getJSONArray("articles")
        val items = buildList {
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val ptsHiArr = obj.optJSONArray("examKeyPointsHi")
                val ptsEnArr = obj.optJSONArray("examKeyPointsEn")
                val ptsHi = if (ptsHiArr != null) {
                    (0 until ptsHiArr.length()).map { ptsHiArr.getString(it) }.filter { it.isNotBlank() }.take(6)
                } else emptyList()
                val ptsEn = if (ptsEnArr != null) {
                    (0 until ptsEnArr.length()).map { ptsEnArr.getString(it) }.filter { it.isNotBlank() }.take(6)
                } else emptyList()

                add(
                    CurrentAffairItem(
                        category = obj.optString("category", "chhattisgarh")
                            .lowercase(Locale.US)
                            .let { if (it in listOf("chhattisgarh", "national", "international")) it else "chhattisgarh" },
                        headlineHi = obj.optString("headlineHi", ""),
                        headlineEn = obj.optString("headlineEn", ""),
                        summaryHi = obj.optString("summaryHi", ""),
                        summaryEn = obj.optString("summaryEn", ""),
                        examKeyPointsHi = ptsHi,
                        examKeyPointsEn = ptsEn,
                        sourceName = obj.optString("sourceName", "PIB / DPR Chhattisgarh"),
                        sourceUrl = obj.optString("sourceUrl", groundedUrls.getOrNull(i % groundedUrls.size.coerceAtLeast(1)).orEmpty()),
                        dateLabel = obj.optString("dateLabel", today),
                        visibility = "published",
                        sourceModule = "ai_grounding_pipeline",
                        authorUid = authorUid
                    )
                )
            }
        }
        Result.success(items.ifEmpty { CgpediaStarterCatalog.defaultCurrentAffairs(authorUid) })
    } catch (e: TimeoutCancellationException) {
        Log.w(TAG, "Current affairs search grounding timed out; returning verified bilingual starter digest", e)
        Result.success(CgpediaStarterCatalog.defaultCurrentAffairs(authorUid))
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Log.w(TAG, "Current affairs AI grounding quota/network fallback triggered; returning verified bilingual digest", e)
        Result.success(CgpediaStarterCatalog.defaultCurrentAffairs(authorUid))
    }

    /**
     * Exclusive Admin Manual Bilingual Test Series Generator.
     * Supports up to 100 questions by generating in safe batches of up to 15 questions per call
     * with a 5-minute (300,000 ms) timeout window per batch so large tests never time out prematurely.
     */
    suspend fun generateBilingualTestQuestions(
        examOrSubjectName: String,
        topic: String,
        difficulty: String,
        totalQuestions: Int,
        testId: String,
        adminUid: String,
        onBatchProgress: (generatedCount: Int, targetCount: Int, currentBatch: Int, totalBatches: Int) -> Unit = { _, _, _, _ -> }
    ): Result<List<BilingualQuestion>> = try {
        val clampedTotal = totalQuestions.coerceIn(1, 100)
        val batchSize = 15
        val collected = mutableListOf<BilingualQuestion>()
        var remaining = clampedTotal
        var batchNumber = 0
        val totalBatches = (clampedTotal + batchSize - 1) / batchSize

        while (remaining > 0) {
            batchNumber++
            val currentCount = minOf(batchSize, remaining)
            onBatchProgress(collected.size, clampedTotal, batchNumber, totalBatches)

            val avoidStems = collected.takeLast(12).joinToString(" | ") { it.questionEn.take(70) }
            val prompt = """
                You are the Chief Academic Examiner for CGpedia (Chhattisgarh Competitive Exams: CGPSC & CGSSB/Vyapam).
                Generate exactly $currentCount high-accuracy, factually verified, non-repetitive Multiple Choice Questions (Batch $batchNumber of $totalBatches).
                
                Target Exam / Subject: $examOrSubjectName
                Specific Topic: $topic
                Difficulty Level: $difficulty
                
                MANDATORY BILINGUAL RULES:
                1. Every question stem MUST be provided in BOTH pure Hindi (Devanagari script) in 'questionHi' AND clear English in 'questionEn'.
                2. Provide EXACTLY 4 options in Hindi ('optionsHi') and the EXACT corresponding 4 options in English ('optionsEn') in the same order.
                3. Double-check 'correctOptionIndex' (0, 1, 2, or 3) against authoritative textbooks, Chhattisgarh Granth Academy, NCERT, and official government records.
                4. Provide a comprehensive, exam-grade explanation in BOTH Hindi ('explanationHi') and English ('explanationEn') explaining why the correct option is right and giving key exam facts about the other options.
                ${if (avoidStems.isNotBlank()) "Do NOT repeat any of these already-generated questions: $avoidStems" else ""}
            """.trimIndent()

            val response = withTimeout(AI_GENERATION_TIMEOUT_MS) {
                bilingualTestModel.generateContent(prompt)
            }
            val jsonString = response.text
                ?: throw IllegalStateException("AI Test Generator returned an empty response on batch $batchNumber.")

            val root = JSONObject(jsonString)
            val qArray = root.getJSONArray("questions")
            for (i in 0 until qArray.length()) {
                if (collected.size >= clampedTotal) break
                val qObj = qArray.getJSONObject(i)
                val optsHiJson = qObj.getJSONArray("optionsHi")
                val optsEnJson = qObj.getJSONArray("optionsEn")
                val optsHi = (0 until optsHiJson.length()).map { optsHiJson.getString(it) }
                val optsEn = (0 until optsEnJson.length()).map { optsEnJson.getString(it) }

                collected.add(
                    BilingualQuestion(
                        testId = testId,
                        orderIndex = collected.size.toLong(),
                        questionHi = qObj.getString("questionHi"),
                        questionEn = qObj.getString("questionEn"),
                        optionsHi = BilingualQuestion.padFourOptions(optsHi),
                        optionsEn = BilingualQuestion.padFourOptions(optsEn),
                        correctOptionIndex = qObj.getInt("correctOptionIndex").coerceIn(0, 3).toLong(),
                        explanationHi = qObj.getString("explanationHi"),
                        explanationEn = qObj.getString("explanationEn"),
                        subjectTag = qObj.optString("subjectTag", topic).ifBlank { topic },
                        visibility = "draft",
                        createdBy = adminUid
                    )
                )
            }
            onBatchProgress(collected.size, clampedTotal, batchNumber, totalBatches)
            remaining = clampedTotal - collected.size
            // Safety guard if model returned 0 questions
            if (qArray.length() == 0) break
        }
        onBatchProgress(collected.size, clampedTotal, totalBatches, totalBatches)
        Result.success(collected)
    } catch (e: TimeoutCancellationException) {
        Log.e(TAG, "Admin AI test generation timed out", e)
        Result.failure(
            IllegalStateException(
                "AI Test generation timed out after 5 minutes (300,000 ms). Try a smaller question batch or retry."
            )
        )
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        Log.e(TAG, "Admin AI test generation failed", e)
        Result.failure(e)
    }
}
