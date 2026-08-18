import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Snackbar,
  Alert,
  Chip,
  Grid,
  Stack,
  Divider,
  Avatar,
  Tabs,
  Tab,
  TextField,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Card,
  CardContent,
  TablePagination,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  WhatsApp as WhatsAppIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  PersonOff as PersonOffIcon,
  Person as PersonIcon,
  AccountBalanceWallet as WalletIcon,
  ReceiptLong as ReceiptLongIcon,
  Payments as PaymentsIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Send as SendIcon,
  History as HistoryIcon,
  RequestQuote as QuoteIcon,
  ShoppingCart as OrderIcon,
  Assignment as NoteIcon,
  CheckCircleOutline as CheckIcon,
  ContentCopy as CopyIcon,
  Add as AddIcon,
} from '@mui/icons-material';

import {
  fetchCustomer,
  updateCustomer,
  toggleCustomerActive,
  getCustomerStats,
  fetchCustomerDues,
  fetchCustomerLedger,
  fetchCustomerPayments,
  fetchCustomerCreditNotes,
  fetchCustomerQuotations,
  fetchCustomerSalesOrders,
  fetchCustomerAudit,
  getCustomerStatementPdfUrl,
} from '../services/api';

import { CustomerEditDialog } from '../components/customers/CustomerEditDialog';
import { CustomerEmailDialog } from '../components/customers/CustomerEmailDialog';

const inr = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const stringToColor = (string) => {
  let hash = 0;
  for (let i = 0; i < (string || '').length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const KpiTile = ({ icon, label, value, color, subtitle, warn = false }) => {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2.5,
        flex: 1,
        minWidth: 140,
        borderColor: warn ? alpha(theme.palette.error.main, 0.4) : 'divider',
        bgcolor: warn ? alpha(theme.palette.error.main, 0.02) : 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{ color: color || 'text.secondary', display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="h6" fontWeight={800} color={warn ? 'error.main' : 'text.primary'} sx={{ lineHeight: 1.2 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', mt: 0.25, display: 'block' }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // Core Data
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Navigation tab
  const [tabIndex, setTabIndex] = useState(0);

  // Sub-resource data
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerDateFrom, setLedgerDateFrom] = useState('');
  const [ledgerDateTo, setLedgerDateTo] = useState('');

  const [creditNotes, setCreditNotes] = useState([]);
  const [creditNotesLoading, setCreditNotesLoading] = useState(false);

  const [quoteOrderTab, setQuoteOrderTab] = useState('quotes');
  const [quotations, setQuotations] = useState([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [salesOrders, setSalesOrders] = useState([]);
  const [salesOrdersLoading, setSalesOrdersLoading] = useState(false);

  const [auditTrail, setAuditTrail] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((p) => ({ ...p, open: false }));
  };

  // Load Primary Customer Profile & Stats
  const loadProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [custResp, statsResp] = await Promise.all([
        fetchCustomer(id),
        getCustomerStats(id).catch(() => null),
      ]);
      setCustomer(custResp.data || custResp);
      setStats(statsResp);
    } catch (err) {
      console.error('Failed to load customer profile:', err);
      setError('Customer not found or error loading profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Lazy tab data loaders
  const loadInvoices = useCallback(async () => {
    if (!id) return;
    setInvoicesLoading(true);
    try {
      const resp = await fetchCustomerDues(id);
      setInvoices(resp.data?.content || resp.data || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  }, [id]);

  const loadPayments = useCallback(async () => {
    if (!id) return;
    setPaymentsLoading(true);
    try {
      const resp = await fetchCustomerPayments(id, 0, 50);
      setPayments(resp.content || resp.data?.content || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  }, [id]);

  const loadLedger = useCallback(async () => {
    if (!id) return;
    setLedgerLoading(true);
    try {
      const params = {};
      if (ledgerDateFrom) params.startDate = `${ledgerDateFrom}T00:00:00`;
      if (ledgerDateTo) params.endDate = `${ledgerDateTo}T23:59:59`;
      const resp = await fetchCustomerLedger(id, params);
      setLedgerEntries(resp.data || []);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLedgerLoading(false);
    }
  }, [id, ledgerDateFrom, ledgerDateTo]);

  const loadCreditNotes = useCallback(async () => {
    if (!id) return;
    setCreditNotesLoading(true);
    try {
      const resp = await fetchCustomerCreditNotes(id, 0, 50);
      setCreditNotes(resp.content || resp.data?.content || []);
    } catch (err) {
      console.error('Failed to load credit notes:', err);
    } finally {
      setCreditNotesLoading(false);
    }
  }, [id]);

  const loadQuotesAndOrders = useCallback(async () => {
    if (!id) return;
    setQuotationsLoading(true);
    setSalesOrdersLoading(true);
    try {
      const [qResp, soResp] = await Promise.all([
        fetchCustomerQuotations(id, 0, 50).catch(() => ({ content: [] })),
        fetchCustomerSalesOrders(id, 0, 50).catch(() => ({ content: [] })),
      ]);
      setQuotations(qResp.content || qResp.data?.content || []);
      setSalesOrders(soResp.content || soResp.data?.content || []);
    } catch (err) {
      console.error('Failed to load quotes & orders:', err);
    } finally {
      setQuotationsLoading(false);
      setSalesOrdersLoading(false);
    }
  }, [id]);

  const loadAudit = useCallback(async () => {
    if (!id) return;
    setAuditLoading(true);
    try {
      const resp = await fetchCustomerAudit(id);
      setAuditTrail(resp.data || resp || []);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setAuditLoading(false);
    }
  }, [id]);

  // Load data based on active tab
  useEffect(() => {
    if (tabIndex === 0) loadInvoices();
    else if (tabIndex === 1) loadPayments();
    else if (tabIndex === 2) loadLedger();
    else if (tabIndex === 3) loadCreditNotes();
    else if (tabIndex === 4) loadQuotesAndOrders();
    else if (tabIndex === 5) loadAudit();
  }, [tabIndex, loadInvoices, loadPayments, loadLedger, loadCreditNotes, loadQuotesAndOrders, loadAudit]);

  const handleToggleStatus = async () => {
    try {
      const res = await toggleCustomerActive(id);
      setCustomer((prev) => ({ ...prev, active: res.active }));
      showSnackbar(`Customer ${res.active ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      showSnackbar('Failed to update status.', 'error');
    }
  };

  const handleDownloadStatementPdf = () => {
    const url = getCustomerStatementPdfUrl(id, ledgerDateFrom || null, ledgerDateTo || null);
    window.open(url, '_blank');
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    showSnackbar(`${label} copied to clipboard!`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Customer not found.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </Box>
    );
  }

  const isBusiness = customer.customerType === 'BUSINESS';
  const balance = customer.creditBalance ?? 0;
  const isOwed = balance < 0;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
      {/* ─── 1. TOP HEADER & ACTIONS ────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => navigate('/customers')} sx={{ bgcolor: 'action.hover' }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h5" fontWeight={800}>
                {customer.name}
              </Typography>
              <Chip
                size="small"
                label={customer.active ? 'Active' : 'Inactive'}
                color={customer.active ? 'success' : 'default'}
                sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.7rem' }}
              />
              <Chip
                size="small"
                label={isBusiness ? 'B2B GST' : 'Retail / B2C'}
                color={isBusiness ? 'info' : 'default'}
                sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.7rem' }}
              />
            </Stack>
            {customer.tradeName && customer.tradeName !== customer.name && (
              <Typography variant="caption" color="text.secondary">
                Trading as: {customer.tradeName}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {customer.phone && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={() => window.open(`https://wa.me/91${customer.phone.replace(/[^0-9]/g, '')}`, '_blank')}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              WhatsApp
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => setEmailOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Email Statement
          </Button>

          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleDownloadStatementPdf}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Statement PDF
          </Button>

          <Button
            variant="outlined"
            color={customer.active ? 'warning' : 'success'}
            startIcon={customer.active ? <PersonOffIcon /> : <CheckIcon />}
            onClick={handleToggleStatus}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            {customer.active ? 'Deactivate' : 'Activate'}
          </Button>

          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5, boxShadow: 'none' }}
          >
            Edit Profile
          </Button>
        </Stack>
      </Box>

      {/* ─── 2. MAIN 2-COLUMN LAYOUT ────────────────────────────────────── */}
      <Grid container spacing={3}>
        {/* LEFT COLUMN: Profile Sidebar (4 / 12 on md) */}
        <Grid item xs={12} md={4} lg={3.5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {/* Avatar & Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  bgcolor: stringToColor(customer.name),
                  mx: 'auto',
                  mb: 1.5,
                  boxShadow: 3,
                }}
              >
                {(customer.name || 'C').charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={800}>
                {customer.name}
              </Typography>
              {customer.legalName && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Legal: {customer.legalName}
                </Typography>
              )}
              {customer.tags && (
                <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                  {customer.tags.split(',').map((t, idx) => (
                    <Chip key={idx} label={t.trim()} size="small" sx={{ fontSize: '0.68rem', height: 20 }} />
                  ))}
                </Stack>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Contact Details */}
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 1.5 }}>
              Contact Information
            </Typography>

            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Phone
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {customer.phone ? `+91 ${customer.phone}` : '—'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Email
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
                    {customer.email || '—'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Billing Address
                  </Typography>
                  <Typography variant="body2">
                    {[customer.addressLine1, customer.addressLine2, customer.city, customer.state, customer.postalCode]
                      .filter(Boolean)
                      .join(', ') || 'No address provided'}
                  </Typography>
                </Box>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Statutory & Tax Info */}
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 1.5 }}>
              Statutory & Compliance
            </Typography>

            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    GSTIN
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {customer.gstNumber || 'Unregistered'}
                  </Typography>
                </Box>
                {customer.gstNumber && (
                  <IconButton size="small" onClick={() => handleCopy(customer.gstNumber, 'GSTIN')}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    PAN Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {customer.panNumber || '—'}
                  </Typography>
                </Box>
                {customer.panNumber && (
                  <IconButton size="small" onClick={() => handleCopy(customer.panNumber, 'PAN')}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {customer.stateCode && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    State Code (GST)
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {customer.stateCode}
                  </Typography>
                </Box>
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Credit & Terms */}
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 1.5 }}>
              Credit Terms
            </Typography>

            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Credit Limit
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {customer.creditLimit > 0 ? inr(customer.creditLimit) : 'No limit'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Credit Days
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {customer.creditDays ? `${customer.creditDays} Days` : 'Net 30'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Payment Terms
                </Typography>
                <Typography variant="body2">
                  {customer.paymentTerms || 'Due on Receipt'}
                </Typography>
              </Grid>
            </Grid>

            {customer.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 1 }}>
                  Internal Notes
                </Typography>
                <Typography variant="body2" sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 2, fontStyle: 'italic' }}>
                  {customer.notes}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: KPI Tiles & 6 Enterprise Tabs (8 / 12 on md) */}
        <Grid item xs={12} md={8} lg={8.5}>
          {/* Top KPI Metrics Strip */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <KpiTile
                icon={<WalletIcon fontSize="small" />}
                label="Net Balance"
                value={isOwed ? `-${inr(Math.abs(balance))}` : inr(balance)}
                color={isOwed ? theme.palette.error.main : theme.palette.success.main}
                subtitle={isOwed ? 'Customer Owes' : balance > 0 ? 'Advance Credit' : 'Zero Balance'}
                warn={isOwed}
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <KpiTile
                icon={<TrendingUpIcon fontSize="small" />}
                label="Total Sales"
                value={inr(stats?.totalSalesValue)}
                color={theme.palette.primary.main}
                subtitle={`${stats?.totalSales || 0} Invoices`}
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <KpiTile
                icon={<PaymentsIcon fontSize="small" />}
                label="Avg Order"
                value={inr(stats?.averageOrderValue)}
                color="#8b5cf6"
                subtitle="Per sale transaction"
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <KpiTile
                icon={<ReceiptLongIcon fontSize="small" />}
                label="Advance Balance"
                value={inr(stats?.advanceBalance)}
                color={theme.palette.info.main}
                subtitle="Unallocated Credit"
              />
            </Grid>
          </Grid>

          {/* 6 TABS NAVIGATION */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2, bgcolor: 'background.default' }}>
              <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable" scrollButtons="auto">
                <Tab icon={<ReceiptLongIcon fontSize="small" />} iconPosition="start" label="Invoices (Sales)" />
                <Tab icon={<PaymentsIcon fontSize="small" />} iconPosition="start" label="Payments Received" />
                <Tab icon={<WalletIcon fontSize="small" />} iconPosition="start" label="Statement (Ledger)" />
                <Tab icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" label="Credit Notes" />
                <Tab icon={<QuoteIcon fontSize="small" />} iconPosition="start" label="Quotes & Orders" />
                <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Notes & Activity" />
              </Tabs>
            </Box>

            <Box sx={{ p: 3 }}>
              {/* ─── TAB 0: INVOICES (SALES) ─────────────────────────────────── */}
              {tabIndex === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Sales Invoices & Dues
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(`/sales?customerId=${id}`)}
                    >
                      New Sale
                    </Button>
                  </Box>

                  {invoicesLoading ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : invoices.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <ReceiptLongIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No sales or invoices recorded for this customer.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Due Amount</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {invoices.map((inv) => (
                            <TableRow key={inv.saleId || inv.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>
                                {inv.invoiceNo || `INV-${inv.saleId || inv.id}`}
                              </TableCell>
                              <TableCell>
                                {inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '—'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {inr(inv.totalAmount)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontWeight: 700,
                                  color: inv.dueAmount > 0 ? 'error.main' : 'success.main',
                                }}
                              >
                                {inr(inv.dueAmount)}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={inv.dueAmount > 0 ? 'UNPAID' : 'PAID'}
                                  color={inv.dueAmount > 0 ? 'warning' : 'success'}
                                  sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.68rem' }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  {inv.dueAmount > 0 && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="primary"
                                      onClick={() => navigate(`/customer-payments?customerId=${id}&saleId=${inv.saleId || inv.id}`)}
                                      sx={{ fontSize: '0.75rem', py: 0.25 }}
                                    >
                                      Collect
                                    </Button>
                                  )}
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => navigate(`/sales`)}
                                    sx={{ fontSize: '0.75rem', py: 0.25 }}
                                  >
                                    View
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* ─── TAB 1: PAYMENTS RECEIVED ────────────────────────────────── */}
              {tabIndex === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Payment History & Receipts
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(`/customer-payments?customerId=${id}`)}
                    >
                      Record Payment
                    </Button>
                  </Box>

                  {paymentsLoading ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : payments.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <PaymentsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No payments recorded yet for this customer.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Allocation / Source</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Amount Received</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payments.map((p) => (
                            <TableRow key={p.id} hover>
                              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                {p.transactionId || `TXN-${p.id}`}
                              </TableCell>
                              <TableCell>
                                {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={p.paymentMethod || 'CASH'}
                                  color="default"
                                  variant="outlined"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                />
                              </TableCell>
                              <TableCell>
                                {p.sourceId ? `Invoice #${p.sourceId}` : (
                                  <Chip size="small" label="Advance / Unallocated" color="info" sx={{ fontSize: '0.68rem' }} />
                                )}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {inr(p.amount)}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={p.status || 'PAID'}
                                  color="success"
                                  sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.68rem' }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* ─── TAB 2: STATEMENT (LEDGER) ───────────────────────────────── */}
              {tabIndex === 2 && (
                <Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Running Statement of Account
                    </Typography>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <TextField
                        size="small"
                        type="date"
                        label="From"
                        value={ledgerDateFrom}
                        onChange={(e) => setLedgerDateFrom(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 140 }}
                      />
                      <TextField
                        size="small"
                        type="date"
                        label="To"
                        value={ledgerDateTo}
                        onChange={(e) => setLedgerDateTo(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 140 }}
                      />
                      <Button variant="outlined" size="small" onClick={loadLedger}>
                        Filter
                      </Button>
                      <Button variant="contained" size="small" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadStatementPdf}>
                        Download PDF
                      </Button>
                    </Stack>
                  </Stack>

                  {ledgerLoading ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : ledgerEntries.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <WalletIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No ledger entries found in the selected date range.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Particulars / Description</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Debit (-)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Credit (+)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ledgerEntries.map((entry) => {
                            const isDebit = entry.type === 'DEBIT';
                            return (
                              <TableRow key={entry.id} hover>
                                <TableCell>
                                  {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-IN') : '—'}
                                </TableCell>
                                <TableCell>{entry.description || 'Ledger transaction'}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={entry.type}
                                    color={isDebit ? 'warning' : 'success'}
                                    variant="outlined"
                                    sx={{ fontWeight: 700, fontSize: '0.68rem' }}
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: isDebit ? 'error.main' : 'text.disabled' }}>
                                  {isDebit ? inr(entry.amount) : '—'}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: !isDebit ? 'success.main' : 'text.disabled' }}>
                                  {!isDebit ? inr(entry.amount) : '—'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* ─── TAB 3: CREDIT NOTES ─────────────────────────────────────── */}
              {tabIndex === 3 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Customer Credit Notes & Returns
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(`/credit-notes?customerId=${id}`)}
                    >
                      Issue Credit Note
                    </Button>
                  </Box>

                  {creditNotesLoading ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : creditNotes.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <TrendingUpIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No credit notes issued for this customer.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Credit Note #</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Applied</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Outstanding</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {creditNotes.map((cn) => (
                            <TableRow key={cn.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{cn.creditNoteNo}</TableCell>
                              <TableCell>{cn.creditNoteDate || '—'}</TableCell>
                              <TableCell>{cn.reason || 'Return / Adjustment'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>{inr(cn.totalAmount)}</TableCell>
                              <TableCell align="right">{inr(cn.appliedAmount)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {inr((cn.totalAmount || 0) - (cn.appliedAmount || 0))}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={cn.status || 'ISSUED'}
                                  color={cn.status === 'FULLY_APPLIED' ? 'default' : 'success'}
                                  sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.68rem' }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* ─── TAB 4: QUOTES & SALES ORDERS ────────────────────────────── */}
              {tabIndex === 4 && (
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
                    <Button
                      variant={quoteOrderTab === 'quotes' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setQuoteOrderTab('quotes')}
                      sx={{ borderRadius: 2 }}
                    >
                      Quotations ({quotations.length})
                    </Button>
                    <Button
                      variant={quoteOrderTab === 'orders' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setQuoteOrderTab('orders')}
                      sx={{ borderRadius: 2 }}
                    >
                      Sales Orders ({salesOrders.length})
                    </Button>
                  </Stack>

                  {quoteOrderTab === 'quotes' ? (
                    quotationsLoading ? (
                      <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress size={32} /></Box>
                    ) : quotations.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <QuoteIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">No quotations created for this customer.</Typography>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Quote #</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Valid Until</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {quotations.map((q) => (
                              <TableRow key={q.id} hover>
                                <TableCell sx={{ fontWeight: 700 }}>{q.quotationNo}</TableCell>
                                <TableCell>{q.quotationDate ? new Date(q.quotationDate).toLocaleDateString('en-IN') : '—'}</TableCell>
                                <TableCell>{q.expiryDate ? new Date(q.expiryDate).toLocaleDateString('en-IN') : '—'}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>{inr(q.totalAmount)}</TableCell>
                                <TableCell align="center">
                                  <Chip size="small" label={q.status || 'DRAFT'} color="info" sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.68rem' }} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )
                  ) : (
                    salesOrdersLoading ? (
                      <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress size={32} /></Box>
                    ) : salesOrders.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <OrderIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">No sales orders created for this customer.</Typography>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Delivery Date</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {salesOrders.map((so) => (
                              <TableRow key={so.id} hover>
                                <TableCell sx={{ fontWeight: 700 }}>{so.orderNo}</TableCell>
                                <TableCell>{so.orderDate ? new Date(so.orderDate).toLocaleDateString('en-IN') : '—'}</TableCell>
                                <TableCell>{so.expectedDeliveryDate ? new Date(so.expectedDeliveryDate).toLocaleDateString('en-IN') : '—'}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>{inr(so.totalAmount)}</TableCell>
                                <TableCell align="center">
                                  <Chip size="small" label={so.status || 'DRAFT'} color="primary" sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.68rem' }} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )
                  )}
                </Box>
              )}

              {/* ─── TAB 5: NOTES & ACTIVITY ─────────────────────────────────── */}
              {tabIndex === 5 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    Customer Audit Trail & Profile Activity
                  </Typography>

                  {auditLoading ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : auditTrail.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No recorded changes yet.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {auditTrail.map((item) => (
                        <Paper
                          key={item.id}
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={item.action}
                                color={
                                  item.action === 'CREATED'
                                    ? 'success'
                                    : item.action === 'DELETED' || item.action === 'DEACTIVATED'
                                    ? 'error'
                                    : 'primary'
                                }
                                sx={{ fontWeight: 700, fontSize: '0.68rem', borderRadius: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                By <strong>{item.performedBy || 'System'}</strong>
                              </Typography>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : '—'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                            {item.summary || 'Customer profile mutation'}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ─── MODALS ──────────────────────────────────────────────────────── */}
      {/* Edit Profile Dialog */}
      <CustomerEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customer={customer}
        isEdit={true}
        onSave={async (formData) => {
          const resp = await updateCustomer(id, formData);
          setCustomer(resp.data || resp);
          showSnackbar('Customer profile updated successfully.');
          loadProfile();
          return { success: true };
        }}
      />

      {/* Email Statement Dialog */}
      <CustomerEmailDialog
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        customerId={id}
        customerName={customer.name}
        customerEmail={customer.email}
        onSuccess={(msg) => showSnackbar(msg)}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
