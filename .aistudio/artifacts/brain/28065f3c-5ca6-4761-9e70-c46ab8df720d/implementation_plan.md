# CGpedia — Admin Panel Initialization & Module Switcher Fix

Fix the startup `ReferenceError` that prevents the Admin Console module from registering on `window.CGpediaAdmin`, restore missing Question Bank taxonomy helper functions, and add cache-busting asset versioning so clicking the Admin Panel button and all 5 inner module tabs opens the workspace immediately.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Root Cause Identified ("Reason kya hai?"):**
> At the bottom of the Admin Console script, the global `window.CGpediaAdmin` export object references `upsertCategoryMasterItem` and `renameCategoryMasterItem`, which were not defined in the script scope (along with `resolveCanonicalQuestionHierarchy` and `normalizeDifficultyValue` inside Question Bank). Because JavaScript throws `ReferenceError: upsertCategoryMasterItem is not defined` while constructing `window.CGpediaAdmin`, **`window.CGpediaAdmin` remains `undefined`**. Consequently, when the user clicks the **🛡️ Admin Panel** button, the router check (`window.CGpediaAdmin && window.CGpediaAdmin.renderAdminConsole`) fails silently and nothing opens on screen.

- **Confirmed Decision 1 (Admin Entry & Inner Tabs):** Fix both the main **🛡️ Admin Panel** button and all 5 inner Admin module tabs (`📊 Dashboard KPIs`, `📝 Test Series Builder`, `🧠 Question Bank`, `👥 Student Management`, `💳 Payment Management`).
- **Confirmed Decision 2 (Quick-Access Triggers):** Keep quick-access Admin Panel buttons active in the **Settings Drawer**, **Mobile Bottom Navigation Bar**, **Profile Screen**, and **Owner Admin Verified** hero badge.

---

## 1. Overview & Core Concept

- **What It Does:** Ensures `window.CGpediaAdmin` initializes cleanly without any `ReferenceError`, implements the missing Category Master & Question Bank helper functions (`upsertCategoryMasterItem`, `renameCategoryMasterItem`, `resolveCanonicalQuestionHierarchy`, `normalizeDifficultyValue`), and forces WebView/browser cache invalidation so the updated scripts load immediately.
- **Target Audience / Persona:** Verified Owner Admin (`usahu0304@gmail.com`) and authorized staff managing exams, test series, questions, students, and payments, as well as students using the test portal.
- **Key Value:** Clicking any Admin Panel trigger immediately renders the Master Admin Console and switches smoothly across all 5 top-level modules without losing existing Firebase data or scroll position.

---

## 2. User Experience & Visual Design

- **Key User Flows:**
  1. **Opening the Admin Panel:** Clicking **🛡️ Admin Panel** in the top navigation bar, **🛡️ Admin** in the mobile bottom navigation bar, **🛡️ Open Master Admin Panel** in the Settings drawer, or the **🛡️ Owner Admin Verified** badge switches `state.activeTab` to `'admin'` and renders the Admin Console in `#appRoot`.
  2. **Switching Inner Admin Modules:** Clicking any of the 5 horizontal module chips (`📊 Dashboard KPIs`, `📝 Test Series Builder`, `🧠 Question Bank`, `👥 Student Management`, `💳 Payment Management`) updates `#adminSubSectionBody` and the active module title while preserving horizontal scroll position.
  3. **Managing Category Master in Question Bank:** Creating or renaming Exam, Subject, Topic, or Subtopic entries inside Question Bank executes `upsertCategoryMasterItem` and `renameCategoryMasterItem` and syncs with Firebase.
- **Visual Identity & Theme:**
  - *Aesthetic Direction:* Clean, authoritative bilingual exam-prep command center preserving the existing CGpedia layout.
  - *Color Palette & Mood:* Royal Navy (`#0F2557`) primary header/navigation, Vibrant Blue (`#1D4ED8`) accents, Warm Amber/Orange (`#EA580C`) Owner Admin badges, and Slate surface cards (`--surface`, `--surface-alt`) across Light and Dark modes.
  - *Typography & Hierarchy:* `Inter` and `Noto Sans Devanagari` for crisp Hindi/English bilingual legibility.
- **Interactive Feedback & Motion:** Instant active-tab highlighting, preserved horizontal chip-row scroll position, toast confirmations on actions, and a visual recovery fallback card if any unexpected runtime error ever occurs.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Define Complete Category Master & Hierarchy Helpers in Admin Console Scope**
  - *Chosen Approach:* Implement `upsertCategoryMasterItem`, `renameCategoryMasterItem`, `resolveCanonicalQuestionHierarchy`, and `normalizeDifficultyValue` directly inside the Admin Console module before `window.CGpediaAdmin` is exported.
  - *Why:* Eliminates the fatal `ReferenceError` at script load time AND ensures Question Bank category creation, renaming, single-question validation, and difficulty filtering all work end-to-end.
  - *Alternatives Considered:* Simply removing the two names from `window.CGpediaAdmin`—rejected because the Category Master UI buttons inside Question Bank actively call `upsertCategoryMasterItem` and `renameCategoryMasterItem`.
- **Decision 2: Cache-Busting Script Versioning + WebView Cache Clear**
  - *Chosen Approach:* Add explicit version query parameters (`?v=5.2`) to script/stylesheet tags, bump the Service Worker cache version, and clear stale WebView cache on startup.
  - *Why:* Guarantees that both browser tabs and the Android WebView immediately load the fixed script rather than a cached pre-fix copy.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Entry Points (Verified Admin Only)                   │
│  [Top Nav: 🛡️ Admin Panel]  [Mobile Bottom Nav: 🛡️ Admin]              │
│  [Settings Drawer: 🛡️ Open Master Admin Panel]  [Hero Admin Badge]     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 Unified Router: navigateToTab('admin')                  │
│  • Verifies isCurrentUserAdmin() (usahu0304@gmail.com / staff)          │
│  • Updates state.activeTab = 'admin' & syncs URL hash (#admin)          │
│  • Calls window.CGpediaAdmin.renderAdminConsole(root, state, publicApi) │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             window.CGpediaAdmin (Initialized Cleanly on Load)           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Horizontal Module Bar (#adminSubTabNavRow — Scroll Preserved)     │  │
│  │ [1. Dashboard KPIs] [2. Test Series Builder] [3. Question Bank]   │  │
│  │ [4. Student Management] [5. Payment Management]                   │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Category & Question Helpers (No Undefined References)             │  │
│  │ • normalizeDifficultyValue()                                      │  │
│  │ • resolveCanonicalQuestionHierarchy()                             │  │
│  │ • upsertCategoryMasterItem() & renameCategoryMasterItem()         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **`window.CGpediaAdmin` Initialization:** All exported and internal helper functions are defined prior to assignment so `window.CGpediaAdmin` is always registered before `DOMContentLoaded`.
- **`upsertCategoryMasterItem(state, api, type, payload)`:** Creates or updates Exam, Subject, Topic, or Subtopic records in `state.examMaster`, `state.subjectMaster`, `state.topicMaster`, and `state.subtopicMaster`, saves state locally, and syncs to Firestore.
- **`renameCategoryMasterItem(state, api, type, id, newEn, newHi)`:** Updates the English and Hindi titles of an Exam, Subject, Topic, or Subtopic in the Master lists and cascades the updated label across linked questions in `state.questionBank`.
- **`resolveCanonicalQuestionHierarchy(rawObj, catalog)` & `normalizeDifficultyValue(val)`:** Normalizes difficulty (`Easy`, `Moderate`, `Hard`) and resolves canonical `examIds`, `subjectId`, `topicId`, and `subtopicId` via `catalog.resolveHierarchy(...)`.
