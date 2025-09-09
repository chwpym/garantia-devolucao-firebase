'use client';

import type { Warranty } from './types';

const DB_NAME = 'GarantiasDB';
const STORE_NAME = 'garantias';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (typeof window === 'undefined') {
    return Promise.reject('IndexedDB is not supported on the server.');
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
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
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }
  return dbPromise;
};

export const initDB = async (): Promise<boolean> => {
  try {
    await getDB();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const getStore = async (mode: IDBTransactionMode) => {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, mode);
  return transaction.objectStore(STORE_NAME);
};

export const addWarranty = (warranty: Omit<Warranty, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
        const store = await getStore('readwrite');
        const request = store.add(warranty);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    } catch(err) {
        reject(err);
    }
  });
};

export const getAllWarranties = (): Promise<Warranty[]> => {
  return new Promise(async (resolve, reject) => {
    try {
        const store = await getStore('readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as Warranty[]);
        request.onerror = () => reject(request.error);
    } catch (err) {
        reject(err);
    }
  });
};

export const getWarrantiesByIds = (ids: number[]): Promise<Warranty[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await getStore('readonly');
        const allWarranties = await getAllWarranties();
        const numericIds = ids.map(id => Number(id));
        const filtered = allWarranties.filter(w => w.id && numericIds.includes(w.id));
        resolve(filtered);
      } catch (err) {
        reject(err);
      }
    });
};

export const updateWarranty = (warranty: Warranty): Promise<number> => {
  return new Promise(async(resolve, reject) => {
    try {
        const store = await getStore('readwrite');
        const request = store.put(warranty);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    } catch (err) {
        reject(err);
    }
  });
};

export const deleteWarranty = (id: number): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
        const store = await getStore('readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    } catch (err) {
        reject(err);
    }
  });
};

export const clearWarranties = (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore('readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};
