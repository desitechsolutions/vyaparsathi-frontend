import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, Paper, Stack, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useSupportChat } from '../admin/hooks/useSupportChat'; 
import { useAuthContext } from '../../context/AuthContext';

const ChatWindow = ({ shopId, shopName }) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  
  const { user } = useAuthContext();
  const adminName = user?.name || user?.sub || 'Support Team';

  const { 
    messages, 
    loading, 
    sendMessage, 
    typingStatus, 
    sendTypingStatus 
  } = useSupportChat(shopId, true);

  const handleSend = () => {
    if (!text.trim() || !shopId) return;
    sendMessage(text, adminName, shopId, shopName);
    if (sendTypingStatus) sendTypingStatus(false, adminName, shopId); 
    setText('');
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (shopId && sendTypingStatus) {
      sendTypingStatus(val.length > 0, adminName, shopId);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingStatus?.isTyping]);

  useEffect(() => {
    setText('');
  }, [shopId]);

  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return 'Just now';
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      maxHeight: '100%', 
      overflow: 'hidden',
      bgcolor: 'white',
    }}>
      
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', bgcolor: 'white', zIndex: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
          {shopName || 'Select a Shop'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
          <Box component="span" sx={{ width: 8, height: 8, bgcolor: '#10b981', borderRadius: '50%' }} />
          Support Agent: {adminName}
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 2, 
        overflowY: 'auto', 
        bgcolor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={24} sx={{ color: '#ec4899', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">Fetching history...</Typography>
          </Box>
        ) : !messages || messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 5, opacity: 0.6 }}>
             <Paper variant="outlined" sx={{ p: 2, bgcolor: 'transparent', borderStyle: 'dashed' }}>
                <Typography variant="body2" color="text.secondary">No previous chat history.</Typography>
             </Paper>
          </Box>
        ) : (
          messages.map((m, i) => {
            if (!m) return null;
            
            // FIXED: Added multiple checks to identify if message is from Admin/You
            const isFromAdmin = 
              m.isFromAdmin === true || 
              m.fromAdmin === true || 
              m.senderRole === 'ROLE_SUPER_ADMIN' || 
              m.senderRole === 'ADMIN' ||
              m.senderName === adminName; // Fallback to name check

            return (
              <Box 
                key={m.id || `msg-${i}`} 
                sx={{ 
                  display: 'flex', 
                  width: '100%',
                  justifyContent: isFromAdmin ? 'flex-end' : 'flex-start', 
                  mb: 2 
                }}
              >
                <Box sx={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: isFromAdmin ? 'flex-end' : 'flex-start' }}>
                  <Paper sx={{ 
                    p: 1.5, 
                    borderRadius: isFromAdmin ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    bgcolor: isFromAdmin ? '#ec4899' : 'white', 
                    color: isFromAdmin ? 'white' : '#1e293b',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    border: isFromAdmin ? 'none' : '1px solid #e2e8f0'
                  }}>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {m.message}
                    </Typography>
                  </Paper>

                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '10px', 
                      color: 'text.disabled', 
                      mt: 0.5, 
                      fontWeight: 600
                    }}
                  >
                    {isFromAdmin ? `You` : (m.senderName || shopName)} • {formatTime(m.timestamp || m.createdAt)}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingStatus?.isTyping && (
          <Box sx={{ alignSelf: 'flex-start', mb: 2, ml: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 1 }}>
               {shopName} is typing...
            </Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #f1f5f9' }}>
        <Stack direction="row" spacing={1}>
          <TextField 
            fullWidth 
            placeholder="Type your response..."
            variant="outlined"
            size="small"
            value={text}
            disabled={loading || !shopId}
            multiline
            maxRows={4}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
          />

          <IconButton 
            disabled={!text.trim() || loading || !shopId}
            onClick={handleSend} 
            sx={{ 
              bgcolor: '#ec4899', 
              color: 'white', 
              alignSelf: 'flex-end',
              '&:hover': { bgcolor: '#db2777' },
              '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#cbd5e1' }
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default ChatWindow;