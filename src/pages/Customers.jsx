import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { fetchCustomers, createCustomer } from '../services/api';

// Reusable toolbar with a quick search box
function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', p: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        Customers
      </Typography>
      <GridToolbarQuickFilter placeholder="Search..." />
    </GridToolbarContainer>
  );
}

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState());

  function initialFormState() {
    return {
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
    };
  }

  // Common mapping function
  const mapCustomer = (customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '',
    address: `${customer.addressLine1 || ''} ${customer.addressLine2 || ''}`.trim(),
    state: customer.state,
    gstNumber: customer.gstNumber || '',
    outstanding: customer.creditBalance || 0
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetchCustomers();
      setCustomers(res.data.map(mapCustomer));
    } catch (err) {
      console.error('Customers fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSubmit = async () => {
    try {
      await createCustomer(formData);
      setOpen(false);
      setFormData(initialFormState());
      loadCustomers();
    } catch (err) {
      console.error('Error creating customer:', err);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'address', headerName: 'Address', flex: 1, minWidth: 200 },
    { field: 'state', headerName: 'State', width: 120 },
    { field: 'gstNumber', headerName: 'GSTIN', width: 150 },
    {
      field: 'outstanding',
      headerName: 'Outstanding',
      width: 150,
      type: 'number',
      valueFormatter: ({ value }) => value?.toFixed(2)
    }
  ];

  return (
    <Box sx={{ height: 600, width: '100%', p: 2 }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpen(true)}
        >
          Add Customer
        </Button>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 400
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={customers}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          components={{
            Toolbar: CustomToolbar
          }}
          autoHeight
        />
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
            <TextField
              label="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <TextField
              label="GSTIN"
              value={formData.gstNumber}
              onChange={(e) =>
                setFormData({ ...formData, gstNumber: e.target.value })
              }
            />
            <TextField
              label="PAN Number"
              value={formData.panNumber}
              onChange={(e) =>
                setFormData({ ...formData, panNumber: e.target.value })
              }
            />
            <TextField
              label="Credit Balance"
              type="number"
              value={formData.creditBalance}
              onChange={(e) =>
                setFormData({ ...formData, creditBalance: e.target.value })
              }
            />
            <TextField
              label="Address Line 1"
              value={formData.addressLine1}
              onChange={(e) =>
                setFormData({ ...formData, addressLine1: e.target.value })
              }
            />
            <TextField
              label="Address Line 2"
              value={formData.addressLine2}
              onChange={(e) =>
                setFormData({ ...formData, addressLine2: e.target.value })
              }
            />
            <TextField
              label="City"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
            <TextField
              label="State"
              value={formData.state}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value })
              }
            />
            <TextField
              label="Postal Code"
              value={formData.postalCode}
              onChange={(e) =>
                setFormData({ ...formData, postalCode: e.target.value })
              }
            />
            <TextField
              label="Country"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
            />
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
