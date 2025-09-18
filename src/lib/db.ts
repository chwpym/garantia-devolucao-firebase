'use client';

import type { Warranty, Person, Supplier, Lote, LoteItem, CompanyData, Devolucao, ItemDevolucao, Product } from './types';

const DB_NAME = 'GarantiasDB';
const DB_VERSION = 6; // Incremented version

const GARANTIAS_STORE_NAME = 'garantias';
const PERSONS_STORE_NAME = 'persons';
const SUPPLIERS_STORE_NAME = 'suppliers';
const LOTES_STORE_NAME = 'lotes';
const LOTE_ITEMS_STORE_NAME = 'lote_items';
const COMPANY_DATA_STORE_NAME = 'company_data';
const DEVOLUCOES_STORE_NAME = 'devolucoes';
const ITENS_DEVOLUCAO_STORE_NAME = 'itens_devolucao';
const PRODUCTS_STORE_NAME = 'products';


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
        if (!dbInstance.objectStoreNames.contains(PRODUCTS_STORE_NAME)) {
            const productStore = dbInstance.createObjectStore(PRODUCTS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            productStore.createIndex('codigo', 'codigo', { unique: true });
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

// Generic clear function
const clearStore = (storeName: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(storeName, 'readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
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

export const getWarrantyById = (id: number): Promise<Warranty | undefined> => {
  return new Promise(async (resolve, reject) => {
    if (typeof id !== 'number' || id <= 0) {
      // Return undefined directly if the ID is not valid, preventing the DB error
      return resolve(undefined);
    }
    try {
      const store = await getStore(GARANTIAS_STORE_NAME, 'readonly');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result as Warranty | undefined);
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

export const clearWarranties = (): Promise<void> => clearStore(GARANTIAS_STORE_NAME);


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

export const clearPersons = (): Promise<void> => clearStore(PERSONS_STORE_NAME);


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

export const clearSuppliers = (): Promise<void> => clearStore(SUPPLIERS_STORE_NAME);

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

export const clearLotes = (): Promise<void> => clearStore(LOTES_STORE_NAME);


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

export const clearCompanyData = (): Promise<void> => clearStore(COMPANY_DATA_STORE_NAME);


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

export const updateDevolucao = async (devolucao: Devolucao, itens: (Omit<ItemDevolucao, 'devolucaoId'>)[]): Promise<void> => {
    const db = await getDB();
    const transaction = db.transaction([DEVOLUCOES_STORE_NAME, ITENS_DEVOLUCAO_STORE_NAME], 'readwrite');
    const devolucoesStore = transaction.objectStore(DEVOLUCOES_STORE_NAME);
    const itensStore = transaction.objectStore(ITENS_DEVOLUCAO_STORE_NAME);

    return new Promise((resolve, reject) => {
        // 1. Update the main Devolucao object
        const devRequest = devolucoesStore.put(devolucao);
        devRequest.onerror = () => reject(devRequest.error);

        devRequest.onsuccess = () => {
            const devolucaoId = devolucao.id!;
            // 2. Clear existing items for this devolucao
            const itemIndex = itensStore.index('devolucaoId');
            const clearRequest = itemIndex.openCursor(IDBKeyRange.only(devolucaoId));
            
            clearRequest.onerror = () => reject(clearRequest.error);
            clearRequest.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    // 3. Add the new/updated items
                    if (itens.length === 0) {
                        resolve();
                        return;
                    }
                    let itemsAdded = 0;
                    itens.forEach(item => {
                         const itemToAdd: Omit<ItemDevolucao, 'id'> = {
                            ...item,
                            devolucaoId,
                        };
                        const itemRequest = itensStore.add(itemToAdd);
                        itemRequest.onerror = () => reject(itemRequest.error);
                        itemRequest.onsuccess = () => {
                            itemsAdded++;
                            if (itemsAdded === itens.length) {
                                resolve();
                            }
                        };
                    });
                }
            }
        };
        transaction.onabort = () => reject(transaction.error);
    });
};


export const getAllDevolucoes = async (): Promise<(Devolucao & { itens: ItemDevolucao[] })[]> => {
    const db = await getDB();
    const transaction = db.transaction([DEVOLUCOES_STORE_NAME, ITENS_DEVOLUCAO_STORE_NAME], 'readonly');
    const devolucoesStore = transaction.objectStore(DEVOLUCOES_STORE_NAME);
    const itensStore = transaction.objectStore(ITENS_DEVOLUCAO_STORE_NAME);
    const itensIndex = itensStore.index('devolucaoId');

    return new Promise((resolve, reject) => {
        const devolucoesRequest = devolucoesStore.getAll();
        
        devolucoesRequest.onerror = () => reject(devolucoesRequest.error);

        devolucoesRequest.onsuccess = () => {
            const devolucoes = devolucoesRequest.result as Devolucao[];
            const result: (Devolucao & { itens: ItemDevolucao[] })[] = [];
            let processedCount = 0;

            if (devolucoes.length === 0) {
                resolve([]);
                return;
            }

            devolucoes.forEach(devolucao => {
                const itensRequest = itensIndex.getAll(devolucao.id);
                itensRequest.onerror = () => reject(itensRequest.error);
                itensRequest.onsuccess = () => {
                    result.push({ ...devolucao, itens: itensRequest.result });
                    processedCount++;
                    if (processedCount === devolucoes.length) {
                        resolve(result);
                    }
                };
            });
        };
    });
};

export const getDevolucaoById = async (id: number): Promise<(Devolucao & { itens: ItemDevolucao[] }) | null> => {
     const db = await getDB();
    const transaction = db.transaction([DEVOLUCOES_STORE_NAME, ITENS_DEVOLUCAO_STORE_NAME], 'readonly');
    const devolucoesStore = transaction.objectStore(DEVOLUCOES_STORE_NAME);
    const itensStore = transaction.objectStore(ITENS_DEVOLUCAO_STORE_NAME);
    const itensIndex = itensStore.index('devolucaoId');

    return new Promise((resolve, reject) => {
        const devRequest = devolucoesStore.get(id);
        devRequest.onerror = () => reject(devRequest.error);
        devRequest.onsuccess = () => {
            const devolucao = devRequest.result as Devolucao;
            if (!devolucao) {
                resolve(null);
                return;
            }

            const itensRequest = itensIndex.getAll(id);
            itensRequest.onerror = () => reject(itensRequest.error);
            itensRequest.onsuccess = () => {
                resolve({ ...devolucao, itens: itensRequest.result });
            };
        };
    });
};


export const deleteDevolucao = async (id: number): Promise<void> => {
    const db = await getDB();
    const transaction = db.transaction([DEVOLUCOES_STORE_NAME, ITENS_DEVOLUCAO_STORE_NAME], 'readwrite');
    const devolucoesStore = transaction.objectStore(DEVOLUCOES_STORE_NAME);
    const itensStore = transaction.objectStore(ITENS_DEVOLUCAO_STORE_NAME);

    return new Promise((resolve, reject) => {
        // 1. Delete the main Devolucao object
        const devRequest = devolucoesStore.delete(id);
        devRequest.onerror = () => reject(devRequest.error);

        devRequest.onsuccess = () => {
            // 2. Delete associated items
            const itemIndex = itensStore.index('devolucaoId');
            const clearRequest = itemIndex.openCursor(IDBKeyRange.only(id));
            
            clearRequest.onerror = () => reject(clearRequest.error);
            clearRequest.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    // When all items are deleted, resolve
                    resolve();
                }
            };
        };

        transaction.onabort = () => reject(transaction.error);
    });
};

export const clearDevolucoes = async (): Promise<void> => {
    const db = await getDB();
    const transaction = db.transaction([DEVOLUCOES_STORE_NAME, ITENS_DEVOLUCAO_STORE_NAME], 'readwrite');
    const devolucoesStore = transaction.objectStore(DEVOLUCOES_STORE_NAME);
    const itensStore = transaction.objectStore(ITENS_DEVOLUCAO_STORE_NAME);

    return new Promise((resolve, reject) => {
        const req1 = devolucoesStore.clear();
        let success1 = false;
        req1.onerror = () => reject(req1.error);
        req1.onsuccess = () => {
            success1 = true;
            if (success2) resolve();
        };

        const req2 = itensStore.clear();
        let success2 = false;
        req2.onerror = () => reject(req2.error);
        req2.onsuccess = () => {
            success2 = true;
            if (success1) resolve();
        };

        transaction.onabort = () => reject(transaction.error);
    });
};


// --- Product Functions ---
export const addProduct = (product: Omit<Product, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(PRODUCTS_STORE_NAME, 'readwrite');
      const request = store.add(product);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const getAllProducts = (): Promise<Product[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(PRODUCTS_STORE_NAME, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Product[]);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const getProductByCode = (codigo: string): Promise<Product | undefined> => {
    return new Promise(async (resolve, reject) => {
        if (!codigo) {
            return resolve(undefined);
        }
        try {
            const store = await getStore(PRODUCTS_STORE_NAME, 'readonly');
            const index = store.index('codigo');
            const request = index.get(codigo);
            request.onsuccess = () => resolve(request.result as Product | undefined);
            request.onerror = () => reject(request.error);
        } catch(err) {
            reject(err);
        }
    });
};

export const updateProduct = (product: Product): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(PRODUCTS_STORE_NAME, 'readwrite');
      const request = store.put(product);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const deleteProduct = (id: number): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore(PRODUCTS_STORE_NAME, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

export const clearProducts = (): Promise<void> => clearStore(PRODUCTS_STORE_NAME);