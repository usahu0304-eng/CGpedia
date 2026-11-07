# CGpedia — "Daily Dose" Fullscreen Category Stories & Browser/App Restoration Plan

This plan incorporates your exact **Daily Dose** story improvements alongside the Browser & Android App startup/login restoration, without changing anything else.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Scope & Story Updates**:
> 1. **Category-Wise Story Circles (Instagram / WhatsApp Status Style)**:
>    - Instead of separate circles for each individual post, stories are grouped into **3 Category Circles**: **Chhattisgarh**, **National**, and **International**.
>    - Tapping a category circle opens all active stories in that category with segmented progress bars at the top.
> 2. **Latest First, Oldest Last Ordering + Upload Timestamp**:
>    - Inside each category circle, stories are ordered **Latest First (`createdAtMs` descending)** and **Oldest Last**.
>    - Every story slide displays its **exact upload time** (e.g., `10:45 AM • 2h ago`).
> 3. **AI Auto-Attached Story Image + Admin Custom Image Upload**:
>    - When AI generates/posts a Current Affairs story, it automatically attaches a relevant visual banner/image (`imageUrl`) matching the headline and category.
>    - Admin also gets an **Attach Image (Upload Photo / Image URL)** option when posting or editing a story.
> 4. **"Daily Dose" Heading & "Daily Dose Quiz" Button**:
>    - Where stories are shown, the section title will say only **`Daily Dose`**.
>    - The quiz button will say only **`Daily Dose Quiz`**.
> 5. **True Full-Screen Story Viewer**:
>    - The Story Viewer opens **100% Full Screen (`100vw × 100dvh`)** like WhatsApp Status / Instagram Story with pure tap-left/tap-right/hold-to-pause gestures (no Prev/Next/Pause buttons) and Admin Post/Delete access.
> 6. **Browser Server + App Login & Session Restoration**:
>    - Keeps the port `3000` web server daemon running, preserves logged-in sessions (`usahu0304@gmail.com`), and supports online real-account authentication on both Browser and Android App.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the Current Affairs story strip into a clean **"Daily Dose"** module with 3 category circles (**Chhattisgarh**, **National**, **International**), full-screen WhatsApp/Instagram-style story viewing with AI/Admin images and upload timestamps, and restores seamless Browser & App login/startup.
- **Target Audience / Persona**: Aspirants and Admin (`usahu0304@gmail.com`) on Android App and Web Browser.
- **Key Value**: Clean Instagram/WhatsApp-like multi-slide category stories with visual context and instant **Daily Dose Quiz** access.

---

## 2. User Experience & Visual Design

- **Daily Dose Strip**:
  - Header title: **`Daily Dose`**
  - Action button: **`Daily Dose Quiz`** (plus **`➕ Post Story`** for Admin)
  - Circles: Up to 3 category avatars (**Chhattisgarh**, **National**, **International**) with an Instagram-style gradient ring and story count badge.
- **Full-Screen Story Viewer (`100vw × 100dvh`)**:
  - Edge-to-edge full-screen layout (`width: 100vw; height: 100dvh; border-radius: 0`).
  - Top segmented progress bars for all stories in the selected category (sorted **Latest First → Oldest Last**).
  - Header showing category avatar, category name, **upload time** (`Uploaded 11:20 AM • 1h ago`), and Admin `➕ Post` / `🗑️ Delete` + `✕` close controls.
  - Hero visual image (`imageUrl`) automatically attached by AI (or uploaded by Admin) above the bilingual headline and key exam summary points.
  - Footer button: **`Daily Dose Quiz`**.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Category-Grouped Story Circles with Latest-First Sorting**
  - *Chosen Approach*: Group all active 24-hour stories into `chhattisgarh`, `national`, and `international` buckets, sorted by `createdAtMs` descending so the newest update always plays first when a user taps that category circle.
- **Decision 2: Automatic AI Visual Attachment + Admin Image Picker**
  - *Chosen Approach*: Every AI-generated story automatically receives a topic-matched high-resolution visual illustration (`imageUrl`), while Admin's Story Publisher modal and Admin Console include a file picker (`<input type="file" accept="image/*">`) and URL field so Admin can attach any custom image.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         "Daily Dose" Story Strip                          │
│   Header: "Daily Dose"                      Button: "Daily Dose Quiz"     │
├───────────────────────┬───────────────────────────┬───────────────────────┤
│   🌾 Chhattisgarh     │        🇮🇳 National        │   🌍 International    │
│  (Sorted Latest->Old) │   (Sorted Latest->Old)    │  (Sorted Latest->Old) │
└───────────┬───────────┴─────────────┬─────────────┴───────────┬───────────┘
            └─────────────────────────┼─────────────────────────┘
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│            Full-Screen Story Viewer (100vw × 100dvh Edge-to-Edge)         │
├───────────────────────────────────────────────────────────────────────────┤
│  [═══════ ═══════ ───────]  Segmented bars for selected category          │
│  Category Title • Upload Time (e.g. 02:15 PM • 25m ago)   [+Post] [🗑] [✕]│
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │        Story Image (AI Auto-Attached or Admin Uploaded)             │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  Bilingual Headline + Exam Bullet Summary (Tap L/R, Hold to Pause)        │
│  Footer Action: [Daily Dose Quiz]                                         │
└───────────────────────────────────────────────────────────────────────────┘
```
