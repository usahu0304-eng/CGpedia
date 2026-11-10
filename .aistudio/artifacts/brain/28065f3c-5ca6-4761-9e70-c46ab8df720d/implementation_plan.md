# Fix GitHub Push "Invalid argument" Error

This plan resolves the `"Invalid argument"` error encountered when pushing the CGpedia project to GitHub by removing oversized temporary APK binaries from the workspace root and updating ignore configurations so build artifacts are never included in GitHub API payloads.

## User Review & Critical Decisions

> [!IMPORTANT]
> Confirmed choice from clarification:
> - **Confirmed Decision**: Remove the temporary 52 MB `CGpedia-v7.1.apk` file (and temporary `serve-apk.js` helper) from the workspace root and update `.gitignore` / `.vercelignore` so GitHub pushes succeed cleanly without affecting any application code or Question Bank data.

## 1. Overview & Core Concept

- **What It Does**: Cleans up untracked, oversized binary files (`CGpedia-v7.1.apk` at 52 MB) that exceed GitHub API payload limits during AI Studio's "Push to GitHub" operation, and hardens ignore rules against future binary build outputs.
- **Target Audience / Persona**: Project admin pushing CGpedia updates to GitHub and deploying the web app.
- **Key Value**: Immediate, error-free GitHub synchronization while keeping all Central Question Bank upgrades, Web assets, and Android source code intact.

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. Remove temporary APK binary and helper server file from the project root.
  2. Add ignore patterns (`*.apk`, `*.aab`, `.build-outputs/`, `serve-apk.js`) to repository ignore files.
  3. Trigger **Push to GitHub** from AI Studio Settings without `"Invalid argument"` payload errors.
- **Visual Identity & Theme**: No changes to the existing CGpedia UI theme, colors, typography, or layouts.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Delete Root APK Artifact & Ignore Build Outputs**
  - *Chosen Approach*: Delete the 52 MB root APK copy and add `*.apk`, `*.aab`, and `.build-outputs/` to ignore rules.
  - *Why*: GitHub's Git Data / Contents API rejects large binary blobs or oversized single-commit payloads with `Invalid argument`. Source code and assets remain under 5 MB total once APK binaries are excluded.
  - *Alternatives Considered*: Keeping the APK in the root directory—rejected because AI Studio's GitHub exporter scans root files and fails when serializing 52 MB binary blobs.

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌──────────────────────────────────────────────────────────────┐
│                   AI Studio Workspace Root                   │
├──────────────────────────────────────────────────────────────┤
│  [1] Delete Temporary Oversized Artifacts                    │
│      ├── Remove 52 MB root APK binary                        │
│      └── Remove temporary APK HTTP helper script             │
│                                                              │
│  [2] Harden Repository Ignore Configuration                  │
│      ├── Exclude *.apk, *.aab, .build-outputs/               │
│      └── Preserve Web + Android source & Question Bank sync  │
└──────────────────────────────┬───────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────┐
│             GitHub Push API (Clean Source Payload)           │
└──────────────────────────────────────────────────────────────┘
```

- **Data Model & State**: Zero changes to `admin-console.js`, Firebase configuration, Central Question Bank data, or Android source code.
