import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DataGrid, GridToolbarContainer, GridToolbarColumnsButton,
  GridToolbarFilterButton, GridToolbarDensitySelector, GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import {
  Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle,
  CircularProgress, Box, Typography, Snackbar, Alert, Paper, IconButton,
  Tooltip, Avatar, Stack, Card, Grid, Divider, Chip
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, ReceiptLong as StatementIcon,
  Visibility as ViewIcon, AccountCircle as AccountIcon, 
  TrendingUp as TrendingUpIcon, WhatsApp as WhatsAppIcon,
  MedicalServices as MedicalServicesIcon,
  Vaccines as VaccinesIcon,
} from '@mui/icons-material';
import { fetchCustomers, createCustomer, updateCustomer } from '../services/api';
import { useShop } from '../context/ShopContext';

const CustomToolbar = ({ onAddClick, isPharmacy }) => (
  <GridToolbarContainer sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
    <Box sx={{ display: 'flex', gap: 1 }}>
      <GridToolbarQuickFilter variant="outlined" size="small" sx={{ width: 250 }} />
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
    </Box>
    <Button variant="contained" startIcon={<AddIcon />} onClick={onAddClick}>
      {isPharmacy ? 'Register New Patient' : 'Add New Customer'}
    </Button>
  </GridToolbarContainer>
);

const initialFormState = {
  name: '', phone: '', email: '', addressLine1: '', addressLine2: '',
  city: '', state: '', postalCode: '', country: 'India', gstNumber: '',
  panNumber: '', notes: '', creditBalance: 0,
  // Pharmacy-specific (stored in notes if backend doesn't support them yet)
  dateOfBirth: '', bloodGroup: '', allergies: '', chronicConditions: '',
};

const Customers = () => {
  const navigate = useNavigate();
  const { isPharmacy } = useShop();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCustomers();
      setCustomers(res.data.map(c => ({ ...c, outstanding: c.creditBalance || 0 })));
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load customers.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const stats = useMemo(() => {
    const total = customers.length;
    const totalAmount = customers.reduce((sum, c) => sum + (c.outstanding || 0), 0);
    return { total, totalAmount };
  }, [customers]);

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        const { outstanding, creditBalance, ...updateData } = formData;
        await updateCustomer(editingCustomer.id, updateData);
      } else {
        await createCustomer(formData);
      }
      setSnackbar({ open: true, message: `${isPharmacy ? 'Patient' : 'Customer'} saved successfully!`, severity: 'success' });
      setIsDialogOpen(false);
      loadCustomers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Operation failed.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: isPharmacy ? 'Patient Name' : 'Customer Name',
      flex: 1.5,
      renderCell: (params) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: isPharmacy ? '#e0f2e9' : 'primary.light', color: isPharmacy ? '#166534' : undefined, fontSize: '14px' }}>
            {params.value ? params.value[0].toUpperCase() : (isPharmacy ? 'P' : 'C')}
          </Avatar>
          <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
        </Stack>
      ),
    },
    { field: 'phone', headerName: 'Phone', flex: 1 },
    ...(isPharmacy
      ? [
          {
            field: 'notes',
            headerName: 'Medical Notes',
            flex: 1.5,
            valueFormatter: ({ value }) => value || '—',
          },
        ]
      : [
          { field: 'gstNumber', headerName: 'GSTIN', flex: 1, valueFormatter: ({ value }) => value || 'N/A' },
        ]),
    {
      field: 'outstanding',
      headerName: isPharmacy ? 'Outstanding Dues' : 'Outstanding',
      flex: 1,
      type: 'number',
      renderCell: (params) => (
        <Typography color={params.value > 0 ? 'error.main' : 'success.main'} fontWeight={700}>
          ₹{Number(params.value).toLocaleString('en-IN')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title={isPharmacy ? 'View Dues' : 'View Dues'}><IconButton size="small" color="info" onClick={() => navigate(`/customer-details/${params.row.id}/dues`)}><StatementIcon /></IconButton></Tooltip>
          <Tooltip title={isPharmacy ? 'Edit Patient' : 'View/Edit Profile'}><IconButton size="small" color="primary" onClick={() => { setEditingCustomer(params.row); setFormData({ ...initialFormState, ...params.row }); setIsDialogOpen(true); }}><EditIcon /></IconButton></Tooltip>
          <Tooltip title="WhatsApp"><IconButton size="small" color="success" onClick={() => window.open(`https://wa.me/91${params.row.phone}`, '_blank')}><WhatsAppIcon /></IconButton></Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        {isPharmacy && <MedicalServicesIcon color="primary" sx={{ fontSize: 36 }} />}
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {isPharmacy ? 'Patient Management' : 'Customer Management'}
        </Typography>
        {isPharmacy && (
          <Chip label="Pharmacy Mode" color="primary" size="small" icon={<VaccinesIcon />} />
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: isPharmacy ? '#e0f2e9' : '#e0f2fe', color: isPharmacy ? '#166534' : '#0369a1' }}>
                {isPharmacy ? <MedicalServicesIcon /> : <AccountIcon />}
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {isPharmacy ? 'TOTAL PATIENTS' : 'TOTAL CUSTOMERS'}
                </Typography>
                <Typography variant="h5" fontWeight={800}>{stats.total}</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#fef2f2', color: '#dc2626' }}><TrendingUpIcon /></Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL RECEIVABLE</Typography>
                <Typography variant="h5" fontWeight={800} color="error.main">₹{stats.totalAmount.toLocaleString('en-IN')}</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <DataGrid
          rows={customers}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          slotProps={{ toolbar: { onAddClick: () => { setEditingCustomer(null); setFormData(initialFormState); setIsDialogOpen(true); }, isPharmacy } }}
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#f1f5f9' } }}
        />
      </Paper>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingCustomer
            ? (isPharmacy ? 'Update Patient Profile' : 'Update Customer Profile')
            : (isPharmacy ? 'Register New Patient' : 'Register New Customer')}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField label="Full Name" name="name" fullWidth value={formData.name} onChange={handleFormChange} required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone Number" name="phone" fullWidth value={formData.phone} onChange={handleFormChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Email Address" name="email" fullWidth value={formData.email} onChange={handleFormChange} /></Grid>

            {isPharmacy ? (
              <>
                <Grid item xs={12} sm={6}><TextField label="Date of Birth" name="dateOfBirth" type="date" fullWidth value={formData.dateOfBirth || ''} onChange={handleFormChange} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Blood Group" name="bloodGroup" fullWidth value={formData.bloodGroup || ''} onChange={handleFormChange} placeholder="e.g. A+, B-, O+" /></Grid>
                <Grid item xs={12} sm={6}><TextField label="PAN Number" name="panNumber" fullWidth value={formData.panNumber} onChange={handleFormChange} /></Grid>
                <Grid item xs={12}><TextField label="Known Allergies" name="allergies" fullWidth multiline rows={2} value={formData.allergies || ''} onChange={handleFormChange} placeholder="e.g. Penicillin, Aspirin" /></Grid>
                <Grid item xs={12}><TextField label="Chronic Conditions" name="chronicConditions" fullWidth multiline rows={2} value={formData.chronicConditions || ''} onChange={handleFormChange} placeholder="e.g. Diabetes, Hypertension" /></Grid>
                <Grid item xs={12}><TextField label="Medical Notes" name="notes" fullWidth multiline rows={2} value={formData.notes} onChange={handleFormChange} /></Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}><TextField label="GSTIN" name="gstNumber" fullWidth value={formData.gstNumber} onChange={handleFormChange} /></Grid>
                <Grid item xs={12} sm={6}><TextField label="PAN Number" name="panNumber" fullWidth value={formData.panNumber} onChange={handleFormChange} /></Grid>
                <Grid item xs={12}><TextField label="Internal Notes" name="notes" fullWidth multiline rows={2} value={formData.notes} onChange={handleFormChange} /></Grid>
              </>
            )}

            <Grid item xs={12} sm={6}><TextField label="Opening Balance" name="creditBalance" type="number" fullWidth value={formData.creditBalance} onChange={handleFormChange} disabled={!!editingCustomer} helperText="Initial debt at the time of registration." /></Grid>
            
            <Grid item xs={12}><Divider sx={{ my: 1 }}>Address Details</Divider></Grid>
            
            <Grid item xs={12} sm={6}><TextField label="Address Line 1" name="addressLine1" fullWidth value={formData.addressLine1} onChange={handleFormChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Address Line 2" name="addressLine2" fullWidth value={formData.addressLine2} onChange={handleFormChange} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="City" name="city" fullWidth value={formData.city} onChange={handleFormChange} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="State" name="state" fullWidth value={formData.state} onChange={handleFormChange} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Postal Code" name="postalCode" fullWidth value={formData.postalCode} onChange={handleFormChange} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={20} /> : 'Save Changes'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false})} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Customers;