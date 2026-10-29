/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { AmrgLogo } from '../common/AmrgLogo.js';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewAssignment: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, onOpenNewAssignment }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'assignments', label: 'Clients & Assignments' },
    { id: 'skills', label: 'Skills & Templates' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Brand Wordmark with Official AMRG Global Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => onSelectTab('dashboard')} 
              className="text-left focus:outline-none"
            >
              <AmrgLogo size="md" showSubtitle={true} />
            </button>
          </div>

          {/* Zone 2: Navigation Links (Merged Clients & Assignments) */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`text-sm font-medium whitespace-nowrap transition-colors relative py-1 ${
                  currentTab === item.id
                    ? 'text-[#0A7C3B] font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {currentTab === item.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7C3B] rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Zone 3: Actions (Unified without separate role switcher) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">AMRG Review Team</div>
              <div className="text-[10px] text-slate-400">Reviewer & Preparer Authorized</div>
            </div>

            <button
              onClick={onOpenNewAssignment}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0A7C3B] hover:bg-[#08632f] rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              New Assignment
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
