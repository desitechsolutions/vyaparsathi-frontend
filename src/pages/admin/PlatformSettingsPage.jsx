import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Stack, Paper, Grid, TextField,
  Button, CircularProgress, Alert, AlertTitle, Divider, Avatar,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-toastify';
import platformApi from '../../services/platformApi';

export default function PlatformSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    gstin: '',
    pan: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    stateCode: '',
    pincode: '',
    supportEmail: '',
    supportPhone: '',
    hsnSacCode: '998313',
    invoicePrefix: 'SUB-INV',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });

  const fetchPlatformDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await platformApi.getAdminPlatformDetails();
      if (data) {
        setFormData({
          companyName: data.companyName || '',
          tradeName: data.tradeName || '',
          gstin: data.gstin || '',
          pan: data.pan || '',
          addressLine1: data.addressLine1 || '',
          addressLine2: data.addressLine2 || '',
          city: data.city || '',
          state: data.state || '',
          stateCode: data.stateCode || '',
          pincode: data.pincode || '',
          supportEmail: data.supportEmail || '',
          supportPhone: data.supportPhone || '',
          hsnSacCode: data.hsnSacCode || '998313',
          invoicePrefix: data.invoicePrefix || 'SUB-INV',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          upiId: data.upiId || '',
        });
      }
    } catch (err) {
      console.error('[PlatformSettingsPage] Fetch error:', err);
      setError(err?.response?.data?.message || 'Failed to load platform settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformDetails();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error('Company Name is required.');
      return;
    }

    setSaving(true);
    try {
      const updated = await platformApi.updateAdminPlatformDetails(formData);
      toast.success('Platform Details updated successfully!');
      if (updated) {
        setFormData((prev) => ({ ...prev, ...updated }));
      }
    } catch (err) {
      console.error('[PlatformSettingsPage] Save error:', err);
      toast.error(err?.response?.data?.message || 'Failed to update platform details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: '#7C3AED', width: 48, height: 48 }}>
            <BusinessIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>
              Platform Vendor Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage platform legal entity details, B2B GST tax invoice parameters, and bank payment info.
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          <AlertTitle sx={{ fontWeight: 800 }}>Loading Error</AlertTitle>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Section 1: Company & Tax Details */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" /> Legal Company & B2B Tax Registration
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
              These parameters are printed on all subscription B2B tax invoices and GST reports.
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Legal Company Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. DesiTech Solutions Pvt. Ltd."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Trade Name / Platform Brand"
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleChange}
                  placeholder="e.g. VyaparSathi Enterprise SaaS"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vendor GSTIN"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="e.g. 27AAACD1234E1Z5"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vendor PAN"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="e.g. AAACD1234E"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="e.g. 101, Tech Hub Tower"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  placeholder="e.g. Senapati Bapat Marg, Lower Parel"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="State Code"
                  name="stateCode"
                  value={formData.stateCode}
                  onChange={handleChange}
                  placeholder="e.g. 27"
                  helperText="GST State Code (e.g. 27 for MH)"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 400013"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="HSN / SAC Code"
                  name="hsnSacCode"
                  value={formData.hsnSacCode}
                  onChange={handleChange}
                  placeholder="e.g. 998313"
                  helperText="Default SAC 998313 (IT Software Services)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Subscription Invoice Prefix"
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleChange}
                  placeholder="e.g. SUB-INV"
                  helperText="Prefix for generated invoice numbers"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Section 2: Support Contacts */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContactSupportIcon color="secondary" /> Support Contact Info
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
              Official contact details displayed on customer invoices and support widgets.
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Support Email"
                  name="supportEmail"
                  value={formData.supportEmail}
                  onChange={handleChange}
                  placeholder="support@vyaparsathi.app"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Support Phone"
                  name="supportPhone"
                  value={formData.supportPhone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Section 3: Bank & UPI Details */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceIcon color="success" /> Bank & UPI Details (Manual UTR Verification)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
              Displayed to merchants choosing the manual bank transfer / UTR payment option.
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g. HDFC Bank Ltd."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="e.g. 50200012345678"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  placeholder="e.g. HDFC0000123"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="UPI VPA / Handle"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="e.g. vyaparsathi@hdfcbank"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Form Action */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{ borderRadius: '12px', fontWeight: 800, px: 4, py: 1.5, textTransform: 'none' }}
            >
              {saving ? 'Saving Changes...' : 'Save Platform Settings'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Container>
  );
}
