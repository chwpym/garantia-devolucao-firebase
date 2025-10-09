
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuth, isLoading } = useAuthGuard();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  if (isAuth) {
    return <>{children}</>;
  }

  // Se não estiver autenticado, o useAuthGuard já terá iniciado o redirecionamento.
  // Retornamos null para não renderizar nada enquanto o redirecionamento ocorre.
  return null;
}
