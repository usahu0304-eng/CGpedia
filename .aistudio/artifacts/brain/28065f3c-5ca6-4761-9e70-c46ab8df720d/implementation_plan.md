# CGpedia — Freeze/Heating Resolution, International Current Affairs Fix & Clean Social Story Indicators

This plan resolves the application hang, freeze, and device heating issues on Web and Android, restores the missing International Current Affairs & Daily Dose items and updates, and removes all numerical seen/unseen counters from the Story interface so it matches standard social media story interfaces (WhatsApp Status / Instagram Stories).

## User Review & Critical Decisions

> [!IMPORTANT]
> Both decisions were confirmed with the user during Phase 1 clarification:

- **Confirmed Decision 1 (Story Viewing Status Display)**: Remove all text and numerical seen/unseen counters (`अनदेखे: X • देखे गए: Y`, `● X अनदेखे`, `✓ सभी देखे गए`, and `देखे: X • अनदेखे: Y`) from the Daily Dose header, below each category circle, and inside the full-screen Story Viewer header. Keep only the segmented ring around each circle and the top segmented progress bars inside the Story Viewer.
- **Confirmed Decision 2 (Scope of Fix)**: Fix all three issues (hang/freeze & device heating, International Current Affairs zero-content bug, and Story seen/unseen number removal) immediately without altering any other existing modules or layouts.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Eliminates Hang, Freeze & Device Heating**: Stops the background Firestore batch-write and snapshot feedback loop on startup, memoizes Current Affairs deduplication and SVG cover generation so it does not re-execute on every render cycle, and prevents redundant cloud writes when viewing already-seen stories.
  2. **Restores International Current Affairs & Daily Dose**: Fixes the category normalization order bug where `"international"` was matching `.includes("national")` first and converting every International news item into a National item, and ensures verified International Current Affairs stories are populated and synced.
  3. **Clean Social-Style Story Indicators**: Removes all numerical/text seen-unseen labels from the Daily Dose strip and full-screen Story Viewer while preserving WhatsApp/Instagram-style segmented ring indicators and top progress bars.
- **Target Audience / Persona**: Students and administrators using CGpedia on mobile browsers, desktop browsers, and the Android application.
- **Key Value**: Smooth, cool, responsive performance with zero UI freezes, complete three-category Current Affairs coverage (`Chhattisgarh`, `National`, `International`), and a clean social-media-style Daily Dose Story experience.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Smooth Startup & Navigation**: Opening the app or switching tabs responds immediately without CPU spikes, background write storms, or UI freezes.
  2. **Daily Dose Story Strip**:
     - Shows the **Daily Dose** heading, language toggle (`हिंदी / English`), and three category circles (**छत्तीसगढ़ / Chhattisgarh**, **राष्ट्रीय / National**, **अंतर्राष्ट्रीय / International**).
     - Each circle displays only its segmented ring (emerald green `#10B981` for unseen segments, slate grey `#94A3B8` for seen segments) and the category name underneath—no numerical counters or seen/unseen text badges.
  3. **Full-Screen Story Viewer**:
     - Opens directly at the first unseen story in chronological order (oldest to newest).
     - Displays the segmented progress bars at the top, category icon and name, upload timestamp, language toggle, and story image/content—without any `Seen: X • Unseen: Y` badge.
- **Visual Identity & Theme**:
  - Preserves the existing CGpedia institutional palette (`--primary: #0F2557`, `--secondary: #2563EB`, emerald unseen story ring `#10B981`, slate seen story ring `#94A3B8`) and bilingual typography (`Inter` + `Noto Sans Devanagari`).
- **Interactive Feedback & Motion**:
  - Story progress bar advances smoothly at 80ms intervals without triggering background full-page DOM re-renders while the modal is open.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Fix Substring Collision in `normalizeStoryCategory`**
  - *Chosen Approach*: Check `c === 'international' || c.includes('international') || c.includes('world') || c.includes('global')` **before** checking `c === 'national' || c.includes('national')`, and automatically repair any existing International items (such as the ISRO SpaDeX mission or global summits/organizations) that were previously misclassified as `'national'`.
  - *Why*: In JavaScript, `'international'.includes('national')` evaluates to `true`, which caused every International story (both baseline and AI-generated) to be overwritten as `'national'`, leaving International with `0` items and causing the hourly auto-sync to re-trigger endlessly.
- **Decision 2: Eliminate Startup Write-Back Loop & Memoize Canonical Story List**
  - *Chosen Approach*:
    1. Remove the automatic startup `syncLocalAdminStateToCloud(false)` batch-write of all 14 collections on every page load (cloud listeners already merge changes per collection when needed).
    2. Cache/memoize `getCanonicalCurrentAffairsList()` using a lightweight fingerprint of `state.stories` so the $O(N^2)$ similarity deduplication and SVG Data-URL encoding run only when story data actually changes, not on every UI render.
    3. Guard `markStorySeenByStudent(storyId)` so it returns immediately if `storyId` is already marked seen, avoiding redundant `localStorage` serializations and Firestore `users` writes on every story view.
    4. Defer background `renderApp()` calls while the full-screen Story Viewer modal (`#instaStoryBackdrop`) is open, updating the underlying page once when the viewer closes.
  - *Why*: Directly eliminates the CPU, memory, and network loop responsible for device heating and browser/app freezing.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Data Flow Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   CGpedia State & Cloud Sync Pipeline                   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────────┐     ┌───────────────────┐     ┌─────────────────────┐
│ Category Resolver │     │ Memoized Canonical│     │ Guarded Seen-State  │
│  1. Chhattisgarh  │────▶│  Current Affairs  │────▶│  Sync (No Duplicate │
│  2. International │     │  Cache (O(1) Hit  │     │  Firestore Writes   │
│  3. National      │     │  on UI Renders)   │     │  During Story View) │
└───────────────────┘     └─────────┬─────────┘     └──────────┬──────────┘
                                    │                          │
                                    ▼                          ▼
                          ┌─────────────────────────────────────────────┐
                          │   Daily Dose Strip & Full-Screen Viewer     │
                          │ • 3 Category Circles (CG, National, Intl)   │
                          │ • Ring & Bar Indicators Only (No Numbers)   │
                          └─────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `state.stories`: Unified array of Current Affairs & Daily Dose items with normalized `category` (`'chhattisgarh' | 'national' | 'international'`), stable timestamps, and cached `imageUrl`.
  - `state.student.seenStoryIds`: Deduplicated array of seen story IDs persisted to `localStorage` and synced to Firestore `users/{uid}` only when a newly seen story ID is added.
- **Interactive Component & State Mapping**:
  - **Daily Dose Strip**: Renders category circles with SVG segmented rings and category titles only; clicking a circle opens `openStoryViewerModal` at `firstUnseenIndex`.
  - **Full-Screen Story Viewer**: Advances through stories oldest-to-newest, marks unseen stories as seen once per unique ID, and refreshes the underlying view cleanly when closed.
