'use client';

import { usePwaUpdate } from '@/hooks/use-pwa-update';
import { Button } from '@/components/ui/button';
import { Toast, ToastAction, ToastDescription, ToastTitle, ToastProvider, ToastViewport } from '@/components/ui/toast';
import { Rocket } from 'lucide-react';

export default function PwaUpdateAlert() {
  const { isUpdateAvailable, update } = usePwaUpdate();

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <ToastProvider swipeDirection="right">
      <Toast open={isUpdateAvailable} duration={Infinity} className="border-primary">
        <div className="grid gap-2">
            <ToastTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                <span>Nova versão disponível!</span>
            </ToastTitle>
            <ToastDescription>
                Uma nova versão do Synergia OS está pronta. Atualize para obter os recursos mais recentes.
            </ToastDescription>
        </div>
        <ToastAction asChild altText="Atualizar agora">
            <Button onClick={update}>
                Atualizar
            </Button>
        </ToastAction>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}
