
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (loading) return; // Still loading, do nothing.

    const isPublicPath = pathname === '/login' || pathname === '/signup';

    // If user is logged in and on a public page, redirect to home.
    if (user && isPublicPath) {
      router.replace('/');
    }

    // If user is not logged in and on a protected page, redirect to login.
    if (!user && !isPublicPath) {
      router.replace('/login');
    }
    
  }, [user, loading, pathname, router]);

  return {
    isAuthenticated: !!user,
    loading,
    user,
  };
}
