
'use client';

import type { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

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

  // If on a public route, just show the children (login/signup pages).
  // The useAuthGuard hook will handle redirection if the user is already logged in.
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If authenticated and on a protected route, show the children.
  if (isAuthenticated) {
    return <>{children}</>;
  }
  
  // If not authenticated and not on a public route, the hook will redirect.
  // Show a spinner during this brief period to prevent flashing content.
  return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Redirecionando...</span>
      </div>
    );
}
