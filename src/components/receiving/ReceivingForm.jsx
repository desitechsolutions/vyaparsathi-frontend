import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Link,
  Fade,
  FormHelperText,
} from '@mui/material';
import {
  PersonOutline, 
  Inventory, 
  AssignmentTurnedIn,
  CalendarToday,
} from '@mui/icons-material';
import Header from './Header';

const statusColor = (status) => {
  switch (status) {
    case 'SUBMITTED':
      return '#f57c00';
    case 'PARTIALLY_RECEIVED':
      return '#0288d1';
    case 'RECEIVED':
    case 'COMPLETED':
      return '#388e3c';
    default:
      return '#333';
  }
};

const ReceivingForm = ({ onSubmit, onCancel, title, pendingPOs, loading }) => {
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    supplier: {},
    totalItems: '',
    status: '',
    date: '',
  });
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});

  // Validate only purchaseOrderId
  const validate = () => {
    const errors = {};
    if (!formData.purchaseOrderId) errors.purchaseOrderId = 'Please select a Purchase Order to proceed.';
    return errors;
  };
  const validationErrors = validate();

  const handlePOChange = (e) => {
    const poId = e.target.value;
    const po = pendingPOs.find((po) => po.id === poId || po.id === Number(poId));
    setFormData({
      purchaseOrderId: po?.id || '',
      supplier: po?.supplier || {},
      totalItems: po?.items?.length || 0,
      status: po?.status || '',
      date: po?.orderDate ? po.orderDate.split('T')[0] : '',
    });
    setTouched((prev) => ({ ...prev, purchaseOrderId: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(validationErrors).length > 0) {
      setError(validationErrors.purchaseOrderId || 'Please fill all required fields.');
      return;
    }
    setError('');
    onSubmit({
      purchaseOrderId: formData.purchaseOrderId,
      receivedDate: new Date().toISOString(),
    });
  };

  const noPendingPO =
    !pendingPOs || pendingPOs.filter((po) => !['RECEIVED', 'COMPLETED'].includes(po.status)).length === 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: { xs: 2, sm: 4 } }}>
      <Header title={title} onBack={onCancel} />
      {error && (
        <Alert
          severity="error"
          onClose={() => setError('')}
          sx={{ borderRadius: 2, boxShadow: 1, bgcolor: 'error.light', mb: 2 }}
        >
          {error}
        </Alert>
      )}
      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          maxWidth: 600,
          mx: 'auto',
          mt: 4,
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          bgcolor: 'background.paper',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              letterSpacing: 0.5,
              color: 'primary.main',
              textAlign: 'center',
            }}
          >
            Create Receiving
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, bgcolor: 'grey.100', borderRadius: 2 }}>
              <CircularProgress size={30} color="primary" />
              <Typography sx={{ ml: 2, fontWeight: 500, color: 'text.secondary' }}>
                Loading pending POs...
              </Typography>
            </Box>
          ) : noPendingPO ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 3,
                bgcolor: 'warning.light',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'warning.main',
              }}
            >
              <Typography sx={{ fontWeight: 500, color: 'warning.dark' }}>
                No pending Purchase Orders available.
              </Typography>
              <Link href="/purchase-orders/new" underline="hover" sx={{ mt: 1, display: 'block', color: 'primary.main' }}>
                Create a new PO
              </Link>
            </Box>
          ) : (
            <Fade in={!loading && !noPendingPO}>
              <FormControl
                fullWidth
                required
                error={!!(touched.purchaseOrderId && validationErrors.purchaseOrderId)}
                variant="outlined"
              >
                <InputLabel id="po-select-label">Select Pending PO</InputLabel>
                <Select
                  labelId="po-select-label"
                  value={formData.purchaseOrderId}
                  label="Select Pending PO"
                  onChange={handlePOChange}
                  name="purchaseOrderId"
                  onBlur={() => setTouched((prev) => ({ ...prev, purchaseOrderId: true }))}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                  aria-label="Select Purchase Order"
                >
                  {pendingPOs
                    .filter((po) => !['RECEIVED', 'COMPLETED'].includes(po.status))
                    .map((po) => (
                      <MenuItem key={po.id} value={po.id}>
                        {po.poNumber} - {po.supplier?.name || 'Unknown Supplier'}
                      </MenuItem>
                    ))}
                </Select>
                {touched.purchaseOrderId && validationErrors.purchaseOrderId && (
                  <FormHelperText error sx={{ mt: 1 }}>
                    {validationErrors.purchaseOrderId}
                  </FormHelperText>
                )}
              </FormControl>
            </Fade>
          )}

          {/* Supplier and PO Details */}
          {formData.purchaseOrderId && (
            <Fade in={!!formData.purchaseOrderId}>
              <Box
                sx={{
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  p: 3,
                  mt: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                  Selected PO Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PersonOutline sx={{ color: 'action.active', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      Supplier Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {formData.supplier?.name || '-'}
                    </Typography>
                  </Box>
                </Box>
                {formData.supplier?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PersonOutline sx={{ color: 'action.active', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        Phone
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {formData.supplier.phone}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {formData.supplier?.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PersonOutline sx={{ color: 'action.active', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        Email
                      </Typography>
                      <Link
                        href={`mailto:${formData.supplier.email}`}
                        underline="hover"
                        sx={{ color: 'primary.main', fontWeight: 600 }}
                      >
                        {formData.supplier.email}
                      </Link>
                    </Box>
                  </Box>
                )}
                {formData.supplier?.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PersonOutline sx={{ color: 'action.active', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        Address
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {formData.supplier.address}
                      </Typography>
                    </Box>
                  </Box>
                )}
                <Divider sx={{ my: 2, borderColor: 'grey.200' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Inventory sx={{ color: 'action.active', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      Total Items
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formData.totalItems || '-'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AssignmentTurnedIn sx={{ color: 'action.active', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      Status
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: statusColor(formData.status) }}>
                      {formData.status || '-'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarToday sx={{ color: 'action.active', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {formData.date || '-'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Fade>
          )}

          <Divider sx={{ my: 3, borderColor: 'grey.200' }} />

          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', textAlign: 'center', display: 'block', mb: 2 }}
          >
            This will create an initial receiving record. Update item-level quantities in the next step.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              onClick={onCancel}
              variant="outlined"
              sx={{
                borderRadius: 2,
                px: 4,
                color: 'text.secondary',
                borderColor: 'grey.400',
                '&:hover': {
                  borderColor: 'grey.600',
                  bgcolor: 'grey.100',
                },
              }}
              aria-label="Cancel form"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 4,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&:disabled': {
                  bgcolor: 'grey.400',
                  color: 'grey.700',
                },
              }}
              disabled={noPendingPO || Object.keys(validationErrors).length > 0}
              aria-label="Save receiving"
            >
              Save
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReceivingForm;