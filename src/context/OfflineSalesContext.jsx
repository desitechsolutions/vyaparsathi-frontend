/**
 * OfflineSalesContext
 *
 * CRITICAL-1 fix: Previously useOfflineSales() was called independently in
 * Sales.jsx, ReviewPaymentPage.jsx, and StatusIndicators.jsx, creating:
 *   - 3 independent isOffline states (could disagree)
 *   - 3x health-check probes every 30s (6 fetches/min)
 *   - 3x pending-count polls every 30s
 *
 * This context holds ONE shared state tree. All components subscribe via
 * useOfflineSalesContext(). The Provider is mounted once near the app root.
 *
 * HIGH-10 fix: The connectivity probe now separately tracks authExpired so
 * a 401/403 from the health endpoint does NOT set isOffline=true (the backend
 * IS reachable), but DOES suppress auto-sync until re-auth.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useShop } from './ShopContext';
import { useAuthContext } from './AuthContext';
import {
  saveOfflineSale,
  listSalesByShop,
  countPending,
  getOrCreateDeviceId,
  resetToRetryable,
  getShopFingerprint,
  setShopFingerprint,
  clearAllSalesForShop,
  clearRefCacheStores,
  clearSyncedOlderThan,
} from '../services/offline/offlineDb';
import {
  flushAll,
  generateClientTxnId,
  generateOfflineSaleNo,
  checkPendingCount,
} from '../services/offline/offlineSyncService';
import {
  listItemVariantsByShop,
  listCustomersByShop,
  syncAllReferenceData,
} from '../services/offline/offlineReferenceCache';
import {
  enqueueOfflineSale,
  triggerOfflineProcessing,
  fetchItemVariants,
  fetchCustomers,
  fetchGstReferenceData,
} from '../services/api';
import { getValidToken } from '../utils/authStorage';

// ─────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────

const OfflineSalesContext = createContext(null);

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

export function OfflineSalesProvider({ children }) {
  const { shop } = useShop();
  const { user: authUser } = useAuthContext();

  // ── State ────────────────────────────────────────────────────────
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [authExpired, setAuthExpired] = useState(false); // HIGH-10
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  const isSyncingRef = useRef(false);
  const syncNowRef = useRef(null);
  // Track shopId across renders so the logout cleanup knows which shop to clear.
  const lastShopIdRef = useRef(null);

  // ── Logout cleanup ──────────────────────────────────────────────
  // On explicit logout, wipe the reference cache (item_variants, customers,
  // gst_reference) and any already-synced sales. DRAFT/FAILED are kept —
  // silently destroying unsynced sales data is never acceptable.
  const prevAuthUserRef = useRef(authUser);
  useEffect(() => {
    const wasLoggedIn = !!prevAuthUserRef.current;
    const isLoggedOut = !authUser;
    if (wasLoggedIn && isLoggedOut && lastShopIdRef.current) {
      const shopIdToClean = lastShopIdRef.current;
      clearRefCacheStores().catch(() => {});
      clearSyncedOlderThan(shopIdToClean, 0).catch(() => {});
    }
    prevAuthUserRef.current = authUser;
    if (shop?.id) lastShopIdRef.current = shop.id;
  }, [authUser, shop?.id]);

  // ── Device ID ───────────────────────────────────────────────────
  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId).catch((err) => {
      console.error('[OfflineCtx] Failed to get device ID:', err);
    });
  }, []);

  // ── Shop fingerprint validation ─────────────────────────────────
  // Auto-increment shopIds restart from 1 after a backend DB reset.
  // A fresh signup can get the same shopId as a previous user whose
  // IDB records were never cleared, causing phantom "pending" counts.
  // We detect this by storing { shopId, shopCode } and comparing on
  // every session start. shopCode is a unique slug set by the user
  // during onboarding — a new shop will almost never reuse it.
  useEffect(() => {
    if (!shop?.id || !shop?.code) return;
    (async () => {
      try {
        const stored = await getShopFingerprint();
        if (stored && stored.shopId === shop.id && stored.shopCode !== shop.code) {
          // Same numeric ID, different slug → DB was reset and a new shop
          // claimed this ID. Stale records can never sync to the new backend.
          console.warn(
            '[OfflineCtx] shopId collision detected (stored code "%s" ≠ current "%s"). Purging stale IDB records for shopId=%s.',
            stored.shopCode, shop.code, shop.id
          );
          await clearAllSalesForShop(shop.id);
          await clearRefCacheStores();
        }
        await setShopFingerprint(shop.id, shop.code);
      } catch (err) {
        console.error('[OfflineCtx] Fingerprint validation error:', err);
      }
    })();
  }, [shop?.id, shop?.code]);

  // ── Pending count ───────────────────────────────────────────────
  const updatePendingCount = useCallback(async () => {
    if (!shop?.id) return;
    try {
      const count = await checkPendingCount(shop.id);
      setPendingCount(count);
    } catch (err) {
      console.error('[OfflineCtx] Failed to check pending count:', err);
    }
  }, [shop?.id]);

  // Single 30s interval (not 3 separate ones)
  useEffect(() => {
    updatePendingCount();
    const id = setInterval(updatePendingCount, 30_000);
    return () => clearInterval(id);
  }, [updatePendingCount]);

  // ── Connectivity probe ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        if (mounted) setIsOffline(true);
        return;
      }
      try {
        const token = getValidToken();
        const headers = { 'Cache-Control': 'no-cache' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/sales/offline-queue/health', {
          method: 'GET',
          headers,
        });

        if (!mounted) return;

        // HIGH-10: 401/403 = reachable but auth expired — NOT the same as offline
        if (res.status === 401 || res.status === 403) {
          setAuthExpired(true);
          setIsOffline(false); // backend IS up
          return;
        }

        setAuthExpired(false);
        setIsOffline(res.status >= 500);
      } catch {
        if (mounted) setIsOffline(true);
      }
    };

    const handleOnline = () => {
      checkConnectivity().then(() => {
        if (!authExpired) syncNowRef.current?.();
      });
    };
    const handleOffline = () => {
      if (mounted) setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkConnectivity();
    const probeId = setInterval(checkConnectivity, 30_000);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(probeId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── queueSale ───────────────────────────────────────────────────
  /**
   * CRITICAL-3 fix: Only fall back to IndexedDB on genuine network errors
   * (no HTTP response). 4xx errors surface to the caller so the user sees
   * the real problem instead of silently queueing an unsyncable record.
   */
  const queueSale = useCallback(
    async (saleData) => {
      if (!shop?.id) throw new Error('No shop context');
      if (!authUser?.sub) throw new Error('Not authenticated');

      try {
        const response = await enqueueOfflineSale(saleData);
        setIsOffline(false);
        return response.data;
      } catch (apiError) {
        const httpStatus = apiError?.response?.status;

        // CRITICAL-3: only fall back to IndexedDB on genuine network failures.
        // 4xx = server rejected the request → will never succeed on retry.
        // Exception: 408 (request timeout) and 429 (rate limit) are retriable.
        const isNetworkError = !httpStatus; // no response at all
        const isRetriable4xx = httpStatus === 408 || httpStatus === 429;
        if (httpStatus && httpStatus >= 400 && httpStatus < 500 && !isRetriable4xx) {
          throw apiError; // surface to caller
        }
        if (!isNetworkError && !isRetriable4xx) {
          throw apiError; // surface 5xx etc too (backend is up but broken)
        }

        console.warn('[OfflineCtx] Backend enqueue failed, using IndexedDB:', apiError.message);

        const clientTxnId = saleData.clientTxnId || generateClientTxnId();
        const offlineSaleNo = generateOfflineSaleNo(shop.id);

        const offlineSale = {
          clientTxnId,
          offlineSaleNo,
          shopId: shop.id,
          userId: authUser.sub,
          deviceId: deviceId || saleData.deviceId || 'unknown',
          status: 'DRAFT',
          retryCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customerId: saleData.customerId,
          customerName: saleData.customerName,
          items: saleData.items,
          totalAmount: saleData.totalAmount,
          discount: saleData.discount,
          isGstRequired: saleData.isGstRequired,
          paymentMethods: saleData.paymentMethods,
          deliveryRequired: saleData.deliveryRequired,
          deliveryAddress: saleData.deliveryAddress,
          deliveryCharge: saleData.deliveryCharge,
          deliveryPaidBy: saleData.deliveryPaidBy,
          deliveryNotes: saleData.deliveryNotes,
          saleNotes: saleData.saleNotes,
          placeOfSupply: saleData.placeOfSupply,
          supplyType: saleData.supplyType,
          reverseCharge: saleData.reverseCharge,
          billToAddress: saleData.billToAddress,
          shipToAddress: saleData.shipToAddress,
          consigneeAddress: saleData.consigneeAddress,
        };

        await saveOfflineSale(offlineSale);
        await updatePendingCount();

        return { clientTxnId, offlineSaleNo, status: 'DRAFT' };
      }
    },
    [shop?.id, authUser?.sub, deviceId, updatePendingCount],
  );

  // ── syncNow ─────────────────────────────────────────────────────
  const syncNow = useCallback(async () => {
    if (!shop?.id || isSyncingRef.current || authExpired) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      try {
        const result = await flushAll(shop.id);
        setLastSyncResult(result);
        if (result?.synced > 0 || result?.attempted > 0) {
          setIsOffline(false);
        }
      } catch (dbErr) {
        if (dbErr.isAuthError) {
          console.warn('[OfflineCtx] Auth failure during flush — pausing sync');
          setAuthExpired(true);
          return;
        }
        console.warn('[OfflineCtx] IndexedDB sync failed:', dbErr.message);
      }

      try {
        await triggerOfflineProcessing(shop.id);
        setIsOffline(false);
        setAuthExpired(false);
      } catch (processErr) {
        const status = processErr?.response?.status;
        if (status === 401 || status === 403) {
          setAuthExpired(true);
          return;
        }
        console.warn('[OfflineCtx] Process trigger failed (non-fatal):', processErr.message);
      }

      await updatePendingCount();
    } catch (err) {
      console.error('[OfflineCtx] Sync error:', err);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [shop?.id, authExpired, updatePendingCount]);

  // Keep ref current for event handlers
  useEffect(() => {
    syncNowRef.current = syncNow;
  }, [syncNow]);

  // ── Auto-sync when coming back online ───────────────────────────
  useEffect(() => {
    if (!isOffline && !authExpired && pendingCount > 0) {
      const t = setTimeout(() => syncNow(), 1000);
      return () => clearTimeout(t);
    }
  }, [isOffline, authExpired, pendingCount, syncNow]);

  // ── Sync reference data when online ────────────────────────────
  useEffect(() => {
    if (!isOffline && !authExpired && shop?.id) {
      const t = setTimeout(() => {
        syncAllReferenceData(shop.id, {
          fetchItems: fetchItemVariants,
          fetchCustomers,
          fetchGstData: fetchGstReferenceData,
        });
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [isOffline, authExpired, shop?.id]);

  // ── Helpers ──────────────────────────────────────────────────────
  const getQueuedSales = useCallback(
    async (status = null) => {
      if (!shop?.id) return [];
      try {
        return await listSalesByShop(shop.id, status);
      } catch (err) {
        console.error('[OfflineCtx] Failed to get queued sales:', err);
        return [];
      }
    },
    [shop?.id],
  );

  const getOfflineItems = useCallback(
    async (shopIdOverride = null) => {
      const targetShopId = shopIdOverride || shop?.id;
      if (!targetShopId) return [];
      try {
        return await listItemVariantsByShop(targetShopId);
      } catch {
        return [];
      }
    },
    [shop?.id],
  );

  const getOfflineCustomers = useCallback(
    async (shopIdOverride = null) => {
      const targetShopId = shopIdOverride || shop?.id;
      if (!targetShopId) return [];
      try {
        return await listCustomersByShop(targetShopId);
      } catch {
        return [];
      }
    },
    [shop?.id],
  );

  // ── resetFailedSale ──────────────────────────────────────────────
  // Resets a retry-exhausted FAILED record back to DRAFT so it can be retried.
  // Typical use: user re-authenticates after 403 failures that hit maxRetries.
  const resetFailedSale = useCallback(
    async (clientTxnId) => {
      try {
        await resetToRetryable(clientTxnId);
        await updatePendingCount();
      } catch (err) {
        console.error('[OfflineCtx] Failed to reset sale:', err);
        throw err;
      }
    },
    [updatePendingCount],
  );

  // ── Context value ────────────────────────────────────────────────
  const value = {
    isOffline,
    authExpired,
    pendingCount,
    isSyncing,
    lastSyncResult,
    deviceId,
    queueSale,
    syncNow,
    getQueuedSales,
    getOfflineItems,
    getOfflineCustomers,
    updatePendingCount,
    resetFailedSale,
  };

  return (
    <OfflineSalesContext.Provider value={value}>
      {children}
    </OfflineSalesContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────

export function useOfflineSalesContext() {
  const ctx = useContext(OfflineSalesContext);
  if (!ctx) {
    throw new Error('useOfflineSalesContext must be used within <OfflineSalesProvider>');
  }
  return ctx;
}

// Backward-compat alias so existing imports of useOfflineSales still work
// without touching every call site during the migration.
export { useOfflineSalesContext as useOfflineSales };

export default OfflineSalesContext;
