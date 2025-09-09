'use client';

import type { Warranty } from './types';

const DB_NAME = 'GarantiasDB';
const STORE_NAME = 'garantias';
const DB_VERSION = 1;

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject('IndexedDB is not supported.');
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(true);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

const getStore = (mode: IDBTransactionMode) => {
  const transaction = db.transaction(STORE_NAME, mode);
  return transaction.objectStore(STORE_NAME);
};

export const addWarranty = (warranty: Omit<Warranty, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    const store = getStore('readwrite');
    const request = store.add(warranty);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const getAllWarranties = (): Promise<Warranty[]> => {
  return new Promise((resolve, reject) => {
    const store = getStore('readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Warranty[]);
    request.onerror = () => reject(request.error);
  });
};

export const updateWarranty = (warranty: Warranty): Promise<number> => {
  return new Promise((resolve, reject) => {
    const store = getStore('readwrite');
    const request = store.put(warranty);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const deleteWarranty = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const store = getStore('readwrite');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
