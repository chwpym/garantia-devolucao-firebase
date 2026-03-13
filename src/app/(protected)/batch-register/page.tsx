
'use client';

import BatchRegisterSection from '@/components/sections/batch-register-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function BatchRegisterPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('batch-register');
  }, [setActiveView]);

  return <BatchRegisterSection />;
}
