
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './use-auth';

const PUBLIC_ROUTES = ['/login', '/signup'];

export function useAuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) {
      return; // Wait until Firebase auth state is resolved
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && isPublicRoute) {
      router.push('/');
    } else {
      // If we are on the correct route, stop checking
      setIsChecking(false);
    }
  }, [user, loading, router, pathname]);

  return { isLoading: isChecking || loading, isAuthenticated: !!user };
}
