/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Check, 
  Database, 
  ShieldCheck, 
  Sparkles, 
  Users 
} from 'lucide-react';
import { AmrgLogo } from '../common/AmrgLogo.js';

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            System & Methodology Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            AMRG Global review parameters, persistent cloud storage status, and document extraction engine.
          </p>
        </div>
        <AmrgLogo size="md" showSubtitle={false} />
      </div>

      {/* Unified Review Governance */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#0A7C3B]" />
          <h2 className="text-sm font-bold text-slate-900">
            Unified Professional Review Workflow
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The workbench operates with unified engagement access: any assigned engagement professional can intake client files, run cross-comparison analysis, review and vet findings, and generate draft or certified final Excel reports.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-800">1. Intake & Extraction</div>
            <div className="text-slate-500 text-[11px]">Upload folders, files, or ZIP archives with automated OCR and limitation detection.</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-800">2. Cross-Document Audit</div>
            <div className="text-slate-500 text-[11px]">Execute high-quality reconciliations and UAE statutory checks across all evidence.</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-800">3. Vetting & Excel Export</div>
            <div className="text-slate-500 text-[11px]">Vet findings and produce the fixed-format 3-sheet Excel report matching AMRG templates.</div>
          </div>
        </div>
      </div>

      {/* AI & Security Disclosure */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#0A7C3B]" />
          <h2 className="text-sm font-bold text-slate-900">
            Multimodal Extraction & Vision Processing
          </h2>
        </div>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            When client files (trade licences, tax registration certificates, Articles of Association, and financial statements) are uploaded, the workbench uses intelligent document categorization and OCR extraction to parse entity details, TRNs, and periods.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Document Processing Engine:</span>
            <span className="text-[#0A7C3B] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0A7C3B]" />
              Active (AMRG UAE Review Engine v2.0)
            </span>
          </div>
        </div>
      </div>

      {/* Storage & Persistence Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#05466C]" />
          <h2 className="text-sm font-bold text-slate-900">
            Persistent Storage & Working Paper Repository
          </h2>
        </div>
        <div className="text-xs text-slate-600 space-y-3">
          <p>
            Saved client assignments, document files, review runs, and reports persist across browser refreshes and server restarts via the local persistent JSON store and file system repository.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="text-slate-400 font-sans text-[11px]">Database Path:</div>
              <div className="text-slate-800 mt-0.5">./data/amrg-store.json</div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="text-slate-400 font-sans text-[11px]">Uploads Repository:</div>
              <div className="text-slate-800 mt-0.5">./data/uploads/</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
