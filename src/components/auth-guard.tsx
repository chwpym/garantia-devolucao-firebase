
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

// This component now handles the loading UI, but only renders its children
// when authentication is no longer loading.
export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading: isAuthLoading } = useAuthGuard();
  const { loading: isProviderLoading } = useAuth();
  
  if (isAuthLoading || isProviderLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  return <>{children}</>;
}
