
'use client';

import BackupSection from '@/components/sections/backup-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function BackupPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('backup');
  }, [setActiveView]);

  return <BackupSection />;
}
