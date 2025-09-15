'use client';

import { useState, useEffect } from 'react';
import type { Workbox } from 'workbox-window';

declare global {
  interface Window {
    workbox: Workbox;
  }
}

export function usePwaUpdate() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox) {
      const wb = window.workbox;

      const handleWaiting = () => {
        setIsUpdateAvailable(true);
      };

      // Adiciona o listener para o evento 'waiting'
      wb.addEventListener('waiting', handleWaiting);

      // Se já existe um service worker esperando, mostra a notificação
      wb.controlling.then(controller => {
        if (controller && wb.waiting) {
            handleWaiting();
        }
      });
      
      // Força a verificação de atualizações
      wb.update();

      return () => {
        wb.removeEventListener('waiting', handleWaiting);
      };
    }
  }, []);

  const update = () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox) {
      const wb = window.workbox;
      // Ativa o novo Service Worker
      wb.messageSkipWaiting();
      // Não precisa de reload forçado aqui, o skipWaiting e o controllerchange farão o trabalho
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Recarrega a página quando um novo service worker assume o controle
      const handleControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);


  return { isUpdateAvailable, update };
}
