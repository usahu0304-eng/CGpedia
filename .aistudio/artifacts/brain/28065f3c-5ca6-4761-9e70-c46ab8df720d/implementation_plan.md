# Implementation Plan: AI-Powered Question Bank & Subject → Topic Folder Explorer

## 1. Goal & Strict Scope
Redesign **ONLY the Question Bank (`प्रश्न बैंक`) section** to make it clean, fast, and effortless to use, while keeping **100% of the rest of the app (Student Portal, CBT Exam Engine, Test Builder, Payments, Leaderboard, etc.) completely untouched**.

Importantly, the folders inside the Question Bank are **NOT raw file storage folders**—they are **structured Question & Answer folders** populated by AI from your uploaded Question Paper and Answer Key so that the **Test Builder (`Test Series & Builder`)** can directly pick questions by Subject and Topic.

---

## 2. What Will Be Built in the Question Bank Section

### A. 🤖 AI Dual-File Question & Answer Scanner (Top Panel)
A clean, streamlined 2-box upload bar at the top of the Question Bank:
1. **Box 1 — Question Paper File (`प्रश्न-पत्र फ़ाइल`):**
   - Upload any **PDF (Typed or Scanned), Image, CSV, or JSON** question paper.
2. **Box 2 — Answer Key File (`मॉडल उत्तर कुंजी फ़ाइल`):**
   - Upload the **Answer Key PDF / TXT / CSV** (or choose Paper Set `Set A / B / C / D` or paste quick answers like `1-A, 2-C`).
3. **One-Click Action — `🤖 AI से स्कैन करें और Subject/Topic फ़ोल्डर में सेव करें`:**
   - Uses **Firebase AI Logic (`gemini-3.8-flash`)** combined with our multi-stage PDF/KrutiDev/OCR engine to:
     - Extract every question cleanly in **Hindi & English** (automatically fixing any KrutiDev/legacy font encoding).
     - Extract all 4 options (`A, B, C, D`).
     - Match the exact correct answer from the uploaded **Answer Key file** (handling Set A/B/C/D and deleted/`*` questions).
     - Generate a concise **Solution / Explanation (`व्याख्या`)** if missing.
     - **Automatically classify each question into the right Subject (`विषय`) and Topic (`टॉपिक`)** and save it directly as `Verified` into that Subject → Topic folder so it is immediately ready for the **Test Builder**.
   - **Duplicate Detection & Batch Summary:** Automatically skips or updates exact duplicate questions and shows a clear summary badge (e.g., *"100 प्रश्न स्कैन हुए • 6 Subject फ़ोल्डर में सेव किए गए"*).

---

### B. 📁 Subject-Wise → 📂 Topic-Wise → 📝 Question-Answer Folder Hierarchy (No Exam-Wise Clutter)
All Exam-wise categorisation filters/forms are removed from the Question Bank. Instead, the Question Bank uses a clean 3-level breadcrumb folder explorer:

1. **Level 1 — Subject Folders Grid (`सभी विषय फ़ोल्डर`):**
   - Displays clean, clickable Subject Folder cards:
     - `📁 छत्तीसगढ़ सामान्य ज्ञान (CG GK)`
     - `📁 इतिहास (History)`
     - `📁 भूगोल (Geography)`
     - `📁 भारतीय राजव्यवस्था एवं संविधान (Polity)`
     - `📁 अर्थव्यवस्था एवं बजट (Economy)`
     - `📁 सामान्य विज्ञान एवं पर्यावरण (Science)`
     - `📁 गणित एवं तार्किक योग्यता (Maths & Reasoning)`
     - `📁 सामान्य हिन्दी (Hindi)`
     - `📁 General English`
     - `📁 कंप्यूटर ज्ञान (Computer)`
     - `📁 समसामयिकी (Current Affairs)`
     - `📁 शिक्षाशास्त्र एवं बाल विकास (Pedagogy)`
     - Plus a **`➕ नया विषय (Add Subject)`** button for custom subjects.
   - Each Subject card clearly displays the **number of Topics (`टॉपिक`)** and **total Verified Questions (`प्रश्न`)** inside it.

2. **Level 2 — Topic Folders Inside Selected Subject (`विषय के अंतर्गत टॉपिक फ़ोल्डर`):**
   - Clicking any Subject button opens that Subject's view with a top breadcrumb (`🏠 सभी विषय  ›  📁 छत्तीसगढ़ सामान्य ज्ञान`).
   - Shows clickable **Topic Folder cards** for that Subject (e.g., `📂 छत्तीसगढ़ का इतिहास`, `📂 जनजातियाँ, लोक कला एवं संस्कृति`, `📂 नदियाँ एवं अपवाह तंत्र`, `📂 पंचायती राज एवं नगरीय निकाय`, `📂 खनिज, ऊर्जा एवं उद्योग`, plus any new topics created by AI or Admin via **`➕ नया टॉपिक`**).
   - Also includes a **`📋 इस विषय के सभी प्रश्न देखें (View All Questions in Subject)`** button.

3. **Level 3 — Scanned Questions & Answers List Inside Selected Topic (`टॉपिक के प्रश्न और उत्तर`):**
   - Clicking a Topic folder opens the structured **Question & Answer cards** stored inside that Topic:
     - Clean bilingual question display (**Hindi + English**) with question number and difficulty badge.
     - All **4 Options (`A, B, C, D`)** with the **Correct Answer highlighted in green (`✓ सही उत्तर`)**.
     - **1-Click Answer Key Switcher (`A | B | C | D`)** on the card in case the Admin ever wants to change the correct option in one tap.
     - Collapsible/visible **Explanation (`व्याख्या`)**.
     - Quick actions on each question card:
       - `✏️ Edit` (opens a clean popup modal to edit text, options, answer, or explanation)
       - `📂 Move Topic/Subject` (change Subject/Topic folder)
       - `🗑️ Delete`
   - Includes a top **Search Bar**, **Select All / Bulk Move / Bulk Delete**, and a **`🧪 इन प्रश्नों से टेस्ट बनाएं (Open in Test Builder)`** shortcut.

---

### C. ➕ Compact Popup Modals & Smart Admin Utilities
To keep the main Question Bank screen uncluttered and professional:
- **`➕ Add Single Question` Popup Button:** Opens a clean modal dialog to manually type or paste a single question, pick its Subject & Topic, mark the correct option `A/B/C/D`, and save.
- **`📥 Backup / Export (JSON & CSV)` Button:** Export questions from any Subject/Topic folder or the entire Question Bank.
- **100% Test Builder Compatibility:** Every question saved in these Subject → Topic folders is automatically stored in `state.questionBank` (and synced to Firebase Firestore `question_bank`) with `status: "verified"`, `subjectId`, `subjectTag`, `topicId`, and `topic`, so the **Test Series & Builder** tab can filter and pick questions from any Subject and Topic immediately.

---

## 3. Technical Changes
1. **`/app/src/main/java/com/example/MainActivity.kt`:**
   - Initialize Firebase App Check (`configureAppCheck`) and expose `@JavascriptInterface fun analyzeQuestionsWithAi(payloadJson: String, callbackId: String)` on `CgpediaAndroidBridge` using **Firebase AI Logic (`Firebase.ai.generativeModel("gemini-3.8-flash")`)** with structured JSON output (`responseMimeType = "application/json"`) and a 60-second timeout.
2. **`/admin-console.js`:**
   - Replace ONLY the Question Bank UI (`renderQuestionBankView` and its Question Bank handlers) with:
     - The **AI Dual-File Scanner** (Question Paper + Answer Key) that calls the Gemini AI bridge alongside our local PDF/KrutiDev/OCR parser and saves structured questions directly into Subject → Topic folders.
     - The **3-Level Subject → Topic → Question-Answer Folder Explorer**.
     - The **Popup Modal** for adding/editing a single question or adding a custom Subject/Topic.
3. **Asset Sync & Verification:**
   - Run `node build-web.js` to sync assets into `/app/src/main/assets/public/` and verify the Android build with `compile_applet`.
