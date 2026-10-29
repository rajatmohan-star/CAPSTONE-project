/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Assignment, ClientEntity, UserProfile, UserRole } from '../types/workbench.js';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface WorkbenchContextType {
  currentUser: UserProfile;
  switchRole: (role: UserRole) => void;
  users: UserProfile[];
  assignments: Assignment[];
  clients: ClientEntity[];
  activeAssignmentId: string | null;
  setActiveAssignmentId: (id: string | null) => void;
  refreshAssignments: () => Promise<void>;
  refreshClients: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  isAiConfigured: boolean;
}

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export const WorkbenchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'usr-admin',
    name: 'Rajat Mohan',
    email: 'rajat.mohan@icai.org',
    role: 'Administrator',
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [clients, setClients] = useState<ClientEntity[]>([]);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(true);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), 5000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshAssignments = async () => {
    try {
      const res = await fetch('/api/assignments');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  };

  const refreshClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          setCurrentUser(data[0]);
        }
      })
      .catch(console.error);

    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setIsAiConfigured(data.aiConfigured !== false);
      })
      .catch(console.error);

    refreshAssignments();
    refreshClients();
  }, []);

  const switchRole = (role: UserRole) => {
    const found = users.find(u => u.role === role);
    if (found) {
      setCurrentUser(found);
      showToast(`Switched active role to ${role} (${found.name})`, 'info');
    } else {
      setCurrentUser(prev => ({ ...prev, role }));
      showToast(`Switched active role to ${role}`, 'info');
    }
  };

  return (
    <WorkbenchContext.Provider
      value={{
        currentUser,
        switchRole,
        users,
        assignments,
        clients,
        activeAssignmentId,
        setActiveAssignmentId,
        refreshAssignments,
        refreshClients,
        toasts,
        showToast,
        dismissToast,
        isAiConfigured,
      }}
    >
      {children}
    </WorkbenchContext.Provider>
  );
};

export const useWorkbench = () => {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbench must be used within a WorkbenchProvider');
  }
  return context;
};
