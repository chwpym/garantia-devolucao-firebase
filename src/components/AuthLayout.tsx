
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import type { ReactNode } from 'react';

// Este componente não existe mais no seu projeto, mas estou recriando-o
// com a lógica correta que discutimos.

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Se o AuthProvider ainda não terminou de verificar, não fazemos nada.
  // O AuthProvider já está mostrando uma tela de carregamento global.
  if (loading) {
    return null; 
  }

  // Se a verificação terminou e não há usuário, redireciona para o login.
  if (!user) {
    router.replace('/login');
    return null; // Retorna null para evitar renderizar qualquer coisa durante o redirecionamento.
  }

  // Se a verificação terminou e há um usuário, mostra o conteúdo protegido.
  return <>{children}</>;
}
