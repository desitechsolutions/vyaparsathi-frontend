import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, Stack, Tooltip, Snackbar, Alert, Typography, Grid, Divider,
  CircularProgress, InputAdornment, Switch, FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import QrIcon from '@mui/icons-material/QrCode2';
import {
  listShopBankAccounts, createShopBankAccount, updateShopBankAccount,
  deleteShopBankAccount, setDefaultShopBankAccount,
} from '../services/api';

// Fields on ShopBankAccountDto — mirrors backend DTO shape.
const EMPTY = {
  id: null, label: '', accountHolderName: '', accountNumber: '', bankName: '',
  ifscCode: '', branch: '', accountType: 'CURRENT', currencyCode: 'INR',
  swiftCode: '', iban: '', upiId: '', purpose: 'COLLECTIONS',
  isDefault: false, isActive: true, displayOnInvoice: true, notes: '',
};

const ACCOUNT_TYPES = ['CURRENT', 'SAVINGS', 'CC', 'OD', 'NRE', 'NRO', 'EEFC'];
const PURPOSES = ['COLLECTIONS', 'PAYROLL', 'ESCROW', 'GENERAL'];
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Structured bank-account CRUD panel — replaces the free-text bank_details
 * textarea in Settings > Banking & UPI. One default per currency; the default
 * is what the invoice PDF renders. UPI can live per-account.
 */
export default function BankAccountsPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);      // dto being edited, or null
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);          // { severity, message }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listShopBankAccounts();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setToast({ severity: 'error', message: 'Could not load bank accounts.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setErrors({}); setEditing({ ...EMPTY }); };
  const openEdit = (row) => { setErrors({}); setEditing({ ...EMPTY, ...row }); };
  const close = () => { setEditing(null); setErrors({}); };

  const validate = (d) => {
    const e = {};
    if (!d.accountHolderName?.trim()) e.accountHolderName = 'Required';
    if (!d.accountNumber?.trim()) e.accountNumber = 'Required';
    if (!d.bankName?.trim()) e.bankName = 'Required';
    if (d.ifscCode && !IFSC_RE.test(d.ifscCode.trim().toUpperCase())) {
      e.ifscCode = 'Expected 11 chars, e.g. HDFC0000123';
    }
    return e;
  };

  const save = async () => {
    const e = validate(editing);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const payload = { ...editing, ifscCode: editing.ifscCode?.trim().toUpperCase() || null };
      if (editing.id) {
        await updateShopBankAccount(editing.id, payload);
        setToast({ severity: 'success', message: 'Bank account updated.' });
      } else {
        await createShopBankAccount(payload);
        setToast({ severity: 'success', message: 'Bank account added.' });
      }
      close();
      await load();
    } catch (err) {
      setToast({
        severity: 'error',
        message: err?.response?.data?.message || 'Save failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    try {
      await deleteShopBankAccount(deleteId);
      setToast({ severity: 'success', message: 'Bank account removed.' });
      setDeleteId(null);
      await load();
    } catch (err) {
      setToast({
        severity: 'error',
        message: err?.response?.data?.message || 'Delete failed.',
      });
    }
  };

  const doSetDefault = async (id) => {
    try {
      await setDefaultShopBankAccount(id);
      setToast({ severity: 'success', message: 'Default account updated.' });
      await load();
    } catch (err) {
      setToast({
        severity: 'error',
        message: err?.response?.data?.message || 'Could not set default.',
      });
    }
  };

  const set = (field) => (ev) => {
    const value = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value;
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          One default account per currency is rendered on outgoing tax invoices.
        </Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openAdd}>
          Add account
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={22} />
        </Box>
      ) : rows.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center', color: 'text.disabled' }}>
          <Typography variant="body2">No bank accounts yet.</Typography>
          <Typography variant="caption">Add one so it can be rendered on your invoices.</Typography>
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Label / Bank</TableCell>
              <TableCell>Account</TableCell>
              <TableCell>IFSC / Branch</TableCell>
              <TableCell>UPI</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell padding="checkbox">
                  <Tooltip title={r.isDefault ? 'Default account for this currency' : 'Set as default'}>
                    <IconButton size="small" onClick={() => !r.isDefault && doSetDefault(r.id)}>
                      {r.isDefault
                        ? <StarIcon fontSize="small" color="warning" />
                        : <StarBorderIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {r.label || r.bankName}
                  </Typography>
                  {r.label && <Typography variant="caption" color="text.secondary">{r.bankName}</Typography>}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{r.accountNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.accountHolderName}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{r.ifscCode || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.branch || ''}</Typography>
                </TableCell>
                <TableCell>{r.upiId || '—'}</TableCell>
                <TableCell>
                  <Chip size="small" label={r.currencyCode || 'INR'} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(r)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove">
                    <IconButton size="small" onClick={() => setDeleteId(r.id)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add / edit dialog */}
      <Dialog open={!!editing} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{editing?.id ? 'Edit bank account' : 'Add bank account'}</DialogTitle>
        <DialogContent dividers>
          {editing && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Label"
                  value={editing.label} onChange={set('label')}
                  helperText='"Main current", "USD EEFC"' />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" select label="Purpose"
                  value={editing.purpose || 'COLLECTIONS'} onChange={set('purpose')}>
                  {PURPOSES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" required label="Account holder name"
                  value={editing.accountHolderName} onChange={set('accountHolderName')}
                  error={!!errors.accountHolderName} helperText={errors.accountHolderName || 'As registered with the bank'} />
              </Grid>
              <Grid item xs={12} sm={7}>
                <TextField fullWidth size="small" required label="Account number"
                  value={editing.accountNumber} onChange={set('accountNumber')}
                  error={!!errors.accountNumber} helperText={errors.accountNumber} />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField fullWidth size="small" select label="Type"
                  value={editing.accountType || 'CURRENT'} onChange={set('accountType')}>
                  {ACCOUNT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Bank name"
                  value={editing.bankName} onChange={set('bankName')}
                  error={!!errors.bankName} helperText={errors.bankName} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Branch"
                  value={editing.branch} onChange={set('branch')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="IFSC code"
                  value={editing.ifscCode} onChange={set('ifscCode')}
                  error={!!errors.ifscCode}
                  helperText={errors.ifscCode || '11 chars, e.g. HDFC0000123'}
                  inputProps={{ maxLength: 11, style: { textTransform: 'uppercase' } }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Currency"
                  value={editing.currencyCode || 'INR'} onChange={set('currencyCode')}
                  inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
                  helperText='ISO 4217 — "INR", "USD"…' />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="UPI ID"
                  value={editing.upiId} onChange={set('upiId')}
                  InputProps={{ startAdornment: <InputAdornment position="start"><QrIcon fontSize="small" /></InputAdornment> }}
                  helperText="e.g. shop@hdfcbank" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="SWIFT / BIC"
                  value={editing.swiftCode} onChange={set('swiftCode')}
                  helperText="For international wires" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="IBAN"
                  value={editing.iban} onChange={set('iban')} />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
                <Stack direction="row" spacing={3}>
                  <FormControlLabel
                    control={<Switch size="small" checked={!!editing.isDefault} onChange={set('isDefault')} />}
                    label="Set as default"
                  />
                  <FormControlLabel
                    control={<Switch size="small" checked={editing.displayOnInvoice !== false} onChange={set('displayOnInvoice')} />}
                    label="Show on invoice"
                  />
                  <FormControlLabel
                    control={<Switch size="small" checked={editing.isActive !== false} onChange={set('isActive')} />}
                    label="Active"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" multiline rows={2} label="Notes"
                  value={editing.notes || ''} onChange={set('notes')} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Remove bank account?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            The account will be soft-deleted; historical invoices that reference it
            keep resolving. If this is the default, the next active account in the
            same currency is promoted automatically.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDelete}>Remove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast?.severity || 'info'} variant="filled" onClose={() => setToast(null)}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
