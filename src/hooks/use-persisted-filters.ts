'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';

/**
 * A custom hook to manage filter state that is persisted in the global store.
 * It provides a way to read and update filters that are specific to a view,
 * ensuring they remain consistent across navigation.
 */
export function usePersistedFilters<T>(viewId: string, initialFilters: T) {
    // We use useShallow to ensure that we only re-render if the filters object itself
    // or the setFilterState function actually changes (which it shouldn't).
    const { filters, setFilterState } = useAppStore(useShallow((state) => ({
        filters: (state.filterStates[viewId] || initialFilters) as T,
        setFilterState: state.setFilterState
    })));

    // Update store
    const setFilters = useCallback((newFilters: T | ((prev: T) => T)) => {
        // We get the current state directly from the store to avoid dependency on 'filters'
        // This makes the setFilters function stable.
        const currentFilters = (useAppStore.getState().filterStates[viewId] || initialFilters) as T;

        const updated = typeof newFilters === 'function'
            ? (newFilters as (prev: T) => T)(currentFilters)
            : newFilters;

        setFilterState(viewId, updated);
    }, [viewId, setFilterState, initialFilters]);

    // Helper to reset filters
    const resetFilters = useCallback(() => {
        setFilterState(viewId, initialFilters);
    }, [viewId, initialFilters, setFilterState]);

    return { filters, setFilters, resetFilters };
}
