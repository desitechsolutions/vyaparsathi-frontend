import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Tabs, Tab, Snackbar, Alert, Container
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchSalesWithDue,
  fetchCustomers,
  recordDuePaymentsBatch,
  fetchPaymentHistory
} from '../../services/api';
import PaymentSummaryCards from './PaymentSummaryCards';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const paymentMethodOptions = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'NET_BANKING', label: 'Net Banking' },
  { value: 'CHEQUE', label: 'Cheque' },
];

const needsTransactionId = (method) =>
  ['CARD', 'UPI', 'NET_BANKING', 'CHEQUE'].includes(method);

const emptyMethod = {
  paymentMethod: 'CASH',
  amount: '',
  transactionId: '',
  reference: '',
  notes: '',
};

const CustomerPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSaleId = searchParams.get('saleId');

  const [tab, setTab] = useState(0);

  const [customers, setCustomers] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [customerSales, setCustomerSales] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  const [paymentMethods, setPaymentMethods] = useState([emptyMethod]);
  const [globalNotes, setGlobalNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().slice(0, 16)
  );

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [totalDue, setTotalDue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'success'
  });

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // ────────────────────────────────────────────────
  // Derived calculations
  // ────────────────────────────────────────────────
  const currentSale = customerSales.find(s => s.saleId === selectedSale);
  const maxAllowed = currentSale?.dueAmount || 0;

  const totalEntered = paymentMethods.reduce(
    (sum, p) => sum + (parseFloat(p.amount) || 0),
    0
  );

  const remainingBalance = maxAllowed - totalEntered;
  const isOverpaid = remainingBalance < 0;

  // ────────────────────────────────────────────────
  // Initial load (ONCE)
  // ────────────────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, salesRes] = await Promise.all([
        fetchCustomers(),
        fetchSalesWithDue()
      ]);

      setCustomers(custRes.data || []);
      setAllSales(salesRes.data || []);

      if (initialSaleId) {
        const sale = (salesRes.data || [])
          .find(s => String(s.saleId) === String(initialSaleId));

        if (sale) {
          const customer = (custRes.data || [])
            .find(c => String(c.id) === String(sale.customerId));

          setSelectedCustomer(customer || null);
          setSelectedSale(sale.saleId);
          setPaymentMethods([{
            ...emptyMethod,
            amount: sale.dueAmount?.toString() || ''
          }]);
        }
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [initialSaleId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ────────────────────────────────────────────────
  // Derive customer sales + total due
  // ────────────────────────────────────────────────
  useEffect(() => {
    const businessTotalDue = allSales.reduce(
      (sum, s) => sum + (s.dueAmount || 0),
      0
    );
    if (!selectedCustomer) {
      setCustomerSales([]);
      setTotalDue(businessTotalDue);
      return;
    }

    const custSales = allSales.filter(
      s => String(s.customerId) === String(selectedCustomer.id)
    );

    setCustomerSales(custSales);
    setTotalDue(
      custSales.reduce((sum, s) => sum + (s.dueAmount || 0), 0)
    );
  }, [selectedCustomer, allSales]);

  // ────────────────────────────────────────────────
  // Reset form on customer change
  // ────────────────────────────────────────────────
  useEffect(() => {
    setSelectedSale(null);
    setPaymentMethods([emptyMethod]);
    setGlobalNotes('');
  }, [selectedCustomer]);

  // ────────────────────────────────────────────────
  // Payment history
  // ────────────────────────────────────────────────
  const fetchHistory = useCallback((custId, saleId) => {
    if (!custId) return;
    setHistoryLoading(true);
    fetchPaymentHistory(custId, saleId)
      .then(data => setPaymentHistory(data || []))
      .catch(() =>
        setSnackbar({ open: true, message: 'Failed to load history', severity: 'error' })
      )
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCustomer && tab === 1) {
      fetchHistory(selectedCustomer.id, selectedSale);
    }
  }, [selectedCustomer, selectedSale, tab, fetchHistory]);

  // ────────────────────────────────────────────────
  // Submit
  // ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    const errors = {};
    paymentMethods.forEach((pm, idx) => {
      if (!pm.amount || parseFloat(pm.amount) <= 0) {
        errors[`amount${idx}`] = 'Enter a valid amount';
      }
      if (needsTransactionId(pm.paymentMethod) && !pm.transactionId?.trim()) {
        errors[`transactionId${idx}`] = 'Transaction ID is required';
      }
    });

    if (totalEntered > maxAllowed) {
      setSnackbar({
        open: true,
        message: `Total entered (${formatAmount(totalEntered)}) exceeds due (${formatAmount(maxAllowed)})`,
        severity: 'error'
      });
      setSubmitting(false);
      return;
    }

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    const payload = paymentMethods.map(pm => ({
      sourceId: selectedSale,
      sourceType: 'SALE',
      amount: parseFloat(pm.amount),
      paymentMethod: pm.paymentMethod,
      paymentDate,
      customerId: selectedCustomer.id,
      transactionId: pm.transactionId?.trim() || null,
      reference: pm.reference?.trim() || null,
      notes: globalNotes.trim() || null,
    }));

    try {
      await recordDuePaymentsBatch(payload);

      // Optimistic UI update
      setAllSales(prev =>
        prev.map(s =>
          s.saleId === selectedSale
            ? { ...s, dueAmount: s.dueAmount - totalEntered }
            : s
        )
      );

      setSnackbar({ open: true, message: 'Payment recorded successfully', severity: 'success' });
      setPaymentMethods([emptyMethod]);
      setGlobalNotes('');
      setPaymentDate(new Date().toISOString().slice(0, 16));

      if (tab === 1) {
        fetchHistory(selectedCustomer.id, selectedSale);
      }
    } catch (e) {
      setSnackbar({
        open: true,
        message: e.response?.data?.message || 'Error recording payment',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#f4f7f9', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')} sx={{ mb: 3 }}>
          Back to Customers
        </Button>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 4 }}>
          <Tab label="New Payment" />
          <Tab label="Payment History" />
        </Tabs>

        <PaymentSummaryCards
          totalDue={totalDue}
          selectedCustomer={selectedCustomer} 
          selectedSaleObj={currentSale}
          formatAmount={formatAmount}
          remainingBalance={remainingBalance}
          isOverpaid={isOverpaid}
        />

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
            onCustomerChange={setSelectedCustomer}
            onSaleChange={setSelectedSale}
            onMethodChange={(i, f, v) => {
              const copy = [...paymentMethods];
              copy[i][f] = v;
              setPaymentMethods(copy);
            }}
            onAddMethod={() => setPaymentMethods([...paymentMethods, emptyMethod])}
            onRemoveMethod={(i) => setPaymentMethods(paymentMethods.filter((_, idx) => idx !== i))}
            onPaymentDateChange={setPaymentDate}
            onSubmit={handleSubmit}
            paymentMethodOptions={paymentMethodOptions}
            needsTransactionId={needsTransactionId}
            formatAmount={formatAmount}
            remainingBalance={remainingBalance}
            isOverpaid={isOverpaid}
            globalNotes={globalNotes}
            setGlobalNotes={setGlobalNotes}
          />
        ) : (
          <PaymentHistory
            loading={historyLoading}
            paymentHistory={paymentHistory}
            customers={customers}
            selectedCustomer={selectedCustomer}
            onCustomerChange={setSelectedCustomer}
            onRefresh={() => fetchHistory(selectedCustomer?.id, selectedSale)}
            formatAmount={formatAmount}
          />
        )}
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerPaymentPage;
