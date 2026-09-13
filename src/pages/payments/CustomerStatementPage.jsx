/**
 * CustomerStatementPage.jsx — Phase 3C
 *
 * Standalone customer account-statement page (double-entry ledger style).
 *
 * Features:
 *   - Customer Autocomplete selector
 *   - Date range picker (From / To)
 *   - Statement preview: header, opening balance, ledger table, closing balance
 *   - Generate PDF (authenticated blob download via existing helper)
 *   - Email to customer (reuses CustomerEmailDialog component)
 *   - Loading skeleton while fetching
 *   - Running balance calculation from raw ledger entries
 *   - Mobile responsive
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box, Button, Container, Typography, Stack, Paper, Grid, Card,
  CardContent, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton, Chip, Snackbar, Alert, Autocomplete,
  Divider, IconButton, Tooltip, alpha, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Icons
import ArrowBackIcon          from '@mui/icons-material/ArrowBack';
import AccountBalanceIcon     from '@mui/icons-material/AccountBalance';
import PictureAsPdfIcon       from '@mui/icons-material/PictureAsPdf';
import EmailIcon              from '@mui/icons-material/Email';
import SearchIcon             from '@mui/icons-material/Search';
import RefreshIcon            from '@mui/icons-material/Refresh';
import TrendingUpIcon         from '@mui/icons-material/TrendingUp';
import TrendingDownIcon       from '@mui/icons-material/TrendingDown';
import ReceiptLongIcon        from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Services & hooks
import {
  fetchCustomers,
  fetchCustomerLedger,
  downloadCustomerStatementPdf,
} from '../../services/api';
import { useAppPalette }      from '../../hooks/useAppPalette';
import { CustomerEmailDialog } from '../../components/customers/CustomerEmailDialog';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (amt) =>
  `₹${(Number(amt) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const today = () => new Date().toISOString().split('T')[0];

const firstOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

/** Human-readable transaction type label. */
const txLabel = (type = '') =>
  ({
    SALE: 'Invoice',
    PAYMENT: 'Payment',
    REFUND: 'Refund',
    CREDIT_NOTE: 'Credit Note',
    DEBIT_NOTE: 'Debit Note',
    ADJUSTMENT: 'Adjustment',
    ADVANCE: 'Advance',
    OPENING_BALANCE: 'Opening Balance',
  }[type] ?? type.replace(/_/g, ' '));

const txColor = (type = '') => {
  if (['SALE', 'DEBIT_NOTE', 'ADJUSTMENT'].includes(type)) return 'warning';
  if (['PAYMENT', 'REFUND', 'CREDIT_NOTE', 'ADVANCE'].includes(type)) return 'success';
  return 'default';
};

// ── Main Component ────────────────────────────────────────────────────────────

const CustomerStatementPage = () => {
  const navigate  = useNavigate();
  const palette   = useAppPalette();
  const muiTheme  = useTheme();
  const isMobile  = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // ── State ────────────────────────────────────────────────────────────────
  const [customers,       setCustomers]       = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [startDate,  setStartDate]  = useState(firstOfMonth);
  const [endDate,    setEndDate]    = useState(today);

  const [entries,    setEntries]    = useState([]);
  const [fetched,    setFetched]    = useState(false); // true after at least one successful load
  const [loading,    setLoading]    = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailOpen,  setEmailOpen]  = useState(false);
  const [snackbar,   setSnackbar]   = useState({ open: false, msg: '', severity: 'success' });

  // ── Derived: balance calculations ─────────────────────────────────────
  const balances = useMemo(() => {
    if (!entries.length) return { openingBalance: 0, closingBalance: 0, totalDebit: 0, totalCredit: 0 };
    const totalDebit   = entries.reduce((s, e) => s + (e.debitAmount  || 0), 0);
    const totalCredit  = entries.reduce((s, e) => s + (e.creditAmount || 0), 0);
    const closingBalance  = entries[entries.length - 1].runningBalance ?? 0;
    // openingBalance = closingBalance − totalDebit + totalCredit
    const openingBalance  = closingBalance - totalDebit + totalCredit;
    return { openingBalance, closingBalance, totalDebit, totalCredit };
  }, [entries]);

  // ── Load customer list (once on mount) ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchCustomers();
        if (!cancelled) setCustomers(res.data || []);
      } catch {
        // non-critical — autocomplete just shows empty
      } finally {
        if (!cancelled) setCustomersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Load statement ledger ─────────────────────────────────────────────
  const loadStatement = useCallback(async () => {
    if (!selectedCustomer?.id) return;
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = `${startDate}T00:00:00`;
      if (endDate)   params.endDate   = `${endDate}T23:59:59`;
      const resp = await fetchCustomerLedger(selectedCustomer.id, params);
      setEntries(resp.data || []);
      setFetched(true);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load ledger entries.';
      setSnackbar({ open: true, msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, startDate, endDate]);

  // Auto-load when customer changes
  useEffect(() => {
    if (selectedCustomer) loadStatement();
    else { setEntries([]); setFetched(false); }
  }, [selectedCustomer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PDF download ──────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!selectedCustomer) return;
    setPdfLoading(true);
    try {
      await downloadCustomerStatementPdf(
        selectedCustomer.id,
        startDate || null,
        endDate   || null,
      );
      setSnackbar({ open: true, msg: 'Statement PDF downloaded.', severity: 'success' });
    } catch (err) {
      const msg = err?.response?.status === 401
        ? 'Session expired. Please sign in again.'
        : err?.response?.data?.message || 'Could not generate PDF.';
      setSnackbar({ open: true, msg, severity: 'error' });
    } finally {
      setPdfLoading(false);
    }
  };

  const showSnackbar = (msg, severity = 'success') =>
    setSnackbar({ open: true, msg, severity });

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ══ PAGE HEADER ══════════════════════════════════════════════════════ */}
      <Box
        component="header"
        sx={{
          background: palette.headerGradient,
          color: '#fff',
          boxShadow: `0 4px 24px ${alpha(palette.primary, 0.25)}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                color: '#fff', textTransform: 'none', fontWeight: 700, minHeight: 44,
                borderRadius: 2, px: 1.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', transform: 'translateX(-2px)' },
                transition: 'all 0.2s ease',
              }}
            >
              {!isMobile && 'Back'}
            </Button>

            <Box sx={{ p: 0.875, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <AccountBalanceIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#fff', lineHeight: 1.1, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                Customer Account Statement
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>
                Double-entry ledger · PDF export · Email delivery
              </Typography>
            </Box>

            {/* Action buttons — visible in header once a customer is selected */}
            {selectedCustomer && !loading && fetched && (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Email statement to customer">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EmailIcon />}
                    onClick={() => setEmailOpen(true)}
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', textTransform: 'none', fontWeight: 700, display: { xs: 'none', md: 'flex' } }}
                  >
                    Email
                  </Button>
                </Tooltip>
                <Tooltip title="Download statement as PDF">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, display: { xs: 'none', md: 'flex' } }}
                  >
                    {pdfLoading ? 'Generating…' : 'PDF'}
                  </Button>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>

      {/* ══ PAGE BODY ════════════════════════════════════════════════════════ */}
      <Box component="main" sx={{ flex: 1, py: { xs: 3, md: 4 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>

          {/* ── Controls ──────────────────────────────────────────────────── */}
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3, borderColor: 'divider' }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: 'text.primary' }}>
              Statement Parameters
            </Typography>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={5}>
                <Autocomplete
                  options={customers}
                  loading={customersLoading}
                  getOptionLabel={(o) => o.name || ''}
                  isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
                  value={selectedCustomer}
                  onChange={(_, v) => setSelectedCustomer(v)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Customer"
                      size="small"
                      placeholder="Search customer by name…"
                      InputProps={{ ...params.InputProps, startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.disabled', fontSize: 18 }} /> }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6} md={2.5}>
                <TextField
                  label="From Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={6} md={2.5}>
                <TextField
                  label="To Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={loadStatement}
                  disabled={!selectedCustomer || loading}
                  sx={{ height: 40, fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                >
                  {loading ? 'Loading…' : 'Generate'}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* ── Loading skeleton ──────────────────────────────────────────── */}
          {loading && <StatementSkeleton />}

          {/* ── Empty state ────────────────────────────────────────────────── */}
          {!loading && !fetched && (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <AccountBalanceIcon sx={{ fontSize: 56, mb: 2, opacity: 0.25 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>Select a customer to view their statement</Typography>
              <Typography variant="body2">Choose a customer above, then click Generate to load the ledger.</Typography>
            </Box>
          )}

          {/* ── Statement preview ─────────────────────────────────────────── */}
          {!loading && fetched && (
            <>
              {/* Statement header */}
              <Paper
                variant="outlined"
                sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3, borderColor: 'divider' }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={1}
                >
                  <Box>
                    <Typography variant="overline" color="text.secondary" fontWeight={700} fontSize="0.7rem">
                      Account Statement
                    </Typography>
                    <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ lineHeight: 1.2 }}>
                      {selectedCustomer?.name}
                    </Typography>
                    {selectedCustomer?.phone && (
                      <Typography variant="body2" color="text.secondary">{selectedCustomer.phone}</Typography>
                    )}
                    {selectedCustomer?.email && (
                      <Typography variant="body2" color="text.secondary">{selectedCustomer.email}</Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Period: {fmtDate(startDate)} — {fmtDate(endDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Statement Date: {fmtDate(today())}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Summary cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <SummaryCard icon={<AccountBalanceWalletIcon color="inherit" />} label="Opening Balance" value={fmt(balances.openingBalance)} accent="#6366f1" />
                <SummaryCard icon={<TrendingUpIcon color="inherit" />}           label="Total Debit"     value={fmt(balances.totalDebit)}    accent="#ef4444" />
                <SummaryCard icon={<TrendingDownIcon color="inherit" />}         label="Total Credit"    value={fmt(balances.totalCredit)}   accent="#22c55e" />
                <SummaryCard icon={<ReceiptLongIcon color="inherit" />}          label="Closing Balance" value={fmt(balances.closingBalance)} accent="#0ea5e9" highlight />
              </Grid>

              {/* Ledger table */}
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 3, borderColor: 'divider', mb: 3, overflowX: 'auto' }}
              >
                <Table size="small" sx={{ minWidth: 640 }}>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main', whiteSpace: 'nowrap' }}>Debit (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main', whiteSpace: 'nowrap' }}>Credit (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Balance (₹)</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {/* Opening balance row */}
                    <TableRow sx={{ bgcolor: alpha('#6366f1', 0.06) }}>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{fmtDate(startDate)}</TableCell>
                      <TableCell><Chip label="Opening" size="small" sx={{ fontSize: '0.7rem', fontWeight: 700 }} /></TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Opening Balance</TableCell>
                      <TableCell align="right" />
                      <TableCell align="right" />
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(balances.openingBalance)}</TableCell>
                    </TableRow>

                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No transactions in this date range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map((entry, idx) => (
                        <TableRow
                          key={idx}
                          hover
                          sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}
                        >
                          <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                            {fmtDate(entry.date || entry.transactionDate)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={txLabel(entry.transactionType)}
                              color={txColor(entry.transactionType)}
                              size="small"
                              sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.82rem' }}>
                            <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                              {entry.referenceNo ? `#${entry.referenceNo}` : ''}
                            </Typography>
                            {entry.referenceNo && entry.description && ' — '}
                            {entry.description || '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600, fontSize: '0.82rem' }}>
                            {(entry.debitAmount > 0) ? fmt(entry.debitAmount) : '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.82rem' }}>
                            {(entry.creditAmount > 0) ? fmt(entry.creditAmount) : '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            {fmt(entry.runningBalance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {/* Closing balance row */}
                    <TableRow sx={{ bgcolor: alpha('#0ea5e9', 0.06) }}>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{fmtDate(endDate)}</TableCell>
                      <TableCell><Chip label="Closing" size="small" color="primary" sx={{ fontSize: '0.7rem', fontWeight: 700 }} /></TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Closing Balance</TableCell>
                      <TableCell align="right" />
                      <TableCell align="right" />
                      <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.9rem' }}>
                        {fmt(balances.closingBalance)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Mobile action buttons */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={() => setEmailOpen(true)}
                  sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                >
                  Email to Customer
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                >
                  {pdfLoading ? 'Generating PDF…' : 'Generate PDF'}
                </Button>
              </Stack>
            </>
          )}
        </Container>
      </Box>

      {/* ══ EMAIL DIALOG ═══════════════════════════════════════════════════════ */}
      <CustomerEmailDialog
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        customerId={selectedCustomer?.id}
        customerName={selectedCustomer?.name}
        customerEmail={selectedCustomer?.email}
        onSuccess={(msg) => showSnackbar(msg)}
      />

      {/* ══ TOAST ══════════════════════════════════════════════════════════════ */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          sx={{ borderRadius: 2.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SummaryCard = ({ icon, label, value, accent, highlight }) => (
  <Grid item xs={6} sm={3}>
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderLeft: `4px solid ${accent}`,
        ...(highlight && { bgcolor: alpha(accent, 0.06) }),
      }}
    >
      <CardContent sx={{ py: '14px !important', px: 2 }}>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5, color: accent }}>
          {React.cloneElement(icon, { fontSize: 'small' })}
          <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary' }}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="h6" fontWeight={800} sx={{ color: highlight ? accent : 'text.primary', fontSize: '1rem' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

const StatementSkeleton = () => (
  <Box>
    <Skeleton variant="rounded" height={100} sx={{ mb: 3, borderRadius: 3 }} />
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[1, 2, 3, 4].map((i) => (
        <Grid item xs={6} sm={3} key={i}>
          <Skeleton variant="rounded" height={88} sx={{ borderRadius: 2.5 }} />
        </Grid>
      ))}
    </Grid>
    <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
  </Box>
);

export default CustomerStatementPage;
