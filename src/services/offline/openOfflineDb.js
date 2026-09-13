/**
 * Unified IndexedDB opener for all offline stores.
 *
 * BUG-6 fix: offlineDb.js and offlineReferenceCache.js previously both opened
 * 'vyaparsathi_offline' at version 1 with separate schemas. Whichever tab opened
 * first claimed the DB; the other's onupgradeneeded never fired, leaving those
 * stores absent. Merging both schemas into one opener at version 2 triggers an
 * upgrade on existing v1 databases and creates every store in a single call.
 *
 * Stores:
 *   sales          — queued offline sales (keyPath: clientTxnId)
 *   meta           — device metadata (keyPath: key)
 *   item_variants  — cached catalogue items (keyPath: id)
 *   customers      — cached customer records (keyPath: id)
 *   gst_reference  — cached GST codes (keyPath: code)
 */

export const DB_NAME = 'vyaparsathi_offline';
export const DB_VERSION = 2;

let _dbPromise = null;

export function openOfflineDb() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available in this environment'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains('sales')) {
        const store = db.createObjectStore('sales', { keyPath: 'clientTxnId' });
        store.createIndex('by_shopId', 'shopId', { unique: false });
        store.createIndex('by_status', 'status', { unique: false });
        store.createIndex('by_userId', 'userId', { unique: false });
        store.createIndex('by_shopId_status', ['shopId', 'status'], { unique: false });
        store.createIndex('by_createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('item_variants')) {
        const store = db.createObjectStore('item_variants', { keyPath: 'id' });
        store.createIndex('by_shopId', 'shopId', { unique: false });
        store.createIndex('by_sku', 'sku', { unique: false });
      }

      if (!db.objectStoreNames.contains('customers')) {
        const store = db.createObjectStore('customers', { keyPath: 'id' });
        store.createIndex('by_shopId', 'shopId', { unique: false });
        store.createIndex('by_phone', 'phone', { unique: false });
      }

      if (!db.objectStoreNames.contains('gst_reference')) {
        db.createObjectStore('gst_reference', { keyPath: 'code' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => {
      console.warn('[OfflineDb] Database upgrade blocked — close other tabs and reload.');
    };
  });

  return _dbPromise;
}

export async function closeOfflineDb() {
  if (_dbPromise) {
    const promise = _dbPromise;
    _dbPromise = null;
    try {
      const db = await promise;
      db.close();
    } catch (_) {
      // ignore close errors on already closed/failed connections
    }
  }
}
