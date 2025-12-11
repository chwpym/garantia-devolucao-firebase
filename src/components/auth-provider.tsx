
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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

  const signOut = useCallback(() => {
    localStorage.removeItem('synergia_session');
    sessionStorage.removeItem('synergia_session');
    setUser(null);
    // Redirect to login page after sign out to ensure clean state
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
  }, []);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
        await initDB();
        const raw = localStorage.getItem('synergia_session') || sessionStorage.getItem('synergia_session');
        if (raw) {
          const session = JSON.parse(raw);
          const profile = await getUserProfile(session.uid || session.email);
          if (profile) {
              if (profile.status === 'blocked') {
                toast({ title: 'Acesso Bloqueado', description: 'Sua conta foi desativada.', variant: 'destructive' });
                signOut();
              } else {
                setUser(profile as LocalUser);
              }
          } else {
             signOut(); // Profile not found, clear session
          }
        } else {
            setUser(null);
        }
      } catch (err) {
        console.error('AuthProvider init error', err);
        toast({ title: 'Erro', description: 'Falha ao carregar sessão local', variant: 'destructive' });
        signOut();
      } finally {
        setLoading(false);
      }
  }, [toast, signOut]);
  
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return <AuthContext.Provider value={{ user, loading, signOut, refreshUser: loadSession }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
