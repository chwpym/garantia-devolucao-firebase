
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './use-auth';

const PUBLIC_ROUTES = ['/login', '/signup'];

export function useAuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && isPublicRoute) {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  // A decisão de renderizar ou não será do AuthGuard, o hook apenas informa o estado.
  return { isLoading: loading, isAuthenticated: !!user };
}
