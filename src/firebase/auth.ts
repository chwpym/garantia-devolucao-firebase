'use client';

import { 
    onAuthStateChanged as _onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as _signOut,
    type User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function onAuthStateChanged(callback: (user: User | null) => void) {
    return _onAuthStateChanged(auth, callback);
}

export function authLogin(email: string, pass: string) {
    return signInWithEmailAndPassword(auth, email, pass);
}

export function authSignOut() {
    return _signOut(auth);
}
