import React from 'react';
import { 
  Grid, Card, CardContent, Button, RadioGroup, FormControlLabel, Radio, 
  TextField, Typography, Box, Checkbox, FormControl, InputLabel, 
  Select as MuiSelect, MenuItem, Divider, Tooltip, Alert, Collapse
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from 'react-select';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import HomeIcon from '@mui/icons-material/Home';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const CustomerSection = ({
  customers,
  selectedCustomer,
  formData,
  setFormData,
  newCustomerData,
  setNewCustomerData,
  handleCustomerSelect,
  handleNewCustomer,
  openCustomerModal,
  setOpenCustomerModal,
}) => {

  // Validation: Check if GST is required but customer doesn't have one
  const isGstMissing = formData.isGstRequired === 'yes' && selectedCustomer && !selectedCustomer.gstNumber;

  // Logic to determine if GST selection should be disabled
  const isGstDisabled = !selectedCustomer || !selectedCustomer.gstNumber;
  const handleGstToggle = (e) => {
    if (e.target.value === 'yes' && isGstDisabled) {
      // Logic handled by the 'disabled' prop on Radio, but this is a safety check
      return;
    }
    setFormData((prev) => ({ ...prev, isGstRequired: e.target.value }));
  };
  const copyCustomerAddress = () => {
    if (selectedCustomer) {
      const fullAddress = [
        selectedCustomer.addressLine1,
        selectedCustomer.addressLine2,
        selectedCustomer.city,
        selectedCustomer.state,
        selectedCustomer.postalCode
      ].filter(Boolean).join(', ');
      
      setFormData(prev => ({ ...prev, deliveryAddress: fullAddress }));
    }
  };

  // Helper to check if new customer form is valid
  const isNewCustomerValid = () => {
    return newCustomerData.name.trim() !== '' && 
           newCustomerData.phone.trim().length >= 10;
  };

  return (
    <Grid item xs={12}>
      <Card raised sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" /> Transaction Details
          </Typography>

          <Grid container spacing={3}>
            {/* Customer Selection */}
            <Grid item xs={12} md={7}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', ml: 1 }}>SELECT CUSTOMER</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Select
                    options={customers}
                    value={selectedCustomer}
                    onChange={handleCustomerSelect}
                    placeholder="Search name, phone, or GST..."
                    isSearchable
                    isClearable
                    styles={{
                      control: (base) => ({ 
                        ...base, 
                        borderRadius: '8px', 
                        minHeight: '45px',
                        borderColor: isGstMissing ? '#ed6c02' : '#e0e0e0'
                      }),
                      menuPortal: base => ({ ...base, zIndex: 9999 })
                    }}
                    menuPortalTarget={document.body}
                  />
                </Box>
                <Tooltip title="Add New Customer">
                  <Button 
                    variant="contained" 
                    onClick={() => setOpenCustomerModal(true)}
                    sx={{ minWidth: '50px', borderRadius: '8px' }}
                  >
                    <PersonAddIcon />
                  </Button>
                </Tooltip>
              </Box>
              
              {/* GST Warning Logic */}
              <Collapse in={isGstMissing}>
                <Alert 
                  severity="warning" 
                  icon={<WarningAmberIcon fontSize="inherit" />}
                  sx={{ mt: 1, borderRadius: 2, '& .MuiAlert-message': { fontWeight: 500 } }}
                >
                  Selected customer does not have a GST number.
                </Alert>
              </Collapse>
            </Grid>

            {/* GST & Amount */}
            <Grid item xs={12} md={5}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', ml: 1 }}>
                INVOICE TYPE {isGstDisabled && "(GST requires customer GSTIN)"}
              </Typography>
              <RadioGroup
                  row
                  value={formData.isGstRequired}
                  onChange={handleGstToggle}
                  sx={{ mb: 1 }}
                >
                  <FormControlLabel value="no" control={<Radio size="small" />} label="Retail (No GST)" />
                  <Tooltip title={isGstDisabled ? "Selected customer has no GST number on file" : ""}>
                    <FormControlLabel 
                      value="yes" 
                      control={<Radio size="small" />} 
                      label="Tax (GST)" 
                      disabled={isGstDisabled} // Locks the option
                    />
                  </Tooltip>
                </RadioGroup>
              
              <TextField
                label="Total Sale Amount"
                fullWidth
                value={formData.totalAmount}
                InputProps={{ 
                  readOnly: true,
                  sx: { fontWeight: 800, fontSize: '1.2rem', color: '#1a56db', bgcolor: '#f0f7ff' } 
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Delivery Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.deliveryRequired || false}
                    onChange={e => setFormData(prev => ({ ...prev, deliveryRequired: e.target.checked }))}
                    icon={<LocalShippingIcon color="disabled" />}
                    checkedIcon={<LocalShippingIcon color="primary" />}
                  />
                }
                label={<Typography sx={{ fontWeight: 700 }}>Enable Delivery</Typography>}
              />
              {formData.deliveryRequired && selectedCustomer && (
                <Button 
                  size="small" 
                  startIcon={<HomeIcon />} 
                  onClick={copyCustomerAddress}
                  sx={{ textTransform: 'none' }}
                >
                  Use Customer Address
                </Button>
              )}
            </Box>

            <Collapse in={formData.deliveryRequired}>
              <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Delivery Address"
                      multiline
                      rows={2}
                      fullWidth
                      value={formData.deliveryAddress || ''}
                      onChange={e => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Delivery Charge"
                      type="number"
                      fullWidth
                      value={formData.deliveryCharge || ''}
                      onChange={e => {
                          const val = parseFloat(e.target.value);
                          const cleanVal = isNaN(val) ? '' : Math.max(0, val); 
                          setFormData(prev => ({ ...prev, deliveryCharge: cleanVal }));
                        }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>,
                        }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Delivery Paid By</InputLabel>
                      <MuiSelect
                        value={formData.deliveryPaidBy || ''}
                        label="Delivery Paid By"
                        onChange={e => setFormData(prev => ({ ...prev, deliveryPaidBy: e.target.value }))}
                      >
                        <MenuItem value="CUSTOMER">Customer (To Pay)</MenuItem>
                        <MenuItem value="SHOP">Shop (Inclusive)</MenuItem>
                      </MuiSelect>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Delivery Notes"
                      placeholder="Special instructions..."
                      fullWidth
                      value={formData.deliveryNotes || ''}
                      onChange={e => setFormData(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Box>
        </CardContent>
      </Card>

      {/* NEW CUSTOMER MODAL WITH VALIDATION */}
      <Dialog open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
          <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Create New Customer
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Full Name" 
                required 
                fullWidth 
                error={newCustomerData.name === ''}
                helperText={newCustomerData.name === '' ? 'Name is required' : ''}
                value={newCustomerData.name} 
                onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Phone Number" 
                required 
                fullWidth 
                error={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10}
                helperText={newCustomerData.phone.length > 0 && newCustomerData.phone.length < 10 ? 'Enter valid phone' : ''}
                value={newCustomerData.phone} 
                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address Line 1" fullWidth value={newCustomerData.addressLine1} onChange={(e) => setNewCustomerData({ ...newCustomerData, addressLine1: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="City" fullWidth value={newCustomerData.city} onChange={(e) => setNewCustomerData({ ...newCustomerData, city: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="GST Number" fullWidth value={newCustomerData.gstNumber} onChange={(e) => setNewCustomerData({ ...newCustomerData, gstNumber: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" fullWidth multiline rows={2} value={newCustomerData.notes} onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenCustomerModal(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleNewCustomer} 
            variant="contained" 
            disabled={!isNewCustomerValid()}
          >
            Save Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CustomerSection;