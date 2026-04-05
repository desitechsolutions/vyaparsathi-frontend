import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Fab, Paper, Typography, TextField, IconButton, 
  Stack, Avatar, Zoom, CircularProgress, Badge, Tooltip
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useSupportChat } from './admin/hooks/useSupportChat';
// import useWebSocket from '../hooks/useWebSocket'; // Removed redundant direct import

const STORAGE_KEY = 'chatWidgetPos';

const SupportChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  // Draggable position — null means use default (bottom:20, right:20)
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const dragData = useRef(null);

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

  // Drag logic — mousemove / mouseup / touchmove / touchend on document
  useEffect(() => {
    if (!isDragging) return;

    const getCoords = (e) => {
      if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    };

    const onMove = (e) => {
      const { startMouseX, startMouseY, startLeft, startTop } = dragData.current;
      const { x, y } = getCoords(e);
      const dx = x - startMouseX;
      const dy = y - startMouseY;
      const containerW = containerRef.current?.offsetWidth || 60;
      const containerH = containerRef.current?.offsetHeight || 60;
      const newLeft = Math.max(0, Math.min(startLeft + dx, window.innerWidth - containerW));
      const newTop = Math.max(0, Math.min(startTop + dy, window.innerHeight - containerH));
      setPos({ left: newLeft, top: newTop });
    };

    const onEnd = () => {
      setIsDragging(false);
      setPos(prev => {
        if (prev) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prev)); } catch {}
        }
        return prev;
      });
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [isDragging]);

  const handleDragStart = (e) => {
    if (e.type === 'mousedown' && e.button !== 0) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const coords = e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
    dragData.current = {
      startMouseX: coords.x,
      startMouseY: coords.y,
      startLeft: rect.left,
      startTop: rect.top,
    };
    setPos({ left: rect.left, top: rect.top });
    setIsDragging(true);
  };

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

  // Track window height to correctly determine chat-window open direction on resize
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine whether the chat window should open upward or downward based on position
  const openUpward = !pos || (pos.top > windowHeight / 2);

  return (
    <Box
      ref={containerRef}
      sx={{ 
        position: 'fixed', 
        ...(pos
          ? { left: pos.left, top: pos.top, bottom: 'auto', right: 'auto' }
          : { bottom: 20, right: 20 }
        ),
        zIndex: 3000, 
        pointerEvents: 'none', 
        display: 'flex',
        flexDirection: openUpward ? 'column' : 'column-reverse',
        alignItems: 'flex-end',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Floating Chat Window */}
      <Zoom in={isOpen}>
        <Paper 
          sx={{ 
            width: { xs: '90vw', sm: 350 }, 
            height: 450, 
            mb: openUpward ? 2 : 0,
            mt: openUpward ? 0 : 2,
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

      {/* Toggle Button with Notification Badge — drag the button to reposition */}
      <Box sx={{ pointerEvents: 'auto', position: 'relative' }}>
        <Badge 
          badgeContent={notifications?.length || 0} 
          color="error"
          invisible={isOpen || !notifications?.length}
          sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem', height: 20, minWidth: 20 } }}
        >
          <Tooltip title={isDragging ? '' : 'Support Chat - drag to move'} placement="left">
            <Fab 
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              onClick={() => { if (!isDragging) setIsOpen(!isOpen); }}
              sx={{ 
                bgcolor: '#1e293b', 
                color: 'white',
                '&:hover': { bgcolor: '#334155' },
                boxShadow: '0px 4px 12px rgba(0,0,0,0.3)',
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              {isOpen ? <CloseIcon /> : <ChatIcon />}
            </Fab>
          </Tooltip>
        </Badge>
      </Box>
    </Box>
  );
};

export default SupportChatWidget;