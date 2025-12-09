
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

  // During the initial check or if it's a public route, show the content.
  // The hook will handle redirection if necessary.
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  // For protected routes, show a loader while checking auth state.
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  // Once loading is complete, if the user is authenticated, show the content.
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated and not loading, show the loader while redirecting.
  // This prevents content from flashing.
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="sr-only">Redirecionando...</span>
    </div>
  );
}
