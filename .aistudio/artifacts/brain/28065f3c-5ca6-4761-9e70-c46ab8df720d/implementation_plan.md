# CGpedia — Startup Splash Screen Hang Fix (Browser & Android App)

Resolves the startup hang where CGpedia stays stuck on the splash screen in both the browser and the Android app whenever an existing logged-in account is stored in `localStorage`.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Root Cause Diagnosis (Not a Network or User System Issue)**:
> During initial boot, `let authStateCheckComplete = isStudentAuthenticated()` was executed before `const BLOCKED_FAKE_EMAIL_DOMAINS = new Set([...])` was initialized. In JavaScript, accessing a `const` variable before its declaration line triggers a **Temporal Dead Zone (`ReferenceError: Cannot access 'BLOCKED_FAKE_EMAIL_DOMAINS' before initialization`)** whenever a saved account email exists in `localStorage`. This halted top-level script execution before `DOMContentLoaded` could hide the splash screen.

- **Confirmed Decision**: Immediately fix the initialization order in the startup script, add a fail-safe splash screen dismissal guard, and bump the Service Worker cache version so both Browser and Android App open cleanly without requiring manual cache clearing.

## 1. Overview & Core Concept

- **What It Does**: Restores instant startup and splash-screen dismissal across both the Web Browser (PWA) and the Android App while preserving all features (strict online real-account authentication, announcement edit/pin/unpin, hourly non-repeating Current Affairs, Instagram-style stories, monthly archive with month jumper, and customizable Current Affairs Quiz Maker).
- **Target Audience / Persona**: All CGpedia students and administrators opening the app on Android or Web browsers.
- **Key Value**: Eliminates the startup `ReferenceError` and guarantees the splash overlay always transitions smoothly into the application workspace.

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **App / Browser Launch**: `BLOCKED_FAKE_EMAIL_DOMAINS` and `isValidRealEmailAddress` are initialized at the very top of the script before `loadState()` and `isStudentAuthenticated()` run.
  2. **Guaranteed Splash Dismissal**: The splash screen smoothly hides within `650ms` on `DOMContentLoaded`, backed by an independent inline fail-safe timer so the splash overlay can never permanently block the UI.
  3. **Seamless Cache Refresh**: Service Worker cache version is incremented so browsers and installed PWAs automatically fetch the fixed script bundle.
- **Visual Identity & Theme**:
  - Preserves the existing CGpedia Royal Navy (`#0F2557`), Saffron (`#EA580C`), and clean surface card layout untouched.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Top-of-Module Initialization of Email Domain Validator**
  - *Chosen Approach*: Declare `BLOCKED_FAKE_EMAIL_DOMAINS` and `isValidRealEmailAddress()` at the top of the module scope before `loadState()` and `isStudentAuthenticated()`.
  - *Why*: Prevents any Temporal Dead Zone (`ReferenceError`) when validating saved sessions at boot time.
- **Decision 2: Unified Parameter Signature for Current Affairs Quiz & Deduplication Helpers**
  - *Chosen Approach*: Support both object-style options and positional arguments in `generateCurrentAffairsQuizQuestionsWithAi` and `enrichAndDeduplicateCurrentAffairsItems`.
  - *Why*: Ensures calls from both the Student Current Affairs Quiz Maker and the Admin Console work seamlessly without signature mismatches.

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     CGpedia Startup & Boot Sequence                      │
├──────────────────────────────────────────────────────────────────────────┤
│  1. Top-Level Constants & Validators                                     │
│     ├── BLOCKED_FAKE_EMAIL_DOMAINS (Initialized first)                   │
│     └── isValidRealEmailAddress(rawEmail)                                │
│                                                                          │
│  2. Initial State Hydration                                              │
│     ├── state = loadState()                                              │
│     └── authStateCheckComplete = isStudentAuthenticated() (Safe call)    │
│                                                                          │
│  3. DOMContentLoaded & Fail-Safe Splash Guard                            │
│     ├── Hides #splashOverlay after 650ms                                 │
│     ├── Connects Firebase Cloud Sync & Hourly Current Affairs Updater    │
│     └── Calls renderApp() -> Dashboard or Auth Portal                    │
└──────────────────────────────────────────────────────────────────────────┘
```
