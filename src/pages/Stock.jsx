import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { fetchStock, addStock } from '../services/api';

const Stock = () => {
  const [stock, setStock] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ itemId: '', quantity: '', batch: '' });

  useEffect(() => {
    fetchStock().then(res => setStock(res.data.map(item => ({ ...item, id: item.itemId }))))
      .catch(err => console.error('Stock fetch error:', err));
  }, []);

  const handleSubmit = async () => {
    await addStock(formData);
    setOpen(false);
    fetchStock().then(res => setStock(res.data.map(item => ({ ...item, id: item.itemId }))));
  };

  const columns = [
    { field: 'id', headerName: 'Item ID', width: 150 },
    { field: 'totalQuantity', headerName: 'Total Quantity', width: 150 },
    { field: 'batch', headerName: 'Batch', width: 150 },
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Add Stock</Button>
      <DataGrid rows={stock} columns={columns} />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Stock</DialogTitle>
        <DialogContent>
          <TextField label="Item ID" fullWidth margin="dense" value={formData.itemId} onChange={(e) => setFormData({ ...formData, itemId: e.target.value })} />
          <TextField label="Quantity" fullWidth margin="dense" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
          <TextField label="Batch" fullWidth margin="dense" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Stock;