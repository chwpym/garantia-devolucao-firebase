
'use client';

import ProductReportSection from '@/components/sections/product-report-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function ProductReportsPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('product-reports');
  }, [setActiveView]);

  return <ProductReportSection />;
}
