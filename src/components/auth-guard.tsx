
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useAuthGuard();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  // Se estiver autenticado, ou se estiver na página de login, mostre o conteúdo.
  // O hook `useAuthGuard` cuidará do redirecionamento se necessário.
  if (isAuthenticated || pathname === '/login') {
      return <>{children}</>;
  }

  // Enquanto o redirecionamento não acontece (para usuários não autenticados fora do login),
  // mostre o spinner para evitar uma tela em branco.
  return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Redirecionando...</span>
      </div>
    );
}
