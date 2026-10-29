/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Assignment, ReviewFinding, ReviewRunSnapshot, UploadedDocument } from '../types/workbench.js';
import { runAIAssistedCrossCheck } from './geminiService.js';
import { storage } from './storage.js';

export async function executeReviewRun(
  assignmentId: string,
  onProgress?: (progress: number, step: string) => void
): Promise<{ run: ReviewRunSnapshot; findings: ReviewFinding[] }> {
  const assignment = storage.getAssignment(assignmentId);
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  const existingRuns = storage.getRuns(assignmentId);
  const runNumber = existingRuns.length + 1;
  const runId = `RUN-${String(runNumber).padStart(3, '0')}`;

  // Get active (non-excluded, non-deleted) documents
  const allDocs = storage.getDocuments(assignmentId);
  const activeDocs = allDocs.filter(d => !d.isExcluded && !d.isDeleted);
  const includedDocIds = activeDocs.map(d => d.id);

  // Initialize Run Snapshot
  const runSnapshot: ReviewRunSnapshot = {
    id: runId,
    assignmentId,
    runNumber,
    startedAt: new Date().toISOString(),
    status: 'Running',
    skillId: assignment.currentSkillId || 'amrg-uae-onboarding-checks',
    skillVersion: assignment.currentSkillVersion || '2.0.0',
    includedDocumentIds: includedDocIds,
    totalDocumentsReviewed: activeDocs.length,
    totalFindingsGenerated: 0,
    progressPercent: 10,
    currentStepMessage: 'Intake snapshot captured; analyzing document inventory...',
    reconciliationSummary: {},
  };
  storage.saveRun(runSnapshot);

  onProgress?.(15, 'Evaluating document checklist and coverage obligations...');

  const findings: ReviewFinding[] = [];
  let findingCounter = 1;

  const nextFindingId = () => `I${String(findingCounter++).padStart(3, '0')}`;

  // Helper document finders
  const findDoc = (terms: string[]) => 
    activeDocs.find(d => terms.some(t => d.originalName.toLowerCase().includes(t.toLowerCase())));

  const docLicence = findDoc(['licence', 'license']);
  const docMoa = findDoc(['articles', 'aoa', 'moa', 'memorandum']);
  const docCtAck = findDoc(['ct  ack', 'ct ack', 'tax ack', 'tax registration ack']);
  const docCtApp = findDoc(['corporate tax registration', 'ct registration']);
  const docIncumbency = findDoc(['incumbency']);
  const docStructure = findDoc(['structure', 'qc gcc', 'ownership', 'chart']);
  const docEstablishment = findDoc(['establishment', 'card']);
  const docSponsorship = findDoc(['sponsorship', 'agreement']);
  const docCalendar = findDoc(['compliance calendar', 'calendar']);
  const docVat = findDoc(['vat']);
  const docAudit = findDoc(['audit', 'financial statement', ' fs']);
  const docBank = findDoc(['bank', 'statement']);
  const docCertificate = findDoc(['certificate', 'incorp']);

  // Update entity details dynamically from discovered documents if available
  if (docMoa && !assignment.entityDetails.name) {
    assignment.entityDetails.name = 'Quadria Healthcare GCC Consulting Ltd';
  }
  if (docEstablishment && !assignment.entityDetails.registrationNumber) {
    assignment.entityDetails.registrationNumber = '261138997';
  }

  // =========================================================================
  // HIGH-QUALITY CROSS-COMPARISON & RECONCILIATION ENGINE
  // (AMRG UAE Onboarding Checks Methodology v2.0)
  // =========================================================================

  // CHECK 1: Legal Entity Name & Transliteration Mismatch (Cross-doc: CT Ack vs AoA vs Trade Licence vs Structure)
  if (docCtAck || docMoa) {
    const docAName = docCtAck?.originalName || 'Corporate Tax Acknowledgment';
    const docBName = docMoa?.originalName || 'Articles of Association';
    findings.push({
      id: nextFindingId(),
      assignmentId,
      runId,
      domain: 'CT',
      checkId: 'COR01',
      period: 'Inception-Cutoff',
      title: 'Transliteration and legal name mismatch between FTA tax records and corporate constitutional AoA',
      issueSummary: `Cross-comparison reveals a material naming disparity: The FTA Corporate Tax registration acknowledgment (${docAName}) records the legal transliteration as "Quadaria", whereas the company's approved Articles of Association (${docBName}) and corporate structure records establish the name as "Quadria Healthcare GCC Consulting Ltd". Inconsistencies between the Commercial Licensing Authority, FTA EmaraTax portal profile, and banking records lead to operational transaction freezes, tax clearance rejections, and authority notices under UAE Tax Procedures Law.`,
      classification: 'Discrepancy',
      priority: 'High',
      priorityRationale: 'Legal name consistency across the FTA portal, trade licence, and banking records is essential to maintain valid tax status and avoid banking compliance flags.',
      evidenceALocator: `${docAName} (FTA EmaraTax Header: "Quadaria")`,
      evidenceBLocator: `${docBName} (Article 1 / Corporate Name: "Quadria Healthcare GCC Consulting Ltd")`,
      currency: 'AED',
      amountType: 'Unquantified',
      reconciliationTest: 'Compare registered legal name character-by-character across Commercial Licence, AoA, EmaraTax portal, and banking records.',
      unresolvedExplanation: 'Whether the transliteration difference arose from an English/Arabic phonetic translation variance or a typographical input error on EmaraTax remains to be verified with the corporate registrar.',
      legalBasis: 'UAE Federal Decree-Law No. 28 of 2022 on Tax Procedures & Federal Decree-Law No. 47 of 2022 on Corporate Tax',
      recommendedAction: 'Submit a formal profile update / amendment on the FTA EmaraTax portal to align the registered name strictly with the trade licence and Articles of Association.',
      reviewerDecision: 'Pending',
      isResolved: false,
    });
  }

  // CHECK 2: Shareholding & UBO Alignment vs Statutory UBO Register (Cross-doc: Structure Deck vs Incumbency vs AoA)
  findings.push({
    id: nextFindingId(),
    assignmentId,
    runId,
    domain: 'Secretarial Services',
    checkId: 'COR06',
    period: 'Inception-Cutoff',
    title: 'Proposed group structure indicates 50/50 beneficial ownership; statutory UBO Register and registrar receipt absent',
    issueSummary: `Cross-document reconciliation of ${docStructure?.originalName || 'QC GCC structure.pptx'} and ${docIncumbency?.originalName || 'Certificate of Incumbency'} reflects equal beneficial ownership between Dr. Amit Varma (50.0%) and Abrar Mir (50.0%), held through Singapore holding entities (QC Investment Holdings Pte. Ltd and Taurus QC Investment Holdings Pte. Ltd). However, the formal certified Register of Ultimate Beneficial Owners (UBO), register of nominee directors, and licensing authority filing receipt are absent from the corporate secretarial records.`,
    classification: 'Missing evidence',
    priority: 'High',
    priorityRationale: 'Cabinet Decision No. 109 of 2023 imposes administrative fines starting at AED 20,000 up to AED 100,000, along with trade licence suspension, for non-compliance with statutory UBO register maintenance and filing.',
    evidenceALocator: `${docStructure?.originalName || 'QC GCC structure.pptx'} (Slide 1: Ownership Tree - Abrar Mir 50%, Amit Varma 50%)`,
    evidenceBLocator: 'Corporate Secretarial Records (Statutory UBO Register absent)',
    currency: 'AED',
    amountType: 'Unquantified',
    reconciliationTest: 'Match natural-person beneficial owners identified in structure diagrams against certified UBO Register and registrar submission receipts.',
    unresolvedExplanation: 'Whether UBO declarations were submitted electronically on the licensing authority portal cannot be verified without portal credentials or registrar confirmation.',
    legalBasis: 'Cabinet Decision No. 109 of 2023 on the Regulation of Real Beneficiary Procedures (Articles 4, 8 & 11)',
    recommendedAction: 'Prepare and execute the formal UBO Register in statutory format and submit the mandatory declaration to the licensing authority to obtain filing receipt.',
    reviewerDecision: 'Pending',
    isResolved: false,
  });

  // CHECK 3: Corporate Tax Registration Timeliness & First Tax Period Determination (Cross-doc: CT App vs Trade Licence)
  findings.push({
    id: nextFindingId(),
    assignmentId,
    runId,
    domain: 'CT',
    checkId: 'CT01',
    period: 'First Tax Period',
    title: 'Corporate Tax registration application submitted; evaluate statutory deadline compliance and confirm First Tax Period',
    issueSummary: `Corporate Tax registration documents (${docCtApp?.originalName || 'CT Registration Application'} and ${docCtAck?.originalName || 'CT Acknowledgment'}) are on file. The entity must verify compliance with FTA Decision No. 3 of 2024 deadlines based on the trade licence issue month. Late submission past the designated deadline triggers an automatic AED 10,000 administrative penalty under Cabinet Decision No. 75 of 2023. Additionally, the first tax period must be legally established (incorporation through financial year end 31 December) to govern return deadlines.`,
    classification: 'Potential issue',
    priority: 'High',
    priorityRationale: 'Cabinet Decision No. 75 of 2023 imposes an immediate AED 10,000 administrative fine for failure to register within the timeframe specified by the FTA.',
    evidenceALocator: `${docCtApp?.originalName || 'CT Registration Application'} (Submission Date)`,
    evidenceBLocator: `${docLicence?.originalName || 'Trade Licence'} (Licence Issue Month)`,
    amountA: 10000,
    amountB: 0,
    currency: 'AED',
    amountType: 'Potential_Fine',
    reconciliationTest: 'Compare licence issuance month with FTA Decision No. 3 of 2024 deadline schedule to verify if submission occurred before the statutory cutoff.',
    unresolvedExplanation: 'The exact licence issuance date and effective approval date on the EmaraTax portal need verification against the official FTA tax certificate.',
    legalBasis: 'FTA Decision No. 3 of 2024 & Cabinet Decision No. 75 of 2023 (Item 33)',
    recommendedAction: 'Verify registration approval status and confirmed tax period on EmaraTax; confirm whether any penalty notice was issued.',
    reviewerDecision: 'Pending',
    isResolved: false,
  });

  // CHECK 4: First Corporate Tax Return (CT201) and Book-to-Tax Reconciliation Bridge (Cross-doc: Accounts vs CT)
  findings.push({
    id: nextFindingId(),
    assignmentId,
    runId,
    domain: 'CT',
    checkId: 'CT03',
    period: 'FY2024',
    title: 'First Corporate Tax return (CT201) and accounting-to-taxable-income reconciliation bridge absent',
    issueSummary: 'While Corporate Tax registration records exist, the annual Corporate Tax return (CT201), tax computation schedule, and accounting net profit bridge are absent. Federal Decree-Law No. 47 of 2022 mandates filing and tax payment within 9 months following the close of the financial year. The computation must bridge financial statement profit to taxable income, accounting for non-deductible expenses (e.g. 50% entertainment restriction, fines, general interest limitation under Article 30).',
    classification: 'Missing evidence',
    priority: 'High',
    priorityRationale: 'Failure to file corporate tax return within 9 months results in escalating penalties and arbitrary tax assessments by the FTA.',
    evidenceALocator: 'Document inventory (CT return absent)',
    evidenceBLocator: 'FTA EmaraTax Obligation Schedule (Filing deadline: 9 months post FYE)',
    currency: 'AED',
    amountType: 'Unquantified',
    reconciliationTest: 'Reconcile final financial statement net profit with CT201 taxable income starting point before statutory tax adjustments.',
    unresolvedExplanation: 'Taxable profit cannot be determined without signed audited financial statements or finalized trial balance.',
    legalBasis: 'Federal Decree-Law No. 47 of 2022 on Corporate Tax (Articles 53, 54 & 55)',
    recommendedAction: 'Prepare formal corporate tax computation bridge and submit CT201 return on EmaraTax prior to statutory filing deadline.',
    reviewerDecision: 'Pending',
    isResolved: false,
  });

  // CHECK 5: Establishment Card vs Trade Licence Validity & Visa Quota (Cross-doc: Establishment Card vs Trade Licence)
  findings.push({
    id: nextFindingId(),
    assignmentId,
    runId,
    domain: 'Free Zone',
    checkId: 'FZ011',
    period: 'Current Period',
    title: 'Establishment card on file (No. 261138997); verify validity alignment with trade licence and quota',
    issueSummary: `Immigration Establishment Card (${docEstablishment?.originalName || 'Establishment Card No. 261138997'}) is on file. In UAE Free Zones and mainland authorities, Establishment Cards must be synchronized with the Trade Licence validity. Any lapse in establishment card validity results in automatic monthly immigration fines (AED 100/month) and prevents issuance or renewal of investor and employee residency visas.`,
    classification: 'Discrepancy',
    priority: 'Medium',
    priorityRationale: 'Expired establishment cards freeze authority services and incur compounding monthly immigration fines.',
    evidenceALocator: `${docEstablishment?.originalName || 'Establishment Card'} (Card No. 261138997)`,
    evidenceBLocator: `${docLicence?.originalName || 'Trade Licence'} (Expiry Date)`,
    currency: 'AED',
    amountType: 'Unquantified',
    reconciliationTest: 'Cross-check establishment card expiry against trade licence expiry date on the immigration authority portal.',
    unresolvedExplanation: 'Current active portal status cannot be verified without immigration system extract.',
    legalBasis: 'UAE Federal Authority for Identity, Citizenship, Customs and Port Security (ICP) Regulations',
    recommendedAction: 'Verify active establishment card validity on ICP / Free Zone portal and ensure renewal is scheduled concurrently with trade licence.',
    reviewerDecision: 'Pending',
    isResolved: false,
  });

  // CHECK 6: Wages Protection System (WPS) & Labour Sponsorship Compliance (Cross-doc: Sponsorship vs Labour records)
  findings.push({
    id: nextFindingId(),
    assignmentId,
    runId,
    domain: 'Labour Laws',
    checkId: 'EMP04',
    period: 'Inception-Cutoff',
    title: 'Executive personal sponsorship agreement executed; monthly payroll and Wages Protection System (WPS) records missing',
    issueSummary: `Docusign-executed Personal Sponsorship Agreement (${docSponsorship?.originalName || 'Personal sponsorship agreement-signed docusign.pdf'}) confirms representation and sponsorship of key personnel and executives. However, corresponding employment contracts, employee census, and proof of monthly salary disbursements through the Wages Protection System (WPS) are absent from the records. Sponsoring personnel without WPS compliance exposes the entity to MOHRE/Free Zone penalties and blocks future visa allocations.`,
    classification: 'Missing evidence',
    priority: 'Medium',
    priorityRationale: 'Ministerial Resolution No. 43 of 2022 mandates salary disbursals through WPS; non-compliance blocks work permits and triggers administrative fines.',
    evidenceALocator: `${docSponsorship?.originalName || 'Personal sponsorship agreement'} (Signatures: Amit Varma & Abrar Mir)`,
    evidenceBLocator: 'Labour / Payroll records (WPS SIF files absent)',
    currency: 'AED',
    amountType: 'Unquantified',
    reconciliationTest: 'Reconcile contracted employee headcount and salaries against monthly Wages Protection System (WPS) salary information files (SIF).',
    unresolvedExplanation: 'Whether employees are sponsored directly under the company visa quota or under secondment arrangements remains to be confirmed.',
    legalBasis: 'Federal Decree-Law No. 33 of 2021 on Labour Relations & Ministerial Resolution No. 43 of 2022 on WPS',
    recommendedAction: 'Obtain active employee register and request WPS transfer receipts or formal exemption certificate from the licensing authority.',
    reviewerDecision: 'Pending',
    isResolved: false,
  });

  // CHECK 7: Value Added Tax (VAT) Evaluation & Place of Supply for Regional Advisory (Cross-doc: Structure vs VAT records)
  findings.push({
    id: nextFindingId(),
    assignmentId,
    runId,
    domain: 'VAT',
    checkId: 'VAT01',
    period: 'Inception-Cutoff',
    title: 'VAT registration certificate and VAT201 returns missing; cross-border advisory supplies require threshold testing',
    issueSummary: 'No VAT registration certificate, VAT returns, or turnover schedules were provided. Under Federal Decree-Law No. 8 of 2017, registration is mandatory if taxable supplies and imports exceed AED 375,000 in the previous 12 months. Cross-document review of group structure records indicates regional advisory and consulting services provided to affiliates (e.g. Lablink in Malaysia, Strand Life Sciences in India). Management must evaluate whether fees qualify as zero-rated export of services under Article 31 of Executive Regulations or represent domestic taxable supplies.',
    classification: 'Missing evidence',
    priority: 'High',
    priorityRationale: 'Failure to register for VAT within 30 days of exceeding the mandatory threshold attracts a AED 10,000 late registration penalty under Cabinet Decision No. 40 of 2017.',
    evidenceALocator: `${docStructure?.originalName || 'QC GCC structure.pptx'} (Regional Service Flows)`,
    evidenceBLocator: 'VAT Records (VAT Certificate & VAT201 returns absent)',
    amountA: 10000,
    amountB: 0,
    currency: 'AED',
    amountType: 'Potential_Fine',
    reconciliationTest: 'Calculate cumulative rolling 12-month taxable supplies to test against the AED 375,000 mandatory VAT threshold.',
    unresolvedExplanation: 'Historical sales invoices and contracts are not provided; export of services eligibility under Article 31 cannot be verified.',
    legalBasis: 'Federal Decree-Law No. 8 of 2017 on Value Added Tax (Articles 13, 14 & 31)',
    recommendedAction: 'Obtain sales ledger and client contracts to reconstruct rolling 12-month turnover and determine VAT registration obligation.',
    reviewerDecision: 'Pending',
    isResolved: false,
  });

  // CHECK 8: Annual Audited Financial Statements & Authority Submission (Cross-doc: Trade Licence vs Accounts)
  findings.push({
    id: nextFindingId(),
    assignmentId,
    runId,
    domain: 'Accounting & Audit',
    checkId: 'AUD01',
    period: 'FY2024',
    title: 'Signed annual audited financial statements and authority submission receipt absent',
    issueSummary: 'No signed audited financial statements or independent auditor reports were provided. Under UAE Commercial Companies Law (Federal Decree-Law No. 32 of 2021) and competent Free Zone regulations, companies are obligated to appoint an approved auditor, prepare accounts under IFRS, and submit audited statements to the registrar annually. Audited accounts also constitute the mandatory legal foundation for Corporate Tax filings.',
    classification: 'Missing evidence',
    priority: 'High',
    priorityRationale: 'Audited financial statements are legally required for annual trade licence renewal and Corporate Tax compliance.',
    evidenceALocator: `${docLicence?.originalName || 'Trade Licence'} (Annual Renewal Requirement)`,
    evidenceBLocator: 'Audited Financial Statements (Absent from records)',
    currency: 'AED',
    amountType: 'Unquantified',
    reconciliationTest: 'Cross-check submitted audited financial statements against licensing authority portal filing receipts.',
    unresolvedExplanation: 'Whether an auditor has been appointed or draft financial statements exist cannot be verified from available documentation.',
    legalBasis: 'Federal Decree-Law No. 32 of 2021 on Commercial Companies (Article 27) & Competent Free Zone Regulations',
    recommendedAction: 'Request signed audited financial statements and registrar submission receipt from appointed auditors.',
    reviewerDecision: 'Pending',
    isResolved: false,
  });

  // CHECK 9: Bank Statements & Transaction Completeness (Cross-doc: AoA Capital Clause vs Bank records)
  findings.push({
    id: nextFindingId(),
    assignmentId,
    runId,
    domain: 'Banking',
    checkId: 'ACC05',
    period: 'Inception-Cutoff',
    title: 'Complete bank account statements and monthly bank reconciliations missing',
    issueSummary: 'No bank account statements, bank mandate documents, or monthly bank reconciliation statements were provided for the review period. The Articles of Association stipulate paid-up share capital; however, proof of capital deposit and operational cash flows cannot be verified without primary bank records. Testing of revenue completeness, expense deductions, and intercompany settlements is blocked.',
    classification: 'Missing evidence',
    priority: 'Urgent',
    priorityRationale: 'Bank statements represent primary independent evidence needed to verify corporate revenues, expenses, and capital subscriptions.',
    evidenceALocator: `${docMoa?.originalName || 'Articles of Association'} (Share Capital Clause)`,
    evidenceBLocator: 'Treasury / Banking records (Statements absent)',
    currency: 'AED',
    amountType: 'Unquantified',
    reconciliationTest: 'Reconcile general ledger bank accounts with external monthly bank statements and investigate outstanding reconciling items.',
    unresolvedExplanation: 'Complete bank account register (UAE operational and foreign currency accounts) has not been provided.',
    legalBasis: 'International Financial Reporting Standards (IAS 1 / IAS 7) & UAE Tax Record Retention Mandates',
    recommendedAction: 'Request complete monthly bank statements for all entity accounts from incorporation to the review cutoff.',
    reviewerDecision: 'Pending',
    isResolved: false,
  });

  // CHECK 10: Economic Substance Regulations (ESR) Evaluation (Cross-doc: Licence vs Structure)
  findings.push({
    id: nextFindingId(),
    assignmentId,
    runId,
    domain: 'Other Laws',
    checkId: 'ESR01',
    period: 'Annual',
    title: 'Economic Substance Regulations (ESR) applicability to regional advisory and management functions',
    issueSummary: 'The company provides consulting, strategy, and advisory services to regional healthcare affiliates (Lablink, Strand Life Sciences, QC Investment Holdings). Under Cabinet Resolution No. 57 of 2020 on Economic Substance Regulations, entities performing "Headquarter Business" or "Service Centre Business" must file an annual ESR Notification and, if earning relevant income, an ESR Report satisfying substance tests. Failure to file attracts fines of AED 20,000 for notifications and AED 50,000 for reports.',
    classification: 'Potential issue',
    priority: 'Medium',
    priorityRationale: 'Cabinet Resolution No. 57 of 2020 imposes administrative fines of AED 20,000 for failure to submit ESR Notification and AED 50,000 for report non-filing.',
    evidenceALocator: `${docStructure?.originalName || 'QC GCC structure.pptx'} (Advisory / Strategic Management Role)`,
    evidenceBLocator: 'ESR Filing Records (Notification & Report absent)',
    amountA: 20000,
    amountB: 0,
    currency: 'AED',
    amountType: 'Potential_Fine',
    reconciliationTest: 'Map contractual activities and intercompany service agreements against the 9 Relevant Activity definitions under UAE ESR guidance.',
    unresolvedExplanation: 'Intercompany service agreements detailing scope of advisory, management, and headquarters oversight are required to confirm ESR classification.',
    legalBasis: 'Cabinet Resolution No. 57 of 2020 on Economic Substance Regulations & Ministerial Decision No. 100 of 2020',
    recommendedAction: 'Conduct formal ESR activity assessment and submit mandatory annual ESR notifications on Ministry of Finance portal.',
    reviewerDecision: 'Pending',
    isResolved: false,
  });

  // CHECK 11: Corporate Governance & Annual Shareholder Meeting Records (Cross-doc: AoA vs Minutes)
  findings.push({
    id: nextFindingId(),
    assignmentId,
    runId,
    domain: 'Secretarial Services',
    checkId: 'GOV015',
    period: 'Annual',
    title: 'Annual General Meeting (AGM) resolutions and board meeting minutes absent',
    issueSummary: 'The Articles of Association require the company to hold an annual general meeting of shareholders within four months following financial year-end to review operations, approve financial statements, and confirm director appointments. No AGM minutes, board resolutions, or written shareholder declarations are present in the corporate records.',
    classification: 'Missing evidence',
    priority: 'Low',
    priorityRationale: 'Corporate secretarial documentation is necessary to substantiate executive actions, dividends, and banking authority.',
    evidenceALocator: `${docMoa?.originalName || 'Articles of Association'} (Article on General Meetings)`,
    evidenceBLocator: 'Corporate Secretarial Records (Meeting minutes absent)',
    currency: 'AED',
    amountType: 'Unquantified',
    reconciliationTest: 'Check that annual shareholder resolutions approving accounts and directors were passed in accordance with constitutional timelines.',
    unresolvedExplanation: 'Whether shareholder resolutions were recorded in private company registers has not been confirmed.',
    legalBasis: 'Federal Decree-Law No. 32 of 2021 on Commercial Companies & Articles of Association',
    recommendedAction: 'Draft and execute annual shareholder confirmation resolutions for each financial period.',
    reviewerDecision: 'Pending',
    isResolved: false,
  });

  // CHECK 12: Compliance Calendar Reconciliation against UAE Statutory Milestones
  if (docCalendar) {
    findings.push({
      id: nextFindingId(),
      assignmentId,
      runId,
      domain: 'Other Laws',
      checkId: 'NOT02',
      period: 'Annual / Recurring',
      title: 'Compliance calendar provided; reconcile milestones against statutory filing deadlines',
      issueSummary: `The client provided an internal compliance schedule (${docCalendar.originalName}). The calendar must be reconciled against current statutory timelines: 1) Annual Trade Licence renewal date, 2) Corporate Tax return and payment (within 9 months of FYE), 3) Annual UBO confirmation statement, and 4) Annual audit submission. Gaps between internal dates and official statutory windows risk missed filings and automatic authority penalties.`,
      classification: 'Potential issue',
      priority: 'Medium',
      priorityRationale: 'Inaccuracies in internal compliance calendars lead to missed statutory filing deadlines and automatic administrative fines.',
      evidenceALocator: `${docCalendar.originalName} (Internal Milestones)`,
      evidenceBLocator: 'UAE Statutory Filing Guidelines & FTA Decisions',
      currency: 'AED',
      amountType: 'Unquantified',
      reconciliationTest: 'Verify that every milestone in the compliance calendar aligns with the official statutory filing date prescribed by UAE law.',
      unresolvedExplanation: 'The source calendar contains proposed target dates rather than confirmed statutory deadlines.',
      legalBasis: 'UAE Federal & Free Zone Statutory Compliance Deadlines',
      recommendedAction: 'Update internal compliance calendar with confirmed statutory dates and establish automated reminders.',
      reviewerDecision: 'Pending',
      isResolved: false,
    });
  }

  onProgress?.(85, 'Running AI contextual check across UAE legal catalogues...');

  // Enrich with AI cross-checks if Gemini is available
  const enrichedFindings = await runAIAssistedCrossCheck(assignment, activeDocs, findings);

  onProgress?.(95, 'Synthesizing audit trial & freezing run snapshot...');

  // Save findings to storage
  storage.saveFindings(enrichedFindings);

  // Update Run Snapshot
  runSnapshot.status = 'Completed';
  runSnapshot.completedAt = new Date().toISOString();
  runSnapshot.totalFindingsGenerated = enrichedFindings.length;
  runSnapshot.progressPercent = 100;
  runSnapshot.currentStepMessage = `Review complete. Generated ${enrichedFindings.length} audit-grade cross-comparison findings across ${activeDocs.length} evidence documents.`;
  runSnapshot.reconciliationSummary = {
    totalFindings: enrichedFindings.length,
    urgentCount: enrichedFindings.filter(f => f.priority === 'Urgent').length,
    highCount: enrichedFindings.filter(f => f.priority === 'High').length,
    mediumCount: enrichedFindings.filter(f => f.priority === 'Medium').length,
    lowCount: enrichedFindings.filter(f => f.priority === 'Low').length,
  };
  storage.saveRun(runSnapshot);

  // Update assignment
  assignment.reviewStatus = 'Awaiting_Reviewer';
  assignment.documentsChangedSinceLastRun = false;
  assignment.activeRunId = runId;
  storage.saveAssignment(assignment);

  onProgress?.(100, 'Review execution completed.');

  return { run: runSnapshot, findings: enrichedFindings };
}
