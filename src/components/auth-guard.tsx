
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Loader2 } from 'lucide-react';
import ClientOnly from './client-only';

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
  
  if (isAuthenticated) {
    return <ClientOnly>{children}</ClientOnly>
  }

  // If not authenticated and not loading, the hook will have already triggered a redirect.
  // We can return null or a loader as a fallback.
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="sr-only">Redirecionando...</span>
    </div>
  );
}
