/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Building2, X } from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext.js';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (clientId: string) => void;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createClient } = useWorkbench();
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('FZCO');
  const [jurisdiction, setJurisdiction] = useState('Sharjah SAIF');
  const [tradeLicenceNumber, setTradeLicenceNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatTrn, setVatTrn] = useState('');
  const [ctTrn, setCtTrn] = useState('');
  const [financialYearEnd, setFinancialYearEnd] = useState('31 December');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Client name is compulsory.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const newClient = await createClient({
        name: name.trim(),
        entityType,
        jurisdiction,
        tradeLicenceNumber: tradeLicenceNumber.trim() || undefined,
        registrationNumber: registrationNumber.trim() || undefined,
        vatTrn: vatTrn.trim() || undefined,
        ctTrn: ctTrn.trim() || undefined,
        financialYearEnd,
      });

      // Reset
      setName('');
      setTradeLicenceNumber('');
      setRegistrationNumber('');
      setVatTrn('');
      setCtTrn('');
      onSuccess(newClient.id);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create client workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0A7C3B]/10 text-[#0A7C3B]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">New Client Onboarding</h3>
              <p className="text-xs text-slate-500">Create a dedicated UAE onboarding workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Quadria Healthcare GCC Consulting Ltd"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0A7C3B] focus:border-transparent"
              autoFocus
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Client name is the only compulsory field. Additional details can be extracted from evidence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Legal Entity Form
              </label>
              <select
                value={entityType}
                onChange={e => setEntityType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0A7C3B]"
              >
                <option value="FZCO">Free Zone Company (FZCO)</option>
                <option value="FZ-LLC">Free Zone LLC (FZ-LLC)</option>
                <option value="LLC">Mainland LLC</option>
                <option value="Branch">Foreign / Zone Branch</option>
                <option value="Holding Company">Holding Company</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jurisdiction
              </label>
              <input
                type="text"
                value={jurisdiction}
                onChange={e => setJurisdiction(e.target.value)}
                placeholder="e.g. Sharjah SAIF, DMCC, Dubai Mainland"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0A7C3B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trade Licence Number
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={tradeLicenceNumber}
                onChange={e => setTradeLicenceNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0A7C3B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registration / Establishment No.
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={registrationNumber}
                onChange={e => setRegistrationNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0A7C3B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                VAT TRN (if registered)
              </label>
              <input
                type="text"
                placeholder="15-digit TRN"
                value={vatTrn}
                onChange={e => setVatTrn(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0A7C3B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Tax TRN
              </label>
              <input
                type="text"
                placeholder="CT TRN"
                value={ctTrn}
                onChange={e => setCtTrn(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0A7C3B]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 text-xs font-medium text-white bg-[#0A7C3B] hover:bg-[#08632f] disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
