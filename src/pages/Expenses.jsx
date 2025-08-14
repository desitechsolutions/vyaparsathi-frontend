import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { createExpense } from '../services/api';
import API from '../services/api';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ shopId: 1, type: '', amount: '', date: '', notes: '' });

  useEffect(() => {
    // Fetch expenses (add endpoint if needed)
    API.get('/api/expenses').then(res => setExpenses(res.data.map(exp => ({ ...exp, id: exp.expenseId }))))
      .catch(err => console.error('Expenses fetch error:', err));
  }, []);

  const handleSubmit = async () => {
    await createExpense(formData);
    setOpen(false);
    API.get('/api/expenses').then(res => setExpenses(res.data.map(exp => ({ ...exp, id: exp.expenseId }))));
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'type', headerName: 'Type', width: 150 },
    { field: 'amount', headerName: 'Amount', width: 120 },
    { field: 'date', headerName: 'Date', width: 150 },
    { field: 'notes', headerName: 'Notes', width: 200 },
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Add Expense</Button>
      <DataGrid rows={expenses} columns={columns} />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogContent>
          <TextField label="Type" fullWidth margin="dense" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} />
          <TextField label="Amount" fullWidth margin="dense" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
          <TextField label="Date" type="date" fullWidth margin="dense" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          <TextField label="Notes" fullWidth margin="dense" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Expenses;