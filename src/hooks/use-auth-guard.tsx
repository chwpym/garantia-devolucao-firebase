
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './use-auth';

const PUBLIC_ROUTES = ['/login'];

export function useAuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Não faça nada até que a verificação inicial do Firebase termine.
    if (loading) {
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Se o usuário NÃO está logado...
    if (!user) {
      setIsAuth(false);
      // E está tentando acessar uma rota que não é pública, redirecione para o login.
      if (!isPublicRoute) {
        router.push('/login');
      }
    } 
    // Se o usuário ESTÁ logado...
    else {
      setIsAuth(true);
      // E está na página de login, redirecione para a página inicial.
      if (isPublicRoute) {
        router.push('/');
      }
    }

  }, [user, loading, router, pathname]);

  // Retorna o status de carregamento e se o usuário está autenticado para a rota atual.
  return { isLoading: loading, isAuth };
}
