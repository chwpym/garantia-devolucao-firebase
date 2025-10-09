
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = ['/login', '/signup'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useAuthGuard();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  // Se estiver autenticado, ou se estiver em uma rota pública, mostre o conteúdo.
  // O hook `useAuthGuard` cuidará do redirecionamento se necessário.
  if (isAuthenticated || isPublicRoute) {
      return <>{children}</>;
  }

  // Enquanto o redirecionamento não acontece (para usuários não autenticados fora das rotas públicas),
  // mostre o spinner para evitar uma tela em branco.
  return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Redirecionando...</span>
      </div>
    );
}
