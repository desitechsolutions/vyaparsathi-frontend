import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Button, Tabs, Tab, Snackbar, Alert } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchSalesWithDue, fetchCustomers, recordDuePaymentsBatch, fetchPaymentHistory } from '../../services/api';
import PaymentSummaryCards from './PaymentSummaryCards';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';

// Utility functions
const paymentMethodOptions = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'NET_BANKING', label: 'Net Banking' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
];
const needsTransactionId = (method) =>
  ['CARD', 'UPI', 'NET_BANKING', 'CHEQUE', 'OTHER'].includes(method);
const transactionIdMandatory = (method) =>
  ['CARD', 'UPI', 'NET_BANKING', 'CHEQUE'].includes(method);
function formatAmount(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

const CustomerPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSaleId = searchParams.get('saleId');
  const initialSaleIdRef = useRef(initialSaleId);

  // UI State
  const [tab, setTab] = useState(0);
  // Data State
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState('');
  const [selectedSaleObj, setSelectedSaleObj] = useState(null);
  // Payment Form State
  const [paymentMethods, setPaymentMethods] = useState([
    { paymentMethod: 'CASH', amount: '', transactionId: '', reference: '', notes: '' },
  ]);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // History Data
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Amounts & Totals
  const [dueAmount, setDueAmount] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Data Fetching
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCustomers(), fetchSalesWithDue()])
      .then(([custRes, salesRes]) => {
        const custs = custRes.data || [];
        const sales = salesRes.data || [];
        setCustomers(custs);
        let selSale = null, selCustomer = null;
        if (initialSaleId && sales.length > 0) {
          selSale = sales.find(s => String(s.saleId) === String(initialSaleId));
          if (selSale) {
            selCustomer = custs.find(c => String(c.id) === String(selSale.customerId));
          }
        }
        setSelectedCustomer(selCustomer || null);
        if (selCustomer) {
          const custSales = sales.filter(s => String(s.customerId) === String(selCustomer.id));
          setCustomerSales(custSales);
          if (selSale) {
            setSelectedSale(selSale.saleId);
            setSelectedSaleObj(selSale);
            setDueAmount(selSale.dueAmount || 0);
            setTotalAmount(selSale.totalAmount || 0);
            setPaidAmount(selSale.paidAmount || 0);
            fetchPaymentHistoryCallback(selSale.customerId, selSale.saleId);
          }
        } else {
          setCustomerSales([]);
          setSelectedSale('');
          setSelectedSaleObj(null);
          setDueAmount(0);
          setTotalAmount(0);
          setPaidAmount(0);
          setPaymentHistory([]);
        }
        setTotalDue(sales.reduce((sum, sale) => sum + (sale.dueAmount || 0), 0));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [initialSaleId]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchSalesWithDue().then(res => {
        const sales = res.data || [];
        const custSales = sales.filter(s => String(s.customerId) === String(selectedCustomer.id));
        setCustomerSales(custSales);
        if (
          !selectedSale ||
          !custSales.some(s => String(s.saleId) === String(selectedSale))
        ) {
          if (initialSaleIdRef.current && custSales.some(s => String(s.saleId) === String(initialSaleIdRef.current))) {
            setSelectedSale(initialSaleIdRef.current);
            const selSale = custSales.find(s => String(s.saleId) === String(initialSaleIdRef.current));
            setSelectedSaleObj(selSale);
            setDueAmount(selSale?.dueAmount || 0);
            setTotalAmount(selSale?.totalAmount || 0);
            setPaidAmount(selSale?.paidAmount || 0);
            fetchPaymentHistoryCallback(selSale.customerId, selSale.saleId);
            initialSaleIdRef.current = null;
          } else {
            setSelectedSale('');
            setSelectedSaleObj(null);
            setDueAmount(0);
            setTotalAmount(0);
            setPaidAmount(0);
            setPaymentHistory([]);
          }
        }
      });
    }
    // eslint-disable-next-line
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedSale && customerSales.length > 0) {
      const sale = customerSales.find(s => String(s.saleId) === String(selectedSale));
      setSelectedSaleObj(sale || null);
      setDueAmount(sale?.dueAmount || 0);
      setTotalAmount(sale?.totalAmount || 0);
      setPaidAmount(sale?.paidAmount || 0);
      if (sale) fetchPaymentHistoryCallback(sale.customerId, sale.saleId);
      else setPaymentHistory([]);
    } else {
      setSelectedSaleObj(null);
      setDueAmount(0);
      setTotalAmount(0);
      setPaidAmount(0);
      setPaymentHistory([]);
    }
    // eslint-disable-next-line
  }, [selectedSale, customerSales]);

  const fetchPaymentHistoryCallback = useCallback((customerId, saleId) => {
    if (!customerId) {
      setPaymentHistory([]);
      return;
    }
    setHistoryLoading(true);
    fetchPaymentHistory(customerId, saleId)
      .then((data) => {
        setPaymentHistory(data || []);
      })
      .finally(() => setHistoryLoading(false));
  }, []);

  // Payment Form Handlers
  const handleAddMethod = () => {
    setPaymentMethods([
      ...paymentMethods,
      { paymentMethod: 'CASH', amount: '', transactionId: '', reference: '', notes: '' },
    ]);
  };
  const handleRemoveMethod = (idx) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== idx));
  };
  const handleMethodChange = (idx, field, value) => {
    setPaymentMethods((prev) =>
      prev.map((pm, i) =>
        i === idx
          ? {
              ...pm,
              [field]: field === 'amount' ? value.replace(/^0+/, '') : value,
              ...(field === 'paymentMethod' && value === 'CASH' ? { transactionId: '' } : {}),
            }
          : pm
      )
    );
  };
  const handlePaymentDateChange = (value) => setPaymentDate(value);
  const handleCustomerChange = (newValue) => setSelectedCustomer(newValue);
  const handleSaleChange = (value) => setSelectedSale(value);

  // Total payment calculation
  const totalPayment = paymentMethods.reduce(
    (sum, pm) => sum + (parseFloat(pm.amount) || 0),
    0
  );

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    let errors = {};
    if (!selectedSale) errors.selectedSale = 'Please select a sale.';
    paymentMethods.forEach((pm, idx) => {
      if (!pm.amount || isNaN(parseFloat(pm.amount)) || parseFloat(pm.amount) <= 0) {
        errors[`amount${idx}`] = 'Enter valid amount';
      } else if (parseFloat(pm.amount) > dueAmount) {
        errors[`amount${idx}`] = 'Amount exceeds due';
      }
      if (
        needsTransactionId(pm.paymentMethod) &&
        transactionIdMandatory(pm.paymentMethod) &&
        (!pm.transactionId || pm.transactionId.trim() === '')
      ) {
        errors[`transactionId${idx}`] = 'Transaction ID required';
      }
    });
    if (totalPayment > dueAmount) errors.total = 'Total payment cannot exceed due amount.';
    if (dueAmount === 0) errors.due = 'This sale is already fully paid.';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }
    const sale = selectedSaleObj;
    const customerId = sale?.customerId;
    const payload = paymentMethods
      .filter((pm) => parseFloat(pm.amount) > 0)
      .map((pm) => ({
        sourceId: sale.saleId,
        sourceType: 'SALE',
        amount: parseFloat(pm.amount),
        paymentMethod: pm.paymentMethod,
        paymentDate: paymentDate.length === 10 ? paymentDate + 'T00:00:00' : paymentDate,
        customerId,
        supplierId: null,
        transactionId: needsTransactionId(pm.paymentMethod) ? pm.transactionId || '' : undefined,
        reference: pm.reference || undefined,
        notes: pm.notes || undefined,
      }));
    try {
      await recordDuePaymentsBatch(payload);
      setSnackbar({
        open: true,
        message: 'Payment(s) recorded successfully!',
        severity: 'success',
      });
      setPaymentMethods([
        { paymentMethod: 'CASH', amount: '', transactionId: '', reference: '', notes: '' },
      ]);
      const salesRes = await fetchSalesWithDue();
      const salesList = salesRes.data || [];
      const custSales = salesList.filter(s => String(s.customerId) === String(selectedCustomer.id));
      setCustomerSales(custSales);
      const updatedSale = custSales.find(s => String(s.saleId) === String(selectedSale));
      setSelectedSaleObj(updatedSale);
      setDueAmount(updatedSale?.dueAmount || 0);
      setTotalAmount(updatedSale?.totalAmount || 0);
      setPaidAmount(updatedSale?.paidAmount || 0);
      if (updatedSale) fetchPaymentHistoryCallback(updatedSale.customerId, updatedSale.saleId);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error recording payment(s).',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  // UI
  return (
    <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: '#eef2f7', minHeight: '100vh' }}>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate('/customers')}>
        &larr; Back to Customers
      </Button>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="Record Payment" />
        <Tab label="Payment History" />
      </Tabs>
      <PaymentSummaryCards
        totalDue={totalDue}
        selectedSaleObj={selectedSaleObj}
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        dueAmount={dueAmount}
        formatAmount={formatAmount}
      />
      {tab === 0 && (
        <PaymentForm
          customers={customers}
          customerSales={customerSales}
          selectedCustomer={selectedCustomer}
          selectedSale={selectedSale}
          selectedSaleObj={selectedSaleObj}
          paymentMethods={paymentMethods}
          paymentDate={paymentDate}
          formErrors={formErrors}
          submitting={submitting}
          dueAmount={dueAmount}
          disablePaymentFields={dueAmount === 0 || !selectedSaleObj}
          onCustomerChange={handleCustomerChange}
          onSaleChange={handleSaleChange}
          onMethodChange={handleMethodChange}
          onAddMethod={handleAddMethod}
          onRemoveMethod={handleRemoveMethod}
          onPaymentDateChange={handlePaymentDateChange}
          onSubmit={handleSubmit}
          paymentMethodOptions={paymentMethodOptions}
          needsTransactionId={needsTransactionId}
          transactionIdMandatory={transactionIdMandatory}
          formatAmount={formatAmount}
        />
      )}
      {tab === 1 && (
        <PaymentHistory
          loading={historyLoading}
          paymentHistory={paymentHistory}
          customers={customers}
          customerSales={customerSales}
          selectedCustomer={selectedCustomer}
          selectedSale={selectedSale}
          onCustomerChange={setSelectedCustomer}
          onSaleChange={setSelectedSale}
          onRefresh={() => {
            if (selectedCustomer) {
              if (selectedSale) {
                fetchPaymentHistoryCallback(selectedCustomer.id, selectedSale);
              } else {
                fetchPaymentHistoryCallback(selectedCustomer.id);
              }
            }
          }}
          formatAmount={formatAmount}
          setTab={setTab}
          setSelectedSale={setSelectedSale}
        />
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerPaymentPage;