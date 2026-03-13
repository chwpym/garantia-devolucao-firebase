
'use client';

import DevolucaoReportSection from '@/components/sections/devolucao-report-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function DevolucaoReportsPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('devolucao-reports');
  }, [setActiveView]);

  return <DevolucaoReportSection />;
}
