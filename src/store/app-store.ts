'use client';

import { create } from 'zustand';
import type { Warranty } from '@/lib/types';
import type { RegisterMode } from '@/app/page';

interface AppState {
  // Navigation and UI
  activeView: string;
  isMobileMenuOpen: boolean;
  isNewLoteModalOpen: boolean;

  // State for editing items
  selectedLoteId: number | null;
  editingDevolucaoId: number | null;
  editingWarrantyId: number | null;
  registerMode: RegisterMode;

  // Actions
  setActiveView: (view: string) => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  setNewLoteModalOpen: (isOpen: boolean) => void;
  
  // Lote Navigation
  handleNavigateToLote: (loteId: number) => void;
  handleBackToList: () => void;

  // Devolucao editing
  handleEditDevolucao: (devolucaoId: number) => void;
  handleDevolucaoSaved: () => void;

  // Warranty editing
  handleEditWarranty: (warranty: Warranty) => void;
  handleCloneWarranty: (warranty: Warranty) => void;
  handleWarrantySave: () => void;
  clearEditingWarranty: () => void;

  // Modal actions
  openNewLoteModal: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  activeView: 'dashboard',
  isMobileMenuOpen: false,
  isNewLoteModalOpen: false,
  selectedLoteId: null,
  editingDevolucaoId: null,
  editingWarrantyId: null,
  registerMode: 'edit',

  // Actions
  setActiveView: (view) => {
    // Reset editing states when changing main views
    if (view !== 'register') {
      set({ editingWarrantyId: null });
    }
    if (view !== 'devolucao-register') {
      set({ editingDevolucaoId: null });
    }
    set({ activeView: view });
  },
  
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  setNewLoteModalOpen: (isOpen) => set({ isNewLoteModalOpen: isOpen }),

  handleNavigateToLote: (loteId) => {
    set({ selectedLoteId: loteId, activeView: 'loteDetail' });
  },

  handleBackToList: () => {
    set({ selectedLoteId: null, activeView: 'lotes' });
  },

  handleEditDevolucao: (devolucaoId) => {
    set({ editingDevolucaoId: devolucaoId, activeView: 'devolucao-register' });
  },

  handleDevolucaoSaved: () => {
    set({ editingDevolucaoId: null, activeView: 'devolucao-query' });
  },

  handleEditWarranty: (warranty) => {
    set({ editingWarrantyId: warranty.id!, registerMode: 'edit', activeView: 'register' });
  },

  handleCloneWarranty: (warranty) => {
    set({ editingWarrantyId: warranty.id!, registerMode: 'clone', activeView: 'register' });
  },

  handleWarrantySave: () => {
    set({ editingWarrantyId: null, activeView: 'query' });
  },

  clearEditingWarranty: () => {
    set({ editingWarrantyId: null });
  },

  openNewLoteModal: () => set({ isNewLoteModalOpen: true }),
}));
