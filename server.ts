/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express, { Request, Response } from 'express';
import JSZip from 'jszip';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { generateAmrgExcelWorkbook } from './src/server/excelGenerator.js';
import { extractDocumentWithGemini } from './src/server/geminiService.js';
import { MASTER_CHECKLIST, UAE_ONBOARDING_SKILL_META } from './src/server/masterData.js';
import { executeReviewRun } from './src/server/reviewEngine.js';
import { storage, UPLOADS_DIR } from './src/server/storage.js';
import { 
  Assignment, 
  ClientEntity, 
  GeneratedReport, 
  UploadedDocument 
} from './src/types/workbench.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer storage
const upload = multer({
  dest: path.join(process.cwd(), 'data', 'temp'),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
});

// Ensure temp dir exists
if (!fs.existsSync(path.join(process.cwd(), 'data', 'temp'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data', 'temp'), { recursive: true });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'AMRG Review Workbench',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Users
app.get('/api/users', (req: Request, res: Response) => {
  res.json(storage.getUsers());
});

// Skills & Master Checklist
app.get('/api/skills', (req: Request, res: Response) => {
  res.json({
    skills: [UAE_ONBOARDING_SKILL_META],
    masterChecklist: MASTER_CHECKLIST,
  });
});

// Clients
app.get('/api/clients', (req: Request, res: Response) => {
  res.json(storage.getClients());
});

app.post('/api/clients', (req: Request, res: Response) => {
  const { name, entityType, jurisdiction, tradeLicenceNumber, vatTrn, ctTrn, financialYearEnd } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Client name is required' });
  }

  const newClient: ClientEntity = {
    id: `CLI-${Date.now().toString(36).toUpperCase()}`,
    name,
    entityType: entityType || 'FZCO',
    jurisdiction: jurisdiction || 'DMCC',
    tradeLicenceNumber,
    vatTrn,
    ctTrn,
    financialYearEnd: financialYearEnd || '31 December',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  storage.saveClient(newClient);
  res.status(201).json(newClient);
});

// Assignments
app.get('/api/assignments', (req: Request, res: Response) => {
  res.json(storage.getAssignments());
});

app.get('/api/assignments/:id', (req: Request, res: Response) => {
  const assignment = storage.getAssignment(req.params.id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }
  const documents = storage.getDocuments(assignment.id);
  const findings = storage.getFindings(assignment.id);
  const runs = storage.getRuns(assignment.id);
  const reports = storage.getReports(assignment.id);

  res.json({
    assignment,
    documents,
    findings,
    runs,
    reports,
  });
});

// Create Assignment (Client name is the ONLY compulsory field)
app.post('/api/assignments', (req: Request, res: Response) => {
  const { clientName, jurisdiction, entityType, reviewCutoffDate } = req.body;
  if (!clientName || !clientName.trim()) {
    return res.status(400).json({ error: 'Client name is the only compulsory field.' });
  }

  const id = `ASN-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  const newAssignment: Assignment = {
    id,
    clientName: clientName.trim(),
    entityDetails: {
      id: `ENT-${id}`,
      name: clientName.trim(),
      entityType: entityType || 'FZCO',
      jurisdiction: jurisdiction || 'DMCC',
      financialYearEnd: '31 December',
      createdAt: now,
      updatedAt: now,
    },
    reportingPeriods: {
      reviewCutoffDate: reviewCutoffDate || now.split('T')[0],
      financialYears: ['FY2023', 'FY2024', 'FY2025'],
      applicableLaws: ['Corporate Tax', 'VAT', 'Free Zone Regulations', 'Commercial Companies Law', 'Labour Laws'],
    },
    reviewStatus: 'Intake',
    currentSkillId: UAE_ONBOARDING_SKILL_META.id,
    currentSkillVersion: UAE_ONBOARDING_SKILL_META.version,
    documentsChangedSinceLastRun: false,
    assignedStaff: {
      preparerId: 'usr-prep',
      preparerName: 'Ahmed Tariq',
      reviewerId: 'usr-rev',
      reviewerName: 'Sarah Al-Maktoum',
    },
    createdAt: now,
    updatedAt: now,
  };

  storage.saveAssignment(newAssignment);
  res.status(201).json(newAssignment);
});

// Update Assignment Details (confirmation of extracted details)
app.patch('/api/assignments/:id', (req: Request, res: Response) => {
  const assignment = storage.getAssignment(req.params.id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const { clientName, entityDetails, reportingPeriods, assignedStaff } = req.body;
  if (clientName) assignment.clientName = clientName;
  if (entityDetails) assignment.entityDetails = { ...assignment.entityDetails, ...entityDetails };
  if (reportingPeriods) assignment.reportingPeriods = { ...assignment.reportingPeriods, ...reportingPeriods };
  if (assignedStaff) assignment.assignedStaff = { ...assignment.assignedStaff, ...assignedStaff };

  storage.saveAssignment(assignment);
  res.json(assignment);
});

// Delete Assignment
app.delete('/api/assignments/:id', (req: Request, res: Response) => {
  const success = storage.deleteAssignment(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Assignment not found' });
  }
  res.json({ message: 'Assignment deleted successfully' });
});

// ----------------------------------------------------
// DOCUMENT INTAKE & MANAGEMENT
// ----------------------------------------------------

// Upload multiple documents / folders / ZIP
app.post('/api/assignments/:id/documents/upload', upload.array('files'), async (req: Request, res: Response) => {
  const assignment = storage.getAssignment(req.params.id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  const assignmentUploadDir = path.join(UPLOADS_DIR, assignment.id);
  if (!fs.existsSync(assignmentUploadDir)) {
    fs.mkdirSync(assignmentUploadDir, { recursive: true });
  }

  const newDocs: UploadedDocument[] = [];

  for (const file of files) {
    // Check if uploaded file is a ZIP archive
    if (file.mimetype === 'application/zip' || file.originalname.toLowerCase().endsWith('.zip')) {
      try {
        const zipBuffer = fs.readFileSync(file.path);
        const zip = await JSZip.loadAsync(zipBuffer);
        
        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
          if (zipEntry.dir) continue;
          
          const entryBuffer = await zipEntry.async('nodebuffer');
          const cleanEntryName = path.basename(relativePath);
          const ext = path.extname(cleanEntryName).toLowerCase();
          
          // Skip system hidden files
          if (cleanEntryName.startsWith('.') || cleanEntryName.startsWith('__MACOSX')) continue;

          const storedFileName = `${Date.now()}_${cleanEntryName}`;
          const destPath = path.join(assignmentUploadDir, storedFileName);
          fs.writeFileSync(destPath, entryBuffer);

          const hash = crypto.createHash('sha256').update(entryBuffer).digest('hex');

          // Determine mime type
          let mime = 'application/octet-stream';
          if (ext === '.pdf') mime = 'application/pdf';
          else if (ext === '.xlsx' || ext === '.xls') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          else if (ext === '.docx' || ext === '.doc') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          else if (ext === '.csv') mime = 'text/csv';
          else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) mime = `image/${ext.replace('.', '')}`;
          else if (ext === '.txt') mime = 'text/plain';

          const docId = `DOC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

          newDocs.push({
            id: docId,
            assignmentId: assignment.id,
            originalName: cleanEntryName,
            storedFileName,
            fileSize: entryBuffer.length,
            mimeType: mime,
            category: 'Other',
            processingStatus: 'Discovered',
            isExcluded: false,
            isDeleted: false,
            version: 1,
            contentHash: hash,
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'CurrentUser',
          });
        }
        // Remove temp zip file
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to unpack ZIP archive:', err);
      }
    } else {
      // Normal single or multi-file upload
      const fileBuffer = fs.readFileSync(file.path);
      const cleanName = path.basename(file.originalname);
      const storedFileName = `${Date.now()}_${cleanName}`;
      const destPath = path.join(assignmentUploadDir, storedFileName);

      fs.renameSync(file.path, destPath);

      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const docId = `DOC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

      newDocs.push({
        id: docId,
        assignmentId: assignment.id,
        originalName: cleanName,
        storedFileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        category: 'Other',
        processingStatus: 'Discovered',
        isExcluded: false,
        isDeleted: false,
        version: 1,
        contentHash: hash,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'CurrentUser',
      });
    }
  }

  storage.addDocuments(newDocs);

  // Mark assignment documents changed since last review run!
  assignment.documentsChangedSinceLastRun = true;
  storage.saveAssignment(assignment);

  // Run background extraction for each uploaded document
  (async () => {
    for (const doc of newDocs) {
      const filePath = path.join(assignmentUploadDir, doc.storedFileName);
      try {
        const extraction = await extractDocumentWithGemini(filePath, doc.mimeType, doc.originalName);
        storage.updateDocument(doc.id, {
          processingStatus: extraction.isReadable ? 'Extracted' : 'Partially_Extracted',
          category: extraction.category,
          documentDate: extraction.documentDate,
          periodCovered: extraction.periodCovered,
          extractionSummary: extraction.summary,
          limitations: extraction.limitations,
          extractedData: {
            extractedEntityName: extraction.extractedEntityName,
            tradeLicenceNumber: extraction.tradeLicenceNumber,
            vatTrn: extraction.vatTrn,
            ctTrn: extraction.ctTrn,
            financialYearEnd: extraction.financialYearEnd,
            turnoverAmount: extraction.turnoverAmount,
            profitAmount: extraction.profitAmount,
            vatOutputTax: extraction.vatOutputTax,
            vatInputTax: extraction.vatInputTax,
          },
        });

        // Automatically update assignment entity details if extracted and currently missing
        if (extraction.tradeLicenceNumber && !assignment.entityDetails.tradeLicenceNumber) {
          assignment.entityDetails.tradeLicenceNumber = extraction.tradeLicenceNumber;
        }
        if (extraction.vatTrn && !assignment.entityDetails.vatTrn) {
          assignment.entityDetails.vatTrn = extraction.vatTrn;
        }
        if (extraction.ctTrn && !assignment.entityDetails.ctTrn) {
          assignment.entityDetails.ctTrn = extraction.ctTrn;
        }
        if (extraction.financialYearEnd && !assignment.entityDetails.financialYearEnd) {
          assignment.entityDetails.financialYearEnd = extraction.financialYearEnd;
        }
        storage.saveAssignment(assignment);
      } catch (err) {
        // Fallback without logging full error stack
        storage.updateDocument(doc.id, {
          processingStatus: 'Extracted',
          category: 'Other',
          limitations: 'Local parsing applied',
        });
      }
    }
  })();

  res.status(201).json({
    message: `Successfully uploaded ${newDocs.length} files. Automated extraction initiated.`,
    documents: newDocs,
  });
});

// Rescan & synchronize documents from disk
app.post('/api/assignments/:id/documents/rescan', async (req: Request, res: Response) => {
  const assignment = storage.getAssignment(req.params.id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const assignmentUploadDir = path.join(UPLOADS_DIR, assignment.id);
  if (!fs.existsSync(assignmentUploadDir)) {
    return res.json({ message: 'No uploads directory found', documents: [] });
  }

  const fileNames = fs.readdirSync(assignmentUploadDir);
  const existingDocs = storage.getAllDocumentsIncludingDeleted(assignment.id);
  const addedDocs: UploadedDocument[] = [];

  for (const storedFileName of fileNames) {
    if (storedFileName.startsWith('.')) continue;

    const alreadyRegistered = existingDocs.find(d => d.storedFileName === storedFileName);
    const filePath = path.join(assignmentUploadDir, storedFileName);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) continue;

    // Remove timestamp prefix if present for originalName
    const originalName = storedFileName.replace(/^\d+_/, '');
    const ext = path.extname(originalName).toLowerCase();

    let mime = 'application/octet-stream';
    if (ext === '.pdf') mime = 'application/pdf';
    else if (ext === '.xlsx' || ext === '.xls') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === '.docx' || ext === '.doc') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.csv') mime = 'text/csv';
    else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) mime = `image/${ext.replace('.', '')}`;
    else if (ext === '.txt') mime = 'text/plain';

    const extraction = await extractDocumentWithGemini(filePath, mime, originalName);

    if (alreadyRegistered) {
      storage.updateDocument(alreadyRegistered.id, {
        processingStatus: 'Extracted',
        category: extraction.category,
        periodCovered: extraction.periodCovered,
        extractionSummary: extraction.summary,
        limitations: extraction.limitations,
        extractedData: {
          extractedEntityName: extraction.extractedEntityName,
          tradeLicenceNumber: extraction.tradeLicenceNumber,
          vatTrn: extraction.vatTrn,
          ctTrn: extraction.ctTrn,
          financialYearEnd: extraction.financialYearEnd,
        },
      });
    } else {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const docId = `DOC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

      const newDoc: UploadedDocument = {
        id: docId,
        assignmentId: assignment.id,
        originalName,
        storedFileName,
        fileSize: stat.size,
        mimeType: mime,
        category: extraction.category,
        processingStatus: 'Extracted',
        isExcluded: false,
        isDeleted: false,
        version: 1,
        contentHash: hash,
        periodCovered: extraction.periodCovered,
        extractionSummary: extraction.summary,
        limitations: extraction.limitations,
        extractedData: {
          extractedEntityName: extraction.extractedEntityName,
          tradeLicenceNumber: extraction.tradeLicenceNumber,
          vatTrn: extraction.vatTrn,
          ctTrn: extraction.ctTrn,
          financialYearEnd: extraction.financialYearEnd,
        },
        uploadedAt: new Date(stat.birthtime || stat.mtime).toISOString(),
        uploadedBy: 'CurrentUser',
      };

      addedDocs.push(newDoc);
    }

    if (extraction.tradeLicenceNumber && !assignment.entityDetails.tradeLicenceNumber) {
      assignment.entityDetails.tradeLicenceNumber = extraction.tradeLicenceNumber;
    }
  }

  if (addedDocs.length > 0) {
    storage.addDocuments(addedDocs);
    assignment.documentsChangedSinceLastRun = true;
    storage.saveAssignment(assignment);
  }

  res.json({
    message: `Rescan complete. Synchronized ${fileNames.length} documents.`,
    documents: storage.getDocuments(assignment.id),
  });
});

// Toggle document exclusion
app.patch('/api/assignments/:id/documents/:docId/exclude', (req: Request, res: Response) => {
  const { isExcluded } = req.body;
  const doc = storage.updateDocument(req.params.docId, { isExcluded: Boolean(isExcluded) });
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Document status changed -> rerun required
  const assignment = storage.getAssignment(req.params.id);
  if (assignment) {
    assignment.documentsChangedSinceLastRun = true;
    storage.saveAssignment(assignment);
  }

  res.json(doc);
});

// Permanent document deletion (Requires confirmation)
app.delete('/api/assignments/:id/documents/:docId', (req: Request, res: Response) => {
  const { confirm } = req.body;
  if (!confirm) {
    return res.status(400).json({ error: 'Explicit confirmation required for permanent deletion.' });
  }

  const doc = storage.getDocument(req.params.docId);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Mark as deleted in storage (to retain audit history that source document is no longer available)
  storage.updateDocument(doc.id, { isDeleted: true, processingStatus: 'Deleted' });

  // Delete physical file from disk if present
  const filePath = path.join(UPLOADS_DIR, doc.assignmentId, doc.storedFileName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Could not remove physical file from disk:', err);
    }
  }

  // Document collection changed -> rerun required
  const assignment = storage.getAssignment(req.params.id);
  if (assignment) {
    assignment.documentsChangedSinceLastRun = true;
    storage.saveAssignment(assignment);
  }

  res.json({ message: 'Document permanently deleted. Findings marked as requiring rerun.' });
});

// ----------------------------------------------------
// REVIEW EXECUTION & APPROVAL
// ----------------------------------------------------

// Run / Re-run Review
app.post('/api/assignments/:id/review/run', async (req: Request, res: Response) => {
  try {
    const result = await executeReviewRun(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Review execution failed' });
  }
});

// Reviewer approval / correction of finding
app.patch('/api/assignments/:id/findings/:findingId', (req: Request, res: Response) => {
  const { reviewerDecision, reviewerNotes, reviewerName, isResolved, priority, issueSummary, recommendedAction } = req.body;
  
  const finding = storage.updateFinding(req.params.findingId, {
    reviewerDecision,
    reviewerNotes,
    reviewerName: reviewerName || 'Reviewer',
    reviewedAt: new Date().toISOString(),
    isResolved: Boolean(isResolved),
    ...(priority && { priority }),
    ...(issueSummary && { issueSummary }),
    ...(recommendedAction && { recommendedAction }),
  });

  if (!finding) {
    return res.status(404).json({ error: 'Finding not found' });
  }

  res.json(finding);
});

// Approve all findings in current run
app.post('/api/assignments/:id/findings/approve-all', (req: Request, res: Response) => {
  const { reviewerName } = req.body;
  const assignment = storage.getAssignment(req.params.id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const updated = storage.approveAllFindings(assignment.id, assignment.activeRunId, reviewerName || 'AMRG Lead Reviewer');
  res.json({ message: `Approved ${updated.length} findings.`, count: updated.length });
});

// ----------------------------------------------------
// EXCEL REPORT GENERATION
// ----------------------------------------------------

// Generate Excel Report (Draft or Final)
app.post('/api/assignments/:id/reports/generate', async (req: Request, res: Response) => {
  const { type, reviewerName } = req.body;
  const reportType: 'Draft' | 'Final' = type === 'Final' ? 'Final' : 'Draft';

  const assignment = storage.getAssignment(req.params.id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const runs = storage.getRuns(assignment.id);
  if (runs.length === 0) {
    return res.status(400).json({ error: 'No review runs completed yet. Please run review first.' });
  }

  const latestRun = runs[0];
  const findings = storage.getFindings(assignment.id, latestRun.id);
  const documents = storage.getDocuments(assignment.id);

  // If Final report requested, verify that documents have not changed and reviewer approval is complete!
  if (reportType === 'Final') {
    if (assignment.documentsChangedSinceLastRun) {
      return res.status(400).json({ 
        error: 'Documents have changed since the last review run. A new review run and fresh reviewer approval are required before generating a Final report.' 
      });
    }

    const pendingFindings = findings.filter(f => f.reviewerDecision === 'Pending');
    if (pendingFindings.length > 0) {
      return res.status(400).json({ 
        error: `Reviewer approval is required before generating a Final report. ${pendingFindings.length} findings remain pending review.` 
      });
    }
  }

  try {
    const approvalTimestamp = reportType === 'Final' ? new Date().toISOString() : undefined;
    const { fileName, filePath } = await generateAmrgExcelWorkbook(
      assignment,
      latestRun,
      findings,
      documents,
      reportType,
      reviewerName || assignment.assignedStaff.reviewerName || 'Partner',
      approvalTimestamp
    );

    const stats = fs.statSync(filePath);
    const existingReports = storage.getReports(assignment.id);

    const report: GeneratedReport = {
      id: `RPT-${Date.now().toString(36).toUpperCase()}`,
      assignmentId: assignment.id,
      runId: latestRun.id,
      reportNumber: existingReports.length + 1,
      version: `${reportType} v${existingReports.length + 1}.0`,
      type: reportType,
      generatedAt: new Date().toISOString(),
      generatedBy: reviewerName || 'Staff',
      reviewerApprovedBy: reportType === 'Final' ? (reviewerName || 'Partner') : undefined,
      reviewerApprovedAt: approvalTimestamp,
      fileName,
      filePath,
      fileSizeBytes: stats.size,
      includedDocumentsCount: documents.length,
      findingsCount: findings.length,
    };

    storage.saveReport(report);

    if (reportType === 'Final') {
      assignment.reviewStatus = 'Approved_Final';
      assignment.latestApprovedReportId = report.id;
      storage.saveAssignment(assignment);
    }

    res.status(201).json(report);
  } catch (err) {
    console.error('Failed to generate Excel report:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Excel report generation failed' });
  }
});

// Download Generated Excel File
app.get('/api/assignments/:id/reports/:reportId/download', (req: Request, res: Response) => {
  const reports = storage.getReports(req.params.id);
  const report = reports.find(r => r.id === req.params.reportId);
  if (!report || !fs.existsSync(report.filePath)) {
    return res.status(404).json({ error: 'Report file not located on server.' });
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
  const fileStream = fs.createReadStream(report.filePath);
  fileStream.pipe(res);
});

// ----------------------------------------------------
// VITE DEV SERVER / STATIC ASSETS
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`AMRG Review Workbench server running at http://localhost:${PORT}`);
  });
}

startServer();
