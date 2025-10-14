

'use client';

import { create } from 'zustand';
import type { Warranty } from '@/lib/types';
import { navConfig, type NavItem } from '@/config/nav-config';

export type RegisterMode = 'edit' | 'clone';

// Helper para encontrar um NavItem no navConfig
const findNavItem = (viewId: string): NavItem | undefined => {
  for (const item of navConfig) {
    if (item.id === viewId) return item;
    if (item.items) {
      const found = item.items.find(subItem => subItem.id === viewId);
      if (found) return found;
    }
  }
  return undefined;
};


interface AppState {
  // Navigation and UI
  activeTabId: string | null;
  tabs: NavItem[];
  navigationHistory: string[];
  isMobileMenuOpen: boolean;
  isNewLoteModalOpen: boolean;

  // State for editing items
  selectedLoteId: number | null;
  editingDevolucaoId: number | null;
  editingWarrantyId: number | null;
  registerMode: RegisterMode;

  // Actions
  openTab: (viewId: string, shouldAddToHistory?: boolean) => void;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string | null) => void;
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
  activeTabId: 'dashboard',
  tabs: [findNavItem('dashboard')!].filter(Boolean),
  navigationHistory: [],
  isMobileMenuOpen: false,
  isNewLoteModalOpen: false,
  selectedLoteId: null,
  editingDevolucaoId: null,
  editingWarrantyId: null,
  registerMode: 'edit',

  // Actions
  openTab: (viewId, shouldAddToHistory = false) => {
    const { tabs, activeTabId } = get();
    
    if (shouldAddToHistory && activeTabId) {
        set(state => ({
            navigationHistory: [...state.navigationHistory, activeTabId],
        }));
    }

    const existingTab = tabs.find(tab => tab.id === viewId);

    if (existingTab) {
      set({ activeTabId: viewId });
    } else {
      const newTab = findNavItem(viewId);
      if (newTab) {
        set({ tabs: [...tabs, newTab], activeTabId: viewId });
      }
    }
    set({ isMobileMenuOpen: false }); // Sempre fecha o menu ao abrir uma aba
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);

    if (tabIndex === -1) return;

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    let newActiveTabId = activeTabId;

    if (activeTabId === tabId) {
      if (tabs[tabIndex - 1]) {
        newActiveTabId = tabs[tabIndex - 1].id;
      } else if (newTabs[tabIndex]) {
        newActiveTabId = newTabs[tabIndex].id;
      } else {
        newActiveTabId = newTabs[newTabs.length - 1]?.id || null;
      }
    }
    
    set({ tabs: newTabs, activeTabId: newActiveTabId });
  },

  setActiveTabId: (tabId) => set({ activeTabId: tabId }),
  
  goBack: () => {
    const { navigationHistory, activeTabId } = get();
    if (navigationHistory.length > 0) {
      const previousViewId = navigationHistory[navigationHistory.length - 1];
      if (activeTabId) {
        get().closeTab(activeTabId);
      }
      set({
        navigationHistory: navigationHistory.slice(0, -1),
        activeTabId: previousViewId,
      });
    }
  },
  
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),

  handleNavigateToLote: (loteId) => {
    // Adiciona a view atual ('lotes') ao histórico antes de navegar
    set(state => ({
        selectedLoteId: loteId,
        navigationHistory: [...state.navigationHistory, 'lotes'],
    }));
    get().openTab('loteDetail');
  },

  handleEditDevolucao: (devolucaoId) => {
    get().openTab('devolucao-register', true);
    set({ editingDevolucaoId: devolucaoId });
  },

  handleDevolucaoSaved: () => {
    set({ editingDevolucaoId: null });
    window.dispatchEvent(new CustomEvent('datachanged'));
  },

  handleEditWarranty: (warranty) => {
    get().openTab('register', true);
    set({ editingWarrantyId: warranty.id!, registerMode: 'edit' });
  },

  handleCloneWarranty: (warranty) => {
    get().openTab('register', true);
    set({ editingWarrantyId: warranty.id!, registerMode: 'clone' });
  },

  handleWarrantySave: (shouldNavigate) => {
    if (shouldNavigate) {
      get().closeTab('register');
      const previousView = get().navigationHistory.at(-1) || 'query';
      set(state => ({
          activeTabId: previousView,
          navigationHistory: state.navigationHistory.slice(0, -1)
      }))
    }
    set({ editingWarrantyId: null });
    window.dispatchEvent(new CustomEvent('datachanged'));
  },

  clearEditingWarranty: () => {
    set({ editingWarrantyId: null });
  },

  openNewLoteModal: () => {
    get().openTab('lotes');
    set({ isNewLoteModalOpen: true });
  },
}));
