import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import HomeIcon from '@mui/icons-material/Home';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import {
  fetchCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultBillingAddress,
  setDefaultShippingAddress,
} from '../../services/api';

const emptyForm = {
  addressType: 'BILLING',
  label: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  stateCode: '',
  postalCode: '',
  country: 'India',
  isDefaultBilling: false,
  isDefaultShipping: false,
};

const ADDRESS_TYPES = [
  { value: 'BILLING', label: 'Billing' },
  { value: 'SHIPPING', label: 'Shipping' },
  { value: 'REGISTERED', label: 'Registered' },
];

const typeIcon = (t) => t === 'SHIPPING' ? <LocalShippingIcon fontSize="small" /> : t === 'REGISTERED' ? <ReceiptIcon fontSize="small" /> : <HomeIcon fontSize="small" />;

function AddressLines({ a }) {
  const parts = [a.addressLine1, a.addressLine2, [a.city, a.state, a.postalCode].filter(Boolean).join(', '), a.country]
    .filter((p) => p && String(p).trim());
  return (
    <Stack>
      {parts.map((p, i) => (
        <Typography key={i} variant="body2" color={i === 0 ? 'text.primary' : 'text.secondary'}>{p}</Typography>
      ))}
    </Stack>
  );
}

export default function CustomerAddressesPanel({ customerId }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dlg, setDlg] = useState({ open: false, mode: 'create', id: null, data: emptyForm });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchCustomerAddresses(customerId);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load addresses.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setDlg({ open: true, mode: 'create', id: null, data: emptyForm });
  const openEdit = (a) => setDlg({ open: true, mode: 'edit', id: a.id, data: {
    addressType: a.addressType || 'BILLING',
    label: a.label || '',
    addressLine1: a.addressLine1 || '',
    addressLine2: a.addressLine2 || '',
    city: a.city || '',
    state: a.state || '',
    stateCode: a.stateCode || '',
    postalCode: a.postalCode || '',
    country: a.country || 'India',
    isDefaultBilling: !!a.isDefaultBilling,
    isDefaultShipping: !!a.isDefaultShipping,
  } });
  const closeDlg = () => !busy && setDlg((s) => ({ ...s, open: false }));

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (dlg.mode === 'create') {
        await createCustomerAddress(customerId, dlg.data);
      } else {
        await updateCustomerAddress(customerId, dlg.id, dlg.data);
      }
      closeDlg();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not save address.');
    } finally {
      setBusy(false);
    }
  };

  const makeDefaultBilling = async (a) => {
    try { await setDefaultBillingAddress(customerId, a.id); await load(); }
    catch (e) { setError(e?.response?.data?.message || 'Could not set default billing.'); }
  };
  const makeDefaultShipping = async (a) => {
    try { await setDefaultShippingAddress(customerId, a.id); await load(); }
    catch (e) { setError(e?.response?.data?.message || 'Could not set default shipping.'); }
  };

  const del = async () => {
    if (!confirmDelete.id) return;
    setBusy(true);
    try {
      await deleteCustomerAddress(customerId, confirmDelete.id);
      setConfirmDelete({ open: false, id: null });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not delete address.');
    } finally { setBusy(false); }
  };

  const setDataField = (field, value) => setDlg((s) => ({ ...s, data: { ...s.data, [field]: value } }));

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={800}>Addresses ({addresses.length})</Typography>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: 'none' }}>
          Add address
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
      ) : addresses.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderRadius: 2.5 }}>
          <HomeIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">No addresses yet. Add a billing / shipping / registered address.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {addresses.map((a) => (
            <Paper key={a.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{ color: 'text.secondary', pt: 0.5 }}>{typeIcon(a.addressType)}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={ADDRESS_TYPES.find((t) => t.value === a.addressType)?.label || a.addressType} sx={{ height: 20, fontWeight: 700 }} />
                    {a.label && <Typography variant="body2" fontWeight={700}>{a.label}</Typography>}
                    {a.isDefaultBilling && <Chip size="small" color="primary" label="Default billing" sx={{ height: 20, fontWeight: 700 }} />}
                    {a.isDefaultShipping && <Chip size="small" color="secondary" label="Default shipping" sx={{ height: 20, fontWeight: 700 }} />}
                  </Stack>
                  <Box sx={{ mt: 1 }}>
                    <AddressLines a={a} />
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                    {!a.isDefaultBilling && (
                      <Button size="small" variant="outlined" onClick={() => makeDefaultBilling(a)} sx={{ textTransform: 'none' }}>
                        Set default billing
                      </Button>
                    )}
                    {!a.isDefaultShipping && (
                      <Button size="small" variant="outlined" onClick={() => makeDefaultShipping(a)} sx={{ textTransform: 'none' }}>
                        Set default shipping
                      </Button>
                    )}
                  </Stack>
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(a)} aria-label="Edit address"><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={() => setConfirmDelete({ open: true, id: a.id })} aria-label="Delete address"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Create / edit dialog */}
      <Dialog open={dlg.open} onClose={closeDlg} fullWidth maxWidth="sm">
        <DialogTitle>{dlg.mode === 'create' ? 'Add address' : 'Edit address'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="Type" value={dlg.data.addressType} onChange={(e) => setDataField('addressType', e.target.value)} sx={{ minWidth: 160 }}>
                {ADDRESS_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
              <TextField label="Label (optional)" fullWidth placeholder="e.g. Head Office, Warehouse 2" value={dlg.data.label} onChange={(e) => setDataField('label', e.target.value)} />
            </Stack>
            <TextField label="Address line 1" fullWidth value={dlg.data.addressLine1} onChange={(e) => setDataField('addressLine1', e.target.value)} />
            <TextField label="Address line 2" fullWidth value={dlg.data.addressLine2} onChange={(e) => setDataField('addressLine2', e.target.value)} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="City" fullWidth value={dlg.data.city} onChange={(e) => setDataField('city', e.target.value)} />
              <TextField label="State" fullWidth value={dlg.data.state} onChange={(e) => setDataField('state', e.target.value)} />
              <TextField label="State code" placeholder="27" sx={{ width: 100 }} value={dlg.data.stateCode} onChange={(e) => setDataField('stateCode', e.target.value)} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Postal code" fullWidth value={dlg.data.postalCode} onChange={(e) => setDataField('postalCode', e.target.value)} />
              <TextField label="Country" fullWidth value={dlg.data.country} onChange={(e) => setDataField('country', e.target.value)} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Chip
                clickable
                label={dlg.data.isDefaultBilling ? '✓ Default billing' : 'Set as default billing'}
                color={dlg.data.isDefaultBilling ? 'primary' : 'default'}
                onClick={() => setDataField('isDefaultBilling', !dlg.data.isDefaultBilling)}
                variant={dlg.data.isDefaultBilling ? 'filled' : 'outlined'}
              />
              <Chip
                clickable
                label={dlg.data.isDefaultShipping ? '✓ Default shipping' : 'Set as default shipping'}
                color={dlg.data.isDefaultShipping ? 'secondary' : 'default'}
                onClick={() => setDataField('isDefaultShipping', !dlg.data.isDefaultShipping)}
                variant={dlg.data.isDefaultShipping ? 'filled' : 'outlined'}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDlg} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={busy}>
            {dlg.mode === 'create' ? 'Add address' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={confirmDelete.open} onClose={() => !busy && setConfirmDelete({ open: false, id: null })} maxWidth="xs">
        <DialogTitle>Delete this address?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">If this was a default, the oldest surviving address is promoted automatically.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, id: null })} disabled={busy}>Cancel</Button>
          <Button color="error" variant="contained" onClick={del} disabled={busy}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
