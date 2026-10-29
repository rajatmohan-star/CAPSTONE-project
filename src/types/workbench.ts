/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Administrator' | 'Preparer' | 'Reviewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  assignedClientIds?: string[];
}

export type ReviewStatus = 
  | 'Intake' 
  | 'Extraction_In_Progress'
  | 'Ready_For_Review' 
  | 'Review_In_Progress' 
  | 'Awaiting_Reviewer' 
  | 'Changes_Requested'
  | 'Approved_Final' 
  | 'Archived';

export interface ClientEntity {
  id: string;
  name: string;
  formerNames?: string;
  entityType: string; // e.g. FZCO, LLC, Branch
  registrationNumber?: string;
  tradeLicenceNumber?: string;
  incorporationDate?: string;
  jurisdiction: string; // e.g. DMCC, Dubai Mainland, ADGM, DIFC
  vatTrn?: string;
  ctTrn?: string;
  financialYearEnd?: string; // e.g. 31 December
  firstCtPeriod?: string; // e.g. 1 Jan 2024 - 31 Dec 2024
  assignedPreparerId?: string;
  assignedReviewerId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentProcessingStatus = 
  | 'Discovered' 
  | 'Extracted' 
  | 'Partially_Extracted' 
  | 'Failed' 
  | 'Excluded' 
  | 'Deleted';

export interface UploadedDocument {
  id: string;
  assignmentId: string;
  originalName: string;
  storedFileName: string;
  fileSize: number;
  mimeType: string;
  category: 'Corporate' | 'Licence' | 'Accounting' | 'VAT' | 'Corporate_Tax' | 'Banking' | 'Labour' | 'Other';
  documentDate?: string;
  periodCovered?: string;
  processingStatus: DocumentProcessingStatus;
  isExcluded: boolean;
  isDeleted: boolean;
  version: number;
  contentHash: string;
  pageCount?: number;
  extractionSummary?: string;
  limitations?: string; // e.g. "Page 3 unreadable scan", "No password provided"
  extractedData?: Record<string, any>;
  uploadedAt: string;
  uploadedBy: string;
}

export type FindingClassification = 
  | 'Confirmed error'
  | 'Confirmed error / default' 
  | 'Potential issue' 
  | 'Discrepancy'
  | 'Document discrepancy' 
  | 'Missing evidence';

export type FindingPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export type FindingDomain = 
  | 'CT' 
  | 'VAT' 
  | 'Free Zone' 
  | 'Banking' 
  | 'Secretarial Services' 
  | 'Labour Laws' 
  | 'Other Laws' 
  | 'Accounting & Audit';

export type ReviewerDecision = 'Pending' | 'Accepted' | 'Corrected' | 'Rejected' | 'Dismissed';

export interface ReviewFinding {
  id: string; // e.g. I001
  assignmentId: string;
  runId: string;
  domain: FindingDomain;
  checkId: string; // e.g. VAT05, CT04, COR01
  obligationId?: string;
  period: string; // e.g. FY2024
  title: string;
  issueSummary: string;
  classification: FindingClassification;
  priority: FindingPriority;
  priorityRationale?: string;
  
  // Reconciliations & Evidence
  evidenceALocator?: string; // e.g. "Sales Ledger!F2:F100"
  evidenceBLocator?: string; // e.g. "VAT 201 Return Box 1"
  amountA?: number;
  amountB?: number;
  variance?: number; // amountA - amountB
  currency: string; // typically "AED"
  amountType?: 'Exact' | 'Recalculated' | 'Estimated' | 'Unquantified' | 'Potential_Fine';
  reconciliationTest?: string;

  legalBasis?: string; // e.g. "Federal Decree-Law No. 8 of 2017 Art 72"
  unresolvedExplanation?: string;
  recommendedAction: string;
  
  // Reviewer workflow & audit trail
  reviewerDecision: ReviewerDecision;
  reviewerNotes?: string;
  reviewerName?: string;
  reviewedAt?: string;
  isResolved: boolean;
}

export interface ReviewRunSnapshot {
  id: string;
  assignmentId: string;
  runNumber: number;
  startedAt: string;
  completedAt?: string;
  status: 'Running' | 'Completed' | 'Failed';
  skillId: string;
  skillVersion: string;
  includedDocumentIds: string[];
  totalDocumentsReviewed: number;
  totalFindingsGenerated: number;
  progressPercent: number;
  currentStepMessage?: string;
  reconciliationSummary?: Record<string, any>;
}

export interface GeneratedReport {
  id: string;
  assignmentId: string;
  runId: string;
  reportNumber: number;
  version: string;
  type: 'Draft' | 'Final';
  generatedAt: string;
  generatedBy: string;
  reviewerApprovedBy?: string;
  reviewerApprovedAt?: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  includedDocumentsCount: number;
  findingsCount: number;
}

export interface Assignment {
  id: string;
  clientName: string; // Compulsory
  clientId?: string;
  entityDetails: ClientEntity;
  reportingPeriods: {
    incorporationDate?: string;
    reviewCutoffDate: string;
    financialYears: string[];
    applicableLaws: string[];
  };
  reviewStatus: ReviewStatus;
  currentSkillId: string;
  currentSkillVersion: string;
  documentsChangedSinceLastRun: boolean;
  activeRunId?: string;
  latestApprovedReportId?: string;
  assignedStaff: {
    preparerId?: string;
    preparerName?: string;
    reviewerId?: string;
    reviewerName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MasterChecklistItem {
  id: string; // e.g. GOV001, ACC001, VAT001, CT001, FZ001, OTH001
  area: string;
  documentType: string;
  requiredPeriod: string;
  obtainFrom: string;
  isConditional: boolean;
}
