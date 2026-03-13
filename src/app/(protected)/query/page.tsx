
'use client';

import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const QuerySection = dynamic(() => import('@/components/sections/query-section'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full" />
});

export default function QueryPage() {
  const { 
    setActiveView, 
    handleEditWarranty, 
    handleCloneWarranty 
  } = useAppStore(useShallow((state) => ({
    setActiveView: state.setActiveView,
    handleEditWarranty: state.handleEditWarranty,
    handleCloneWarranty: state.handleCloneWarranty
  })));

  useEffect(() => {
    setActiveView('query');
  }, [setActiveView]);

  return (
    <QuerySection
      setActiveView={setActiveView}
      onEdit={handleEditWarranty}
      onClone={handleCloneWarranty}
    />
  );
}
