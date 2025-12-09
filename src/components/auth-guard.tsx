
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  // This hook now handles all the redirection logic.
  // The AuthGuard's only job is to run the hook and render children
  // if the hook doesn't redirect.
  useAuthGuard();
  
  return <>{children}</>;
}
