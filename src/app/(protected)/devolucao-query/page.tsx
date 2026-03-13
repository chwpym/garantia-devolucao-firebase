
'use client';

import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DevolucaoQuerySection = dynamic(() => import('@/components/sections/devolucao-query-section'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full" />
});

export default function DevolucaoQueryPage() {
  const { 
    handleEditDevolucao, 
    setActiveView 
  } = useAppStore(useShallow((state) => ({
    handleEditDevolucao: state.handleEditDevolucao,
    setActiveView: state.setActiveView
  })));

  useEffect(() => {
    setActiveView('devolucao-query');
  }, [setActiveView]);

  return <DevolucaoQuerySection onEdit={handleEditDevolucao} />;
}
