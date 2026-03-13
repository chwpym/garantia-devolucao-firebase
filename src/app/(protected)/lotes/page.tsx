
'use client';

import LotesSection from '@/components/sections/lotes-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function LotesPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('lotes');
  }, [setActiveView]);

  return <LotesSection onNavigateToLote={(loteId) => useAppStore.getState().handleNavigateToLote(loteId)} />;
}
