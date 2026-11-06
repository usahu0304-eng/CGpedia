# Implementation Plan: Native PDF Page-to-Image AI Vision Scanner & Optional Answer Key (Question Bank Only)

## 1. Root Cause Analysis (Why AI Had Trouble Reading Some PDFs)
1. **Scanned & Custom-Font PDFs Dropped Before Reaching AI:**
   - Previously, when a PDF was scanned (image-only) or used non-Unicode Hindi fonts (like KrutiDev/Chanakya/DevLys without a Unicode CMap), browser text extraction produced empty or garbled text and dropped those pages instead of sending the visual page images to Gemini Vision.
2. **Native Android PDF-to-Image Vision Bridge Missing:**
   - Android provides native `android.graphics.pdf.PdfRenderer` which can render every PDF page directly into a crisp `Bitmap` image offline without relying on external CDN scripts (`pdf.js` / `tesseract.js`), and pass those page images straight into **Firebase AI Logic (`gemini-3.8-flash` multimodal vision)**.
3. **JSON Wrapping & Inline Answer Handling:**
   - Gemini responses occasionally wrap JSON arrays inside markdown fences (`` ```json ... ``` ``) or `{ "questions": [...] }` objects, and papers that already contain answers inside the Question Paper (inline `उत्तर: (A)` / ticked option / answer table at the end) needed first-class support without requiring a separate Answer Key file.

---

## 2. Targeted Fixes (Strictly Inside Question Bank Only)

### A. Native Android `PdfRenderer` + Gemini Multimodal Vision (`MainActivity.kt`)
- Add `@JavascriptInterface fun analyzePdfPagesWithAi(base64PdfData: String, promptText: String, startPage: Int, endPage: Int, callbackId: String)` to `CgpediaAndroidBridge` in `/app/src/main/java/com/example/MainActivity.kt`:
  - Decodes the uploaded PDF bytes into a temporary cache file and opens it with Android's native **`android.graphics.pdf.PdfRenderer`**.
  - Renders each page in the batch (e.g., 2–3 pages per batch at high-clarity scale) into a `Bitmap` with a white background.
  - Passes all page `Bitmap`s + the structured extraction prompt directly to **`Firebase.ai.generativeModel("gemini-3.8-flash")`** using `content { image(pageBitmap1); image(pageBitmap2); text(promptText) }`.
  - Strips any markdown code fences (` ```json `) and returns clean JSON to the WebView.

### B. Canvas Page-to-Image Vision Fallback + Robust JSON Parser (`admin-console.js`)
- In `/admin-console.js`:
  - Add a bullet-proof `parseAiJsonArraySafely(rawStr)` helper that strips markdown fences, extracts `[...]` or `{ questions: [...] }`, and never fails on formatting variations.
  - Update `scanAndCategorizeWithAiOrFallback`:
    1. **Primary Path for PDFs on Android:** Sends the PDF in page batches (e.g. pages 1–3, 4–6, ...) directly to `window.AndroidBridge.analyzePdfPagesWithAi(...)` so **Gemini 3.8 Flash Vision visually reads every page** (Hindi + English text, KrutiDev/scanned fonts, 2-column layouts, options A–D, and any inline/highlighted answers).
    2. **Secondary Path (PDF.js Canvas to Image Vision):** If `pdf.js` is active, renders PDF pages to `<canvas>` JPEG data URLs and sends them to `analyzeQuestionImageWithAi`.
    3. **Enhanced Local Parser Fallback:** Also improves `extractTextFromUploadedFile` and `parsePdfOcrAndMatchAnswerKey` so inline answers (`उत्तर: (A)`, `Ans: B`, `[✓]`, `सही उत्तर: विकल्प C`) inside the Question Paper are automatically extracted even offline.

### C. Answer Key File Made 100% Optional (`वैकल्पिक — जरूरी नहीं है`)
- Update the Question Bank upload UI label & workflow in `renderQuestionBankManagementV2`:
  - Clearly label Box 2 as **`2️⃣ उत्तर कुंजी फ़ाइल (वैकल्पिक / Optional — यदि प्रश्न-पत्र में उत्तर नहीं हैं)`**.
  - Priority order for determining the correct option (`A / B / C / D`) for every question:
    1. **Separate Answer Key File / Pasted Key** (if uploaded by Admin).
    2. **Answer Present Inside the Question Paper Itself** (inline `उत्तर / Ans`, bold/ticked option, or answer table at the end of the Question Paper).
    3. **AI Auto-Solve** (if no answer is given anywhere, Gemini AI solves the question and sets the accurate option + bilingual explanation).

---

## 3. Strict Scope Guarantee
- Only `/app/src/main/java/com/example/MainActivity.kt` (AI bridge) and the Question Bank section in `/admin-console.js` will be modified. No other screens, tabs, or features will be changed.
