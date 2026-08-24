import React, { createContext, useContext } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { useAuthContext } from './AuthContext';

/**
 * WebSocketContext
 *
 * Provides a single shared STOMP connection for the whole app.
 * All pages can read real-time state (connected, isOnline, unreadCount…)
 * and call helpers (subscribeToTopic, queueAction, etc.) without
 * prop-drilling or spinning up redundant sockets.
 *
 * Usage:
 *   const { connected, isOnline, unreadCount } = useWebSocketContext();
 *   const { subscribeToTopic } = useWebSocketContext();
 */
const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuthContext();

  // Resolve the shopId that the STOMP hook will use.
  // • Regular shop users get their numeric shopId from the JWT.
  // • Super-admin users get the sentinel 'ADMIN_SUPER' so the hook
  //   subscribes to admin-level topics instead of a shop topic.
  // • Unauthenticated: null — the hook returns early when shopId is falsy.
  let shopId = null;
  if (user) {
    if (user.role === 'ROLE_SUPER_ADMIN') {
      shopId = 'ADMIN_SUPER';
    } else if (user.shopId) {
      shopId = user.shopId;
    }
  }

  const ws = useWebSocket(shopId);

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * useWebSocketContext
 *
 * Returns the full shape of useWebSocket plus a null-safe fallback so
 * components that render before the provider is mounted don't crash.
 */
export const useWebSocketContext = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    // Provide a safe no-op fallback for components that import this hook
    // outside the provider tree (e.g. landing pages, auth pages).
    return {
      stompClient:              null,
      connected:                false,
      isOnline:                 navigator.onLine,
      notifications:            [],
      clearNotifications:       () => {},
      notificationHistory:      [],
      unreadCount:              0,
      markNotificationsRead:    () => {},
      clearNotificationHistory: () => {},
      typingStatus:             { isTyping: false, user: '', shopId: null },
      sendTypingStatus:         () => {},
      subscribeToTopic:         () => () => {},
      unsubscribeFromTopic:     () => {},
      queueAction:              () => {},
      soundLevel:               'low',
      updateSoundLevel:         () => {},
      playNotificationSound:    () => {},
    };
  }
  return ctx;
};
