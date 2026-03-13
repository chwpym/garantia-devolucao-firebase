
'use client';

import PersonsSection from '@/components/sections/persons-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function PersonsPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('persons');
  }, [setActiveView]);

  return <PersonsSection />;
}
