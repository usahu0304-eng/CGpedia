# CGpedia In-App Update Notification & Admin Version Control System

Deliver a real-time, Admin-controlled **In-App APK Update Alert** system so that whenever a new CGpedia APK version is released, students running an older installed APK automatically receive an optional bilingual update prompt with release notes and a one-tap download button.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user during clarification:
> - **Confirmed Decision 1 (Admin-Controlled In-App Update Popup)**: Add a dedicated App Version & Update Manager inside the Admin Panel where the Owner Admin (`usahu0304@gmail.com`) can publish the latest version number, APK download link, and bilingual release notes (`1st Hindi`, `2nd English`).
> - **Confirmed Decision 2 (Optional Update with Remind Later)**: When a student's installed app version is older than the Admin-published latest version, show a non-blocking, optional update dialog featuring **"अभी अपडेट डाउनलोड करें / Download Update Now"** and **"बाद में याद दिलाएं / Remind Me Later"** buttons so students can continue taking tests without disruption.

---

### 1. Overview & Core Concept

- **What It Does**: Bridges the gap between cloud-synced content (which updates automatically via Firebase) and APK-level code/UI updates (which require installing the new APK). When the Admin publishes a new APK release in the Admin Panel, all students on older installed versions immediately see an update notification banner and optional popup dialog with a direct APK download button.
- **Target Audience / Persona**:
  - **Students**: Aspirants preparing for **CGPSC & CGSSB** who installed CGpedia via APK and want a simple one-tap way to update their app whenever new UI/security features are released.
  - **Owner Admin (`usahu0304@gmail.com`)**: Manages the latest published version code, version name, APK download link (e.g., Google Drive / Telegram / direct APK URL), and bilingual "What's New" notes directly from the Admin Panel without touching code.
- **Key Value**: Eliminates student confusion about whether their installed app is up to date and provides a seamless, Play-Store-like update prompt for direct APK distribution.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Student Automatic Version Check**:
     - On app launch, CGpedia compares the locally installed `versionCode` against the real-time `latestVersionCode` stored in Cloud Config.
     - If `latestVersionCode > installedVersionCode` and the student has not dismissed the prompt for the current session, a bilingual **In-App Update Dialog** appears.
     - Tapping **"अभी अपडेट डाउनलोड करें / Download Latest APK"** opens the Admin-configured APK download link in the browser to install the update directly over the existing app.
     - Tapping **"बाद में याद दिलाएं / Remind Me Later"** dismisses the popup for the current session while keeping a subtle "Update Available" badge in Settings and on the Home header.
  2. **Settings Manual Update Check**:
     - In the Settings screen, students can see their currently installed version (e.g., `v2.0 • CGPSC & CGSSB`) alongside a **"Check for App Update / ऐप अपडेट जांचें"** card.
  3. **Admin Panel Version Publisher**:
     - Under the **Support & Config** tab in the Admin Panel, the Admin can update:
       - Latest Version Code (e.g., `2`, `3`, etc.) & Version Name (e.g., `2.1.0`)
       - Direct APK Download URL (or Telegram/Drive APK link)
       - Bilingual Release Notes (**1st Hindi Devanagari**, **2nd English**)
     - Clicking **Save & Publish** immediately broadcasts the update prompt to all connected student devices.

- **Visual Identity & Theme**:
  - **Aesthetic Direction**: Authoritative Academic & Sovereign Civic palette (**Strict Zero-Orange Policy**).
  - **Color Palette & Mood**: Deep Academic Navy (`#0B385F`) primary headers, Royal Cobalt (`#0D6DD6`) interactive download call-to-action buttons, Glacier Cyan-Teal (`#007B8A`) version badges, and Emerald (`#0F8A5F`) verification accents.
  - **Typography & Hierarchy**: Bilingual hierarchy displaying **Hindi (Devanagari)** first in bold body/title weight and **English** directly underneath in clean secondary contrast.
  - **Component Styling & Layout**: Material 3 elevated modal dialog with rounded `24.dp` corners, version comparison pill (`Installed v1.0 → New v2.0`), bulleted bilingual changelog card, and accessible `48.dp+` action buttons.
- **Interactive Feedback & Motion**: Smooth animated entry for the update banner and instant snackbar confirmation when the Admin publishes a new version configuration.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Optional Session-Dismissible Update Prompt vs. Hard Blocking Gate**
  - *Chosen Approach*: Optional popup with a **"Remind Me Later"** button plus a persistent update card in Settings.
  - *Why*: Ensures students who are about to start a timed mock test on slow mobile data are not locked out of practicing, while still clearly notifying them of new APK releases.
  - *Alternatives Considered*: Mandatory blocking modal was passed over per user preference to keep test access frictionless.
- **Decision 2: Cloud-Backed Version Metadata in Global AppConfig**
  - *Chosen Approach*: Store `latestVersionCode`, `latestVersionName`, `apkDownloadUrl`, `updateNotesHi`, and `updateNotesEn` inside the existing real-time global `AppConfig` document in Firestore (with matching Firestore security rule validation).
  - *Why*: Leverages the existing authenticated real-time listener so version alerts propagate instantaneously to all students with zero extra network queries.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CGpedia Student & Admin UI                      │
│                                                                         │
│  ┌──────────────────────────────┐     ┌──────────────────────────────┐  │
│  │   Student In-App Update UI   │     │  Admin Support & Version UI  │  │
│  │  • Optional Update Dialog    │     │  • Latest Version Code/Name  │  │
│  │  • "Remind Later" State      │     │  • APK Download URL Input    │  │
│  │  • Settings Version Checker  │     │  • Bilingual Release Notes   │  │
│  └──────────────┬───────────────┘     └──────────────┬───────────────┘  │
└─────────────────┼────────────────────────────────────┼──────────────────┘
                  │                                    │
                  ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     ViewModel & Version State Layer                     │
│  • Compares installed APK VersionCode vs. Cloud latestVersionCode       │
│  • Tracks session "Remind Later" dismissal state                        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                Cloud Firestore (app_config / main)                      │
│  • latestVersionCode, latestVersionName, apkDownloadUrl                 │
│  • updateNotesHi (1st Hindi), updateNotesEn (2nd English)               │
│  • Protected by Zero-Trust Firestore Security Rules (Admin Write Only)  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - Extend `AppConfig` with default-safe properties:
    - `latestVersionCode: Long` (defaults to current build version)
    - `latestVersionName: String` (e.g., `"2.0.0"`)
    - `apkDownloadUrl: String` (direct URL or official Telegram/Drive APK link)
    - `updateNotesHi: String` & `updateNotesEn: String`
  - Update `firestore.rules` and `firebase-blueprint.json` so `isValidAppConfig()` validates the optional version update fields and preserves Admin-only write access (`usahu0304@gmail.com`).
- **Interactive Component & State Mapping**:
  - **In-App Update Modal (`InAppUpdateDialog`)**: Displays when `appConfig.latestVersionCode > installedVersionCode` and `isUpdateDismissedForSession == false`.
  - **"Download Update Now" Handler**: Launches `Intent(Intent.ACTION_VIEW, Uri.parse(apkDownloadUrl))` safely with fallback to the official Telegram/WhatsApp support channel if no URL is configured.
  - **"Remind Me Later" Handler**: Sets `isUpdateDismissedForSession = true` in ViewModel state so the popup closes immediately without re-triggering until the next app launch or manual check in Settings.
  - **Admin Instant Publisher**: Validates inputs and commits the updated `AppConfig` map to Firestore, showing immediate confirmation feedback.
