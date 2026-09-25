import { useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../services/api';
import { getValidToken } from '../utils/authStorage';

// ─── Connectivity probe ────────────────────────────────────────────────────────
// navigator.onLine only reflects the OS network-interface state (WiFi connected
// ≠ internet reachable). We probe the backend to confirm true reachability.
// REACT_APP_WS_BASE_URL is set to the dev server origin (localhost:3000) which
// proxies /actuator to the backend, keeping the probe same-origin.
// In production, both are empty and window.location.origin is used.
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || '';
const PROBE_ENDPOINT = `${WS_BASE_URL}/actuator/health`;
const PROBE_TIMEOUT_MS = 5_000;

async function probeConnectivity() {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(PROBE_ENDPOINT, {
      method:      'HEAD',
      cache:       'no-store',
      credentials: 'omit',
      signal:      ctrl.signal,
    });
    clearTimeout(tid);
    return res.ok || res.status === 401; // 401 = server replied → we're online
  } catch {
    return false;
  }
}

// ─── Sound levels ─────────────────────────────────────────────────────────────
// Three preset volumes. 'low' is the default — audible without being disruptive.
// The value is passed to a minimal Web Audio tone generator; 0 === silent.
const SOUND_GAIN = { silent: 0, low: 0.06, high: 0.18 };

/**
 * Enhanced useWebSocket hook
 *
 * Subscribes to the STOMP broker and manages all real-time topics for a shop.
 *
 * @param {string|number} shopId  Numeric shopId or the sentinel 'ADMIN_SUPER'.
 * @param {object}        options
 * @param {Function}      options.onInventory  Called with { itemId, newQty, warehouseId }
 * @param {Function}      options.onSales      Called with { saleId, amount, timestamp, cashier }
 * @param {Function}      options.onCustomer   Called with { customerId, event, details }
 *
 * Returns:
 *   stompClient, connected, isOnline
 *   notifications, clearNotifications
 *   notificationHistory, unreadCount, markNotificationsRead, clearNotificationHistory
 *   typingStatus, sendTypingStatus
 *   subscribeToTopic(topic, cb) → cleanup fn
 *   unsubscribeFromTopic(topic, cb?)
 *   queueAction(fn)  — enqueue a fn to run once reconnected
 *   soundLevel, updateSoundLevel(level)
 */
const useWebSocket = (shopId, options = {}) => {
  const { onInventory, onSales, onCustomer } = options;

  // ── Core connection state ────────────────────────────────────────────────────
  const [stompClient, setStompClient]     = useState(null);
  const [connected, setConnected]         = useState(false);
  const [isOnline, setIsOnline]           = useState(() => navigator.onLine);
  const probeTimerRef                     = useRef(null);

  // ── Notification state ───────────────────────────────────────────────────────
  const [notifications, setNotifications]           = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [unreadCount, setUnreadCount]               = useState(0);

  // ── Sound preference (persisted to localStorage) ─────────────────────────────
  const [soundLevel, setSoundLevel] = useState(
    () => localStorage.getItem('vs_ws_sound') || 'low'
  );

  // ── Internal refs (stable, not triggering renders) ───────────────────────────
  const stompClientRef   = useRef(null);
  const typingTimeoutRef = useRef(null);
  // topic → { stompSub: STOMP subscription | null, callbacks: Set<Function> }
  const subscriptionsRef = useRef(new Map());
  // Actions queued while offline / disconnected
  const offlineQueueRef  = useRef([]);

  // Callback refs so domain-level handlers don't need to be deps of the
  // STOMP useEffect (avoids reconnect churn when parent re-renders).
  const onInventoryRef = useRef(onInventory);
  const onSalesRef     = useRef(onSales);
  const onCustomerRef  = useRef(onCustomer);
  useEffect(() => { onInventoryRef.current = onInventory; }, [onInventory]);
  useEffect(() => { onSalesRef.current     = onSales;     }, [onSales]);
  useEffect(() => { onCustomerRef.current  = onCustomer;  }, [onCustomer]);

  // ── Typing indicator state ────────────────────────────────────────────────────
  const [typingStatus, setTypingStatus] = useState({ isTyping: false, user: '', shopId: null });

  // ─────────────────────────────────────────────────────────────────────────────
  // Online / offline detection
  //
  // navigator.onLine is unreliable — it reflects the OS network-interface state,
  // not true internet reachability. Strategy:
  //   1. Browser online/offline events update state immediately.
  //   2. On 'offline' (or if onLine was already false at mount), start a 15 s
  //      periodic probe against the backend so we auto-recover without a reload.
  //   3. A successful STOMP connect is definitive proof we are online.
  // ─────────────────────────────────────────────────────────────────────────────
  const stopProbe = useCallback(() => {
    if (probeTimerRef.current) {
      clearInterval(probeTimerRef.current);
      probeTimerRef.current = null;
    }
  }, []);

  const startProbe = useCallback(() => {
    stopProbe();
    probeTimerRef.current = setInterval(async () => {
      const reachable = await probeConnectivity();
      if (reachable) {
        setIsOnline(true);
        stopProbe(); // stop probing once we know we're back
      }
    }, 15_000);
  }, [stopProbe]);

  useEffect(() => {
    // Run an immediate probe on mount — catches the case where navigator.onLine
    // is already wrong at page load time.
    probeConnectivity().then((reachable) => setIsOnline(reachable || navigator.onLine));

    const handleOnline = async () => {
      // Browser says we're online; confirm with a real probe before trusting it.
      const reachable = await probeConnectivity();
      setIsOnline(reachable);
      if (reachable) stopProbe(); else startProbe();
    };

    const handleOffline = () => {
      setIsOnline(false);
      startProbe(); // keep probing so we recover as soon as server is reachable
    };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    // If navigator.onLine is already false at mount, start probing right away.
    if (!navigator.onLine) startProbe();

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopProbe();
    };
  }, [startProbe, stopProbe]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Sound notification (minimal Web Audio tone — no external assets)
  // ─────────────────────────────────────────────────────────────────────────────
  const playNotificationSound = useCallback((level) => {
    const gain = SOUND_GAIN[level ?? soundLevel] ?? 0;
    if (gain === 0) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const amp  = ctx.createGain();
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.type      = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
      amp.gain.setValueAtTime(gain, ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (_) { /* AudioContext unavailable (e.g. test env) */ }
  }, [soundLevel]);

  const updateSoundLevel = useCallback((level) => {
    setSoundLevel(level);
    localStorage.setItem('vs_ws_sound', level);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Notification history helpers
  // ─────────────────────────────────────────────────────────────────────────────
  const addToHistory = useCallback((notification) => {
    const entry = {
      ...notification,
      id:        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      read:      false,
      timestamp: new Date().toISOString(),
    };
    setNotificationHistory((prev) => [entry, ...prev].slice(0, 100));
    setUnreadCount((n) => n + 1);
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const markNotificationsRead = useCallback(() => {
    setNotificationHistory((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotificationHistory = useCallback(() => {
    setNotificationHistory([]);
    setUnreadCount(0);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Dynamic topic subscription manager
  //
  // subscribeToTopic registers a callback for a topic and immediately wires it
  // to an active STOMP subscription when connected. On reconnect, resubscribeAll
  // re-wires every registered topic so callers never need to re-subscribe.
  // ─────────────────────────────────────────────────────────────────────────────
  const subscribeToTopic = useCallback((topic, callback) => {
    if (!topic || typeof callback !== 'function') return () => {};

    const existing = subscriptionsRef.current.get(topic);
    if (existing) {
      existing.callbacks.add(callback);
    } else {
      const callbacks = new Set([callback]);
      let stompSub = null;

      if (stompClientRef.current?.connected) {
        stompSub = stompClientRef.current.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            callbacks.forEach((cb) => cb(data));
          } catch {
            callbacks.forEach((cb) => cb({ raw: message.body }));
          }
        });
      }

      subscriptionsRef.current.set(topic, { stompSub, callbacks });
    }

    // Return cleanup function
    return () => unsubscribeFromTopic(topic, callback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unsubscribeFromTopic = useCallback((topic, callback) => {
    const existing = subscriptionsRef.current.get(topic);
    if (!existing) return;

    if (callback) {
      existing.callbacks.delete(callback);
    }

    if (!callback || existing.callbacks.size === 0) {
      if (existing.stompSub) {
        try { existing.stompSub.unsubscribe(); } catch (_) {}
      }
      subscriptionsRef.current.delete(topic);
    }
  }, []);

  // Re-wire all dynamic subscriptions after a reconnect
  const resubscribeAll = useCallback((client) => {
    subscriptionsRef.current.forEach((entry, topic) => {
      // Tear down the old (dead) sub
      if (entry.stompSub) {
        try { entry.stompSub.unsubscribe(); } catch (_) {}
      }
      // Create a fresh one on the new client
      entry.stompSub = client.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body);
          entry.callbacks.forEach((cb) => cb(data));
        } catch {
          entry.callbacks.forEach((cb) => cb({ raw: message.body }));
        }
      });
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Offline action queue
  // ─────────────────────────────────────────────────────────────────────────────
  const queueAction = useCallback((fn) => {
    if (typeof fn === 'function') offlineQueueRef.current.push(fn);
  }, []);

  const flushOfflineQueue = useCallback(() => {
    const queue = offlineQueueRef.current.splice(0);
    queue.forEach((fn) => {
      try { fn(); } catch (err) { console.error('[WS] Queue flush error:', err); }
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Typing status helper
  // ─────────────────────────────────────────────────────────────────────────────
  const sendTypingStatus = useCallback((isTypingValue, userName, targetShopId = null) => {
    if (!stompClientRef.current?.connected) return;

    const numericId = shopId === 'ADMIN_SUPER' ? targetShopId : shopId;
    if (!numericId || isNaN(numericId)) return;

    const destination = shopId === 'ADMIN_SUPER'
      ? '/app/admin/typing'
      : '/app/shop/typing';

    stompClientRef.current.publish({
      destination,
      body: JSON.stringify({
        shopId:   Number(numericId),
        userName: userName,
        isTyping: Boolean(isTypingValue),
      }),
    });
  }, [shopId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // STOMP client lifecycle
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!getValidToken()) return;

    let isMounted = true;

    const client = new Client({
      // webSocketFactory is called fresh on every connect attempt
      // (initial connect + every reconnect). Building the SockJS socket
      // here instead of outside the Client ensures each reconnect attempt
      // opens a new TCP connection rather than reusing a closed one.
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`, null, {
        withCredentials: true,
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
      }),
      // connectHeaders is evaluated fresh on every connect/reconnect so that
      // the latest access token (after a silent refresh) is always used.
      // A snapshot captured at construction time would become stale after the
      // 60-second token rotation, causing reconnects to fail with 401.
      connectHeaders: () => {
        const freshToken = getValidToken() || '';
        return {
          Authorization: `Bearer ${freshToken}`,
          authorization: `Bearer ${freshToken}`,
        };
      },
      reconnectDelay: 5000,
      debug: () => {},

      // ── onConnect ───────────────────────────────────────────────────────────
      onConnect: () => {
        if (!isMounted) return;

        stompClientRef.current = client;
        setStompClient(client);
        setConnected(true);
        // A successful STOMP handshake is definitive proof of internet access.
        setIsOnline(true);
        stopProbe();

        // Flush any actions queued while the socket was down
        flushOfflineQueue();

        // Re-subscribe dynamic topics that were registered before reconnect
        resubscribeAll(client);

        // ── Typing indicator ──
        const typingTopic = shopId === 'ADMIN_SUPER'
          ? '/topic/admin/typing'
          : `/topic/shop/${shopId}/typing`;

        client.subscribe(typingTopic, (message) => {
          try {
            const data = JSON.parse(message.body);
            const currentlyTyping = data.typing !== undefined ? data.typing : data.isTyping;
            setTypingStatus({
              isTyping: currentlyTyping === true,
              user:     data.userName || data.user,
              shopId:   data.shopId ? Number(data.shopId) : null,
            });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (currentlyTyping) {
              typingTimeoutRef.current = setTimeout(() => {
                setTypingStatus({ isTyping: false, user: '', shopId: null });
              }, 3000);
            }
          } catch (err) {
            console.error('[WS] Typing parse error:', err);
          }
        });

        // ── Shop-scoped topics (not available for super-admin) ──
        if (shopId && shopId !== 'ADMIN_SUPER' && !isNaN(shopId)) {

          // General shop notifications
          client.subscribe(`/topic/shop/${shopId}/notifications`, (message) => {
            try {
              const data = JSON.parse(message.body);
              setNotifications((prev) => [...prev, data]);
              addToHistory(data);
              playNotificationSound();
            } catch {
              const item = { message: message.body };
              setNotifications((prev) => [...prev, item]);
              addToHistory(item);
            }
          });

          // ── Inventory updates: { itemId, newQty, warehouseId } ──
          client.subscribe(`/topic/shop/${shopId}/inventory`, (message) => {
            try {
              const data = JSON.parse(message.body);
              // Call the hook-level callback (if provided)
              if (onInventoryRef.current) onInventoryRef.current(data);
              // Also broadcast as a DOM CustomEvent so decoupled pages can
              // update their DataGrid without prop-drilling.
              window.dispatchEvent(new CustomEvent('ws:inventory', { detail: data }));
            } catch (err) {
              console.error('[WS] Inventory parse error:', err);
            }
          });

          // ── Sales updates: { saleId, amount, timestamp, cashier } ──
          client.subscribe(`/topic/shop/${shopId}/sales`, (message) => {
            try {
              const data = JSON.parse(message.body);
              if (onSalesRef.current) onSalesRef.current(data);
              window.dispatchEvent(new CustomEvent('ws:sales', { detail: data }));
              // Log new sales in notification history
              addToHistory({ type: 'SALE', message: `New sale ₹${data.amount || 0}`, ...data });
              playNotificationSound();
            } catch (err) {
              console.error('[WS] Sales parse error:', err);
            }
          });

          // ── Customer updates: { customerId, event, details } ──
          client.subscribe(`/topic/shop/${shopId}/customers`, (message) => {
            try {
              const data = JSON.parse(message.body);
              if (onCustomerRef.current) onCustomerRef.current(data);
              window.dispatchEvent(new CustomEvent('ws:customer', { detail: data }));
            } catch (err) {
              console.error('[WS] Customer parse error:', err);
            }
          });
        }

        // ── Super-admin support topic ──
        if (shopId === 'ADMIN_SUPER') {
          client.subscribe('/topic/admin/support', (message) => {
            try {
              const data = JSON.parse(message.body);
              setNotifications((prev) => [...prev, data]);
              addToHistory(data);
            } catch {
              setNotifications((prev) => [...prev, { message: message.body }]);
            }
          });
        }

        // ── Per-user private notifications ──
        client.subscribe('/user/queue/notifications', (message) => {
          toast.success(message.body);
          addToHistory({ message: message.body, type: 'PRIVATE' });
          playNotificationSound();
        });
      },

      // ── Error handlers ─────────────────────────────────────────────────────
      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame);
        if (isMounted) { setConnected(false); setStompClient(null); }
      },

      onWebSocketError: (error) => {
        console.error('[WS] WebSocket error:', error);
        if (isMounted) { setConnected(false); setStompClient(null); }
      },

      onDisconnect: () => {
        if (isMounted) setConnected(false);
      },
    });

    client.activate();

    return () => {
      isMounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (stompClientRef.current) {
        try { stompClientRef.current.deactivate(); } catch (_) {}
        stompClientRef.current = null;
      }
      setStompClient(null);
      setConnected(false);
    };
  }, [shopId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Core
    stompClient,
    connected,
    isOnline,

    // General notifications (support chat, private queue)
    notifications,
    clearNotifications,

    // Notification history & badges
    notificationHistory,
    unreadCount,
    markNotificationsRead,
    clearNotificationHistory,

    // Typing indicator (support chat)
    typingStatus,
    sendTypingStatus,

    // Dynamic subscription API
    subscribeToTopic,
    unsubscribeFromTopic,

    // Offline queue
    queueAction,

    // Sound
    soundLevel,
    updateSoundLevel,
    playNotificationSound,
  };
};

export default useWebSocket;
