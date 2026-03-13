
'use client';

import StatusSection from '@/components/sections/status-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function StatusesPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('statuses');
  }, [setActiveView]);

  return <StatusSection />;
}
