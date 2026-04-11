import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Button, Tabs, Tab, Snackbar, Alert, Container, Fade, Stack,
  Typography, Chip, IconButton, Tooltip, Card, Divider
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';

import {
  fetchSalesWithDue,
  fetchCustomers,
  recordDuePaymentsBatch,
  recordBulkPayment,
  fetchCustomerAdvanceBalance,
  fetchPaymentHistory
} from '../../services/api';

import PaymentSummaryCards from './PaymentSummaryCards';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';

const paymentMethodOptions = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'NET_BANKING', label: 'Net Banking' },
  { value: 'CHEQUE', label: 'Cheque' },
];

const needsTransactionId = (method) => ['CARD', 'UPI', 'NET_BANKING', 'CHEQUE'].includes(method);
const emptyMethod = { paymentMethod: 'CASH', amount: '', transactionId: '', reference: '', notes: '' };

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
  headerGradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
  borderColor: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
};

const CustomerPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSaleId = searchParams.get('saleId');

  const handleBack = () => {
    navigate(-1);
  };

  const hasInitializedFromUrl = useRef(false);

  // ─── DATA STATES ─────────────────────────────────────────
  const [tab, setTab] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [advanceBalance, setAdvanceBalance] = useState(0);
  
  // PAGINATION STATES
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ─── SELECTION STATES ────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  // ─── FORM STATES ─────────────────────────────────────────
  const [paymentMethods, setPaymentMethods] = useState([emptyMethod]);
  const [globalNotes, setGlobalNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [formErrors, setFormErrors] = useState({});

  // ─── UI STATES ───────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const formatAmount = (amount) => 
    `₹${Number(amount || 0).toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;

  const customerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return allSales.filter(s => String(s.customerId) === String(selectedCustomer.id));
  }, [selectedCustomer, allSales]);

  const totalDue = useMemo(() => {
    const targetSales = selectedCustomer ? customerSales : allSales;
    return targetSales.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
  }, [selectedCustomer, customerSales, allSales]);

  // ─── DATA LOADING ────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, salesRes] = await Promise.all([fetchCustomers(), fetchSalesWithDue()]);
      const custData = custRes.data || [];
      const salesData = salesRes.data || [];
      
      setCustomers(custData);
      setAllSales(salesData);

      if (initialSaleId && !hasInitializedFromUrl.current) {
        const sale = salesData.find(s => String(s.saleId) === String(initialSaleId));
        if (sale) {
          const cust = custData.find(c => String(c.id) === String(sale.customerId));
          setSelectedCustomer(cust);
          setSelectedSale(sale.saleId);
          setPaymentMethods([{ ...emptyMethod, amount: sale.dueAmount?.toString() || '' }]);
          hasInitializedFromUrl.current = true;
        }
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Data sync failed', severity: 'error' });
    } finally { setLoading(false); }
  }, [initialSaleId]);

  useEffect(() => { loadData(); }, [loadData]);

  // UPDATED FETCH LOGIC WITH PAGINATION
  const fetchHistoryAndBalance = useCallback(async () => {
    if (!selectedCustomer?.id) {
        setPaymentHistory([]);
        setTotalElements(0);
        return;
    }
    setHistoryLoading(true);
    try {
      const saleIdParam = selectedSale === 'BULK' ? null : selectedSale;
      const [histPage, bal] = await Promise.all([
        fetchPaymentHistory(selectedCustomer.id, saleIdParam, page, rowsPerPage),
        fetchCustomerAdvanceBalance(selectedCustomer.id)
      ]);
      
      setPaymentHistory(histPage?.content || []);
      setTotalElements(histPage?.totalElements || 0);
      setAdvanceBalance(bal?.data?.data || 0);
    } catch (e) {
      console.error("Ledger fetch error", e);
      setPaymentHistory([]);
      setTotalElements(0);
    } finally { setHistoryLoading(false); }
  }, [selectedCustomer, selectedSale, page, rowsPerPage]);

  useEffect(() => {
    if (selectedCustomer) fetchHistoryAndBalance();
  }, [fetchHistoryAndBalance]);

  // ─── EVENT HANDLERS ──────────────────────────────────────
  const handleCustomerChange = (val) => {
    setSelectedCustomer(val);
    setPage(0);
    if (!val) {
      setSelectedSale(null);
      setPaymentMethods([emptyMethod]);
      setFormErrors({});
      hasInitializedFromUrl.current = true;
    }
  };

  const handleMethodChange = (index, field, value) => {
    setPaymentMethods(prev => {
      const updated = [...prev];
      if (field === 'amount') {
        const sanitized = String(value).replace(/[^0-9.]/g, '');
        const parsed = parseFloat(sanitized);
        updated[index] = { ...updated[index], [field]: isNaN(parsed) ? '' : String(Math.max(0, parsed)) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newSize) => {
    setRowsPerPage(newSize);
    setPage(0);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const totalEntered = paymentMethods.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    if (totalEntered <= 0) {
      setSnackbar({ open: true, message: 'Enter a valid amount', severity: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      if (selectedSale === 'BULK') {
        await recordBulkPayment({
          customerId: selectedCustomer.id,
          totalAmount: totalEntered,
          paymentMethod: paymentMethods[0].paymentMethod,
          paymentDate,
          notes: globalNotes
        });
      } else {
        const payload = paymentMethods
            .filter(pm => parseFloat(pm.amount) > 0)
            .map(pm => ({
                sourceId: selectedSale,
                sourceType: 'SALE',
                amount: parseFloat(pm.amount),
                paymentMethod: pm.paymentMethod,
                paymentDate,
                customerId: selectedCustomer.id,
                transactionId: pm.transactionId?.trim(),
                notes: globalNotes
            }));
        await recordDuePaymentsBatch(payload);
      }
      
      setSnackbar({ open: true, message: 'Payment recorded successfully', severity: 'success' });
      setPaymentMethods([emptyMethod]);
      setGlobalNotes('');
      setPage(0);
      loadData();
      fetchHistoryAndBalance();
    } catch (e) {
       let errorMessage = 'Transaction failed. Please try again.';
  
      if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally { setSubmitting(false); }
  };

  return (
    <Box sx={{ bgcolor: theme.background, minHeight: '100vh' }}>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <Box sx={{
        background: theme.headerGradient,
        color: '#fff',
        px: { xs: 2, md: 4 },
        pt: { xs: 2.5, md: 3.5 },
        pb: 0,
        boxShadow: '0 4px 20px rgba(15, 118, 110, 0.15)',
      }}>
        <Container maxWidth="lg" disableGutters>
          {/* Top row: back + refresh */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{
                color: '#fff',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.15)',
                  transform: 'translateX(-4px)'
                },
              }}
            >
              Back
            </Button>
            <Tooltip title="Refresh data">
              <IconButton
                size="small"
                onClick={loadData}
                sx={{ 
                  color: '#fff',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.15)',
                    transform: 'rotate(180deg)'
                  } 
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Title row */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            spacing={2} 
            sx={{ mb: 3 }}
          >
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 32, color: '#ffffff' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h4" 
                fontWeight={800} 
                sx={{ color: '#fff', lineHeight: 1.2, letterSpacing: '-0.5px' }}
              >
                Payment Hub
              </Typography>
              {selectedCustomer ? (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
                  <Typography 
                    variant="body2" 
                    sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600, fontSize: '0.95rem' }}
                  >
                    {selectedCustomer.name}
                  </Typography>
                  {selectedCustomer.phone && (
                    <Chip
                      label={selectedCustomer.phone}
                      size="small"
                      sx={{ 
                        height: 22, 
                        fontSize: '0.7rem', 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: '#fff', 
                        fontWeight: 700,
                        border: '1px solid rgba(255,255,255,0.3)',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  )}
                </Stack>
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, fontSize: '0.9rem' }}
                >
                  Select a customer to collect or review payments
                </Typography>
              )}
            </Box>

            {/* Outstanding chip */}
            {selectedCustomer && (
              <Card sx={{
                px: 2.5, 
                py: 1.5, 
                bgcolor: totalDue > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.1)',
                border: `1.5px solid ${totalDue > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(16,185,129,0.3)'}`,
                backdropFilter: 'blur(10px)',
                textAlign: 'right',
                minWidth: '160px',
                boxShadow: 'none'
              }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    display: 'block', 
                    lineHeight: 1.2,
                    fontSize: '0.7rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  {totalDue > 0 ? 'Outstanding' : 'Status'}
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight={900} 
                  sx={{ 
                    color: totalDue > 0 ? '#ffffff' : '#6ee7b7', 
                    lineHeight: 1.3,
                    fontSize: '1.3rem'
                  }}
                >
                  {totalDue > 0 ? formatAmount(totalDue) : '✓ Settled'}
                </Typography>
              </Card>
            )}
          </Stack>

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              if (v === 1 && selectedCustomer?.id) {
                fetchHistoryAndBalance();
              }
            }}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.65)',
                fontWeight: 700,
                textTransform: 'none',
                minHeight: 48,
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                '&:hover': { color: '#fff' },
                '&.Mui-selected': { 
                  color: '#fff',
                },
              },
              '& .MuiTabs-indicator': { 
                bgcolor: '#ffffff', 
                height: 3.5, 
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab icon={<PaymentsIcon fontSize="small" />} iconPosition="start" label="Collect Payment" />
            <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Payment History" />
          </Tabs>
        </Container>
      </Box>

      {/* ── Page Body ─────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 4 } }}>
        <Fade in={true}>
          <Box>
            <PaymentSummaryCards
              totalDue={totalDue}
              selectedCustomer={selectedCustomer}
              selectedSaleObj={customerSales.find(s => s.saleId === selectedSale)}
              formatAmount={formatAmount}
              advanceBalance={advanceBalance}
              isBulk={selectedSale === 'BULK'}
              theme={theme}
            />

            <Box sx={{ mt: 4 }}>
              {tab === 0 ? (
                <PaymentForm
                  customers={customers}
                  customerSales={customerSales}
                  selectedCustomer={selectedCustomer}
                  selectedSale={selectedSale}
                  paymentMethods={paymentMethods}
                  paymentDate={paymentDate}
                  formErrors={formErrors}
                  submitting={submitting}
                  onCustomerChange={handleCustomerChange}
                  onSaleChange={setSelectedSale}
                  onMethodChange={handleMethodChange}
                  onAddMethod={() => setPaymentMethods([...paymentMethods, emptyMethod])}
                  onRemoveMethod={(i) => setPaymentMethods(paymentMethods.filter((_, idx) => idx !== i))}
                  onPaymentDateChange={setPaymentDate}
                  onSubmit={handleSubmit}
                  paymentMethodOptions={paymentMethodOptions}
                  needsTransactionId={needsTransactionId}
                  formatAmount={formatAmount}
                  globalNotes={globalNotes}
                  setGlobalNotes={setGlobalNotes}
                  theme={theme}
                />
              ) : (
                <PaymentHistory
                  loading={historyLoading}
                  paymentHistory={paymentHistory}
                  totalElements={totalElements}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onCustomerChange={handleCustomerChange}
                  onRefresh={fetchHistoryAndBalance}
                  formatAmount={formatAmount}
                  theme={theme}
                />
              )}
            </Box>
          </Box>
        </Fade>
      </Container>

      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          variant="filled"
          sx={{
            borderRadius: 2,
            fontSize: '0.9rem',
            fontWeight: 600,
            '& .MuiAlert-icon': { fontSize: '1.5rem' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerPaymentPage;