/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileCheck2, 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Scale, 
  ShieldAlert 
} from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext.js';
import { AmrgLogo } from '../common/AmrgLogo.js';

interface DashboardViewProps {
  onOpenAssignment: (id: string) => void;
  onOpenNewAssignment: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAssignment,
  onOpenNewAssignment,
}) => {
  const { assignments, currentUser } = useWorkbench();

  const totalAssignments = assignments.length;
  const inReview = assignments.filter(a => a.reviewStatus === 'Awaiting_Reviewer' || a.reviewStatus === 'Review_In_Progress').length;
  const finalized = assignments.filter(a => a.reviewStatus === 'Approved_Final').length;
  const needsRerun = assignments.filter(a => a.documentsChangedSinceLastRun).length;

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome with Affixed AMRG Logo */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <AmrgLogo size="lg" showSubtitle={true} />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              UAE Client Onboarding Review Workbench
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Historical corporate, tax, and accounting compliance reconstruction. Apply published UAE review skills, inventory documents, calculate cross-document reconciliations, and generate the fixed-format Excel deliverable.
            </p>
          </div>
          <button
            onClick={onOpenNewAssignment}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0A7C3B] hover:bg-[#08632f] rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>
        </div>
      </div>

      {/* Metric Cards - Clean, unboxed numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Active Client Reviews</div>
          <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {totalAssignments}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            UAE mainland & free zones
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Awaiting Reviewer Sign-Off</div>
          <div className="mt-2 text-3xl font-bold text-[#05466C] font-mono tabular-nums">
            {inReview}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Findings ready for vetting
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Rerun Required Alerts</div>
          <div className="mt-2 text-3xl font-bold text-amber-600 font-mono tabular-nums">
            {needsRerun}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Document changes detected
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Certified Final Reports</div>
          <div className="mt-2 text-3xl font-bold text-[#0A7C3B] font-mono tabular-nums">
            {finalized}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Approved fixed Excel deliverables
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent Assignments & UAE Regulatory Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Active Onboarding Assignments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Active Client Assignments
            </h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {assignments.length} Total
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-800 mt-3">No client assignments created</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Begin an onboarding review by creating an assignment. Client legal name is the only compulsory field required.
              </p>
              <button
                onClick={onOpenNewAssignment}
                className="mt-4 px-3.5 py-2 text-xs font-medium text-white bg-[#0A7C3B] hover:bg-[#08632f] rounded-lg shadow-sm transition-colors"
              >
                Create First Assignment
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm overflow-hidden">
              {assignments.map(asn => (
                <div
                  key={asn.id}
                  onClick={() => onOpenAssignment(asn.id)}
                  className="p-5 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {asn.clientName}
                      </span>
                      {asn.documentsChangedSinceLastRun && (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Documents changed—rerun required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{asn.entityDetails.jurisdiction}</span>
                      <span>·</span>
                      <span>{asn.entityDetails.entityType}</span>
                      <span>·</span>
                      <span>Cutoff: {asn.reportingPeriods.reviewCutoffDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-700">
                        {asn.reviewStatus.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {asn.id}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#0A7C3B] hover:bg-emerald-50 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: UAE Regulatory Reference Guide */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#0A7C3B]" />
              UAE Onboarding Statutory Rules
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard methodology rules applied across UAE onboarding reviews:
            </p>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-800">Corporate Tax (CT) Inception</div>
                <div className="text-slate-500 mt-0.5">
                  First financial year starting on or after 1 June 2023. Return and settlement due within 9 months of financial year end.
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-800">VAT Reconciliation Bridge</div>
                <div className="text-slate-500 mt-0.5">
                  Reconcile general ledger revenue with Box 1/Box 2 VAT returns. Unreconciled differences must not be assumed zero.
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-800">UBO & Economic Substance</div>
                <div className="text-slate-500 mt-0.5">
                  Cabinet Decision 109 of 2023 mandates maintaining an up-to-date register of Ultimate Beneficial Owners.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#05466C]/5 border border-[#05466C]/20 rounded-xl p-5 text-xs text-[#05466C] space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#05466C]" />
              AMRG Review Invariants
            </div>
            <p className="leading-relaxed">
              Never invent facts, amounts, or legal citations. Keep unknown amounts blank or unquantified. Distinguish missing evidence from confirmed legal breach.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
