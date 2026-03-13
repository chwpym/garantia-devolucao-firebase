
'use client';

import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardSection = dynamic(() => import('@/components/sections/dashboard-section'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full" />
});

export default function DashboardPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    // Sincroniza o estado interno com a URL
    setActiveView('dashboard');
  }, [setActiveView]);

  return <DashboardSection openTab={setActiveView} />;
}
