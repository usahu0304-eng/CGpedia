package com.example.data.ai

import com.example.data.model.BilingualQuestion
import com.example.data.model.CurrentAffairItem
import com.google.firebase.Firebase
import com.google.firebase.Timestamp
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.GenerativeBackend
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.Tool
import com.google.firebase.ai.type.generationConfig
import java.time.LocalDate
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.json.JSONObject

/**
 * Firebase AI Logic Service for CGpedia:
 * 1. Generates Bilingual (Hindi Devanagari + English) MCQs for CGPSC & CGSSB (up to 100 questions)
 *    with a 5-minute (300,000 ms) timeout and custom Admin prompt support.
 * 2. Generates Instant Bilingual Current Affairs Quizzes for students.
 * 3. Fetches & synthesizes real-time Bilingual Current Affairs across Chhattisgarh, India, and World
 *    using Google Search Grounding (`Tool.googleSearch()`).
 */
class CgpediaAiService {

    companion object {
        const val AI_GENERATION_TIMEOUT_MS = 300_000L // 5 minutes (300,000 ms)
    }

    private val questionListSchema = Schema.obj(
        mapOf(
            "questions" to Schema.array(
                Schema.obj(
                    mapOf(
                        "questionHi" to Schema.string("Full question text in formal Hindi (Devanagari script) suitable for CGPSC/CGSSB"),
                        "questionEn" to Schema.string("Exact corresponding question text in English"),
                        "optionsHi" to Schema.array(Schema.string("4 options in Hindi (Devanagari)")),
                        "optionsEn" to Schema.array(Schema.string("4 corresponding options in English")),
                        "correctOptionIndex" to Schema.integer("Zero-based index (0, 1, 2, or 3) of the correct option"),
                        "explanationHi" to Schema.string("Detailed explanation in Hindi (Devanagari)"),
                        "explanationEn" to Schema.string("Detailed explanation in English"),
                        "subjectTag" to Schema.string("Subject category tag, e.g., Chhattisgarh History, Indian Polity")
                    )
                )
            )
        )
    )

    private val currentAffairsSchema = Schema.obj(
        mapOf(
            "items" to Schema.array(
                Schema.obj(
                    mapOf(
                        "category" to Schema.enumeration(
                            listOf("chhattisgarh", "national", "international"),
                            "Scope category of the current affairs news"
                        ),
                        "headlineHi" to Schema.string("Headline in Hindi (Devanagari)"),
                        "headlineEn" to Schema.string("Headline in English"),
                        "summaryHi" to Schema.string("Comprehensive exam-oriented summary in Hindi (Devanagari)"),
                        "summaryEn" to Schema.string("Comprehensive exam-oriented summary in English"),
                        "examKeyPointsHi" to Schema.array(Schema.string("3 key factual exam points in Hindi")),
                        "examKeyPointsEn" to Schema.array(Schema.string("3 key factual exam points in English")),
                        "sourceName" to Schema.string("Official or reputable news source (e.g., PIB, DPR Chhattisgarh, The Hindu)"),
                        "sourceUrl" to Schema.string("Reference URL or official portal URL"),
                        "dateLabel" to Schema.string("Date in YYYY-MM-DD format")
                    )
                )
            )
        )
    )

    private val structuredQuestionModel by lazy {
        Firebase.ai(backend = GenerativeBackend.googleAI()).generativeModel(
            modelName = "gemini-3.8-flash",
            generationConfig = generationConfig {
                responseMimeType = "application/json"
                responseSchema = questionListSchema
            }
        )
    }

    private val groundedSearchModel by lazy {
        Firebase.ai(backend = GenerativeBackend.googleAI()).generativeModel(
            modelName = "gemini-3.8-flash",
            tools = listOf(Tool.googleSearch())
        )
    }

    private val structuredCurrentAffairsModel by lazy {
        Firebase.ai(backend = GenerativeBackend.googleAI()).generativeModel(
            modelName = "gemini-3.8-flash",
            generationConfig = generationConfig {
                responseMimeType = "application/json"
                responseSchema = currentAffairsSchema
            }
        )
    }

    /**
     * Generates Bilingual (Hindi + English) MCQs for a topic, difficulty, question count, and optional custom Admin prompt.
     * Enforces a 5-minute (300,000 ms) timeout and batches large question requests so generation never crashes.
     */
    suspend fun generateBilingualTestQuestions(
        testId: String,
        topic: String,
        difficulty: String,
        questionCount: Int,
        authorUid: String,
        customPrompt: String = "",
        onProgress: (String) -> Unit = {}
    ): Result<List<BilingualQuestion>> = runCatching {
        val totalRequested = questionCount.coerceIn(1, 100)
        onProgress("Generating questions, please wait... (0/$totalRequested)")
        withTimeout(AI_GENERATION_TIMEOUT_MS) {
            val batchSize = 20
            val accumulated = mutableListOf<BilingualQuestion>()
            var remaining = totalRequested
            var batchIndex = 0

            while (remaining > 0) {
                val countForBatch = remaining.coerceAtMost(batchSize)
                val startOrder = accumulated.size
                onProgress("Generating questions, please wait... ($startOrder/$totalRequested)")
                val batchQuestions = generateSingleQuestionBatch(
                    testId = testId,
                    topic = topic,
                    difficulty = difficulty,
                    batchCount = countForBatch,
                    startOrderIndex = startOrder,
                    authorUid = authorUid,
                    batchIndex = batchIndex,
                    customPrompt = customPrompt
                )
                accumulated.addAll(batchQuestions)
                remaining -= batchQuestions.size.coerceAtLeast(1)
                batchIndex++
            }
            onProgress("Generating questions, please wait... (${accumulated.size}/$totalRequested)")
            accumulated.take(totalRequested)
        }
    }

    private suspend fun generateSingleQuestionBatch(
        testId: String,
        topic: String,
        difficulty: String,
        batchCount: Int,
        startOrderIndex: Int,
        authorUid: String,
        batchIndex: Int,
        customPrompt: String = ""
    ): List<BilingualQuestion> {
        val customDirective = if (customPrompt.isNotBlank()) {
            "\nAdditional Admin Custom Prompt / Instructions:\n${customPrompt.trim()}\n"
        } else {
            ""
        }
        val prompt = """
            You are a Senior Subject Matter Expert for the Chhattisgarh Public Service Commission (CGPSC) and Chhattisgarh Subordinate Services Selection Board (CGSSB / CG Vyapam).
            Generate exactly $batchCount high-accuracy, exam-standard Multiple Choice Questions (MCQs) on the topic: "$topic".
            Difficulty level: "$difficulty".
            Batch number: ${batchIndex + 1} (ensure every question is unique and non-repetitive).
            $customDirective
            CRITICAL BILINGUAL ORDER & FORMATTING RULES:
            1. Every question MUST be provided in BOTH languages:
               - 1st Language: Hindi (clear, standard Devanagari script used in official CGPSC question papers) in `questionHi`, `optionsHi`, and `explanationHi`.
               - 2nd Language: English in `questionEn`, `optionsEn`, and `explanationEn`.
            2. `optionsHi` MUST contain exactly 4 options in Hindi.
            3. `optionsEn` MUST contain exactly 4 corresponding options in English in the exact same order.
            4. `correctOptionIndex` MUST be an integer from 0 to 3.
            5. Include a detailed, factual explanation in both Hindi (`explanationHi`) and English (`explanationEn`).
        """.trimIndent()

        val response = structuredQuestionModel.generateContent(prompt)
        val rawText = response.text ?: throw IllegalStateException("Empty response from AI Logic model")
        val root = JSONObject(rawText)
        val arr = root.optJSONArray("questions") ?: throw IllegalStateException("Missing 'questions' array")
        val out = mutableListOf<BilingualQuestion>()

        for (idx in 0 until arr.length()) {
            val obj = arr.optJSONObject(idx) ?: continue
            val optsHi = parseFourOptions(obj.optJSONArray("optionsHi"), "विकल्प")
            val optsEn = parseFourOptions(obj.optJSONArray("optionsEn"), "Option")
            val correctIdx = obj.optInt("correctOptionIndex", 0).coerceIn(0, 3).toLong()

            out.add(
                BilingualQuestion(
                    id = "${testId}_q_${startOrderIndex + idx + 1}",
                    testId = testId,
                    orderIndex = (startOrderIndex + idx).toLong(),
                    questionHi = obj.optString("questionHi").ifBlank { "प्रश्न ${startOrderIndex + idx + 1}" },
                    questionEn = obj.optString("questionEn").ifBlank { "Question ${startOrderIndex + idx + 1}" },
                    optionsHi = optsHi,
                    optionsEn = optsEn,
                    correctOptionIndex = correctIdx,
                    explanationHi = obj.optString("explanationHi"),
                    explanationEn = obj.optString("explanationEn"),
                    subjectTag = obj.optString("subjectTag").ifBlank { topic.take(80) },
                    visibility = "draft",
                    createdBy = authorUid
                )
            )
        }
        return out
    }

    /**
     * Generates an instant Bilingual Current Affairs Quiz for students based on the active Current Affairs feed.
     * Falls back seamlessly to deterministic questions constructed from the Current Affairs digest if offline.
     */
    suspend fun generateInstantCurrentAffairsQuiz(
        articles: List<CurrentAffairItem>,
        questionCount: Int = 5,
        authorUid: String = "student_quiz"
    ): List<BilingualQuestion> {
        val count = questionCount.coerceIn(3, 10)
        val contextSummary = articles.take(8).joinToString("\n\n") { item ->
            "Category: ${item.category}\nHindi: ${item.headlineHi} - ${item.summaryHi}\nEnglish: ${item.headlineEn} - ${item.summaryEn}\nKey Points: ${item.examKeyPointsEn.joinToString("; ")}"
        }
        val aiGenerated = runCatching {
            val prompt = """
                Create a $count-question Bilingual (1st Hindi Devanagari, 2nd English) Current Affairs Quiz for CGPSC & CGSSB aspirants based on these recent news items:
                $contextSummary
                Ensure each question has 4 options in Hindi (`optionsHi`), 4 matching options in English (`optionsEn`), `correctOptionIndex` (0..3), and explanations in both languages.
            """.trimIndent()
            val response = structuredQuestionModel.generateContent(prompt)
            val rawText = response.text ?: error("Empty response")
            val root = JSONObject(rawText)
            val arr = root.optJSONArray("questions") ?: error("Missing questions")
            val list = mutableListOf<BilingualQuestion>()
            for (idx in 0 until arr.length()) {
                val obj = arr.optJSONObject(idx) ?: continue
                val optsHi = parseFourOptions(obj.optJSONArray("optionsHi"), "विकल्प")
                val optsEn = parseFourOptions(obj.optJSONArray("optionsEn"), "Option")
                val correctIdx = obj.optInt("correctOptionIndex", 0).coerceIn(0, 3).toLong()
                val qHi = obj.optString("questionHi")
                val qEn = obj.optString("questionEn")
                if (qHi.isNotBlank() && qEn.isNotBlank()) {
                    list.add(
                        BilingualQuestion(
                            id = "ca_quiz_q_${idx + 1}",
                            testId = "instant_ca_quiz",
                            orderIndex = idx.toLong(),
                            questionHi = qHi,
                            questionEn = qEn,
                            optionsHi = optsHi,
                            optionsEn = optsEn,
                            correctOptionIndex = correctIdx,
                            explanationHi = obj.optString("explanationHi"),
                            explanationEn = obj.optString("explanationEn"),
                            subjectTag = "Current Affairs • समसामयिकी",
                            visibility = "published",
                            createdBy = authorUid
                        )
                    )
                }
            }
            list
        }.getOrNull()

        if (!aiGenerated.isNullOrEmpty()) {
            return aiGenerated
        }

        // High-accuracy fallback derived directly from the active Current Affairs articles
        return articles.take(count).mapIndexed { idx, art ->
            val correctPointHi = art.examKeyPointsHi.firstOrNull() ?: art.headlineHi
            val correctPointEn = art.examKeyPointsEn.firstOrNull() ?: art.headlineEn
            BilingualQuestion(
                id = "ca_quiz_fallback_${idx + 1}",
                testId = "instant_ca_quiz",
                orderIndex = idx.toLong(),
                questionHi = "हाल ही में चर्चित '${art.headlineHi}' के संदर्भ में निम्नलिखित में से कौन-सा कथन सही है?",
                questionEn = "Regarding the recent update '${art.headlineEn}', which of the following statements is correct?",
                optionsHi = listOf(
                    correctPointHi.take(180),
                    "यह योजना केवल महानगरों के औद्योगिक क्षेत्रों तक सीमित है।",
                    "इसका क्रियान्वयन वर्ष 1995 में समाप्त कर दिया गया था।",
                    "उपर्युक्त में से कोई नहीं"
                ),
                optionsEn = listOf(
                    correctPointEn.take(180),
                    "This initiative is restricted exclusively to metropolitan industrial zones.",
                    "Its implementation was discontinued in 1995.",
                    "None of the above"
                ),
                correctOptionIndex = 0L,
                explanationHi = "${art.summaryHi} (स्रोत: ${art.sourceName})",
                explanationEn = "${art.summaryEn} (Source: ${art.sourceName})",
                subjectTag = "Current Affairs • ${art.category.uppercase()}",
                visibility = "published",
                createdBy = authorUid
            )
        }
    }

    /**
     * Generates fresh Bilingual Current Affairs grounded in real-time Google Search
     * across Chhattisgarh (`chhattisgarh`), India (`national`), and World (`international`).
     */
    suspend fun fetchGroundedCurrentAffairs(authorUid: String): Result<List<CurrentAffairItem>> = runCatching {
        val today = LocalDate.now().toString()
        val searchPrompt = """
            Search Google for the latest official and verified Current Affairs relevant for Chhattisgarh Public Service Commission (CGPSC) and CGSSB (CG Vyapam) exams as of $today:
            1. Chhattisgarh State Current Affairs: Chhattisgarh government cabinet decisions, schemes, awards, tribal welfare, economic survey, DPR Chhattisgarh updates.
            2. National (India) Current Affairs: PIB releases, Union Cabinet decisions, Constitutional/Supreme Court updates, ISRO/DRDO science & tech, national economy, awards & sports.
            3. International Current Affairs: Major global summits, India's bilateral agreements, international organizations (UN, BRICS, G20, IMF, World Bank), global indices.
            Include exact dates, official source names, and factual figures needed for CGPSC & CGSSB exams.
        """.trimIndent()

        val groundedResponse = runCatching {
            groundedSearchModel.generateContent(searchPrompt).text.orEmpty()
        }.getOrDefault("")

        val structurePrompt = """
            Using the following grounded news intelligence (and verified recent facts up to $today), produce 6 high-yield Bilingual Current Affairs items for CGPSC & CGSSB aspirants:
            - 2 items with category = "chhattisgarh"
            - 2 items with category = "national"
            - 2 items with category = "international"

            Grounded News Context:
            $groundedResponse

            STRICT BILINGUAL RULES:
            - 1st Language: Hindi (Devanagari script) in `headlineHi`, `summaryHi`, and `examKeyPointsHi` (3 bullet points in Hindi).
            - 2nd Language: English in `headlineEn`, `summaryEn`, and `examKeyPointsEn` (3 matching bullet points in English).
            - Provide accurate `sourceName` (e.g., "DPR Chhattisgarh", "PIB India", "The Hindu / MEA") and `sourceUrl`.
            - Set `dateLabel` to "$today".
        """.trimIndent()

        val structuredResponse = structuredCurrentAffairsModel.generateContent(structurePrompt)
        val rawJson = structuredResponse.text ?: throw IllegalStateException("Empty Current Affairs JSON from AI Logic")
        val root = JSONObject(rawJson)
        val itemsArray = root.optJSONArray("items") ?: throw IllegalStateException("Missing 'items' array in Current Affairs JSON")
        val nowTs = Timestamp.now()
        val out = mutableListOf<CurrentAffairItem>()

        for (index in 0 until itemsArray.length()) {
            val obj = itemsArray.optJSONObject(index) ?: continue
            val rawCat = obj.optString("category").lowercase()
            val cat = if (rawCat in listOf("chhattisgarh", "national", "international")) {
                rawCat
            } else {
                when (index % 3) {
                    0 -> "chhattisgarh"
                    1 -> "national"
                    else -> "international"
                }
            }

            val pointsHi = parseStringList(obj.optJSONArray("examKeyPointsHi")).ifEmpty { listOf("महत्वपूर्ण परीक्षा तथ्य") }
            val pointsEn = parseStringList(obj.optJSONArray("examKeyPointsEn")).ifEmpty { listOf("Key Exam Takeaway") }

            out.add(
                CurrentAffairItem(
                    id = "ca_${today.replace("-", "")}_${cat}_${index + 1}",
                    category = cat,
                    headlineHi = obj.optString("headlineHi").take(340),
                    headlineEn = obj.optString("headlineEn").take(340),
                    summaryHi = obj.optString("summaryHi").take(4000),
                    summaryEn = obj.optString("summaryEn").take(4000),
                    examKeyPointsHi = pointsHi.take(8),
                    examKeyPointsEn = pointsEn.take(8),
                    sourceName = obj.optString("sourceName").ifBlank { "PIB / DPR Chhattisgarh" }.take(140),
                    sourceUrl = obj.optString("sourceUrl").ifBlank { "https://dprcg.gov.in" }.take(1000),
                    dateLabel = obj.optString("dateLabel").ifBlank { today }.take(35),
                    visibility = "published",
                    sourceModule = "ai_grounded",
                    authorUid = authorUid,
                    createdAt = nowTs,
                    updatedAt = nowTs
                )
            )
        }
        out
    }

    private fun parseFourOptions(arr: JSONArray?, fallbackPrefix: String): List<String> {
        val list = parseStringList(arr).take(4)
        return if (list.size == 4) {
            list
        } else {
            val labels = listOf("A", "B", "C", "D")
            List(4) { idx -> list.getOrElse(idx) { "$fallbackPrefix ${labels[idx]}" } }
        }
    }

    private fun parseStringList(arr: JSONArray?): List<String> {
        if (arr == null) return emptyList()
        val out = mutableListOf<String>()
        for (i in 0 until arr.length()) {
            val str = arr.optString(i).trim()
            if (str.isNotBlank()) out.add(str)
        }
        return out
    }
}
