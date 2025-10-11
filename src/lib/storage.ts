'use client';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path where the file should be stored in the bucket.
 * @returns A promise that resolves with the public download URL of the file.
 */
export const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    // A inicialização do storage já acontece em firebase.ts, que é client-side.
    // Apenas usamos a instância exportada.
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};
