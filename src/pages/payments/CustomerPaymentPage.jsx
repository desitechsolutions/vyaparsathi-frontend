import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Button, Tabs, Tab, Snackbar, Alert, Container, Fade, Stack,
  Typography, Chip, IconButton, Tooltip
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

const CustomerPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSaleId = searchParams.get('saleId');

  // Dynamic back: always go to the previous page in browser history.
  // Falls back to a sensible default if there's no history (e.g. direct URL visit).
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
      
      // Update state based on Page object
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
    setPage(0); // Reset page on customer change
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
    setPage(0); // Reset to first page when page size changes
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
      
      setSnackbar({ open: true, message: 'Success', severity: 'success' });
      setPaymentMethods([emptyMethod]);
      setGlobalNotes('');
      setPage(0); // Go back to first page to see the new entry
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
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh' }}>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: '#fff',
        px: { xs: 2, md: 4 },
        pt: { xs: 2, md: 3 },
        pb: 0,
      }}>
        <Container maxWidth="lg" disableGutters>
          {/* Top row: back + refresh */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              Back
            </Button>
            <Tooltip title="Refresh data">
              <IconButton
                size="small"
                onClick={loadData}
                sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Title row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.12)', display: 'flex' }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 28, color: '#a5f3fc' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={900} sx={{ color: '#fff', lineHeight: 1.2 }}>
                Customer Payments
              </Typography>
              {selectedCustomer ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                    {selectedCustomer.name}
                  </Typography>
                  {selectedCustomer.phone && (
                    <Chip
                      label={selectedCustomer.phone}
                      size="small"
                      sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}
                    />
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', mt: 0.3 }}>
                  Select a customer to collect or review payments
                </Typography>
              )}
            </Box>

            {/* Outstanding chip */}
            {selectedCustomer && totalDue > 0 && (
              <Box sx={{
                px: 2, py: 1, borderRadius: 2.5,
                bgcolor: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)',
                textAlign: 'right',
              }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', display: 'block', lineHeight: 1 }}>
                  Outstanding
                </Typography>
                <Typography variant="h6" fontWeight={900} sx={{ color: '#fca5a5', lineHeight: 1.3 }}>
                  {formatAmount(totalDue)}
                </Typography>
              </Box>
            )}
            {selectedCustomer && totalDue <= 0 && (
              <Chip
                label="✓ All Clear"
                sx={{ bgcolor: 'rgba(16,185,129,0.2)', color: '#6ee7b7', fontWeight: 800, border: '1px solid rgba(16,185,129,0.4)' }}
              />
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
                color: 'rgba(255,255,255,0.55)',
                fontWeight: 700,
                textTransform: 'none',
                minHeight: 44,
                '&.Mui-selected': { color: '#fff' },
              },
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8', height: 3, borderRadius: '3px 3px 0 0' },
            }}
          >
            <Tab icon={<PaymentsIcon fontSize="small" />} iconPosition="start" label="Collect Payment" />
            <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Payment History" />
          </Tabs>
        </Container>
      </Box>

      {/* ── Page Body ─────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 4 } }}>
        <Fade in={true}>
          <Box>
            <PaymentSummaryCards
              totalDue={totalDue}
              selectedCustomer={selectedCustomer}
              selectedSaleObj={customerSales.find(s => s.saleId === selectedSale)}
              formatAmount={formatAmount}
              advanceBalance={advanceBalance}
              isBulk={selectedSale === 'BULK'}
            />

            <Box sx={{ mt: 3 }}>
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
                />
              )}
            </Box>
          </Box>
        </Fade>
      </Container>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerPaymentPage;