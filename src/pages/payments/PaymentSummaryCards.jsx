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
  
  const paidPercentage = selectedSaleObj && selectedSaleObj.totalAmount > 0
    ? Math.min(100, Math.max(0, ((selectedSaleObj.totalAmount - selectedSaleObj.dueAmount) / selectedSaleObj.totalAmount) * 100))
    : 0;

  const cardBase = {
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    transition: 'box-shadow 0.2s, transform 0.2s',
  };

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ mb: 3 }}>

      {/* ── Card 1: Balance Due ─────────────────────────────── */}
      <Card elevation={0} sx={{
        ...cardBase,
        boxShadow: '0 4px 20px rgba(99,102,241,0.10)',
        '&:hover': { boxShadow: '0 8px 28px rgba(99,102,241,0.16)', transform: 'translateY(-1px)' },
      }}>
        {/* Gradient accent bar */}
        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)' }} />

        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{
              p: 1.25, borderRadius: 2.5, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.30)',
            }}>
              <AccountBalanceWalletIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" sx={{
                color: '#64748b', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.8, display: 'block',
              }}>
                {selectedCustomer ? 'Balance Due' : 'Total Outstanding'}
              </Typography>
              <Typography component="p" sx={{ fontWeight: 900, color: '#1e293b', lineHeight: 1.15, mt: 0.25, fontSize: '2rem' }}>
                {formatAmount(totalDue)}
              </Typography>
            </Box>
          </Stack>

          {selectedCustomer && (
            <>
              <Divider sx={{ my: 1.75, borderColor: '#f1f5f9' }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#047857' }}>
                    Advance Wallet
                  </Typography>
                  <Tooltip title="Credit available in customer account">
                    <InfoOutlinedIcon sx={{ fontSize: 13, color: '#047857', opacity: 0.55 }} />
                  </Tooltip>
                </Stack>
                <Typography variant="body2" fontWeight={900} sx={{ color: '#059669' }}>
                  {formatAmount(Number(advanceBalance) || 0)}
                </Typography>
              </Stack>
            </>
          )}
        </Box>
      </Card>

      {/* ── Card 2: Invoice / Bulk Context ──────────────────── */}
      <Card elevation={0} sx={{
        ...cardBase,
        boxShadow: `0 4px 20px ${alpha(isBulk ? '#f59e0b' : '#3b82f6', 0.10)}`,
        '&:hover': {
          boxShadow: `0 8px 28px ${alpha(isBulk ? '#f59e0b' : '#3b82f6', 0.18)}`,
          transform: 'translateY(-1px)',
        },
      }}>
        {/* Gradient accent bar */}
        <Box sx={{
          height: 4,
          background: isBulk
            ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
            : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
        }} />

        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{
              p: 1.25, borderRadius: 2.5, flexShrink: 0,
              background: isBulk
                ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${alpha(isBulk ? '#f59e0b' : '#3b82f6', 0.30)}`,
            }}>
              {isBulk
                ? <StarsIcon sx={{ color: '#fff', fontSize: 22 }} />
                : <ReceiptLongIcon sx={{ color: '#fff', fontSize: 22 }} />
              }
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              {isBulk ? (
                <>
                  <Typography variant="caption" sx={{
                    color: '#64748b', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 0.8, display: 'block',
                  }}>
                    Bulk Payment Mode
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#b45309', mt: 0.25 }}>
                    FIFO: Settling Oldest Invoices
                  </Typography>
                </>
              ) : selectedSaleObj ? (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="caption" sx={{
                        color: '#64748b', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: 0.8, display: 'block',
                      }}>
                        Invoice Due
                      </Typography>
                      <Typography component="p" fontWeight={900} sx={{ color: '#1e293b', lineHeight: 1.15, mt: 0.25, fontSize: '2rem' }}>
                        {formatAmount(selectedSaleObj.dueAmount)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Invoice Total
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#475569' }}>
                        {formatAmount(selectedSaleObj.totalAmount)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ mt: 1.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={paidPercentage}
                      sx={{
                        height: 6, borderRadius: 3,
                        bgcolor: alpha('#3b82f6', 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                        },
                      }}
                    />
                    <Typography variant="caption" fontWeight={800} sx={{
                      fontSize: '0.65rem', mt: 0.5, display: 'block', color: '#3b82f6',
                    }}>
                      {Math.round(paidPercentage)}% COLLECTED
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="caption" sx={{
                    color: '#64748b', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 0.8, display: 'block',
                  }}>
                    Invoice Context
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.25, fontStyle: 'italic' }}>
                    Select a sale to view specific details
                  </Typography>
                </>
              )}
            </Box>
          </Stack>
        </Box>
      </Card>
    </Stack>
  );
};

export default PaymentSummaryCards;