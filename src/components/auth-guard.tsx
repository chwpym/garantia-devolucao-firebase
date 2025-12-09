
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import ClientOnly from './client-only';

interface AuthGuardProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = ['/login', '/signup'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useAuthGuard();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // 1. Durante o carregamento inicial, sempre exiba um spinner.
  // Isso garante que o servidor e o cliente renderizem a mesma coisa inicialmente.
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  // 2. Se for uma rota pública (login/signup), renderize o conteúdo diretamente.
  // O hook useAuthGuard cuidará do redirecionamento se o usuário já estiver logado.
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // 3. Se for uma rota protegida E o usuário estiver autenticado:
  //    Use o ClientOnly para garantir que o conteúdo principal da aplicação (children)
  //    só seja renderizado no cliente, após a hidratação.
  if (isAuthenticated) {
    return <ClientOnly>{children}</ClientOnly>;
  }
  
  // 4. Se não estiver autenticado em uma rota protegida, o hook fará o redirecionamento.
  // Exibir um spinner durante esse breve momento evita que qualquer conteúdo pisque na tela.
  return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Redirecionando...</span>
      </div>
    );
}
