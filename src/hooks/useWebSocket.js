import { useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { toast } from 'react-toastify'; 
import { API_BASE_URL } from '../services/api';

const useWebSocket = (shopId) => {
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // State for typing indicators - Added shopId to state for filtering
  const [typingStatus, setTypingStatus] = useState({ isTyping: false, user: '', shopId: null });
  
  const stompClientRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  /**
   * Helper to send typing events.
   */
  const sendTypingStatus = (isTypingValue, userName, targetShopId = null) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      const numericId = shopId === 'ADMIN_SUPER' ? targetShopId : shopId;

      if (!numericId || isNaN(numericId)) return;

      const destination = shopId === 'ADMIN_SUPER' ? `/app/admin/typing` : `/app/shop/typing`;
      
      // LOG THIS: See if it's true or false right before sending
      console.log("SENDING TO SERVER:", isTypingValue);

      stompClientRef.current.publish({
        destination,
        body: JSON.stringify({ 
          shopId: Number(numericId),
          userName: userName,
          isTyping: Boolean(isTypingValue) // Ensure this is exactly 'isTyping'
        })
      });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let isMounted = true;
   const socket = new SockJS(`${API_BASE_URL}/ws`, null, {
      withCredentials: true,
      transports: ['websocket', 'xhr-streaming', 'xhr-polling']
    });
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        authorization: `Bearer ${token}` 
      },
      reconnectDelay: 5000,
      debug: (msg) => {
        // console.log(msg); // Enable this if you need to see raw frames
      },

      onConnect: () => {
        if (!isMounted) return;

        console.log('Socket Connected for', shopId || 'Admin');
        stompClientRef.current = client;
        setStompClient(client);
        setConnected(true);

        // ===== 1. TYPING INDICATOR SUBSCRIPTION =====
        const typingTopic = shopId === 'ADMIN_SUPER' 
          ? `/topic/admin/typing` 
          : `/topic/shop/${shopId}/typing`;

        client.subscribe(typingTopic, (message) => {
          try {
            const data = JSON.parse(message.body);
            
            /**
             * ✅ CRITICAL FIX:
             * Jackson serializes Java 'boolean isTyping' as JSON key 'typing'.
             * We check both to be safe, but 'data.typing' is what your logs show.
             */
            console.log(data);
            const currentlyTyping = data.typing !== undefined ? data.typing : data.isTyping;

            setTypingStatus({
              isTyping: currentlyTyping === true,
              user: data.userName || data.user,
              shopId: data.shopId ? Number(data.shopId) : null
            });

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (currentlyTyping) {
              typingTimeoutRef.current = setTimeout(() => {
                setTypingStatus({ isTyping: false, user: '', shopId: null });
              }, 3000);
            }
          } catch (err) {
            console.error("Typing parse error", err);
          }
        });

        // ===== 2. SHOP USER NOTIFICATIONS =====
        if (shopId && shopId !== 'ADMIN_SUPER' && !isNaN(shopId)) {
          client.subscribe(`/topic/shop/${shopId}/notifications`, (message) => {
            try {
              const data = JSON.parse(message.body);
              setNotifications((prev) => [...prev, data]);
            } catch (err) {
              setNotifications((prev) => [...prev, { message: message.body }]);
            }
          });
        }

        // ===== 3. SUPER ADMIN / TECH SUPPORT TOPIC =====
        if (shopId === 'ADMIN_SUPER') {
          client.subscribe(`/topic/admin/support`, (message) => {
            try {
              const data = JSON.parse(message.body);
              setNotifications((prev) => [...prev, data]);
            } catch (err) {
              setNotifications((prev) => [...prev, { message: message.body }]);
            }
          });
        }

        // ===== 4. PRIVATE USER NOTIFICATIONS =====
        client.subscribe('/user/queue/notifications', (message) => {
          toast.success(message.body);
        });
      },

      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        if (isMounted) {
          setConnected(false);
          setStompClient(null);
        }
      },

      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error);
        if (isMounted) {
          setConnected(false);
          setStompClient(null);
        }
      }
    });

    client.activate();

    return () => {
      isMounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (stompClientRef.current) {
        try {
          stompClientRef.current.deactivate();
        } catch (e) {
          console.error('WS Disconnect Error', e);
        }
        stompClientRef.current = null;
      }
      setStompClient(null);
      setConnected(false);
    };

  }, [shopId]);

  return { 
    stompClient, 
    connected, 
    notifications, 
    clearNotifications, 
    typingStatus,    
    sendTypingStatus 
  };
};

export default useWebSocket;