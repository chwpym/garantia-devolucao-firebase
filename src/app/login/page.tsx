"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  signInWithEmailAndPassword,
  type AuthError,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import * as db from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  identifier: z.string().min(3, { message: "Usuário ou e-mail inválido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthGuard();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // Estado para "Lembrar de mim" (padrão: false para maior segurança)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const [usernameHint, setUsernameHint] = useState<string | null>(null);
  const identifier = form.watch("identifier");

  // Listener para sugerir username se digitar o e-mail
  useEffect(() => {
    const checkUsernameHint = async () => {
      const normalizedIdentifier = identifier?.trim().toLowerCase();
      if (normalizedIdentifier && normalizedIdentifier.includes("@")) {
        const profiles = await db.getAllUserProfiles();
        const profile = profiles.find(p => p.email.toLowerCase() === normalizedIdentifier);
        if (profile?.username) {
          setUsernameHint(profile.username);
        } else {
          setUsernameHint(null);
        }
      } else {
        setUsernameHint(null);
      }
    };
    checkUsernameHint();
  }, [identifier]);

  // Listener para resetar o estado de loading caso o usuário seja deslogado (ex: bloqueado)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      // Se tivermos um usuário ou carregamento terminou, paramos o loader local
      if (authUser || authLoading === false) {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [authLoading]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const normalizedIdentifier = data.identifier.trim().toLowerCase();
      let email = normalizedIdentifier;

      // Se não for um e-mail, tenta resolver o username
      if (!email.includes("@")) {
        const profile = await db.getUserByUsername(email);
        if (!profile) {
          toast({
            title: "Usuário não encontrado",
            description:
              "Este nome de usuário não foi reconhecido. Se for seu primeiro acesso neste dispositivo, use seu e-mail completo.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        email = profile.email;
      }

      // Define a persistência ANTES de fazer o login
      const persistence = rememberMe
        ? indexedDBLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      await signInWithEmailAndPassword(auth, email, data.password);
      // O AuthGuard cuidará do redirecionamento.
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error("Falha no login:", authError);
      let errorMessage = "Ocorreu um erro ao fazer login.";
      if (authError.code === "auth/invalid-credential") {
        errorMessage = "Credenciais inválidas. Verifique seu e-mail e senha.";
      }
      toast({
        title: "Falha no Login",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Image
            src="/logo.png"
            alt="Synergia OS Logo"
            width={64}
            height={64}
            className="mx-auto mb-4 rounded-lg"
          />
          <CardTitle className="text-2xl">Acesso ao Sistema</CardTitle>
          <CardDescription>Use sua conta para entrar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            {/* Campos falsos para "enganar" o preenchimento automático do navegador */}
            <input
              type="text"
              name="fake_email"
              style={{ display: "none" }}
              aria-hidden="true"
              tabIndex={-1}
            />
            <input
              type="password"
              name="fake_password"
              style={{ display: "none" }}
              aria-hidden="true"
              tabIndex={-1}
            />

            <div className="space-y-2">
              <Label htmlFor="identifier">Usuário ou E-mail</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="usuario ou seu@email.com"
                {...form.register("identifier")}
                disabled={isLoading}
                autoComplete="username"
              />
              {usernameHint && (
                <p className="text-xs text-blue-600 font-medium animate-in fade-in slide-in-from-top-1">
                  💡 Seu usuário é: <span className="font-bold underline">@{usernameHint}</span>
                </p>
              )}
              {form.formState.errors.identifier && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.identifier.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
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
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || authLoading}
            >
              {(isLoading || authLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Entrar
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong>Dica:</strong> Se este for seu primeiro acesso neste
              dispositivo, use seu <strong>e-mail completo</strong>. Após o
              primeiro login, você poderá usar seu nome de usuário.
            </p>
          </div>

          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/signup" className="underline">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
