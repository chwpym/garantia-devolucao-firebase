
'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import AppLayout from '@/components/app-layout';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}
