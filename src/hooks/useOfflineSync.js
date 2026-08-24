/**
 * useOfflineSync
 *
 * Exposes the state of the background-sync queue and the current
 * network condition so any component can show offline/sync status.
 *
 * State shape:
 *   isOnline       – true when navigator.onLine
 *   pendingCount   – number of mutations waiting to be replayed
 *   isSyncing      – true while a background-sync replay is in progress
 *   lastSyncedAt   – Date of the last successful background-sync flush, or null
 *
 * The hook communicates with the service worker via postMessage:
 *   → GET_SYNC_QUEUE_COUNT  (ask the SW for the current queue depth)
 *   ← SYNC_QUEUE_COUNT      (SW replies with { count })
 *   ← SYNC_COMPLETE         (SW broadcast after a flush: { synced })
 *
 * Example usage:
 *
 *   const { isOnline, pendingCount } = useOfflineSync();
 *
 *   if (!isOnline) return <OfflineBanner pendingCount={pendingCount} />;
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL_MS = 30_000; // refresh queue count every 30 s

export function useOfflineSync() {
  const [isOnline, setIsOnline]         = useState(() => navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing]       = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const pollTimerRef                    = useRef(null);

  // ── Ask the SW for the current queue depth ─────────────────────────────────
  const requestQueueCount = useCallback(() => {
    if (!navigator?.serviceWorker?.controller) return;
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_SYNC_QUEUE_COUNT',
      });
    } catch (_) {}
  }, []);

  // ── Handle messages from the service worker ────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event) => {
      const data = event?.data;
      if (!data?.type) return;

      switch (data.type) {
        case 'SYNC_QUEUE_COUNT':
          setPendingCount(data.count ?? 0);
          break;

        case 'SYNC_COMPLETE':
          setIsSyncing(false);
          setLastSyncedAt(new Date());
          // The SW also sends an updated SYNC_QUEUE_COUNT right after,
          // but decrement immediately so the badge feels responsive.
          setPendingCount((prev) => Math.max(0, prev - (data.synced ?? 0)));
          break;

        default:
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // ── Online / offline events ────────────────────────────────────────────────
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);    // optimistically — SW will correct if queue is empty
      requestQueueCount();
    };

    const onOffline = () => {
      setIsOnline(false);
      setIsSyncing(false);
    };

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [requestQueueCount]);

  // ── Initial count + periodic polling ──────────────────────────────────────
  useEffect(() => {
    // Wait for the SW controller to be ready
    if (!('serviceWorker' in navigator)) return;

    const init = () => {
      requestQueueCount();
      pollTimerRef.current = setInterval(requestQueueCount, POLL_INTERVAL_MS);
    };

    if (navigator.serviceWorker.controller) {
      init();
    } else {
      // Controller not yet set (first page load before SW activates)
      const onControllerChange = () => {
        init();
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    }

    return () => {
      clearInterval(pollTimerRef.current);
    };
  }, [requestQueueCount]);

  return { isOnline, pendingCount, isSyncing, lastSyncedAt, requestQueueCount };
}

export default useOfflineSync;
