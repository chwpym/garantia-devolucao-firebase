'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyADteWmWhm-6bMSRBA76JBSV32DpLCUels",
  authDomain: "controle-garantia.firebaseapp.com",
  projectId: "controle-garantia",
  storageBucket: "controle-garantia.appspot.com",
  messagingSenderId: "753625861980",
  appId: "1:753625861980:web:4fba368d822bff7c77fb99",
  measurementId: "G-ZHP4ZMLKLV"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);

export { app, storage };
