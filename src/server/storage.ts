/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { 
  Assignment, 
  ClientEntity, 
  GeneratedReport, 
  ReviewFinding, 
  ReviewRunSnapshot, 
  UploadedDocument, 
  UserProfile 
} from '../types/workbench.js';

interface StorageData {
  clients: ClientEntity[];
  assignments: Assignment[];
  documents: UploadedDocument[];
  findings: ReviewFinding[];
  runs: ReviewRunSnapshot[];
  reports: GeneratedReport[];
  users: UserProfile[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'amrg-store.json');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const REPORTS_DIR = path.join(DATA_DIR, 'reports');

// Ensure directories exist
for (const dir of [DATA_DIR, UPLOADS_DIR, REPORTS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'usr-admin',
    name: 'Rajat Mohan',
    email: 'rajat.mohan@icai.org',
    role: 'Administrator',
  },
  {
    id: 'usr-prep',
    name: 'Ahmed Tariq',
    email: 'ahmed.tariq@amrgglobal.com',
    role: 'Preparer',
  },
  {
    id: 'usr-rev',
    name: 'Sarah Al-Maktoum',
    email: 'sarah.almaktoum@amrgglobal.com',
    role: 'Reviewer',
  }
];

class StorageManager {
  private data: StorageData;

  constructor() {
    this.data = this.load();
  }

  private load(): StorageData {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, resetting:', err);
      }
    }

    const initial: StorageData = {
      clients: [],
      assignments: [],
      documents: [],
      findings: [],
      runs: [],
      reports: [],
      users: DEFAULT_USERS,
    };
    this.save(initial);
    return initial;
  }

  private save(state?: StorageData): void {
    const toSave = state || this.data;
    fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
  }

  // USERS
  getUsers(): UserProfile[] {
    return this.data.users;
  }

  getUser(id: string): UserProfile | undefined {
    return this.data.users.find(u => u.id === id);
  }

  // CLIENTS
  getClients(): ClientEntity[] {
    return this.data.clients;
  }

  getClient(id: string): ClientEntity | undefined {
    return this.data.clients.find(c => c.id === id);
  }

  saveClient(client: ClientEntity): ClientEntity {
    const index = this.data.clients.findIndex(c => c.id === client.id);
    if (index >= 0) {
      this.data.clients[index] = { ...client, updatedAt: new Date().toISOString() };
    } else {
      this.data.clients.push(client);
    }
    this.save();
    return client;
  }

  // ASSIGNMENTS
  getAssignments(): Assignment[] {
    return this.data.assignments;
  }

  getAssignment(id: string): Assignment | undefined {
    return this.data.assignments.find(a => a.id === id);
  }

  saveAssignment(assignment: Assignment): Assignment {
    const index = this.data.assignments.findIndex(a => a.id === assignment.id);
    if (index >= 0) {
      this.data.assignments[index] = { ...assignment, updatedAt: new Date().toISOString() };
    } else {
      this.data.assignments.push(assignment);
    }
    this.save();
    return assignment;
  }

  deleteAssignment(id: string): boolean {
    const index = this.data.assignments.findIndex(a => a.id === id);
    if (index >= 0) {
      this.data.assignments.splice(index, 1);
      // clean associated records
      this.data.documents = this.data.documents.filter(d => d.assignmentId !== id);
      this.data.findings = this.data.findings.filter(f => f.assignmentId !== id);
      this.data.runs = this.data.runs.filter(r => r.assignmentId !== id);
      this.data.reports = this.data.reports.filter(r => r.assignmentId !== id);
      this.save();
      return true;
    }
    return false;
  }

  // DOCUMENTS
  getDocuments(assignmentId: string): UploadedDocument[] {
    return this.data.documents.filter(d => d.assignmentId === assignmentId && !d.isDeleted);
  }

  getAllDocumentsIncludingDeleted(assignmentId: string): UploadedDocument[] {
    return this.data.documents.filter(d => d.assignmentId === assignmentId);
  }

  getDocument(docId: string): UploadedDocument | undefined {
    return this.data.documents.find(d => d.id === docId);
  }

  addDocuments(docs: UploadedDocument[]): void {
    this.data.documents.push(...docs);
    this.save();
  }

  updateDocument(docId: string, updates: Partial<UploadedDocument>): UploadedDocument | undefined {
    const doc = this.data.documents.find(d => d.id === docId);
    if (doc) {
      Object.assign(doc, updates);
      this.save();
      return doc;
    }
    return undefined;
  }

  // FINDINGS
  getFindings(assignmentId: string, runId?: string): ReviewFinding[] {
    if (runId) {
      return this.data.findings.filter(f => f.assignmentId === assignmentId && f.runId === runId);
    }
    // Return latest run findings for assignment
    const assignment = this.getAssignment(assignmentId);
    if (assignment?.activeRunId) {
      return this.data.findings.filter(f => f.assignmentId === assignmentId && f.runId === assignment.activeRunId);
    }
    return this.data.findings.filter(f => f.assignmentId === assignmentId);
  }

  getAllFindings(assignmentId: string): ReviewFinding[] {
    return this.data.findings.filter(f => f.assignmentId === assignmentId);
  }

  saveFindings(newFindings: ReviewFinding[]): void {
    const newRunIds = new Set(newFindings.map(f => f.runId));
    this.data.findings = this.data.findings.filter(f => !newRunIds.has(f.runId));
    this.data.findings.push(...newFindings);
    this.save();
  }

  approveAllFindings(assignmentId: string, runId?: string, reviewerName = 'Reviewer'): ReviewFinding[] {
    const targetFindings = this.getFindings(assignmentId, runId);
    targetFindings.forEach(f => {
      f.reviewerDecision = 'Accepted';
      f.reviewerName = reviewerName;
      f.reviewedAt = new Date().toISOString();
      f.isResolved = true;
      if (!f.reviewerNotes) f.reviewerNotes = 'Reviewed and accepted by AMRG review team.';
    });
    this.save();
    return targetFindings;
  }

  updateFinding(findingId: string, updates: Partial<ReviewFinding>): ReviewFinding | undefined {
    const finding = this.data.findings.find(f => f.id === findingId);
    if (finding) {
      Object.assign(finding, updates);
      this.save();
      return finding;
    }
    return undefined;
  }

  // RUNS
  getRuns(assignmentId: string): ReviewRunSnapshot[] {
    return this.data.runs
      .filter(r => r.assignmentId === assignmentId)
      .sort((a, b) => b.runNumber - a.runNumber);
  }

  getRun(runId: string): ReviewRunSnapshot | undefined {
    return this.data.runs.find(r => r.id === runId);
  }

  saveRun(run: ReviewRunSnapshot): ReviewRunSnapshot {
    const index = this.data.runs.findIndex(r => r.id === run.id);
    if (index >= 0) {
      this.data.runs[index] = run;
    } else {
      this.data.runs.push(run);
    }
    this.save();
    return run;
  }

  // REPORTS
  getReports(assignmentId: string): GeneratedReport[] {
    return this.data.reports
      .filter(r => r.assignmentId === assignmentId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  saveReport(report: GeneratedReport): GeneratedReport {
    this.data.reports.push(report);
    this.save();
    return report;
  }
}

export const storage = new StorageManager();
