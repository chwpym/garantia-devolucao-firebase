
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useAuthGuard();
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  // If authenticated, render children. If not, the hook will have already
  // initiated a redirect, so rendering null is safe.
  return isAuthenticated ? <>{children}</> : null;
}
