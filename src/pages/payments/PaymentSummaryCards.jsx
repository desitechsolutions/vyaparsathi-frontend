import React from 'react';
import { 
  Box, Card, Typography, Stack, alpha, 
  LinearProgress, Tooltip, Divider 
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import StarsIcon from '@mui/icons-material/Stars';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const PaymentSummaryCards = ({ totalDue, selectedCustomer, selectedSaleObj, formatAmount, advanceBalance, isBulk }) => {
  
  const paidPercentage = selectedSaleObj 
    ? ((selectedSaleObj.totalAmount - selectedSaleObj.dueAmount) / selectedSaleObj.totalAmount) * 100 
    : 0;

  // Shared card style for consistency
  const cardStyle = {
    flex: 1,
    p: 2, // Reduced padding
    borderRadius: 3, // Slightly tighter corners
    border: '1px solid #e2e8f0',
    bgcolor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)', // Subtle lift
    transition: 'transform 0.2s',
    '&:hover': { transform: 'translateY(-2px)' }
  };

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
      
      {/* 1. Customer Balance Card - Compact Metric Style */}
      <Card sx={{ ...cardStyle, borderLeft: '4px solid #6366f1' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#6366f1', 0.1), display: 'flex' }}>
            <AccountBalanceWalletIcon sx={{ color: '#6366f1', fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {selectedCustomer ? 'Balance Due' : 'Total Outstanding'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>
              {formatAmount(totalDue)}
            </Typography>
          </Box>
        </Stack>

        {selectedCustomer && (
          <Box sx={{ 
            mt: 1.5, px: 1.5, py: 0.75, 
            bgcolor: alpha('#10b981', 0.04), 
            borderRadius: 2, 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: `1px solid ${alpha('#10b981', 0.1)}`
          }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" fontWeight={800} color="#047857">Advance Wallet</Typography>
              <Tooltip title="Credit available in customer account">
                <InfoOutlinedIcon sx={{ fontSize: 12, color: '#047857', opacity: 0.5 }} />
              </Tooltip>
            </Stack>
            <Typography variant="body2" fontWeight={900} color="#059669">
              {formatAmount(Number(advanceBalance) || 0)}
            </Typography>
          </Box>
        )}
      </Card>

      {/* 2. Transaction Context Card - Streamlined Detail Style */}
      <Card sx={{ ...cardStyle, borderLeft: `4px solid ${isBulk ? '#f59e0b' : '#3b82f6'}` }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ height: '100%' }}>
          <Box sx={{ 
            p: 1, borderRadius: 2, 
            bgcolor: isBulk ? alpha('#f59e0b', 0.1) : alpha('#3b82f6', 0.1), 
            color: isBulk ? '#f59e0b' : '#3b82f6', 
            display: 'flex' 
          }}>
            {isBulk ? <StarsIcon sx={{ fontSize: 20 }} /> : <ReceiptLongIcon sx={{ fontSize: 20 }} />}
          </Box>

          <Box sx={{ flex: 1 }}>
            {isBulk ? (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase' }}>
                  Bulk Payment Mode
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} color="#b45309" sx={{ display: 'block' }}>
                  FIFO: Settling Oldest Invoices
                </Typography>
              </Box>
            ) : selectedSaleObj ? (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase' }}>
                      Invoice Due
                    </Typography>
                    <Typography variant="h6" fontWeight={900} color="#1e293b" sx={{ lineHeight: 1 }}>
                      {formatAmount(selectedSaleObj.dueAmount)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Invoice Total
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {formatAmount(selectedSaleObj.totalAmount)}
                    </Typography>
                  </Box>
                </Stack>
                
                <Box sx={{ mt: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={paidPercentage} 
                    sx={{ 
                      height: 4, borderRadius: 2, bgcolor: alpha('#3b82f6', 0.1),
                      '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: '#3b82f6' }
                    }} 
                  />
                  <Typography variant="caption" fontWeight={700} color="primary" sx={{ fontSize: '0.65rem', mt: 0.3, display: 'block' }}>
                    {Math.round(paidPercentage)}% COLLECTED
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                Select a sale to view specific details
              </Typography>
            )}
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
};

export default PaymentSummaryCards;