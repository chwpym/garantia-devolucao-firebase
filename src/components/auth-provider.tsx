'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return; // Não faça nada enquanto o estado de auth está carregando

    const isPublicRoute = pathname === '/login';

    // Se o usuário não está logado e tenta acessar uma rota privada
    if (!user && !isPublicRoute) {
      router.push('/login');
    }

    // Se o usuário está logado e tenta acessar a página de login
    if (user && isPublicRoute) {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  // Se o estado de autenticação ainda está carregando, ou se estamos prestes a redirecionar,
  // mostramos um spinner global para evitar "piscar" de conteúdo.
  const isPublicRoute = pathname === '/login';
  if (loading || (!user && !isPublicRoute) || (user && isPublicRoute)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Se tudo estiver certo, renderiza o conteúdo da página
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
