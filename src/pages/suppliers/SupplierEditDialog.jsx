import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
  MenuItem, Alert, Stack, Typography, Divider, Switch, FormControlLabel,
  CircularProgress, InputAdornment,
} from '@mui/material';
import { createSupplier, updateSupplier } from '../../services/api';
import { GST_STATES } from '../../utils/gstStates';

const EMPTY = {
  name: '', legalName: '', tradeName: '',
  contactPerson: '', phone: '', email: '',
  address: '', city: '', state: '', stateCode: '', pincode: '', country: 'IN',
  gstin: '', pan: '',
  active: true,
  creditDays: '', creditLimit: '', paymentTerms: '',
  notes: '',
};

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE   = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export default function SupplierEditDialog({ open, supplier, onClose, onSaved }) {
  const isEdit = !!supplier?.id;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setErrors({}); setSubmitError(null);
    if (supplier) {
      setForm({ ...EMPTY, ...supplier,
        active: supplier.active !== false,
        creditDays: supplier.creditDays ?? '',
        creditLimit: supplier.creditLimit ?? '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, supplier]);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-derive state code from GSTIN first two chars.
      if (field === 'gstin' && typeof value === 'string' && value.length >= 2) {
        const two = value.slice(0, 2);
        if (/^\d{2}$/.test(two)) next.stateCode = two;
      }
      return next;
    });
  };

  const handleStateCode = (code) => {
    const row = GST_STATES.find((r) => r[0] === code);
    setForm((prev) => ({
      ...prev,
      stateCode: code,
      state: row ? row[1] : prev.state,
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name || !form.name.trim()) e.name = 'Supplier name is required.';
    if (form.gstin && !GSTIN_RE.test(form.gstin.trim().toUpperCase()))
      e.gstin = 'Invalid GSTIN — expected 15 chars (e.g. 27ABCDE1234F1Z5).';
    if (form.pan && !PAN_RE.test(form.pan.trim().toUpperCase()))
      e.pan = 'Invalid PAN — expected 10 chars (e.g. ABCDE1234F).';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Invalid email.';
    if (form.creditDays !== '' && form.creditDays !== null
        && (isNaN(Number(form.creditDays)) || Number(form.creditDays) < 0))
      e.creditDays = 'Credit days must be a non-negative number.';
    if (form.creditLimit !== '' && form.creditLimit !== null
        && (isNaN(Number(form.creditLimit)) || Number(form.creditLimit) < 0))
      e.creditLimit = 'Credit limit must be a non-negative number.';
    return e;
  };

  const canSubmit = useMemo(() => Object.keys(errors).length === 0 && form.name && !saving,
    [errors, form.name, saving]);

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitError(null); setSaving(true);
    try {
      const payload = {
        ...form,
        gstin: form.gstin ? form.gstin.trim().toUpperCase() : null,
        pan: form.pan ? form.pan.trim().toUpperCase() : null,
        creditDays: form.creditDays === '' ? null : Number(form.creditDays),
        creditLimit: form.creditLimit === '' ? null : Number(form.creditLimit),
      };
      if (isEdit) await updateSupplier(supplier.id, payload);
      else        await createSupplier(payload);
      onSaved && onSaved();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={800}>
          {isEdit ? `Edit ${supplier?.name || 'supplier'}` : 'New supplier'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          GSTIN & PAN are optional but strongly recommended — they drive the statutory PDF header.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

        <Typography variant="caption" color="text.secondary" fontWeight={700}
          sx={{ letterSpacing: 0.6, textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Identity
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField required fullWidth size="small" label="Supplier name"
              value={form.name} onChange={set('name')}
              error={!!errors.name} helperText={errors.name || 'Display name — used across the app.'} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Legal name (as per PAN)"
              value={form.legalName} onChange={set('legalName')}
              helperText='Full legal entity name — printed on GRN / PR / DN.' />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Trade name"
              value={form.tradeName} onChange={set('tradeName')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Contact person"
              value={form.contactPerson} onChange={set('contactPerson')} />
          </Grid>
        </Grid>

        <Typography variant="caption" color="text.secondary" fontWeight={700}
          sx={{ letterSpacing: 0.6, textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Statutory
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="GSTIN"
              value={form.gstin} onChange={set('gstin')}
              error={!!errors.gstin}
              helperText={errors.gstin || '15 chars — state-code auto-fills from first two digits.'}
              inputProps={{ maxLength: 15, style: { textTransform: 'uppercase', fontFamily: 'monospace' } }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="PAN"
              value={form.pan} onChange={set('pan')}
              error={!!errors.pan} helperText={errors.pan}
              inputProps={{ maxLength: 10, style: { textTransform: 'uppercase', fontFamily: 'monospace' } }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth size="small" label="State (Place of Supply)"
              value={form.stateCode} onChange={(e) => handleStateCode(e.target.value)}
              InputLabelProps={{ shrink: true }}
              SelectProps={{ native: true, displayEmpty: true }}>
              <option value="">— select —</option>
              {GST_STATES.map(([code, name]) => (
                <option key={code} value={code}>{code} — {name}</option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Country"
              value={form.country} onChange={set('country')} />
          </Grid>
        </Grid>

        <Typography variant="caption" color="text.secondary" fontWeight={700}
          sx={{ letterSpacing: 0.6, textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Contact & Address
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Phone"
              value={form.phone} onChange={set('phone')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Email"
              value={form.email} onChange={set('email')}
              error={!!errors.email} helperText={errors.email} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" multiline minRows={2} label="Address"
              value={form.address} onChange={set('address')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="City"
              value={form.city} onChange={set('city')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Pincode"
              value={form.pincode} onChange={set('pincode')}
              inputProps={{ maxLength: 10 }} />
          </Grid>
        </Grid>

        <Typography variant="caption" color="text.secondary" fontWeight={700}
          sx={{ letterSpacing: 0.6, textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Payment Terms
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="Credit days"
              value={form.creditDays} onChange={set('creditDays')}
              error={!!errors.creditDays} helperText={errors.creditDays || 'Net-N default'}
              InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="Credit limit"
              value={form.creditLimit} onChange={set('creditLimit')}
              error={!!errors.creditLimit} helperText={errors.creditLimit || 'Max outstanding'}
              InputProps={{ startAdornment: <InputAdornment position="start">INR</InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={<Switch checked={!!form.active} onChange={set('active')} />}
              label={form.active ? 'Active — visible in pickers' : 'Inactive — hidden from new docs'}
              sx={{ mt: 1 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Payment terms (free text)"
              value={form.paymentTerms} onChange={set('paymentTerms')}
              helperText='e.g. "50% advance, 50% NET30 against GRN"' />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" multiline minRows={2} label="Internal notes"
              value={form.notes} onChange={set('notes')} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!canSubmit}>
          {saving ? <CircularProgress size={18} /> : (isEdit ? 'Save changes' : 'Create supplier')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
