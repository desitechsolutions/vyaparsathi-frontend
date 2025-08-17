import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Card,
  CardContent,
  Snackbar,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Added useSearchParams
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { fetchSalesWithDue, fetchSaleDueById, recordDuePayment } from '../services/api'; // Removed fetchCustomers

const CustomerPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Get saleId from URL params
  const initialSaleId = searchParams.get('saleId');

  // State for data
  const [sales, setSales] = useState([]);
  const [dueAmount, setDueAmount] = useState(0);
  const [totalDue, setTotalDue] = useState(0);

  // State for form inputs
  const [selectedSale, setSelectedSale] = useState(initialSaleId || ''); // Pre-select saleId from params
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // State for UI/UX
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formErrors, setFormErrors] = useState({});
  const [sortBy, setSortBy] = useState('dueAmount');

  // Fetch sales with due amounts on component mount
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component
    const loadData = async () => {
      setLoading(true);
      try {
        const salesResponse = await fetchSalesWithDue();
        const salesData = salesResponse.data || [];
        setSales(salesData);

        // Calculate and set the total due amount
        const calculatedTotalDue = salesData.reduce((sum, sale) => sum + (sale.dueAmount || 0), 0);
        setTotalDue(calculatedTotalDue);

        // Auto-select the saleId from params if valid
        if (initialSaleId && salesData.some(sale => sale.saleId === parseInt(initialSaleId))) {
          setSelectedSale(initialSaleId);
        }
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to load data.', severity: 'error' });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false; // Cleanup on unmount
    };
  }, [initialSaleId]); // Re-run if initialSaleId changes

  // Fetches due amount for the selected sale
  useEffect(() => {
    if (selectedSale) {
      const loadDueAmount = async () => {
        try {
          const response = await fetchSaleDueById(selectedSale);
          setDueAmount(response.data.dueAmount || 0);
        } catch (err) {
          setSnackbar({ open: true, message: 'Failed to load due amount.', severity: 'error' });
        }
      };
      loadDueAmount();
    } else {
      setDueAmount(0);
    }
  }, [selectedSale]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    let errors = {};
    const amount = parseFloat(paymentAmount);
    if (!selectedSale) errors.selectedSale = 'Please select a sale/customer data.';
    if (!paymentAmount) errors.paymentAmount = 'Please enter a payment amount.';
    else if (isNaN(amount) || amount <= 0) errors.paymentAmount = 'Please enter a valid positive amount.';
    else if (amount > dueAmount) errors.paymentAmount = 'Payment amount cannot exceed due amount.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      const response = await recordDuePayment({
        saleId: selectedSale,
        amount: amount,
        method: paymentMethod,
        date: paymentDate,
      });

      if (response.status === 200) {
        setSnackbar({ open: true, message: 'Payment recorded successfully!', severity: 'success' });
        setTimeout(() => navigate('/sales'), 2000);
      } else {
        setSnackbar({ open: true, message: 'Failed to record payment.', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'An unexpected error occurred.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f5f8' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2, color: 'text.secondary' }}>Loading sales data...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        bgcolor: '#eef2f7',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{ fontWeight: 700, color: '#3f51b5', mb: 4, textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}
      >
        Record Customer Due Payment
      </Typography>

      <Card
        raised
        sx={{
          width: '100%',
          maxWidth: '600px',
          borderRadius: '16px',
          p: 2,
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#fafafa',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Total Customer Dues</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#d32f2f' }}>
            ₹{totalDue.toFixed(2)}
          </Typography>
        </Box>
      </Card>

      <Card
        raised
        sx={{
          width: '100%',
          maxWidth: '600px',
          borderRadius: '16px',
          p: { xs: 2, md: 4 },
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <RadioGroup
                    row
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <FormControlLabel value="dueAmount" control={<Radio />} label="Sort by Due Amount" />
                    <FormControlLabel value="customerName" control={<Radio />} label="Sort by Customer Name" />
                  </RadioGroup>
                </FormControl>
                <FormControl fullWidth margin="normal" error={!!formErrors.selectedSale}>
                  <InputLabel id="sale-select-label">Select Sale</InputLabel>
                  <Select
                    labelId="sale-select-label"
                    value={selectedSale}
                    label="Select Sale"
                    onChange={(e) => setSelectedSale(e.target.value)}
                  >
                    <MenuItem value="">Select a sale</MenuItem>
                    {sales.map((sale) => (
                      <MenuItem key={sale.saleId} value={sale.saleId}>
                        {sale.invoiceNo} (Customer: {sale.customerName || 'Unknown Customer'}, Due: ₹{(sale.dueAmount || 0).toFixed(2)})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.selectedSale && (
                    <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                      {formErrors.selectedSale}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Due Amount for Selected Sale"
                  value={`₹${dueAmount.toFixed(2)}`}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Payment Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  error={!!formErrors.paymentAmount}
                  helperText={formErrors.paymentAmount}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Payment Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  type="submit"
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                  disabled={submitting || loading}
                >
                  {submitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      <PaymentIcon sx={{ mr: 1 }} />
                      Record Payment
                    </>
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

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