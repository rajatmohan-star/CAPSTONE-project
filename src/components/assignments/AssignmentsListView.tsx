/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AlertCircle,
  Building2, 
  CheckCircle2, 
  ChevronRight, 
  Clock,
  FileCheck2,
  FileSpreadsheet, 
  FileText,
  Filter, 
  FolderArchive,
  Plus, 
  Search,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext.js';
import { AmrgLogo } from '../common/AmrgLogo.js';

interface AssignmentsListViewProps {
  onOpenAssignment: (id: string) => void;
  onOpenNewAssignment: () => void;
}

export const AssignmentsListView: React.FC<AssignmentsListViewProps> = ({
  onOpenAssignment,
  onOpenNewAssignment,
}) => {
  const { assignments, refreshAssignments } = useWorkbench();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('All');

  const filtered = assignments.filter(asn => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = asn.clientName.toLowerCase().includes(q);
      const matchId = asn.id.toLowerCase().includes(q);
      const matchJur = (asn.entityDetails?.jurisdiction || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchJur) return false;
    }
    if (statusFilter !== 'All' && asn.reviewStatus !== statusFilter) {
      return false;
    }
    if (jurisdictionFilter !== 'All' && asn.entityDetails?.jurisdiction !== jurisdictionFilter) {
      return false;
    }
    return true;
  });

  const totalClients = new Set(assignments.map(a => a.clientName)).size;
  const awaitingReviewCount = assignments.filter(a => a.reviewStatus === 'Awaiting_Reviewer').length;
  const approvedFinalCount = assignments.filter(a => a.reviewStatus === 'Approved_Final').length;

  return (
    <div className="space-y-6">
      {/* Brand Hero & Header Lockup */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <AmrgLogo size="lg" showSubtitle={true} />
          <div className="border-l border-slate-200 pl-4 hidden sm:block">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Clients & Review Assignments
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Unified command center for AMRG Global UAE corporate client onboarding, evidence intake, and audit-grade cross-document compliance reviews.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewAssignment}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0A7C3B] hover:bg-[#08632f] rounded-xl shadow-sm transition-all whitespace-nowrap self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          New Client Review
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Corporate Clients</span>
            <Building2 className="w-4 h-4 text-[#0A7C3B]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalClients}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">UAE Entities in Scope</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Reviews</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{assignments.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total Engagements</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Sign-off</span>
            <AlertCircle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{awaitingReviewCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Vetting In Progress</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Approved Reports</span>
            <FileCheck2 className="w-4 h-4 text-[#05466C]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{approvedFinalCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Final Reports Certified</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by client name, jurisdiction, or ID..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A7C3B]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700"
          >
            <option value="All">All Review Statuses</option>
            <option value="Intake">Intake (Evidence Upload)</option>
            <option value="Awaiting_Reviewer">Awaiting Reviewer</option>
            <option value="Approved_Final">Approved Final</option>
          </select>

          <select
            value={jurisdictionFilter}
            onChange={e => setJurisdictionFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700"
          >
            <option value="All">All Jurisdictions</option>
            <option value="Sharjah SAIF">Sharjah SAIF</option>
            <option value="DMCC">DMCC, Dubai</option>
            <option value="DIFC">DIFC, Dubai</option>
            <option value="Dubai Mainland">Dubai Mainland</option>
            <option value="ADGM">ADGM, Abu Dhabi</option>
          </select>
        </div>
      </div>

      {/* Clients & Assignments Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center text-slate-500">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="text-base font-bold text-slate-800 mt-3">No clients or review assignments found</div>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Get started by creating your first client review assignment. Client name is the only compulsory intake field.
          </p>
          <button
            onClick={onOpenNewAssignment}
            className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-[#0A7C3B] hover:bg-[#08632f] rounded-lg shadow-sm transition-colors"
          >
            Create Client Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(asn => (
            <div
              key={asn.id}
              onClick={() => onOpenAssignment(asn.id)}
              className="bg-white border border-slate-200 hover:border-[#0A7C3B] p-5 rounded-2xl shadow-xs hover:shadow-md cursor-pointer transition-all space-y-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0A7C3B] flex items-center justify-center font-bold text-base border border-emerald-100 group-hover:bg-[#0A7C3B] group-hover:text-white transition-colors">
                    {asn.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-[#0A7C3B] transition-colors">
                      {asn.clientName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-400">{asn.id}</span>
                      <span>·</span>
                      <span>{asn.entityDetails?.jurisdiction || 'UAE'}</span>
                      <span>·</span>
                      <span>{asn.entityDetails?.entityType || 'FZCO'}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    asn.reviewStatus === 'Approved_Final'
                      ? 'bg-emerald-100 text-emerald-800'
                      : asn.reviewStatus === 'Awaiting_Reviewer'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {asn.reviewStatus.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Status & Change Badges */}
              {asn.documentsChangedSinceLastRun && (
                <div className="bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-medium">Documents changed — rerun review required</span>
                </div>
              )}

              {/* Entity Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Financial Year-End</div>
                  <div className="font-medium text-slate-800 mt-0.5">
                    {asn.entityDetails?.financialYearEnd || '31 December'}
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400">First CT Period</div>
                  <div className="font-medium text-slate-800 mt-0.5">
                    {asn.entityDetails?.firstCtPeriod || 'FY2024'}
                  </div>
                </div>
              </div>

              {/* Footer bar */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0A7C3B]" />
                  <span>Skill: AMRG UAE Onboarding v{asn.currentSkillVersion}</span>
                </div>
                <div className="flex items-center gap-1 text-[#0A7C3B] font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Open Review</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
