/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  FileSpreadsheet, 
  Filter, 
  Layers, 
  Scale, 
  Search, 
  ShieldCheck 
} from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext.js';
import { MasterChecklistItem } from '../../types/workbench.js';

export const SkillsView: React.FC = () => {
  const { currentUser, showToast } = useWorkbench();
  const [checklist, setChecklist] = useState<MasterChecklistItem[]>([]);
  const [skillMeta, setSkillMeta] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'skill' | 'checklist' | 'excel_mapping'>('skill');
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');

  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => {
        setSkillMeta(data.skills?.[0]);
        setChecklist(data.masterChecklist || []);
      })
      .catch(console.error);
  }, []);

  const filteredChecklist = checklist.filter(item => {
    if (areaFilter !== 'All' && !item.area.includes(areaFilter)) return false;
    if (searchTerm && !item.documentType.toLowerCase().includes(searchTerm.toLowerCase()) && !item.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Skills, Checklists & Excel Mappings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Governing review methodology, statutory checklist items, and fixed Excel workbook cell mappings.
          </p>
        </div>

        <button
          onClick={() => showToast('Skill definitions are published and locked to v2.0.0', 'info')}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#05466C] hover:bg-[#043450] rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Manage Published Skills
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => setActiveTab('skill')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'skill' ? 'text-[#0A7C3B] font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Published Review Skill (v2.0)
            {activeTab === 'skill' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7C3B]" />}
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'checklist' ? 'text-[#0A7C3B] font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Master Document Checklist ({checklist.length})
            {activeTab === 'checklist' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7C3B]" />}
          </button>

          <button
            onClick={() => setActiveTab('excel_mapping')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'excel_mapping' ? 'text-[#0A7C3B] font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Excel Template Schema
            {activeTab === 'excel_mapping' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7C3B]" />}
          </button>
        </div>
      </div>

      {/* TAB 1: Skill Specification */}
      {activeTab === 'skill' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {skillMeta?.name || 'AMRG UAE Onboarding Checks'}
                  </h2>
                  <span className="text-[11px] font-bold text-[#0A7C3B] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    v{skillMeta?.version || '2.0.0'} Published
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Technical Skill ID: <code className="font-mono text-slate-700">{skillMeta?.id || 'amrg-uae-onboarding-checks'}</code>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Acts as AMRG's structured historical onboarding review assistant. Reconstructs client positions from incorporation to the agreed cutoff, including work performed by multiple previous advisers. Establishes obligations, evaluates evidence, identifies discrepancies, and produces a fixed-format Excel deliverable.
            </p>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Approved UAE Regulatory Frameworks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {skillMeta?.lawsCovered?.map((law: any) => (
                  <div key={law.code} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
                    <div className="px-1.5 py-0.5 bg-[#05466C] text-white rounded font-mono font-bold text-[10px] shrink-0">
                      {law.code}
                    </div>
                    <div className="text-slate-700 leading-snug">
                      {law.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Master Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search checklist..."
                className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A7C3B]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={areaFilter}
                onChange={e => setAreaFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="All">All Audit Areas</option>
                <option value="Corporate">Corporate / Free Zone (GOV)</option>
                <option value="Accounting">Accounting / Banking (ACC)</option>
                <option value="VAT">Value Added Tax (VAT)</option>
                <option value="CT">Corporate Tax (CT)</option>
                <option value="Free Zone">Free Zone Regulations (FZ)</option>
                <option value="Labour">Labour & Regulatory (OTH)</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Checklist ID</th>
                  <th className="py-3 px-3">Area</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-3">Required Period</th>
                  <th className="py-3 px-4">Standard Authority / Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChecklist.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.id}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.area}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.documentType}</td>
                    <td className="py-3 px-3 text-slate-500">{item.requiredPeriod}</td>
                    <td className="py-3 px-4 text-slate-500">{item.obtainFrom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Excel Template Schema */}
      {activeTab === 'excel_mapping' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0A7C3B]" />
            <h3 className="text-base font-bold text-slate-900">
              AMRG Fixed Excel Output Architecture (.xlsx)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Preserves the strict sheet order, column layout, numerical typing, and formatting specified in the engagement methodology. Never combines law-wise sheets into a single generic issues tab.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800">Position 1: Title & Summary</div>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>1. Basic details & Review ID</li>
                <li>2. Periods covered</li>
                <li>3. Laws reviewed</li>
                <li>4. Documents received</li>
                <li>5. Documents not received</li>
                <li>6. Broad issues in numbered points</li>
                <li>7. Coverage & next actions</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800">Positions 2 to 9: Domain Sheets</div>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>2. CT (Corporate Tax)</li>
                <li>3. VAT (Value Added Tax)</li>
                <li>4. Free Zone (Licensing & Conditions)</li>
                <li>5. Banking (Statements & Mandates)</li>
                <li>6. Secretarial Services (UBO & Registers)</li>
                <li>7. Labour Laws (WPS & Employment)</li>
                <li>8. Other Laws (AML, ESR, Customs)</li>
                <li>9. Accounting & Audit (FS & Audit adjustments)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
