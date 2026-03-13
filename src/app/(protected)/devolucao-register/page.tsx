
'use client';

import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DevolucaoRegisterSection = dynamic(() => import('@/components/sections/devolucao-register-section'), {
  ssr: false,
  loading: () => <Skeleton className="h-[700px] w-full" />
});

export default function DevolucaoRegisterPage() {
  const { 
    editingDevolucaoId, 
    handleDevolucaoSaved, 
    setActiveView 
  } = useAppStore(useShallow((state) => ({
    editingDevolucaoId: state.editingDevolucaoId,
    handleDevolucaoSaved: state.handleDevolucaoSaved,
    setActiveView: state.setActiveView
  })));

  useEffect(() => {
    setActiveView('devolucao-register');
  }, [setActiveView]);

  return <DevolucaoRegisterSection editingId={editingDevolucaoId} onSave={handleDevolucaoSaved} />;
}
