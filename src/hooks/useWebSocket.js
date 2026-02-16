import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { toast } from 'react-toastify'; 
import { API_BASE_URL } from './api'; 

const useWebSocket = (shopId) => {
  const stompClientRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !shopId) return;

    // Use the same base URL as your Axios instance
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = Stomp.over(socket);

    // Pass the JWT token in the connection headers
    const headers = {
      Authorization: `Bearer ${token}`
    };

    client.connect(headers, (frame) => {
      console.log('Connected to WebSocket');
      stompClientRef.current = client;

      // 1. Subscribe to Shop Notifications (Broadcasts)
      client.subscribe(`/topic/shop/${shopId}/notifications`, (message) => {
        const data = JSON.parse(message.body);
        toast.info(data.message || "New Notification Received");
      });

      // 2. Subscribe to Private User Notifications (Password Reset, etc.)
      client.subscribe('/user/queue/notifications', (message) => {
        toast.success(message.body);
      });

    }, (error) => {
      console.error('STOMP Error:', error);
    });

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
      }
    };
  }, [shopId]);

  return stompClientRef.current;
};