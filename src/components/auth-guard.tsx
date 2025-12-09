
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import ClientOnly from './client-only';

interface AuthGuardProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = ['/login', '/signup'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useAuthGuard();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // While loading authentication state, show a full-screen spinner.
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  // If on a public route, render the children directly (login/signup pages).
  // The useAuthGuard hook handles redirecting away if already authenticated.
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, use ClientOnly to prevent hydration mismatch.
  // This ensures the main app content only renders on the client side
  // after authentication state is confirmed.
  if (isAuthenticated) {
    return <ClientOnly>{children}</ClientOnly>;
  }
  
  // If not authenticated and on a protected route, the hook will redirect.
  // Show a spinner during this brief period to prevent content flashing.
  return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Redirecionando...</span>
      </div>
    );
}
