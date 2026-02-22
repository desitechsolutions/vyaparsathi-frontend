import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Fab, Paper, Typography, TextField, IconButton, 
  Stack, Avatar, Zoom, CircularProgress, Badge 
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useSupportChat } from './admin/hooks/useSupportChat';
// import useWebSocket from '../hooks/useWebSocket'; // Removed redundant direct import

const SupportChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  /**
   * ✅ CRITICAL CHANGE: 
   * Extracting typingStatus and sendTypingStatus from useSupportChat.
   * This ensures the logic uses the filtered state we defined in your support hook.
   */
  const { 
    messages, 
    loading, 
    sendMessage, 
    typingStatus, 
    sendTypingStatus,
    notifications,
    clearNotifications 
  } = useSupportChat(user?.shopId, false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      if (notifications && notifications.length > 0) {
        clearNotifications();
      }
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen, notifications?.length, clearNotifications, typingStatus?.isTyping]);

  const handleSend = () => {
    if (!text.trim()) return;
    if (!user || !user.shopId) return;

    sendMessage(text, user.name, user.shopId, user.shopName);
    
    // Notify admin that typing has stopped after sending
    // Passed shopId as 3rd param to ensure it reaches the right destination
    if (sendTypingStatus) {
        sendTypingStatus(false, user.name, user.shopId); 
    }
    setText('');
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);
    
    // Trigger real-time typing status
    if (user?.shopId && sendTypingStatus) {
      sendTypingStatus(val.length > 0, user.name, user.shopId);
    }
  };

  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return 'Just now';
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 3000, 
        pointerEvents: 'none', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
      }}
    >
      {/* Floating Chat Window */}
      <Zoom in={isOpen}>
        <Paper 
          sx={{ 
            width: { xs: '90vw', sm: 350 }, 
            height: 450, 
            mb: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            borderRadius: 4, 
            border: '1px solid #e2e8f0',
            boxShadow: '0px 8px 32px rgba(0,0,0,0.2)',
            pointerEvents: 'auto'
          }}
        >
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            bgcolor: '#1e293b', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ bgcolor: '#ef4444', width: 32, height: 32 }}>
                <SupportAgentIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                  VyaparSathi Support
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#10b981', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5 
                  }}
                >
                  <Box component="span" sx={{ width: 6, height: 6, bgcolor: '#10b981', borderRadius: '50%' }} />
                  Online
                </Typography>
              </Box>
            </Stack>

            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Chat Body */}
          <Box sx={{ 
            flexGrow: 1, 
            p: 2, 
            overflowY: 'auto', 
            bgcolor: '#f8fafc', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress size={20} color="inherit" sx={{ opacity: 0.5 }} />
              </Box>
            ) : !messages || messages.length === 0 ? (
              <Typography 
                variant="caption" 
                sx={{ textAlign: 'center', mt: 10, color: 'text.disabled' }}
              >
                👋 Hi {user?.name || 'there'}! How can we help you today?
              </Typography>
            ) : (
              messages.map((m, i) => {
                if (!m) return null;

                const isAdmin = m.isFromAdmin === true || 
                                m.fromAdmin === true || 
                                m.senderRole === 'ROLE_SUPER_ADMIN';

                return (
                  <Box 
                    key={m.id || `${i}-${m.timestamp || 'msg'}`} 
                    sx={{ 
                      alignSelf: isAdmin ? 'flex-start' : 'flex-end', 
                      mb: 1.5, 
                      maxWidth: '85%' 
                    }}
                  >
                    <Paper sx={{ 
                      p: 1.2, 
                      borderRadius: isAdmin ? '15px 15px 15px 2px' : '15px 15px 2px 15px',
                      bgcolor: isAdmin ? 'white' : '#1e293b',
                      color: isAdmin ? 'black' : 'white',
                      border: isAdmin ? '1px solid #e2e8f0' : 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>
                        {m.message || ''}
                      </Typography>
                    </Paper>

                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '9px', 
                        color: 'text.disabled', 
                        mt: 0.2, 
                        display: 'block', 
                        textAlign: isAdmin ? 'left' : 'right' 
                      }}
                    >
                      {isAdmin ? 'Support Team' : 'You'} • {formatTime(m.timestamp)}
                    </Typography>
                  </Box>
                );
              })
            )}

            {/* ✅ REAL-TIME TYPING INDICATOR UI */}
            {typingStatus?.isTyping && (
              <Box sx={{ alignSelf: 'flex-start', mb: 1.5, ml: 1 }}>
                 <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 1 }}>
                   Support is typing...
                 </Typography>
              </Box>
            )}

            <div ref={scrollRef} />
          </Box>

          {/* Input Area */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'white', 
            borderTop: '1px solid #e2e8f0', 
            pointerEvents: 'auto' 
          }}>
            <Stack direction="row" spacing={1}>
              <TextField 
                fullWidth 
                size="small" 
                placeholder={loading ? "Connecting..." : "Type a message..."}
                value={text}
                disabled={loading || !user?.shopId}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                autoComplete="off"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3, 
                    bgcolor: '#f1f5f9' 
                  } 
                }}
              />

              <IconButton 
                sx={{ 
                  bgcolor: '#ef4444', 
                  color: 'white', 
                  '&:hover': { bgcolor: '#dc2626' },
                  '&.Mui-disabled': { bgcolor: '#cbd5e1' }
                }}
                onClick={handleSend} 
                disabled={!text.trim() || loading || !user?.shopId}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      </Zoom>

      {/* Toggle Button with Notification Badge */}
      <Box sx={{ pointerEvents: 'auto' }}>
        <Badge 
          badgeContent={notifications?.length || 0} 
          color="error"
          invisible={isOpen || !notifications?.length}
          sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem', height: 20, minWidth: 20 } }}
        >
          <Fab 
            onClick={() => setIsOpen(!isOpen)}
            sx={{ 
              bgcolor: '#1e293b', 
              color: 'white',
              '&:hover': { bgcolor: '#334155' },
              boxShadow: '0px 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            {isOpen ? <CloseIcon /> : <ChatIcon />}
          </Fab>
        </Badge>
      </Box>
    </Box>
  );
};

export default SupportChatWidget;