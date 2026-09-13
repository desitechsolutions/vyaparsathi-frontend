/**
 * IndexedDB store for offline sales queue
 *
 * Schema:
 *   - sales: queued offline sales waiting to sync
 *     Key: clientTxnId (UUID, primary key)
 *     Indexes: by_shopId, by_status, by_userId, by_shopId_status, by_createdAt
 *
 *   - meta: device metadata (deviceId, lastSyncTime, etc.)
 *     Key: key (string)
 *
 * Local statuses:
 *   - DRAFT      → just saved offline, not yet attempted
 *   - SYNCING    → POST in flight
 *   - SYNCED     → server acknowledged + invoice generated
 *   - FAILED     → server rejected or network failure (retriable)
 *   - CONFLICT   → 409 from backend (manual review needed)
 *
 * Zero external dependencies — uses native IndexedDB API
 */

import { openOfflineDb, closeOfflineDb } from './openOfflineDb';

const STORE_SALES = 'sales';
const STORE_META = 'meta';

// Alias so internal callers stay unchanged.
const openDb = openOfflineDb;

function tx(db, storeName, mode) {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ═══════════════════════════════════════════════════════════════
// DEVICE METADATA
// ═══════════════════════════════════════════════════════════════

export async function getOrCreateDeviceId() {
  const db = await openDb();
  const store = tx(db, STORE_META, 'readwrite');
  const existing = await promisify(store.get('deviceId'));
  if (existing?.value) return existing.value;

  const newId =
    'VYAP-' +
    (crypto?.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

  await promisify(store.put({ key: 'deviceId', value: newId }));
  return newId;
}

export async function setMeta(key, value) {
  try {
    const db = await openDb();
    const store = tx(db, STORE_META, 'readwrite');
    await promisify(store.put({ key, value }));
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.warn('[OfflineDb] IndexedDB quota exceeded, removing oldest SYNCED record');
      // M-6 fix: delete the oldest SYNCED sale rather than calling clearSyncedOlderThan(1)
      // which passed 1 as shopId (wrong signature) instead of the actual shop.
      await deleteOldestSyncedSales();
      const db = await openDb();
      const store = tx(db, STORE_META, 'readwrite');
      await promisify(store.put({ key, value }));
    } else {
      throw err;
    }
  }
}

// Number of oldest SYNCED records to evict per quota-exceeded event.
// Deleting 1 at a time is insufficient under real storage pressure: each retry
// hits the quota again after adding 1 record, causing an infinite failure loop.
// 10 records gives enough headroom for the current operation to succeed while
// keeping the eviction visible to the user (not a silent bulk purge).
// NEVER delete DRAFT, SYNCING, FAILED, or CONFLICT records — those are unsynced
// and deleting them would silently lose sales data.
const QUOTA_EVICTION_BATCH = 10;

async function deleteOldestSyncedSales() {
  try {
    const db = await openDb();
    let deleted = 0;
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SALES, 'readwrite');
      const store = transaction.objectStore(STORE_SALES);
      transaction.oncomplete = () => resolve(deleted);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));

      const req = store.index('by_status').openCursor(IDBKeyRange.only('SYNCED'));
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor && deleted < QUOTA_EVICTION_BATCH) {
          cursor.delete();
          deleted++;
          cursor.continue();
        }
        // If cursor is null or we've hit the batch limit, the transaction commits automatically.
      };
      req.onerror = () => reject(req.error);
    });
    console.log(`[OfflineDb] Evicted ${deleted} SYNCED record(s) to free storage space`);
  } catch (err) {
    console.error('[OfflineDb] Failed to evict synced sales during quota recovery:', err);
  }
}

export async function getMeta(key) {
  try {
    const db = await openDb();
    const store = tx(db, STORE_META, 'readonly');
    const row = await promisify(store.get(key));
    return row?.value ?? null;
  } catch (err) {
    console.error('[OfflineDb] Error reading meta:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// SALES QUEUE
// ═══════════════════════════════════════════════════════════════

export async function saveOfflineSale(record) {
  if (!record.clientTxnId) {
    throw new Error('clientTxnId is required for offline sale');
  }
  const db = await openDb();
  const store = tx(db, STORE_SALES, 'readwrite');
  const normalized = {
    ...record,
    status: record.status || 'DRAFT',
    retryCount: record.retryCount ?? 0,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await promisify(store.put(normalized));
  return normalized;
}

export async function getOfflineSale(clientTxnId) {
  const db = await openDb();
  const store = tx(db, STORE_SALES, 'readonly');
  return promisify(store.get(clientTxnId));
}

export async function updateOfflineSale(clientTxnId, patch) {
  const db = await openDb();
  const store = tx(db, STORE_SALES, 'readwrite');
  const existing = await promisify(store.get(clientTxnId));
  if (!existing) return null;
  const updated = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await promisify(store.put(updated));
  return updated;
}

/**
 * Reset a FAILED sale back to DRAFT with retryCount=0 so it can be retried.
 * Used when retries are exhausted (e.g. due to expired auth) and the user
 * has since re-authenticated and wants to manually trigger a retry.
 */
export async function resetToRetryable(clientTxnId) {
  return updateOfflineSale(clientTxnId, {
    status: 'DRAFT',
    retryCount: 0,
    errorMessage: null,
    lastErrorAt: null,
  });
}

export async function deleteOfflineSale(clientTxnId) {
  const db = await openDb();
  const store = tx(db, STORE_SALES, 'readwrite');
  await promisify(store.delete(clientTxnId));
}

export async function listSalesByShop(shopId, status = null) {
  const db = await openDb();
  const store = tx(db, STORE_SALES, 'readonly');

  return new Promise((resolve, reject) => {
    const results = [];
    const indexName = status ? 'by_shopId_status' : 'by_shopId';
    const range = status
      ? IDBKeyRange.only([shopId, status])
      : IDBKeyRange.only(shopId);

    const req = store.index(indexName).openCursor(range);
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        results.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function listSalesByUser(userId, status = null) {
  const db = await openDb();
  const store = tx(db, STORE_SALES, 'readonly');

  return new Promise((resolve, reject) => {
    const results = [];
    const range = IDBKeyRange.only(userId);
    const req = store.index('by_userId').openCursor(range);

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const sale = cursor.value;
        if (!status || sale.status === status) {
          results.push(sale);
        }
        cursor.continue();
      } else {
        results.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function countByStatus(shopId, status) {
  const db = await openDb();
  const store = tx(db, STORE_SALES, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.index('by_shopId_status').count(IDBKeyRange.only([shopId, status]));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function countPending(shopId) {
  if (!shopId) return 0;
  const [draft, syncing, failed] = await Promise.all([
    countByStatus(shopId, 'DRAFT'),
    countByStatus(shopId, 'SYNCING'),
    countByStatus(shopId, 'FAILED'),
  ]);
  return draft + syncing + failed;
}

export async function clearSyncedOlderThan(shopId, days = 7) {
  const db = await openDb();
  const store = tx(db, STORE_SALES, 'readwrite');
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return new Promise((resolve, reject) => {
    let deleted = 0;
    const range = IDBKeyRange.only(shopId);
    const req = store.index('by_shopId').openCursor(range);

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const sale = cursor.value;
        if (sale.status === 'SYNCED' && sale.syncedAt && sale.syncedAt < cutoff) {
          cursor.delete();
          deleted++;
        }
        cursor.continue();
      } else {
        resolve(deleted);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export { closeOfflineDb as closeDb };
