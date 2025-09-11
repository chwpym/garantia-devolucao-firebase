'use client';

import type { Warranty, Person, Supplier, Lote, LoteItem, CompanyData, Devolucao, ItemDevolucao } from './types';

const DB_NAME = 'GarantiasDB';
const DB_VERSION = 5; // Incremented version

const GARANTIAS_STORE_NAME = 'garantias';
const PERSONS_STORE_NAME = 'persons';
const SUPPLIERS_STORE_NAME = 'suppliers';
const LOTES_STORE_NAME = 'lotes';
const LOTE_ITEMS_STORE_NAME = 'lote_items';
const COMPANY_DATA_STORE_NAME = 'company_data';
const DEVOLUCOES_STORE_NAME = 'devolucoes';
const ITENS_DEVOLUCAO_STORE_NAME = 'itens_devolucao';


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
        if (!dbInstance.objectStoreNames.contains(COMPANY_DATA_STORE_NAME)) {
          dbInstance.createObjectStore(COMPANY_DATA_STORE_NAME, { keyPath: 'id' });
        }
        if (!dbInstance.objectStoreNames.contains(DEVOLUCOES_STORE_NAME)) {
            dbInstance.createObjectStore(DEVOLUCOES_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
        if (!dbInstance.objectStoreNames.contains(ITENS_DEVOLUCAO_STORE_NAME)) {
            const itensDevolucaoStore = dbInstance.createObjectStore(ITENS_DEVOLUCAO_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            itensDevolucaoStore.createIndex('devolucaoId', 'devolucaoId', { unique: false });
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


// --- Company Data Functions ---

export const getCompanyData = (): Promise<CompanyData | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore(COMPANY_DATA_STORE_NAME, 'readonly');
            // We use a fixed ID of 1 for the single company record
            const request = store.get(1);
            request.onsuccess = () => resolve(request.result as CompanyData || null);
            request.onerror = () => reject(request.error);
        } catch (err) {
            reject(err);
        }
    });
};

export const updateCompanyData = (companyData: Omit<CompanyData, 'id'>): Promise<number> => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore(COMPANY_DATA_STORE_NAME, 'readwrite');
            // We use a fixed ID of 1 to always update the same record
            const request = store.put({ ...companyData, id: 1 });
            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(request.error);
        } catch (err) {
            reject(err);
        }
    });
};


// --- Devolução Functions ---

export const addDevolucao = async (devolucao: Omit<Devolucao, 'id'>, itens: Omit<ItemDevolucao, 'id' | 'devolucaoId'>[]): Promise<number> => {
  const db = await getDB();
  const transaction = db.transaction([DEVOLUCOES_STORE_NAME, ITENS_DEVOLUCAO_STORE_NAME], 'readwrite');
  const devolucoesStore = transaction.objectStore(DEVOLUCOES_STORE_NAME);
  const itensStore = transaction.objectStore(ITENS_DEVOLUCAO_STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = devolucoesStore.add(devolucao);
    
    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const devolucaoId = request.result as number;
      let itemsAdded = 0;

      if (itens.length === 0) {
        resolve(devolucaoId);
        return;
      }

      itens.forEach(item => {
        const itemRequest = itensStore.add({ ...item, devolucaoId });
        itemRequest.onerror = () => reject(itemRequest.error);
        itemRequest.onsuccess = () => {
          itemsAdded++;
          if (itemsAdded === itens.length) {
            resolve(devolucaoId);
          }
        };
      });
    };
    
    transaction.onabort = () => reject(transaction.error);
  });
};
