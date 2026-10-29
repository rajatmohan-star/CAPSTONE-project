/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  Download, 
  Eye, 
  FileCheck, 
  FileSpreadsheet, 
  FileText, 
  FolderArchive, 
  History, 
  Lock, 
  Play, 
  Plus, 
  RefreshCw, 
  Scale, 
  Trash2, 
  UploadCloud, 
  X, 
  XCircle 
} from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext.js';
import { AmrgLogo } from '../common/AmrgLogo.js';
import { 
  Assignment, 
  FindingDomain, 
  FindingPriority, 
  GeneratedReport, 
  ReviewFinding, 
  ReviewerDecision, 
  ReviewRunSnapshot, 
  UploadedDocument 
} from '../../types/workbench.js';

interface AssignmentWorkspaceProps {
  assignmentId: string;
  onBack: () => void;
}

export const AssignmentWorkspace: React.FC<AssignmentWorkspaceProps> = ({
  assignmentId,
  onBack,
}) => {
  const { currentUser, showToast, refreshAssignments } = useWorkbench();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [findings, setFindings] = useState<ReviewFinding[]>([]);
  const [runs, setRuns] = useState<ReviewRunSnapshot[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'findings' | 'documents' | 'reconciliations' | 'history'>('findings');
  
  // Findings filter
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedDecision, setSelectedDecision] = useState<string>('All');

  // Review execution modal state
  const [isReviewRunning, setIsReviewRunning] = useState(false);
  const [reviewProgress, setReviewProgress] = useState(0);
  const [reviewStepMsg, setReviewStepMsg] = useState('');

  // Selected document for inspection
  const [inspectDoc, setInspectDoc] = useState<UploadedDocument | null>(null);

  // Document permanent deletion confirmation modal
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<UploadedDocument | null>(null);

  // Finding review modal
  const [activeFinding, setActiveFinding] = useState<ReviewFinding | null>(null);
  const [findingNotes, setFindingNotes] = useState('');
  const [findingDecision, setFindingDecision] = useState<ReviewerDecision>('Accepted');

  // Entity Details Edit Modal
  const [showEditEntity, setShowEditEntity] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssignmentData = async () => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignment(data.assignment);
        setDocuments(data.documents);
        setFindings(data.findings);
        setRuns(data.runs);
        setReports(data.reports);
      } else {
        showToast('Assignment not found', 'error');
        onBack();
      }
    } catch (err) {
      console.error('Failed to load assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData();
  }, [assignmentId]);

  // Handle file uploads (multiple files, folders, or ZIP archives)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    showToast(`Uploading ${files.length} document(s)...`, 'info');

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        showToast('Documents uploaded successfully. Extraction running in background.', 'success');
        fetchAssignmentData();
        refreshAssignments();
      } else {
        const err = await res.json();
        showToast(err.error || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast('Error uploading files', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle document exclusion
  const handleToggleExclude = async (doc: UploadedDocument) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/documents/${doc.id}/exclude`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isExcluded: !doc.isExcluded }),
      });

      if (res.ok) {
        showToast(`Document ${!doc.isExcluded ? 'excluded from' : 'included in'} review.`, 'info');
        fetchAssignmentData();
        refreshAssignments();
      }
    } catch (err) {
      showToast('Failed to update document exclusion', 'error');
    }
  };

  // Permanent document deletion
  const handleConfirmPermanentDelete = async () => {
    if (!deleteDocConfirm) return;

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/documents/${deleteDocConfirm.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });

      if (res.ok) {
        showToast('Document permanently deleted. Review rerun required.', 'success');
        setDeleteDocConfirm(null);
        fetchAssignmentData();
        refreshAssignments();
      } else {
        const err = await res.json();
        showToast(err.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Failed to delete document', 'error');
    }
  };

  // Run / Re-run review
  const handleRunReview = async () => {
    setIsReviewRunning(true);
    setReviewProgress(10);
    setReviewStepMsg('Freezing snapshot of included documents & skill version...');

    const interval = setInterval(() => {
      setReviewProgress(p => {
        if (p < 85) return p + 15;
        return p;
      });
    }, 600);

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/review/run`, {
        method: 'POST',
      });

      clearInterval(interval);
      setReviewProgress(100);
      setReviewStepMsg('Review complete. Findings validated.');

      if (res.ok) {
        const data = await res.json();
        showToast(`Review completed: ${data.findings.length} findings generated.`, 'success');
        setTimeout(() => {
          setIsReviewRunning(false);
          fetchAssignmentData();
          refreshAssignments();
        }, 800);
      } else {
        const err = await res.json();
        showToast(err.error || 'Review execution failed', 'error');
        setIsReviewRunning(false);
      }
    } catch (err) {
      clearInterval(interval);
      showToast('Network error during review execution', 'error');
      setIsReviewRunning(false);
    }
  };

  // Update Reviewer finding decision
  const handleSaveFindingDecision = async () => {
    if (!activeFinding) return;

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/findings/${activeFinding.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerDecision: findingDecision,
          reviewerNotes: findingNotes,
          reviewerName: currentUser.name,
          isResolved: findingDecision === 'Accepted' || findingDecision === 'Dismissed',
        }),
      });

      if (res.ok) {
        showToast(`Finding ${activeFinding.id} marked as ${findingDecision}.`, 'success');
        setActiveFinding(null);
        fetchAssignmentData();
      } else {
        showToast('Failed to update finding decision', 'error');
      }
    } catch (err) {
      showToast('Error saving reviewer decision', 'error');
    }
  };

  // Rescan & synchronize documents from disk
  const handleRescanDocuments = async () => {
    showToast('Rescanning and categorizing uploaded documents...', 'info');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/documents/rescan`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('Documents synchronized and extracted.', 'success');
        fetchAssignmentData();
        refreshAssignments();
      } else {
        showToast('Rescan failed', 'error');
      }
    } catch (err) {
      showToast('Network error during document rescan', 'error');
    }
  };

  // Generate Excel report (Draft or Final)
  const handleGenerateReport = async (type: 'Draft' | 'Final') => {
    showToast(`Generating ${type} Excel workbook...`, 'info');

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          reviewerName: currentUser.name,
        }),
      });

      if (res.ok) {
        const report = await res.json();
        showToast(`${type} Excel report generated successfully.`, 'success');
        fetchAssignmentData();
        refreshAssignments();
        // Trigger download via anchor element
        const a = document.createElement('a');
        a.href = `/api/assignments/${assignmentId}/reports/${report.id}/download`;
        a.download = report.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const err = await res.json();
        showToast(err.error || 'Report generation failed', 'error');
      }
    } catch (err) {
      showToast('Error generating Excel report', 'error');
    }
  };

  // Bulk approve all pending findings
  const handleApproveAllFindings = async () => {
    showToast('Approving and validating all findings...', 'info');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/findings/approve-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: currentUser.name || 'AMRG Lead Reviewer',
        }),
      });

      if (res.ok) {
        showToast('All findings successfully reviewed and approved.', 'success');
        fetchAssignmentData();
        refreshAssignments();
      } else {
        showToast('Failed to approve findings', 'error');
      }
    } catch (err) {
      showToast('Network error during bulk approval', 'error');
    }
  };

  // Save entity details edit
  const handleSaveEntityEdit = async () => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityDetails: editForm,
        }),
      });

      if (res.ok) {
        showToast('Entity details confirmed and updated.', 'success');
        setShowEditEntity(false);
        fetchAssignmentData();
      }
    } catch (err) {
      showToast('Failed to save entity details', 'error');
    }
  };

  if (loading || !assignment) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Loading assignment workspace...
      </div>
    );
  }

  // Filtered findings
  const filteredFindings = findings.filter(f => {
    if (selectedDomain !== 'All' && f.domain !== selectedDomain) return false;
    if (selectedPriority !== 'All' && f.priority !== selectedPriority) return false;
    if (selectedDecision !== 'All' && f.reviewerDecision !== selectedDecision) return false;
    return true;
  });

  const activeDocs = documents.filter(d => !d.isDeleted);
  const pendingApprovalsCount = findings.filter(f => f.reviewerDecision === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-slate-600"
            title="Back to assignments"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <AmrgLogo size="sm" showSubtitle={false} />
          <div className="h-5 w-px bg-slate-200" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {assignment.clientName}
              </h1>
              <span className="text-[11px] font-mono text-slate-400">
                {assignment.id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{assignment.entityDetails.jurisdiction}</span>
              <span>·</span>
              <span>{assignment.entityDetails.entityType}</span>
              <span>·</span>
              <span>Skill: {assignment.currentSkillVersion}</span>
            </div>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Run / Re-run Review Button */}
          <button
            onClick={handleRunReview}
            disabled={isReviewRunning}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0A7C3B] hover:bg-[#08632f] rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {runs.length === 0 ? 'Run Review' : 'Re-run Review'}
          </button>

          {/* Bulk Approve All Findings Button */}
          {pendingApprovalsCount > 0 && runs.length > 0 && (
            <button
              onClick={handleApproveAllFindings}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg shadow-sm transition-colors"
              title="Approve and validate all pending findings for final report generation"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Approve All ({pendingApprovalsCount})
            </button>
          )}

          {/* Download Draft Excel */}
          <button
            onClick={() => handleGenerateReport('Draft')}
            disabled={runs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors disabled:opacity-40"
            title="Download draft Excel workbook matching fixed template"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
            Download Draft Excel
          </button>

          {/* Generate Final Report */}
          <button
            onClick={async () => {
              if (pendingApprovalsCount > 0) {
                await handleApproveAllFindings();
              }
              handleGenerateReport('Final');
            }}
            disabled={runs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#05466C] hover:bg-[#043450] rounded-lg shadow-sm transition-colors disabled:opacity-40"
            title="Generate certified Final Excel report"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Generate Final Report
          </button>
        </div>
      </div>

      {/* Prominent Alert: Documents changed—rerun required */}
      {assignment.documentsChangedSinceLastRun && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide">
                Documents changed — rerun required
              </div>
              <p className="text-xs text-amber-700 mt-0.5">
                New documents were uploaded, excluded, or deleted since the last review run. Existing findings are marked as potentially outdated until you execute a fresh review run.
              </p>
            </div>
          </div>
          <button
            onClick={handleRunReview}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            Rerun Review Now
          </button>
        </div>
      )}

      {/* Entity Profile & Scope Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Entity Profile & Confirmed Particulars
            </h2>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              Extracted from documents with reviewer validation
            </span>
          </div>
          <button
            onClick={() => {
              setEditForm({ ...assignment.entityDetails });
              setShowEditEntity(true);
            }}
            className="text-xs font-medium text-[#0A7C3B] hover:underline"
          >
            Confirm / Edit Details
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Trade Licence No.</div>
            <div className="font-semibold text-slate-800 mt-1 font-mono">
              {assignment.entityDetails.tradeLicenceNumber || (
                <span className="text-amber-600 font-sans italic">To verify</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">VAT TRN (15-digit)</div>
            <div className="font-semibold text-slate-800 mt-1 font-mono">
              {assignment.entityDetails.vatTrn || (
                <span className="text-amber-600 font-sans italic">To verify</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Corporate Tax TRN</div>
            <div className="font-semibold text-slate-800 mt-1 font-mono">
              {assignment.entityDetails.ctTrn || (
                <span className="text-amber-600 font-sans italic">To verify</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Financial Year End</div>
            <div className="font-semibold text-slate-800 mt-1">
              {assignment.entityDetails.financialYearEnd || '31 December'}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">First CT Period</div>
            <div className="font-semibold text-slate-800 mt-1">
              {assignment.entityDetails.firstCtPeriod || 'FY2024 (1 Jan - 31 Dec)'}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Review Cutoff</div>
            <div className="font-semibold text-slate-800 mt-1 font-mono">
              {assignment.reportingPeriods.reviewCutoffDate}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => setActiveTab('findings')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'findings' ? 'text-[#0A7C3B] font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Findings & Reviewer Vetting ({findings.length})
            {activeTab === 'findings' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7C3B]" />}
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'documents' ? 'text-[#0A7C3B] font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Document Inventory ({activeDocs.length})
            {activeTab === 'documents' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7C3B]" />}
          </button>

          <button
            onClick={() => setActiveTab('reconciliations')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'reconciliations' ? 'text-[#0A7C3B] font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Reconciliation Bridges
            {activeTab === 'reconciliations' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7C3B]" />}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'history' ? 'text-[#0A7C3B] font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Run & Report History ({runs.length})
            {activeTab === 'history' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7C3B]" />}
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: FINDINGS & REVIEWER VETTING                         */}
      {/* ========================================================== */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {/* Domain Filter Bar (Segmented Controls) */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1 flex-wrap">
              {[
                'All',
                'CT',
                'VAT',
                'Free Zone',
                'Banking',
                'Secretarial Services',
                'Labour Laws',
                'Other Laws',
                'Accounting & Audit',
              ].map(dom => (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedDomain === dom
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedPriority}
                onChange={e => setSelectedPriority(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-700"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={selectedDecision}
                onChange={e => setSelectedDecision(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-700"
              >
                <option value="All">All Review Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Accepted">Accepted</option>
                <option value="Corrected">Corrected</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>
          </div>

          {/* Findings Table */}
          {filteredFindings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <Scale className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-800 mt-2">No findings match active filters</div>
              <p className="text-xs text-slate-400 mt-1">
                {runs.length === 0
                  ? 'Upload documents and click "Run Review" to execute checks.'
                  : 'Adjust domain or status filters to view other findings.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Issue ID</th>
                    <th className="py-3 px-3">Domain</th>
                    <th className="py-3 px-4">Observation / Title</th>
                    <th className="py-3 px-3">Classification</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3 text-right">Variance (AED)</th>
                    <th className="py-3 px-3">Reviewer Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFindings.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {f.id}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-700">
                        {f.domain}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{f.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {f.issueSummary}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {f.classification}
                      </td>
                      <td className="py-3.5 px-3 font-medium">
                        <span
                          className={
                            f.priority === 'Urgent'
                              ? 'text-red-700 font-bold'
                              : f.priority === 'High'
                              ? 'text-amber-700 font-semibold'
                              : 'text-slate-600'
                          }
                        >
                          {f.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-800">
                        {typeof f.variance === 'number' ? f.variance.toLocaleString() : '—'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`font-medium ${
                            f.reviewerDecision === 'Accepted'
                              ? 'text-[#0A7C3B]'
                              : f.reviewerDecision === 'Pending'
                              ? 'text-amber-600 font-semibold'
                              : 'text-slate-500'
                          }`}
                        >
                          {f.reviewerDecision}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveFinding(f);
                            setFindingDecision(f.reviewerDecision === 'Pending' ? 'Accepted' : f.reviewerDecision);
                            setFindingNotes(f.reviewerNotes || '');
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-[#0A7C3B] hover:text-[#08632f] hover:bg-emerald-50 rounded transition-colors"
                        >
                          Review / Vet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: DOCUMENT INVENTORY & INTAKE                         */}
      {/* ========================================================== */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Upload Zone */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-[#0A7C3B] transition-colors bg-white">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer">
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-800 mt-2">
                Click to upload files, folder, or ZIP archives
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Accepts PDF, DOCX, XLSX, CSV, PPT, PPTX, text and scans. Multimodal OCR vision extracts details automatically.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0A7C3B] rounded-lg shadow-sm hover:bg-[#08632f] transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Select Client Files
              </div>
            </label>
          </div>

          {/* Document Inventory Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Document Inventory & Audit Coverage ({activeDocs.length} Active Records)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Originals saved in persistent storage
                </span>
              </div>
              <button
                onClick={handleRescanDocuments}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Rescan uploaded files from server disk and re-extract metadata"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#0A7C3B]" />
                Rescan & Sync
              </button>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Period</th>
                  <th className="py-3 px-3">Extraction Status</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDocs.map(doc => (
                  <tr
                    key={doc.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      doc.isExcluded ? 'opacity-50 bg-slate-50' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">{doc.originalName}</div>
                          {doc.limitations && doc.limitations !== 'None' && (
                            <div className="text-[11px] text-amber-600 line-clamp-1">
                              Limitation: {doc.limitations}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">{doc.category}</td>
                    <td className="py-3.5 px-3 text-slate-600">{doc.periodCovered || 'N/A'}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`font-medium ${
                          doc.processingStatus === 'Extracted'
                            ? 'text-[#0A7C3B]'
                            : doc.processingStatus === 'Failed'
                            ? 'text-red-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {doc.processingStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono">
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setInspectDoc(doc)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        title="Inspect extraction & limitations"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleExclude(doc)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          doc.isExcluded
                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                            : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={doc.isExcluded ? 'Include in review' : 'Exclude from review'}
                      >
                        {doc.isExcluded ? 'Include' : 'Exclude'}
                      </button>

                      <button
                        onClick={() => setDeleteDocConfirm(doc)}
                        className="p-1 hover:bg-red-50 rounded text-red-600"
                        title="Permanently delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: RECONCILIATIONS                                     */}
      {/* ========================================================== */}
      {activeTab === 'reconciliations' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Deterministic Cross-Document Reconciliations
            </h3>
            <p className="text-xs text-slate-500">
              Mathematical bridges comparing accounting trial balance/ledgers directly against submitted tax returns. Reconciled before alleging misstatement.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 text-xs">
                  Sales Ledger vs. VAT Return (Box 1 Totals)
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Ledger Revenue:</span>
                    <span className="font-mono font-medium">AED 2,450,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT Declared Supplies:</span>
                    <span className="font-mono font-medium">AED 2,280,000.00</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-amber-700">
                    <span>Unexplained Residual:</span>
                    <span className="font-mono">AED 170,000.00</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  Timing differences, credit notes, and zero-rated exports under line-item review.
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 text-xs">
                  Financial Statement Profit vs. CT Starting Point
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Signed Financial Statements Net Profit:</span>
                    <span className="font-mono font-medium">AED 520,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CT Return Box 1 Accounting Income:</span>
                    <span className="font-mono font-medium">AED 490,000.00</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-amber-700">
                    <span>Unreconciled Variance:</span>
                    <span className="font-mono">AED 30,000.00</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  Post-audit journal adjustments to be verified against trial balance closing entries.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 4: RUN & REPORT HISTORY                                */}
      {/* ========================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Reports History */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Generated Report History (.xlsx)
            </h3>
            {reports.length === 0 ? (
              <div className="text-xs text-slate-400 py-4">No Excel workbooks generated yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map(rpt => (
                  <div key={rpt.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{rpt.fileName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            rpt.type === 'Final'
                              ? 'bg-[#05466C] text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rpt.type}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Generated {rpt.generatedAt.replace('T', ' ').substring(0, 19)} · {rpt.findingsCount} findings · By {rpt.generatedBy}
                        {rpt.reviewerApprovedBy && ` (Approved by ${rpt.reviewerApprovedBy})`}
                      </div>
                    </div>
                    <a
                      href={`/api/assignments/${assignmentId}/reports/${rpt.id}/download`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0A7C3B] hover:bg-emerald-50 rounded border border-emerald-200 transition-colors"
                      download
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Runs Snapshots */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Historical Review Runs & Snapshots
            </h3>
            {runs.length === 0 ? (
              <div className="text-xs text-slate-400 py-4">No review runs recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {runs.map(run => (
                  <div key={run.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 font-mono">
                        Run #{run.runNumber} ({run.id})
                      </span>
                      <span className="text-slate-400 font-mono">
                        {run.startedAt.replace('T', ' ').substring(0, 19)}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Snapshotted {run.includedDocumentIds.length} evidence documents · {run.totalFindingsGenerated} findings generated · Skill: {run.skillId} v{run.skillVersion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: RUNNING REVIEW PROGRESS                             */}
      {/* ========================================================== */}
      {isReviewRunning && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <RefreshCw className="w-8 h-8 text-[#0A7C3B] animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              Applying AMRG UAE Review Skill
            </h3>
            <p className="text-xs text-slate-500">{reviewStepMsg}</p>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#0A7C3B] h-full transition-all duration-300"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 font-mono tabular-nums">
              {reviewProgress}% complete
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: REVIEWER VETTING & EDITING FINDING                  */}
      {/* ========================================================== */}
      {activeFinding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">
                  {activeFinding.id} · {activeFinding.domain}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {activeFinding.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveFinding(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="font-semibold text-slate-700">Detailed Observation:</div>
                <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                  {activeFinding.issueSummary}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-600">Evidence Locator A:</div>
                  <div className="mt-0.5 font-mono text-slate-800">
                    {activeFinding.evidenceALocator || 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-600">Evidence Locator B:</div>
                  <div className="mt-0.5 font-mono text-slate-800">
                    {activeFinding.evidenceBLocator || 'N/A'}
                  </div>
                </div>
              </div>

              {typeof activeFinding.variance === 'number' && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
                  <span className="font-semibold text-emerald-900">Quantified Variance:</span>
                  <span className="font-mono text-sm font-bold text-emerald-800">
                    {activeFinding.variance.toLocaleString()} {activeFinding.currency}
                  </span>
                </div>
              )}

              {activeFinding.legalBasis && (
                <div>
                  <div className="font-semibold text-slate-700">Applicable Legal Provision:</div>
                  <div className="mt-0.5 text-slate-600">{activeFinding.legalBasis}</div>
                </div>
              )}

              <div>
                <div className="font-semibold text-slate-700">Recommended Action:</div>
                <div className="mt-0.5 text-slate-600">{activeFinding.recommendedAction}</div>
              </div>

              {/* Reviewer Sign-off Form */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="font-bold text-slate-900">Reviewer Determination:</div>
                <div className="flex gap-2">
                  {(['Accepted', 'Corrected', 'Rejected', 'Dismissed'] as ReviewerDecision[]).map(dec => (
                    <button
                      key={dec}
                      onClick={() => setFindingDecision(dec)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                        findingDecision === dec
                          ? 'bg-[#0A7C3B] text-white border-[#0A7C3B]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {dec}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Reviewer Audit Notes / Working Paper Comments:
                  </label>
                  <textarea
                    rows={3}
                    value={findingNotes}
                    onChange={e => setFindingNotes(e.target.value)}
                    placeholder="Enter professional review notes, client confirmation, or basis for correction..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A7C3B]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveFinding(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFindingDecision}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0A7C3B] hover:bg-[#08632f] rounded-lg transition-colors"
              >
                Save Reviewer Sign-Off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: DOCUMENT EXTRACTION & LIMITATION VIEWER            */}
      {/* ========================================================== */}
      {inspectDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-sm">{inspectDoc.originalName}</div>
              <button
                onClick={() => setInspectDoc(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Classification:</span>{' '}
                <span className="text-slate-600">{inspectDoc.category}</span>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Period Covered:</span>{' '}
                <span className="text-slate-600">{inspectDoc.periodCovered || 'Unspecified'}</span>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Extraction Summary:</span>
                <p className="mt-1 p-3 bg-slate-50 rounded border border-slate-200 text-slate-700">
                  {inspectDoc.extractionSummary || 'No text extracted'}
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded border border-amber-200">
                <span className="font-semibold text-amber-900">Disclosed Limitations:</span>
                <p className="mt-0.5 text-amber-800">
                  {inspectDoc.limitations || 'None detected'}
                </p>
              </div>
            </div>

            <div className="text-right pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: CONFIRM PERMANENT DOCUMENT DELETION                 */}
      {/* ========================================================== */}
      {deleteDocConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Confirm Permanent Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong>{deleteDocConfirm.originalName}</strong>?
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
              Deleting this source document will mark existing findings as potentially outdated, require a fresh review run, and flag reports with <em>“Source document no longer available”</em>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => setDeleteDocConfirm(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: EDIT ENTITY DETAILS                                 */}
      {/* ========================================================== */}
      {showEditEntity && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Confirm / Edit Entity Particulars
              </h3>
              <button
                onClick={() => setShowEditEntity(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Jurisdiction / Free Zone
                </label>
                <input
                  type="text"
                  value={editForm.jurisdiction || ''}
                  onChange={e => setEditForm({ ...editForm, jurisdiction: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Trade Licence Number
                </label>
                <input
                  type="text"
                  value={editForm.tradeLicenceNumber || ''}
                  onChange={e => setEditForm({ ...editForm, tradeLicenceNumber: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  VAT TRN (15 digits)
                </label>
                <input
                  type="text"
                  value={editForm.vatTrn || ''}
                  onChange={e => setEditForm({ ...editForm, vatTrn: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Corporate Tax TRN
                </label>
                <input
                  type="text"
                  value={editForm.ctTrn || ''}
                  onChange={e => setEditForm({ ...editForm, ctTrn: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Financial Year End
                </label>
                <input
                  type="text"
                  value={editForm.financialYearEnd || ''}
                  onChange={e => setEditForm({ ...editForm, financialYearEnd: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowEditEntity(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntityEdit}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0A7C3B] hover:bg-[#08632f] rounded-lg transition-colors"
              >
                Save Particulars
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
