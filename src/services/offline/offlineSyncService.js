/**
 * Offline Sales Sync Service
 *
 * Orchestrates pushing locally-queued sales to the backend.
 *
 * Lock strategy:
 *   - A lock prevents concurrent sync runs.
 *   - Lock auto-releases after 60 seconds (handles stuck-lock scenarios).
 *
 * Backend endpoints:
 *   POST /api/sales/offline-queue      → enqueue sale
 *   POST /api/sales/offline-process    → trigger processor
 *   GET  /api/sales/offline/{clientTxnId}  → check status
 */

import API from '../api';
import {
  listSalesByShop,
  listSalesByUser,
  updateOfflineSale,
  countPending,
  getOrCreateDeviceId,
  clearSyncedOlderThan,
  saveOfflineSale,
} from './offlineDb';

const SYNC_LOCK_TIMEOUT_MS = 60_000; // auto-release after 60s

// M-4: Use crypto.randomUUID() as a stable per-tab identity so the holder of an
// unexpired lock can verify it was written by THIS tab before extending/releasing it.
const TAB_ID = (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function acquireLock(shopId) {
  const lockKey = `offline_sync_lock_${shopId}`;
  try {
    const raw = localStorage.getItem(lockKey);
    if (raw) {
      const { timestamp, tabId } = JSON.parse(raw);
      const lockAge = Date.now() - timestamp;
      // A lock from THIS tab can always be overwritten (previous run finished without cleanup).
      if (lockAge < SYNC_LOCK_TIMEOUT_MS && tabId !== TAB_ID) {
        return false; // Another tab holds a live lock.
      }
      localStorage.removeItem(lockKey);
    }
    localStorage.setItem(lockKey, JSON.stringify({ timestamp: Date.now(), tabId: TAB_ID }));
    return true;
  } catch (_) {
    // localStorage unavailable (private browsing strict mode, etc.) — allow sync without lock.
    return true;
  }
}

function releaseLock(shopId) {
  const lockKey = `offline_sync_lock_${shopId}`;
  localStorage.removeItem(lockKey);
}

/**
 * Push a single offline sale to the backend queue.
 * Updates local IndexedDB status transitions:
 *   DRAFT → SYNCING → SYNCED | FAILED | CONFLICT
 */
async function pushOne(record) {
  const { clientTxnId, shopId } = record;

  try {
    await updateOfflineSale(clientTxnId, { status: 'SYNCING' });

    const payload = {
      clientTxnId,
      deviceId: record.deviceId,
      customerId: record.customerId,
      customerName: record.customerName,
      items: record.items,
      totalAmount: record.totalAmount,
      discount: record.discount,
      isGstRequired: record.isGstRequired,
      paymentMethods: record.paymentMethods,
      deliveryRequired: record.deliveryRequired,
      deliveryAddress: record.deliveryAddress,
      deliveryCharge: record.deliveryCharge,
      deliveryPaidBy: record.deliveryPaidBy,
      deliveryNotes: record.deliveryNotes,
      saleNotes: record.saleNotes,
      placeOfSupply: record.placeOfSupply,
      supplyType: record.supplyType,
      reverseCharge: record.reverseCharge,
      billToAddress: record.billToAddress,
      shipToAddress: record.shipToAddress,
      consigneeAddress: record.consigneeAddress,
    };

    const res = await API.post('/api/sales/offline-queue', payload, {
      params: { shopId },
      timeout: 30000,
      suppressErrorToast: true, // Don't show toast for individual failures
    });

    await updateOfflineSale(clientTxnId, {
      status: 'SYNCED',
      serverId: res.data?.saleId ?? null,
      invoiceNumber: res.data?.invoiceNumber ?? null,
      invoiceSignedUrl: res.data?.invoiceSignedUrl ?? null,
      syncedAt: new Date().toISOString(),
      errorMessage: null,
    });

    return { ok: true, clientTxnId, response: res.data };
  } catch (err) {
    const httpStatus = err?.response?.status;

    // ★ AUTH CIRCUIT BREAKER ★
    // 401/403 means the JWT is expired or user is logged out.
    // Don't mark the sale as FAILED (it hasn't been tried successfully);
    // restore it to DRAFT so it can be retried after re-auth, then
    // throw a tagged error so flushAll() stops processing immediately.
    if (httpStatus === 401 || httpStatus === 403) {
      await updateOfflineSale(clientTxnId, { status: 'DRAFT' });
      const authErr = new Error('AUTH_FAILURE');
      authErr.isAuthError = true;
      authErr.httpStatus = httpStatus;
      throw authErr;
    }

    const serverMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Unknown sync error';

    let nextStatus = 'FAILED';
    if (httpStatus === 409) nextStatus = 'CONFLICT';

    await updateOfflineSale(clientTxnId, {
      status: nextStatus,
      retryCount: (record.retryCount ?? 0) + 1,
      errorMessage: String(serverMsg).slice(0, 500),
      lastErrorAt: new Date().toISOString(),
    });

    return { ok: false, clientTxnId, error: serverMsg, status: nextStatus };
  }
}

/**
 * Flush all DRAFT / FAILED sales for the given shop.
 * Uses localStorage-based lock to prevent concurrent syncs across tabs.
 */
export async function flushAll(shopId, { maxRetries = 3 } = {}) {
  if (!shopId) throw new Error('shopId is required');

  // ★ Acquire lock (persistent across tabs/reloads)
  if (!acquireLock(shopId)) {
    return { skipped: true, reason: 'Sync already in progress' };
  }

  try {
    // ★ HIGH-7: Recover SYNCING records left by a previous browser crash.
    // Without this, a record stuck in SYNCING is never retried since flushAll
    // only queries DRAFT and FAILED.
    const stuckSyncing = await listSalesByShop(shopId, 'SYNCING');
    if (stuckSyncing.length > 0) {
      console.warn(`[OfflineSalesSync] Recovering ${stuckSyncing.length} stuck SYNCING record(s) → DRAFT`);
      await Promise.all(
        stuckSyncing.map((s) => updateOfflineSale(s.clientTxnId, { status: 'DRAFT', retryCount: (s.retryCount ?? 0) + 1 }))
      );
    }

    const [drafts, failed] = await Promise.all([
      listSalesByShop(shopId, 'DRAFT'),
      listSalesByShop(shopId, 'FAILED'),
    ]);

    const retriable = [
      ...drafts,
      ...failed.filter((r) => (r.retryCount ?? 0) < maxRetries),
    ];

    if (retriable.length === 0) {
      // Clean up old synced records
      await clearSyncedOlderThan(shopId, 7);
      return { attempted: 0, synced: 0, failed: 0, results: [] };
    }

    console.log(`[OfflineSalesSync] Flushing ${retriable.length} sale(s)...`);

    const results = [];
    let authErrorOccurred = false;

    // OFF-4 fix: catch AUTH_FAILURE inside the loop so we:
    //   1. Stop processing further records immediately (no point hammering the backend).
    //   2. Still run clearSyncedOlderThan cleanup (previously skipped on the throw path).
    //   3. Re-throw the tagged error AFTER cleanup so syncNow() can set authExpired.
    for (const record of retriable) {
      try {
        const result = await pushOne(record);
        results.push(result);
      } catch (err) {
        if (err.isAuthError) {
          authErrorOccurred = true;
          break; // stop processing; cleanup runs below
        }
        throw err; // unexpected — re-throw to outer catch
      }
    }

    const synced = results.filter((r) => r.ok).length;
    const failedCount = results.filter((r) => !r.ok).length;

    if (!authErrorOccurred) {
      console.log(`[OfflineSalesSync] Flush complete: synced=${synced} failed=${failedCount}`);
    }

    // Always run cleanup — even on auth errors, old SYNCED records should be pruned.
    await clearSyncedOlderThan(shopId, 7);

    if (authErrorOccurred) {
      // Re-throw so syncNow() in OfflineSalesContext can set authExpired=true.
      const authErr = new Error('AUTH_FAILURE');
      authErr.isAuthError = true;
      throw authErr;
    }

    return {
      attempted: results.length,
      synced,
      failed: failedCount,
      results,
    };
  } finally {
    releaseLock(shopId);
  }
}

/**
 * Force-clear any stuck lock. Useful from devtools or admin UI.
 */
export function forceReleaseLock(shopId) {
  if (!shopId) {
    // Clear all locks if no shopId specified
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('offline_sync_lock_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('[OfflineSalesSync] All locks force-released');
  } else {
    releaseLock(shopId);
    console.log(`[OfflineSalesSync] Lock force-released for shop ${shopId}`);
  }
}

/**
 * Generate a unique idempotency key for an offline sale.
 */
export function generateClientTxnId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Generate a temporary offline sale number shown on the receipt.
 * Format: DRAFT-<shopId>-<yyyyMMddHHmmssSSS>-<rand4>
 * Millisecond + random suffix prevents same-second collisions (M-5).
 */
export function generateOfflineSaleNo(shopId) {
  const now = new Date();
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const stamp =
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds()) +
    pad(now.getMilliseconds(), 3);
  const rand = pad(Math.floor(Math.random() * 10000), 4);
  return `DRAFT-${shopId}-${stamp}-${rand}`;
}

/**
 * Get the status of a specific offline sale
 */
export async function getSaleStatus(clientTxnId) {
  const res = await API.get(`/api/sales/offline-queue/${clientTxnId}`, {
    suppressErrorToast: true,
  });
  return res.data;
}

/**
 * Check if there are pending sales for the given shop
 */
export async function checkPendingCount(shopId) {
  return countPending(shopId);
}

// Re-exports for convenience
export { countPending, getOrCreateDeviceId };
