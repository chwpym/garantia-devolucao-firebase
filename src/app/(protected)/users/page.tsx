
'use client';

import UsersSection from '@/components/sections/users-section';
import { useAppStore } from '@/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function UsersPage() {
  const setActiveView = useAppStore(useShallow((state) => state.setActiveView));

  useEffect(() => {
    setActiveView('users');
  }, [setActiveView]);

  return <UsersSection />;
}
