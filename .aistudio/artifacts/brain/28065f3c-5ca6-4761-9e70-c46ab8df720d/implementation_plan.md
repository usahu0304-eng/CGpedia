# Strict Real-Account Login, Announcement Edit/Unpin & Complete Current Affairs Upgrade Plan

This update enforces strict online Firebase Authentication with valid email domain verification (blocking offline/fake-email logins), adds Edit and Pin/Unpin controls for Admin Announcements, and upgrades the entire Current Affairs system with non-repeating hourly online updates, Admin AI upload (Prompt, Text, PDF/Image), an Instagram-style Story viewer, Monthly archives with a bottom Month Jumper, and a student-customizable Monthly/Yearly Current Affairs Quiz Maker—while hiding all "AI" and "24-hour disappearance" labels from students.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Strict Scope Lock**: Only Login/Registration validation, Admin Announcement Edit/Unpin, and the Current Affairs + Current Affairs Quiz features described below will be modified. All other modules remain untouched.

- **Confirmed Decision 1 (Strict Online Real-Account Login)**: Offline login and fake/random local account fallbacks are completely disabled. Users must be online and authenticate via Firebase Auth (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, or Google Sign-In) using a valid, non-disposable email domain.
- **Confirmed Decision 2 (Admin AI Current Affairs Uploader)**: Admin Panel → Current Affairs will support all three AI input modes: **Topic / Prompt**, **Copy-Paste News / Paragraph**, and **PDF / Image File Upload**, plus automatic deduplication.
- **Confirmed Decision 3 (Student UI Cleanliness)**: Students will never see any text mentioning `"AI"`, `"AI-Powered"`, `"24-Hour"`, `"24H"`, or `"disappears after 24 hours"`.

---

## 1. Overview & Core Concept

1. **Strict Online Firebase Authentication**:
   - Blocks offline login/registration and rejects fake/placeholder email domains (`@test.com`, `@fake.com`, `@abc.com`, `@example.com`, invalid TLDs).
   - Requires a live Firebase Auth verification before any student or admin session is activated.
2. **Announcement Edit, Pin/Unpin & Delete (Admin Panel)**:
   - Displays all existing announcements in the Admin Broadcast section with instant **Edit (`✏️`)**, **Pin / Unpin (`📌 / 📍`)**, and **Delete (`🗑️`)** actions synced to Cloud Firestore.
3. **Current Affairs Engine (Non-Repeating, Hourly Auto-Update & Admin AI Upload)**:
   - **Zero Duplicates**: Every incoming or generated Current Affairs item is checked against existing headlines/summaries using normalized text similarity before saving.
   - **Hourly Automatic Online Update**: Automatically fetches/generates fresh Chhattisgarh, National, and International Current Affairs every hour when online and syncs them to Cloud Firestore.
   - **Admin AI Upload**: Allows the Admin to generate and publish Current Affairs from a **Topic/Prompt**, **Pasted News Paragraph**, or **PDF/Image File**.
4. **Instagram-Style Stories & Monthly Archive with Custom Quiz Maker**:
   - **Instagram-Style Story Viewer**: Stories from the last 24 hours appear in the top Story Strip and open in a fullscreen Instagram-style viewer with segmented progress bars, auto-advance timer, tap left/right navigation, and hold-to-pause—with zero mention of "24 hours" or "AI".
   - **Monthly Archive & Bottom Month Jumper**: The Current Affairs tab displays the active month's Current Affairs digest and includes a bottom **"📅 Jump to Another Month"** control to browse previous months' archives.
   - **Student-Customizable Current Affairs Quiz Maker**: Both the Home recent Current Affairs quiz and the Current Affairs section's Monthly/Yearly Quiz Maker let students customize **Month / Full Year**, **Number of Questions**, and **Duration (Minutes)**, generating questions strictly from the corresponding Current Affairs records via the background AI engine.

---

## 2. User Experience & Visual Design

- **Instagram-Style Story Modal**:
  - Full-height dark story card with segmented top progress bars (`1..N`), category avatar & timestamp header, tap zones on the left (previous story) and right (next story), bilingual headline & bullet points, and a bottom **"🎯 Start Current Affairs Quiz"** CTA.
- **Current Affairs Section (`⚡ Current Affairs`)**:
  - **Top Card — Current Affairs Quiz Maker**: Clean selector for **Period (Recent / Month-wise / Full Year)**, **Question Count (5 to 50+ custom)**, and **Duration in Minutes (5 to 60+ custom)** with a **"🎯 Start Quiz"** button (no mention of AI).
  - **Main Digest — Monthly Current Affairs**: Displays all Current Affairs for the currently selected month in clean bilingual cards.
  - **Bottom Bar — Month Jumper**: At the end of the current month's list, a prominent **"📅 View Previous Months / Jump to Month"** bar lets students switch to any earlier month or return to the latest month.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Separate 24-Hour Story Strip Visibility from Permanent Monthly Archive**
  - *Chosen Approach*: Stories remain visible in the top Instagram-style Story Strip for 24 hours (`Date.now() - createdAtMs < 86400000`), while automatically remaining stored in `state.stories` (`current_affairs` collection) with `monthKey` (`YYYY-MM`) and `yearKey` (`YYYY`) so students can always read them in the Monthly Current Affairs section and take Monthly/Yearly quizzes.
  - *Why*: Satisfies both the 24-hour story behaviour and the permanent month-wise archive + monthly/yearly quiz requirements without losing data.
- **Decision 2: Background AI Generation with Zero Student-Facing AI Branding**
  - *Chosen Approach*: Route Current Affairs quiz generation through the Gemini AI engine (`gemini-3.8-flash`) grounded strictly on the text of the selected Recent, Monthly, or Yearly Current Affairs items, while presenting the UI to students simply as **"Current Affairs Quiz"**.
  - *Why*: Ensures questions are 100% relevant to the actual Current Affairs while keeping AI invisible to students as requested.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 1. STRICT ONLINE FIREBASE AUTH GATE                     │
│  • Validate real email format & block fake/disposable domains           │
│  • Require navigator.onLine && Firebase Auth (Email/Pass or Google)     │
│  • Remove all offline/local digest login & random UID registration      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             2. CURRENT AFFAIRS & ANNOUNCEMENT CLOUD ENGINE              │
│  • Announcements: Create + Edit + Pin/Unpin + Delete (Firestore Sync)   │
│  • Current Affairs Sources:                                             │
│     ├─ Hourly Auto-Sync Scheduler (every 60m online via AI Engine)      │
│     └─ Admin AI Uploader (Prompt / Pasted Text / PDF & Image Vision)    │
│  • Deduplication Filter: normalizeTextForComparison + similarity < 0.78 │
│  • Tagged with `createdAtMs`, `monthKey` ("YYYY-MM"), `yearKey` ("YYYY")│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│           3. STUDENT CURRENT AFFAIRS & CUSTOM QUIZ EXPERIENCE           │
│  • Home Story Strip (< 24h) ──► Instagram-Style Story Viewer            │
│     (Segmented progress bars, auto-advance, tap prev/next, hold pause)  │
│  • Current Affairs Tab:                                                 │
│     ├─ Custom Quiz Maker (Recent / Month / Year + Q Count + Duration)   │
│     ├─ Monthly Digest Cards (No "AI" or "24-Hour" labels)               │
│     └─ Bottom Month Jumper (Jump to any previous month archive)         │
└─────────────────────────────────────────────────────────────────────────┘
```
