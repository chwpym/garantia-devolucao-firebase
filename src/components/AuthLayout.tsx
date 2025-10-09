// ESTE ARQUIVO NÃO É MAIS NECESSÁRIO E SERÁ REMOVIDO EM UM PRÓXIMO PASSO.
// A LÓGICA FOI MOVIDA PARA AuthGuard E useAuthGuard.
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return null; 
  }

  if (!user) {
    router.replace('/login');
    return null; 
  }

  return <>{children}</>;
}
