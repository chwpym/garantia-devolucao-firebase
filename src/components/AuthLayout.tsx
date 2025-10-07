'use client';

import { useAuth } from './auth-provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Espera o AuthProvider terminar

    const isPublicRoute = pathname === '/login';

    if (!user && !isPublicRoute) {
      router.push('/login');
    }

    if (user && isPublicRoute) {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  // Enquanto o redirecionamento está pendente, não renderize nada.
  // O spinner global do AuthProvider já cobre o estado de carregamento inicial.
  const isPublicRoute = pathname === '/login';
  if ((!user && !isPublicRoute) || (user && isPublicRoute)) {
    return null;
  }

  return <>{children}</>;
}
