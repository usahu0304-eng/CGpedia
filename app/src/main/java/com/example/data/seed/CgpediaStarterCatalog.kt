package com.example.data.seed

import com.example.data.model.BilingualQuestion
import com.example.data.model.BroadcastNotification
import com.example.data.model.CurrentAffairItem
import com.example.data.model.ExamFolder
import com.example.data.model.SubjectFolder
import com.example.data.model.TestSeriesItem
import com.example.data.model.UpcomingTestItem
import com.google.firebase.Timestamp

/**
 * Verified starter catalog of CGPSC & CGSSB exam folders, subject folders,
 * bilingual Hindi-English tests, bilingual Current Affairs stories,
 * broadcast notifications, and upcoming test schedules.
 */
object CgpediaStarterCatalog {

    const val SUPPORT_WHATSAPP_NUMBER = "9238810070"

    fun defaultExamFolders(authorUid: String = "system_admin"): List<ExamFolder> = listOf(
        ExamFolder(
            id = "cgpsc_pre_2026_series",
            titleHi = "सीजीपीएससी प्री 2026 टेस्ट सीरीज",
            titleEn = "CGPSC Pre 2026 Test Series",
            descriptionHi = "सीजीपीएससी प्रारंभिक परीक्षा 2026 के लिए पूर्ण द्विभाषी (हिंदी + अंग्रेजी) प्रीमियम टेस्ट सीरीज पैकेज",
            descriptionEn = "Complete Bilingual (Hindi + English) Test Series Package for CGPSC & CGSSB 2026 (WhatsApp Support: 9238810070)",
            examCode = "CGPSC_PRE_2026",
            sortOrder = 0L,
            isFreeFolder = false,
            priceInr = 99L,
            validityDays = 180L,
            testCount = 15L,
            visibility = "published",
            createdBy = authorUid
        ),
        ExamFolder(
            id = "cgpsc_prelims",
            titleHi = "सीजीपीएससी एवं सीजीएसएसबी प्रारंभिक टेस्ट सीरीज",
            titleEn = "CGPSC & CGSSB State Service Series",
            descriptionHi = "सामान्य अध्ययन (पेपर-I) एवं सीसैट (पेपर-II) पूर्णतः द्विभाषी टेस्ट सीरीज",
            descriptionEn = "General Studies (Paper-I) & CSAT (Paper-II) Full Bilingual Test Series",
            examCode = "CGPSC_PRE",
            sortOrder = 1L,
            isFreeFolder = false,
            priceInr = 99L,
            validityDays = 180L,
            testCount = 3L,
            visibility = "published",
            createdBy = authorUid
        ),
        ExamFolder(
            id = "cgssb_vyapam",
            titleHi = "सीजीएसएसबी / व्यापम (CGSSB & Vyapam)",
            titleEn = "CGSSB / CG Vyapam Combined",
            descriptionHi = "पटवारी, आरआई, हॉस्टल वार्डन, एडीईओ एवं सहायक ग्रेड-3 भर्ती परीक्षा",
            descriptionEn = "Patwari, RI, Hostel Warden, ADEO & Assistant Grade-3 Exam Series",
            examCode = "CGSSB",
            sortOrder = 2L,
            isFreeFolder = true,
            priceInr = 0L,
            testCount = 2L,
            visibility = "published",
            createdBy = authorUid
        ),
        ExamFolder(
            id = "cgpsc_mains_obj",
            titleHi = "सीजीपीएससी मुख्य परीक्षा एवं विशेष प्रैक्टिस",
            titleEn = "CGPSC Mains & Special Practice",
            descriptionHi = "छत्तीसगढ़ प्रशासन, जनजातियाँ, पंचायती राज एवं आर्थिक सर्वेक्षण",
            descriptionEn = "Chhattisgarh Administration, Tribes, Panchayati Raj & Economic Survey",
            examCode = "CGPSC_MAINS",
            sortOrder = 3L,
            isFreeFolder = false,
            priceInr = 99L,
            testCount = 1L,
            visibility = "published",
            createdBy = authorUid
        )
    )

    fun defaultSubjectFolders(authorUid: String = "system_admin"): List<SubjectFolder> = listOf(
        SubjectFolder(
            id = "subj_cg_gs",
            titleHi = "छत्तीसगढ़ सामान्य अध्ययन (CG General Studies)",
            titleEn = "Chhattisgarh General Studies (CG GS)",
            descriptionHi = "इतिहास, भूगोल, जनजातियाँ, लोक कला, संस्कृति एवं साहित्य",
            descriptionEn = "History, Geography, Tribes, Folk Art, Culture & Literature of Chhattisgarh",
            subjectCode = "CG_GS",
            sortOrder = 1L,
            isFreeFolder = true,
            priceInr = 0L,
            testCount = 2L,
            visibility = "published",
            createdBy = authorUid
        ),
        SubjectFolder(
            id = "subj_polity_panchayat",
            titleHi = "भारतीय संविधान एवं छत्तीसगढ़ पंचायती राज",
            titleEn = "Indian Polity & CG Panchayati Raj Act",
            descriptionHi = "संवैधानिक प्रावधान, नगरीय निकाय एवं पंचायती राज अधिनियम 1993",
            descriptionEn = "Constitutional Provisions, Urban Bodies & CG Panchayati Raj Act 1993",
            subjectCode = "POLITY",
            sortOrder = 2L,
            isFreeFolder = true,
            priceInr = 0L,
            testCount = 1L,
            visibility = "published",
            createdBy = authorUid
        ),
        SubjectFolder(
            id = "subj_economy_budget",
            titleHi = "छत्तीसगढ़ आर्थिक सर्वेक्षण एवं बजट",
            titleEn = "Chhattisgarh Economic Survey & Budget",
            descriptionHi = "कृषि, खनिज संसाधन, वन, उद्योग एवं नवीनतम राज्य योजनाएं",
            descriptionEn = "Agriculture, Minerals, Forestry, Industries & Latest State Schemes",
            subjectCode = "ECONOMY",
            sortOrder = 3L,
            isFreeFolder = false,
            priceInr = 99L,
            testCount = 1L,
            visibility = "published",
            createdBy = authorUid
        )
    )

    fun defaultTests(authorUid: String = "system_admin"): List<TestSeriesItem> = listOf(
        TestSeriesItem(
            id = "test_cgpsc_pre_2026_series_1",
            folderType = "exam",
            folderId = "cgpsc_pre_2026_series",
            titleHi = "सीजीपीएससी प्री 2026 टेस्ट सीरीज - फुल मॉक 1",
            titleEn = "CGPSC Pre 2026 Test Series - Full Mock 1",
            topic = "CGPSC Pre 2026 GS Paper-I Complete Syllabus",
            difficulty = "CGPSC_Level",
            durationMinutes = 60L,
            questionLimit = 100L,
            questionCount = 5L,
            marksPerQuestion = 2.0,
            negativeMarking = 0.66,
            isPaid = true,
            priceInr = 99L,
            status = "published",
            createdBy = authorUid
        ),
        TestSeriesItem(
            id = "test_cgpsc_pre_free_1",
            folderType = "exam",
            folderId = "cgpsc_prelims",
            titleHi = "सीजीपीएससी एवं सीजीएसएसबी मॉक टेस्ट 01 (निःशुल्क)",
            titleEn = "CGPSC & CGSSB Mock Test 01 (Free Open Mock)",
            topic = "Chhattisgarh History, Geography, Tribes & Panchayati Raj",
            difficulty = "CGPSC_Level",
            durationMinutes = 15L,
            questionLimit = 10L,
            questionCount = 5L,
            marksPerQuestion = 2.0,
            negativeMarking = 0.66,
            isPaid = false,
            priceInr = 0L,
            validityDays = 180L,
            status = "published",
            createdBy = authorUid
        ),
        TestSeriesItem(
            id = "test_cgpsc_pre_paid_2",
            folderType = "exam",
            folderId = "cgpsc_prelims",
            titleHi = "सीजीपीएससी प्री 2026 टेस्ट सीरीज - प्रीमियम मॉक 02",
            titleEn = "CGPSC Pre 2026 Test Series - Premium Mock 02",
            topic = "Economic Survey, Minerals, Rivers & Constitutional Polity",
            difficulty = "CGPSC_Level",
            durationMinutes = 20L,
            questionLimit = 20L,
            questionCount = 5L,
            marksPerQuestion = 2.0,
            negativeMarking = 0.66,
            isPaid = true,
            priceInr = 99L,
            status = "published",
            createdBy = authorUid
        ),
        TestSeriesItem(
            id = "test_subj_cggs_1",
            folderType = "subject",
            folderId = "subj_cg_gs",
            titleHi = "छत्तीसगढ़ की जनजातियाँ, लोक नृत्य एवं पर्व",
            titleEn = "Tribes, Folk Dances & Festivals of Chhattisgarh",
            topic = "Tribal Culture & Heritage of Chhattisgarh",
            difficulty = "Moderate",
            durationMinutes = 15L,
            questionLimit = 10L,
            questionCount = 5L,
            marksPerQuestion = 2.0,
            negativeMarking = 0.66,
            isPaid = false,
            priceInr = 0L,
            status = "published",
            createdBy = authorUid
        )
    )

    fun defaultQuestions(authorUid: String = "system_admin"): List<BilingualQuestion> {
        val baseQuestions = listOf(
            BilingualQuestion(
                id = "q_cgpre1_1",
                testId = "test_cgpsc_pre_free_1",
                orderIndex = 0L,
                questionHi = "छत्तीसगढ़ राज्य का गठन किस संविधान संशोधन या अधिनियम के अंतर्गत 1 नवंबर 2000 को हुआ था?",
                questionEn = "Under which Act was the state of Chhattisgarh formed on 1 November 2000?",
                optionsHi = listOf(
                    "मध्यप्रदेश पुनर्गठन अधिनियम, 2000",
                    "छत्तीसगढ़ राज्य निर्माण अधिनियम, 1999",
                    "भारतीय राज्य पुनर्गठन अधिनियम, 1956",
                    "84वाँ संविधान संशोधन अधिनियम, 2000"
                ),
                optionsEn = listOf(
                    "Madhya Pradesh Reorganisation Act, 2000",
                    "Chhattisgarh State Formation Act, 1999",
                    "States Reorganisation Act, 1956",
                    "84th Constitutional Amendment Act, 2000"
                ),
                correctOptionIndex = 0L,
                explanationHi = "छत्तीसगढ़ राज्य का गठन 'मध्यप्रदेश पुनर्गठन अधिनियम, 2000' (अधिनियम संख्या 28, वर्ष 2000) के तहत 1 नवंबर 2000 को देश के 26वें राज्य के रूप में हुआ।",
                explanationEn = "Chhattisgarh was carved out as the 26th state of India on 1 November 2000 under the Madhya Pradesh Reorganisation Act, 2000 (Act No. 28 of 2000).",
                subjectTag = "Chhattisgarh Polity & Formation",
                visibility = "published",
                createdBy = authorUid
            ),
            BilingualQuestion(
                id = "q_cgpre1_2",
                testId = "test_cgpsc_pre_free_1",
                orderIndex = 1L,
                questionHi = "छत्तीसगढ़ की जीवनरेखा कही जाने वाली 'महानदी' का उद्गम स्थल कहाँ स्थित है?",
                questionEn = "Where does the 'Mahanadi' river, considered the lifeline of Chhattisgarh, originate?",
                optionsHi = listOf(
                    "सिहावा पर्वत (धमतरी जिला)",
                    "अमरकंटक पठार (गौरेला-पेंड्रा-मरवाही)",
                    "बैलाडीला पहाड़ी (दंतेवाड़ा)",
                    "मैनपाट पठार (सरगुजा)"
                ),
                optionsEn = listOf(
                    "Sihawa Mountain (Dhamtari District)",
                    "Amarkantak Plateau (Gaurela-Pendra-Marwahi)",
                    "Bailadila Hills (Dantewada)",
                    "Mainpat Plateau (Surguja)"
                ),
                correctOptionIndex = 0L,
                explanationHi = "महानदी का उद्गम धमतरी जिले की नगरी तहसील में स्थित सिहावा पर्वत (श्रृंगी ऋषि आश्रम के समीप) से होता है। इसकी कुल लंबाई लगभग 858 किमी है, जिसमें से 286 किमी छत्तीसगढ़ में प्रवाहित होती है।",
                explanationEn = "The Mahanadi River originates from the Sihawa mountains near Shringi Rishi Ashram in Dhamtari district. Its total length is 858 km, flowing 286 km within Chhattisgarh.",
                subjectTag = "Chhattisgarh Geography",
                visibility = "published",
                createdBy = authorUid
            ),
            BilingualQuestion(
                id = "q_cgpre1_3",
                testId = "test_cgpsc_pre_free_1",
                orderIndex = 2L,
                questionHi = "छत्तीसगढ़ पंचायती राज अधिनियम, 1993 के अंतर्गत ग्राम सभा की वर्ष में न्यूनतम कितनी बैठकें आयोजित करना अनिवार्य है?",
                questionEn = "Under the Chhattisgarh Panchayati Raj Act, 1993, what is the minimum number of Gram Sabha meetings mandatory in a year?",
                optionsHi = listOf(
                    "4 बैठकें (जनवरी, अप्रैल, जुलाई एवं अक्टूबर के अतिरिक्त)",
                    "2 बैठकें",
                    "6 बैठकें",
                    "12 मासिक बैठकें"
                ),
                optionsEn = listOf(
                    "4 meetings (Every three months)",
                    "2 meetings",
                    "6 meetings",
                    "12 monthly meetings"
                ),
                correctOptionIndex = 0L,
                explanationHi = "छत्तीसगढ़ पंचायती राज अधिनियम 1993 की धारा 6 के अनुसार प्रत्येक तीन माह में कम से कम एक बैठक अर्थात् वर्ष में न्यूनतम 4 अनिवार्य बैठकें (23 जनवरी, 14 अप्रैल, 20 अगस्त और 2 अक्टूबर के आसपास) आयोजित की जाती हैं।",
                explanationEn = "According to Section 6 of the Chhattisgarh Panchayati Raj Act 1993, there must be at least one meeting every three months, totaling a minimum of 4 mandatory meetings per year.",
                subjectTag = "CG Panchayati Raj",
                visibility = "published",
                createdBy = authorUid
            ),
            BilingualQuestion(
                id = "q_cgpre1_4",
                testId = "test_cgpsc_pre_free_1",
                orderIndex = 3L,
                questionHi = "बस्तर के प्रसिद्ध 'गोंचा पर्व' (रथ यात्रा) में किस जनजाति एवं परंपरा द्वारा 'तुपकी' का प्रयोग किया जाता है?",
                questionEn = "During the famous 'Goncha Festival' (Chariot Festival) of Bastar, 'Tupki' is traditionally used in celebration of which deity?",
                optionsHi = listOf(
                    "भगवान जगन्नाथ की रथ यात्रा में बांस एवं पेंग फल से निर्मित तुपकी",
                    "दंतेश्वरी माई की मड़ई में",
                    "सीतला माता पूजा में",
                    "बूढ़ादेव उत्सव में"
                ),
                optionsEn = listOf(
                    "Lord Jagannath Rath Yatra using bamboo and Peng fruit Tupki",
                    "Danteshwari Mai Madai",
                    "Shitla Mata Puja",
                    "Budhadev Festival"
                ),
                correctOptionIndex = 0L,
                explanationHi = "चालुक्य शासक पुरुषोत्तम देव द्वारा प्रारंभ बस्तर के गोंचा पर्व (आषाढ़ माह) में भगवान जगन्नाथ को सलामी देने के लिए बांस की नली और मालकांगनी (पेंग) के फलों से बनी 'तुपकी' चलाई जाती है।",
                explanationEn = "Initiated by Chalukya ruler Purushottam Dev in Bastar, the Goncha festival in Ashadha features the ceremonial 'Tupki' (bamboo mock-pistol loaded with Peng seeds) to salute Lord Jagannath.",
                subjectTag = "Chhattisgarh Art & Culture",
                visibility = "published",
                createdBy = authorUid
            ),
            BilingualQuestion(
                id = "q_cgpre1_5",
                testId = "test_cgpsc_pre_free_1",
                orderIndex = 4L,
                questionHi = "छत्तीसगढ़ में 'कल्चुरि वंश' की प्रथम राजधानी निम्नलिखित में से कौन-सी थी?",
                questionEn = "Which of the following was the first capital of the Kalachuri dynasty in Chhattisgarh?",
                optionsHi = listOf(
                    "तुम्माण (कोरबा/कटघोरा क्षेत्र)",
                    "रतनपुर (बिलासपुर)",
                    "सिरपुर (महासमुंद)",
                    "आरंग (रायपुर)"
                ),
                optionsEn = listOf(
                    "Tumman (Korba/Katghora region)",
                    "Ratanpur (Bilaspur)",
                    "Sirpur (Mahasamund)",
                    "Arang (Raipur)"
                ),
                correctOptionIndex = 0L,
                explanationHi = "छत्तीसगढ़ में कल्चुरि वंश के संस्थापक कलिंगराज ने 1000 ई. के लगभग 'तुम्माण' को अपनी प्रथम राजधानी बनाया। तत्पश्चात् रत्नदेव प्रथम ने 1050 ई. में रतनपुर को राजधानी स्थापित किया।",
                explanationEn = "Kalingaraj, founder of the Kalachuri branch in Chhattisgarh around 1000 AD, established 'Tumman' as the first capital. Later in 1050 AD, Ratnadeva I shifted the capital to Ratanpur.",
                subjectTag = "Chhattisgarh History",
                visibility = "published",
                createdBy = authorUid
            )
        )

        val paid2026Questions = baseQuestions.mapIndexed { idx, q ->
            q.copy(
                id = "q_cgpre2026_${idx + 1}",
                testId = "test_cgpsc_pre_2026_series_1",
                orderIndex = idx.toLong()
            )
        }

        val paidMock2Questions = baseQuestions.mapIndexed { idx, q ->
            q.copy(
                id = "q_cgpre2_${idx + 1}",
                testId = "test_cgpsc_pre_paid_2",
                orderIndex = idx.toLong()
            )
        }

        val subjectQuestions = baseQuestions.mapIndexed { idx, q ->
            q.copy(
                id = "q_subjcggs_${idx + 1}",
                testId = "test_subj_cggs_1",
                orderIndex = idx.toLong()
            )
        }

        return baseQuestions + paid2026Questions + paidMock2Questions + subjectQuestions
    }

    fun defaultCurrentAffairs(authorUid: String = "system_admin"): List<CurrentAffairItem> {
        val nowTs = Timestamp.now()
        return listOf(
            CurrentAffairItem(
                id = "ca_cg_1",
                category = "chhattisgarh",
                headlineHi = "छत्तीसगढ़ आर्थिक सर्वेक्षण एवं राज्य बजट: कृषि व ग्रामीण अर्थव्यवस्था में उच्च वृद्धि",
                headlineEn = "Chhattisgarh Economic Survey & State Budget: Strong Growth in Agriculture & Rural Economy",
                summaryHi = "छत्तीसगढ़ राज्य के नवीनतम आर्थिक सर्वेक्षण के अनुसार सकल राज्य घरेलू उत्पाद (GSDP) में कृषि, वानिकी और सेवा क्षेत्र का प्रमुख योगदान रहा है। धान उपार्जन एवं कृषक उन्नति योजना से ग्रामीण अर्थव्यवस्था सुदृढ़ हुई है।",
                summaryEn = "According to Chhattisgarh's latest Economic Survey, Agriculture, Forestry, and the Service sector drove strong GSDP growth, bolstered by paddy procurement and the Krishak Unnati Yojana.",
                examKeyPointsHi = listOf(
                    "कृषक उन्नति योजना के अंतर्गत प्रति एकड़ 21 क्विंटल धान की खरीदी एवं ₹3100 प्रति क्विंटल समर्थन मूल्य।",
                    "महतारी वंदन योजना के तहत पात्र महिलाओं को प्रतिमाह ₹1000 की प्रत्यक्ष आर्थिक सहायता।",
                    "लघु वनोपज संग्रहण में छत्तीसगढ़ देश के अग्रणी राज्यों में शामिल (तेंदूपत्ता संग्रहण पारिश्रमिक ₹5500 प्रति मानक बोरा)।"
                ),
                examKeyPointsEn = listOf(
                    "Under Krishak Unnati Yojana, paddy procurement up to 21 quintals/acre at ₹3,100 per quintal.",
                    "Mahtari Vandan Yojana provides ₹1,000 monthly Direct Benefit Transfer (DBT) to eligible women.",
                    "Chhattisgarh remains a national leader in Minor Forest Produce collection (Tendu leaf rate ₹5,500 per standard bag)."
                ),
                sourceName = "DPR Chhattisgarh",
                sourceUrl = "https://dprcg.gov.in",
                dateLabel = "2026-02-28",
                visibility = "published",
                sourceModule = "admin_curated",
                authorUid = authorUid,
                createdAt = nowTs,
                updatedAt = nowTs
            ),
            CurrentAffairItem(
                id = "ca_cg_2",
                category = "chhattisgarh",
                headlineHi = "नियद नेल्लानार योजना एवं बस्तर ओलंपिक: जनजातीय विकास में नया कीर्तिमान",
                headlineEn = "Niyad Nellanar Scheme & Bastar Olympics: Milestone in Tribal Development",
                summaryHi = "छत्तीसगढ़ शासन की 'नियद नेल्लानार' (आपका अच्छा गाँव) योजना के अंतर्गत बस्तर संभाग के दूरस्थ वनांचल ग्रामों में 5 किमी की परिधि में मूलभूत सुविधाएं (आवास, स्वास्थ्य, पेयजल, सड़क, शिक्षा) पहुँचाई जा रही हैं।",
                summaryEn = "Under Chhattisgarh Government's 'Niyad Nellanar' (Your Good Village) initiative, saturation of basic amenities (housing, health, drinking water, roads, education) is being achieved within a 5 km radius in remote Bastar villages.",
                examKeyPointsHi = listOf(
                    "'नियद नेल्लानार' का गोंडी/हल्बी भाषा में अर्थ है — 'आपका अच्छा गाँव'।",
                    "बस्तर संभाग के 7 जिलों में बस्तर ओलंपिक में 1.65 लाख से अधिक जनजातीय युवाओं की सहभागिता।",
                    "कांगेर घाटी के 'धुड़मारास' ग्राम को संयुक्त राष्ट्र विश्व पर्यटन संगठन (UN Tourism) द्वारा सर्वश्रेष्ठ पर्यटन ग्राम उन्नयन कार्यक्रम में चुना गया।"
                ),
                examKeyPointsEn = listOf(
                    "'Niyad Nellanar' translates to 'Your Good Village' in local Bastar dialect.",
                    "Over 1.65 lakh youth participated across 7 districts in the Bastar Olympics.",
                    "Dhudmaras village in Kanger Valley was selected by UN Tourism for its Best Tourism Village Upgrade Programme."
                ),
                sourceName = "DPR Chhattisgarh",
                sourceUrl = "https://dprcg.gov.in",
                dateLabel = "2026-02-25",
                visibility = "published",
                sourceModule = "admin_curated",
                authorUid = authorUid,
                createdAt = nowTs,
                updatedAt = nowTs
            ),
            CurrentAffairItem(
                id = "ca_nat_1",
                category = "national",
                headlineHi = "इसरो (ISRO) गगनयान एवं आगामी अंतरिक्ष मिशनों की प्रमुख उपलब्धियाँ",
                headlineEn = "ISRO Gaganyaan & Upcoming Space Exploration Milestones",
                summaryHi = "भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) ने गगनयान मानव अंतरिक्ष उड़ान कार्यक्रम, भारतीय अंतरिक्ष स्टेशन (BAS) और चंद्रयान-4 नमूना वापसी मिशन के लिए प्रमुख तकनीकी परीक्षण पूरे किए हैं।",
                summaryEn = "The Indian Space Research Organisation (ISRO) completed key technical milestones for the Gaganyaan human spaceflight program, Bharatiya Antariksh Station (BAS), and the Chandrayaan-4 lunar sample-return mission.",
                examKeyPointsHi = listOf(
                    "भारतीय अंतरिक्ष स्टेशन (BAS) की प्रथम इकाई वर्ष 2028 तक स्थापित करने का लक्ष्य।",
                    "LVM3 (बाहुबली रॉकेट) को मानव-रेटेड प्रक्षेपण यान (HLVM3) के रूप में प्रमाणित किया गया।",
                    "नाविक (NavIC) स्वदेशी नेविगेशन प्रणाली के विस्तार हेतु NVS-02 उपग्रह का सफल प्रक्षेपण।"
                ),
                examKeyPointsEn = listOf(
                    "First module of Bharatiya Antariksh Station (BAS) targeted for launch by 2028.",
                    "LVM3 launch vehicle human-rated as HLVM3 for the Gaganyaan crewed mission.",
                    "Successful deployment of NVS-Series satellites to strengthen India's indigenous NavIC constellation."
                ),
                sourceName = "PIB India / ISRO",
                sourceUrl = "https://pib.gov.in",
                dateLabel = "2026-02-26",
                visibility = "published",
                sourceModule = "admin_curated",
                authorUid = authorUid,
                createdAt = nowTs,
                updatedAt = nowTs
            ),
            CurrentAffairItem(
                id = "ca_nat_2",
                category = "national",
                headlineHi = "प्रधानमंत्री जनजातीय उन्नत ग्राम अभियान (PM-JUGA) एवं संविधान के 75 वर्ष",
                headlineEn = "PM Janjatiya Unnat Gram Abhiyan (PM-JUGA) & 75 Years of the Indian Constitution",
                summaryHi = "केंद्र सरकार द्वारा जनजातीय बहुल गाँवों में बुनियादी ढांचे, स्वास्थ्य, शिक्षा और आजीविका के 100% संतृप्तिकरण (Saturation) के लिए 'धरती आबा जनजातीय ग्राम उत्कर्ष अभियान' संचालित किया जा रहा है।",
                summaryEn = "The Union Government launched the Dharti Aaba Janjatiya Gram Utkarsh Abhiyan to achieve 100% saturation of infrastructure, healthcare, education, and livelihood schemes in tribal-majority villages.",
                examKeyPointsHi = listOf(
                    "अभियान के तहत देश के 63,000 से अधिक जनजातीय बहुल गाँवों के 5 करोड़ से अधिक जनजातीय नागरिकों को लाभ।",
                    "17 मंत्रालयों की 25 प्रमुख योजनाओं का समन्वित क्रियान्वयन।",
                    "पीएम-जनमन (PM-JANMAN) योजना विशेष रूप से 75 विशेष पिछड़ी जनजातियों (PVTGs) के उत्थान हेतु समर्पित।"
                ),
                examKeyPointsEn = listOf(
                    "Covers over 63,000 tribal-majority villages benefiting more than 5 crore tribal citizens across India.",
                    "Converges 25 key interventions implemented across 17 Union Ministries.",
                    "Complements PM-JANMAN, which focuses specifically on 75 Particularly Vulnerable Tribal Groups (PVTGs)."
                ),
                sourceName = "PIB India",
                sourceUrl = "https://pib.gov.in",
                dateLabel = "2026-02-24",
                visibility = "published",
                sourceModule = "admin_curated",
                authorUid = authorUid,
                createdAt = nowTs,
                updatedAt = nowTs
            ),
            CurrentAffairItem(
                id = "ca_intl_1",
                category = "international",
                headlineHi = "ब्रिक्स (BRICS+) विस्तार एवं ग्लोबल साउथ में भारत की रणनीतिक भूमिका",
                headlineEn = "BRICS+ Expansion & India's Strategic Leadership in the Global South",
                summaryHi = "विस्तारित ब्रिक्स (BRICS+) समूह में नए सदस्य देशों और भागीदार राष्ट्रों के जुड़ने से वैश्विक सकल घरेलू उत्पाद और व्यापार में उभरती अर्थव्यवस्थाओं की हिस्सेदारी बढ़ी है। भारत वर्ष 2026 के ब्रिक्स शिखर सम्मेलन की अध्यक्षता कर रहा है।",
                summaryEn = "With the expansion of BRICS+ to include new member states and partner countries, emerging economies hold a larger share of global GDP and trade, with India hosting the 2026 BRICS Presidency.",
                examKeyPointsHi = listOf(
                    "ब्रिक्स के संस्थापक देश: ब्राजील, रूस, भारत, चीन एवं दक्षिण अफ्रीका (2010 में शामिल)।",
                    "न्यू डेवलपमेंट बैंक (NDB) का मुख्यालय शंघाई (चीन) में स्थित है।",
                    "भारत ने डिजिटल पब्लिक इंफ्रास्ट्रक्चर (UPI, इंडिया स्टैक) को ग्लोबल साउथ देशों के साथ साझा करने का समझौता किया।"
                ),
                examKeyPointsEn = listOf(
                    "Founding members: Brazil, Russia, India, China, and South Africa (joined in 2010).",
                    "New Development Bank (NDB) is headquartered in Shanghai, China.",
                    "India signed agreements to share Digital Public Infrastructure (UPI, India Stack) with Global South nations."
                ),
                sourceName = "MEA India",
                sourceUrl = "https://mea.gov.in",
                dateLabel = "2026-02-22",
                visibility = "published",
                sourceModule = "admin_curated",
                authorUid = authorUid,
                createdAt = nowTs,
                updatedAt = nowTs
            ),
            CurrentAffairItem(
                id = "ca_intl_2",
                category = "international",
                headlineHi = "अंतरराष्ट्रीय सौर गठबंधन (ISA) एवं वैश्विक हरित हाइड्रोजन पहल",
                headlineEn = "International Solar Alliance (ISA) & Global Green Hydrogen Initiatives",
                summaryHi = "भारत और फ्रांस द्वारा सह-स्थापित अंतरराष्ट्रीय सौर गठबंधन (ISA) ने सौर ऊर्जा निवेश और हरित ऊर्जा संक्रमण को गति देने के लिए नए वैश्विक फंड और 'वन सन, वन वर्ल्ड, वन ग्रिड' (OSOWOG) रोडमैप जारी किया है।",
                summaryEn = "Co-founded by India and France, the International Solar Alliance (ISA) advanced the 'One Sun, One World, One Grid' (OSOWOG) roadmap and solar investment guarantees for developing nations.",
                examKeyPointsHi = listOf(
                    "अंतरराष्ट्रीय सौर गठबंधन (ISA) का मुख्यालय गुरुग्राम (हरियाणा, भारत) में स्थित है।",
                    "ISA की स्थापना वर्ष 2015 में पेरिस जलवायु सम्मेलन (COP-21) के दौरान हुई थी।",
                    "भारत का वर्ष 2030 तक 500 गीगावॉट (GW) गैर-जीवाश्म ईंधन ऊर्जा क्षमता प्राप्त करने का लक्ष्य (पंचामृत संकल्प)।"
                ),
                examKeyPointsEn = listOf(
                    "Headquarters of the International Solar Alliance (ISA) is located in Gurugram, Haryana, India.",
                    "ISA was launched at COP-21 in Paris in 2015.",
                    "India targets 500 GW of non-fossil fuel electricity capacity by 2030 under its Panchamrit commitments."
                ),
                sourceName = "MEA / MNRE",
                sourceUrl = "https://isa.int",
                dateLabel = "2026-02-20",
                visibility = "published",
                sourceModule = "admin_curated",
                authorUid = authorUid,
                createdAt = nowTs,
                updatedAt = nowTs
            )
        )
    }

    fun defaultBroadcastNotifications(authorUid: String = "system_admin"): List<BroadcastNotification> {
        val nowTs = Timestamp.now()
        return listOf(
            BroadcastNotification(
                id = "notif_pinned_welcome",
                titleHi = "महत्वपूर्ण सूचना: सीजीपीएससी प्री 2026 टेस्ट सीरीज (₹99) एवं व्हाट्सएप सहायता",
                titleEn = "Pinned Notice: CGPSC Pre 2026 Test Series (₹99) & WhatsApp Support",
                messageHi = "सभी अभ्यर्थियों का CGpedia (CGPSC & CGSSB) में स्वागत है! सीजीपीएससी प्री 2026 की पूर्ण द्विभाषी टेस्ट सीरीज मात्र ₹99 में उपलब्ध है। भुगतान या टेस्ट अनलॉक हेतु व्हाट्सएप 9238810070 पर संपर्क करें।",
                messageEn = "Welcome to CGpedia (CGPSC & CGSSB)! The complete Bilingual Test Series for CGPSC Pre 2026 is live at ₹99. For instant activation or support, message WhatsApp 9238810070.",
                mediaType = "pdf",
                mediaUrl = "https://psc.cg.gov.in",
                mediaTitle = "CGPSC_CGSSB_2026_Schedule_Brochure.pdf",
                isPinned = true,
                visibility = "published",
                createdBy = authorUid,
                createdAt = nowTs,
                updatedAt = nowTs
            ),
            BroadcastNotification(
                id = "notif_ca_quiz_update",
                titleHi = "नया फीचर: समसामयिकी (Current Affairs) 24-घंटे स्टोरीज एवं इंस्टेंट क्विज़",
                titleEn = "New Feature: 24-Hour Current Affairs Stories & Instant Quiz",
                messageHi = "अब प्रतिदिन के छत्तीसगढ़, राष्ट्रीय एवं अंतरराष्ट्रीय करेंट अफेयर्स 24 घंटे की स्टोरीज में पढ़ें और शीर्ष दाएं कोने में 'Quiz' बटन दबाकर तुरंत प्रैक्टिस क्विज़ हल करें।",
                messageEn = "Read daily Chhattisgarh, National & International Current Affairs in 24-hour Stories and tap the 'Quiz' button in the top-right corner of Current Affairs to attempt an instant quiz.",
                mediaType = "none",
                mediaUrl = "",
                mediaTitle = "",
                isPinned = false,
                visibility = "published",
                createdBy = authorUid,
                createdAt = nowTs,
                updatedAt = nowTs
            )
        )
    }

    fun defaultUpcomingTests(authorUid: String = "system_admin"): List<UpcomingTestItem> {
        val nowTs = Timestamp.now()
        return listOf(
            UpcomingTestItem(
                id = "upcoming_cgpsc_pre_mega_2",
                titleHi = "सीजीपीएससी प्री 2026 - राज्य स्तरीय मेगा मॉक टेस्ट 02",
                titleEn = "CGPSC Pre 2026 - State Level Mega Mock Test 02",
                examCategory = "CGPSC & CGSSB",
                scheduledDateLabel = "Sunday, 15 March 2026 • 10:00 AM",
                syllabusSummaryHi = "छत्तीसगढ़ का इतिहास, जनजातियाँ, पंचायती राज, आर्थिक सर्वेक्षण 2025-26 एवं भारतीय संविधान (100 प्रश्न • 200 अंक)",
                syllabusSummaryEn = "Chhattisgarh History, Tribes, Panchayati Raj, Economic Survey 2025-26 & Indian Polity (100 Questions • 200 Marks)",
                isPaid = true,
                priceInr = 99L,
                validityDays = 180L,
                visibility = "published",
                createdBy = authorUid,
                createdAt = nowTs,
                updatedAt = nowTs
            ),
            UpcomingTestItem(
                id = "upcoming_cgssb_hostel_warden",
                titleHi = "सीजीएसएसबी (व्यापम) हॉस्टल वार्डन एवं पटवारी फुल मॉक टेस्ट",
                titleEn = "CGSSB (Vyapam) Hostel Warden & Patwari Full Mock Test",
                examCategory = "CGPSC & CGSSB",
                scheduledDateLabel = "Wednesday, 18 March 2026 • 06:00 PM",
                syllabusSummaryHi = "कंप्यूटर ज्ञान, छत्तीसगढ़ सामान्य ज्ञान, सामान्य गणित, हिंदी एवं अंग्रेजी व्याकरण",
                syllabusSummaryEn = "Computer Knowledge, Chhattisgarh GK, General Mathematics, Hindi & English Grammar",
                isPaid = false,
                priceInr = 0L,
                validityDays = 365L,
                visibility = "published",
                createdBy = authorUid,
                createdAt = nowTs,
                updatedAt = nowTs
            )
        )
    }
}
