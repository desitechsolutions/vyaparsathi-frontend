import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  Chip,
  Grid,
} from '@mui/material';
import { fetchCustomerDues } from '../services/api';

const formatAmount = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const extractCustomerFromDues = (duesData) => {
  // Use first sale record for customer details if available
  if (duesData && duesData.length > 0) {
    const first = duesData[0];
    return {
      name: first.customerName,
      addressLine1: first.addressLine1,
      city: first.city,
      state: first.state,
      postalCode: first.postalCode,
    };
  }
  return null;
};

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [dues, setDues] = useState([]);
  const [totalDues, setTotalDues] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    let controller = new AbortController();
    let signal = controller.signal;

    const loadData = async () => {
      setLoading(true);
      let duesData = [];
      let errorText = '';

      try {
        const response = await fetchCustomerDues(id, { signal });
        duesData = response?.data?.content || response?.data || [];
        setDues(duesData);
        setCustomer(extractCustomerFromDues(duesData));
        setTotalDues(duesData.reduce((sum, due) => sum + (due.dueAmount || 0), 0));
        setTotalSales(duesData.reduce((sum, due) => sum + (due.totalAmount || 0), 0));
        setTotalPaid(duesData.reduce((sum, due) => sum + ((due.totalAmount || 0) - (due.dueAmount || 0)), 0));

        if (!duesData.length) {
          errorText = 'No sales/dues found for this customer.';
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          errorText = 'Failed to load customer dues. Please try again.';
        }
      } finally {
        if (errorText) {
          setSnackbar({ open: true, message: errorText.trim(), severity: 'error' });
        }
        setLoading(false);
      }
    };
    if (id) loadData();
    return () => { controller.abort(); };
  }, [id]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Customer not found
        </Typography>
        <Button onClick={() => navigate('/customers')} variant="contained">
          Back to Customers
        </Button>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Button
        variant="outlined"
        onClick={() => navigate('/customers')}
        sx={{ mb: 2 }}
      >
        &larr; Back to Customers
      </Button>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        {customer?.name || 'Customer Details'}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {customer?.addressLine1}
        {customer?.city && `, ${customer.city}`}
        {customer?.state && `, ${customer.state}`}
        {customer?.postalCode && `, ${customer.postalCode}`}
      </Typography>
      <Grid container spacing={2} sx={{ my: 2 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">TOTAL SALES</Typography>
            <Typography variant="h5" fontWeight="bold">{formatAmount(totalSales)}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">TOTAL PAID</Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">{formatAmount(totalPaid)}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">TOTAL DUES</Typography>
            <Typography variant="h5" fontWeight="bold" color="error.main">{formatAmount(totalDues)}</Typography>
          </Card>
        </Grid>
      </Grid>
      <Paper sx={{ mt: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Invoice No</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Total Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Paid Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Due Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dues.length > 0 ? dues.map((due) => (
              <TableRow key={due.saleId} hover>
                <TableCell>{due.invoiceNo || 'N/A'}</TableCell>
                <TableCell>{due.date ? new Date(due.date).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell align="right">{formatAmount(due.totalAmount)}</TableCell>
                <TableCell align="right">{formatAmount((due.totalAmount ?? 0) - (due.dueAmount ?? 0))}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'medium', color: due.dueAmount > 0 ? 'error.main' : 'inherit' }}>
                  {formatAmount(due.dueAmount)}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={due.dueAmount > 0 ? 'DUE' : 'PAID'}
                    color={due.dueAmount > 0 ? 'warning' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => navigate(`/customer-payments?saleId=${due.saleId || ''}`)}
                    disabled={!due.saleId || due.dueAmount <= 0}
                  >
                    Pay Now
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No sales history found for this customer.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerDetails;