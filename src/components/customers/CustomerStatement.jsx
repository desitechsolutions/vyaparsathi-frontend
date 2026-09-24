import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Stack,
  TextField,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ReceiptLong as ReceiptLongIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { fetchCustomerStatement, fetchCustomerLedger } from '../../services/api';
import { inr } from '../../utils/customerFormat';

/**
 * Enterprise double-entry customer statement table with standard B2B trade ledger rules:
 * - SALE / INVOICE / DEBIT_NOTE => Debit (Dr) (increases receivable owed by customer)
 * - PAYMENT / RECEIPT / CREDIT_NOTE => Credit (Cr) (decreases receivable)
 * - Running Balance = Previous Balance + Debit - Credit
 */
export default function CustomerStatement({ customerId, onDownloadPdf }) {
  const theme = useTheme();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      // Primary: unified statement endpoint matching PDF builder
      const stmt = await fetchCustomerStatement(customerId, params);
      setStatementData(stmt);
    } catch (err) {
      console.warn('Statement endpoint error, attempting ledger fallback:', err);
      try {
        const legacyParams = {};
        if (dateFrom) legacyParams.startDate = `${dateFrom}T00:00:00`;
        if (dateTo) legacyParams.endDate = `${dateTo}T23:59:59`;
        const resp = await fetchCustomerLedger(customerId, legacyParams);
        const rawEntries = resp.data || [];

        // Normalize legacy entries to standard double-entry format
        const lines = rawEntries.map((e) => {
          const desc = e.description || '';
          const isSale = e.type === 'INVOICE' || e.type === 'SALE' || e.type === 'DEBIT_NOTE'
            || (e.type === 'CREDIT' && (desc.startsWith('Sale #') || desc.toLowerCase().includes('invoice')));
          const amt = Number(e.amount || 0);

          return {
            date: e.createdAt ? e.createdAt.split('T')[0] : null,
            reference: desc.replace(/^Sale #|^Payment for /i, '').trim(),
            description: desc || 'Ledger transaction',
            type: isSale ? 'INVOICE' : 'PAYMENT',
            debit: isSale ? amt : 0,
            credit: !isSale ? amt : 0,
          };
        });

        // Compute running balance
        let running = 0;
        const processedLines = lines.map((line) => {
          running = running + line.debit - line.credit;
          return { ...line, runningBalance: running };
        });

        const totalInvoiced = processedLines.reduce((s, l) => s + l.debit, 0);
        const totalPaid = processedLines.reduce((s, l) => s + l.credit, 0);

        setStatementData({
          lines: processedLines,
          openingBalance: 0,
          closingBalance: running,
          totalInvoiced,
          totalPaid,
          totalCredits: 0,
        });
      } catch (fallbackErr) {
        console.error('Failed to load statement or ledger:', fallbackErr);
        setStatementData({ lines: [], openingBalance: 0, closingBalance: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [customerId, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived calculations
  const lines = statementData?.lines || [];
  const openingBal = Number(statementData?.openingBalance || 0);
  const closingBal = Number(statementData?.closingBalance || 0);
  const totalDebits = statementData?.totalInvoiced ?? lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  // Use explicit undefined check — the sum of totalPaid + totalCredits can legitimately be 0
  // (no payments received yet), and the previous `||` would fall through to the reduce fallback,
  // double-counting credits from statement lines when the server already returned 0.
  const totalCredits = (statementData?.totalPaid !== undefined || statementData?.totalCredits !== undefined)
    ? (statementData?.totalPaid ?? 0) + (statementData?.totalCredits ?? 0)
    : lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

  // Helper for badge labels and colors
  const getBadgeConfig = (type = '', desc = '') => {
    const t = (type || '').toUpperCase();
    if (t === 'INVOICE' || t === 'SALE') {
      return { label: 'INVOICE', color: 'warning' };
    }
    if (t === 'DEBIT_NOTE' || t === 'LEDGER_DEBIT') {
      return { label: 'DEBIT NOTE', color: 'warning' };
    }
    if (t === 'PAYMENT' || t === 'RECEIPT') {
      return { label: 'PAYMENT', color: 'success' };
    }
    if (t === 'CREDIT_NOTE' || t === 'LEDGER_CREDIT') {
      return { label: 'CREDIT NOTE', color: 'info' };
    }
    if (t === 'OPENING') {
      return { label: 'OPENING', color: 'default' };
    }
    return { label: t || 'ENTRY', color: 'default' };
  };

  return (
    <Box>
      {/* ─── Controls & Actions ────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Running Statement of Account
        </Typography>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            type="date"
            label="From"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 140 }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 140 }}
          />
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={loadData}>
            Filter
          </Button>
          {onDownloadPdf && (
            <Button variant="contained" size="small" startIcon={<PictureAsPdfIcon />} onClick={onDownloadPdf}>
              Download PDF
            </Button>
          )}
        </Stack>
      </Stack>

      {/* ─── KPI Summary Strip ───────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem', display: 'block' }}>
              Opening Balance
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5, fontSize: '1.1rem' }}>
              {inr(Math.abs(openingBal))} {openingBal > 0 ? 'Dr' : openingBal < 0 ? 'Cr' : ''}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem', display: 'block' }}>
              Total Debits (Dr)
            </Typography>
            <Typography variant="h6" fontWeight={800} color="error.main" sx={{ mt: 0.5, fontSize: '1.1rem' }}>
              {inr(totalDebits)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem', display: 'block' }}>
              Total Credits (Cr)
            </Typography>
            <Typography variant="h6" fontWeight={800} color="success.main" sx={{ mt: 0.5, fontSize: '1.1rem' }}>
              {inr(totalCredits)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.75,
              borderRadius: 2,
              borderColor: closingBal > 0 ? alpha(theme.palette.error.main, 0.4) : 'divider',
              bgcolor: closingBal > 0 ? alpha(theme.palette.error.main, 0.04) : 'background.paper',
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem', display: 'block' }}>
              Closing Balance
            </Typography>
            <Typography variant="h6" fontWeight={800} color={closingBal > 0 ? 'error.main' : 'text.primary'} sx={{ mt: 0.5, fontSize: '1.1rem' }}>
              {inr(Math.abs(closingBal))} {closingBal > 0 ? 'Dr (Due)' : closingBal < 0 ? 'Cr (Advance)' : 'Settled'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ─── Statement Ledger Table ───────────────────────────────────── */}
      {loading ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <CircularProgress size={32} />
        </Box>
      ) : lines.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <WalletIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No statement transactions found in the selected period.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Particulars / Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main', whiteSpace: 'nowrap' }}>
                  Debit (Dr)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main', whiteSpace: 'nowrap' }}>
                  Credit (Cr)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Running Balance
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((row, idx) => {
                const debit = Number(row.debit || 0);
                const credit = Number(row.credit || 0);
                const running = Number(row.runningBalance ?? 0);
                const badge = getBadgeConfig(row.type, row.description);

                return (
                  <TableRow
                    key={idx}
                    hover
                    sx={{
                      '&:nth-of-type(even)': { bgcolor: 'action.hover' },
                      ...(row.type === 'OPENING' && { bgcolor: alpha(theme.palette.primary.main, 0.05) }),
                    }}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                      {row.date ? new Date(row.date).toLocaleDateString('en-IN') : '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>
                      {row.reference && (
                        <Typography variant="body2" component="span" sx={{ fontWeight: 700, mr: 1, fontFamily: 'monospace' }}>
                          {row.reference}
                        </Typography>
                      )}
                      <Typography variant="body2" component="span" color="text.secondary">
                        {row.description || 'Transaction'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={badge.label}
                        color={badge.color}
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: debit > 0 ? 'error.main' : 'text.disabled' }}>
                      {debit > 0 ? inr(debit) : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: credit > 0 ? 'success.main' : 'text.disabled' }}>
                      {credit > 0 ? inr(credit) : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {inr(Math.abs(running))} {running > 0 ? 'Dr' : running < 0 ? 'Cr' : ''}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
