import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { fetchItems, createItem } from '../services/api';

const Items = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ sku: '', name: '', unit: '', pricePerUnit: '', hsn: '', gstRate: '', photoPath: '' });

  useEffect(() => {
    fetchItems().then(res => setItems(res.data.map(item => ({ ...item, id: item.itemId }))))
      .catch(err => console.error('Items fetch error:', err));
  }, []);

  const handleSubmit = async () => {
    await createItem(formData);
    setOpen(false);
    fetchItems().then(res => setItems(res.data.map(item => ({ ...item, id: item.itemId }))));
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'sku', headerName: 'SKU', width: 150 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'unit', headerName: 'Unit', width: 100 },
    { field: 'pricePerUnit', headerName: 'Price', width: 120 },
    { field: 'hsn', headerName: 'HSN', width: 100 },
    { field: 'gstRate', headerName: 'GST Rate', width: 100 },
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Add Item</Button>
      <DataGrid rows={items} columns={columns} />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Item</DialogTitle>
        <DialogContent>
          <TextField label="SKU" fullWidth margin="dense" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
          <TextField label="Name" fullWidth margin="dense" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <TextField label="Unit" fullWidth margin="dense" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
          <TextField label="Price per Unit" fullWidth margin="dense" value={formData.pricePerUnit} onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })} />
          <TextField label="HSN" fullWidth margin="dense" value={formData.hsn} onChange={(e) => setFormData({ ...formData, hsn: e.target.value })} />
          <TextField label="GST Rate" fullWidth margin="dense" value={formData.gstRate} onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })} />
          <TextField label="Photo Path" fullWidth margin="dense" value={formData.photoPath} onChange={(e) => setFormData({ ...formData, photoPath: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Items;