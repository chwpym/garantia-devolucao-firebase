
'use client';

import { useEffect } from 'react';

export default function ClientManifestInjector() {
  useEffect(() => {
    try {
      const host = window.location.host || '';
      // Evita injeção no Cloud Workstations ou Vercel Previews onde o 401 ocorre comumente
      if (host.includes('cloudworkstations.dev') || host.includes('vercel.app')) return;

      // Se o manifesto já estiver presente, não faz nada
      if (document.querySelector('link[rel="manifest"]')) return;

      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);

      return () => {
        if (link.parentElement) link.parentElement.removeChild(link);
      };
    } catch (e) {
      // Ignora erros para evitar quebrar a hidratação
      // eslint-disable-next-line no-console
      console.warn('ClientManifestInjector: falha ao injetar o manifesto', e);
    }
  }, []);

  return null;
}
