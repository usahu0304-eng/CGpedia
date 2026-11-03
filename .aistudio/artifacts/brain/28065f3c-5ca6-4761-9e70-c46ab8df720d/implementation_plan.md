# CGpedia APK Direct Cloud Download Link & Build Restoration Plan

## 1. Overview
The previous `ais-dev-*.run.app` preview URL points to the AI Studio container's streaming preview proxy rather than a public static file server, which prevented the APK from downloading in standard mobile or desktop browsers. We will restore the deleted notification helper, build a fresh `CGpedia.apk`, host it on a verified public HTTPS cloud mirror that downloads immediately on any browser without authentication, and connect that live link to the in-app APK Download & Share buttons.

---

## 2. Planned Steps

### A. Restore `CurrentAffairsNotificationHelper.kt`
- Recreate `com.example.service.CurrentAffairsNotificationHelper` so the 60-minute background Current Affairs sync continues to trigger native Android push notifications (`cgpedia_ca_sync_channel`) and `MainViewModel.kt` compiles cleanly.

### B. Build Fresh APK & Generate Verified Public Cloud Download Link
- Compile the latest debug APK (`app-debug.apk` / `CGpedia.apk`) with all CGPSC & CGSSB features included.
- Upload the compiled `CGpedia.apk` to a direct-download HTTPS cloud host and verify the returned download URL (`HTTP 200 OK` with binary `application/vnd.android.package-archive` / `application/octet-stream` headers) so it works immediately when tapped on any phone or computer.

### C. Update In-App Download & Share Controls
- Update the default `apkDownloadUrl` in `CgpediaRepository` and `SettingsScreen` so both the **In-App Update Popup** and the **Settings / Profile "Download Latest APK" & "Share APK Link"** buttons open and share the verified public direct-download link.
- Provide the clickable direct download link in chat along with one-tap copy/download instructions.
