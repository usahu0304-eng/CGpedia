# Implementation Plan: Online Test / CBT Interface Layout & Question Navigation Improvements

## 1. Objective & Scope
Refine **only** the Online Test / CBT (Computer-Based Test) interface in `exam-engine.js` and its corresponding styles in `styles.css` (and sync the web bundle via `build-web.js`), while keeping the rest of the CGpedia platform, student dashboard, admin panel, and existing bottom navigation bar completely untouched.

---

## 2. Planned Changes

### A. Separate, Toggleable Question Palette (`exam-engine.js` & `styles.css`)
- **Closed by Default**: Initialize `session.paletteOpen = false` when a test starts so the main question display pane (`cbt-question-pane`) uses 100% of the available width without any permanent sidebar or overlapping palette obstructing the question content.
- **Dedicated Toggle Button**:
  - Provide a clearly visible `"Question Palette"` button (`#cbtToggleMobilePaletteBtn`) in the compact top bar showing a grid icon and live progress badge (e.g., `Question Palette (3/20)`).
  - Clicking `"Question Palette"` toggles `session.paletteOpen` between `true` and `false` and updates the `aria-expanded` / active visual state without losing the active question or selected option.
- **Desktop Behavior (`> 920px`)**:
  - When closed (`paletteOpen = false`), `.cbt-body` uses `grid-template-columns: 1fr` and `.cbt-palette-sidebar` is hidden (`display: none`).
  - When open (`paletteOpen = true`), `.cbt-body.palette-open` transitions cleanly to a non-overlapping 2-column side-by-side split (`grid-template-columns: 1fr 300px`) with a dedicated header and `✕` close button inside the palette panel.
  - Clicking a question number inside the palette jumps directly to that question and keeps the side panel open on desktop until toggled closed.
- **Mobile Behavior (`<= 920px`)**:
  - When opened (`paletteOpen = true`), the Question Palette opens as a compact slide-over drawer with a translucent backdrop (`#cbtPaletteBackdrop`) and a clear `✕ Close` button (`#cbtCloseMobilePaletteBtn`).
  - Clicking any question number in the palette navigates directly to that question and **automatically closes** the drawer on mobile (`window.innerWidth <= 920`) so the student immediately sees the selected question.
- **Status Colors & Counts**:
  - Maintain real-time status badges and grid colors for **Answered** (Green `#16A34A`), **Not Answered** (Red `#DC2626`), **Not Visited** (Slate `#94A3B8`), **Marked for Review** (Purple `#7C3AED`), and **Answered & Marked** (Purple with green indicator).

### B. Compact, Space-Efficient Top Header (`exam-engine.js` & `styles.css`)
- **Single-Row Compact Top Bar (`.cbt-topbar`)**:
  - Reduce vertical padding (`padding: 6px 12px`) and condense the header into a tight, single-row bar on desktop (and a compact 2-row bar on small mobile screens).
  - Display a single-line truncated exam title (`max-width`, `text-overflow: ellipsis`) alongside compact controls for:
    1. **Language Selector** (`#cbtInExamLangSelect` — compact `EN / हिं` select control)
    2. **Live Countdown Timer** (`#cbtTimerBox` / `#cbtLiveClockDisplay` — high-contrast compact pill)
    3. **Question Palette Toggle Button** (`#cbtToggleMobilePaletteBtn`)
    4. **Submit Test Button** (`#cbtOpenSubmitSummaryBtn` — compact button)
- **Compact Section Strip & Question Meta Row**:
  - Reduce vertical padding on `.cbt-section-bar`, `.cbt-q-header`, and `.cbt-q-scroll` so the question text and all 4 answer options start immediately below the top header and fit comfortably on screen without unnecessary vertical scrolling.

### C. Strict Preservation of Existing Bottom Navigation Bar & Other Modules
- **Bottom Action Bar (`.cbt-bottom-bar`)**:
  - Keep all four existing bottom navigation buttons completely intact in design, styling, labels, order, and behavior:
    1. `Previous` (`#cbtPrevBtn`)
    2. `Mark for Review` (`#cbtMarkReviewNextBtn`)
    3. `Clear Response` (`#cbtClearResponseBtn`)
    4. `Save & Next` / `Next Question` (`#cbtSaveNextBtn`)
- **Zero Impact on Other Files**:
  - Do not modify `app.js`, `admin-console.js`, `firebase-sync.js`, or any non-CBT styles.
  - Run `node build-web.js` to sync the updated `exam-engine.js` and `styles.css` to `dist/`, `public/`, and `app/src/main/assets/`, and verify with `compile_applet`.
