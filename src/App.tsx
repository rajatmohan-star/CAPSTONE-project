/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AssignmentsListView } from './components/assignments/AssignmentsListView.js';
import { AssignmentWorkspace } from './components/assignments/AssignmentWorkspace.js';
import { CreateAssignmentModal } from './components/assignments/CreateAssignmentModal.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { Header } from './components/layout/Header.js';
import { ReportsView } from './components/reports/ReportsView.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { SkillsView } from './components/skills/SkillsView.js';
import { useWorkbench, WorkbenchProvider } from './context/WorkbenchContext.js';

function MainApp() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const { toasts, dismissToast } = useWorkbench();

  const handleOpenAssignment = (id: string) => {
    setActiveAssignmentId(id);
    setCurrentTab('assignments');
  };

  const handleBackFromWorkspace = () => {
    setActiveAssignmentId(null);
  };

  const handleAssignmentCreated = (newId: string) => {
    setActiveAssignmentId(newId);
    setCurrentTab('assignments');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans antialiased">
      {/* Global Header with Official AMRG Logo */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab !== 'assignments') {
            setActiveAssignmentId(null);
          }
        }}
        onOpenNewAssignment={() => setShowNewAssignmentModal(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onOpenAssignment={handleOpenAssignment}
            onOpenNewAssignment={() => setShowNewAssignmentModal(true)}
          />
        )}

        {currentTab === 'assignments' && (
          <>
            {activeAssignmentId ? (
              <AssignmentWorkspace
                assignmentId={activeAssignmentId}
                onBack={handleBackFromWorkspace}
              />
            ) : (
              <AssignmentsListView
                onOpenAssignment={handleOpenAssignment}
                onOpenNewAssignment={() => setShowNewAssignmentModal(true)}
              />
            )}
          </>
        )}

        {currentTab === 'skills' && <SkillsView />}

        {currentTab === 'reports' && <ReportsView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={showNewAssignmentModal}
        onClose={() => setShowNewAssignmentModal(false)}
        onSuccess={handleAssignmentCreated}
      />

      {/* Global Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className={`px-4 py-3 rounded-lg shadow-lg text-xs font-medium cursor-pointer transition-all border ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WorkbenchProvider>
      <MainApp />
    </WorkbenchProvider>
  );
}
