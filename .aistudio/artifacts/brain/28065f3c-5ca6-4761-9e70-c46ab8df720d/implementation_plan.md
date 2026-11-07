# Screen Rotation Desktop View & Post-Login Push/Local Notifications Plan

This update unlocks screen rotation for installed apps, automatically switches the layout between the normal mobile site in Portrait mode and a full 1280px Desktop Site view in Landscape mode, and prompts users for notification permission immediately after login so they receive instant alerts for new Tests, Broadcast Announcements, and Current Affairs updates.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Strict Scope Lock**: Only screen rotation (Portrait normal view vs. Landscape 1280px Desktop Site view) and post-login notification permissions/alerts will be updated. All other features, layouts, and data remain untouched.

- **Confirmed Decision 1 (Landscape Desktop View)**: When the phone is upright (Portrait), the app renders in normal mobile view; when rotated sideways (Landscape), the viewport automatically switches to a full **1280px wide Desktop Site view** with the top horizontal navigation bar and hidden mobile bottom bar.
- **Confirmed Decision 2 (Post-Login Notification Triggers)**: Immediately after login, the app requests system notification permission (both Android native `POST_NOTIFICATIONS` and Web/PWA `Notification` API) and sends system notifications whenever a new **Published Test**, **Admin Broadcast Announcement**, or **Current Affairs Story** arrives.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Rotation Unlock & Auto Desktop Mode**: Removes the portrait lock in the PWA manifest and configures the Android Activity/WebView so rotating the phone smoothly transitions between normal mobile view (Portrait) and a 1280px wide Desktop Site view (Landscape) without losing state or reloading the page.
  2. **Immediate Post-Login Notification Permission & Alerts**: Requests notification permission right after user login and dispatches real system notifications (Android status bar + Web/PWA Service Worker notifications) whenever the Admin publishes a new Test, sends a Broadcast Announcement, or posts Current Affairs.
- **Target Audience / Persona**: Students and Admin users using the installed Android app or installed PWA on mobile devices.
- **Key Value**: Lets students comfortably view wide desktop tables, CBT layouts, and top navigation simply by rotating their phone, and ensures no student misses newly published tests or announcements.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Portrait to Landscape Rotation Flow**:
     - **Upright (Portrait)**: Standard responsive mobile viewport (`width=device-width, initial-scale=1.0`) with sticky bottom navigation bar.
     - **Rotated (Landscape)**: Automatically updates the viewport to `width=1280` (with proportional initial scale and pinch-zoom enabled), activates `.landscape-desktop-mode`, displays the full desktop top navigation bar, and hides the mobile bottom navigation bar.
     - **Rotated Back to Portrait**: Smoothly restores the normal mobile viewport and layout without page reload.
  2. **Post-Login Notification Flow**:
     - As soon as a user logs in (or opens an active logged-in session where permission hasn't been granted yet), the native Android/Browser notification permission dialog is triggered.
     - Whenever a new Published Test, Broadcast Announcement, or Current Affairs update syncs from Cloud Firestore, the user receives a system notification on their phone with the title and summary; tapping the notification opens CGpedia directly.
- **Visual Identity & Theme**:
  - Preserves the existing CGpedia Royal Navy (`#0F2557`) and Saffron (`#EA580C`) theme and typography without altering any existing screen designs.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Seamless Rotation Without Activity Recreation**
  - *Chosen Approach*: Configure `android:screenOrientation="fullUser"` and `android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboardHidden"` on `MainActivity` alongside `useWideViewPort = true` and `loadWithOverviewMode = true`, and change `"orientation": "any"` in `manifest.webmanifest`.
  - *Why*: Prevents Android from destroying and reloading the WebView when rotating the device (which would interrupt active tests or forms) and allows CSS/JS to switch instantly to the 1280px Desktop layout.
- **Decision 2: Dual Native Android Bridge + PWA Service Worker Notifications**
  - *Chosen Approach*: Bridge `requestNotificationPermission()` and `postNotification(...)` in `MainActivity.kt` (`AndroidBridge`) using `CgpediaNotificationHelper`, while also using the standard Web `Notification` API + Service Worker `showNotification` for browser/PWA users.
  - *Why*: Guarantees notifications work reliably both inside the installed Android APK and in mobile Chrome/Edge PWA installs.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   DEVICE ROTATION & VIEWPORT MANAGER                    │
│  • PWA Manifest: orientation = "any"                                    │
│  • Android Activity: screenOrientation="fullUser" + configChanges       │
│  • JS Orientation Listener:                                             │
│     ├─ Portrait  ──► <meta viewport="width=device-width, scale=1.0">    │
│     └─ Landscape ──► <meta viewport="width=1280"> + .landscape-desktop  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                POST-LOGIN NOTIFICATION & ALERT PIPELINE                 │
│  1. User Login (activateStudentAccountSession)                          │
│     ├─ Android APK ──► AndroidBridge.requestNotificationPermission()    │
│     └─ Web / PWA   ──► Notification.requestPermission()                 │
│                                                                         │
│  2. Real-Time Cloud Sync (mergeCloudCollection)                         │
│     ├─ New Published Test (`tests`)                                     │
│     ├─ New Broadcast Announcement (`notifications`)                     │
│     └─ New Current Affairs Story (`stories`)                            │
│          │                                                              │
│          ▼                                                              │
│     Deduplicate via `cgpedia_notified_items_v1` ──► Dispatch System     │
│     Notification (CgpediaNotificationHelper / ServiceWorker)            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **Orientation Detection & Viewport Switching**:
  - Listens to `window.addEventListener('orientationchange', ...)`, `window.addEventListener('resize', ...)`, and `screen.orientation`.
  - Detects physical landscape orientation via `window.matchMedia('(orientation: landscape)')` / screen aspect ratio so that even after setting `<meta name="viewport" content="width=1280">`, returning to portrait is accurately detected via `window.screen.availWidth < window.screen.availHeight`.
- **Notification Deduplication Store (`cgpedia_notified_items_v1`)**:
  - Records the IDs of existing Tests, Announcements, and Current Affairs on initial baseline load, and triggers a system notification whenever any new item ID appears from Cloud Firestore.
