/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext.js';
import { ClientEntity } from '../../types/workbench.js';

interface ClientsViewProps {
  onOpenNewAssignment: () => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onOpenNewAssignment }) => {
  const { clients, assignments } = useWorkbench();
  const [searchTerm, setSearchTerm] = useState('');

  // Combine clients registered directly and clients inferred from assignments
  const allClientNames = Array.from(new Set([
    ...clients.map(c => c.name),
    ...assignments.map(a => a.clientName)
  ]));

  const filteredNames = allClientNames.filter(n =>
    n.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Client Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered corporate clients undergoing onboarding and historical compliance review.
          </p>
        </div>
        <button
          onClick={onOpenNewAssignment}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0A7C3B] hover:bg-[#08632f] rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          New Client Review
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm max-w-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search clients..."
            className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A7C3B]"
          />
        </div>
      </div>

      {filteredNames.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-semibold text-slate-800 mt-2">No client records found</div>
          <p className="text-xs text-slate-400 mt-1">
            Create an onboarding review assignment to register a client.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNames.map(name => {
            const matchingAsn = assignments.filter(a => a.clientName === name);
            const primaryAsn = matchingAsn[0];

            return (
              <div
                key={name}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0A7C3B] flex items-center justify-center font-bold text-sm">
                      {name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{name}</h3>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {primaryAsn?.entityDetails?.jurisdiction || 'UAE'} · {primaryAsn?.entityDetails?.entityType || 'FZCO'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Trade Licence:</span>
                    <span className="font-mono text-slate-800">
                      {primaryAsn?.entityDetails?.tradeLicenceNumber || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT Registration:</span>
                    <span className="font-mono text-slate-800">
                      {primaryAsn?.entityDetails?.vatTrn || 'Not registered'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Reviews:</span>
                    <span className="font-mono font-semibold text-[#0A7C3B]">
                      {matchingAsn.length} assignment(s)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
