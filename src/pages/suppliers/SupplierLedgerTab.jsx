import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Button,
  Chip, CircularProgress, Alert, Stack, Snackbar
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import { fetchSupplierStatement } from '../../services/api';

const SupplierLedgerTab = ({ supplierId, supplierName }) => {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadStatement = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupplierStatement(
        supplierId,
        startDate ? `${startDate}T00:00:00` : null,
        endDate ? `${endDate}T23:59:59` : null
      );
      setStatement(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load supplier ledger statement.');
    } finally {
      setLoading(false);
    }
  }, [supplierId, startDate, endDate]);

  useEffect(() => {
    loadStatement();
  }, [loadStatement]);

  const handlePrint = () => {
    window.print();
  };

  const getTxColor = (type) => {
    switch (type) {
      case 'PURCHASE_ORDER': return 'info';
      case 'PAYMENT': return 'success';
      case 'PURCHASE_RETURN': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* 1. Date Range Controls & Actions */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={6}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadStatement}
                disabled={loading}
              >
                Filter
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                disabled={loading || !statement}
              >
                Print Statement
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : statement ? (
        <Box>
          {/* 2. Summary Metric Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ py: '16px !important' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>OPENING BALANCE</Typography>
                  <Typography variant="h6" fontWeight={700}>₹{statement.openingBalance?.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card variant="outlined" sx={{ borderRadius: 2, borderLeft: '4px solid #0288d1' }}>
                <CardContent sx={{ py: '16px !important' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ReceiptIcon color="info" fontSize="small" />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL BILLED</Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight={700} color="info.main">₹{statement.totalBilled?.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card variant="outlined" sx={{ borderRadius: 2, borderLeft: '4px solid #2e7d32' }}>
                <CardContent sx={{ py: '16px !important' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PaymentIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL PAID</Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight={700} color="success.main">₹{statement.totalPaid?.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card variant="outlined" sx={{ borderRadius: 2, borderLeft: '4px solid #ed6c02' }}>
                <CardContent sx={{ py: '16px !important' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AssignmentReturnIcon color="warning" fontSize="small" />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL RETURNED</Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight={700} color="warning.main">₹{statement.totalReturned?.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'primary.soft', borderLeft: '4px solid #1976d2' }}>
                <CardContent sx={{ py: '16px !important' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccountBalanceWalletIcon color="primary" fontSize="small" />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>NET PAYABLE</Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight={800} color="primary.main">₹{statement.closingBalance?.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 3. Statement Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Ref #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>Debit (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>Credit (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>Running Balance (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statement.statementEntries?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No transactions recorded in this date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  statement.statementEntries?.map((entry, index) => (
                    <TableRow key={index} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
                      <TableCell sx={{ color: 'text.primary' }}>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.transactionType?.replace('_', ' ')}
                          color={getTxColor(entry.transactionType)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{entry.referenceNo || '-'}</TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{entry.description}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {entry.debitAmount > 0 ? `₹${entry.debitAmount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                        {entry.creditAmount > 0 ? `₹${entry.creditAmount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        ₹{entry.runningBalance?.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : null}

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setError('')} sx={{ borderRadius: 2, fontWeight: 700 }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SupplierLedgerTab;
