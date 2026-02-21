import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, List, ListItemAvatar, 
  Avatar, ListItemText, Badge, Divider, ListItemButton ,Stack
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import useWebSocket from '../../hooks/useWebSocket'; 
import ChatWindow from './ChatWindow'; 
import { markChatAsRead, fetchAllConversations } from '../../services/api'; 

const AdminSupport = () => {
  const [activeShopId, setActiveShopId] = useState(null);
  const [activeShopName, setActiveShopName] = useState('');
  const [conversations, setConversations] = useState({}); 
  
  // Connect as Admin to the global support topic
  const { stompClient, connected } = useWebSocket('ADMIN_SUPER');

  // 1. Fetch initial list of conversations from DB
  useEffect(() => {
    const loadInitialConversations = async () => {
      try {
        const response = await fetchAllConversations();
        const initialMap = {};
        
        // Handle axios response structures safely
        const chatList = Array.isArray(response) ? response : (response?.data || []);
        
        chatList.forEach(conv => {
          initialMap[conv.shopId] = {
            shopId: conv.shopId,
            shopName: conv.shopName || `Shop #${conv.shopId}`,
            lastMessage: conv.lastMessage || '',
            hasNew: !!conv.hasUnread, // Ensure boolean
            timestamp: conv.timestamp || new Date().toISOString()
          };
        });
        setConversations(initialMap);
      } catch (error) {
        console.error("Failed to load chat history list:", error);
      }
    };

    loadInitialConversations();
  }, []);

  // 2. WebSocket Subscription for live incoming messages
  useEffect(() => {
    if (connected && stompClient?.subscribe) {
      const sub = stompClient.subscribe('/topic/admin/support', (msg) => {
        let incoming;
        try {
          incoming = JSON.parse(msg.body);
        } catch (e) { 
          return; 
        }

        if (!incoming || !incoming.shopId) return;

        setConversations(prev => {
          const existing = prev[incoming.shopId] || {};
          // Only show as "New" if Rakesh isn't currently looking at this shop
          const shouldNotify = incoming.shopId !== activeShopId;

          return {
            ...prev,
            [incoming.shopId]: {
              ...existing,
              shopId: incoming.shopId,
              shopName: incoming.shopName || existing.shopName || `Shop ${incoming.shopId}`,
              lastMessage: incoming.message || '',
              hasNew: shouldNotify,
              timestamp: new Date().toISOString()
            }
          };
        });
      });

      return () => sub.unsubscribe();
    }
  }, [stompClient, connected, activeShopId]);

  // 3. Handle Selecting a shop from the list
  const handleSelectShop = async (shop) => {
    setActiveShopId(shop.shopId);
    setActiveShopName(shop.shopName);
    
    // Clear notification state locally immediately
    setConversations(prev => ({
      ...prev,
      [shop.shopId]: { ...prev[shop.shopId], hasNew: false }
    }));

    // Update DB status in background
    try {
      await markChatAsRead(shop.shopId);
    } catch (err) {
      console.warn("Read status sync failed on server, but UI is updated.");
    }
  };

  // 4. Sort calculations for the sidebar
  const sortedConversations = Object.values(conversations).sort((a, b) => {
    // Priority 1: Unread messages at the top
    if (a.hasNew !== b.hasNew) return a.hasNew ? -1 : 1;
    // Priority 2: Most recent message time
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', p: 2, overflow: 'hidden' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        
        {/* SIDEBAR: Shop List */}
        <Grid item xs={12} md={4} lg={3} sx={{ height: '100%' }}>
          <Paper 
            elevation={0}
            sx={{ 
              height: '100%', 
              bgcolor: '#1e293b', 
              color: 'white', 
              borderRadius: 3, 
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <Box sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#ec4899', letterSpacing: -0.5 }}>
                Support Center
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                <Box sx={{ width: 8, height: 8, bgcolor: connected ? '#4ade80' : '#f87171', borderRadius: '50%' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {connected ? 'System Live' : 'Connecting...'}
                </Typography>
              </Stack>
            </Box>

            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            
            <List sx={{ flexGrow: 1, overflowY: 'auto', py: 0 }}>
              {sortedConversations.map((shop) => (
                <ListItemButton 
                  key={shop.shopId} 
                  onClick={() => handleSelectShop(shop)}
                  selected={activeShopId === shop.shopId}
                  sx={{ 
                    py: 2,
                    px: 2,
                    '&.Mui-selected': { 
                      bgcolor: 'rgba(236, 72, 153, 0.12)',
                      '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.2)' }
                    },
                    borderLeft: activeShopId === shop.shopId ? '4px solid #ec4899' : '4px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ListItemAvatar>
                    <Badge 
                      color="error" 
                      variant="dot" 
                      invisible={!shop.hasNew}
                      sx={{ '& .MuiBadge-badge': { width: 12, height: 12, borderRadius: '50%', border: '2px solid #1e293b' } }}
                    >
                      <Avatar sx={{ bgcolor: shop.hasNew ? '#ec4899' : '#334155', width: 42, height: 42 }}>
                        <StorefrontIcon fontSize="small" />
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>

                  <ListItemText 
                    primary={
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: shop.hasNew ? 900 : 600, fontSize: '0.9rem' }}>
                        {shop.shopName}
                      </Typography>
                    }
                    secondary={shop.lastMessage || 'No recent messages'} 
                    secondaryTypographyProps={{ 
                      component: 'span',
                      sx: { 
                        color: shop.hasNew ? '#fff' : 'rgba(255,255,255,0.4)', 
                        fontSize: '0.75rem',
                        display: 'block',
                        mt: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      } 
                    }}
                  />
                </ListItemButton>
              ))}

              {sortedConversations.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center', opacity: 0.5 }}>
                  <Typography variant="body2">Waiting for conversations...</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        {/* MAIN: Chat Window View */}
        <Grid item xs={12} md={8} lg={9} sx={{ height: '100%' }}>
          <Paper 
            elevation={0}
            sx={{ 
              height: '100%', 
              borderRadius: 3, 
              overflow: 'hidden', 
              border: '1px solid #e2e8f0',
              bgcolor: 'white' 
            }}
          >
            {activeShopId ? (
              <ChatWindow 
                shopId={activeShopId} 
                shopName={activeShopName} 
              />
            ) : (
              <Box 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  bgcolor: '#f8fafc',
                  textAlign: 'center',
                  p: 3
                }}
              >
                <Avatar sx={{ width: 100, height: 100, mb: 3, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
                  <StorefrontIcon sx={{ fontSize: 50, color: '#cbd5e1' }} />
                </Avatar>
                <Typography variant="h5" fontWeight={900} color="#1e293b" gutterBottom>
                  Admin Support Desktop
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
                  Select a business from the left sidebar to start a secure support session.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};

export default AdminSupport;