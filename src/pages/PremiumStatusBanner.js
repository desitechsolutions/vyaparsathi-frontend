import React, { useState } from 'react';
import { Box, Paper, Typography, Collapse, IconButton, Stack } from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useSubscription } from '../context/SubscriptionContext';

export default function PremiumStatusBanner() {
  const { subscription, getStatus, loading } = useSubscription();
  const [expanded, setExpanded] = useState(false);

  if (loading || getStatus() !== 'PENDING') return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Paper
        elevation={0}
        onClick={() => setExpanded(!expanded)}
        sx={{
          cursor: 'pointer',
          borderRadius: expanded ? '16px' : '30px',
          border: '1px solid #fed7aa',
          bgcolor: '#fff7ed',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': { bgcolor: '#ffedd5' }
        }}
      >
        {/* The "Collapsed" Mini-Bar */}
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="space-between" 
          sx={{ px: 2, py: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <HourglassEmptyIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: '#9a3412', fontWeight: 800, letterSpacing: 0.5 }}>
              VERIFICATION IN PROGRESS
            </Typography>
          </Stack>
          
          <Stack direction="row" alignItems="center" spacing={1}>
             {!expanded && (
               <Typography variant="caption" sx={{ color: '#c2410c', opacity: 0.8 }}>
                 View Details
               </Typography>
             )}
             {expanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
          </Stack>
        </Stack>

        {/* The "Expanded" Content */}
        <Collapse in={expanded}>
          <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: '1px dashed #fdba74' }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <InfoOutlinedIcon sx={{ color: '#f59e0b', mt: 0.5 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#7c2d12', fontWeight: 600 }}>
                  UTR: {subscription?.lastUtr || 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9a3412', display: 'block', mt: 0.5 }}>
                  Our team is manually verifying this transaction with HDFC. 
                  Your <strong>{subscription?.tier}</strong> features will unlock within 1-2 hours.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}