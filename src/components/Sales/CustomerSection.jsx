import React from 'react';
import { Grid, Card, CardContent, Button, RadioGroup, FormControlLabel, Radio, TextField, Typography, Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from 'react-select'; // Import react-select instead of MUI Select

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
}) =>
  (
    <Grid item xs={12}>
      <Card raised sx={{ p: 2, boxShadow: 3, borderRadius: 2, maxWidth: '600px', margin: '0 auto' }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 'medium', fontSize: { xs: '1.1rem', md: '1.25rem' }, mb: 3, textAlign: 'center' }}
          >
            Customer Details
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Select
              options={customers}
              value={selectedCustomer} // Should match the object structure { value, label }
              onChange={handleCustomerSelect}
              placeholder="Select Customer"
              isSearchable
              isClearable
              styles={{
                control: (provided) => ({
                  ...provided,
                  fontSize: { xs: '0.75rem', md: '0.85rem' },
                  minHeight: '40px',
                  marginBottom: '0',
                  borderRadius: 1,
                }),
                menu: (provided) => ({ ...provided, zIndex: 9999 }),
                menuList: (provided) => ({ ...provided, maxHeight: 200, overflowY: 'auto' }),
                option: (provided, state) => ({
                  ...provided,
                  fontSize: { xs: '0.75rem', md: '0.85rem' },
                  color: state.isSelected ? '#fff' : state.data.value === '' ? '#6b7280' : '#111827',
                  backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#e5e7eb' : 'white',
                }),
                singleValue: (provided, state) => ({
                  ...provided,
                  color: state.data.value === '' ? '#6b7280' : '#111827',
                }),
              }}
              isOptionDisabled={(option) => !option.value}
            />
          </Box>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setOpenCustomerModal(true)}
              sx={{ mb: 2, fontSize: { xs: '0.8rem', md: '0.9rem' }, textTransform: 'none', px: 2 }}
            >
              Add New Customer
            </Button>
          </Box>
          <RadioGroup
            row
            value={formData.isGstRequired}
            onChange={(e) => setFormData((prev) => ({ ...prev, isGstRequired: e.target.value }))}
            sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2 }}
          >
            <FormControlLabel value="no" control={<Radio />} label="No GST" />
            <FormControlLabel value="yes" control={<Radio />} label="Require GST Invoice" />
          </RadioGroup>
          <TextField
            label="Total Amount"
            fullWidth
            variant="outlined"
            value={formData.totalAmount}
            disabled
            sx={{ mb: 2, fontSize: { xs: '0.8rem', md: '0.9rem' }, maxWidth: '300px', margin: '0 auto' }}
          />
        </CardContent>
      </Card>

      <Dialog open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Box sx={{ '& .MuiTextField-root': { mb: 2 }, width: '100%' }}>
            <TextField
              label="Name"
              fullWidth
              margin="dense"
              value={newCustomerData.name}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Phone"
              fullWidth
              margin="dense"
              value={newCustomerData.phone}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Address Line 1"
              fullWidth
              margin="dense"
              value={newCustomerData.addressLine1}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, addressLine1: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Address Line 2"
              fullWidth
              margin="dense"
              value={newCustomerData.addressLine2}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, addressLine2: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="City"
              fullWidth
              margin="dense"
              value={newCustomerData.city}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, city: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="State"
              fullWidth
              margin="dense"
              value={newCustomerData.state}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, state: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Postal Code"
              fullWidth
              margin="dense"
              value={newCustomerData.postalCode}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, postalCode: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Country"
              fullWidth
              margin="dense"
              value={newCustomerData.country}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, country: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="GST Number"
              fullWidth
              margin="dense"
              value={newCustomerData.gstNumber}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, gstNumber: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="PAN Number"
              fullWidth
              margin="dense"
              value={newCustomerData.panNumber}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, panNumber: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Notes"
              fullWidth
              margin="dense"
              value={newCustomerData.notes}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
            <TextField
              label="Credit Balance"
              fullWidth
              margin="dense"
              value={newCustomerData.creditBalance}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, creditBalance: e.target.value })}
              sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCustomerModal(false)} sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' }, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleNewCustomer} color="primary" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' }, textTransform: 'none' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );

export default CustomerSection;