# CGpedia — Question Bank Crash Fix Plan

This plan resolves the specific runtime error occurring inside the **Question Bank** module (`Cannot read properties of undefined (reading 'length')` when rendering the Category Master & Question Bank header) without altering, resetting, or rebuilding any other part of the application.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Diagnostic Finding ("Kaisi problem hai"):**
> When opening **🧠 Question Bank**, the module calls `getTaxonomyCatalog(state)` and immediately reads `catalog.topics.length` and `catalog.subtopics.length` in the Category Master header badge and tabs. However, `getTaxonomyCatalog(state)` only returns `topicMaster` and `subtopicMaster` (omitting the `topics` and `subtopics` property aliases). This throws `TypeError: Cannot read properties of undefined (reading 'length')`, triggering the **⚠️ Module View Recovery** error screen instead of rendering the Question Bank.

- **Strict Scope Constraint**: Only the Question Bank issue identified above (and its directly linked Category Master / filter lookup properties inside Question Bank) will be fixed. No other modules, layouts, or database collections will be modified or rebuilt.

---

## 1. Overview & Core Concept

- **What It Does**: Restores normal rendering and interactive operation of the **🧠 Question Bank** module by exposing the expected `topics` and `subtopics` arrays on the taxonomy catalog object, fixing the reversed parameter order in the Topic-to-Subtopic cascading filter lookup, and ensuring the safe migration summary returns `totalInspected` and `lastMigratedAt`.
- **Target Audience / Persona**: Owner Admin (`usahu0304@gmail.com`) managing bilingual questions, CSV/JSON/PDF imports, and Exam → Subject → Topic → Subtopic categorisation inside Question Bank.
- **Key Value**: Eliminates the `⚠️ Module View Recovery` crash when opening Question Bank while keeping 100% of existing data, tests, payments, and features intact.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. Admin clicks **🧠 Question Bank** in the Admin Panel navigation bar.
  2. The **Hierarchical Question Categorisation System** card, **Bulk Question Upload (CSV, JSON & Smart PDF + Answer Key)** card, **Add Single Question** card, and **Central Reusable Question Bank** repository table render immediately without throwing an error.
  3. Opening **⚙️ Manage Exams, Subjects, Topics & Subtopics** and switching between **Exam Master**, **Subject Master**, **Topic Master**, and **Subtopic Master** tabs displays all items cleanly.
  4. Filtering the Question Bank table by **Exam → Subject → Topic → Subtopic** cascades properly.
- **Visual Identity & Theme**:
  - Preserves the existing CGpedia layout, cards, badges, and styling without any visual redesign.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Alias `topics` and `subtopics` on `getTaxonomyCatalog` Return Object**
  - *Chosen Approach*: Return both `topicMaster` / `topics` and `subtopicMaster` / `subtopics` from `getTaxonomyCatalog(state)`.
  - *Why*: Both naming conventions are referenced across Question Bank rendering, Category Master tabs, and category rename handlers. Providing both aliases resolves the `undefined.length` and `.map()` crashes cleanly with zero side effects.
- **Decision 2: Fix Reversed Arguments in `catalog.findTopic` Call for Cascading Subtopic Filter**
  - *Chosen Approach*: Pass `(matchedFilterSubObj ? matchedFilterSubObj.subjectId : '', flt.topic)` to `catalog.findTopic(subVal, topicVal)` when computing `repoSubtopics`.
  - *Why*: `findTopic` expects `(subVal, topicVal)`. Passing them in the proper order ensures selecting a Topic in the Question Bank filter bar populates its matching Subtopics accurately.
- **Decision 3: Populate `totalInspected` and `lastMigratedAt` in Migration Report**
  - *Chosen Approach*: Include `totalInspected` and `lastMigratedAt` on the migration status object and sync it to `qbState.migrationReport`.
  - *Why*: Prevents `undefined inspected` in the Question Bank migration toast and status banner.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Admin Panel: 🧠 Question Bank                     │
├──────────────────────────────────────────────────────────────────────────┤
│  getTaxonomyCatalog(state)                                               │
│    ├── examCategories  (Array)                                           │
│    ├── subjects        (Array)                                           │
│    ├── topicMaster     & topics     (Aliased Array — fixes .length/.map) │
│    └── subtopicMaster  & subtopics  (Aliased Array — fixes .length/.map) │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                 renderQuestionBankManagement()                           │
│  1. Category Master Header & 4-Tab Manager (Exams/Subjects/Topics/Sub)   │
│  2. Bulk Upload (CSV / JSON / Smart PDF + Answer Key Set A/B/C/D)        │
│  3. Single Question Form & Preview                                       │
│  4. Central Question Bank Table & Cascading Filters (Exam→Subj→Top→Sub)  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping

1. **Taxonomy Catalog Resolution**: `getTaxonomyCatalog(state)` returns `topics: topicMaster` and `subtopics: subtopicMaster` alongside `topicMaster` and `subtopicMaster`.
2. **Cascading Filter Lookup**: `matchedFilterTopObj` calls `catalog.findTopic(matchedFilterSubObj ? matchedFilterSubObj.subjectId : '', flt.topic)` with arguments in the expected `(subVal, topicVal)` order.
3. **Migration Status Metadata**: `migrateExistingQuestionBankRecords` populates `totalInspected: state.questionBank.length` and `lastMigratedAt: nowIso` on `state.migrationState` and `qbState.migrationReport`.
