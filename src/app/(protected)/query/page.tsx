
'use client';

import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const QuerySection = dynamic(() => import('@/components/sections/query-section'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full" />
});

export default function QueryPage() {
  const router = useRouter();
  const { 
    setActiveView, 
    handleEditWarranty, 
    handleCloneWarranty 
  } = useAppStore(useShallow((state) => ({
    setActiveView: state.setActiveView,
    handleEditWarranty: state.handleEditWarranty,
    handleCloneWarranty: state.handleCloneWarranty
  })));

  const handleEdit = (warranty: any) => {
    handleEditWarranty(warranty);
    router.push('/register');
  };

  const handleClone = (warranty: any) => {
    handleCloneWarranty(warranty);
    router.push('/register');
  };

  useEffect(() => {
    setActiveView('query');
  }, [setActiveView]);

  return (
    <QuerySection
      setActiveView={setActiveView}
      onEdit={handleEdit}
      onClone={handleClone}
    />
  );
}
