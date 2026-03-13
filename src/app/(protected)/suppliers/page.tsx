
'use client';

import SuppliersSection from '@/components/sections/suppliers-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function SuppliersPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('suppliers');
  }, [setActiveView]);

  return <SuppliersSection />;
}
