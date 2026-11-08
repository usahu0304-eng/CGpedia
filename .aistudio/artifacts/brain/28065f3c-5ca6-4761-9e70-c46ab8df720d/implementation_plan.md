# Implementation Plan — Fix Slow Startup & Touch/Tab Freezing (CGpedia)

## Overview
Resolve all 5 verified root causes behind slow initial loading and UI freezing when touching tabs or screen controls on both Web and Android, while keeping all existing UI layouts, features, and workflows unchanged.

---

## 1. Stop Full-Database `localStorage` Serialization on Tab & Filter Clicks (`/app.js`)
- **Problem:** Every tab click (`navigateToTab`) and filter click calls `saveState()`, which runs `saveStudentWorkspaceSnapshot()` and `localStorage.setItem(STORAGE_KEY, JSON.stringify(state))` across the entire multi-megabyte `state` (including `questionBank`, embedded test questions, attempt `questionsSnapshot`s, and base64/SVG strings) on the main thread.
- **Fix:**
  - Separate lightweight UI navigation/filter preferences (`activeTab`, `selectedExamFilter`, `caActiveCategory`, `caLangMode`, `theme`, `lang`) from heavy data persistence.
  - Do **not** run full `JSON.stringify(state)` or `saveStudentWorkspaceSnapshot()` on tab navigation or filter chip clicks.
  - Defer heavy `flushSaveStateNow()` writes to `requestIdleCallback` (with a non-blocking `setTimeout` fallback) and strip transient/derived caches so `localStorage` serialization never blocks touch responsiveness.
  - Cache `getSavedActiveSession()` in memory (`exam-engine.js`) instead of calling `JSON.parse(localStorage.getItem(...))` on every `renderApp()`.

---

## 2. Eliminate Background Firestore Snapshot Re-Render Storm & Auto-Write Feedback Loop (`/app.js` & `/firebase-sync.js`)
- **Problem:** Opening the app attaches 19 Firestore collection listeners (`subscribeCloudCollections` + `subscribeSecondaryCollectionsNow`). As each snapshot arrives:
  1. `mergeCloudCollection()` in Admin mode automatically pushes local documents back to Firestore (`batchSaveCloudDocs`), triggering further snapshots.
  2. `mergeCloudCollection()` calls `saveState()` and `scheduleCloudRenderApp() -> renderApp()` up to 19 times, repeatedly wiping and replacing `#appRoot.innerHTML` mid-touch while the user taps tabs or buttons.
- **Fix:**
  - Remove automatic `batchSaveCloudDocs` write-back inside `mergeCloudCollection()` during background snapshot merges (Admin writes already save directly when Admin creates/edits/deletes items or clicks Sync).
  - Add fast change-detection in `mergeCloudCollection()` so if incoming cloud documents match the in-memory collection (same count and latest `updatedAtIso`/IDs), it skips `saveState()` and skips `scheduleCloudRenderApp()`.
  - Only re-render `#appRoot` from background cloud sync if the updated collection actually affects the **currently visible tab** (e.g., do not re-render the Home tab when `orders`, `coupons`, `admin_staff`, `student_queries`, `question_reports`, or `question_bank` arrive in the background), and coalesce initial Tier-1 snapshots into a single batch update.
  - Defer Tier-2 admin-only collections (`orders`, `student_queries`, `question_reports`, `admin_staff`, `users`) until the user actually opens the Admin Console or Profile tab.

---

## 3. Lazy & Memoized Current Affairs Quiz Pool Calculation (`/app.js`)
- **Problem:** `renderCurrentAffairsView()` calls `getAvailableCurrentAffairsQuestionsForPeriod()` synchronously on every render—even when the Custom Quiz Panel is closed (`isQuizPanelOpen === false`)—running $O(N^2)$ `computeStemSimilarityForSelection` loops across all stories and the question bank.
- **Fix:**
  - Only compute `getAvailableCurrentAffairsQuestionsForPeriod()` when `state.caQuizPanelOpen === true` or when launching a quiz.
  - Memoize the computed pool by `(scope, monthKey, yearKey, storiesLen, questionBankLen)` and use fast normalized stem `Set` lookup instead of $O(N^2)$ token-similarity scans during UI rendering.

---

## 4. Defer `admin-console.js` & Background AI Sync Until Requested (`/app.js`)
- **Problem:** `app.js` automatically loads the 266 KB `admin-console.js` script 250ms after startup for Admin users and again 4.5s after startup via `runHourlyCurrentAffairsAutoUpdate()`, competing with initial page interaction.
- **Fix:**
  - Load `admin-console.js` strictly when the user navigates to the Admin tab (`navigateToTab('admin')`) or triggers an AI action.
  - Ensure initial startup does not run heavy background AI generation/deduplication while the user is interacting with the UI.

---

## 5. Optimize Android WebView Startup Caching & Compose State (`/app/src/main/java/com/example/MainActivity.kt`)
- **Problem:** `MainActivity.kt` sets `cacheMode = WebSettings.LOAD_NO_CACHE`, calls `clearCache(true)` on every launch, and mutates Compose `webViewRef` state inside the `AndroidView` `factory` block.
- **Fix:**
  - Switch `WebSettings.cacheMode` to `WebSettings.LOAD_DEFAULT` and remove `clearCache(true)` on startup so compiled JS bytecode and static assets load from cache.
  - Hold the `WebView` reference without triggering an immediate Compose recomposition during `AndroidView` creation.
