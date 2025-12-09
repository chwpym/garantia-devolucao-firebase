
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
              // Profile doesn't exist, create it.
              const userCount = await countUsers();
              const newRole = userCount === 0 ? 'admin' : 'user';

              console.log(`Creating profile for ${authUser.email}. User count: ${userCount}. New role: ${newRole}`);
              
              profile = {
                uid: authUser.uid,
                email: authUser.email!,
                displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Novo Usuário',
                photoURL: authUser.photoURL || undefined, // Save the photoURL if it exists
                role: newRole,
                status: 'active',
              };
              await db.upsertUserProfile(profile);
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
  }, [toast]);

  const value = { user, loading };

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
