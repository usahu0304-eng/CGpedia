# Daily Dose (WhatsApp-Style Seen/Unseen Stories, AI Image Badge & Current Affairs Sync) Plan

## 1. Oldest-to-Latest Story Ordering & Direct Jump to First Unseen Story
- **Chronological Sequence (`Oldest → Latest`)**:
  - Inside each category circle (**Chhattisgarh**, **National**, **International**), sort stories in chronological order from **Oldest (`createdAtMs` ascending) to Latest**, matching WhatsApp Status and Instagram Stories.
- **Persistent Seen/Unseen Tracking (`state.seenStoryIds`)**:
  - Track viewed story IDs in `state.seenStoryIds` (persisted in `localStorage`).
  - Whenever a story slide is opened/displayed in the Full-Screen Story Viewer, automatically mark its `id` as **Seen**.
- **Resume Directly at First Unseen Story**:
  - When a user taps a category circle, keep the full `Oldest → Latest` list intact, locate the **first unseen story index**, and open the Story Viewer directly at that slide.
  - Users can still tap left to revisit earlier **Seen** stories in the same sequence or tap right / wait for auto-advance through the remaining **Unseen** stories.
  - If all stories in that category have already been seen, start from the first story (`index 0`).

## 2. WhatsApp-Style Seen vs. Unseen Visual Indicators
- **Segmented Category Circle Ring**:
  - Render an SVG segmented ring around each category circle (`Chhattisgarh`, `National`, `International`) with one arc segment per story in that category:
    - **Unseen segments**: Vibrant WhatsApp/Instagram accent color (`#10B981` / `#EA580C`).
    - **Seen segments**: Muted slate grey (`#94A3B8`).
- **Explicit Seen & Unseen Count Labels**:
  - Beneath each category circle and on its badge, clearly display how many stories are **Unseen (New)** and how many are **Seen** (e.g., `2 Unseen • 1 Seen` or `All 3 Seen`).
  - Inside the Full-Screen Story Viewer header and segmented progress bar, display `Seen: X • Unseen: Y` and a per-slide status tag (`✨ Unseen` / `✓ Seen`).

## 3. Gemini AI Generated Story Image + "AI Generated" Badge
- **Topic-Specific AI Visual Generation**:
  - When Gemini AI or the Auto-Uploader creates/posts a Current Affairs story and no real photo URL is attached, automatically generate a topic-relevant visual banner (`isAiGeneratedImage: true`).
  - If Admin manually uploads an image file or pastes a photo URL, mark `isAiGeneratedImage: false`.
- **Mandatory "AI Generated" Mention**:
  - Embed an **`✨ AI Generated`** watermark inside the generated SVG visual AND display a clear **`✨ AI Generated Image`** pill badge on the image container in both the Full-Screen Story Viewer and Current Affairs cards whenever `isAiGeneratedImage !== false`.

## 4. Fix Story Count Mismatch Between Daily Dose & Current Affairs Section
- **Root Cause Found**:
  - Home Dashboard (`activeStories`) included stories with missing/zero timestamps and AI-generated stories whose `monthKey` defaulted to an older AI date string, whereas the Current Affairs page filtered `recent24hStories` and `monthlyStories` with stricter/different rules—causing Daily Dose to show more stories than the Current Affairs section.
- **Unified Story Pool & Sync**:
  - Create a single canonical helper (`getUnifiedCurrentAffairsStories()`) used by both **Home Dashboard (Daily Dose)** and **Current Affairs View**.
  - Normalize every story's `createdAtMs`, `monthKey`, and `yearKey` from its actual upload timestamp so that every story shown in **Daily Dose** is guaranteed to appear in the **Current Affairs** section with identical counts.
  - Deduplicate stories by ID and normalized headline across `state.stories` so no duplicate entries inflate the Daily Dose count.
