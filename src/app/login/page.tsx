
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, type AuthError, onAuthStateChanged, setPersistence, browserSessionPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Listener para resetar o estado de loading caso o usuário seja deslogado (ex: bloqueado)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);


  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Define a persistência ANTES de fazer o login
      const persistence = rememberMe ? indexedDBLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // O AuthGuard cuidará do redirecionamento.
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
               {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember-me" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Lembrar de mim
                </label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
            <div className="mt-4 text-center text-sm">
                Não tem uma conta?{' '}
                <Link href="/signup" className="underline">
                    Cadastre-se
                </Link>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
