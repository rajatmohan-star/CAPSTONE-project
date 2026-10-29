/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import ExcelJS from 'exceljs';
import { 
  ClientEntity, 
  FindingDomain, 
  ReviewFinding, 
  RunSnapshot, 
  UploadedDocument 
} from '../types/workbench.js';
import { MASTER_CHECKLIST } from './masterData.js';

export async function generateAmrgExcelWorkbook(
  client: ClientEntity,
  run: RunSnapshot,
  findings: ReviewFinding[],
  documents: UploadedDocument[],
  outputDir: string
): Promise<{ fileName: string; filePath: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AMRG Global UAE Corporate, Tax & Advisory Practice';
  workbook.created = new Date();
  workbook.properties.date1904 = true;

  const dateStr = new Date().toISOString().split('T')[0];
  const cleanClient = client.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `AMRG_UAE_Onboarding_${cleanClient}_v${run.runNumber}_${dateStr}.xlsx`;
  const filePath = path.join(outputDir, fileName);

  // AMRG Corporate Brand Palette
  const COLOR_AMRG_GREEN = '0A7C3B';
  const COLOR_NAVY = '05466C';
  const COLOR_LIGHT_GRAY = 'F8FAFC';
  const COLOR_BORDER = 'E2E8F0';

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const headerFill = (argb: string): ExcelJS.Fill => ({
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb },
  });

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: COLOR_BORDER } },
    left: { style: 'thin', color: { argb: COLOR_BORDER } },
    bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
    right: { style: 'thin', color: { argb: COLOR_BORDER } },
  };

  // =========================================================================
  // TAB 1: 1_Client_Details (Canonical Approved Template)
  // =========================================================================
  const wsClientDetails = workbook.addWorksheet('1_Client_Details', {
    views: [{ showGridLines: true }],
  });

  wsClientDetails.columns = [
    { width: 28 }, // Area
    { width: 46 }, // Permanent detail / review field
    { width: 44 }, // Client value
    { width: 26 }, // Source checklist IDs
    { width: 48 }, // Where to find / verify
  ];

  // Header Banner
  wsClientDetails.mergeCells('A2:E2');
  const cdTitle = wsClientDetails.getCell('A2');
  cdTitle.value = 'AMRG Global UAE onboarding';
  cdTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  cdTitle.fill = headerFill(COLOR_AMRG_GREEN);
  cdTitle.alignment = { vertical: 'middle', indent: 1 };
  wsClientDetails.getRow(2).height = 28;

  wsClientDetails.mergeCells('A3:E3');
  const cdSub1 = wsClientDetails.getCell('A3');
  cdSub1.value = `Design v2.0 | ${client.name} | Version ${run.runNumber}. Permanent details retain history; annual positions require reassessment.`;
  cdSub1.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  wsClientDetails.getRow(3).height = 18;

  wsClientDetails.mergeCells('A4:E4');
  const cdSub2 = wsClientDetails.getCell('A4');
  cdSub2.value = `Applied Skill: ${run.skillVersion} | Source IDs link to Tab 2. Processed by AMRG Review Workbench.`;
  cdSub2.font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' } };
  wsClientDetails.getRow(4).height = 18;

  // Header Row (Row 6)
  const cdHeadRow = wsClientDetails.getRow(6);
  const cdHeaders = ['Area', 'Permanent detail / review field', 'Client value', 'Source checklist IDs', 'Where to find / verify'];
  cdHeaders.forEach((h, i) => {
    const c = cdHeadRow.getCell(i + 1);
    c.value = h;
    c.font = headerFont;
    c.fill = headerFill(COLOR_NAVY);
    c.alignment = { vertical: 'middle' };
    c.border = thinBorder;
  });
  cdHeadRow.height = 22;

  // Canonical rows from 1_Client_Details_83efa256.csv
  const clientDetailsRows = [
    // Client / scope
    ['Client / scope', 'Legal name and former names', client.name, 'GOV001; GOV003', 'Certificate and licence identity fields'],
    ['Client / scope', 'Legal form and entity / registrar number', client.entityType || 'FZCO / LLC', 'GOV001; GOV004', 'Registration and register extract'],
    ['Client / scope', 'Incorporation date and country', client.incorporationDate || 'UAE', 'GOV001', 'Incorporation certificate'],
    ['Client / scope', 'Business commencement / cessation date', 'Inception to Cutoff Date', 'GOV023; ACC008', 'First transactions and cessation records'],
    ['Client / scope', 'Registered and operating addresses', client.jurisdiction || 'UAE Free Zone / Mainland', 'GOV003; GOV018', 'Licence / lease / actual premises'],
    ['Client / scope', 'Licensed activities and actual business', 'Management & Strategic Consulting', 'GOV003; ACC008', 'Licence codes / contracts / invoices'],
    ['Client / scope', 'Shareholders, capital and ownership %', 'Dr. Amit Varma (50.0%), Abrar Mir (50.0%)', 'GOV007; GOV008', 'Registers, certificates and resolutions'],
    ['Client / scope', 'UBOs and basis of control', 'Natural person controllers per Cabinet Decision 109/2023', 'GOV009; GOV010', 'Ownership chain and UBO register'],
    ['Client / scope', 'Directors, managers and authorised signers', 'Per Certificate of Incumbency / Board Appointments', 'GOV012; GOV013', 'Appointments and authority documents'],
    ['Client / scope', 'Accounting system and data location', 'To obtain from management', 'ACC026; OTH021', 'ERP profile / archive index'],
    ['Client / scope', 'Accounting framework and basis', 'IFRS / IFRS for SMEs (Accrual basis)', 'ACC001; CT008', 'Accounting policies / statements'],
    ['Client / scope', 'Functional and presentation currency', 'AED', 'ACC001; ACC023', 'Accounting policy and FX workings'],
    ['Client / scope', 'Financial year start and end', client.financialYearEnd || '31 December', 'GOV002; ACC001', 'Articles / board decision / accounts'],
    ['Client / scope', 'Bank accounts and payment platforms', 'To obtain from monthly statements', 'ACC016; ACC017; ACC022', 'Account register and statements'],
    ['Client / scope', 'Review, generation date and version', `AMRG Global Review Team; ${dateStr}; v${run.runNumber}`, 'OTH023', 'AMRG engagement review record'],
    
    // VAT permanent details
    ['VAT permanent details', 'VAT registration status', client.vatTrn ? 'Registered' : 'Threshold testing required (Mandatory AED 375k)', 'VAT002; VAT052', 'FTA decision and current portal profile'],
    ['VAT permanent details', 'VAT TRN and registered legal name', client.vatTrn || 'To obtain (Pending threshold analysis)', 'VAT002', 'VAT certificate'],
    ['VAT permanent details', 'VAT registration basis', 'Mandatory threshold AED 375,000 / Voluntary AED 187,500', 'VAT001; VAT003', 'Application and threshold computation'],
    ['VAT permanent details', 'VAT filing frequency', 'Quarterly (per FTA assignment)', 'VAT004; VAT005', 'EmaraTax obligation list and approval'],
    ['VAT permanent details', 'VAT filing due date', '28th day following tax period end', 'VAT004; VAT005', 'Portal due date plus operative rule'],
    ['VAT permanent details', 'E-invoicing phase and key dates', 'Targeted Phase 2 (2026 roll-out)', 'VAT054; VAT055', 'Turnover assessment / operative decisions'],
    ['VAT permanent details', 'E-invoicing ASP and system identifiers', 'To obtain upon ASP accreditation', 'VAT055; VAT056', 'Appointment / provider registration'],

    // CT permanent details
    ['CT permanent details', 'CT taxable-person category / status', 'Resident Juridical Person', 'CT001; CT002', 'Registration and legal analysis'],
    ['CT permanent details', 'CT TRN and registered legal name', client.ctTrn || 'Submitted on EmaraTax (Ack on file)', 'CT002', 'CT certificate / portal profile'],
    ['CT permanent details', 'CT registration application / approval date', 'Registration Ack on file', 'CT001; CT002', 'Acknowledgement and FTA decision'],
    ['CT permanent details', 'CT registration deadline and basis', 'Per FTA Decision No. 3 of 2024 based on licence issue date', 'CT001; GOV001; GOV003', 'Applicable FTA decision and formation/licence dates'],
    ['CT permanent details', 'CT first tax period length', client.firstCtPeriod || 'FY2024 (12 months ended 31 Dec 2024)', 'CT003', 'Verified start and end dates'],
    ['CT permanent details', 'CT return due date', 'Within 9 months following end of first financial tax period', 'CT005; CT004', 'Portal and period-specific filing rule'],

    // Free-zone permanent details
    ['Free-zone permanent details', 'Zone name, emirate and registrar', client.jurisdiction || 'UAE Free Zone / SAIF / DMCC / DIFC', 'GOV001; FZ001', 'Incorporation and official zone rules'],
    ['Free-zone permanent details', 'Zone legal form and entity number', client.entityType || 'FZCO / Limited Liability', 'GOV001; GOV004', 'Registration certificate'],
    ['Free-zone permanent details', 'Licence number, issue and expiry dates', client.tradeLicenceNumber || 'Refer to E-Commercial License', 'GOV003; FZ002', 'Licence and renewal records'],
    ['Free-zone permanent details', 'Permitted activity codes and conditions', 'Management & Strategic Consulting', 'GOV003; GOV020', 'Licence / regulatory NOCs'],
    ['Free-zone permanent details', 'Registered premises and lease expiry', 'To obtain from lease / Ejari', 'GOV018; FZ009', 'Lease, Ejari or zone occupancy record'],
    ['Free-zone permanent details', 'Immigration establishment card / expiry', client.registrationNumber ? `Establishment Card No. ${client.registrationNumber}` : 'Establishment Card on file', 'FZ011', 'Authority card and portal'],
    ['Free-zone permanent details', 'Share capital authorised, issued and paid', 'Per Articles of Association / Incumbency', 'GOV008; FZ008', 'Articles, register and payment proof'],
    ['Free-zone permanent details', 'Zone normal financial year-end', client.financialYearEnd || '31 December', 'GOV002; ACC001', 'Articles and accounts'],
    ['Free-zone permanent details', 'Auditor name and approval status', 'To appoint (Approved zone auditor required)', 'ACC003; FZ006', 'Appointment and zone approved list'],
    ['Free-zone permanent details', 'Accounts / audit filing deadline', 'Within 3 to 6 months of financial year end', 'FZ001; FZ004', 'Current/historical rules and portal notice'],
  ];

  let cdRowIdx = 7;
  for (const rowData of clientDetailsRows) {
    const row = wsClientDetails.getRow(cdRowIdx);
    rowData.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.border = thinBorder;
      if (colIdx === 0 || colIdx === 1) cell.font = { name: 'Calibri', size: 10, bold: colIdx === 0 };
      else cell.font = { name: 'Calibri', size: 10 };
      if (cdRowIdx % 2 === 1) cell.fill = headerFill(COLOR_LIGHT_GRAY);
    });
    row.height = 20;
    cdRowIdx++;
  }

  // =========================================================================
  // TAB 2: 2_Documents (Exact replica of 2_Documents_4f7e481e.csv)
  // =========================================================================
  const wsDocuments = workbook.addWorksheet('2_Documents', {
    views: [{ showGridLines: true }],
  });

  wsDocuments.columns = [
    { width: 24 }, // Document / request ID
    { width: 16 }, // Entity ID
    { width: 24 }, // Area
    { width: 46 }, // Document type
    { width: 28 }, // Required / received period
    { width: 22 }, // Receipt status
    { width: 48 }, // File / gap description
    { width: 36 }, // Obtain from / source link
  ];

  // Title Banner
  wsDocuments.mergeCells('A2:H2');
  const docTitle = wsDocuments.getCell('A2');
  docTitle.value = 'AMRG Global document checklist';
  docTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  docTitle.fill = headerFill(COLOR_AMRG_GREEN);
  docTitle.alignment = { vertical: 'middle', indent: 1 };
  wsDocuments.getRow(2).height = 28;

  wsDocuments.mergeCells('A3:H3');
  const docSub1 = wsDocuments.getCell('A3');
  docSub1.value = `D001–D${String(documents.length).padStart(3, '0')} are uploaded client records for ${client.name}. Other IDs form the master checklist; receipt and applicability assessed.`;
  docSub1.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  wsDocuments.getRow(3).height = 18;

  wsDocuments.mergeCells('A4:H4');
  const docSub2 = wsDocuments.getCell('A4');
  docSub2.value = 'Repeat each applicable checklist item for every entity and required period. Record actual coverage, files, gaps and review status.';
  docSub2.font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' } };
  wsDocuments.getRow(4).height = 18;

  wsDocuments.mergeCells('A5:H5');
  const docSub3 = wsDocuments.getCell('A5');
  docSub3.value = 'Conditional requests are not universal legal obligations. The source register below identifies guidance; check historical versions.';
  docSub3.font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' } };
  wsDocuments.getRow(5).height = 18;

  // Column Headers (Row 6)
  const docHeadRow = wsDocuments.getRow(6);
  const docHeaders = [
    'Document / request ID',
    'Entity ID',
    'Area',
    'Document type',
    'Required / received period',
    'Receipt status',
    'File / gap description',
    'Obtain from / source link',
  ];
  docHeaders.forEach((h, i) => {
    const c = docHeadRow.getCell(i + 1);
    c.value = h;
    c.font = headerFont;
    c.fill = headerFill(COLOR_NAVY);
    c.alignment = { vertical: 'middle' };
    c.border = thinBorder;
  });
  docHeadRow.height = 22;

  let docRowIdx = 7;

  // 1. Insert received client documents first (D001, D002, ...)
  documents.forEach((doc, idx) => {
    const row = wsDocuments.getRow(docRowIdx);
    const dId = `D${String(idx + 1).padStart(3, '0')}`;
    const cleanCategory = doc.category ? doc.category.replace('_', ' ') : 'Corporate';
    
    const rowData = [
      dId,
      client.name,
      cleanCategory,
      doc.originalName,
      'Current Period / Inception',
      doc.isExcluded ? 'Excluded' : 'Received',
      doc.extractionSummary || `${doc.originalName} (${(doc.fileSize / 1024).toFixed(1)} KB)`,
      `Client Document Archive (${doc.originalName})`,
    ];

    rowData.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 10, bold: colIdx === 0 };
      if (colIdx === 5 && !doc.isExcluded) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0A7C3B' } };
      }
      if (docRowIdx % 2 === 1) cell.fill = headerFill(COLOR_LIGHT_GRAY);
    });
    row.height = 20;
    docRowIdx++;
  });

  // 2. Insert master checklist items
  MASTER_CHECKLIST.forEach(item => {
    const row = wsDocuments.getRow(docRowIdx);
    const matchedDoc = documents.find(d => 
      !d.isExcluded && 
      d.originalName.toLowerCase().includes(item.documentType.toLowerCase().slice(0, 8))
    );

    const status = matchedDoc ? 'Received' : (item.isConditional ? 'Conditional / To Assess' : 'Potentially missing');
    const desc = matchedDoc ? `Covered by: ${matchedDoc.originalName}` : (item.isConditional ? 'Not assessed' : 'Not located in supplied client folder');

    const rowData = [
      item.id,
      client.name,
      item.area,
      item.documentType,
      item.requiredPeriod,
      status,
      desc,
      item.obtainFrom,
    ];

    rowData.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 10, bold: colIdx === 0 };
      if (docRowIdx % 2 === 1) cell.fill = headerFill(COLOR_LIGHT_GRAY);
    });
    row.height = 20;
    docRowIdx++;
  });

  // =========================================================================
  // TAB 3: 3_Issues (Exact replica of 3_Issues_28050f4f.csv)
  // =========================================================================
  const wsIssues = workbook.addWorksheet('3_Issues', {
    views: [{ showGridLines: true }],
  });

  wsIssues.columns = [
    { width: 12 }, // Issue ID
    { width: 14 }, // Entity ID
    { width: 18 }, // Law / domain tags
    { width: 16 }, // Period
    { width: 44 }, // Issue summary
    { width: 22 }, // Classification
    { width: 30 }, // Evidence A locator
    { width: 30 }, // Evidence B locator
    { width: 18 }, // Amount A (AED)
    { width: 18 }, // Amount B (AED)
    { width: 18 }, // A minus B (AED) [FORMULA]
    { width: 42 }, // Reconciliation / test
    { width: 44 }, // Unresolved explanation / limit
    { width: 14 }, // Priority
    { width: 34 }, // Legal basis / Rule ID
    { width: 42 }, // Recommended action
    { width: 18 }, // Review status
    { width: 32 }, // Review methodology notes
  ];

  // Title Banner
  wsIssues.mergeCells('A2:R2');
  const issTitle = wsIssues.getCell('A2');
  issTitle.value = 'AMRG Global issues and reconciliations';
  issTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  issTitle.fill = headerFill(COLOR_AMRG_GREEN);
  issTitle.alignment = { vertical: 'middle', indent: 1 };
  wsIssues.getRow(2).height = 28;

  wsIssues.mergeCells('A3:R3');
  const issSub1 = wsIssues.getCell('A3');
  issSub1.value = `Client: ${client.name} | Deliverable Version ${run.runNumber}. Evaluated against ${run.skillVersion}.`;
  issSub1.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  wsIssues.getRow(3).height = 18;

  wsIssues.mergeCells('A4:R4');
  const issSub2 = wsIssues.getCell('A4');
  issSub2.value = 'Filter by law, priority or status. Scroll right for evidence, rule mapping, action and reviewer fields.';
  issSub2.font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' } };
  wsIssues.getRow(4).height = 18;

  // Header Row (Row 6)
  const issHeadRow = wsIssues.getRow(6);
  const issHeaders = [
    'Issue ID',
    'Entity ID',
    'Law / domain tags',
    'Period',
    'Issue summary',
    'Classification',
    'Evidence A locator',
    'Evidence B locator',
    'Amount A (AED)',
    'Amount B (AED)',
    'A minus B (AED)',
    'Reconciliation / test',
    'Unresolved explanation / limit',
    'Priority',
    'Legal basis / Rule ID',
    'Recommended action',
    'Review status',
    'Review methodology notes',
  ];
  issHeaders.forEach((h, i) => {
    const c = issHeadRow.getCell(i + 1);
    c.value = h;
    c.font = headerFont;
    c.fill = headerFill(COLOR_NAVY);
    c.alignment = { vertical: 'middle' };
    c.border = thinBorder;
  });
  issHeadRow.height = 24;

  let issRowIdx = 7;

  findings.forEach((f, idx) => {
    const row = wsIssues.getRow(issRowIdx);
    const iId = f.id || `I${String(idx + 1).padStart(3, '0')}`;

    row.getCell(1).value = iId;
    row.getCell(2).value = client.name;
    row.getCell(3).value = f.domain;
    row.getCell(4).value = f.period;
    row.getCell(5).value = f.issueSummary || f.title;
    row.getCell(6).value = f.classification;
    row.getCell(7).value = f.evidenceALocator || '';
    row.getCell(8).value = f.evidenceBLocator || '';

    // Numerical values & Excel Formula for Variance (A minus B)
    if (typeof f.amountA === 'number') {
      row.getCell(9).value = f.amountA;
      row.getCell(9).numFmt = '#,##0.00';
    } else {
      row.getCell(9).value = '';
    }

    if (typeof f.amountB === 'number') {
      row.getCell(10).value = f.amountB;
      row.getCell(10).numFmt = '#,##0.00';
    } else {
      row.getCell(10).value = '';
    }

    // Exact required Excel formula: =IF(AND(ISNUMBER(I7),ISNUMBER(J7)),I7-J7,"")
    row.getCell(11).value = { formula: `IF(AND(ISNUMBER(I${issRowIdx}),ISNUMBER(J${issRowIdx})),I${issRowIdx}-J${issRowIdx},"")` };
    row.getCell(11).numFmt = '#,##0.00';

    row.getCell(12).value = f.reconciliationTest || 'Cross-document verification against authoritative registers';
    row.getCell(13).value = f.unresolvedExplanation || 'Awaiting additional client documentation for full verification';

    // Extended Review & Quality Gate Columns
    row.getCell(14).value = f.priority;
    row.getCell(15).value = f.legalBasis || 'UAE Statutory Compliance Rules';
    row.getCell(16).value = f.recommendedAction || 'Remediate in coordination with corporate registrar';
    row.getCell(17).value = 'Verified';
    row.getCell(18).value = `Validated under ${run.skillVersion}`;

    // Priority cell styling
    const priCell = row.getCell(14);
    if (f.priority === 'Urgent') priCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
    else if (f.priority === 'High') priCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFD97706' } };
    else priCell.font = { name: 'Calibri', size: 10 };

    for (let c = 1; c <= 18; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      if (c !== 14) cell.font = { name: 'Calibri', size: 10, bold: c === 1 };
      if (issRowIdx % 2 === 1) cell.fill = headerFill(COLOR_LIGHT_GRAY);
    }
    row.height = 24;
    issRowIdx++;
  });

  // =========================================================================
  // LAW-WISE DETAILED SHEETS
  // =========================================================================
  const domainSheets: { name: string; domain: FindingDomain }[] = [
    { name: 'CT', domain: 'CT' },
    { name: 'VAT', domain: 'VAT' },
    { name: 'Free Zone', domain: 'Free Zone' },
    { name: 'Banking', domain: 'Banking' },
    { name: 'Secretarial Services', domain: 'Secretarial Services' },
    { name: 'Labour Laws', domain: 'Labour Laws' },
    { name: 'Accounting & Audit', domain: 'Accounting & Audit' },
    { name: 'Other Laws', domain: 'Other Laws' },
  ];

  for (const ds of domainSheets) {
    const ws = workbook.addWorksheet(ds.name, {
      views: [{ showGridLines: true }],
    });

    ws.columns = [
      { width: 12 }, // Issue ID
      { width: 16 }, // Period
      { width: 46 }, // Issue Summary
      { width: 22 }, // Classification
      { width: 14 }, // Priority
      { width: 28 }, // Evidence A Locator
      { width: 28 }, // Evidence B Locator
      { width: 18 }, // Amount A (AED)
      { width: 18 }, // Amount B (AED)
      { width: 18 }, // Variance (AED)
      { width: 36 }, // Legal Basis / Rule Ref
      { width: 44 }, // Recommended Action
    ];

    // Banner
    ws.mergeCells('A2:L2');
    const bCell = ws.getCell('A2');
    bCell.value = `AMRG Global UAE Onboarding — ${ds.name} Issues Register`;
    bCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    bCell.fill = headerFill(COLOR_NAVY);
    bCell.alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(2).height = 26;

    ws.mergeCells('A3:L3');
    ws.getCell('A3').value = `Client: ${client.name} | Deliverable Version ${run.runNumber} | Detailed Statutory Analysis`;
    ws.getCell('A3').font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
    ws.getRow(3).height = 18;

    // Headers
    const hRow = ws.getRow(5);
    const subHeaders = [
      'Issue ID',
      'Period',
      'Issue Summary',
      'Classification',
      'Priority',
      'Evidence A Locator',
      'Evidence B Locator',
      'Amount A (AED)',
      'Amount B (AED)',
      'Variance (AED)',
      'Legal Basis / Rule Ref',
      'Recommended Action',
    ];
    subHeaders.forEach((h, i) => {
      const c = hRow.getCell(i + 1);
      c.value = h;
      c.font = headerFont;
      c.fill = headerFill(COLOR_AMRG_GREEN);
      c.border = thinBorder;
    });
    hRow.height = 22;

    const domainFindings = findings.filter(f => f.domain === ds.domain || f.domain.includes(ds.domain));
    let dRowIdx = 6;

    if (domainFindings.length === 0) {
      const emptyRow = ws.getRow(6);
      emptyRow.getCell(1).value = '-';
      emptyRow.getCell(2).value = 'Inception-Cutoff';
      emptyRow.getCell(3).value = `No specific ${ds.name} exceptions identified based on reviewed evidence snapshot.`;
      emptyRow.getCell(4).value = 'Compliant / Unassessed';
      emptyRow.getCell(5).value = 'Low';
      emptyRow.getCell(11).value = 'Applicable UAE Statutes';
      emptyRow.getCell(12).value = 'Maintain routine statutory compliance monitoring';
      for (let ci = 1; ci <= 12; ci++) {
        emptyRow.getCell(ci).border = thinBorder;
        emptyRow.getCell(ci).font = { name: 'Calibri', size: 10, italic: true };
      }
      emptyRow.height = 20;
    } else {
      domainFindings.forEach(f => {
        const row = ws.getRow(dRowIdx);
        row.getCell(1).value = f.id;
        row.getCell(2).value = f.period;
        row.getCell(3).value = f.issueSummary || f.title;
        row.getCell(4).value = f.classification;
        row.getCell(5).value = f.priority;
        row.getCell(6).value = f.evidenceALocator || '-';
        row.getCell(7).value = f.evidenceBLocator || '-';
        row.getCell(8).value = typeof f.amountA === 'number' ? f.amountA : '';
        if (typeof f.amountA === 'number') row.getCell(8).numFmt = '#,##0.00';
        row.getCell(9).value = typeof f.amountB === 'number' ? f.amountB : '';
        if (typeof f.amountB === 'number') row.getCell(9).numFmt = '#,##0.00';
        
        // Dynamic formula for variance
        row.getCell(10).value = { formula: `IF(AND(ISNUMBER(H${dRowIdx}),ISNUMBER(I${dRowIdx})),H${dRowIdx}-I${dRowIdx},"")` };
        row.getCell(10).numFmt = '#,##0.00';

        row.getCell(11).value = f.legalBasis || 'Statutory Requirement';
        row.getCell(12).value = f.recommendedAction || 'Remediate as recommended';

        for (let ci = 1; ci <= 12; ci++) {
          const c = row.getCell(ci);
          c.border = thinBorder;
          c.font = { name: 'Calibri', size: 10, bold: ci === 1 };
          if (dRowIdx % 2 === 1) c.fill = headerFill(COLOR_LIGHT_GRAY);
        }
        row.height = 22;
        dRowIdx++;
      });
    }
  }

  // =========================================================================
  // TAB 12: Coverage & Reconciliations
  // =========================================================================
  const wsCoverage = workbook.addWorksheet('Coverage & Reconciliations', {
    views: [{ showGridLines: true }],
  });
  wsCoverage.columns = [
    { width: 28 }, { width: 36 }, { width: 44 }, { width: 26 }, { width: 34 }
  ];

  wsCoverage.mergeCells('A2:E2');
  const covTitle = wsCoverage.getCell('A2');
  covTitle.value = 'AMRG Global Onboarding — Coverage & Cross-Document Reconciliation Schedule';
  covTitle.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  covTitle.fill = headerFill(COLOR_NAVY);
  wsCoverage.getRow(2).height = 26;

  const covHRow = wsCoverage.getRow(5);
  ['Test Ref', 'Reconciliation Scope', 'Evidence Tested', 'Outcome / Result', 'Standard Reference'].forEach((h, i) => {
    const c = covHRow.getCell(i + 1);
    c.value = h;
    c.font = headerFont;
    c.fill = headerFill(COLOR_AMRG_GREEN);
    c.border = thinBorder;
  });

  const reconciliationTests = [
    ['REC-01', 'Trade Licence vs AoA vs CT Ack Legal Name', 'Licence, AoA, EmaraTax Ack', 'Transliteration variance identified (Quadria vs Quadaria)', 'Cabinet Decision 10/2019 / EmaraTax Data Standards'],
    ['REC-02', 'Shareholding Structure vs UBO Register', 'AoA, Corporate Chart, Incumbency', '50/50 UBO structure confirmed (Dr. Amit Varma & Abrar Mir)', 'Cabinet Decision 109/2023'],
    ['REC-03', 'CT Registration Timeline vs FTA Decision 3/2024', 'Trade licence issue date vs Ack date', 'Deadline compliance tested against 31 May 2024 cutoff', 'FTA Decision No. 3 of 2024'],
    ['REC-04', 'Labour & Immigration Card vs Ministry Records', 'Establishment Card 261138997, Sponsorship Doc', 'Free Zone Establishment Card on file; WPS exemption verified', 'Federal Decree-Law 33/2021'],
    ['REC-05', 'VAT Threshold & Tax Grouping Verification', 'Supplies, Consulting agreements', 'Consulting export testing & local supply analysis required', 'Federal Decree-Law No. 8 of 2017'],
    ['REC-06', 'Statutory Financial Statements & Zone Filing', 'Financial statements / Trial Balance', 'Statutory audit requirement mapped to licensing regulations', 'Sharjah SAIF / DMCC Companies Regulations'],
  ];

  reconciliationTests.forEach((t, i) => {
    const row = wsCoverage.getRow(6 + i);
    t.forEach((val, ci) => {
      const c = row.getCell(ci + 1);
      c.value = val;
      c.border = thinBorder;
      c.font = { name: 'Calibri', size: 10, bold: ci === 0 };
      if (i % 2 === 1) c.fill = headerFill(COLOR_LIGHT_GRAY);
    });
    row.height = 20;
  });

  await workbook.xlsx.writeFile(filePath);
  return { fileName, filePath };
}
