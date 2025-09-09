'use client';

import type { Warranty, Person, Supplier, Lote, LoteItem } from './types';

const DB_NAME = 'GarantiasDB';
const DB_VERSION = 3; // Incremented version

const GARANTIAS_STORE_NAME = 'garantias';
const PERSONS_STORE_NAME = 'persons';
const SUPPLIERS_STORE_NAME = 'suppliers';
const LOTES_STORE_NAME = 'lotes';
const LOTE_ITEMS_STORE_NAME = 'lote_items';


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
          const warrantyStore = dbInstance.createObjectStore(GARANTIAS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
          warrantyStore.createIndex('loteId', 'loteId', { unique: false });
        } else {
            const transaction = (event.target as IDBOpenDBRequest).transaction;
            if (transaction) {
                const warrantyStore = transaction.objectStore(GARANTIAS_STORE_NAME);
                if (!warrantyStore.indexNames.contains('loteId')) {
                    warrantyStore.createIndex('loteId', 'loteId', { unique: false });
                }
            }
        }
        
        if (!dbInstance.objectStoreNames.contains(PERSONS_STORE_NAME)) {
          dbInstance.createObjectStore(PERSONS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
        if (!dbInstance.objectStoreNames.contains(SUPPLIERS_STORE_NAME)) {
          dbInstance.createObjectStore(SUPPLIERS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
        if (!dbInstance.objectStoreNames.contains(LOTES_STORE_NAME)) {
            dbInstance.createObjectStore(LOTES_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
        if (!dbInstance.objectStoreNames.contains(LOTE_ITEMS_STORE_NAME)) {
            const loteItemsStore = dbInstance.createObjectStore(LOTE_ITEMS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            loteItemsStore.createIndex('loteId', 'loteId', { unique: false });
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

// --- Lote Functions ---
export const addLote = (lote: Omit<Lote, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(LOTES_STORE_NAME, 'readwrite');
      const request = store.add(lote);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const getAllLotes = (): Promise<Lote[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(LOTES_STORE_NAME, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Lote[]);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const updateLote = (lote: Lote): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(LOTES_STORE_NAME, 'readwrite');
      const request = store.put(lote);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const deleteLote = async (id: number): Promise<void> => {
  const db = await getDB();
  const transaction = db.transaction([GARANTIAS_STORE_NAME, LOTES_STORE_NAME], 'readwrite');
  const lotesStore = transaction.objectStore(LOTES_STORE_NAME);
  const warrantiesStore = transaction.objectStore(GARANTIAS_STORE_NAME);

  return new Promise((resolve, reject) => {
    // 1. Delete the lote itself
    const deleteLoteRequest = lotesStore.delete(id);

    deleteLoteRequest.onerror = () => reject(deleteLoteRequest.error);
    
    deleteLoteRequest.onsuccess = () => {
        // 2. Unlink all warranties associated with this lote
        const warrantyIndex = warrantiesStore.index('loteId');
        const getWarrantiesRequest = warrantyIndex.getAll(id);

        getWarrantiesRequest.onerror = () => reject(getWarrantiesRequest.error);

        getWarrantiesRequest.onsuccess = () => {
            const warrantiesToUpdate = getWarrantiesRequest.result;
            if (warrantiesToUpdate.length === 0) {
                resolve();
                return;
            }

            let updatedCount = 0;
            warrantiesToUpdate.forEach(warranty => {
                warranty.loteId = null; // or delete warranty.loteId;
                const updateRequest = warrantiesStore.put(warranty);
                updateRequest.onerror = () => reject(updateRequest.error);
                updateRequest.onsuccess = () => {
                    updatedCount++;
                    if (updatedCount === warrantiesToUpdate.length) {
                        resolve();
                    }
                };
            });
        };
    };

    transaction.onabort = () => reject(transaction.error);
  });
};


// --- LoteItem Functions ---
export const addLoteItem = (loteItem: Omit<LoteItem, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(LOTE_ITEMS_STORE_NAME, 'readwrite');
      const request = store.add(loteItem);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const getLoteItemsByLoteId = (loteId: number): Promise<LoteItem[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore(LOTE_ITEMS_STORE_NAME, 'readonly');
            const index = store.index('loteId');
            const request = index.getAll(loteId);
            request.onsuccess = () => resolve(request.result as LoteItem[]);
            request.onerror = () => reject(request.error);
        } catch(err) {
            reject(err);
        }
    });
};

export const deleteLoteItem = (id: number): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(LOTE_ITEMS_STORE_NAME, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};
