# CGpedia — Performance Optimization, Unread Notifications, Story Controls, Confirmation Guards, Published Test Editor & Gemini-Powered Current Affairs Engine

Delivers a comprehensive stability, performance, and feature upgrade across the Student App and Admin Console while keeping all existing layouts and workflows intact.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Summary of Confirmed Decisions & Scope**:
> 1. **Zero-Lag / Anti-Freeze Optimization**: Debounce `localStorage` state writes and coalesce rapid Cloud Firestore snapshot re-renders via `requestAnimationFrame` so typing, switching tabs, and background syncing never lag or freeze the UI.
> 2. **Unread-Only Notification Badge**: Track read notification IDs per student/device; the bell icon badge (`#notifBadgeCount`) displays **only unread notifications** and automatically clears (`0` / hidden) once read.
> 3. **Instagram-Style Story Viewer (No Prev/Next/Pause Buttons + Admin Post/Delete)**: Remove the `Prev`, `Next`, and `Pause` buttons from the story viewer (using pure tap-left, tap-right, and press-and-hold gestures) and provide Admin-only **Post Story** and **Delete Story** controls.
> 4. **Mandatory Confirmation Dialogs**: Require explicit user/admin confirmation before executing any delete, unpublish, discard-session, or logout action.
> 5. **Published Test Editor (Price, Paid/Free & Metadata)**: Allow editing Published (as well as Draft) tests in the Admin Panel, including toggling `FREE` / `PAID`, updating `Price (₹)`, validity days, duration, marks, and titles.
> 6. **Gemini-Powered Current Affairs Quiz Maker & Month-Wise Auto-Collection into Question Bank**: Generate fresh, non-repeating professional bilingual questions via Gemini AI on every quiz attempt, and automatically store every generated question into the **Admin Question Bank** organized by **Month-wise Current Affairs folder (`YYYY-MM`)**—even when a student starts the quiz.
> 7. **Gemini-Powered Current Affairs Uploader & Admin-Offline Auto-Update**: Power both the Admin Current Affairs Uploader and the automated hourly Current Affairs updater with Gemini AI so new Current Affairs continue to publish to Cloud Firestore even when the Admin is offline.

## 1. Overview & Core Concept

- **What It Does**: Eliminates UI lag/freezes, fixes the notification counter to show only unread items, refines the Story viewer to pure Instagram gesture controls with Admin post/delete capabilities, adds safety confirmation dialogs across all destructive actions, enables editing of published tests (price, paid/free, details), and links both the Current Affairs Uploader and Current Affairs Quiz Maker to Gemini AI with automatic month-wise question collection into the Admin Question Bank.
- **Target Audience / Persona**: CGpedia students preparing for competitive examinations and the Platform Administrator (`usahu0304@gmail.com`).
- **Key Value**: Smooth, lag-free UX, accurate unread notification badges, safe confirmed actions, flexible live-test pricing management, and a self-growing month-wise Current Affairs Question Bank powered by Gemini AI.

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Unread Notification Badge**: When new announcements arrive, `#notifBadgeCount` shows only the count of unread announcements. Opening the **Updates / Notifications** tab or clicking the Bell icon marks those announcements as read and hides the badge until a new announcement is posted.
  2. **Pure Gesture Story Viewer + Admin Controls**: Students tap the left side of the story for previous, tap the right side for next, and press-and-hold on the screen to pause. No `Prev`, `Next`, or `Pause` buttons are shown. When logged in as Admin, **➕ Post Story** and **🗑️ Delete Story** (with confirmation) are directly accessible.
  3. **Safety Confirmation Modal**: Clicking Delete (on stories, announcements, tests, folders, coupons, staff, or saved account shortcuts), Unpublish, Discard Exam, or Logout opens a confirmation dialog (`Confirm` / `Cancel`) before performing the action.
  4. **Published Test Editor**: In **Admin Panel → Test Series**, every test card (including `PUBLISHED LIVE` tests) includes an **⚙️ Edit Details / Price** button that opens a modal to change `FREE` / `PAID` status, `Price (₹)`, validity days, title, exam category, folder, duration, and marking scheme.
  5. **Gemini-Powered Quiz Maker & Month-Wise Question Bank Collection**: Each time a student launches a Current Affairs Quiz, Gemini AI generates a fresh set of bilingual MCQs (using a dynamic variation seed and excluding previously asked question stems) and automatically saves those questions into the Admin Panel's **Central Question Bank** under the corresponding **Month-wise Current Affairs folder** (e.g., `Current Affairs — November 2026 (2026-11)`).
- **Visual Identity & Theme**:
  - Strictly preserves the existing CGpedia Royal Navy (`#0F2557`), Saffron (`#EA580C`), and clean card design without disturbing any existing screens.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Debounced State Persistence & Coalesced Cloud Renders**
  - *Chosen Approach*: Batch incoming Firestore snapshot UI updates with `requestAnimationFrame` and debounce `localStorage` serialization (`saveState`) while flushing immediately on `pagehide`/`beforeunload`.
  - *Why*: Prevents main-thread blocking when large question banks or multiple cloud collections sync simultaneously.
- **Decision 2: Student-Triggered Cloud Question Collection via Firestore Rules**
  - *Chosen Approach*: Update `firestore.rules` for `question_bank`, `subjects`, `topics`, and `subtopics` to permit authenticated users to create verified `Current Affairs` questions and month-wise topic folders when a quiz is generated.
  - *Why*: Ensures questions generated when students take Current Affairs quizzes are persisted to the shared Cloud Question Bank even when the Admin is offline.

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────────┐
│           Gemini Current Affairs Engine & Zero-Lag State Pipeline          │
├────────────────────────────────────────────────────────────────────────────┤
│  Student / Hourly Trigger (Even When Admin Is Offline)                     │
│     ├── Gemini AI (Firebase.ai Android Bridge + Web Gemini Fallback)       │
│     ├── Hourly Auto-Updater ──► Deduplicate ──► Firestore `current_affairs`│
│     └── Custom Quiz Maker (Fresh Seed + Exclude Previous Questions)        │
│            ├── Launches Student CBT Quiz                                   │
│            └── Auto-Collects Questions by Month (`YYYY-MM`)                │
│                   └──► Admin Central Question Bank (`question_bank`)       │
│                        [Subject: Current Affairs | Topic: Month Folder]    │
├────────────────────────────────────────────────────────────────────────────┤
│  UI & Safety Layer                                                         │
│     ├── Unread Notification Tracker (`readNotificationIds` vs `id` list)   │
│     ├── Pure Gesture Instagram Story Viewer + Admin Post/Delete            │
│     ├── Universal Confirmation Modal on Delete / Unpublish / Logout        │
│     └── Published & Draft Test Metadata / Pricing Editor Modal             │
└────────────────────────────────────────────────────────────────────────────┘
```
