
'use client';

import ReportSection from '@/components/sections/report-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function ReportsPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('reports');
  }, [setActiveView]);

  return <ReportSection />;
}
