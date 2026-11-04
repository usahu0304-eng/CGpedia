# CGpedia — Multi-Exam Competitive Examination & Online Test Series Platform

## User Review & Critical Decisions

- **Exact Original Logo Cleanup (Zero Redesign)**: We located your original uploaded logo (`/public/assets/aistudio/IMG_20261102_104841_534_87f0adb4.jpg`). The original file will be preserved untouched as a backup. A deterministic pixel-restoration pass will remove **only** the blue Telegram paper-plane and white swoosh trail on the right side by reconstructing the underlying radial sky-blue background gradient while keeping 100% of the original orange graduation cap, dark navy Chhattisgarh map silhouette, orange "CG" + dark navy "pedia" typography, and circular border pixels intact.
- **Unified Firebase Cloud Architecture (Web + Android)**: Both the Vercel Web PWA (`cgpedia.vercel.app`) and the Android application will connect directly to the existing provisioned Firebase project (`ai-studio-android-cgpedia-28065f3c-5ca6-4761-9e70-c46ab8df720d`), eliminating the previous `localStorage` isolation bug so tests, attempts, and unlocks synchronize in real time across devices. The Android shell will additionally provide native `FLAG_SECURE` screenshot/screen-recording protection during exams and native file pickers.
- **UPI QR & WhatsApp Verification Payment Workflow**: Premium test series and individual paid tests will use the Admin-configured UPI QR code (uploadable from device gallery or URL), copyable UPI ID, coupon discount calculator, and one-tap WhatsApp payment screenshot verification (`9238810070`) with pre-filled Student Name, Email, UID, and Package details. Validity countdowns (`30 / 90 / 180 / 365 days`) start strictly from the exact timestamp the Admin activates access for that student.

---

## 1. Overview & Core Concept

**CGpedia** is a full-scale, bilingual (Hindi & English) competitive examination preparation and Computer-Based Test (CBT) platform built for aspirants preparing for **UPSC, State PSC (CGPSC & CGSSB), SSC, Banking, Railway, Teaching (CTET & TET), UGC NET & SET, Police, Defence**, and other competitive exams.

The platform starts with a **clean, zero-dummy-data state** for students until the Admin creates and publishes content through a strict **Draft → Review → Publish** workflow. It combines a distraction-free, NTA/PSC-grade CBT examination engine, comprehensive topic-level performance analytics, a customizable practice & mistake-notebook module, and a role-protected Admin & Question Bank Management suite.

---

## 2. User Experience & Visual Design

- **Aesthetic Direction & Color Palette**:
  - **Primary Brand**: Deep Navy Blue (`#0F2557`) paired with Professional Blue (`#1D4ED8`) and crisp academic surfaces (`#F8FAFC` background, `#FFFFFF` cards, `#0F172A` primary ink).
  - **Semantic CBT Status Colors**:
    - Answered: Emerald Green (`#16A34A`)
    - Not Answered: Crimson Red (`#DC2626`)
    - Marked for Review: Royal Purple (`#7C3AED`)
    - Answered & Marked for Review: Purple with Green Badge (`#7C3AED` + `#16A34A`)
    - Not Visited: Neutral Slate (`#94A3B8`)
    - Warning / Low Time Alert: Amber (`#D97706`)
  - **Theme Support**: Seamless Light Mode (default) and Dark Mode toggle with persistent user preference.
- **Typography & Bilingual Readability**:
  - `Inter` for clean English UI and numerical data tables paired with `Noto Sans Devanagari` for crystal-clear Hindi question stems, options, and solutions.
  - Instant in-exam language switcher (`Hindi`, `English`, or `Bilingual Side-by-Side`) without losing timer or question state.
- **Responsive Navigation Architecture**:
  - **Mobile / Android**: Sticky top app bar (cleaned CGpedia logo, active exam selector, language toggle, notification bell) + 5-tab bottom navigation (`Home`, `Test Series`, `Practice`, `Analytics`, `Profile`).
  - **Desktop / Tablet Web**: Collapsible left navigation rail with expanded multi-column workspace and split-screen CBT question + palette layout.
  - **Role-Protected Admin Console**: Visible and accessible exclusively to verified Admin accounts (`usahu0304@gmail.com` and delegated staff roles), featuring dedicated modules for Dashboard KPIs, Exams & Syllabus, Question Bank (Manual + CSV/JSON Bulk Import + AI Generator), Test Builder, Student Access & Validity, UPI Payments & Coupons, and Announcements/Current Affairs.

---

## 3. Key Product Decisions & Trade-Offs

- **Zero Client-Side Answer Key Leakage During Active Exams**:
  - Questions are split between public exam paper metadata/stems and protected solution records, or gated so that the active CBT runner only reads question prompts and options while correct answers and explanations are evaluated and revealed strictly upon test submission.
- **Offline-Resilient CBT Auto-Save**:
  - Every option selection, Clear Response, Mark for Review toggle, and per-question time-spent counter is immediately persisted to local storage and synced to Firestore (`testAttempts` / `testResponses`). If a student's browser refreshes or internet drops mid-exam, the exact timer and palette state resume seamlessly.
- **Strict Activation-Timestamp Validity**:
  - Unlocking a premium package records `activatedAt` and computes `expiresAt = activatedAt + validityDays`. Expired enrollments are automatically locked on read without manual cleanup.

---

## 4. Technical Architecture & Data Strategy

```
+-----------------------------------------------------------------------+
|                UNIFIED CLIENT LAYER (Web PWA & Android)               |
|  - Student Portal (Home, Test Series, Practice, CBT Engine, Results)  |
|  - Admin Control Center (Exams, Q-Bank, CSV/AI Import, UPI Unlocks)   |
|  - Native Android Bridge (MainActivity.kt: FLAG_SECURE, File Picker)  |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|             EXISTING FIREBASE BACKEND & CLOUD SERVICES                |
|  - Firebase Auth (Google Sign-In + Role Verification)                 |
|  - Cloud Firestore (Named DB: ai-studio-android-cgpedia-28065f3c...)  |
|    Collections: users, exams, subjects, topics, testSeries, tests,    |
|    questions, testAttempts, testResponses, results, purchases,        |
|    orders, coupons, notifications, announcements, app_config          |
|  - Gemini AI Service (Bilingual MCQ & Explanation Generation)         |
+-----------------------------------------------------------------------+
```

### 9-Phase Execution Roadmap

1. **Phase 1 — Project Backup & Firestore Schema / Security Rules Upgrade**: Preserve all existing Firebase credentials (`google-services.json`, `firebase_applet_config.xml`, `vercel.json`) and upgrade `firestore.rules` + `firebase-blueprint.json` to support all 16 collections with strict admin and student ownership checks.
2. **Phase 2 — Exact Logo Cleanup & Design System Foundation**: Run a precision pixel-mask restoration on `/public/assets/aistudio/IMG_20261102_104841_534_87f0adb4.jpg` to remove only the Telegram plane and white swoosh while keeping the original file backed up, and build the responsive Light/Dark design system.
3. **Phase 3 — Authentication, Student Onboarding & Home Dashboard**: Implement Google Sign-In, first-time onboarding (preferred language + target exam categories), and the personalized Student Home Dashboard (Continue Preparation, Daily Free Quiz, 24h Current Affairs Stories, Announcements).
4. **Phase 4 — Multi-Exam Hierarchy, Test Series Library & Question Bank**: Build the Exam Category explorer (UPSC, State PSC, CGPSC, SSC, Banking, Railway, CTET/TET, UGC NET/SET, Police, Defence), filterable Test Series catalog, and Syllabus/Subject/Topic structure.
5. **Phase 5 — Live CBT Examination Engine**: Implement the full-screen exam interface with authoritative countdown timer, 5-state NTA question palette, section tabs, Mark for Review, Clear Response, auto-save recovery, and anti-accidental submit summary modal.
6. **Phase 6 — Results, Bilingual Solutions, Analytics, Practice & Leaderboard**: Build post-exam scorecards, negative-marking breakdown, subject/topic accuracy charts, speed metrics, custom Practice & Mistake Notebook sessions, Bookmarks, and Leaderboard rankings.
7. **Phase 7 — Role-Protected Admin Panel & AI / Bulk Question Tools**: Build the Admin Console with KPI cards, Draft → Review → Publish test builder, CSV/JSON bulk question importer, and Gemini AI bilingual question generator with a 5-minute timeout.
8. **Phase 8 — UPI QR + WhatsApp Payment Flow, Coupons & Admin Unlock**: Implement the Admin UPI QR gallery uploader, student payment modal with downloadable QR and auto-filled WhatsApp verification link, coupon code application, and one-click Admin student activation with live validity countdown.
9. **Phase 9 — Native Android Shell Integration, Production Build & Verification**: Connect `MainActivity.kt` (`FLAG_SECURE` exam screen protection, file upload support, edge-to-edge layout), bundle the unified web assets into both `dist/` (for Vercel) and `app/src/main/assets/` (for Android APK), and verify compilation via `compile_applet`.
