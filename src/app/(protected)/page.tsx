
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PendingScreen from '@/components/pending-screen';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';

export default function HomeRedirect() {
  const router = useRouter();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user?.profile.status !== 'pending') {
      router.replace('/dashboard');
    }
  }, [router, user]);

  if (isMobile === undefined) return null;

  // GATEKEEPER: Isola completamente o usuário pendente (Fase 11a)
  if (user?.profile.status === 'pending') {
    return <PendingScreen />;
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground text-sm font-headline">Redirecionando...</div>
    </div>
  );
}
