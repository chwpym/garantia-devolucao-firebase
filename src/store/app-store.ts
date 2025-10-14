

'use client';

import { create } from 'zustand';
import type { Warranty } from '@/lib/types';
import { navConfig, type NavItem } from '@/config/nav-config';

export type RegisterMode = 'edit' | 'clone';

interface AppState {
  // Navigation and UI
  activeView: string;
  navigationHistory: string[];
  isMobileMenuOpen: boolean;
  isNewLoteModalOpen: boolean;

  // State for editing items
  selectedLoteId: number | null;
  editingDevolucaoId: number | null;
  editingWarrantyId: number | null;
  registerMode: RegisterMode;

  // Actions
  setActiveView: (viewId: string, shouldAddToHistory?: boolean) => void;
  goBack: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  
  // Lote Navigation
  handleNavigateToLote: (loteId: number) => void;

  // Devolucao editing
  handleEditDevolucao: (devolucaoId: number) => void;
  handleDevolucaoSaved: () => void;

  // Warranty editing
  handleEditWarranty: (warranty: Warranty) => void;
  handleCloneWarranty: (warranty: Warranty) => void;
  handleWarrantySave: (shouldNavigate: boolean) => void;
  clearEditingWarranty: () => void;

  // Modal actions
  openNewLoteModal: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  activeView: 'dashboard',
  navigationHistory: [],
  isMobileMenuOpen: false,
  isNewLoteModalOpen: false,
  selectedLoteId: null,
  editingDevolucaoId: null,
  editingWarrantyId: null,
  registerMode: 'edit',

  // Actions
  setActiveView: (viewId, shouldAddToHistory = false) => {
    const { activeView } = get();
    if (shouldAddToHistory) {
        set(state => ({
            navigationHistory: [...state.navigationHistory, activeView],
        }));
    }
    set({ activeView: viewId, isMobileMenuOpen: false });
  },

  goBack: () => {
    const { navigationHistory } = get();
    if (navigationHistory.length > 0) {
      const previousViewId = navigationHistory[navigationHistory.length - 1];
      set({
        navigationHistory: navigationHistory.slice(0, -1),
        activeView: previousViewId,
      });
    }
  },
  
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),

  handleNavigateToLote: (loteId) => {
    get().setActiveView('loteDetail', true);
    set({ selectedLoteId: loteId });
  },

  handleEditDevolucao: (devolucaoId) => {
    get().setActiveView('devolucao-register', true);
    set({ editingDevolucaoId: devolucaoId });
  },

  handleDevolucaoSaved: () => {
    set({ editingDevolucaoId: null });
    get().setActiveView('devolucao-query');
    window.dispatchEvent(new CustomEvent('datachanged'));
  },

  handleEditWarranty: (warranty) => {
    get().setActiveView('register', true);
    set({ editingWarrantyId: warranty.id!, registerMode: 'edit' });
  },

  handleCloneWarranty: (warranty) => {
    get().setActiveView('register', true);
    set({ editingWarrantyId: warranty.id!, registerMode: 'clone' });
  },

  handleWarrantySave: (shouldNavigate) => {
    set({ editingWarrantyId: null });
    if (shouldNavigate) {
      get().setActiveView('query');
    }
    window.dispatchEvent(new CustomEvent('datachanged'));
  },

  clearEditingWarranty: () => {
    set({ editingWarrantyId: null });
  },

  openNewLoteModal: () => {
    get().setActiveView('lotes');
    set({ isNewLoteModalOpen: true });
  },
}));
