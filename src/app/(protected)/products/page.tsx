
'use client';

import ProductsSection from '@/components/sections/products-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function ProductsPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('products');
  }, [setActiveView]);

  return <ProductsSection />;
}
