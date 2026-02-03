import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Tabs, Tab, Snackbar, Alert, Container } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

  const [tab, setTab] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [customerSales, setCustomerSales] = useState([]);
  const [advanceBalance, setAdvanceBalance] = useState(0);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  const [paymentMethods, setPaymentMethods] = useState([emptyMethod]);
  const [globalNotes, setGlobalNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 16));

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [totalDue, setTotalDue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, salesRes] = await Promise.all([fetchCustomers(), fetchSalesWithDue()]);
      setCustomers(custRes.data || []);
      const sales = salesRes.data || [];
      setAllSales(sales);

      if (initialSaleId && !selectedCustomer) {
        const sale = sales.find(s => String(s.saleId) === String(initialSaleId));
        if (sale) {
          const cust = (custRes.data || []).find(c => String(c.id) === String(sale.customerId));
          setSelectedCustomer(cust);
          setSelectedSale(sale.saleId);
          setPaymentMethods([{ ...emptyMethod, amount: sale.dueAmount?.toString() || '' }]);
        }
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Load failed', severity: 'error' });
    } finally { setLoading(false); }
  }, [initialSaleId, selectedCustomer]);

  useEffect(() => { loadData(); }, [loadData]);

  // Handle Advance Balance & History
  const fetchHistoryAndBalance = useCallback(async () => {
    if (!selectedCustomer?.id) return;
    setHistoryLoading(true);
    try {
      const [hist, bal] = await Promise.all([
        fetchPaymentHistory(selectedCustomer.id, selectedSale === 'BULK' ? null : selectedSale),
        fetchCustomerAdvanceBalance(selectedCustomer.id)
      ]);
      setPaymentHistory(hist || []);
      setAdvanceBalance(bal.data || 0);
    } catch (e) {
      console.error("History fetch error", e);
    } finally { setHistoryLoading(false); }
  }, [selectedCustomer, selectedSale]);

  useEffect(() => {
    if (selectedCustomer) fetchHistoryAndBalance();
  }, [selectedCustomer, tab, fetchHistoryAndBalance]);

  useEffect(() => {
    const custSales = allSales.filter(s => String(s.customerId) === String(selectedCustomer?.id));
    setCustomerSales(custSales);
    const dues = selectedCustomer 
      ? custSales.reduce((sum, s) => sum + (s.dueAmount || 0), 0)
      : allSales.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
    setTotalDue(dues);
  }, [selectedCustomer, allSales]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const totalEntered = paymentMethods.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      if (selectedSale === 'BULK') {
        await recordBulkPayment({
          customerId: selectedCustomer.id,
          totalAmount: totalEntered,
          paymentMethod: paymentMethods[0].paymentMethod,
          paymentDate,
          notes: globalNotes
        });
      } else {
        const payload = paymentMethods.map(pm => ({
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
      loadData();
      fetchHistoryAndBalance();
    } catch (e) {
      setSnackbar({ open: true, message: 'Payment failed', severity: 'error' });
    } finally { setSubmitting(false); }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#f4f7f9', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')} sx={{ mb: 2 }}>Back</Button>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 3 }}>
          <Tab label="Payment" />
          <Tab label="History" />
        </Tabs>

        <PaymentSummaryCards
          totalDue={totalDue}
          selectedCustomer={selectedCustomer}
          selectedSaleObj={customerSales.find(s => s.saleId === selectedSale)}
          formatAmount={formatAmount}
          advanceBalance={advanceBalance}
          isBulk={selectedSale === 'BULK'}
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
            onRefresh={fetchHistoryAndBalance}
            formatAmount={formatAmount}
          />
        )}
      </Container>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerPaymentPage;