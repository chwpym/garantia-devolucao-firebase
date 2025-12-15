'use client';

import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// Esta configuração agora funciona tanto no servidor (durante o build) quanto no cliente.
const firebaseConfig: FirebaseOptions = {
  // Prioriza a variável de servidor, mas usa a de cliente como fallback.
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Padrão Singleton para inicializar o Firebase apenas uma vez.
function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const app = getFirebaseApp();
const auth = getAuth(app);
const storage = getStorage(app);


export { app, auth, storage, createUserWithEmailAndPassword, updateProfile, getFirebaseApp };
