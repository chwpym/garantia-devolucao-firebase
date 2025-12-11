
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Aguarda a verificação da autenticação terminar.

    const isPublicPath = pathname === '/login' || pathname === '/signup';

    // Se o utilizador não está logado e tenta aceder a uma rota protegida, redireciona para o login.
    if (!user && !isPublicPath) {
      router.replace('/login');
    }

    // Se o utilizador está logado e tenta aceder a uma rota pública, redireciona para o dashboard.
    if (user && isPublicPath) {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  return {
    isAuthenticated: !!user,
    loading,
    user,
  };
}
