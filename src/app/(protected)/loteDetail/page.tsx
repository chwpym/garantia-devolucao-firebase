
'use client';

import LoteDetailSection from '@/components/sections/lote-detail-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoteDetailPage() {
  const { 
    selectedLoteId, 
    goBack, 
    setActiveView 
  } = useAppStore(useShallow((state) => ({
    selectedLoteId: state.selectedLoteId,
    goBack: state.goBack,
    setActiveView: state.setActiveView
  })));

  const router = useRouter();

  useEffect(() => {
    setActiveView('loteDetail');
    if (!selectedLoteId) {
      router.replace('/lotes');
    }
  }, [setActiveView, selectedLoteId, router]);

  if (!selectedLoteId) return null;

  return <LoteDetailSection loteId={selectedLoteId} onBack={() => {
    goBack();
    router.push('/lotes');
  }} />;
}
