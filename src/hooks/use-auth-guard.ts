
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // ainda carregando -> não faz nada

    const isPublicPath = pathname === '/login' || pathname === '/signup' || pathname.startsWith('/public');

    // Se o utilizador NÃO está autenticado E está a tentar aceder a uma rota protegida
    if (!user && !isPublicPath) {
      router.replace('/login');
    }
    
    // Se o utilizador ESTÁ autenticado E está numa página pública (login/signup)
    if (user && isPublicPath) {
      router.replace('/'); // Redireciona para a página principal (dashboard)
    }

  }, [user, loading, pathname, router]);

  return {
    isAuthenticated: !!user,
    loading,
    user,
  };
}
