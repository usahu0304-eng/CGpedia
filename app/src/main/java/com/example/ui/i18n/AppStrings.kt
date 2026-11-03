package com.example.ui.i18n

/**
 * Dynamic UI Localization for CGpedia:
 * - Default App UI Language: English ("en")
 * - Optional App UI Language: Hindi ("hi")
 * NOTE: Inside the Bilingual Test Engine, questions & options ALWAYS render strictly:
 * 1st Language: Hindi (Devanagari)
 * 2nd Language: English (directly below Hindi)
 */
data class CgUiStrings(
    val isHindi: Boolean,
    val appTitle: String,
    val appSubtitle: String,
    val anthemSubtitle: String,
    val tabHome: String,
    val tabCurrentAffairs: String,
    val tabSaved: String,
    val tabSettings: String,
    val tabAdmin: String,
    val examWiseFolderTitle: String,
    val examWiseFolderDesc: String,
    val subjectWiseFolderTitle: String,
    val subjectWiseFolderDesc: String,
    val freeBadge: String,
    val paidLockedBadge: String,
    val unlockedBadge: String,
    val startTestBtn: String,
    val unlockTestBtn: String,
    val caTabChhattisgarh: String,
    val caTabNational: String,
    val caTabInternational: String,
    val caAutoPipelineLabel: String,
    val caRefreshGroundedBtn: String,
    val settingsTitle: String,
    val langToggleLabel: String,
    val editProfileLabel: String,
    val purchasesHistoryLabel: String,
    val darkModeLabel: String,
    val notificationsLabel: String,
    val savedOfflineLabel: String,
    val supportTelegramPrivacyLabel: String,
    val signOutLabel: String
)

object AppStrings {
    val English = CgUiStrings(
        isHindi = false,
        appTitle = "CGpedia",
        appSubtitle = "CGPSC & CGSSB",
        anthemSubtitle = "Official CGpedia Channel Anthem",
        tabHome = "Test Series",
        tabCurrentAffairs = "Current Affairs",
        tabSaved = "Saved",
        tabSettings = "Settings",
        tabAdmin = "Admin",
        examWiseFolderTitle = "Exam-Wise Test Series",
        examWiseFolderDesc = "CGPSC Pre 2026 Test Series (₹99), CGPSC Mains & CGSSB / Vyapam",
        subjectWiseFolderTitle = "Subject-Wise Test Series",
        subjectWiseFolderDesc = "Chhattisgarh GS, Polity, History, Economy, Geography & Aptitude",
        freeBadge = "FREE",
        paidLockedBadge = "PAID • LOCKED",
        unlockedBadge = "UNLOCKED",
        startTestBtn = "Attempt Bilingual Test",
        unlockTestBtn = "Unlock Premium Test",
        caTabChhattisgarh = "Chhattisgarh",
        caTabNational = "National",
        caTabInternational = "International",
        caAutoPipelineLabel = "Official Verified Digest • DPR Chhattisgarh & PIB",
        caRefreshGroundedBtn = "Admin Sync News",
        settingsTitle = "Student Settings & Preferences",
        langToggleLabel = "App Interface Language",
        editProfileLabel = "Edit Student Profile & Target Exam",
        purchasesHistoryLabel = "My Purchased Tests & Payment History",
        darkModeLabel = "Dark Mode Theme",
        notificationsLabel = "Push Notification Preferences",
        savedOfflineLabel = "Saved / Bookmarked Questions & Offline Cache",
        supportTelegramPrivacyLabel = "Help, WhatsApp Support (9238810070) & Privacy Policy",
        signOutLabel = "Sign Out"
    )

    val Hindi = CgUiStrings(
        isHindi = true,
        appTitle = "CGpedia",
        appSubtitle = "CGPSC & CGSSB",
        anthemSubtitle = "सीजीपीडिया आधिकारिक चैनल एंथम",
        tabHome = "टेस्ट सीरीज",
        tabCurrentAffairs = "समसामयिकी",
        tabSaved = "सहेजे गए",
        tabSettings = "सेटिंग्स",
        tabAdmin = "एडमिन",
        examWiseFolderTitle = "परीक्षा-वार टेस्ट सीरीज (Exam-Wise)",
        examWiseFolderDesc = "सीजीपीएससी प्री 2026 टेस्ट सीरीज (₹99), मेंस एवं सीजीएसएसबी / व्यापम",
        subjectWiseFolderTitle = "विषय-वार टेस्ट सीरीज (Subject-Wise)",
        subjectWiseFolderDesc = "छत्तीसगढ़ सामान्य अध्ययन, संविधान, इतिहास, अर्थव्यवस्था, भूगोल एवं सीसैट",
        freeBadge = "निःशुल्क (FREE)",
        paidLockedBadge = "सशुल्क • लॉक्ड",
        unlockedBadge = "अनलॉक्ड",
        startTestBtn = "द्विभाषी टेस्ट प्रारंभ करें",
        unlockTestBtn = "प्रीमियम टेस्ट अनलॉक करें",
        caTabChhattisgarh = "छत्तीसगढ़",
        caTabNational = "राष्ट्रीय",
        caTabInternational = "अंतरराष्ट्रीय",
        caAutoPipelineLabel = "आधिकारिक सत्यापित समाचार • PIB एवं DPR छत्तीसगढ़",
        caRefreshGroundedBtn = "एडमिन समाचार सिंक",
        settingsTitle = "अभ्यर्थी सेटिंग्स एवं प्राथमिकताएं",
        langToggleLabel = "ऐप इंटरफ़ेस भाषा (App Language)",
        editProfileLabel = "प्रोफ़ाइल एवं लक्ष्य परीक्षा संपादित करें",
        purchasesHistoryLabel = "खरीदे गए टेस्ट एवं भुगतान इतिहास",
        darkModeLabel = "डार्क मोड थीम",
        notificationsLabel = "पुश नोटिफिकेशन प्राथमिकताएं",
        savedOfflineLabel = "बुकमार्क प्रश्न एवं ऑफ़लाइन डाउनलोड",
        supportTelegramPrivacyLabel = "सहायता, WhatsApp (9238810070) एवं गोपनीयता नीति",
        signOutLabel = "लॉग आउट करें"
    )

    fun forCode(code: String): CgUiStrings = if (code == "hi") Hindi else English
}
