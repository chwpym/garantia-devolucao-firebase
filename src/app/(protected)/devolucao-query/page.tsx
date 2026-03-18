
'use client';

import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

import { useRouter } from 'next/navigation';

const DevolucaoQuerySection = dynamic(() => import('@/components/sections/devolucao-query-section'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full" />
});

export default function DevolucaoQueryPage() {
  const router = useRouter();
  const { 
    handleEditDevolucao, 
    setActiveView 
  } = useAppStore(useShallow((state) => ({
    handleEditDevolucao: state.handleEditDevolucao,
    setActiveView: state.setActiveView
  })));

  const handleEdit = (devolucaoId: number) => {
    handleEditDevolucao(devolucaoId);
    router.push('/devolucao-register');
  };

  useEffect(() => {
    setActiveView('devolucao-query');
  }, [setActiveView]);

  return <DevolucaoQuerySection onEdit={handleEdit} />;
}
