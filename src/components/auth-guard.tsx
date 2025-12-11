
'use client';

import React from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuthGuard();

  if (loading) {
    // mostra um loader simples (render client-side only)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div role="status" aria-live="polite">Carregando...</div>
      </div>
    );
  }

  // Se não autenticado, useAuthGuard já redirecionou; aqui retornamos null (ou um fallback).
  return isAuthenticated ? <>{children}</> : null;
}
