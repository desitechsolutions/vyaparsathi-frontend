import React from 'react';
import { Box, Card, Typography, Stack, Divider, Alert, Chip } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import StarsIcon from '@mui/icons-material/Stars';

const PaymentSummaryCards = ({ totalDue, selectedCustomer, selectedSaleObj, formatAmount, advanceBalance, isBulk }) => {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
      {/* Customer Card */}
      <Card sx={{ flex: 1, p: 3, borderRadius: 3, borderLeft: '6px solid #2e7d32', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
              {selectedCustomer ? 'Customer Balance' : 'Total Business Dues'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>{formatAmount(totalDue)}</Typography>
          </Box>
        </Stack>
        {selectedCustomer && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>Advance Balance:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#2e7d32' }}>
  {formatAmount(Number(advanceBalance) || 0)}
</Typography>
          </Box>
        )}
      </Card>

      {/* Mode Details Card */}
      <Card sx={{ flex: 2, p: 3, borderRadius: 3, borderLeft: `6px solid ${isBulk ? '#ed6c02' : '#1976d2'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <Stack direction="row" spacing={3} alignItems="center">
          {isBulk ? <StarsIcon sx={{ fontSize: 48, color: '#ed6c02' }} /> : <ReceiptLongIcon sx={{ fontSize: 48, color: '#1976d2' }} />}
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
              {isBulk ? "Waterfall Allocation Mode" : `Selected: ${selectedSaleObj?.invoiceNo || 'No Invoice Selected'}`}
            </Typography>
            {isBulk ? (
              <Typography variant="body2" color="text.secondary">
                Payment will be applied to the oldest dues first. Excess will move to <b>Advance Balance</b>.
              </Typography>
            ) : selectedSaleObj ? (
              <Stack direction="row" spacing={4} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="caption" display="block">Total Invoice</Typography>
                  <Typography variant="h6" fontWeight={700}>{formatAmount(selectedSaleObj.totalAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" display="block" color="error.main">Due Amount</Typography>
                  <Typography variant="h6" fontWeight={800} color="error.main">{formatAmount(selectedSaleObj.dueAmount)}</Typography>
                </Box>
              </Stack>
            ) : (
              <Typography variant="body2">Please select an invoice or choose Bulk mode below.</Typography>
            )}
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
};

export default PaymentSummaryCards;