
'use client';

import CalculatorsSection from '@/components/sections/calculators-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function CalculatorsPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('calculators');
  }, [setActiveView]);

  return <CalculatorsSection />;
}
