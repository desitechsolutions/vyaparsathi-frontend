import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMyChatHistory, fetchShopHistoryForAdmin } from '../../../services/api';
import useWebSocket from '../../../hooks/useWebSocket';

export const useSupportChat = (targetShopId = null, isSuperAdmin = false) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // For Tech Admin, we pass 'ADMIN_SUPER'. For Owners, we pass their shopId.
    const wsIdentity = isSuperAdmin ? 'ADMIN_SUPER' : targetShopId;

    // FIX: Extract typingStatus and sendTypingStatus from useWebSocket
    const { 
        stompClient, 
        connected, 
        typingStatus, 
        sendTypingStatus 
    } = useWebSocket(wsIdentity);

    const isInitialLoad = useRef(true);

    const loadHistory = useCallback(async () => {
        // Tech Admin only loads history if a specific shop is selected
        if (isSuperAdmin && !targetShopId) return;
        
        try {
            setLoading(true);

            const data = isSuperAdmin 
                ? await fetchShopHistoryForAdmin(targetShopId) 
                : await fetchMyChatHistory();

            setMessages(prev => {
                if (isInitialLoad.current) {
                    isInitialLoad.current = false;
                    return data || [];
                }
                return prev; 
            });

        } catch (error) {
            console.error("Chat History Error:", error);
        } finally {
            setLoading(false);
        }
    }, [targetShopId, isSuperAdmin]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        // --- SAFETY CHECK ---
        if (connected && stompClient && typeof stompClient.subscribe === 'function') {

            // Tech Admin listens to global topic
            // Shop Owner listens to shop topic
            const topic = isSuperAdmin 
                ? `/topic/admin/support` 
                : (targetShopId ? `/topic/shop/${targetShopId}/notifications` : null);

            if (!topic) return;

            console.log(`Subscribing to messages on: ${topic}`);

            const sub = stompClient.subscribe(topic, (frame) => {
                let newMessage;
                try {
                    newMessage = JSON.parse(frame.body);
                } catch {
                    newMessage = { message: frame.body };
                }

                setMessages((prev) => {
                    // Remove optimistic duplicate
                    const filtered = prev.filter(
                        m => !(m.isOptimistic && m.message === newMessage.message)
                    );

                    // Prevent duplicate server messages
                    if (newMessage.id && filtered.some(m => m.id === newMessage.id)) {
                        return filtered;
                    }

                    return [...filtered, newMessage];
                });
            });

            return () => {
                if (sub && typeof sub.unsubscribe === 'function') {
                    sub.unsubscribe();
                }
            };
        }

    }, [stompClient, connected, targetShopId, isSuperAdmin]);

    const sendMessage = (text, senderName, shopId, shopName) => {
        const payload = {
            message: text,
            senderName,
            shopId,
            shopName,
            isFromAdmin: isSuperAdmin,
            timestamp: new Date().toISOString(),
            isOptimistic: true
        };

        setMessages(prev => [...prev, payload]);

        if (!stompClient || !connected) {
            console.warn("STOMP client not ready");
            return;
        }

        try {
            const destination = isSuperAdmin
                ? `/app/support.reply.${shopId}`
                : `/app/support.contact`;

            stompClient.publish({
                destination,
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error("Send failed:", err);
        }
    };

    // FIX: Added typingStatus and sendTypingStatus to the returned object
    return { 
        messages, 
        loading, 
        sendMessage, 
        typingStatus, 
        sendTypingStatus,
        connected 
    };
};