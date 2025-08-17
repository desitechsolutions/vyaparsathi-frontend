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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchCustomers } from '../services/api';

const CustomerPaymentPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [dueAmount, setDueAmount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetchCustomers();
        const data = await response.json();
        setCustomers(data);
      } catch (err) {
        setError('Failed to load customers');
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      const fetchDueAmount = async () => {
        try {
          const response = await fetchCustomers();
          const data = await response.json();
          setDueAmount(data.dueAmount || 0);
        } catch (err) {
          setError('Failed to load due amount');
        }
      };
      fetchDueAmount();
    }
  }, [selectedCustomer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount) {
      setError('Please select a customer and enter a payment amount');
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (amount > dueAmount) {
      setError('Payment amount cannot exceed due amount');
      return;
    }

    try {
      const response = await fetch('/api/payments/due', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          amount: amount,
          method: paymentMethod,
          date: new Date().toISOString(),
        }),
      });
      if (response.ok) {
        setError('');
        setPaymentAmount('');
        navigate('/customers'); // Redirect to customers page after success
      } else {
        setError('Failed to record payment');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Record Customer Due Payment
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Customer</InputLabel>
          <Select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            {customers.map((customer) => (
              <MenuItem key={customer.id} value={customer.id}>
                {customer.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          margin="normal"
          label="Due Amount"
          value={dueAmount.toFixed(2)}
          InputProps={{ readOnly: true }}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Payment Amount"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Payment Method</InputLabel>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="UPI">UPI</MenuItem>
            <MenuItem value="Card">Card</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          sx={{ mt: 2 }}
        >
          Record Payment
        </Button>
      </form>
    </Box>
  );
};

export default CustomerPaymentPage;