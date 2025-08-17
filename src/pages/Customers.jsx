import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridRenderCellParams,
  GridRowParams,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import { fetchCustomers, createCustomer, updateCustomer, fetchCustomerDues } from '../services/api';

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
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [formData, setFormData] = useState(initialFormState());
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dues, setDues] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  function initialFormState() {
    return {
      id: '',
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
      creditBalance: '',
    };
  }

  const mapCustomer = (customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '',
    address: `${customer.addressLine1 || ''} ${customer.addressLine2 || ''}`.trim(),
    state: customer.state,
    gstNumber: customer.gstNumber || '',
    outstanding: customer.creditBalance || 0,
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetchCustomers();
      setCustomers(res.data.map(mapCustomer));
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load customers.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleAddSubmit = async () => {
    try {
      await createCustomer(formData);
      setOpenAdd(false);
      setFormData(initialFormState());
      loadCustomers();
      setSnackbar({ open: true, message: 'Customer added successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add customer.', severity: 'error' });
    }
  };

  const handleEditSubmit = async () => {
    try {
      await updateCustomer(selectedCustomer.id, formData);
      setOpenEdit(false);
      setSelectedCustomer(null);
      loadCustomers();
      setSnackbar({ open: true, message: 'Customer updated successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update customer.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const loadDuesForCustomer = async (customerId) => {
    if (!dues[customerId]) {
      try {
        const response = await fetchCustomerDues(customerId);
        setDues(prev => ({
          ...prev,
          [customerId]: response.data.content || response.data || [],
        }));
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to load dues.', severity: 'error' });
      }
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70, sortable: false },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150, sortable: true },
    { field: 'phone', headerName: 'Phone', width: 150, sortable: true },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200, sortable: true },
    { field: 'address', headerName: 'Address', flex: 1, minWidth: 200, sortable: true },
    { field: 'state', headerName: 'State', width: 120, sortable: true },
    { field: 'gstNumber', headerName: 'GSTIN', width: 150, sortable: true },
    {
      field: 'outstanding',
      headerName: 'Outstanding',
      width: 150,
      type: 'number',
      sortable: true,
      valueFormatter: ({ value }) => `₹${value?.toFixed(2)}`,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => {
              setSelectedCustomer(params.row);
              setFormData({ ...params.row, creditBalance: params.row.outstanding });
              setOpenEdit(true);
            }}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => navigate(`/customer-details/${params.row.id}/dues`)}
          >
            View Dues
          </Button>
        </>
      ),
    },
  ];

  const getDetailPanelContent = ({ row }) => {
    useEffect(() => {
      loadDuesForCustomer(row.id);
    }, [row.id]);

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Outstanding Invoices
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Invoice No</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dues[row.id]?.map((due) => (
              <TableRow key={due.saleId}>
                <TableCell>{due.invoiceNo}</TableCell>
                <TableCell>{new Date(due.date).toLocaleDateString()}</TableCell>
                <TableCell>₹{due.dueAmount.toFixed(2)}</TableCell>
              </TableRow>
            )) || <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Box>
    );
  };

  return (
    <Box sx={{ height: 600, width: '100%', p: 2 }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenAdd(true)}
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
            height: 400,
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
          getDetailPanelContent={getDetailPanelContent}
          getDetailPanelHeight={() => 200}
          components={{
            Toolbar: CustomToolbar,
          }}
          autoHeight
        />
      )}

      {/* Add Customer Dialog */}
      <Dialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="GSTIN"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
            <TextField
              label="PAN Number"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
            />
            <TextField
              label="Credit Balance"
              type="number"
              value={formData.creditBalance}
              onChange={(e) => setFormData({ ...formData, creditBalance: e.target.value })}
            />
            <TextField
              label="Address Line 1"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            />
            <TextField
              label="Address Line 2"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            />
            <TextField
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <TextField
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <TextField
              label="Postal Code"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
            <TextField
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button onClick={handleAddSubmit} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            <TextField
              label="ID"
              value={formData.id}
              InputProps={{ readOnly: true }}
              disabled
            />
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="GSTIN"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
            <TextField
              label="PAN Number"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
            />
            <TextField
              label="Credit Balance"
              type="number"
              value={formData.creditBalance}
              InputProps={{ readOnly: true }}
              disabled
            />
            <TextField
              label="Address Line 1"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            />
            <TextField
              label="Address Line 2"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            />
            <TextField
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <TextField
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <TextField
              label="Postal Code"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
            <TextField
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;