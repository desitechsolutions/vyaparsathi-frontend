import React from 'react';
import { 
  Box, Card, Typography, Stack, alpha, 
  LinearProgress, Tooltip, Divider, Chip
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import StarsIcon from '@mui/icons-material/Stars';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CreditCardIcon from '@mui/icons-material/CreditCard';

// Modern color palette
const theme = {
  primary: '#0f766e',
  primaryLight: '#14b8a6',
  secondary: '#7c3aed',
  danger: '#dc2626',
  warning: '#f59e0b',
  success: '#10b981',
  background: '#f8fafc',
  cardBg: '#ffffff',
  borderColor: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
};

const PaymentSummaryCards = ({ 
  totalDue, 
  selectedCustomer, 
  selectedSaleObj, 
  formatAmount, 
  advanceBalance, 
  isBulk,
  theme: themeProps
}) => {
  const customTheme = themeProps || theme;
  
  const paidPercentage = selectedSaleObj && selectedSaleObj.totalAmount > 0
    ? Math.min(100, Math.max(0, ((selectedSaleObj.totalAmount - selectedSaleObj.dueAmount) / selectedSaleObj.totalAmount) * 100))
    : 0;

  const cardBase = {
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
    border: `1.5px solid ${alpha(customTheme.primary, 0.15)}`,
    transition: 'all 0.3s ease',
    background: '#ffffff',
  };

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ mb: 4 }}>

      {/* ── Card 1: Balance Due ─────────────────────────────── */}
      <Card elevation={0} sx={{
        ...cardBase,
        boxShadow: `0 2px 8px ${alpha(customTheme.primary, 0.08)}`,
        '&:hover': { 
          boxShadow: `0 8px 24px ${alpha(customTheme.primary, 0.15)}`,
          transform: 'translateY(-2px)',
          borderColor: alpha(customTheme.primary, 0.3),
        },
      }}>
        {/* Gradient accent bar */}
        <Box sx={{ 
          height: 5, 
          background: `linear-gradient(90deg, ${customTheme.primary} 0%, ${customTheme.primaryLight} 100%)`
        }} />

        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={2.5} alignItems="flex-start">
            {/* Icon Container */}
            <Box sx={{
              p: 1.5, 
              borderRadius: 2.5, 
              flexShrink: 0,
              background: `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.primaryLight} 100%)`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${alpha(customTheme.primary, 0.3)}`,
            }}>
              <AccountBalanceWalletIcon sx={{ color: '#fff', fontSize: 26, fontWeight: 800 }} />
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
                <Typography variant="caption" sx={{
                  color: customTheme.textSecondary, 
                  fontWeight: 800,
                  textTransform: 'uppercase', 
                  letterSpacing: 1, 
                  display: 'block',
                  fontSize: '0.75rem'
                }}>
                  {selectedCustomer ? 'Outstanding Balance' : 'Total Outstanding'}
                </Typography>
                <Tooltip title={selectedCustomer ? 'Amount pending for this customer' : 'Total pending from all customers'} arrow>
                  <InfoOutlinedIcon sx={{ fontSize: 14, color: customTheme.textSecondary, opacity: 0.5 }} />
                </Tooltip>
              </Stack>
              
              <Typography component="p" sx={{ 
                fontWeight: 900, 
                color: totalDue > 0 ? '#dc2626' : customTheme.success, 
                lineHeight: 1.1, 
                fontSize: 'clamp(1.75rem, 5vw, 2.2rem)',
                letterSpacing: '-0.5px'
              }}>
                {formatAmount(totalDue)}
              </Typography>

              {/* Status indicator */}
              <Box sx={{ mt: 1.5 }}>
                {totalDue > 0 ? (
                  <Chip 
                    icon={<TrendingUpIcon />}
                    label={`${selectedCustomer ? 'Active' : 'Pending'} Due`}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: alpha('#dc2626', 0.1),
                      color: '#dc2626',
                      border: `1px solid ${alpha('#dc2626', 0.2)}`
                    }}
                  />
                ) : (
                  <Chip 
                    label="✓ No Outstanding"
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: alpha(customTheme.success, 0.1),
                      color: customTheme.success,
                      border: `1px solid ${alpha(customTheme.success, 0.2)}`
                    }}
                  />
                )}
              </Box>
            </Box>
          </Stack>

          {/* Advance Balance Section */}
          {selectedCustomer && (
            <>
              <Divider sx={{ my: 2.5, borderColor: alpha(customTheme.primary, 0.1) }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                  <Box sx={{
                    p: 0.75,
                    borderRadius: 1.5,
                    bgcolor: alpha(customTheme.success, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CreditCardIcon sx={{ fontSize: 16, color: customTheme.success }} />
                  </Box>
                  <Stack spacing={0.25}>
                    <Typography variant="caption" fontWeight={800} sx={{ 
                      color: customTheme.textSecondary,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      letterSpacing: 0.5
                    }}>
                      Advance Credit
                    </Typography>
                    <Tooltip title="Prepaid or credit balance available" arrow>
                      <Typography variant="caption" fontWeight={600} sx={{ color: customTheme.textSecondary, cursor: 'help' }}>
                        Available funds
                      </Typography>
                    </Tooltip>
                  </Stack>
                </Stack>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight={900} sx={{ 
                    color: customTheme.success,
                    fontSize: '1.3rem'
                  }}>
                    {formatAmount(Number(advanceBalance) || 0)}
                  </Typography>
                </Box>
              </Stack>
            </>
          )}
        </Box>
      </Card>

      {/* ── Card 2: Invoice / Bulk Context ──────────────────── */}
      <Card elevation={0} sx={{
        ...cardBase,
        boxShadow: `0 2px 8px ${alpha(isBulk ? customTheme.warning : customTheme.secondary, 0.08)}`,
        '&:hover': {
          boxShadow: `0 8px 24px ${alpha(isBulk ? customTheme.warning : customTheme.secondary, 0.15)}`,
          transform: 'translateY(-2px)',
          borderColor: alpha(isBulk ? customTheme.warning : customTheme.secondary, 0.3),
        },
      }}>
        {/* Gradient accent bar */}
        <Box sx={{
          height: 5,
          background: isBulk
            ? `linear-gradient(90deg, ${customTheme.warning} 0%, #fbbf24 100%)`
            : `linear-gradient(90deg, ${customTheme.secondary} 0%, #a78bfa 100%)`,
        }} />

        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={2.5} alignItems="flex-start">
            {/* Icon Container */}
            <Box sx={{
              p: 1.5, 
              borderRadius: 2.5, 
              flexShrink: 0,
              background: isBulk
                ? `linear-gradient(135deg, ${customTheme.warning} 0%, #fbbf24 100%)`
                : `linear-gradient(135deg, ${customTheme.secondary} 0%, #a78bfa 100%)`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${alpha(isBulk ? customTheme.warning : customTheme.secondary, 0.3)}`,
            }}>
              {isBulk
                ? <StarsIcon sx={{ color: '#fff', fontSize: 26, fontWeight: 800 }} />
                : <ReceiptLongIcon sx={{ color: '#fff', fontSize: 26, fontWeight: 800 }} />
              }
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {isBulk ? (
                <>
                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
                    <Typography variant="caption" sx={{
                      color: customTheme.textSecondary, 
                      fontWeight: 800,
                      textTransform: 'uppercase', 
                      letterSpacing: 1,
                      fontSize: '0.75rem'
                    }}>
                      Payment Mode
                    </Typography>
                    <Chip 
                      label="Bulk" 
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        bgcolor: alpha(customTheme.warning, 0.15),
                        color: customTheme.warning,
                        border: `1px solid ${alpha(customTheme.warning, 0.3)}`
                      }}
                    />
                  </Stack>
                  <Typography variant="h6" fontWeight={800} sx={{ 
                    color: customTheme.textPrimary, 
                    mt: 0.5,
                    fontSize: '1.1rem'
                  }}>
                    🎯 FIFO Settlement
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: customTheme.textSecondary, 
                    display: 'block',
                    mt: 1,
                    fontSize: '0.8rem'
                  }}>
                    Settling oldest invoices first. Excess held as advance credit.
                  </Typography>
                </>
              ) : selectedSaleObj ? (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5} sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{
                        color: customTheme.textSecondary, 
                        fontWeight: 800,
                        textTransform: 'uppercase', 
                        letterSpacing: 1,
                        display: 'block',
                        fontSize: '0.75rem'
                      }}>
                        Invoice Due
                      </Typography>
                      <Typography component="p" fontWeight={900} sx={{ 
                        color: '#dc2626', 
                        lineHeight: 1.1, 
                        mt: 0.5, 
                        fontSize: 'clamp(1.5rem, 4vw, 1.9rem)',
                        letterSpacing: '-0.5px'
                      }}>
                        {formatAmount(selectedSaleObj.dueAmount)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ 
                        color: customTheme.textSecondary, 
                        display: 'block',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        Total
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ 
                        color: customTheme.textPrimary,
                        fontSize: '1.15rem',
                        mt: 0.5
                      }}>
                        {formatAmount(selectedSaleObj.totalAmount)}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Progress Bar */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="caption" fontWeight={800} sx={{ 
                        fontSize: '0.75rem',
                        color: customTheme.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        Collection Progress
                      </Typography>
                      <Chip
                        label={`${Math.round(paidPercentage)}% Collected`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          bgcolor: alpha(customTheme.secondary, 0.1),
                          color: customTheme.secondary,
                          border: `1px solid ${alpha(customTheme.secondary, 0.2)}`
                        }}
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={paidPercentage}
                      sx={{
                        height: 7, 
                        borderRadius: 2.5,
                        bgcolor: alpha(customTheme.secondary, 0.12),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2.5,
                          background: `linear-gradient(90deg, ${customTheme.secondary} 0%, #a78bfa 100%)`,
                          boxShadow: `inset 0 1px 2px ${alpha('#fff', 0.2)}`
                        },
                      }}
                    />
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="caption" sx={{
                    color: customTheme.textSecondary, 
                    fontWeight: 800,
                    textTransform: 'uppercase', 
                    letterSpacing: 1,
                    display: 'block',
                    fontSize: '0.75rem'
                  }}>
                    Invoice Selection
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: customTheme.textSecondary, 
                    mt: 1, 
                    fontStyle: 'italic',
                    fontSize: '0.9rem'
                  }}>
                    📋 Select an invoice to view specific payment details
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