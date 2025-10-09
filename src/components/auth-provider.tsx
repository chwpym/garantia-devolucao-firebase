
'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { type UserProfile } from '@/lib/types';
import * as db from '@/lib/db';
import { countUsers } from '@/lib/db-utils';


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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // User is signed in, now fetch or create profile
        const checkUserProfile = async () => {
          try {
            await db.initDB(); // Ensure DB is ready
            let profile = await db.getUserProfile(authUser.uid);

            if (!profile) {
              // Profile doesn't exist, create it.
              // This is where we determine if they are the first user.
              const userCount = await countUsers();
              const newRole = userCount === 0 ? 'admin' : 'user';

              console.log(`Creating profile for ${authUser.email}. User count: ${userCount}. New role: ${newRole}`);
              
              profile = {
                uid: authUser.uid,
                email: authUser.email!,
                displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Novo Usuário',
                role: newRole,
              };
              await db.upsertUserProfile(profile);
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
  }, []);

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
