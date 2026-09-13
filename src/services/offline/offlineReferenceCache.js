/**
 * Offline Reference Data Cache
 *
 * Caches reference data (items, customers, GST codes) when online
 * so they're available for selection when offline.
 *
 * Storage Structure:
 *   - item_variants: keyPath: "id", indexes: by_shopId, by_sku
 *   - customers: keyPath: "id", indexes: by_shopId, by_phone
 *   - gst_reference: keyPath: "code"
 *   - meta: keyPath: "key" — stores cachedAt timestamps per shop/type
 *
 * M-2 fix: cacheItemVariants and cacheCustomers now run inside a single
 * atomic IDB transaction (delete-all + re-add). Previously two separate
 * awaited phases allowed the transaction to auto-commit between them,
 * leaving the cache empty on a crash between delete and re-add.
 *
 * M-1 addition: cachedAt metadata is tracked in the meta store so callers
 * can detect stale caches and show a warning to the user.
 */

import { openOfflineDb, closeOfflineDb } from './openOfflineDb';

const STORE_ITEMS = 'item_variants';
const STORE_CUSTOMERS = 'customers';
const STORE_GST = 'gst_reference';
const STORE_META = 'meta';

const openDb = openOfflineDb;

// Stale threshold in milliseconds (4 hours for items, 24 hours for others)
export const STALE_MS_ITEMS = 4 * 60 * 60 * 1000;
export const STALE_MS_CUSTOMERS = 24 * 60 * 60 * 1000;
export const STALE_MS_GST = 48 * 60 * 60 * 1000;

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ═══════════════════════════════════════════════════════════════
// ATOMIC REPLACE HELPER
// Deletes all records matching shopId on an index, then puts all
// newItems — in a SINGLE transaction so partial state is impossible.
// ═══════════════════════════════════════════════════════════════

function atomicReplace(db, storeName, shopIndexName, shopId, newItems) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));

    const now = new Date().toISOString();
    const deleteReq = store.index(shopIndexName).openCursor(IDBKeyRange.only(shopId));

    deleteReq.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        // All old records deleted — now add the new ones within the same transaction.
        for (const item of newItems) {
          store.put({ ...item, shopId, cachedAt: now });
        }
        // Transaction commits automatically once there are no more pending requests.
      }
    };
    deleteReq.onerror = () => reject(deleteReq.error);
  });
}

// ═══════════════════════════════════════════════════════════════
// CACHE METADATA (staleness tracking)
// ═══════════════════════════════════════════════════════════════

async function setLastCached(db, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_META, 'readwrite');
    const store = transaction.objectStore(STORE_META);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    store.put({ key, value: new Date().toISOString() });
  });
}

async function getLastCached(db, key) {
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_META, 'readonly');
    const store = transaction.objectStore(STORE_META);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => resolve(null);
  });
}

export async function getCacheAge(shopId, type) {
  try {
    const db = await openDb();
    const cachedAt = await getLastCached(db, `cache_${type}_${shopId}`);
    if (!cachedAt) return { cachedAt: null, ageMs: null, stale: true };
    const ageMs = Date.now() - new Date(cachedAt).getTime();
    const thresholds = { items: STALE_MS_ITEMS, customers: STALE_MS_CUSTOMERS, gst: STALE_MS_GST };
    return { cachedAt, ageMs, stale: ageMs > (thresholds[type] ?? STALE_MS_ITEMS) };
  } catch {
    return { cachedAt: null, ageMs: null, stale: true };
  }
}

// ═══════════════════════════════════════════════════════════════
// ITEM VARIANTS
// ═══════════════════════════════════════════════════════════════

export async function cacheItemVariants(shopId, items) {
  try {
    const db = await openDb();
    // M-2 fix: atomic replace — single transaction for delete + re-add
    await atomicReplace(db, STORE_ITEMS, 'by_shopId', shopId, items);
    await setLastCached(db, `cache_items_${shopId}`);
    console.log(`[OfflineCache] Cached ${items.length} item variants for shop ${shopId}`);
  } catch (err) {
    console.error('[OfflineCache] Error caching items:', err);
    throw err;
  }
}

export async function listItemVariantsByShop(shopId, { checkStale = false } = {}) {
  try {
    const db = await openDb();

    const results = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_ITEMS, 'readonly');
      const store = transaction.objectStore(STORE_ITEMS);
      const index = store.index('by_shopId');
      const rows = [];
      const req = index.openCursor(IDBKeyRange.only(shopId));
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { rows.push(cursor.value); cursor.continue(); }
        else resolve(rows);
      };
      req.onerror = () => reject(req.error);
    });

    if (checkStale) {
      const age = await getCacheAge(shopId, 'items');
      return { data: results, ...age };
    }
    return results;
  } catch (err) {
    console.error('[OfflineCache] Error listing items:', err);
    return checkStale ? { data: [], stale: true, cachedAt: null, ageMs: null } : [];
  }
}

export async function getItemVariant(itemId) {
  try {
    const db = await openDb();
    const transaction = db.transaction(STORE_ITEMS, 'readonly');
    const store = transaction.objectStore(STORE_ITEMS);
    return await promisify(store.get(itemId));
  } catch (err) {
    console.error('[OfflineCache] Error getting item:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════════

export async function cacheCustomers(shopId, customers) {
  try {
    const db = await openDb();
    // M-2 fix: atomic replace — single transaction for delete + re-add
    await atomicReplace(db, STORE_CUSTOMERS, 'by_shopId', shopId, customers);
    await setLastCached(db, `cache_customers_${shopId}`);
    console.log(`[OfflineCache] Cached ${customers.length} customers for shop ${shopId}`);
  } catch (err) {
    console.error('[OfflineCache] Error caching customers:', err);
    throw err;
  }
}

export async function listCustomersByShop(shopId, { checkStale = false } = {}) {
  try {
    const db = await openDb();

    const results = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CUSTOMERS, 'readonly');
      const store = transaction.objectStore(STORE_CUSTOMERS);
      const index = store.index('by_shopId');
      const rows = [];
      const req = index.openCursor(IDBKeyRange.only(shopId));
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { rows.push(cursor.value); cursor.continue(); }
        else resolve(rows);
      };
      req.onerror = () => reject(req.error);
    });

    if (checkStale) {
      const age = await getCacheAge(shopId, 'customers');
      return { data: results, ...age };
    }
    return results;
  } catch (err) {
    console.error('[OfflineCache] Error listing customers:', err);
    return checkStale ? { data: [], stale: true, cachedAt: null, ageMs: null } : [];
  }
}

export async function getCustomer(customerId) {
  try {
    const db = await openDb();
    const transaction = db.transaction(STORE_CUSTOMERS, 'readonly');
    const store = transaction.objectStore(STORE_CUSTOMERS);
    return await promisify(store.get(customerId));
  } catch (err) {
    console.error('[OfflineCache] Error getting customer:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// GST REFERENCE DATA
// ═══════════════════════════════════════════════════════════════

export async function cacheGstData(gstCodes) {
  try {
    const db = await openDb();

    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_GST, 'readwrite');
      const store = transaction.objectStore(STORE_GST);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));

      // Clear all GST codes then re-add within the same transaction
      const clearReq = store.clear();
      const now = new Date().toISOString();
      clearReq.onsuccess = () => {
        for (const code of gstCodes) {
          store.put({ ...code, cachedAt: now });
        }
      };
      clearReq.onerror = () => reject(clearReq.error);
    });

    await setLastCached(await openDb(), 'cache_gst');
    console.log(`[OfflineCache] Cached ${gstCodes.length} GST codes`);
  } catch (err) {
    console.error('[OfflineCache] Error caching GST data:', err);
    throw err;
  }
}

export async function listGstData({ checkStale = false } = {}) {
  try {
    const db = await openDb();

    const results = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_GST, 'readonly');
      const store = transaction.objectStore(STORE_GST);
      const rows = [];
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { rows.push(cursor.value); cursor.continue(); }
        else resolve(rows);
      };
      req.onerror = () => reject(req.error);
    });

    if (checkStale) {
      const age = await getCacheAge(null, 'gst');
      return { data: results, ...age };
    }
    return results;
  } catch (err) {
    console.error('[OfflineCache] Error listing GST data:', err);
    return checkStale ? { data: [], stale: true, cachedAt: null, ageMs: null } : [];
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Sync All Reference Data
// ═══════════════════════════════════════════════════════════════

export async function syncAllReferenceData(shopId, apiCallbacks) {
  console.log('[OfflineCache] Syncing reference data for shop:', shopId);
  const results = { items: false, customers: false, gst: false };

  if (apiCallbacks.fetchItems) {
    try {
      const res = await apiCallbacks.fetchItems();
      const items = Array.isArray(res?.data) ? res.data : [];
      await cacheItemVariants(shopId, items);
      results.items = true;
    } catch (err) {
      console.warn('[OfflineCache] Items sync failed (offline items unavailable):', err?.message);
    }
  }

  if (apiCallbacks.fetchCustomers) {
    try {
      const res = await apiCallbacks.fetchCustomers();
      const customers = Array.isArray(res?.data) ? res.data : [];
      await cacheCustomers(shopId, customers);
      results.customers = true;
    } catch (err) {
      console.warn('[OfflineCache] Customers sync failed (offline customers unavailable):', err?.message);
    }
  }

  if (apiCallbacks.fetchGstData) {
    try {
      const res = await apiCallbacks.fetchGstData();
      // States endpoint wraps data in ApiResponse { data: [...] }
      const raw = res?.data?.data ?? res?.data;
      const gstCodes = Array.isArray(raw) ? raw.map(s => ({ code: s.code, ...s })) : [];
      await cacheGstData(gstCodes);
      results.gst = true;
    } catch (err) {
      console.warn('[OfflineCache] GST reference sync failed (non-critical):', err?.message);
    }
  }

  console.log('[OfflineCache] Reference data sync complete:', results);
  return results;
}

export { closeOfflineDb as closeDb };
