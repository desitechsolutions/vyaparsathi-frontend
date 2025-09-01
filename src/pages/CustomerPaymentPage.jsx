import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
  Card,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Grid,
  Paper,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Divider,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { fetchSalesWithDue, fetchCustomers, recordDuePaymentsBatch } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  // Routing
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSaleId = searchParams.get('saleId');
  const initialSaleIdRef = useRef(initialSaleId);

  // UI State
  const [tab, setTab] = useState(0);

  // Customer & sale selection state
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
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

  // Fetch all customers and sales data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCustomers(),
      fetchSalesWithDue()
    ]).then(([custRes, salesRes]) => {
      const custs = custRes.data || [];
      const sales = salesRes.data || [];
      setCustomers(custs);

      // Pre-select sale/customer if coming from another page
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
          fetchPaymentHistory(selSale.customerId, selSale.saleId);
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
    }).finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [initialSaleId]);

  // When selectedCustomer changes, update sales
    useEffect(() => {
      if (selectedCustomer) {
        fetchSalesWithDue().then(res => {
          const sales = res.data || [];
          const custSales = sales.filter(s => String(s.customerId) === String(selectedCustomer.id));
          setCustomerSales(custSales);

          // Only reset selectedSale if it's not already set or the selectedSale does not belong to the new customer
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
              fetchPaymentHistory(selSale.customerId, selSale.saleId);
              initialSaleIdRef.current = null; // Only do this once!
            } else {
              setSelectedSale('');
              setSelectedSaleObj(null);
              setDueAmount(0);
              setTotalAmount(0);
              setPaidAmount(0);
              setPaymentHistory([]);
            }
          }
          // else: keep current selectedSale and selectedSaleObj
        });
      }
      // eslint-disable-next-line
    }, [selectedCustomer]);

  // When selectedSale changes, update amounts and fetch payment history
  useEffect(() => {
    if (selectedSale && customerSales.length > 0) {
      const sale = customerSales.find(s => String(s.saleId) === String(selectedSale));
      setSelectedSaleObj(sale || null);
      setDueAmount(sale?.dueAmount || 0);
      setTotalAmount(sale?.totalAmount || 0);
      setPaidAmount(sale?.paidAmount || 0);
      if (sale) fetchPaymentHistory(sale.customerId, sale.saleId);
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

  // Fetch payment history for given customer & sale
  const fetchPaymentHistory = useCallback((customerId, saleId) => {
    if (!customerId) {
      setPaymentHistory([]);
      return;
    }
    setHistoryLoading(true);
    import('../services/api').then(({ default: API }) =>
      API.get('/api/payments', {
        params: {
          customerId,
          ...(saleId ? { sourceType: 'SALE', sourceId: saleId } : {})
        },
      })
        .then((r) => setPaymentHistory(r.data || []))
        .finally(() => setHistoryLoading(false))
    );
  }, []);

  // Multi Payment Methods Handlers
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
    // Validation
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
    // Compose payload: array of PaymentReceivedRequest
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
      // Reset form, reload history and sales/dues
      setPaymentMethods([
        { paymentMethod: 'CASH', amount: '', transactionId: '', reference: '', notes: '' },
      ]);
      // reload selected customer's sales and current sale obj
      const salesRes = await fetchSalesWithDue();
      const salesList = salesRes.data || [];
      const custSales = salesList.filter(s => String(s.customerId) === String(selectedCustomer.id));
      setCustomerSales(custSales);
      const updatedSale = custSales.find(s => String(s.saleId) === String(selectedSale));
      setSelectedSaleObj(updatedSale);
      setDueAmount(updatedSale?.dueAmount || 0);
      setTotalAmount(updatedSale?.totalAmount || 0);
      setPaidAmount(updatedSale?.paidAmount || 0);
      if (updatedSale) fetchPaymentHistory(updatedSale.customerId, updatedSale.saleId);
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
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Validation helpers
  const isPaid = dueAmount === 0;
  const disablePaymentFields = isPaid || !selectedSaleObj;

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: '#eef2f7', minHeight: '100vh' }}>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate('/customers')}>
        &larr; Back to Customers
      </Button>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="Record Payment" />
        <Tab label="Payment History" />
      </Tabs>

      {/* Top summary cards */}
      <Box sx={{
        my: 3,
        display: 'flex',
        gap: 3,
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        justifyContent: 'center'
      }}>
        <Card
          raised
          sx={{
            minWidth: 220,
            borderRadius: '16px',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#fafafa',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <AccountBalanceWalletIcon sx={{ fontSize: 36, color: '#4caf50', mr: 2 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Total Customer Dues</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>
              {formatAmount(totalDue)}
            </Typography>
          </Box>
        </Card>
        {selectedSaleObj && (
          <Card
            raised
            sx={{
              minWidth: 220,
              borderRadius: '16px',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#fafafa',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Sale Summary</Typography>
              <Typography variant="body2">Invoice: <b>{selectedSaleObj.invoiceNo}</b></Typography>
              <Typography variant="body2">Total: {formatAmount(totalAmount)}</Typography>
              <Typography variant="body2">Paid: {formatAmount(paidAmount)}</Typography>
              <Typography variant="body2" color="error">Due: {formatAmount(dueAmount)}</Typography>
            </Box>
          </Card>
        )}
      </Box>

      {/* Record Payment Tab */}
      {tab === 0 && (
        <Paper sx={{ maxWidth: 650, mx: 'auto', mt: 2, p: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                options={customers}
                getOptionLabel={option => option.name || ""}
                value={selectedCustomer}
                onChange={(_, newValue) => setSelectedCustomer(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Select Customer" fullWidth />
                )}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth margin="normal" error={!!formErrors.selectedSale} disabled={!selectedCustomer}>
                <InputLabel id="sale-select-label">Select Sale</InputLabel>
                <Select
                  labelId="sale-select-label"
                  value={selectedSale}
                  label="Select Sale"
                  onChange={(e) => setSelectedSale(e.target.value)}
                >
                  <MenuItem value="">Select a sale</MenuItem>
                  {customerSales.map((sale) => (
                    <MenuItem key={sale.saleId} value={sale.saleId}>
                      {sale.invoiceNo} (Due: {formatAmount(sale.dueAmount)})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.selectedSale && (
                  <Typography color="error" variant="caption">
                    {formErrors.selectedSale}
                  </Typography>
                )}
              </FormControl>
            </Box>
            {selectedSaleObj && (
              <>
                {formErrors.due && (
                  <Alert severity="error" sx={{ mt: 1 }}>{formErrors.due}</Alert>
                )}
                {formErrors.total && (
                  <Alert severity="error" sx={{ mt: 1 }}>{formErrors.total}</Alert>
                )}
                {paymentMethods.map((pm, idx) => (
                  <Grid container spacing={1} key={idx} alignItems="center" sx={{ mt: 2, borderBottom: '1px solid #eee', pb: 2 }}>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Method</InputLabel>
                        <Select
                          value={pm.paymentMethod}
                          label="Method"
                          onChange={(e) => handleMethodChange(idx, 'paymentMethod', e.target.value)}
                          disabled={disablePaymentFields}
                        >
                          {paymentMethodOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Amount"
                        value={pm.amount}
                        onChange={(e) => {
                          // Immediate validation for over-due
                          let val = e.target.value.replace(/^0+/, '');
                          handleMethodChange(idx, 'amount', val);
                          if (
                            parseFloat(val) > dueAmount &&
                            !formErrors[`amount${idx}`]
                          ) {
                            setFormErrors(f => ({
                              ...f,
                              [`amount${idx}`]: 'Amount exceeds due'
                            }));
                          } else if (
                            formErrors[`amount${idx}`] &&
                            parseFloat(val) <= dueAmount
                          ) {
                            setFormErrors(f => {
                              const { [`amount${idx}`]: _, ...rest } = f;
                              return rest;
                            });
                          }
                        }}
                        type="number"
                        error={!!formErrors[`amount${idx}`]}
                        helperText={formErrors[`amount${idx}`]}
                        disabled={disablePaymentFields}
                        inputProps={{ min: 0, max: dueAmount }}
                      />
                    </Grid>
                    {needsTransactionId(pm.paymentMethod) && (
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Transaction ID"
                          value={pm.transactionId}
                          onChange={(e) => handleMethodChange(idx, 'transactionId', e.target.value)}
                          required={transactionIdMandatory(pm.paymentMethod)}
                          error={!!formErrors[`transactionId${idx}`]}
                          helperText={formErrors[`transactionId${idx}`]}
                          placeholder={
                            pm.paymentMethod === 'CHEQUE'
                              ? 'Cheque No.'
                              : pm.paymentMethod === 'UPI'
                              ? 'UPI Ref/UTR'
                              : pm.paymentMethod === 'NET_BANKING'
                              ? 'IMPS/NEFT Ref'
                              : pm.paymentMethod === 'CARD'
                              ? 'POS Slip Ref'
                              : 'Transaction Ref'
                          }
                          disabled={disablePaymentFields}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Reference"
                        value={pm.reference}
                        onChange={(e) => handleMethodChange(idx, 'reference', e.target.value)}
                        placeholder="Reference (optional)"
                        disabled={disablePaymentFields}
                      />
                    </Grid>
                    <Grid item xs={12} sm={9}>
                      <TextField
                        fullWidth
                        label="Notes"
                        value={pm.notes}
                        onChange={(e) => handleMethodChange(idx, 'notes', e.target.value)}
                        placeholder="Notes (optional)"
                        disabled={disablePaymentFields}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      {paymentMethods.length > 1 && (
                        <IconButton color="error" onClick={() => handleRemoveMethod(idx)} disabled={disablePaymentFields}>
                          <RemoveIcon />
                        </IconButton>
                      )}
                      {idx === paymentMethods.length - 1 && (
                        <IconButton color="primary" onClick={handleAddMethod} disabled={disablePaymentFields}>
                          <AddIcon />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                ))}
                <TextField
                  fullWidth
                  sx={{ mt: 2 }}
                  label="Payment Date & Time"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={disablePaymentFields}
                />
                <Tooltip title={isPaid ? "This sale is already fully paid. Payment not allowed." : ""}>
                  <span>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      type="submit"
                      sx={{ mt: 3, py: 1.5, borderRadius: '8px' }}
                      disabled={submitting || isPaid}
                      startIcon={<PaymentIcon />}
                    >
                      {submitting ? <CircularProgress size={24} color="inherit" /> : 'Record Payment'}
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
          </form>
        </Paper>
      )}

      {/* Payment History Tab */}
      {tab === 1 && (
        <Paper sx={{ maxWidth: 950, mx: 'auto', mt: 2, p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Autocomplete
              options={customers}
              getOptionLabel={option => option.name || ""}
              value={selectedCustomer}
              onChange={(_, newValue) => {
                setSelectedCustomer(newValue);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Customer" size="small" />
              )}
              isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
              sx={{ minWidth: 200 }}
            />
            <FormControl sx={{ minWidth: 200 }} disabled={!selectedCustomer}>
              <InputLabel id="sale-history-select-label">Sale</InputLabel>
              <Select
                labelId="sale-history-select-label"
                value={selectedSale}
                label="Sale"
                onChange={e => setSelectedSale(e.target.value)}
                size="small"
              >
                <MenuItem value="">All Sales</MenuItem>
                {customerSales.map((sale) => (
                  <MenuItem key={sale.saleId} value={sale.saleId}>
                    {sale.invoiceNo} (Due: {formatAmount(sale.dueAmount)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              size="small"
              sx={{ ml: 'auto' }}
              onClick={() => {
                // reload history
                if (selectedCustomer) {
                  if (selectedSale) {
                    fetchPaymentHistory(selectedCustomer.id, selectedSale);
                  } else {
                    fetchPaymentHistory(selectedCustomer.id);
                  }
                }
              }}
            >
              Refresh
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150 }}>
              <CircularProgress />
            </Box>
          ) : paymentHistory.length === 0 ? (
            <Typography>No payment history found for this customer/sale.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Pay</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : ''}</TableCell>
                      <TableCell>{p.invoiceNo || ""}</TableCell>
                      <TableCell>{formatAmount(p.amount)}</TableCell>
                      <TableCell>
                        <Chip label={p.paymentMethod} size="small" color="info" />
                      </TableCell>
                      <TableCell>{p.transactionId}</TableCell>
                      <TableCell>{p.reference}</TableCell>
                      <TableCell>{p.notes}</TableCell>
                      <TableCell>
                        <Chip
                          label={p.status}
                          size="small"
                          color={p.status === 'SUCCESS' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        {p.dueAmount > 0 ? (
                          <Tooltip title="Pay due for this sale">
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={() => {
                                setTab(0);
                                setSelectedSale(p.sourceId);
                              }}
                            >
                              Pay
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip title="No due for this sale">
                            <span>
                              <Button variant="outlined" size="small" disabled>
                                Paid
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
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