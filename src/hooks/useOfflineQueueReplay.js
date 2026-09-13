/**
 * useOfflineQueueReplay
 *
 * Automatically replays offline payment queue when connectivity is restored.
 *
 * SECURITY: Validates that current user matches the user who queued the item.
 * If a mismatch is detected (multi-user scenario), the queue is cleared.
 *
 * Flow:
 * 1. When app comes online, check offline queue
 * 2. For each item, validate: authUser.sub === item._queuedByUserId
 * 3. If mismatch → clear entire queue (multi-user detected)
 * 4. If match → replay via onReplay callback
 */

import { useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getOfflineQueue, clearOfflineQueue } from '../services/offline/quickPaymentQueue';

export function useOfflineQueueReplay(onReplay) {
  const { user: authUser } = useContext(AuthContext) || {};

  const replayQueue = useCallback(async () => {
    if (!authUser?.sub) return;

    const queue = getOfflineQueue();
    if (!queue.length) return;

    // Check for multi-user scenario
    const mismatchedItems = queue.filter(item => item._queuedByUserId !== authUser.sub);
    if (mismatchedItems.length > 0) {
      console.warn('[Offline] Auth mismatch detected: clearing queue. Queue was created by different user.');
      clearOfflineQueue();
      return;
    }

    // All items belong to current user - replay them
    const validItems = queue.filter(item => item._queuedByUserId === authUser.sub);
    for (const item of validItems) {
      try {
        await onReplay(item);
      } catch (err) {
        console.error('[Offline] Replay failed for item:', item.customerId, err);
        // Continue with next item even if one fails
      }
    }

    // Clear queue after successful replay
    clearOfflineQueue();
  }, [authUser?.sub, onReplay]);

  // Listen for online event and replay queue
  useEffect(() => {
    if (!authUser?.sub) return;

    const handleOnline = () => {
      replayQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [authUser?.sub, replayQueue]);
}

export default useOfflineQueueReplay;
