'use client';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadFile(file: File, loteId: number): Promise<string> {
  if (!file) {
    throw new Error('Nenhum arquivo fornecido para upload.');
  }

  const storageRef = ref(storage, `lotes/${loteId}/${file.name}`);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}
