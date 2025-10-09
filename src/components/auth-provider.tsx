
'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, app } from '@/lib/firebase';
import { type UserProfile } from '@/lib/types';
import { doc, getFirestore, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

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
    const firestore = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // User is signed in, now listen for profile changes in Firestore
        const profileRef = doc(firestore, "users", authUser.uid);
        
        return onSnapshot(profileRef, async (docSnap) => {
          if (docSnap.exists()) {
            // Profile exists, combine auth and profile data
            const profileData = docSnap.data() as UserProfile;
            setUser({ ...authUser, profile: profileData });
          } else {
            // Profile doesn't exist, this might be the very first login ever.
            // Check if ANY user exists in our users collection.
            const querySnapshot = await getDoc(doc(firestore, "users", authUser.uid)); // Check if this specific user has a doc
            const anyUserExists = querySnapshot.exists();

            console.log(`Creating profile for user ${authUser.uid}. First user? ${!anyUserExists}`);
            const newProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email!,
              displayName: authUser.displayName || 'Novo Usuário',
              // The very first user to ever sign in becomes an admin. All subsequent users are regular users.
              role: anyUserExists ? 'user' : 'admin',
            };
            await setDoc(profileRef, newProfile);
            // We set the user state here, which might trigger a re-render in the listener, but that's fine.
            setUser({ ...authUser, profile: newProfile });
          }
          setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null); // If profile fails, treat as not fully logged in for safety.
            setLoading(false);
        });

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
