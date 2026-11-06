# Question Bank — Fix Garbled Code & Multi-Question Detection in Bilingual PDFs

This plan resolves the root causes where uploading a Hindi + English (Bilingual) PDF either fails to detect questions or detects only 1 question filled with garbled symbols/code (`KrutiDev` legacy font encoding, unmapped `CID/Identity-H` font glyph codes, or raw PDF binary stream operators) in both Hindi and English fields. All changes remain strictly confined to the **Question Bank** module.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Scope & Root-Cause Decisions**
> - **Confirmed Decision 1 (File Format)**: The affected uploads are **Hindi + English PDF Question Papers** (both typed DTP PDFs and scanned/coded PDFs).
> - **Confirmed Decision 2 (Symptom Diagnosis)**: The 1 detected question displays strange English/symbol codes (`KrutiDev` legacy Hindi encoding, unmapped CID glyph codes, or raw PDF stream code) duplicated across both Hindi and English boxes, while remaining questions fail to split.
> - **Confirmed Decision 3 (Strict Boundary)**: Only the Question Bank file extraction, font decoding, OCR fallback, and question splitter will be updated. No other app modules, UI layouts, or saved Firebase data will be modified.

---

## 1. Overview & Core Concept

- **What Causes the Problem Today**:
  1. **PDF.js Cross-Origin Worker Failure in WebView**: Loading `pdf.worker.min.js` directly from a remote CDN URL triggers a browser/WebView cross-origin `Worker` restriction, causing `PDF.js` to silently fail and fall back to raw PDF stream extraction. In English-only PDFs, raw stream literals `(1. Question...) Tj` are plain ASCII, so they still work; in Hindi + English PDFs, Devanagari fonts use 2-byte `CID / Identity-H` glyph indices (`<001A002F...> Tj`), which the raw stream fallback decodes into random ASCII symbols and code.
  2. **Legacy Hindi Font Encoding (`KrutiDev` / `DevLys`)**: Many CGPSC, Vyapam, and State PSC bilingual PDFs store Hindi text in non-Unicode **KrutiDev-010 / DevLys** font (where Hindi looks like `NÙhlx<+ jkT; dk xBu...` and options look like `¼v½ ¼c½ ¼l½ ¼n½`). Because it contains no Unicode Devanagari characters (`\u0900-\u097F`), the parser treats it as Latin code and copies the same garbled string into both Hindi and English fields.
  3. **Broken `ToUnicode` CMap or Scanned PDF Pages**: Some PDFs have corrupted font CMap tables (producing Private Use Area `\uE000-\uF8FF` or symbol gibberish) or scanned page images with no text layer.
  4. **Standalone / Offset Question Numbers (`1.`, `Q.1`)**: When question numbers sit on a separate baseline or standalone line from the Hindi stem, the line regex misses question boundaries and merges the entire paper into Question 1.
- **What This Fix Delivers**:
  - Reliable **PDF.js execution** (Blob Worker + main-thread `disableWorker` fallback) so `PDF.js` never crashes into raw binary code.
  - Automatic **KrutiDev / DevLys to Unicode Devanagari conversion** for legacy Hindi text and options (`¼v½` → `(अ)`, `¼c½` → `(ब)`, `¼l½` → `(स)`, `¼n½` → `(द)`).
  - Automatic **Garbled-Code / Scanned Page Detection + Canvas OCR (`Tesseract.js` `hin+eng`)** when a PDF page has missing/corrupted font mappings or scanned images.
  - **Multi-Question Boundary Detection** supporting standalone question numbers, table-cell numbers, inline numbers after Option D, and option-group segmentation so all questions in the paper are detected individually.

---

## 2. User Experience & Workflow

- **Key User Flow**:
  1. Admin selects a Hindi + English PDF in **Question Bank → Bulk Question Upload**.
  2. The extractor loads `PDF.js` safely (using a Same-Origin Blob Worker with automatic main-thread fallback).
  3. For each page:
     - If legacy **KrutiDev / DevLys** Hindi encoding is detected, it automatically converts the Hindi segments and option markers (`¼v½..¼n½`) into clean Unicode Devanagari while preserving English segments.
     - If the extracted page text is empty (Scanned PDF) or contains garbled font/glyph code (corrupted `ToUnicode` CMap), the page is automatically rendered to an offscreen `<canvas>` and processed via bilingual **Hindi + English OCR (`hin+eng`)** with live toast progress updates.
  4. The question splitter separates every question (`1` to `N`) even when question numbers are on standalone lines, offset baselines, or two-column layouts, and populates clean Hindi in `🇮🇳 हिन्दी` and clean English in `🇬🇧 English`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Same-Origin Blob Worker + Main-Thread Fallback for `PDF.js`**
  - *Chosen Approach*: Wrap `importScripts('.../pdf.worker.min.js')` in a local `Blob` URL and automatically retry with `disableWorker: true` if worker initialization fails.
  - *Why*: Eliminates cross-origin worker failures in Android WebView and Chrome so `PDF.js` always decodes PDF font tables properly instead of falling back to raw PDF stream code.
- **Decision 2: Selective KrutiDev-to-Unicode Conversion**
  - *Chosen Approach*: Detect KrutiDev signature tokens (`¼v½`, `¼c½`, `¼l½`, `¼n½`, `NÙhlx<+`, `fuEufyf[kr`, `iz'u`, `gS`, `esa`, `dk`, etc.) at the line/clause level and convert only KrutiDev segments to Unicode Devanagari while leaving genuine English text untouched.
  - *Why*: Bilingual DTP papers mix KrutiDev Hindi and Arial/Times English in the same document; selective conversion restores readable Devanagari without corrupting the English question text.
- **Decision 3: Automatic Canvas OCR Fallback for Coded / Scanned Pages**
  - *Chosen Approach*: If extracted text fails the readability check (empty text, PUA glyphs, control characters, or symbol-code gibberish), render the PDF page to `<canvas>` and run `Tesseract.js` (`hin+eng`).
  - *Why*: Visually rendering the page bypasses broken internal PDF font maps completely because the glyphs are drawn onto the canvas exactly as a human sees them.

---

## 4. Technical Architecture & Data Strategy

```
┌───────────────────────────────────────────────────────────────────────────┐
│                 Uploaded PDF File (Typed, KrutiDev, or Scanned)           │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ 1. Safe PDF.js Loader (Blob Worker + disableWorker Main-Thread Fallback)  │
│    • Detects %PDF- magic bytes even if Android file name lacks .pdf       │
│    • Extracts items with 2-Column (Left Hindi / Right English) awareness  │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ 2. Font & Readability Inspector (Per Page)                                │
│    ├─ Has KrutiDev / DevLys patterns (`¼v½`, `NÙhlx<+`, `fuEufyf[kr`)?    │
│    │   └──► Convert KrutiDev Hindi segments & options to Unicode (देवनागरी)│
│    └─ Is page text empty OR garbled CID/PUA/symbol code?                  │
│        └──► Render PDF Page to Canvas (2.0x) → Run Tesseract OCR (hin+eng)│
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ 3. Multi-Pattern Question Splitter & Bilingual Option Extractor           │
│    • Handles standalone line numbers (`1.` on line N, stem on line N+1)   │
│    • Splits inline question numbers glued after Option D                  │
│    • Pairs Hindi + English stems & options into clean Bilingual records   │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Interactive State & Error Recovery**:
  - Never dumps raw `%PDF-` binary streams, `obj`/`endobj` dictionaries, or unmapped hex glyph codes into `questionHi` / `questionEn`.
  - Displays clear progress toasts during multi-page PDF decoding and OCR fallback, then opens the interactive **Import Preview Workbench** with all detected questions properly separated into Hindi and English.
