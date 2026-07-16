
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ParsedNfe } from '@/lib/nfe-parser';

interface NfeStore {
    currentNfe: ParsedNfe | null;
    allNfes: ParsedNfe[];
    setCurrentNfe: (nfe: ParsedNfe | null) => void;
    addNfe: (nfe: ParsedNfe) => void;
    removeNfe: (chave: string) => void;
    clearAll: () => void;
}

export const useNfeStore = create<NfeStore>()(
    persist(
        (set) => ({
            currentNfe: null,
            allNfes: [],
            setCurrentNfe: (nfe) => set({ currentNfe: nfe }),
            addNfe: (nfe) => set((state) => {
                // Evitar duplicatas pela chave
                const exists = state.allNfes.some(x => x.header.chave === nfe.header.chave);
                if (exists) return state;
                return { 
                    allNfes: [...state.allNfes, nfe],
                    currentNfe: nfe 
                };
            }),
            removeNfe: (chave) => set((state) => ({
                allNfes: state.allNfes.filter(x => x.header.chave !== chave),
                currentNfe: state.currentNfe?.header.chave === chave ? null : state.currentNfe
            })),
            clearAll: () => set({ currentNfe: null, allNfes: [] }),
        }),
        {
            name: 'nfe-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
