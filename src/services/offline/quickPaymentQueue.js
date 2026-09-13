/**
 * Standalone helpers for the QuickPayment offline localStorage queue.
 *
 * L-4 fix: these were exported directly from QuickPaymentSheet.jsx (a UI
 * component), which forced useOfflineQueueReplay to import business logic
 * from a component. Moving them here breaks that coupling.
 *
 * H-6 note: this queue uses localStorage and is separate from the main
 * IndexedDB offline-sales queue in offlineDb.js. Reconciliation between the
 * two systems is handled in useOfflineQueueReplay — once a queued item is
 * replayed via flushAll it is cleared from this store.
 */

export const OFFLINE_QUEUE_KEY = 'quick_payment_offline_queue_v1';

export function enqueueQuickPaymentOffline(payload, authUser) {
  try {
    const existing = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    existing.push({
      ...payload,
      _queuedAt: new Date().toISOString(),
      _queuedByUserId: authUser?.sub,
      _queuedByShopId: authUser?.shopId,
      _queuedByToken: authUser?.token_hash || null,
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
  } catch (_) {}
}

export function getOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); }
  catch (_) { return []; }
}

export function clearOfflineQueue() {
  try { localStorage.removeItem(OFFLINE_QUEUE_KEY); }
  catch (_) {}
}
