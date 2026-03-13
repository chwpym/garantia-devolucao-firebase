
'use client';

import SettingsSection from '@/components/sections/settings-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function SettingsPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('settings');
  }, [setActiveView]);

  return <SettingsSection />;
}
