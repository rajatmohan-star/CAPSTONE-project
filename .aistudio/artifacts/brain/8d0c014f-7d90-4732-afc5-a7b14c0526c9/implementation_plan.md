# AMRG Review Workbench — UAE Client Onboarding Review

A specialized enterprise review workbench for **AMRG Global** to intake client corporate, tax, and accounting documents, apply the approved UAE onboarding review skill and checklist via Gemini multimodal intelligence, conduct deterministic cross-document reconciliations, enforce reviewer approvals, and generate the fixed-format AMRG Excel deliverable.

## User Review & Critical Decisions

> [!IMPORTANT]
> Key architectural decisions confirmed by the user during Phase 1:
> - **Authentication & Persistence Strategy**: Full-stack backend persistence (Express + persistent SQLite/JSON store and file storage) paired with an instant role-switcher (Administrator, Preparer, Reviewer) and a direct Firebase Auth/Firestore link toggle for multi-tenant deployment.
> - **Initial Data State**: Clean initial workbench with no synthetic sample records, ready for genuine document intake, OCR processing, and onboarding analysis.
> - **Excel Output Specification**: Strict generation matching the attached AMRG templates, with Sheet 1 as *Title & Summary* (basic client details, periods covered, laws reviewed, documents received/not received, and numbered broad issues), followed by domain sheets (*CT*, *VAT*, *Free Zone*, *Banking*, *Secretarial Services*, *Labour Laws*, *Other Laws*, *Accounting & Audit*), supporting coverage schedules, and draft vs. final watermarking.

---

## 1. Overview & Core Concept

**AMRG Review Workbench** is designed for accounting and tax professionals at AMRG Global performing historical corporate and tax onboarding reviews in the UAE. When taking over from previous advisors or assessing historical exposure, firms must review messy archives spanning multiple financial years: trade licences, MoAs, audited financial statements, general ledgers, bank statements, VAT returns (VAT201), Corporate Tax returns, and regulatory notices.

### Key Value
- **Zero Hallucination Guarantee**: Strict distinction between confirmed non-compliance, missing evidence, potential issues, and document discrepancies. Unknown exposure amounts remain blank—never arbitrarily assumed to be zero.
- **Multimodal Document Extraction**: Automatically ingests multi-format uploads (PDFs, scans, Excel files, CSVs, DOCX, text) with OCR vision processing, flagging unreadable pages or incomplete batches.
- **Versioned Review State & Reruns**: Adding, excluding, or modifying documents flags existing findings with *"Documents changed—rerun required"* and preserves immutable run snapshots and audit trails.
- **Reviewer Governance**: Interactive findings allow preparers and reviewers to accept, adjust, comment on, and verify evidence before a *"Final"* report is generated.

---

## 2. User Experience & Visual Design

### Aesthetic Direction & AMRG Branding
- **Color Palette**:
  - Primary AMRG Emerald: `#0A7C3B` (UAE official green) and `#56AD36` (accent green)
  - Corporate Deep Navy: `#05466C` (trust, enterprise structure)
  - Dark Charcoal Base: `#13151B`
  - Canvas: Pristine light slate (`#F8FAFC`) with hairline borders (`#E2E8F0`)
- **Typography & Layout**:
  - High-density professional layout with 260px left navigation, sticky assignment workspace toolbar, and dense tabular data displays.
  - Tabular numerals (`font-mono tabular-nums`) across all financial amounts, tax numbers, and dates.
  - Zero-pill metadata discipline: quiet unboxed text separated by typographic middots (`·`).

### Six Primary Application Screens
1. **Dashboard**: High-level overview of active client onboarding reviews, status breakdown (Intake, In Review, Awaiting Reviewer, Finalized), upcoming statutory deadlines, and recent runs.
2. **Clients**: Client directory displaying UAE entities, trade licence numbers, tax registration numbers (TRN), assigned lead partner/reviewer, and active assignments.
3. **Assignments (The Core Workbench)**:
   - *Intake & Entity Profile*: Client name (mandatory), extracted trade licence details, financial year-end, first CT period, VAT status, and confirmation badges.
   - *Document Inventory & Management*: Multi-file / folder / ZIP upload, file status (Discovered, Extracted, Partial, Excluded, Deleted), exclusion toggles, replacement, and permanent deletion with confirmation.
   - *Review Engine & Progress*: Prominent **Run / Re-run Review** action, real-time stage progress (Extraction → Obligation Mapping → Cross-Reconciliation → Validation), and rerun alerts.
   - *Findings & Resolution Matrix*: Filterable domain findings (CT, VAT, Free Zone, Banking, Secretarial, Labour, Accounting & Audit) with dual-evidence locators, exposure calculations, and reviewer sign-off controls.
   - *Reconciliations & Coverage*: Detailed arithmetic bridges (Sales to VAT, Book Profit to CT starting point, Bank statements to General Ledger).
4. **Skills & Templates**: Admin management of published review skills (AMRG UAE Onboarding Draft v2.0), checklist rules (GOV, ACC, VAT, CT, FZ, OTH series), and Excel sheet mappings.
5. **Reports & Exports**: Report history with version tags, generation timestamps, reviewer approval badge, draft download (watermarked), and final locked XLSX export.
6. **Settings**: Role management (Administrator, Preparer, Reviewer), persistent storage inspection, Firebase configuration status, and AI model health.

---

## 3. Key Product Decisions & Trade-Offs

- **Deterministic Math + AI Reasoning**: Arithmetic tests (tax differences, reconciliation residuals, date overdue calculations) are computed deterministically in code. Gemini 3.8 Flash is used for OCR/vision, table parsing, legal rule interpretation, and exception detection.
- **Full Excel Generation via `exceljs`**: Rather than generating static CSV files, the backend/client generates formatted `.xlsx` workbooks preserving multi-tab architecture, formulas (`SUM`, differences), cell styles, column widths, and AMRG corporate branding.
- **Snapshot Immutability**: Each review run stores a frozen manifest of the included document hashes and skill version. If documents are added or excluded later, existing results are preserved with clear lineage, and fresh reviewer approval is required before a new Final report is generated.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AMRG Review Workbench (Client)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  React 19 + TypeScript + Tailwind CSS v4 + Motion + Lucide                  │
│  ├── Top Bar: AMRG Brand Lockup · Active Role Switcher · Global Actions     │
│  ├── Navigation: Dashboard · Clients · Assignments · Skills · Reports       │
│  └── Assignment Workbench:                                                  │
│      ├── Entity & Scope Card (Inception-to-Cutoff, First CT Period, TRN)    │
│      ├── Document Manager (Drag & Drop, Folder/ZIP, Exclude, Replace)       │
│      ├── Review Runner & Realtime Progress Stepper                          │
│      ├── Domain Findings Matrix (Law-wise tabs, dual evidence locators)     │
│      └── Excel Report Generator (Draft vs. Final with Reviewer Approval)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (/api/*)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    Express Full-Stack Server (`server.ts`)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ├── /api/assignments       : Create, update, snapshot, list assignments    │
│  ├── /api/documents/upload  : Multi-file / ZIP intake, storage & metadata   │
│  ├── /api/documents/extract : OCR / Text extraction using Gemini Vision     │
│  ├── /api/review/run        : Multi-stage review engine (Checklist & Rules) │
│  ├── /api/review/approve    : Reviewer sign-off & audit trail logging       │
│  └── /api/reports/export    : ExcelJS workbook builder matching AMRG spec   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Gemini AI Service (@google/genai SDK on server with GEMINI_API_KEY)        │
│  Local Disk / Storage (/data/uploads, /data/reports, /data/workbench.db)    │
│  Firebase Bridge (Optional Auth & Firestore sync hook)                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Complete Implementation Sequence
1. **Backend Infrastructure (`server.ts`)**:
   - Initialize Express with file upload handling (`multer`), JSON database persistence, and API routes.
   - Configure `@google/genai` on the server using `gemini-3.8-flash`.
   - Implement ExcelJS workbook builder replicating the exact sheet structure:
     - `Title & Summary` (all 7 required sections)
     - `CT`, `VAT`, `Free Zone`, `Banking`, `Secretarial Services`, `Labour Laws`, `Other Laws`, `Accounting & Audit`
     - `Documents Received`, `Documents Not Received`, `Coverage & Reconciliations`
2. **Client State & Services (`src/`)**:
   - Types and schemas matching the AMRG UAE Onboarding skill.
   - API client for assignments, document inventory, review execution, and report downloads.
   - User role context (Administrator, Preparer, Reviewer) with role-based action gating.
3. **User Interface Implementation**:
   - Dashboard with assignment pipeline and recent activity.
   - Assignment detail view with document intake, OCR viewer, rerun alerts, finding cards, and reviewer sign-off controls.
   - Skills & checklist library view.
   - Report generator with draft watermarking and reviewer approval verification.
4. **Verification & Testing**:
   - Run `compile_applet` and test the end-to-end workflow from blank state: create assignment → upload documents → run review → review findings → approve as reviewer → export Excel report.
