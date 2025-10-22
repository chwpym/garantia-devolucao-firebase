
'use client';

import { create } from 'zustand';
import type { Warranty, Person, Supplier, Product, WarrantyStatus } from '@/lib/types';
import * as db from '@/lib/db';

export type RegisterMode = 'edit' | 'clone';

interface AppState {
  // Data stores
  products: Product[];
  persons: Person[];
  suppliers: Supplier[];
  isDataLoaded: boolean;
  
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
  loadInitialData: () => Promise<void>;
  reloadData: (dataType?: 'products' | 'persons' | 'suppliers') => Promise<void>;
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
  setNewLoteModalOpen: (isOpen: boolean) => void;
}

const runDataMigration = async () => {
  const MIGRATION_KEY = 'warranty_status_migration_v1';
  if (typeof window !== 'undefined' && localStorage.getItem(MIGRATION_KEY)) {
    return; // Migration already performed
  }

  console.log('Iniciando migração de status de garantias...');
  try {
    const warranties = await db.getAllWarranties();
    let updatedCount = 0;

    for (const warranty of warranties) {
      let needsUpdate = false;
      let newStatus: WarrantyStatus | undefined = warranty.status;
      
      const oldStatus = warranty.status as unknown; // Treat as unknown for safe comparison

      switch (oldStatus) {
        case 'Em análise':
          newStatus = 'Enviado para Análise';
          needsUpdate = true;
          break;
        case 'Aprovada':
          newStatus = 'Aprovada - Peça Nova';
          needsUpdate = true;
          break;
        case 'Paga':
          newStatus = 'Aprovada - Crédito Boleto';
          needsUpdate = true;
          break;
      }

      if (needsUpdate && newStatus) {
        const updatedWarranty = { ...warranty, status: newStatus };
        await db.updateWarranty(updatedWarranty);
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`Migração concluída! ${updatedCount} garantias foram atualizadas.`);
    } else {
      console.log('Nenhuma garantia precisou de migração.');
    }

    if (typeof window !== 'undefined') {
        localStorage.setItem(MIGRATION_KEY, 'completed');
    }
  } catch (error) {
    console.error('Falha na migração de dados:', error);
  }
};


export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  products: [],
  persons: [],
  suppliers: [],
  isDataLoaded: false,
  activeView: 'dashboard',
  navigationHistory: [],
  isMobileMenuOpen: false,
  isNewLoteModalOpen: false,
  selectedLoteId: null,
  editingDevolucaoId: null,
  editingWarrantyId: null,
  registerMode: 'edit',

  // --- DATA ACTIONS ---
  loadInitialData: async () => {
    try {
      await db.initDB();
      // Run data migration before loading data
      await runDataMigration();

      const [products, persons, suppliers] = await Promise.all([
        db.getAllProducts(),
        db.getAllPersons(),
        db.getAllSuppliers(),
      ]);
      set({ 
        products: products.sort((a, b) => a.descricao.localeCompare(b.descricao)),
        persons: persons.sort((a, b) => a.nome.localeCompare(b.nome)),
        suppliers: suppliers.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia)),
        isDataLoaded: true 
      });
    } catch (error) {
      console.error("Failed to load initial app data:", error);
    }
  },

  reloadData: async (dataType) => {
    try {
      if (!dataType || dataType === 'products') {
        const products = await db.getAllProducts();
        set({ products: products.sort((a, b) => a.descricao.localeCompare(b.descricao)) });
      }
      if (!dataType || dataType === 'persons') {
        const persons = await db.getAllPersons();
        set({ persons: persons.sort((a, b) => a.nome.localeCompare(b.nome)) });
      }
      if (!dataType || dataType === 'suppliers') {
        const suppliers = await db.getAllSuppliers();
        set({ suppliers: suppliers.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia)) });
      }
    } catch (error) {
       console.error("Failed to reload data:", error);
    }
  },

  // --- UI ACTIONS ---
  setActiveView: (viewId, shouldAddToHistory = false) => {
    if (shouldAddToHistory) {
      set(state => ({ navigationHistory: [...state.navigationHistory, state.activeView] }));
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
    get().goBack(); // Volta para a tela anterior (consulta)
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
      get().goBack(); // Volta para a tela anterior (consulta)
    }
    window.dispatchEvent(new CustomEvent('datachanged'));
  },

  clearEditingWarranty: () => {
    set({ editingWarrantyId: null });
    get().goBack(); // Volta para a tela anterior
  },

  openNewLoteModal: () => {
    get().setActiveView('lotes'); // Navega para a seção de lotes antes de abrir o modal
    set({ isNewLoteModalOpen: true });
  },
  setNewLoteModalOpen: (isOpen: boolean) => set({ isNewLoteModalOpen: isOpen }),
}));
