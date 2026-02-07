import React, { useState } from 'react';
import {
  Box, Button, FormControl, InputLabel, Select, MenuItem, Typography, Paper,
  Alert, CircularProgress, Divider, Link, Fade, FormHelperText, Grid, Stack, Chip
} from '@mui/material';
import {
  PersonOutline, Inventory, AssignmentTurnedIn, CalendarToday,
  BusinessCenter, LocalPhone, Email, LocationOn, ArrowForward
} from '@mui/icons-material';
import Header from './Header';

// Enhanced status styling to match the rest of your app
const getStatusConfig = (status) => {
  switch (status?.toUpperCase()) {
    case 'SUBMITTED': return { color: 'warning', label: 'Awaiting Delivery' };
    case 'PARTIALLY_RECEIVED': return { color: 'info', label: 'Partial Receipt' };
    case 'PENDING': return { color: 'default', label: 'Pending' };
    default: return { color: 'default', label: status };
  }
};

const ReceivingForm = ({ onSubmit, onCancel, title, pendingPOs, loading }) => {
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    supplier: {},
    totalItems: '',
    status: '',
    date: '',
    poNumber: ''
  });
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.purchaseOrderId) errors.purchaseOrderId = 'A Purchase Order must be selected to begin receiving.';
    return errors;
  };
  
  const validationErrors = validate();

  const handlePOChange = (e) => {
    const poId = e.target.value;
    const po = pendingPOs.find((p) => p.id === poId || p.id === Number(poId));
    setFormData({
      purchaseOrderId: po?.id || '',
      supplier: po?.supplier || {},
      totalItems: po?.items?.length || po?.receivingItems?.length || 0,
      status: po?.status || '',
      date: po?.orderDate ? po.orderDate.split('T')[0] : '',
      poNumber: po?.poNumber || ''
    });
    setTouched((prev) => ({ ...prev, purchaseOrderId: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(validationErrors).length > 0) {
      setError(validationErrors.purchaseOrderId);
      return;
    }
    setError('');
    onSubmit({
      purchaseOrderId: formData.purchaseOrderId,
      receivedDate: new Date().toISOString(),
    });
  };

  const activePOs = pendingPOs?.filter((po) => !['RECEIVED', 'COMPLETED'].includes(po.status)) || [];
  const noPendingPO = !loading && activePOs.length === 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: { xs: 2, sm: 4 } }}>
      <Header title={title} onBack={onCancel} />
      
      <Box sx={{ maxWidth: 700, mx: 'auto', mt: 2 }}>
        {error && (
          <Alert severity="error" variant="filled" onClose={() => setError('')} sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eef2f6' }}>
          <Stack spacing={1} sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Initiate Receiving
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Step 1: Link physical delivery to an existing Purchase Order
            </Typography>
          </Stack>

          {loading ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
              <CircularProgress size={40} thickness={4} />
              <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Syncing with inventory...</Typography>
            </Stack>
          ) : noPendingPO ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'amber.50', borderColor: 'amber.200', borderRadius: 3 }}>
              <AssignmentTurnedIn sx={{ fontSize: 48, color: 'amber.600', mb: 1 }} />
              <Typography variant="h6" sx={{ color: 'amber.900', fontWeight: 700 }}>No Pending POs</Typography>
              <Typography variant="body2" sx={{ color: 'amber.800', mb: 2 }}>All purchase orders have been fully processed.</Typography>
              <Button component={Link} href="/purchase-orders/new" variant="contained" color="warning" sx={{ borderRadius: 2 }}>
                Create New Order
              </Button>
            </Paper>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <FormControl fullWidth error={!!(touched.purchaseOrderId && validationErrors.purchaseOrderId)} sx={{ mb: 4 }}>
                <InputLabel>Select Active Purchase Order</InputLabel>
                <Select
                  value={formData.purchaseOrderId}
                  label="Select Active Purchase Order"
                  onChange={handlePOChange}
                  sx={{ borderRadius: 3, bgcolor: 'background.paper' }}
                >
                  {activePOs.map((po) => (
                    <MenuItem key={po.id} value={po.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontWeight: 600 }}>#{po.poNumber}</Typography>
                        <Typography color="text.secondary">|</Typography>
                        <Typography>{po.supplier?.name}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {touched.purchaseOrderId && validationErrors.purchaseOrderId && (
                  <FormHelperText sx={{ fontWeight: 500 }}>{validationErrors.purchaseOrderId}</FormHelperText>
                )}
              </FormControl>

              {formData.purchaseOrderId && (
                <Fade in={true}>
                  <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Order Preview
                      </Typography>
                      <Chip 
                        label={getStatusConfig(formData.status).label} 
                        color={getStatusConfig(formData.status).color} 
                        size="small" 
                        sx={{ fontWeight: 700 }} 
                      />
                    </Stack>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <InfoItem icon={<BusinessCenter />} label="Supplier" value={formData.supplier?.name} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InfoItem icon={<CalendarToday />} label="Order Date" value={formData.date} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InfoItem icon={<Inventory />} label="Expected Lines" value={`${formData.totalItems} Items`} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InfoItem icon={<LocalPhone />} label="Contact" value={formData.supplier?.phone || 'N/A'} />
                      </Grid>
                      <Grid item xs={12}>
                        <InfoItem icon={<LocationOn />} label="Destination" value={formData.supplier?.address || 'Main Warehouse'} />
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}

              <Divider sx={{ my: 4 }} />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={onCancel} variant="text" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!formData.purchaseOrderId}
                  endIcon={<ArrowForward />}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.2,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                    textTransform: 'none',
                    fontWeight: 700
                  }}
                >
                  Confirm & Start Unloading
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

// Helper component for the info grid
const InfoItem = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Box sx={{ mt: 0.5, color: 'primary.light' }}>
      {React.cloneElement(icon, { fontSize: 'small' })}
    </Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
        {value || '-'}
      </Typography>
    </Box>
  </Stack>
);

export default ReceivingForm;