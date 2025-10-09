'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Este useEffect é bom para redirecionar usuários que já têm uma sessão ativa.
  useEffect(() => {
    if (!loading && user) {
        router.push('/');
    }
  }, [user, loading, router]);


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // ==================================================================
  // FUNÇÃO onSubmit CORRIGIDA
  // ==================================================================
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // FORÇA O RECARREGAMENTO DA PÁGINA - ESTA É A CORREÇÃO
      window.location.href = '/';
    } catch (error: any) {
      console.error('Falha no login:', error);
      let errorMessage = 'Ocorreu um erro ao fazer login.';
      if (error.code === 'auth/invalid-credential') {
          errorMessage = 'Credenciais inválidas. Verifique seu e-mail e senha.';
      }
      toast({
        title: 'Falha no Login',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false); // Desliga o spinner apenas em caso de erro
    }
  };

  // ==================================================================
  // FUNÇÃO handleGoogleSignIn CORRIGIDA
  // ==================================================================
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // FORÇA O RECARREGAMENTO DA PÁGINA - ESTA É A CORREÇÃO
      window.location.href = '/';
    } catch (error: any) {
       console.error('Falha no login com Google:', error);
       toast({
        title: 'Falha no Login com Google',
        description: 'Não foi possível autenticar com o Google. Tente novamente.',
        variant: 'destructive',
      });
      setIsGoogleLoading(false); // Desliga o spinner apenas em caso de erro
    }
  };

  // Se o AuthProvider ainda está carregando ou se o usuário já existe, mostre um spinner.
  // Isso evita que a tela de login "pisque" para um usuário já logado.
  if (loading || user) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-background">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      )
  }

  // Se não está carregando e não há usuário, mostra a página de login.
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <Image src="/logo.png" alt="Synergia OS Logo" width={64} height={64} className="mx-auto mb-4 rounded-lg" />
          <CardTitle className="text-2xl">Bem-vindo ao Synergia OS</CardTitle>
          <CardDescription>Faça login para acessar o sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} disabled={isLoading || isGoogleLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} disabled={isLoading || isGoogleLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </Form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                    </span>
                </div>
            </div>
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8S109.8 11.8 244 11.8c70.3 0 132.3 32.4 174.5 84.2l-64.8 49.5C320.5 102.7 284.5 84 244 84c-100.3 0-181.5 78.9-181.5 177.8s81.2 177.8 181.5 177.8c108.9 0 160.1-81.1 164.8-124.3H244v-71.4h239.5c4.7 26.6 7.5 55.8 7.5 85.5z"></path>
                </svg>
               )}
              Entrar com Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
