import React from 'react';
import { Box, Typography, CircularProgress, Paper, Divider, Chip, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Autocomplete, TextField, Button, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const PaymentHistory = ({ loading, paymentHistory, customers, selectedCustomer, onCustomerChange, onRefresh, formatAmount }) => (
  <Paper sx={{ p: 3, borderRadius: 3 }}>
    <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
      <Autocomplete
        options={customers}
        getOptionLabel={o => o.name}
        value={selectedCustomer}
        onChange={(_, v) => onCustomerChange(v)}
        sx={{ width: 300 }}
        renderInput={(params) => <TextField {...params} label="Filter by Customer" size="small" />}
      />
      <Button startIcon={<RefreshIcon />} onClick={onRefresh} variant="outlined">Refresh</Button>
    </Stack>
    
    <Divider sx={{ mb: 0 }} />
    
    <TableContainer sx={{ maxHeight: 500 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
          ) : paymentHistory.length === 0 ? (
            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>No payments recorded for this selection.</TableCell></TableRow>
          ) : (
            paymentHistory.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                <TableCell>#{p.invoiceNumber}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{formatAmount(p.amount)}</TableCell>
                <TableCell><Chip label={p.paymentMethod} size="small" variant="outlined" /></TableCell>
                <TableCell>{p.transactionId || p.reference || '-'}</TableCell>
                <TableCell>
                  <Chip label={p.status} color={p.status === 'SUCCESS' ? 'success' : 'error'} size="small" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

export default PaymentHistory;