
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithPopup, signInWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Eraser } from 'lucide-react';
import Image from 'next/image';
import { clearUsers } from '@/lib/db-utils';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      window.location.href = '/';
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Falha no login:', authError);
      let errorMessage = 'Ocorreu um erro ao fazer login.';
      if (authError.code === 'auth/invalid-credential') {
          errorMessage = 'Credenciais inválidas. Verifique seu e-mail e senha.';
      }
      toast({
        title: 'Falha no Login',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      window.location.href = '/';
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

  const handleClearUsers = async () => {
    try {
      await clearUsers();
      toast({
        title: 'Perfis Limpos',
        description: 'Os perfis de usuários locais foram removidos. Por favor, faça login novamente para recriar o seu como administrador.'
      });
    } catch (error) {
       toast({
        title: 'Erro',
        description: 'Não foi possível limpar os perfis de usuário.',
        variant: 'destructive',
      });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <Image src="/logo.png" alt="Synergia OS Logo" width={64} height={64} className="mx-auto mb-4 rounded-lg" />
          <CardTitle className="text-2xl">Acesso ao Sistema</CardTitle>
          <CardDescription>Use sua conta para entrar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...form.register('email')}
                disabled={isLoading || isGoogleLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password')}
                disabled={isLoading || isGoogleLoading}
              />
               {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">
              OU
            </span>
          </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8S109.8 11.8 244 11.8c70.3 0 132.3 32.4 174.5 84.2l-64.8 49.5C320.5 102.7 284.5 84 244 84c-100.3 0-181.5 78.9-181.5 177.8s81.2 177.8 181.5 177.8c108.9 0 160.1-81.1 164.8-124.3H244v-71.4h239.5c4.7 26.6 7.5 55.8 7.5 85.5z"></path>
                </svg>
               )}
              Entrar com o Google
            </Button>
            <div className="mt-4 pt-4 border-t border-dashed">
                <Button variant="destructive" className="w-full" onClick={handleClearUsers}>
                    <Eraser className="mr-2 h-4 w-4" />
                    Limpar Perfis de Usuários Locais (DEV)
                </Button>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
