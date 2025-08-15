import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { createExpense } from '../services/api';
import API from '../services/api';

const Expenses = () => {
  // State for expenses data and loading status
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for the "Add Expense" dialog
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ shopId: 1, type: '', amount: '', date: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  // State for user feedback (Snackbar)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Function to fetch expenses from the API
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/expenses');
      // The API response is mapped to ensure a unique 'id' for the DataGrid
      setExpenses(res.data.map(exp => ({ ...exp, id: exp.expenseId })));
    } catch (err) {
      console.error('Expenses fetch error:', err);
      setSnackbar({ open: true, message: 'Failed to fetch expenses.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Handler for form submission
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createExpense(formData);
      setSnackbar({ open: true, message: 'Expense added successfully!', severity: 'success' });
      setOpen(false);
      // Re-fetch data to update the table with the new expense
      fetchExpenses();
      // Reset form data after successful submission
      setFormData({ shopId: 1, type: '', amount: '', date: '', notes: '' });
    } catch (err) {
      console.error('Create expense error:', err);
      setSnackbar({ open: true, message: 'Failed to add expense.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Columns configuration for the DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'type', headerName: 'Type', width: 150 },
    { field: 'amount', headerName: 'Amount', width: 120, type: 'number' },
    { field: 'date', headerName: 'Date', width: 150,
      valueFormatter: (params) => {
        // Format the date for better readability
        return new Date(params.value).toLocaleDateString();
      }
    },
    { field: 'notes', headerName: 'Notes', flex: 1, minWidth: 200 },
  ];

  // Handler to close the snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Expenses
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Expense
        </Button>
      </Box>

      {/* Conditionally render CircularProgress while loading data */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: '70vh', width: '100%' }}>
          <DataGrid
            rows={expenses}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            disableSelectionOnClick
          />
        </Box>
      )}

      {/* Dialog for adding a new expense */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <TextField
            label="Type"
            fullWidth
            margin="dense"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />
          <TextField
            label="Amount"
            fullWidth
            margin="dense"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <TextField
            label="Notes"
            fullWidth
            margin="dense"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for user feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Expenses;
