# Implementation Plan: Complete Anthem Audio Management & Student Audio Player

## 1. Objective & User Decisions
Enhance the existing **CGpedia** application with a complete **Anthem Audio Management** system inside the existing Admin Panel (`⚙️ Branding, Security & Anthem` tab) and a student-facing **Expandable Floating Anthem Audio Player**, while preserving all existing modules, data, and Firebase architecture.

- **Audio Format & Size Validation**: Support `MP3`, `WAV`, and `M4A` audio formats with strict validation up to **15 MB** per audio file and clear error messaging for unsupported or oversized files.
- **Admin Interface Location**: Located inside the existing **Branding, Security & Anthem Settings** (`activeSection === 'branding'`) tab of the Admin Panel without modifying Dashboard KPIs, Test Series Builder, or other modules.
- **Student Playback Experience**: Clicking the header **Anthem** button opens an **Expandable Floating Player** displaying the published Anthem Title & Description, Play/Pause control, timeline progress bar, and Volume slider, allowing students to listen without manual file downloads (`controlsList="nodownload"`). Only published Anthem content is visible to students.

---

## 2. Firebase Storage & Database Architecture

### A. Firebase Storage Setup (`/index.html` & `/firebase-sync.js`)
- Load the official Firebase Storage compat SDK (`https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js`) in `/index.html` alongside the existing Firebase App, Auth, and Firestore scripts.
- Initialize `firebase.storage()` in `/firebase-sync.js` using the existing project (`cgpedia-2bd5c`) and storage bucket (`cgpedia-2bd5c.firebasestorage.app`).
- Expose two Storage helper methods on `window.CGpediaCloud`:
  - `uploadAnthemAudioFile(file, onProgress)`:
    - Validates administrator identity (`isAdminEmail()`).
    - Uploads the selected audio file to Firebase Storage under `anthem_audio/anthem_<timestamp>_<sanitizedFileName>` using `storageRef.put(file, metadata)`.
    - Streams real-time upload progress (`bytesTransferred / totalBytes * 100`) to `onProgress(percent, statusText)`.
    - Retrieves and returns `{ downloadUrl, storagePath, fileName, mimeType, sizeBytes }`.
  - `deleteAnthemAudioFile(storagePath)`:
    - Deletes the existing audio file from Firebase Storage (`storage.ref(storagePath).delete()`) when an administrator replaces or deletes the Anthem audio.

### B. Anthem Metadata in Firestore (`app_config/global`)
- Store lightweight Anthem metadata inside `state.config.anthemData` (persisted in `app_config/global` in the existing Firestore database `ai-studio-979b8fd0-d7c0-4a84-9cf4-a3ba11f93f40`):
  - `title`: Anthem Title (e.g., `"Chhattisgarh Rajya Geet — Arpa Pairi Ke Dhar"`)
  - `description`: Anthem Description / Subtitle
  - `downloadUrl`: Firebase Storage HTTPS playback URL
  - `storagePath`: Firebase Storage object path (`anthem_audio/...`)
  - `fileName`: Original uploaded file name
  - `mimeType`: Validated audio MIME type (`audio/mpeg`, `audio/wav`, `audio/mp4`, `audio/x-m4a`)
  - `sizeBytes`: File size in bytes
  - `published`: Boolean (`true` when published and visible to students)
  - `updatedAtIso`: ISO timestamp of last publish/update
  - `updatedByEmail`: Administrator email
- Large audio binaries are stored in Firebase Storage rather than Firestore documents.

### C. Security Rules (`/storage.rules` & `/firestore.rules`)
- Create `/storage.rules` enforcing:
  - Read access to `/anthem_audio/{allPaths=**}` for students/clients so published Anthem audio can stream smoothly.
  - Write and delete access restricted strictly to authorized administrators (`request.auth != null && request.auth.token.email == 'usahu0304@gmail.com'`), enforcing `request.resource.size <= 15 * 1024 * 1024` (15 MB) and valid audio content types (`audio/.*`).
- Keep `/firestore.rules` aligned so `app_config/global` remains readable by students and writable only by authorized administrators.

---

## 3. Admin Panel Anthem Audio Management (`/admin-console.js`)
Inside the `branding` section (`⚙️ Branding, Security & Anthem`), add a dedicated **🎵 Anthem Audio Management Studio** card with:
1. **Anthem Metadata Inputs**:
   - **Anthem Title** input (`#admAnthemTitle`)
   - **Anthem Description** textarea/input (`#admAnthemDescription`)
   - **Published Visibility Toggle** (`#admAnthemPublishedToggle`)
2. **Device Audio File Selector & Validation**:
   - File input (`#admAnthemFileInput`, `accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"`) and **Select / Replace Audio File** button.
   - Immediate client-side validation checking:
     - Supported extensions/MIME types (`MP3`, `WAV`, `M4A`).
     - Maximum file size of **15 MB** (`15 * 1024 * 1024` bytes).
   - Clear inline validation error banner (`#admAnthemErrorBox`) if an unsupported format or oversized file (> 15 MB) is chosen.
3. **Pre-Publish Local Audio Preview**:
   - Before uploading, displays the selected file's name, format badge, and size in MB, along with an interactive **Pre-Publish Preview Player** (Play/Pause button, current/total time, and seek bar) using an object URL (`URL.createObjectURL(file)`) so the admin can verify the audio before publishing.
4. **Upload Progress & Status Indicator**:
   - **Upload & Publish Anthem** button (`#admUploadPublishAnthemBtn`).
   - Live progress bar (`0% – 100%`) and status badge (`Uploading...`, `Publishing metadata...`, `Published & Live`).
5. **Published Audio Management (Play/Pause, Replace, Delete)**:
   - Displays the currently published Anthem card with Title, Description, File Name, Size, Published status badge, and an embedded **Play / Pause** preview control.
   - **Replace Audio File** button (triggers file selection and cleanly deletes the previous Storage object upon uploading the replacement).
   - **Delete Anthem Audio** button (`#admDeleteAnthemAudioBtn`) with confirmation to remove the audio file from Firebase Storage and clear/unpublish the Anthem metadata in Firestore.

---

## 4. Student-Side Expandable Floating Anthem Player (`/app.js` & `/styles.css`)
- **Visibility Rule**:
  - The header `#anthemToggleBtn` (`🎵 Anthem`) is visible to students **only** when `state.config.anthemEnabled !== false` AND `state.config.anthemData && state.config.anthemData.published && state.config.anthemData.downloadUrl`.
- **Expandable Floating Player UI**:
  - Clicking `#anthemToggleBtn` opens/toggles a floating Anthem Player card anchored cleanly below the top header (responsive on desktop and mobile):
    - Displays the **Anthem Title** and **Anthem Description**.
    - **Play / Pause** toggle button with live playback state indicator.
    - Interactive **Seek / Timeline Progress Bar** with elapsed and total duration (`mm:ss / mm:ss`).
    - **Volume Slider** (`0%` to `100%`) with mute/unmute icon button.
    - Streamed directly via HTML5 `Audio` / `<audio controlsList="nodownload" preload="metadata">` with context-menu download prevention so students listen seamlessly without manual file download prompts.

---

## 5. Verification & Build Sync Plan
1. Run `node build-web.js` to sync `/index.html`, `/styles.css`, `/firebase-sync.js`, `/admin-console.js`, and `/app.js` to `/dist/` and `/app/src/main/assets/`.
2. Run `compile_applet` to verify the Android build passes cleanly.
3. Verify file validation (rejecting non-audio files and files > 15 MB), pre-publish audio preview, Firebase Storage upload progress, Replace/Delete workflows, and Student-side expandable floating playback.
