
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (loading) return; // ainda carregando -> não faz nada

    const isPublicPath = pathname === '/login' || pathname === '/signup';

    if (user && isPublicPath) {
      router.replace('/');
    }
    
    if (!user && !isPublicPath) {
      // não autenticado e tentando acessar rota protegida -> redireciona
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  return {
    isAuthenticated: !!user,
    loading,
    user,
  };
}
