
'use client';

import ReconciliationSection from '@/components/sections/reconciliation-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function ReconciliationPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('reconciliation');
  }, [setActiveView]);

  return <ReconciliationSection />;
}
