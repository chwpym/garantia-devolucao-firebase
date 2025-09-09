'use client';

import type { Warranty, Person, Supplier } from './types';

const DB_NAME = 'GarantiasDB';
const DB_VERSION = 2; // Incremented version

const GARANTIAS_STORE_NAME = 'garantias';
const PERSONS_STORE_NAME = 'persons';
const SUPPLIERS_STORE_NAME = 'suppliers';


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
        if (!dbInstance.objectStoreNames.contains(GARANTIAS_STORE_NAME)) {
          dbInstance.createObjectStore(GARANTIAS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
        if (!dbInstance.objectStoreNames.contains(PERSONS_STORE_NAME)) {
          dbInstance.createObjectStore(PERSONS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
        if (!dbInstance.objectStoreNames.contains(SUPPLIERS_STORE_NAME)) {
          dbInstance.createObjectStore(SUPPLIERS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
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

const getStore = async (storeName: string, mode: IDBTransactionMode) => {
  const db = await getDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

// --- Warranty Functions ---

export const addWarranty = (warranty: Omit<Warranty, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
        const store = await getStore(GARANTIAS_STORE_NAME, 'readwrite');
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
        const store = await getStore(GARANTIAS_STORE_NAME, 'readonly');
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
        const store = await getStore(GARANTIAS_STORE_NAME, 'readwrite');
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
        const store = await getStore(GARANTIAS_STORE_NAME, 'readwrite');
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
      const store = await getStore(GARANTIAS_STORE_NAME, 'readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};


// --- Person (Client/Mechanic) Functions ---

export const addPerson = (person: Omit<Person, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(PERSONS_STORE_NAME, 'readwrite');
      const request = store.add(person);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const getAllPersons = (): Promise<Person[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(PERSONS_STORE_NAME, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Person[]);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const updatePerson = (person: Person): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(PERSONS_STORE_NAME, 'readwrite');
      const request = store.put(person);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const deletePerson = (id: number): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(PERSONS_STORE_NAME, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};


// --- Supplier Functions ---

export const addSupplier = (supplier: Omit<Supplier, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(SUPPLIERS_STORE_NAME, 'readwrite');
      const request = store.add(supplier);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const getAllSuppliers = (): Promise<Supplier[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(SUPPLIERS_STORE_NAME, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Supplier[]);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const updateSupplier = (supplier: Supplier): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(SUPPLIERS_STORE_NAME, 'readwrite');
      const request = store.put(supplier);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const deleteSupplier = (id: number): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(SUPPLIERS_STORE_NAME, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};
