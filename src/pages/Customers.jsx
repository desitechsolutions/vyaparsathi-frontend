import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter,
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
  Typography,
  Snackbar,
  Alert,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { fetchCustomers, createCustomer, updateCustomer } from '../services/api';

// Toolbar that matches the Items.jsx layout
const CustomToolbar = ({ onAddCustomerClick }) => (
  <GridToolbarContainer sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Box>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
    </Box>
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <GridToolbarQuickFilter
        variant="outlined"
        size="small"
        placeholder="Search customers..."
        debounceMs={300}
      />
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddCustomerClick}
      >
        Add New Customer
      </Button>
    </Box>
  </GridToolbarContainer>
);

const initialFormState = {
  id: '', name: '', phone: '', email: '', addressLine1: '', addressLine2: '',
  city: '', state: '', postalCode: '', country: '', gstNumber: '',
  panNumber: '', notes: '', creditBalance: '',
};

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Unified dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCustomers();
      setCustomers(res.data.map(c => ({ ...c, outstanding: c.creditBalance || 0 })));
    } catch (err) {
      showSnackbar('Failed to load customers.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setFormData(initialFormState);
  };

  const handleAddClick = () => {
    setEditingCustomer(null);
    setFormData(initialFormState);
    setIsDialogOpen(true);
  };

  const handleEditClick = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      id: customer.id,
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      addressLine1: customer.addressLine1 || '',
      addressLine2: customer.addressLine2 || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.postalCode || '',
      country: customer.country || '',
      gstNumber: customer.gstNumber || '',
      panNumber: customer.panNumber || '',
      notes: customer.notes || '',
      creditBalance: customer.creditBalance || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        // In edit mode, we don't send creditBalance
        const { creditBalance, ...updateData } = formData;
        await updateCustomer(editingCustomer.id, updateData);
        showSnackbar('Customer updated successfully!', 'success');
      } else {
        await createCustomer(formData);
        showSnackbar('Customer added successfully!', 'success');
      }
      handleDialogClose();
      loadCustomers();
    } catch (err) {
      showSnackbar(`Failed to ${editingCustomer ? 'update' : 'add'} customer.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetailsClick = (customer) => {
    navigate(`/customer-details/${customer.id}/dues`);
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'state', headerName: 'State', width: 120 },
    {
      field: 'outstanding',
      headerName: 'Outstanding',
      width: 150,
      type: 'number',
      valueFormatter: ({ value }) => `₹${Number(value || 0).toFixed(2)}`,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton color="default" onClick={() => handleViewDetailsClick(params.row)}>
              <ReceiptLongIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Customer">
            <IconButton color="primary" onClick={() => handleEditClick(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Customers
      </Typography>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : (
        <Paper elevation={2} sx={{ width: '100%', height: 'auto' }}>
          <DataGrid
            rows={customers}
            columns={columns}
            autoHeight
            getRowId={(row) => row.id}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              columns: {
                columnVisibilityModel: {
                  id: false, addressLine1: false, addressLine2: false, postalCode: false,
                  country: false, gstNumber: false, panNumber: false,
                },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            slots={{ toolbar: CustomToolbar }}
            slotProps={{ toolbar: { onAddCustomerClick: handleAddClick } }}
            sx={{ border: 0, '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' } }}
          />
        </Paper>
      )}

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isDialogOpen} onClose={handleDialogClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Box component="form" sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <TextField label="Name" name="name" value={formData.name} onChange={handleFormChange} required />
            <TextField label="Phone" name="phone" value={formData.phone} onChange={handleFormChange} />
            <TextField label="Email" name="email" value={formData.email} onChange={handleFormChange} />
            <TextField label="GSTIN" name="gstNumber" value={formData.gstNumber} onChange={handleFormChange} />
            <TextField label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleFormChange} />
            <TextField label="Credit Balance" name="creditBalance" type="number" value={formData.creditBalance} onChange={handleFormChange} disabled={!!editingCustomer} helperText={editingCustomer ? "Cannot edit balance directly." : "Initial credit balance."} />
            <TextField label="Address Line 1" name="addressLine1" value={formData.addressLine1} onChange={handleFormChange} />
            <TextField label="Address Line 2" name="addressLine2" value={formData.addressLine2} onChange={handleFormChange} />
            <TextField label="City" name="city" value={formData.city} onChange={handleFormChange} />
            <TextField label="State" name="state" value={formData.state} onChange={handleFormChange} />
            <TextField label="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleFormChange} />
            <TextField label="Country" name="country" value={formData.country} onChange={handleFormChange} />
            <TextField label="Notes" name="notes" value={formData.notes} onChange={handleFormChange} multiline rows={2} sx={{ gridColumn: '1 / -1' }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;