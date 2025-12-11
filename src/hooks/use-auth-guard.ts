'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Aguarda o estado de autenticação ser resolvido

    const isPublicPath = pathname === '/login' || pathname === '/signup';

    // Se NÃO está autenticado E está tentando acessar uma rota protegida
    if (!user && !isPublicPath) {
      router.replace('/login');
    }
    
    // Se ESTÁ autenticado E está em uma página pública (login/signup)
    if (user && isPublicPath) {
      router.replace('/'); // Redireciona para a página principal
    }

  }, [user, loading, pathname, router]);

  return {
    isAuthenticated: !!user,
    loading,
    user,
  };
}
