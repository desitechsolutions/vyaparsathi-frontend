import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import {
  fetchCustomerContacts,
  createCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
  setPrimaryCustomerContact,
} from '../../services/api';
import { stringToColor, initialsOf } from '../../utils/customerFormat';

const emptyForm = { name: '', designation: '', phone: '', email: '', isPrimary: false, notes: '' };

export default function CustomerContactsPanel({ customerId }) {
  const [contacts, setContacts] = useState([]);
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
      const data = await fetchCustomerContacts(customerId);
      setContacts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load contacts.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setDlg({ open: true, mode: 'create', id: null, data: emptyForm });
  const openEdit = (c) => setDlg({ open: true, mode: 'edit', id: c.id, data: {
    name: c.name || '',
    designation: c.designation || '',
    phone: c.phone || '',
    email: c.email || '',
    isPrimary: !!c.isPrimary,
    notes: c.notes || '',
  } });
  const closeDlg = () => !busy && setDlg((s) => ({ ...s, open: false }));

  const submit = async () => {
    const d = dlg.data;
    if (!d.name.trim()) return;
    setBusy(true);
    setError('');
    try {
      if (dlg.mode === 'create') {
        await createCustomerContact(customerId, d);
      } else {
        await updateCustomerContact(customerId, dlg.id, d);
      }
      closeDlg();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not save contact.');
    } finally {
      setBusy(false);
    }
  };

  const promote = async (c) => {
    try {
      await setPrimaryCustomerContact(customerId, c.id);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not update primary.');
    }
  };

  const del = async () => {
    if (!confirmDelete.id) return;
    setBusy(true);
    try {
      await deleteCustomerContact(customerId, confirmDelete.id);
      setConfirmDelete({ open: false, id: null });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not delete contact.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={800}>Contacts ({contacts.length})</Typography>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: 'none' }}>
          Add contact
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
      ) : contacts.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderRadius: 2.5 }}>
          <ContactMailIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No additional contacts yet. Add purchase / accounts / delivery contacts here.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {contacts.map((c) => (
            <Paper key={c.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: c.isPrimary ? 'primary.light' : 'divider', bgcolor: c.isPrimary ? 'primary.50' : 'background.paper' }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar sx={{ bgcolor: stringToColor(c.name), width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700 }}>
                  {initialsOf(c.name)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                    {c.isPrimary && <Chip size="small" color="primary" label="Primary" sx={{ height: 20, fontWeight: 700 }} />}
                  </Stack>
                  {c.designation && (
                    <Typography variant="caption" color="text.secondary">{c.designation}</Typography>
                  )}
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} flexWrap="wrap">
                    {c.phone && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <PhoneIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />
                        <Typography variant="caption">{c.phone}</Typography>
                      </Stack>
                    )}
                    {c.email && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <EmailIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />
                        <Typography variant="caption">{c.email}</Typography>
                      </Stack>
                    )}
                  </Stack>
                  {c.notes && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                      {c.notes}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  {!c.isPrimary && (
                    <Tooltip title="Set as primary">
                      <IconButton size="small" onClick={() => promote(c)} aria-label="Set as primary">
                        <StarBorderIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {c.isPrimary && (
                    <Tooltip title="Primary contact"><StarIcon fontSize="small" color="primary" sx={{ p: 0.5 }} /></Tooltip>
                  )}
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(c)} aria-label="Edit contact"><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={() => setConfirmDelete({ open: true, id: c.id })} aria-label="Delete contact"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Create / edit dialog */}
      <Dialog open={dlg.open} onClose={closeDlg} fullWidth maxWidth="sm">
        <DialogTitle>{dlg.mode === 'create' ? 'Add contact' : 'Edit contact'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField autoFocus label="Name" fullWidth required value={dlg.data.name} onChange={(e) => setDlg((s) => ({ ...s, data: { ...s.data, name: e.target.value } }))} />
            <TextField label="Designation" fullWidth value={dlg.data.designation} onChange={(e) => setDlg((s) => ({ ...s, data: { ...s.data, designation: e.target.value } }))} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Phone" fullWidth value={dlg.data.phone} onChange={(e) => setDlg((s) => ({ ...s, data: { ...s.data, phone: e.target.value } }))} />
              <TextField label="Email" type="email" fullWidth value={dlg.data.email} onChange={(e) => setDlg((s) => ({ ...s, data: { ...s.data, email: e.target.value } }))} />
            </Stack>
            <TextField label="Notes" fullWidth multiline rows={2} value={dlg.data.notes} onChange={(e) => setDlg((s) => ({ ...s, data: { ...s.data, notes: e.target.value } }))} />
            <FormControlLabel
              control={<Checkbox checked={!!dlg.data.isPrimary} onChange={(e) => setDlg((s) => ({ ...s, data: { ...s.data, isPrimary: e.target.checked } }))} />}
              label="Make this the primary contact"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDlg} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={busy || !dlg.data.name.trim()}>
            {dlg.mode === 'create' ? 'Add contact' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={confirmDelete.open} onClose={() => !busy && setConfirmDelete({ open: false, id: null })} maxWidth="xs">
        <DialogTitle>Delete this contact?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">If this is the primary contact and other contacts exist, the next one is auto-promoted.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, id: null })} disabled={busy}>Cancel</Button>
          <Button color="error" variant="contained" onClick={del} disabled={busy}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
