/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Building2, X } from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext.js';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast, refreshAssignments } = useWorkbench();
  const [clientName, setClientName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('DMCC');
  const [entityType, setEntityType] = useState('FZCO');
  const [cutoffDate, setCutoffDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      showToast('Client Legal Name is compulsory.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          jurisdiction,
          entityType,
          reviewCutoffDate: cutoffDate,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        showToast(`Assignment for ${created.clientName} created.`, 'success');
        refreshAssignments();
        onSuccess(created.id);
        onClose();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create assignment', 'error');
      }
    } catch (err) {
      showToast('Network error creating assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0A7C3B]" />
            <h3 className="text-base font-bold text-slate-900">
              Create Review Assignment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Client Legal Name <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="e.g. Apex Trading FZCO"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A7C3B]"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Client name is the only compulsory assignment field. Other particulars will be extracted from uploaded documents.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Jurisdiction / Free Zone
              </label>
              <select
                value={jurisdiction}
                onChange={e => setJurisdiction(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="DMCC">DMCC (Dubai Multi Commodities)</option>
                <option value="Dubai Mainland">Dubai Mainland</option>
                <option value="ADGM">ADGM (Abu Dhabi Global Market)</option>
                <option value="DIFC">DIFC (Dubai Intl Financial Centre)</option>
                <option value="JAFZA">JAFZA (Jebel Ali Free Zone)</option>
                <option value="DAFZ">DAFZ (Dubai Airport Freezone)</option>
                <option value="Sharjah SAIF">SAIF Zone (Sharjah)</option>
                <option value="Abu Dhabi Mainland">Abu Dhabi Mainland</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Entity Legal Form
              </label>
              <select
                value={entityType}
                onChange={e => setEntityType(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="FZCO">Free Zone Company (FZCO)</option>
                <option value="FZ-LLC">Free Zone LLC</option>
                <option value="LLC">Limited Liability Company (LLC)</option>
                <option value="Branch">Branch of Foreign / UAE Company</option>
                <option value="Sole Establishment">Sole Establishment</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Review Historical Cutoff Date
            </label>
            <input
              type="date"
              value={cutoffDate}
              onChange={e => setCutoffDate(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0A7C3B] hover:bg-[#08632f] rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
