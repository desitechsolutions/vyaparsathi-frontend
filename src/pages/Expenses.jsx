import React, { useState, useEffect } from 'react';
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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Card,
  CardContent,
  Fab,
  IconButton,
  DialogContentText,
  DialogActions as DeleteDialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { createExpense, fetchExpenses, updateExpense, deleteExpense } from '../services/api'; // Added updateExpense and deleteExpense

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [formData, setFormData] = useState({ shopId: 1, type: '', amount: '', date: '', notes: '' });
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Calculate total expenses and items
  const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const totalItems = expenses.length;

  // Fetch expenses from API with paginated response handling
  const fetchExpensesData = async () => {
    setLoading(true);
    try {
      const response = await fetchExpenses();
      const data = response.data;
      if (data && Array.isArray(data.content)) {
        setExpenses(data.content.map(exp => ({ ...exp, id: exp.id || exp.expenseId })));
      } else {
        console.error('Unexpected response format:', data);
        setExpenses([]);
        setSnackbar({ open: true, message: 'Unexpected data format from server.', severity: 'error' });
      }
    } catch (err) {
      console.error('Expenses fetch error:', err);
      setSnackbar({ open: true, message: 'Failed to fetch expenses.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesData();
  }, []);

  // Handle form submission for adding/updating
  const handleSubmit = async () => {
    if (!formData.type || !formData.amount) {
      setSnackbar({ open: true, message: 'Type and Amount are required.', severity: 'error' });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setSnackbar({ open: true, message: 'Amount must be a positive number.', severity: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        shopId: formData.shopId,
        type: formData.type,
        amount: amount.toString(),
        date: formData.date || new Date().toISOString().split('T')[0],
        notes: formData.notes || '',
      };
      if (openEdit && selectedExpenseId) {
        await updateExpense(selectedExpenseId, payload);
        setSnackbar({ open: true, message: 'Expense updated successfully!', severity: 'success' });
      } else {
        await createExpense(payload);
        setSnackbar({ open: true, message: 'Expense added successfully!', severity: 'success' });
      }
      setOpenAdd(false);
      setOpenEdit(false);
      fetchExpensesData();
      setFormData({ shopId: 1, type: '', amount: '', date: '', notes: '' });
      setSelectedExpenseId(null);
    } catch (err) {
      console.error('Expense operation error:', err.response ? err.response.data : err.message);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to save expense. Check console for details.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedExpenseId) return;
    setSubmitting(true);
    try {
      await deleteExpense(selectedExpenseId);
      setSnackbar({ open: true, message: 'Expense deleted successfully!', severity: 'success' });
      setOpenDelete(false);
      fetchExpensesData();
      setSelectedExpenseId(null);
    } catch (err) {
      console.error('Delete expense error:', err.response ? err.response.data : err.message);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to delete expense. Check console for details.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f5f8', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 4 }}>
        Expense Management
      </Typography>

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card raised sx={{ p: 2, borderRadius: '16px', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expense Summary
              </Typography>
              <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                ₹{totalExpenses.toFixed(2)}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Total Expenses
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                You have recorded a total of {totalItems} expenses.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Fab
            color="primary"
            aria-label="add"
            variant="extended"
            onClick={() => setOpenAdd(true)}
            sx={{ textTransform: 'none', height: '48px', padding: '0 24px' }}
          >
            <AddIcon sx={{ mr: 1 }} />
            Add New Expense
          </Fab>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3} sx={{ overflowX: 'auto', borderRadius: '16px' }}>
          <Table stickyHeader aria-label="expense table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>₹{row.amount}</TableCell>
                  <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                  <TableCell>{row.notes || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setFormData({ shopId: row.shopId, type: row.type, amount: row.amount.toString(), date: row.date.split('T')[0], notes: row.notes || '' });
                        setSelectedExpenseId(row.id);
                        setOpenEdit(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedExpenseId(row.id);
                        setOpenDelete(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Type"
            fullWidth
            margin="dense"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          />
          <TextField
            label="Amount"
            fullWidth
            margin="dense"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            inputProps={{ step: '0.01', min: '0.01' }}
            required
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <TextField
            label="Notes"
            fullWidth
            margin="dense"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Type"
            fullWidth
            margin="dense"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          />
          <TextField
            label="Amount"
            fullWidth
            margin="dense"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            inputProps={{ step: '0.01', min: '0.01' }}
            required
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <TextField
            label="Notes"
            fullWidth
            margin="dense"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this expense? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DeleteDialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DeleteDialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default Expenses;