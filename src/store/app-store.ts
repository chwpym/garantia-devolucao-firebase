
'use client';

import { create } from 'zustand';
import type { Warranty } from '@/lib/types';

// Define o tipo para o modo de registro, que pode ser 'edit' ou 'clone'.
// Isso ajuda a determinar se o formulário de garantia deve salvar um novo item ou atualizar um existente.
export type RegisterMode = 'edit' | 'clone';


interface AppState {
  // Navigation and UI
  activeView: string;
  navigationHistory: string[]; // Histórico de navegação
  isMobileMenuOpen: boolean;
  isNewLoteModalOpen: boolean;

  // State for editing items
  selectedLoteId: number | null;
  editingDevolucaoId: number | null;
  editingWarrantyId: number | null;
  registerMode: RegisterMode;

  // Actions
  setActiveView: (view: string, fromHistory?: boolean) => void;
  goBack: () => void;
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
  setActiveView: (view, fromHistory = false) => {
    const { activeView, navigationHistory } = get();
    // Só adiciona ao histórico se a navegação não for para a mesma view
    // e não for uma navegação de "volta"
    if (view !== activeView && !fromHistory) {
      set({ navigationHistory: [...navigationHistory, activeView] });
    }

    // Reset editing states when changing main views
    if (view !== 'register') {
      set({ editingWarrantyId: null });
    }
    if (view !== 'devolucao-register') {
      set({ editingDevolucaoId: null });
    }
    set({ activeView: view });
  },

  goBack: () => {
    const { navigationHistory } = get();
    if (navigationHistory.length > 0) {
        const previousView = navigationHistory[navigationHistory.length - 1];
        set({ 
            navigationHistory: navigationHistory.slice(0, -1),
        });
        // Chama setActiveView com o flag 'fromHistory' para não adicionar ao histórico novamente
        get().setActiveView(previousView, true);
    }
  },
  
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  setNewLoteModalOpen: (isOpen) => set({ isNewLoteModalOpen: isOpen }),

  handleNavigateToLote: (loteId) => {
    get().setActiveView('loteDetail');
    set({ selectedLoteId: loteId });
  },

  handleBackToList: () => {
    get().setActiveView('lotes');
    set({ selectedLoteId: null });
  },

  handleEditDevolucao: (devolucaoId) => {
    get().setActiveView('devolucao-register');
    set({ editingDevolucaoId: devolucaoId });
  },

  handleDevolucaoSaved: () => {
    // Não navega mais automaticamente. A navegação será feita pelo botão "Cancelar" se o usuário desejar.
    set({ editingDevolucaoId: null });
    window.dispatchEvent(new CustomEvent('datachanged')); // Notifica outras partes da UI
  },

  handleEditWarranty: (warranty) => {
    get().setActiveView('register');
    set({ editingWarrantyId: warranty.id!, registerMode: 'edit' });
  },

  handleCloneWarranty: (warranty) => {
    get().setActiveView('register');
    set({ editingWarrantyId: warranty.id!, registerMode: 'clone' });
  },

  handleWarrantySave: (shouldNavigate) => {
    if (shouldNavigate) {
      get().setActiveView('query');
    }
    set({ editingWarrantyId: null });
    window.dispatchEvent(new CustomEvent('datachanged')); // Notifica outras partes da UI
  },

  clearEditingWarranty: () => {
    set({ editingWarrantyId: null });
  },

  openNewLoteModal: () => set({ isNewLoteModalOpen: true }),
}));
