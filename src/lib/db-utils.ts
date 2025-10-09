
'use client';

import { initDB } from './db';

const DB_NAME = 'GarantiasDB';
const USERS_STORE_NAME = 'users';

// This function is specifically for DEVELOPMENT to reset roles.
// It should not be used in production without caution.
export const clearUsers = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            await initDB(); // Make sure DB is open
            const request = indexedDB.open(DB_NAME);
            
            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const transaction = db.transaction(USERS_STORE_NAME, 'readwrite');
                const store = transaction.objectStore(USERS_STORE_NAME);
                const clearRequest = store.clear();

                clearRequest.onsuccess = () => resolve();
                clearRequest.onerror = () => reject(clearRequest.error);

                transaction.onabort = () => reject(transaction.error);
            };

            request.onerror = (event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };

        } catch (err) {
            reject(err);
        }
    });
};

export const countUsers = (): Promise<number> => {
     return new Promise(async (resolve, reject) => {
        try {
            await initDB();
            const request = indexedDB.open(DB_NAME);
            
            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // If the store doesn't exist, count is 0
                if (!db.objectStoreNames.contains(USERS_STORE_NAME)) {
                    resolve(0);
                    return;
                }

                const transaction = db.transaction(USERS_STORE_NAME, 'readonly');
                const store = transaction.objectStore(USERS_STORE_NAME);
                const countRequest = store.count();

                countRequest.onsuccess = () => resolve(countRequest.result);
                countRequest.onerror = () => reject(countRequest.error);
                
                transaction.onabort = () => reject(transaction.error);
            };
            
            request.onerror = (event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };

        } catch (err) {
            reject(err);
        }
    });
}
