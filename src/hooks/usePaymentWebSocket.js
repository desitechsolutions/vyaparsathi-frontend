/**
 * usePaymentWebSocket
 *
 * Listens for real-time payment events broadcast by the backend on
 *   /topic/shop/{shopId}/payments
 *
 * De-duplicates events by paymentId so re-renders and reconnects never
 * apply the same event twice. Auto-reconnect is handled by the shared
 * STOMP client in WebSocketContext (reconnectDelay: 5 s).
 *
 * @param {object}  options
 * @param {number|string} [options.customerId]  Only surface events for this customer.
 *                                               Omit to receive all payment events.
 * @param {boolean}       [options.enabled]     Set false to pause subscription.
 *
 * @returns {{ balanceUpdate: object|null, lastUpdate: Date|null, isConnected: boolean }}
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useAuthContext } from '../context/AuthContext';

const MAX_SEEN_IDS = 200;

const usePaymentWebSocket = ({ customerId, enabled = true } = {}) => {
  const { subscribeToTopic, connected } = useWebSocketContext();
  const { user } = useAuthContext();

  const [balanceUpdate, setBalanceUpdate] = useState(null);
  const [lastUpdate,    setLastUpdate]    = useState(null);

  // Mutable refs — changes here never trigger re-subscription
  const seenIdsRef    = useRef(new Set());
  const customerIdRef = useRef(customerId);
  useEffect(() => { customerIdRef.current = customerId; }, [customerId]);

  // Stable callback — no deps that would cause subscription to re-register
  const handleMessage = useCallback((event) => {
    if (!event || typeof event !== 'object') return;

    // De-duplicate
    const pid = event.paymentId ?? event.id ?? null;
    if (pid != null) {
      if (seenIdsRef.current.has(pid)) return;
      seenIdsRef.current.add(pid);
      // Evict oldest entry to keep the Set bounded
      if (seenIdsRef.current.size > MAX_SEEN_IDS) {
        seenIdsRef.current.delete(seenIdsRef.current.values().next().value);
      }
    }

    // Customer filter (applied using the ref so the callback stays stable)
    const cid = customerIdRef.current;
    if (cid != null && String(event.customerId) !== String(cid)) return;

    setBalanceUpdate(event);
    setLastUpdate(new Date());
  }, []); // intentionally empty deps — uses refs for mutable values

  useEffect(() => {
    const shopId = user?.shopId;
    if (!enabled || !shopId || shopId === 'ADMIN_SUPER') return;

    const topic = `/topic/shop/${shopId}/payments`;
    const unsub = subscribeToTopic(topic, handleMessage);

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [enabled, user?.shopId, subscribeToTopic, handleMessage]);

  return { balanceUpdate, lastUpdate, isConnected: connected };
};

export default usePaymentWebSocket;
