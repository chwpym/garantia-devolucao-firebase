'use client';

import { useAuth } from './auth-provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Espera o AuthProvider terminar de carregar o estado de autenticação.
    if (loading) {
      return;
    }

    const isPublicRoute = pathname === '/login';

    // 2. Se o usuário não está logado e tenta acessar uma rota privada, redireciona.
    if (!user && !isPublicRoute) {
      router.push('/login');
    }

    // 3. Se o usuário já está logado e tenta acessar a página de login, redireciona.
    if (user && isPublicRoute) {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  // 4. Renderiza os filhos incondicionalmente. O useEffect cuidará dos redirecionamentos.
  // A lógica que retornava 'null' foi removida, pois era a causa da tela branca/spinner infinito.
  return <>{children}</>;
}
