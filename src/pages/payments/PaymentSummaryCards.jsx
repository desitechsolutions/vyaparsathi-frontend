import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const PaymentSummaryCards = ({
  totalDue,
  selectedSaleObj,
  totalAmount,
  paidAmount,
  dueAmount,
  formatAmount,
}) => (
  <Box sx={{
    my: 3,
    display: 'flex',
    gap: 3,
    flexWrap: { xs: 'wrap', md: 'nowrap' },
    justifyContent: 'center'
  }}>
    <Card
      raised
      sx={{
        minWidth: 220,
        borderRadius: '16px',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#fafafa',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <AccountBalanceWalletIcon sx={{ fontSize: 36, color: '#4caf50', mr: 2 }} />
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Total Customer Dues</Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>
          {formatAmount(totalDue)}
        </Typography>
      </Box>
    </Card>
    {selectedSaleObj && (
      <Card
        raised
        sx={{
          minWidth: 220,
          borderRadius: '16px',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#fafafa',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Sale Summary</Typography>
          <Typography variant="body2">Invoice: <b>{selectedSaleObj.invoiceNo}</b></Typography>
          <Typography variant="body2">Total: {formatAmount(totalAmount)}</Typography>
          <Typography variant="body2">Paid: {formatAmount(paidAmount)}</Typography>
          <Typography variant="body2" color="error">Due: {formatAmount(dueAmount)}</Typography>
        </Box>
      </Card>
    )}
  </Box>
);

export default PaymentSummaryCards;