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

      // Adiciona o listener para o evento 'waiting'.
      // Este evento é disparado quando um novo service worker está instalado mas "esperando" para ativar.
      wb.addEventListener('waiting', handleWaiting);
      
      // Força a verificação por uma nova versão do service worker.
      // Se uma nova versão for encontrada e instalada, o evento 'waiting' acima será disparado.
      wb.update();

      return () => {
        wb.removeEventListener('waiting', handleWaiting);
      };
    }
  }, []);

  const update = () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox) {
      const wb = window.workbox;
      // Envia uma mensagem para o service worker "em espera" para que ele se ative.
      wb.messageSkipWaiting();
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Recarrega a página quando um novo service worker assume o controle,
      // o que acontece após o messageSkipWaiting() ser chamado.
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
