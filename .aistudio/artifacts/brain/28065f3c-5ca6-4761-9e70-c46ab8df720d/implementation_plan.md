# CGpedia — Question Bank File Upload Fix Plan

This plan resolves the specific issues preventing CSV, JSON, and PDF files (Question Papers & Answer Keys) from uploading and importing smoothly in **🧠 Question Bank**, while leaving all other modules, layouts, and existing Firebase data completely untouched.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Root Causes Identified ("Aisa kyo ho raha hai"):**
> 1. **Android WebView File Picker MIME-Type Rejection:** When clicking the Question Bank file upload input (`accept=".csv,.json,.pdf,..."`), the Android WebView wrapper passed the raw `.csv` extension / multi-type string directly into Android's `GetMultipleContents` intent. Android requires a valid single MIME type (such as `*/*`), causing the file picker to fail or grey out `.csv`, `.json`, and `.pdf` files.
> 2. **Binary PDF Read as Plain Text (`readAsText`):** Question Paper and Answer Key `.pdf` files were read via `FileReader.readAsText(file)`, which corrupts compressed binary PDF streams (`FlateDecode`) and fails to extract numbered questions from real PDFs.
> 3. **Answer Key File State Reset on Re-Render:** Uploading an Answer Key file before or after a Question Paper could lose its extracted text when the Question Bank view re-rendered.
> 4. **Overly Strict Row Rejection on Upload:** Uploaded CSV/JSON/PDF rows that contained only Hindi (or only English), omitted explanations, or used a new Subject/Topic name were marked as hard errors (`REJECTED_ERROR`) instead of auto-filling bilingual fallbacks and importing safely.

- **Strict Safety & Scope Constraint**: Only the Question Bank file upload pipeline and the Android WebView file chooser callback will be updated. No application rebuild, layout changes, or database modifications outside Question Bank file upload will be performed.

---

## 1. Overview & Core Concept

- **What It Does**: Enables reliable file selection and parsing for `.csv`, `.json`, and `.pdf` files in the Question Bank across both Android WebView and web browsers, with real PDF text extraction, persistent Answer Key matching, and forgiving row validation.
- **Target Audience / Persona**: Owner Admin (`usahu0304@gmail.com`) uploading CSV, JSON, or PDF Question Papers and Answer Keys into the Central Reusable Question Bank.
- **Key Value**: Ensures every valid CSV, JSON, and PDF file opens in the file picker, parses into the Import Preview workbench, matches Answer Key columns, and saves to the Question Bank without false rejections.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. Admin clicks **1. Select CSV / JSON / Question Paper PDF** or **2. Upload Answer Key PDF** inside **🧠 Question Bank**.
  2. The device file picker opens with all document types (`.csv`, `.json`, `.pdf`, `.txt`) selectable.
  3. During PDF parsing, a brief loading toast notifies the Admin while pages and compressed streams are decoded.
  4. Single-language (Hindi-only or English-only) questions and rows without explanations automatically populate fallback text with a non-blocking warning instead of being rejected.
  5. Clicking **✅ Validate and Continue** imports the questions into the Central Reusable Question Bank and syncs to Firebase.
- **Visual Identity & Theme**:
  - Zero visual or layout changes to the existing Admin Panel or Student Panel.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Safe Universal MIME Type (`*/*`) for Multi-Format File Inputs in Android WebView**
  - *Chosen Approach*: When `fileChooserParams.acceptTypes` contains file extensions (`.csv`, `.json`, `.pdf`) or multiple MIME types, launch the Android file picker with `*/*` and always resolve `fileUploadCallback` even when canceled.
  - *Why*: Prevents Android `ActivityNotFoundException` and ensures `.csv`, `.json`, and `.pdf` files are never greyed out by OS MIME filters, nor is the `<input type="file">` locked after canceling.
- **Decision 2: Real PDF Text Extraction (PDF.js + Native `DecompressionStream` Fallback)**
  - *Chosen Approach*: Read `.pdf` files as `ArrayBuffer` (`Uint8Array`) instead of `readAsText()`. Extract text using PDF.js when available, and fall back to decompressing PDF `FlateDecode` streams via `DecompressionStream('deflate')` / `DecompressionStream('deflate-raw')` and decoding `Tj`/`TJ` text operators.
  - *Why*: Real CGPSC / Vyapam PDFs use compressed streams that `readAsText()` cannot read.
- **Decision 3: Non-Blocking Fallbacks for Single-Language Rows, Missing Explanations, and New Categories**
  - *Chosen Approach*: If a CSV/JSON/PDF row provides only Hindi or only English text/options, mirror it to the other language with a warning; if explanation is empty, provide a default correct-option explanation; if Subject/Topic is new, auto-register or flag as a warning instead of rejecting the row.
  - *Why*: Prevents real-world question files from having 100% of their rows rejected due to missing secondary-language columns or explanations.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 File Selection (WebView & Browser)                       │
│  • <input type="file"> (#admBulkFileInput / #admPdfAnswerKeyFileInput)   │
│  • WebChromeClient.onShowFileChooser -> Normalized MIME ("*/*" / image)  │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│               Async File Reader & PDF Stream Decoder                     │
│  • CSV / JSON / TXT  ──► UTF-8 Text Reader (BOM & Header Normalized)     │
│  • PDF Question/Key  ──► ArrayBuffer ──► PDF.js + FlateDecode Inflate    │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│          buildAndValidatePreviewSession() & Import Workbench             │
│  • Auto-fills single-language stem/options & missing explanations        │
│  • Preserves uploaded Answer Key text across Set A/B/C/D switches        │
│  • Commits validated records to Central Reusable Question Bank           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping

1. **Android WebView File Chooser**: Normalizes `acceptTypes` to `"image/*"` when strictly image-only, and `"*/*"` for document/multi-extension inputs (`.csv`, `.json`, `.pdf`). Safely clears `fileUploadCallback` on empty selection.
2. **Async PDF & File Extraction**: `extractTextFromUploadedFile(file)` handles `.pdf` binary buffers asynchronously and feeds the extracted text into `buildAndValidatePreviewSession`.
3. **Persistent Upload State**: `qbState.pendingAnswerKeyText` and `qbState.lastUploadedFileName` preserve uploaded Answer Key and Question Paper state across UI re-renders.
