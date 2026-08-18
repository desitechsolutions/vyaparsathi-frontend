import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Tabs,
  Tab,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  Alert,
  Stack,
  Chip,
} from '@mui/material';

import {
  Close as CloseIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AccountBalance as BankIcon,
  Badge as BadgeIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { findCustomerDuplicates } from '../../services/api';

const INITIAL_STATE = {
  name: '',
  tradeName: '',
  legalName: '',
  phone: '',
  email: '',
  customerType: 'INDIVIDUAL',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  stateCode: '',
  postalCode: '',
  country: 'India',
  gstNumber: '',
  panNumber: '',
  creditLimit: 0,
  creditDays: 30,
  paymentTerms: 'Due on Receipt',
  source: 'WALK_IN',
  industry: '',
  tags: '',
  notes: '',
  dateOfBirth: '',
  anniversaryDate: '',
};

export const CustomerEditDialog = ({
  open,
  onClose,
  onSave,
  customer = null,
  isEdit = false,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  // Live duplicate-detection results — an array of CustomerDto that
  // match on phone / GSTIN / PAN within the current shop. Populated
  // by a debounced effect so we don't hit the API on every keystroke.
  const [duplicates, setDuplicates] = useState([]);

  useEffect(() => {
    if (customer && isEdit) {
      setForm({
        ...INITIAL_STATE,
        ...customer,
        creditLimit: customer.creditLimit ?? 0,
        creditDays: customer.creditDays ?? 30,
        customerType: customer.customerType || 'INDIVIDUAL',
        dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.slice(0, 10) : '',
        anniversaryDate: customer.anniversaryDate ? customer.anniversaryDate.slice(0, 10) : '',
      });
    } else {
      setForm(INITIAL_STATE);
    }
    setErrors({});
    setSaveError('');
    setTabIndex(0);
  }, [customer, isEdit, open]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Duplicate detection — debounced. Fires when phone / gstNumber /
  // panNumber changes; excludes the current customer (edit mode) so
  // a save doesn't flag the row against itself.
  const dupeKey = useMemo(
    () => `${form.phone || ''}|${form.gstNumber || ''}|${form.panNumber || ''}`,
    [form.phone, form.gstNumber, form.panNumber],
  );
  useEffect(() => {
    if (!open) return undefined;
    const phone = (form.phone || '').trim();
    const gst = (form.gstNumber || '').trim().toUpperCase();
    const pan = (form.panNumber || '').trim().toUpperCase();
    // Only lookup once at least one field has enough characters to
    // be meaningful — otherwise every empty form would list every
    // customer with an empty GSTIN/PAN as a "duplicate".
    if (phone.length < 10 && gst.length < 15 && pan.length < 10) {
      setDuplicates([]);
      return undefined;
    }
    const handle = setTimeout(async () => {
      try {
        const params = {};
        if (phone.length === 10) params.phone = phone;
        if (gst.length === 15) params.gstNumber = gst;
        if (pan.length === 10) params.panNumber = pan;
        if (isEdit && customer?.id) params.excludeId = customer.id;
        const result = await findCustomerDuplicates(params);
        setDuplicates(Array.isArray(result) ? result : []);
      } catch (_) {
        // Silent — this is a nice-to-have, not a blocker.
        setDuplicates([]);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [dupeKey, open, isEdit, customer?.id]);

  const validate = () => {
    const errs = {};
    if (!form.name || !form.name.trim()) {
      errs.name = 'Customer Name is required';
    }
    if (form.phone && form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) {
      errs.phone = 'Phone number must be exactly 10 digits';
    }
    if (form.email && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Invalid email address format';
    }
    if (form.gstNumber && form.gstNumber.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber.trim().toUpperCase())) {
      errs.gstNumber = 'Invalid GSTIN format (e.g. 27ABCDE1234F1Z5)';
    }
    if (form.panNumber && form.panNumber.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.trim().toUpperCase())) {
      errs.panNumber = 'Invalid PAN format (e.g. ABCDE1234F)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * @param resetForNext - when true (Save & new), reset the form
   * for another entry instead of closing. Only meaningful for the
   * create flow — edit-mode ignores the flag and always closes.
   */
  const handleSave = async (resetForNext = false) => {
    if (!validate()) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        ...form,
        gstNumber: form.gstNumber ? form.gstNumber.trim().toUpperCase() : null,
        panNumber: form.panNumber ? form.panNumber.trim().toUpperCase() : null,
        creditLimit: Number(form.creditLimit) || 0,
        creditDays: Number(form.creditDays) || 30,
        dateOfBirth: form.dateOfBirth || null,
        anniversaryDate: form.anniversaryDate || null,
      };

      const result = await onSave(payload);
      if (result && !result.success) {
        setSaveError(result.error || 'Failed to save customer.');
      } else if (resetForNext && !isEdit) {
        // Reset form for another entry — keep the dialog open.
        // Preserve customerType + defaults; wipe identity fields so
        // the user isn't re-editing the previous customer's data.
        setForm({
          ...INITIAL_STATE,
          customerType: form.customerType,
        });
        setErrors({});
        setTabIndex(0);
        setDuplicates([]);
      } else {
        onClose();
      }
    } catch (err) {
      setSaveError(err.message || 'Error occurred while saving customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' },
      }}
    >
      <DialogTitle
        sx={{
          p: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'common.white',
              display: 'flex',
            }}
          >
            {form.customerType === 'BUSINESS' ? <BusinessIcon /> : <PersonIcon />}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {isEdit ? 'Edit Customer Profile' : 'New Customer'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEdit ? `ID #${customer?.id} • ${customer?.name}` : 'Enter customer details and credit terms'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2.5, bgcolor: 'background.default' }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Core Details" />
          <Tab icon={<LocationIcon fontSize="small" />} iconPosition="start" label="Address" />
          <Tab icon={<BadgeIcon fontSize="small" />} iconPosition="start" label="Statutory & Tax" />
          <Tab icon={<BankIcon fontSize="small" />} iconPosition="start" label="Credit & CRM" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {saveError}
          </Alert>
        )}

        {/* V115 — live duplicate detection. Only fires when phone /
            GSTIN / PAN reach a plausible length, so an empty new-form
            doesn't show every empty-GSTIN customer as a match. */}
        {duplicates.length > 0 && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ mb: 2.5, borderRadius: 2 }}
          >
            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
              {duplicates.length === 1 ? '1 similar customer' : `${duplicates.length} similar customers`} already exist{duplicates.length === 1 ? 's' : ''} in this shop
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {duplicates.slice(0, 5).map((d) => (
                <Chip
                  key={d.id}
                  size="small"
                  label={`${d.name}${d.phone ? ` · ${d.phone}` : ''}`}
                  sx={{ fontWeight: 600 }}
                />
              ))}
              {duplicates.length > 5 && (
                <Chip size="small" label={`+${duplicates.length - 5} more`} sx={{ fontWeight: 600 }} />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Check whether one of these is the customer you're adding. If so, cancel and open the existing profile. Save-anyway will still be refused by the server if the phone number is an exact match.
            </Typography>
          </Alert>
        )}

        {/* TAB 0: Core Details */}
        {tabIndex === 0 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Customer Type"
                value={form.customerType}
                onChange={handleChange('customerType')}
              >
                <MenuItem value="INDIVIDUAL">Individual / Retail (B2C)</MenuItem>
                <MenuItem value="BUSINESS">Business / Corporate (B2B)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Customer Display Name *"
                value={form.name}
                onChange={handleChange('name')}
                error={Boolean(errors.name)}
                helperText={errors.name || 'Primary business or individual name'}
                autoFocus
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Trade Name / Shop Name"
                value={form.tradeName || ''}
                onChange={handleChange('tradeName')}
                helperText="DBA (Doing Business As) name if different"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Legal Registered Name"
                value={form.legalName || ''}
                onChange={handleChange('legalName')}
                helperText="Official legal entity name"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={form.phone || ''}
                onChange={handleChange('phone')}
                error={Boolean(errors.phone)}
                helperText={errors.phone || '10-digit mobile number'}
                InputProps={{
                  startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                value={form.email || ''}
                onChange={handleChange('email')}
                error={Boolean(errors.email)}
                helperText={errors.email || 'Used for sending invoices & statements'}
              />
            </Grid>
          </Grid>
        )}

        {/* TAB 1: Address */}
        {tabIndex === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1"
                value={form.addressLine1 || ''}
                onChange={handleChange('addressLine1')}
                placeholder="Street address, building, floor"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={form.addressLine2 || ''}
                onChange={handleChange('addressLine2')}
                placeholder="Landmark, area, sector"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={form.city || ''}
                onChange={handleChange('city')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={form.state || ''}
                onChange={handleChange('state')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode / Postal Code"
                value={form.postalCode || ''}
                onChange={handleChange('postalCode')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State Code (GST)"
                value={form.stateCode || ''}
                onChange={handleChange('stateCode')}
                placeholder="e.g. 27 for MH"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Country"
                value={form.country || 'India'}
                onChange={handleChange('country')}
              />
            </Grid>
          </Grid>
        )}

        {/* TAB 2: Statutory & Tax */}
        {tabIndex === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GSTIN"
                value={form.gstNumber || ''}
                onChange={handleChange('gstNumber')}
                error={Boolean(errors.gstNumber)}
                helperText={errors.gstNumber || '15-digit GST Identification Number'}
                inputProps={{ style: { textTransform: 'uppercase', fontFamily: 'monospace' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PAN Number"
                value={form.panNumber || ''}
                onChange={handleChange('panNumber')}
                error={Boolean(errors.panNumber)}
                helperText={errors.panNumber || '10-character Permanent Account Number'}
                inputProps={{ style: { textTransform: 'uppercase', fontFamily: 'monospace' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Internal Compliance / Statutory Notes"
                value={form.notes || ''}
                onChange={handleChange('notes')}
                placeholder="Special tax concessions, SEZ details, or notes..."
              />
            </Grid>
          </Grid>
        )}

        {/* TAB 3: Credit & CRM */}
        {tabIndex === 3 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Credit Limit (₹)"
                value={form.creditLimit}
                onChange={handleChange('creditLimit')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                helperText="Maximum allowed outstanding dues"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Credit Period (Days)"
                value={form.creditDays}
                onChange={handleChange('creditDays')}
                helperText="Default payment grace period"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Payment Terms"
                value={form.paymentTerms || ''}
                onChange={handleChange('paymentTerms')}
                placeholder="e.g. Net 30, Due on Receipt"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Lead Source"
                value={form.source || 'WALK_IN'}
                onChange={handleChange('source')}
              >
                <MenuItem value="WALK_IN">Walk-in Customer</MenuItem>
                <MenuItem value="REFERRAL">Referral</MenuItem>
                <MenuItem value="ONLINE">Online / Website</MenuItem>
                <MenuItem value="TRADE_SHOW">Trade Show / Event</MenuItem>
                <MenuItem value="COLD_OUTREACH">Cold Outreach</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Industry / Category"
                value={form.industry || ''}
                onChange={handleChange('industry')}
                placeholder="e.g. Retail, Healthcare, Tech"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                value={form.dateOfBirth || ''}
                onChange={handleChange('dateOfBirth')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Anniversary / Founded Date"
                value={form.anniversaryDate || ''}
                onChange={handleChange('anniversaryDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (Comma separated)"
                value={form.tags || ''}
                onChange={handleChange('tags')}
                placeholder="e.g. VIP, Wholesaler, Premium, Local"
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Stack direction="row" spacing={1.5}>
          {tabIndex > 0 && (
            <Button onClick={() => setTabIndex((p) => p - 1)} disabled={saving}>
              Back
            </Button>
          )}
          {tabIndex < 3 ? (
            <Button variant="outlined" onClick={() => setTabIndex((p) => p + 1)}>
              Next Step
            </Button>
          ) : null}
          {!isEdit && (
            <Button
              variant="outlined"
              onClick={() => handleSave(true)}
              disabled={saving}
              sx={{ px: 2, fontWeight: 700, textTransform: 'none' }}
            >
              Save &amp; new
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => handleSave(false)}
            disabled={saving}
            disableElevation
            sx={{ px: 3, fontWeight: 700, textTransform: 'none' }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create customer'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
