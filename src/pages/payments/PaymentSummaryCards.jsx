import React from 'react';
import {
  Box,
  Card,
  Typography,
  Stack,
  Divider,
  Alert
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const PaymentSummaryCards = ({
  totalDue,
  selectedCustomer,        // ✅ NEW
  selectedSaleObj,
  formatAmount,
  remainingBalance = 0,
  isOverpaid = false,
}) => {
  const safeTotal = totalDue ?? 0;
  const safeRemaining = remainingBalance >= 0 ? remainingBalance : 0;
  const excess = isOverpaid ? Math.abs(remainingBalance) : 0;

  const isCustomerView = Boolean(selectedCustomer);

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={3}
      sx={{ mb: 4 }}
    >
      {/* LEFT CARD — BUSINESS / CUSTOMER DUES */}
      <Card
        sx={{
          flex: 1,
          p: 3,
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#ffffff',
          borderRadius: 3,
          borderLeft: `6px solid ${isCustomerView ? '#2e7d32' : '#d32f2f'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <AccountBalanceWalletIcon
          sx={{
            fontSize: 48,
            color: isCustomerView ? '#2e7d32' : '#d32f2f',
            mr: 3
          }}
        />
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 600, letterSpacing: 0.5 }}
          >
            {isCustomerView ? 'Customer Total Dues' : 'Total Business Dues'}
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: '#1a237e' }}
          >
            {formatAmount(safeTotal)}
          </Typography>

          {isCustomerView && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block' }}
            >
              Customer: {selectedCustomer?.name || '—'}
            </Typography>
          )}
        </Box>
      </Card>

      {/* RIGHT CARD — SELECTED SALE */}
      {selectedSaleObj ? (
        <Card
          sx={{
            flex: 2,
            p: 3,
            bgcolor: '#ffffff',
            borderRadius: 3,
            borderLeft: '6px solid #1976d2',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center">
            <ReceiptLongIcon
              sx={{ fontSize: 48, color: '#1976d2' }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 600, letterSpacing: 0.5 }}
              >
                Selected Sale: {selectedSaleObj.invoiceNo || '—'}
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                divider={
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ mx: 3 }}
                  />
                }
                spacing={3}
                sx={{ mt: 2 }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatAmount(selectedSaleObj.totalAmount || 0)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Already Paid
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: 'success.main' }}
                  >
                    {formatAmount(selectedSaleObj.paidAmount || 0)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Balance Due
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: isOverpaid ? 'error.main' : 'success.main'
                    }}
                  >
                    {formatAmount(safeRemaining)}
                  </Typography>

                  {isOverpaid && (
                    <Alert
                      severity="error"
                      variant="outlined"
                      sx={{ mt: 1, py: 0.5, borderRadius: 2 }}
                      icon={false}
                    >
                      + {formatAmount(excess)} Excess
                    </Alert>
                  )}
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Card>
      ) : (
        <Card
          sx={{
            flex: 2,
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f8f9fa',
            borderRadius: 3,
            borderLeft: '6px solid #9e9e9e',
          }}
        >
          <Typography variant="subtitle1" color="text.secondary">
            Select a sale / invoice to view details
          </Typography>
        </Card>
      )}
    </Stack>
  );
};

export default PaymentSummaryCards;
