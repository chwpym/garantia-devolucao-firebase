
'use client';

import { useState, useEffect } from 'react';
import { signInWithPopup, type AuthError } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';


export default function LoginPage() {
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Redireciona se o usuário já estiver logado
    if (user && pathname === '/login') {
        router.push('/');
    }
  }, [user, router, pathname]);


  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // O AuthGuard cuidará do redirecionamento após o estado de autenticação mudar.
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Você será redirecionado em breve.',
      });
    } catch (error) {
       const authError = error as AuthError;
       console.error('Falha no login com Google:', authError);
       toast({
        title: 'Falha no Login com Google',
        description: authError.code === 'auth/popup-closed-by-user' 
            ? 'A janela de login foi fechada. Tente novamente.'
            : 'Não foi possível autenticar com o Google.',
        variant: 'destructive',
      });
      setIsGoogleLoading(false);
    }
  };

  // AuthGuard já está mostrando um spinner, então não precisamos de um aqui.
  // Retornamos null para não renderizar nada enquanto o usuário é redirecionado.
  if (user) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <Image src="/logo.png" alt="Synergia OS Logo" width={64} height={64} className="mx-auto mb-4 rounded-lg" />
          <CardTitle className="text-2xl">Acesso ao Sistema</CardTitle>
          <CardDescription>Use sua conta do Google para entrar.</CardDescription>
        </CardHeader>
        <CardContent>
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8S109.8 11.8 244 11.8c70.3 0 132.3 32.4 174.5 84.2l-64.8 49.5C320.5 102.7 284.5 84 244 84c-100.3 0-181.5 78.9-181.5 177.8s81.2 177.8 181.5 177.8c108.9 0 160.1-81.1 164.8-124.3H244v-71.4h239.5c4.7 26.6 7.5 55.8 7.5 85.5z"></path>
                </svg>
               )}
              Entrar com o Google
            </Button>
        </CardContent>
      </Card>
    </main>
  );
}
