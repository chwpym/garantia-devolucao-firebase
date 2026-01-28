
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { onAuthStateChanged, type User, signOut } from 'firebase/auth';
import { getAuth } from "firebase/auth";
import { getFirebaseApp } from '@/lib/firebase';
import { type UserProfile } from '@/lib/types';
import * as db from '@/lib/db';
import { countUsers } from '@/lib/db-utils';
import { toast } from '@/hooks/use-toast';


// This new type combines Firebase Auth user with our custom profile data
export type AppUser = User & { profile: UserProfile };

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  pendingUsersCount: number; // New field for admin notifications
  refreshPendingCount: () => Promise<void>; // Function to update the count
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  const refreshPendingCount = async () => {
    try {
      const allUsers = await db.getAllUserProfiles();
      const pending = allUsers.filter(u => u.status === 'pending').length;
      setPendingUsersCount(pending);
    } catch (error) {
      console.error("Error fetching pending count:", error);
    }
  };

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
                  status: 'pending', // Set to pending by default
                };
                await db.upsertUserProfile(profile);

                toast({
                  title: 'Cadastro Recebido',
                  description: 'Sua conta foi criada e está aguardando aprovação do administrador.',
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

            if (profile.role === 'admin') {
              await refreshPendingCount();
            }

            setUser({ ...authUser, profile });

          } catch (error) {
            console.error("Error checking/creating user profile:", error);
            setUser(null); // Fail safe
          } finally {
            setLoading(false);
          }
        };

        checkUserProfile();

      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // auth is stable, toast is imported directly

  const value = useMemo(() => ({
    user,
    loading,
    pendingUsersCount,
    refreshPendingCount
  }), [user, loading, pendingUsersCount]);

  return (
    <AuthContext.Provider value={value}>
      {children}
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
