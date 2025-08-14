import React, { useState } from 'react';
import { Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Alert, Typography } from '@mui/material';
import { createSale } from '../services/api';

const Sales = () => {
  const [formData, setFormData] = useState({
    customerId: '',
    items: [],
    totalAmount: ''
  });
  const [item, setItem] = useState({ itemId: '', qty: '', unitPrice: '', itemVariantId: '', itemName: '' });
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, item] });
    setItem({ itemId: '', qty: '', unitPrice: '', itemVariantId: '', itemName: '' });
  };

  const handleSubmit = async () => {
    try {
      await createSale(formData);
      setSales([...sales, formData]);
      setFormData({ customerId: '', items: [], totalAmount: '' });
      setError('');
    } catch (err) {
      setError('Failed to create sale');
    }
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>Create Sale</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Customer ID" value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} />
      <TextField label="Total Amount" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} />
      <Typography variant="h6">Add Item</Typography>
      <TextField label="Item ID" value={item.itemId} onChange={(e) => setItem({ ...item, itemId: e.target.value })} />
      <TextField label="Quantity" value={item.qty} onChange={(e) => setItem({ ...item, qty: e.target.value })} />
      <TextField label="Unit Price" value={item.unitPrice} onChange={(e) => setItem({ ...item, unitPrice: e.target.value })} />
      <TextField label="Item Variant ID" value={item.itemVariantId} onChange={(e) => setItem({ ...item, itemVariantId: e.target.value })} />
      <TextField label="Item Name" value={item.itemName} onChange={(e) => setItem({ ...item, itemName: e.target.value })} />
      <Button variant="contained" onClick={handleAddItem}>Add Item</Button>
      <Button variant="contained" color="primary" onClick={handleSubmit}>Submit Sale</Button>
      <Typography variant="h5" gutterBottom>Sales List</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Customer ID</TableCell>
            <TableCell>Total Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sales.map((sale, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{sale.customerId}</TableCell>
              <TableCell>{sale.totalAmount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Sales;