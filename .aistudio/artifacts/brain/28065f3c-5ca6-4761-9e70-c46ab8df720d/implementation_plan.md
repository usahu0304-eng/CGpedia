# Question Bank — Hindi Devanagari Detection, File Reading, Auto-Categorisation & Post-Upload Fixes

यह प्लान केवल **Question Bank** में फ़ाइल को पढ़ने (File Reading), **हिन्दी देवनागरी (Devanagari)** को सही ढंग से पहचानने, **Auto-Categorisation (Subject → Topic → Subtopic)** को सटीक बनाने, और **फ़ाइल अपलोड के बाद (Post-Upload Preview & Import)** आने वाली समस्याओं को ठीक करने के लिए है। इसके अतिरिक्त ऐप के किसी अन्य हिस्से में कोई बदलाव नहीं किया जाएगा।

---

## User Review & Critical Findings (जाँच में मिली मुख्य समस्याएं)

> [!IMPORTANT]
> कोड की गहन जाँच करने पर आपकी तीनों शंकाएं (**फ़ाइल पढ़ने में**, **हिन्दी देवनागरी डिटेक्ट करने में**, **कैटेगराइज़ करने में**, और **अपलोड के बाद की प्रक्रिया में**) बिल्कुल सही पाई गईं। नीचे मुख्य कारण और उनके समाधान दिए गए हैं:

- **1. हिन्दी देवनागरी (Devanagari) डिटेक्ट करने में समस्या (सबसे मुख्य कारण):**
  - **हिन्दी मात्राओं (`ा, ि, ी, ु, ू, े, ै, ो, ौ, ं, ्`) का कट जाना:** टेक्स्ट नॉर्मलाइज़ेशन और PDF स्ट्रीम क्लीनर में `/[^\p{L}\p{N}\s]/gu` रेगेक्स लगा था। यूनिकोड (Unicode) में हिन्दी के स्वर-चिह्न (मात्राएं) `\p{L}` (Letters) में नहीं बल्कि **`\p{M}` (Combining Marks)** में आते हैं। `\p{M}` न होने के कारण हर हिन्दी शब्द की मात्राएं हटकर स्पेस बन रही थीं (जैसे `"छत्तीसगढ़ की राजधानी"` → `"छत त सगढ क र जध न"`), जिससे हिन्दी टेक्स्ट पहचानने, डुप्लीकेट मिलाने और PDF पढ़ने में गड़बड़ी हो रही थी।
  - **हिन्दी विकल्प `(अ), (ब), (स), (द)` और `(क), (ख), (ग), (घ)` का छूट जाना:** विकल्प पहचानने वाले रेगेक्स में `[अ-द]` लिखा था। यूनिकोड क्रम में `'द'` (`U+0926`) के बाद `'ब'` (`U+092C`) और `'स'` (`U+0938`) आते हैं! इसलिए `[अ-द]` रेंज **`(ब)` और `(स)` तथा `(क), (ख), (ग), (घ)` को कभी पहचान ही नहीं पा रही थी**, जिससे अपलोड के बाद विकल्प B और C गायब (`Missing Answer Options`) दिखते थे।
  - **देवनागरी अंकों (`१, २, ३, ४...`) और PDF CMap फॉन्ट का सपोर्ट न होना:** हिन्दी प्रश्नपत्रों में `प्रश्न १.`, `२)` या उत्तर कुंजी में `१-अ, २-ब` होने पर `\d` उन्हें नहीं पहचान पाता था, और PDF.js में हिन्दी CIDFont/Identity-H फॉन्ट्स के लिए `cMapUrl` कॉन्फ़िगर नहीं था।

- **2. अपलोड की गई फ़ाइल पढ़ने (File Reading & Answer Parsing) में समस्या:**
  - **UTF-16 (Excel Unicode CSV) और BOM एनकोडिंग:** Excel से सेव की गई कई हिन्दी CSV फ़ाइलें `UTF-16LE/BE` में होती हैं, जिन्हें केवल `UTF-8` मानकर पढ़ने से अक्षर खराब हो जाते हैं।
  - **उत्तर कॉलम (`correctIndex` / `answer`) के अलग-अलग फ़ॉर्मेट:** कई फ़ाइलों में सही उत्तर `0, 1, 2, 3` के बजाय `1, 2, 3, 4` (1-आधारित), `(A), (B), (C), (D)`, हिन्दी में `अ, ब, स, द` / `क, ख, ग, घ`, या सीधे **सही विकल्प का पूरा टेक्स्ट** (जैसे `"रायपुर"`) लिखा होता है, जिन्हें सिस्टम `Invalid correctIndex` बताकर रिजेक्ट कर रहा था।

- **3. प्रश्नों को Categorise (Subject → Topic → Subtopic) करने में समस्या:**
  - **CSV/JSON में Auto-Categorisation का न चलना:** ऑटो-कैटेगराइज़ेशन केवल PDF पर चल रहा था। यदि किसी CSV या JSON फ़ाइल में Subject या Topic खाली या सामान्य (`General`) हो, तो वह हर प्रश्न को डिफ़ॉल्ट रूप से `"History of Chhattisgarh"` बना देता था।
  - **Subject मिलने पर भी Topic न मिलने से `Needs Categorisation` में अटकना:** जब किसी प्रश्न में Subject (जैसे `सामान्य हिन्दी`, `गणित`, `छत्तीसगढ़ सामान्य ज्ञान`, `संविधान`) के कीवर्ड मिल जाते थे परंतु कोई बारीक Topic कीवर्ड मैच नहीं होता था, तो सिस्टम पूरे प्रश्न को `Needs Categorisation` (20% confidence) में डाल देता था।

- **4. फ़ाइल अपलोड करने के बाद (Post-Upload Preview & Save) होने वाली दिक्कतें:**
  - **बिना Answer Key वाले PDF प्रश्नों का सीधे Reject (`❌ REJECTED`) हो जाना:** जब यूज़र पहले केवल Question Paper PDF अपलोड करता था (जिसमें साथ में उत्तर न लिखे हों), तो सभी प्रश्न `Missing Correct Answer` एरर के कारण लाल रंग में `REJECTED` दिखते थे और सेव करने पर छोड़ दिए जाते थे।
  - **Preview Card पर सीधे उत्तर (`A / B / C / D`) चुनने की सुविधा न होना:** किसी प्रश्न का सही उत्तर बदलने के लिए हर बार पूरा मोडल खोलना पड़ता था।
  - **Inline Edit (`✏️ Fix Inline`) मोडल में एकल-भाषा (सिर्फ़ हिन्दी) प्रश्न सेव न होना:** प्रीव्यू में किसी हिन्दी प्रश्न की कैटेगरी या उत्तर सुधारते समय मोडल दोनों भाषाओं (Hindi + English) के भरे होने की शर्त लगाकर सेव करने से रोक देता था।

---

## 1. Overview & Core Concept

- **What It Does**: Question Bank के फ़ाइल अपलोड इंजन को हिन्दी देवनागरी (मात्राएं, विकल्प `अ/ब/स/द`, `क/ख/ग/घ`, देवनागरी अंक `०-९`, और PDF CMap फॉन्ट्स), स्मार्ट `Subject → Topic → Subtopic` ऑटो-कैटेगराइज़ेशन, और पोस्ट-अपलोड प्रीव्यू वर्कबेंच के साथ पूरी तरह सटीक और एरर-मुक्त बनाता है।
- **Target Audience**: प्लेटफ़ॉर्म के Owner Admin (`usahu0304@gmail.com`) और अधिकृत एडमिन स्टाफ।
- **Key Value**: कोई भी हिन्दी, अंग्रेज़ी या द्विभाषी (Bilingual) CSV, JSON या PDF फ़ाइल अपलोड करने पर अक्षर या मात्राएं नहीं टूटेंगी, सभी 4 विकल्प सही निकलेंगे, प्रश्न अपने सही Subject व Topic में वर्गीकृत होंगे, और अपलोड के बाद प्रीव्यू से 1-क्लिक में वेरीफाई व सेव हो सकेंगे।

---

## 2. User Experience & Post-Upload Workflow

- **Step 1 — File Selection & Encoding-Safe Reading**:
  - `.csv`, `.json`, `.pdf`, या `.txt` फ़ाइल चुनते ही सिस्टम बाइट-लेवल पर `UTF-8`, `UTF-16LE`, `UTF-16BE` या PDF स्ट्रीम (`cMapPacked: true` + `FlateDecode` + UTF-16BE hex operator decoding) को पहचानकर बिना कोई मात्रा (`\p{M}`) खोए साफ़ देवनागरी टेक्स्ट निकालेगा।
  - फ़ाइल लोड होते ही पेज अपने-आप **Import Preview Workbench** तक स्मूथ-स्क्रॉल करेगा ताकि एडमिन को तुरंत प्रीव्यू दिखे।
- **Step 2 — Smart Hindi Option & Answer Key Detection**:
  - PDF या टेक्स्ट में `(अ) (ब) (स) (द)`, `(क) (ख) (ग) (घ)`, `(A) (B) (C) (D)`, या `(1) (2) (3) (4)` — चाहे एक ही लाइन में हों या अलग-अलग लाइनों में — चारों विकल्प सटीक रूप से अलग किए जाएंगे।
  - `correctIndex` में `0–3`, `1–4`, `A–D`, `अ/ब/स/द`, `क/ख/ग/घ`, या विकल्प का टेक्स्ट होने पर सही विकल्प (`0–3`) अपने-आप मैच हो जाएगा।
- **Step 3 — Post-Upload Preview Cards with 1-Click Controls**:
  - यदि किसी PDF में अभी Answer Key नहीं जुड़ी है, तो प्रश्नों को `❌ REJECTED` करके हटाने के बजाय **`⏳ Unverified (Answer Key Pending)`** के रूप में रखा जाएगा।
  - हर Preview Card पर विकल्पों के साथ **1-Click Correct Answer Selector (`Set Answer: [A] [B] [C] [D]`)** होगा जिससे बिना मोडल खोले सीधे कार्ड पर ही सही उत्तर चुना जा सकेगा।
  - `✏️ Change Category / Edit` मोडल में यदि प्रश्न केवल हिन्दी या केवल अंग्रेज़ी में है, तो सेव करते समय दूसरी भाषा अपने-आप भर जाएगी और कोई रुकावट नहीं आएगी।

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Preserve Unicode Combining Marks (`\p{M}`) Everywhere**
  - *Chosen Approach*: सभी टेक्स्ट नॉर्मलाइज़ेशन, डुप्लीकेट सिमिलैरिटी और PDF टेक्स्ट एक्सट्रैक्शन रेगेक्स में `\p{L}\p{M}\p{N}` का उपयोग करना।
  - *Why*: देवनागरी की सभी मात्राएं (`ा` से `ौ`), अनुस्वार (`ं`), चंद्रबिंदु (`ँ`), विसर्ग (`ः`), हलन्त (`्`) और नुक्ता (`़`) सुरक्षित रहते हैं।
- **Decision 2: Comprehensive Hindi & English Auto-Categorisation Across PDF, CSV & JSON**
  - *Chosen Approach*: विस्तृत हिन्दी एवं अंग्रेज़ी कीवर्ड डिक्शनरी के साथ `autoCategorizeQuestionFromMaster` को PDF के साथ-साथ उन CSV/JSON प्रश्नों पर भी चलाना जहाँ Subject या Topic खाली/सामान्य है; और Subject मिलने पर उसके प्राथमिक Topic को असाइन करना।
  - *Why*: इससे प्रश्न अनावश्यक रूप से `Needs Categorisation` में नहीं अटकते और न ही सभी प्रश्नों पर एक ही गलत डिफ़ॉल्ट टॉपिक लगता है।
- **Decision 3: Non-Destructive Handling of Missing PDF Answer Keys**
  - *Chosen Approach*: जिन PDF प्रश्नों की Answer Key अभी मैच नहीं हुई है, उन्हें एरर में रिजेक्ट करने के बजाय `Unverified` स्टेटस और चेतावनी (`Warning`) के साथ इम्पोर्ट करने की अनुमति देना + प्रीव्यू कार्ड पर ही `A / B / C / D` बटन देना।
  - *Why*: एडमिन के मेहनत से अपलोड किए गए प्रश्न कभी डिलीट या रिजेक्ट नहीं होंगे।

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   QUESTION BANK FILE UPLOAD & PARSING ENGINE                │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. File Reader & Decoder (CSV / JSON / PDF / Answer Key)                   │
│     ├─ Auto-BOM Detection: UTF-8 / UTF-16LE / UTF-16BE                      │
│     ├─ PDF.js Loader with CMap Support (Identity-H Devanagari Fonts)        │
│     └─ FlateDecode + UTF-16BE Hex (<FEFF...>) & Literal (Tj/TJ) Fallback    │
│                                    │                                        │
│                                    ▼                                        │
│  2. Devanagari & Structure Parser                                           │
│     ├─ Unicode Matra-Safe Normalization (/[^\p{L}\p{M}\p{N}\s]/gu)          │
│     ├─ Devanagari Digits Converter (०-९ ──► 0-9)                            │
│     ├─ Hindi Option Parser: (अ/ब/स/द), (क/ख/ग/घ), (A/B/C/D), (1/2/3/4)      │
│     └─ Smart Answer Resolver: 0-3 | 1-4 | A-D | अ-द | क-घ | Option Text     │
│                                    │                                        │
│                                    ▼                                        │
│  3. Hierarchical Auto-Categorisation (Exam → Subject → Topic → Subtopic)    │
│     ├─ Expanded Hindi + English Keyword Scoring across 13 Subjects          │
│     ├─ Runs on PDF + Uncategorised CSV/JSON Rows                            │
│     └─ Subject-Matched Default Topic Fallback (Prevents False Unmapped)     │
│                                    │                                        │
│                                    ▼                                        │
│  4. Post-Upload Preview Workbench & Cloud Batch Commit                      │
│     ├─ Auto-Scroll to Preview Workbench on File Load                        │
│     ├─ 1-Click Inline Answer Buttons ([A] [B] [C] [D]) on Preview Cards     │
│     ├─ Single-Language Safe Inline Edit Modal & Duplicate Review Modal      │
│     └─ Firestore Batch Commit + Query Cache Invalidation                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **Preview Card Inline Answer Selector (`[data-set-preview-ans]`)**: प्रीव्यू कार्ड पर `A`, `B`, `C`, या `D` बटन दबाते ही उस प्रश्न का `rawCorrectIndex`, `correctOptionIndex`, और `answerKeyMatched = true` अपडेट होकर तुरंत कार्ड री-रेंडर होगा।
- **Inline Question Edit Modal (`openQuestionFormModal`)**: यदि केवल हिन्दी या केवल अंग्रेज़ी टेक्स्ट/विकल्प भरे हैं, तो सेव करते समय खाली भाषा को अपने-आप मिरर करेगा और `languageAvailability` (`Hindi` / `English` / `Both`) को सही सेट करेगा।
- **Batch Import Execution (`executeValidatedImport`)**: इम्पोर्ट बटन पर प्रोग्रेस स्टेट दिखाएगा, नए Subject/Topic को मास्टर में जोड़ेगा, Firestore में बैच सेव करेगा, और `invalidateQuestionBankQueryCache()` कॉल करेगा ताकि नए प्रश्न तुरंत Question Bank में दिखें।
