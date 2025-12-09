
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface AuthGuardProps {
  children: ReactNode;
}

// This component is now a "logic-only" component.
// It runs the auth guard hook but doesn't render any UI itself.
// The UI (spinner or children) is now handled by the AuthProvider.
export function AuthGuard({ children }: AuthGuardProps) {
  useAuthGuard();
  
  return <>{children}</>;
}
