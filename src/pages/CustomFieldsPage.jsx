import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  IconButton,
  Stack,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  Autocomplete,
  Skeleton,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { useShop } from '../context/ShopContext';
import {
  createCustomAttribute,
  updateCustomAttribute,
  deleteCustomAttribute,
  reorderCustomAttributes,
} from '../services/api';

const FIELD_TYPES = [
  { value: 'text',    label: 'Text' },
  { value: 'number',  label: 'Number' },
  { value: 'date',    label: 'Date' },
  { value: 'select',  label: 'Select (dropdown)' },
  { value: 'boolean', label: 'Boolean (yes/no)' },
];

const emptyForm = {
  id: null,
  keyName: '',
  label: '',
  fieldType: 'text',
  required: false,
  options: [],
  helpText: '',
};

export default function CustomFieldsPage() {
  const theme = useTheme();
  const { customAttributes, customAttributesLoading, refreshCustomAttributes } = useShop();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, def: null, deleting: false });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  useEffect(() => {
    if (!dialogOpen) setError(null);
  }, [dialogOpen]);

  const openNew = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (def) => {
    setForm({
      id: def.id,
      keyName: def.keyName,
      label: def.label,
      fieldType: def.fieldType,
      required: !!def.required,
      options: def.options || [],
      helpText: def.helpText || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) { setError('Label is required.'); return; }
    if (!form.keyName.trim()) { setError('Key is required.'); return; }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(form.keyName)) {
      setError('Key must start with a letter/underscore and contain only alphanumerics or underscores.');
      return;
    }
    if (form.fieldType === 'select' && form.options.length === 0) {
      setError('Select fields need at least one option.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form };
      if (form.id) await updateCustomAttribute(form.id, payload);
      else         await createCustomAttribute(payload);
      setDialogOpen(false);
      await refreshCustomAttributes();
      showSnackbar(`Custom field "${payload.label}" ${form.id ? 'updated' : 'created'} successfully.`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save custom field.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (def) => {
    setDeleteConfirm({ open: true, def, deleting: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.def) return;
    const { id, label } = deleteConfirm.def;
    setDeleteConfirm((prev) => ({ ...prev, deleting: true }));
    try {
      await deleteCustomAttribute(id);
      await refreshCustomAttributes();
      setDeleteConfirm({ open: false, def: null, deleting: false });
      showSnackbar(`Custom field "${label}" deactivated successfully.`);
    } catch (err) {
      setDeleteConfirm((prev) => ({ ...prev, deleting: false }));
      showSnackbar(err?.response?.data?.message || 'Failed to deactivate custom field.', 'error');
    }
  };

  const move = async (index, delta) => {
    const to = index + delta;
    if (to < 0 || to >= customAttributes.length) return;
    setReordering(true);
    try {
      const newIds = [...customAttributes.map((c) => c.id)];
      const [id] = newIds.splice(index, 1);
      newIds.splice(to, 0, id);
      await reorderCustomAttributes(newIds);
      await refreshCustomAttributes();
    } finally {
      setReordering(false);
    }
  };

  const genKeyFromLabel = (label) =>
    label
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('')
      .slice(0, 64);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.4 }}>
              Custom Fields
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add shop-specific attributes to every variant. Values live in the variant's <code>custom_attributes</code> JSON — no schema migration required.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openNew}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}
          >
            New Field
          </Button>
        </Stack>

        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          {customAttributesLoading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={44} sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : customAttributes.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No custom fields yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click <strong>New Field</strong> to add one — it will appear on every variant form for this shop.
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Order</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Label</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Key</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Required</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customAttributes.map((def, index) => (
                  <TableRow key={def.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => move(index, -1)} disabled={reordering || index === 0}>
                          <ArrowUpwardIcon fontSize="inherit" />
                        </IconButton>
                        <IconButton size="small" onClick={() => move(index, 1)} disabled={reordering || index === customAttributes.length - 1}>
                          <ArrowDownwardIcon fontSize="inherit" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{def.label}</Typography>
                      {def.helpText && (
                        <Typography variant="caption" color="text.secondary">{def.helpText}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }} color="text.secondary">
                        {def.keyName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={def.fieldType} size="small" variant="outlined" sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>{def.required ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(def)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={() => handleDeleteClick(def)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Container>

      {/* Edit / Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {form.id ? 'Edit Custom Field' : 'New Custom Field'}
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError(null)}>{error}</Alert>}

          <Stack spacing={2}>
            <TextField
              label="Label"
              value={form.label}
              onChange={(e) => {
                const label = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  label,
                  // Auto-generate key while creating; leave alone on edit.
                  keyName: !prev.id && (prev.keyName === '' || prev.keyName === genKeyFromLabel(prev.label))
                    ? genKeyFromLabel(label)
                    : prev.keyName,
                }));
              }}
              required
              fullWidth
              helperText="Shown on the form, e.g. 'Return Window (days)'"
            />
            <TextField
              label="Key"
              value={form.keyName}
              onChange={(e) => setForm((prev) => ({ ...prev, keyName: e.target.value }))}
              required
              fullWidth
              helperText="Machine key. Auto-filled from label. Letters, digits, underscores only."
              disabled={!!form.id}
            />
            <TextField
              select
              label="Type"
              value={form.fieldType}
              onChange={(e) => setForm((prev) => ({ ...prev, fieldType: e.target.value }))}
              fullWidth
            >
              {FIELD_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
            {form.fieldType === 'select' && (
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={form.options}
                onChange={(_, v) => setForm((prev) => ({ ...prev, options: v }))}
                renderInput={(p) => (
                  <TextField {...p} label="Options" placeholder="Type an option and press Enter" helperText="At least one option required for Select." />
                )}
              />
            )}
            <TextField
              label="Help text (optional)"
              value={form.helpText}
              onChange={(e) => setForm((prev) => ({ ...prev, helpText: e.target.value }))}
              fullWidth
              multiline
              minRows={1}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.required}
                  onChange={(e) => setForm((prev) => ({ ...prev, required: e.target.checked }))}
                />
              }
              label="Required"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, boxShadow: 'none' }}
          >
            {form.id ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => !deleteConfirm.deleting && setDeleteConfirm({ open: false, def: null, deleting: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Deactivate Custom Field?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to deactivate <strong>&ldquo;{deleteConfirm.def?.label}&rdquo;</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Existing variant values will remain saved in the database, but the field will no longer appear on item forms.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteConfirm({ open: false, def: null, deleting: false })}
            disabled={deleteConfirm.deleting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteConfirm.deleting}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, boxShadow: 'none' }}
          >
            {deleteConfirm.deleting ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
