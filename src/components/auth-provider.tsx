
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, type User, signOut } from 'firebase/auth';
import { getAuth } from "firebase/auth";
import { getFirebaseApp } from '@/lib/firebase';
import { type UserProfile } from '@/lib/types';
import * as db from '@/lib/db';
import { countUsers } from '@/lib/db-utils';
import { useToast } from '@/hooks/use-toast';
import { AuthGuard } from './auth-guard';
import { Loader2 } from 'lucide-react';


// This new type combines Firebase Auth user with our custom profile data
export type AppUser = User & { profile: UserProfile };

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // State to prevent rendering on the server
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // This runs only on the client

    const app = getFirebaseApp();
    const auth = getAuth(app);
    
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        const checkUserProfile = async () => {
          try {
            await db.initDB();
            let profile = await db.getUserProfile(authUser.uid);

            if (!profile) {
              const userCount = await countUsers();
              const newRole = userCount === 0 ? 'admin' : 'user';

              profile = {
                uid: authUser.uid,
                email: authUser.email!,
                displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Novo Usuário',
                photoURL: authUser.photoURL || undefined,
                role: newRole,
                status: 'active',
              };
              await db.upsertUserProfile(profile);
            }

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
            setUser(null);
          } finally {
            setLoading(false);
          }
        };

        checkUserProfile();

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [toast]);

  const value = { user, loading };

  // Render nothing on the server or before the client has mounted
  if (!isClient) {
    return null;
  }
  
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      <AuthGuard>
        {children}
      </AuthGuard>
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
