import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { fetchCustomers, createCustomer } from '../services/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    gstNumber: '',
    panNumber: '',
    notes: '',
    creditBalance: ''
  });

  useEffect(() => {
    fetchCustomers()
      .then(res => {
        // Map the API response using the correct 'id' field from CustomerDto
        const mappedCustomers = res.data.map(customer => ({
          id: customer.id, // Use 'id' instead of 'customerId'
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '', // Default to empty string if null
          address: `${customer.addressLine1 || ''} ${customer.addressLine2 || ''}`.trim(), // Combine address fields
          state: customer.state,
          gstNumber: customer.gstNumber || '', // Default to empty string if null
          outstanding: customer.creditBalance || 0 // Use creditBalance as outstanding
        }));
        setCustomers(mappedCustomers);
      })
      .catch(err => console.error('Customers fetch error:', err));
  }, []);

  const handleSubmit = async () => {
    await createCustomer(formData);
    setOpen(false);
    fetchCustomers().then(res => {
      const mappedCustomers = res.data.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: `${customer.addressLine1 || ''} ${customer.addressLine2 || ''}`.trim(),
        state: customer.state,
        gstNumber: customer.gstNumber || '',
        outstanding: customer.creditBalance || 0
      }));
      setCustomers(mappedCustomers);
    });
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'address', headerName: 'Address', width: 250 },
    { field: 'state', headerName: 'State', width: 100 },
    { field: 'gstNumber', headerName: 'GSTIN', width: 150 },
    { field: 'outstanding', headerName: 'Outstanding', width: 150 },
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Add Customer</Button>
      <DataGrid rows={customers} columns={columns} />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth margin="dense" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <TextField label="Phone" fullWidth margin="dense" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <TextField label="Email" fullWidth margin="dense" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <TextField label="Address Line 1" fullWidth margin="dense" value={formData.addressLine1} onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })} />
          <TextField label="Address Line 2" fullWidth margin="dense" value={formData.addressLine2} onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })} />
          <TextField label="City" fullWidth margin="dense" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
          <TextField label="State" fullWidth margin="dense" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
          <TextField label="Postal Code" fullWidth margin="dense" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} />
          <TextField label="Country" fullWidth margin="dense" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
          <TextField label="GSTIN" fullWidth margin="dense" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} />
          <TextField label="PAN Number" fullWidth margin="dense" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })} />
          <TextField label="Notes" fullWidth margin="dense" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          <TextField label="Credit Balance" fullWidth margin="dense" value={formData.creditBalance} onChange={(e) => setFormData({ ...formData, creditBalance: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Customers;