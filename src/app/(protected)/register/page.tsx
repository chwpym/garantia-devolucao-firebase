
'use client';

import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const RegisterSection = dynamic(() => import('@/components/sections/register-section'), {
  ssr: false,
  loading: () => <Skeleton className="h-[700px] w-full" />
});

export default function RegisterPage() {
  const { 
    editingWarrantyId, 
    registerMode, 
    handleWarrantySave, 
    setActiveView 
  } = useAppStore(useShallow((state) => ({
    editingWarrantyId: state.editingWarrantyId,
    registerMode: state.registerMode,
    handleWarrantySave: state.handleWarrantySave,
    setActiveView: state.setActiveView
  })));

  useEffect(() => {
    setActiveView('register');
  }, [setActiveView]);

  return (
    <RegisterSection
      editingId={editingWarrantyId}
      mode={registerMode}
      onSave={(shouldNavigate: boolean) => handleWarrantySave(shouldNavigate)}
      onClear={() => {
        const store = useAppStore.getState();
        store.clearEditingWarranty();
        store.goBack();
      }}
    />
  );
}
