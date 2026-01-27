
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useToast } from '@/hooks/use-toast';
import { initDB, getUserProfile } from '@/lib/db';
import type { UserProfile } from '@/lib/types';

export interface LocalUser extends UserProfile {}

export interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

<<<<<<< HEAD
  const signOut = useCallback(() => {
    localStorage.removeItem('synergia_session');
    sessionStorage.removeItem('synergia_session');
    setUser(null);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      await initDB();
      const raw =
        localStorage.getItem('synergia_session') ||
        sessionStorage.getItem('synergia_session');
      if (raw) {
        const session = JSON.parse(raw);
        const profile = await getUserProfile(session.uid || session.email);
        if (profile) {
          if (profile.status === 'blocked') {
            toast({
              title: 'Acesso Bloqueado',
              description: 'Sua conta foi desativada.',
              variant: 'destructive',
            });
            signOut();
          } else {
            setUser(profile as LocalUser);
=======
  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // User is signed in, now fetch or create profile
        const checkUserProfile = async () => {
          try {
            await db.initDB(); // Ensure DB is ready
            let profile = await db.getUserProfile(authUser.uid);

            if (!profile) {
              // Profile doesn't exist.
              // CHECK: Is this the first user ever?
              const userCount = await countUsers();

              if (userCount === 0) {
                // First user -> Auto-create as ADMIN (Bootstrap)
                const newRole = 'admin';
                console.log(`Bootstrap: Creating first user (Admin) for ${authUser.email}`);

                profile = {
                  uid: authUser.uid,
                  email: authUser.email!,
                  displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Admin',
                  photoURL: authUser.photoURL || undefined,
                  role: newRole,
                  status: 'active',
                };
                await db.upsertUserProfile(profile);
              } else {
                // System already has users -> Create as STANDARD USER
                const newRole = 'user';
                console.log(`Registration: Creating standard user for ${authUser.email}`);

                profile = {
                  uid: authUser.uid,
                  email: authUser.email!,
                  displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Novo Usuário',
                  photoURL: authUser.photoURL || undefined,
                  role: newRole,
                  status: 'active',
                };
                await db.upsertUserProfile(profile);

                toast({
                  title: 'Cadastro Realizado',
                  description: 'Sua conta foi criada como Usuário Padrão.',
                });
              }
            }

            // ** SECURITY CHECK: Blocked users should not be able to log in **
            if (profile.status === 'blocked') {
              toast({
                title: 'Acesso Negado',
                description: 'Sua conta foi desativada por um administrador.',
                variant: 'destructive',
                duration: 10000,
              });
              await signOut(auth);
              setUser(null);
              setLoading(false);
              return;
            }

            setUser({ ...authUser, profile });

          } catch (error) {
            console.error("Error checking/creating user profile:", error);
            setUser(null); // Fail safe
          } finally {
            setLoading(false);
>>>>>>> feature/status-visual-pro
          }
        } else {
          signOut();
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('AuthProvider init error', err);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar sessão local',
        variant: 'destructive',
      });
      signOut();
    } finally {
      setLoading(false);
    }
  }, [toast, signOut]);

  useEffect(() => {
    loadSession();
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'synergia_session') {
            loadSession();
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    }
  }, [loadSession]);

  const value: AuthContextType = { user, loading, signOut, refreshUser: loadSession };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

<<<<<<< HEAD
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
=======
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
>>>>>>> feature/status-visual-pro
