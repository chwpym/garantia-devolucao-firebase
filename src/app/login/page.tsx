
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, signInWithPopup, type AuthError } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // O useAuthGuard vai lidar com o redirecionamento.
      // Não precisamos mais forçar o reload.
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Você será redirecionado em breve.',
      });
    } catch (error) {
      console.error('Falha no login:', error);
      let errorMessage = 'Ocorreu um erro ao fazer login.';
      const firebaseError = error as AuthError;
      if (firebaseError.code === 'auth/invalid-credential') {
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
      // O useAuthGuard vai lidar com o redirecionamento.
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Você será redirecionado em breve.',
      });
    } catch (error) {
       console.error('Falha no login com Google:', error);
       toast({
        title: 'Falha no Login com Google',
        description: 'Não foi possível autenticar com o Google. Tente novamente.',
        variant: 'destructive',
      });
      setIsGoogleLoading(false);
    }
  };

  // AuthGuard já está mostrando um spinner, então não precisamos de um aqui
  // a menos que queiramos um placeholder específico para a página de login
  // enquanto o usuário é redirecionado. Por simplicidade, podemos retornar null.
  if (user) {
    return null;
  }

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
