
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { countUsers } from '@/lib/db-utils';
import type { UserProfile } from '@/lib/types';

export type AppUser = User & { profile?: UserProfile };

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const refreshUser = async () => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const current = auth.currentUser;
    if (!current) {
      setUser(null);
      return;
    }
    try {
      await db.initDB();
      const profile = await db.getUserProfile(current.uid);
      setUser({ ...current, profile: profile ?? undefined });
    } catch (err) {
      console.error('Failed refresh user:', err);
    }
  };

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      (async () => {
        try {
          await db.initDB();
          let profile = await db.getUserProfile(authUser.uid);
          if (!profile) {
            const userCount = await countUsers();
            const newRole = userCount === 0 ? 'admin' : 'user';
            profile = {
              uid: authUser.uid,
              email: authUser.email ?? '',
              displayName: authUser.displayName ?? (authUser.email?.split('@')[0] ?? 'Novo Usuário'),
              photoURL: authUser.photoURL ?? undefined,
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
            });
            setUser(null);
            setLoading(false);
            return;
          }

          setUser({ ...authUser, profile });
        } catch (error) {
          console.error('Error loading profile:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => unsubscribe();
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
