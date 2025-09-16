'use client';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// Updated to be more generic, accepting a File or Blob
export async function uploadFile(file: File | Blob, path: string): Promise<string> {
  if (!file) {
    throw new Error('Nenhum arquivo fornecido para upload.');
  }

  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}
