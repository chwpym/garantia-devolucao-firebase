
'use client';

import React from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuthGuard();

  if (loading) {
    // Mostra um loader simples enquanto verifica a autenticação
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div role="status" aria-live="polite">Carregando...</div>
      </div>
    );
  }

  // Se não autenticado, useAuthGuard já redirecionou; aqui retornamos null para não renderizar nada.
  // Se autenticado, renderiza os children (a página protegida).
  return isAuthenticated ? <>{children}</> : null;
}
