import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMyChatHistory, fetchShopHistoryForAdmin } from '../../../services/api';
import useWebSocket from '../../../hooks/useWebSocket';

export const useSupportChat = (targetShopId = null, isSuperAdmin = false) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // For Tech Admin, we pass 'ADMIN_SUPER'. For Owners, we pass their shopId.
    const wsIdentity = isSuperAdmin ? 'ADMIN_SUPER' : targetShopId;

    const { 
        stompClient, 
        connected, 
        typingStatus: rawTypingStatus, 
        sendTypingStatus 
    } = useWebSocket(wsIdentity);
    
    /**
     * ✅ TYPING FILTER LOGIC
     * If Admin: Only show typing if the incoming shopId matches the active window.
     * If Shop: Just show whatever comes through.
     */
    const typingStatus = (isSuperAdmin && rawTypingStatus?.shopId && Number(rawTypingStatus.shopId) !== Number(targetShopId))
        ? { isTyping: false, user: '', shopId: null }
        : rawTypingStatus;

    // Use a ref to track the current shopId to avoid stale closures in the subscription
    const currentShopIdRef = useRef(targetShopId);
    useEffect(() => {
        currentShopIdRef.current = targetShopId;
    }, [targetShopId]);

    const loadHistory = useCallback(async () => {
        // Tech Admin only loads history if a specific shop is selected
        if (isSuperAdmin && !targetShopId) return;
        
        try {
            setLoading(true);
            // Clear messages when switching shops so old chat doesn't persist visually
            setMessages([]); 

            const data = isSuperAdmin 
                ? await fetchShopHistoryForAdmin(targetShopId) 
                : await fetchMyChatHistory();

            setMessages(data || []);
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
        if (connected && stompClient && typeof stompClient.subscribe === 'function') {

            // Tech Admin listens to global topic, Shop Owner listens to specific shop topic
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
                    return; 
                }

                /**
                 * ✅ MESSAGE FILTER LOGIC
                 * Filter incoming messages so they only appear in the correct shop's window.
                 */
                if (isSuperAdmin) {
                    const msgShopId = Number(newMessage.shopId);
                    const activeId = Number(currentShopIdRef.current);
                    
                    if (msgShopId !== activeId) {
                        return; // Ignore messages for other shops
                    }
                }

                setMessages((prev) => {
                    // Remove optimistic duplicate if it exists
                    const filtered = prev.filter(
                        m => !(m.isOptimistic && m.message === newMessage.message)
                    );

                    // Prevent duplicate server messages by ID
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

    }, [stompClient, connected, isSuperAdmin]); // targetShopId removed to keep subscription stable

    const sendMessage = (text, senderName, shopId, shopName) => {
        if (!text.trim()) return;

        const payload = {
            message: text,
            senderName,
            shopId: Number(shopId),
            shopName,
            isFromAdmin: isSuperAdmin,
            timestamp: new Date().toISOString(),
            isOptimistic: true
        };

        // UI update for immediate feedback
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

    return { 
        messages, 
        loading, 
        sendMessage, 
        typingStatus, 
        sendTypingStatus,
        connected 
    };
};