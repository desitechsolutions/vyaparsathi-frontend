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
} from '@mui/material';
import { fetchCustomerDues } from '../services/api'; // Removed fetchCustomers

const CustomerDetails = () => {
  const { id } = useParams(); // Customer ID from URL
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null); // Store customer details
  const [dues, setDues] = useState([]);
  const [totalDues, setTotalDues] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmount
    const loadData = async () => {
      setLoading(true);
      try {
        const duesResponse = await fetchCustomerDues(id);
        console.log('API Response:', duesResponse.data);
        const duesData = duesResponse.data.content || duesResponse.data || [];
        if (isMounted) {
          // Extract customer details from the first sale's customer (assuming consistency)
          const firstSale = duesData[0];
          setCustomer(firstSale ? {
            name: firstSale.customerName || 'Unknown Customer',
            addressLine1: firstSale.addressLine1 || 'N/A',
            city: firstSale.city || '',
            state: firstSale.state || '',
            postalCode: firstSale.postalCode || ''
          } : { name: 'Unknown Customer', addressLine1: 'N/A' });
          setDues(duesData);
          const calculatedTotalDues = duesData.reduce((sum, due) => sum + (due.dueAmount || 0), 0);
          setTotalDues(calculatedTotalDues);
        }
      } catch (err) {
        if (isMounted) {
          setSnackbar({ open: true, message: 'Failed to load data.', severity: 'error' });
          console.error('Error fetching data:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();

    return () => {
      isMounted = false; // Cleanup on unmount
    };
  }, [id]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#eef2f7', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#3f51b5' }}>
        Customer Dues - {customer?.name || 'Unknown Customer'} (ID: {id})
      </Typography>
      <Typography variant="body1" gutterBottom>
        Address: {customer?.addressLine1 || 'N/A'}, {customer?.city || ''}, {customer?.state || ''}, {customer?.postalCode || ''}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Total Dues: ₹{totalDues.toFixed(2)}
      </Typography>
      <Paper sx={{ mt: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Invoice No</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Paid Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Due Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dues.map((due) => (
              <TableRow key={due.saleId}>
                <TableCell>{due.invoiceNo || 'N/A'}</TableCell>
                <TableCell>{due.date ? new Date(due.date).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>₹{(due.totalAmount ?? 0).toFixed(2)}</TableCell>
                <TableCell>₹{((due.totalAmount ?? 0) - (due.dueAmount ?? 0)).toFixed(2)}</TableCell>
                <TableCell>₹{(due.dueAmount ?? 0).toFixed(2)}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => navigate(`/customer-payments?saleId=${due.saleId || ''}`)}
                    disabled={!due.saleId}
                  >
                    Pay Now
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
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

export default CustomerDetails;