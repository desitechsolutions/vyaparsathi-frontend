import React, { useState, useEffect, useMemo, useRef } from 'react';
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

import { useForm, Controller } from 'react-hook-form';
import { findCustomerDuplicates } from '../../services/api';
import { GST_STATES } from '../../utils/gstStates';

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
  const [saveError, setSaveError] = useState('');
  const [duplicates, setDuplicates] = useState([]);

  // Track which save action was requested (save-and-close vs save-and-new)
  const resetOnSaveRef = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: INITIAL_STATE,
    mode: 'onTouched', // show errors after blur; update live on change
  });

  // Populate form when dialog opens or customer changes
  useEffect(() => {
    if (customer && isEdit) {
      reset({
        ...INITIAL_STATE,
        ...customer,
        creditLimit: customer.creditLimit ?? 0,
        creditDays: customer.creditDays ?? 30,
        customerType: customer.customerType || 'INDIVIDUAL',
        dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.slice(0, 10) : '',
        anniversaryDate: customer.anniversaryDate ? customer.anniversaryDate.slice(0, 10) : '',
      });
    } else {
      reset(INITIAL_STATE);
    }
    setSaveError('');
    setTabIndex(0);
    setDuplicates([]);
  }, [customer, isEdit, open, reset]);

  // Watch key fields for live duplicate detection
  const watchPhone = watch('phone');
  const watchGst = watch('gstNumber');
  const watchPan = watch('panNumber');

  const dupeKey = useMemo(
    () => `${watchPhone || ''}|${watchGst || ''}|${watchPan || ''}`,
    [watchPhone, watchGst, watchPan],
  );

  useEffect(() => {
    if (!open) return undefined;
    const phone = (watchPhone || '').trim();
    const gst = (watchGst || '').trim().toUpperCase();
    const pan = (watchPan || '').trim().toUpperCase();
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
        setDuplicates([]);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [dupeKey, open, isEdit, customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data) => {
    setSaveError('');
    let cleanPhone = (data.phone || '').trim().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    const payload = {
      ...data,
      phone: cleanPhone || null,
      email: data.email?.trim() || null,
      stateCode: data.stateCode?.trim() || null,
      gstNumber: data.gstNumber?.trim().toUpperCase() || null,
      panNumber: data.panNumber?.trim().toUpperCase() || null,
      creditLimit: Number(data.creditLimit) || 0,
      creditDays: Number(data.creditDays) || 30,
      dateOfBirth: data.dateOfBirth || null,
      anniversaryDate: data.anniversaryDate || null,
    };

    try {
      const result = await onSave(payload);
      if (result && !result.success) {
        setSaveError(result.error || 'Failed to save customer.');
      } else if (resetOnSaveRef.current && !isEdit) {
        reset({ ...INITIAL_STATE, customerType: data.customerType });
        setTabIndex(0);
        setDuplicates([]);
      } else {
        onClose();
      }
    } catch (err) {
      setSaveError(err.message || 'Error occurred while saving customer.');
    }
  };

  const handleSave = (andNew = false) => {
    resetOnSaveRef.current = andNew;
    handleSubmit(onSubmit)();
  };

  // Shared helper: derive state name from stateCode
  const applyStateCode = (code) => {
    const match = GST_STATES.find(([c]) => c === code);
    setValue('state', match ? match[1] : '');
  };

  // Watch customerType for header icon
  const customerType = watch('customerType');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="customer-edit-dialog-title"
      aria-describedby="customer-edit-dialog-description"
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' },
      }}
    >
      <DialogTitle
        id="customer-edit-dialog-title"
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
            {customerType === 'BUSINESS' ? <BusinessIcon /> : <PersonIcon />}
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
        <IconButton onClick={onClose} size="small" aria-label="Close dialog">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2.5, bgcolor: 'background.default' }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable" scrollButtons="auto" aria-label="Customer form sections">
          <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Core Details" />
          <Tab icon={<LocationIcon fontSize="small" />} iconPosition="start" label="Address" />
          <Tab icon={<BadgeIcon fontSize="small" />} iconPosition="start" label="Statutory & Tax" />
          <Tab icon={<BankIcon fontSize="small" />} iconPosition="start" label="Credit & CRM" />
        </Tabs>
      </Box>

      <DialogContent id="customer-edit-dialog-description" sx={{ p: 3 }}>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {saveError}
          </Alert>
        )}

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
              <Controller
                name="customerType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Customer Type"
                  >
                    <MenuItem value="INDIVIDUAL">Individual / Retail (B2C)</MenuItem>
                    <MenuItem value="BUSINESS">Business / Corporate (B2B)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={8}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Customer Name is required' }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Customer Display Name *"
                    error={!!error}
                    helperText={error?.message || 'Primary business or individual name'}
                    autoFocus
                    inputProps={{
                      'aria-required': 'true',
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'customer-name-helper' : undefined,
                    }}
                    FormHelperTextProps={error ? { id: 'customer-name-helper' } : undefined}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="tradeName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Trade Name / Shop Name"
                    helperText="DBA (Doing Business As) name if different"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="legalName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Legal Registered Name"
                    helperText="Official legal entity name"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="phone"
                control={control}
                rules={{
                  validate: (val) =>
                    !val?.trim() || /^\d{10}$/.test(val.trim()) || 'Phone number must be exactly 10 digits',
                }}
                render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                  <TextField
                    value={value}
                    onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputRef={ref}
                    fullWidth
                    label="Phone Number"
                    error={!!error}
                    helperText={error?.message || '10-digit mobile number'}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                    }}
                    inputProps={{
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'customer-phone-helper' : undefined,
                    }}
                    FormHelperTextProps={error ? { id: 'customer-phone-helper' } : undefined}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                rules={{
                  validate: (val) =>
                    !val?.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) || 'Invalid email address format',
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email Address"
                    error={!!error}
                    helperText={error?.message || 'Used for sending invoices & statements'}
                    inputProps={{
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'customer-email-helper' : undefined,
                    }}
                    FormHelperTextProps={error ? { id: 'customer-email-helper' } : undefined}
                  />
                )}
              />
            </Grid>
          </Grid>
        )}

        {/* TAB 1: Address */}
        {tabIndex === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Controller
                name="addressLine1"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Address Line 1"
                    placeholder="Street address, building, floor"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="addressLine2"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Address Line 2"
                    placeholder="Landmark, area, sector"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="City" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="stateCode"
                control={control}
                rules={{
                  validate: (val) =>
                    !val?.trim() || /^\d{2}$/.test(val.trim()) || 'State code must be 2 digits (e.g. 27)',
                }}
                render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                  <TextField
                    select
                    fullWidth
                    label="State (Place of Supply)"
                    value={value || ''}
                    onChange={(e) => {
                      onChange(e.target.value);
                      applyStateCode(e.target.value);
                    }}
                    inputRef={ref}
                    SelectProps={{ native: true, displayEmpty: true }}
                    InputLabelProps={{ shrink: true }}
                    error={!!error}
                    helperText={error?.message || (watch('state') ? `Selected: ${watch('state')}` : 'Select state for GST calculation')}
                  >
                    <option value="">— Select State (Optional) —</option>
                    {GST_STATES.map(([code, name]) => (
                      <option key={code} value={code}>
                        {code} — {name}
                      </option>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="postalCode"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Pincode / Postal Code" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Country" />
                )}
              />
            </Grid>
          </Grid>
        )}

        {/* TAB 2: Statutory & Tax */}
        {tabIndex === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="gstNumber"
                control={control}
                rules={{
                  validate: (val) =>
                    !val?.trim() ||
                    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val.trim().toUpperCase()) ||
                    'Invalid GSTIN format (e.g. 27ABCDE1234F1Z5)',
                }}
                render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                  <TextField
                    value={value}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      onChange(val);
                      // Auto-derive state and state code from first two digits
                      if (val.trim().length >= 2) {
                        const code = val.trim().slice(0, 2);
                        if (/^\d{2}$/.test(code)) {
                          const match = GST_STATES.find(([c]) => c === code);
                          if (match) {
                            setValue('stateCode', code);
                            setValue('state', match[1]);
                          }
                        }
                      }
                    }}
                    inputRef={ref}
                    fullWidth
                    label="GSTIN"
                    error={!!error}
                    helperText={error?.message || '15-digit GST Identification Number'}
                    inputProps={{
                      style: { textTransform: 'uppercase', fontFamily: 'monospace' },
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'customer-gstin-helper' : undefined,
                    }}
                    FormHelperTextProps={error ? { id: 'customer-gstin-helper' } : undefined}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="panNumber"
                control={control}
                rules={{
                  validate: (val) =>
                    !val?.trim() ||
                    /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val.trim().toUpperCase()) ||
                    'Invalid PAN format (e.g. ABCDE1234F)',
                }}
                render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                  <TextField
                    value={value}
                    onChange={(e) => onChange(e.target.value.toUpperCase())}
                    inputRef={ref}
                    fullWidth
                    label="PAN Number"
                    error={!!error}
                    helperText={error?.message || '10-character Permanent Account Number'}
                    inputProps={{
                      style: { textTransform: 'uppercase', fontFamily: 'monospace' },
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'customer-pan-helper' : undefined,
                    }}
                    FormHelperTextProps={error ? { id: 'customer-pan-helper' } : undefined}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Internal Compliance / Statutory Notes"
                    placeholder="Special tax concessions, SEZ details, or notes..."
                  />
                )}
              />
            </Grid>
          </Grid>
        )}

        {/* TAB 3: Credit & CRM */}
        {tabIndex === 3 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="creditLimit"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Credit Limit (₹)"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    helperText="Maximum allowed outstanding dues"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="creditDays"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Credit Period (Days)"
                    helperText="Default payment grace period"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="paymentTerms"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Payment Terms"
                    placeholder="e.g. Net 30, Due on Receipt"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Lead Source">
                    <MenuItem value="WALK_IN">Walk-in Customer</MenuItem>
                    <MenuItem value="REFERRAL">Referral</MenuItem>
                    <MenuItem value="ONLINE">Online / Website</MenuItem>
                    <MenuItem value="TRADE_SHOW">Trade Show / Event</MenuItem>
                    <MenuItem value="COLD_OUTREACH">Cold Outreach</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="industry"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Industry / Category"
                    placeholder="e.g. Retail, Healthcare, Tech"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label="Date of Birth"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="anniversaryDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label="Anniversary / Founded Date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Tags (Comma separated)"
                    placeholder="e.g. VIP, Wholesaler, Premium, Local"
                  />
                )}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Stack direction="row" spacing={1.5}>
          {tabIndex > 0 && (
            <Button onClick={() => setTabIndex((p) => p - 1)} disabled={isSubmitting}>
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
              disabled={isSubmitting}
              sx={{ px: 2, fontWeight: 700, textTransform: 'none' }}
            >
              Save &amp; new
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            disableElevation
            sx={{ px: 3, fontWeight: 700, textTransform: 'none' }}
          >
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create customer'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
