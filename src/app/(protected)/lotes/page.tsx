
'use client';

import LotesSection from '@/components/sections/lotes-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LotesPage() {
  const router = useRouter();
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('lotes');
  }, [setActiveView]);

  return (
    <LotesSection 
      onNavigateToLote={(loteId) => {
        useAppStore.getState().handleNavigateToLote(loteId);
        router.push('/loteDetail');
      }} 
    />
  );
}
