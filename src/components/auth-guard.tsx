
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  // The hook now handles all redirection logic.
  // The isLoading check is moved to AuthProvider to avoid hydration issues.
  const { isAuthenticated } = useAuthGuard();
  
  // If authenticated, render children. Otherwise, the hook has already
  // initiated a redirect, so rendering null is safe and prevents content flashing.
  return isAuthenticated ? <>{children}</> : null;
}
