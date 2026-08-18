import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import {
  fetchCustomerCustomFields,
  bulkSaveCustomerCustomFields,
  deleteCustomerCustomField,
} from '../../services/api';

/**
 * Free-form custom key/value fields for a customer. The backend
 * stores anything the FE sends — no separate field-definition
 * catalogue is enforced here, so a shop can add ad-hoc attributes
 * ("preferred delivery day", "loyalty tier", "referred by")
 * per-customer without a schema change.
 */
export default function CustomerCustomFieldsPanel({ customerId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchCustomerCustomFields(customerId);
      setRows(Array.isArray(data) ? data.map((r) => ({ ...r })) : []);
      setDirty(false);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load custom fields.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const setRow = (idx, patch) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const addRow = () => {
    setRows((prev) => [...prev, { fieldKey: '', fieldValue: '', __new: true }]);
    setDirty(true);
  };

  const removeRow = async (idx) => {
    const row = rows[idx];
    // If this row was persisted (has id and no __new flag), delete
    // it on the server first so a Save-Cancel doesn't leave orphans.
    if (row && row.id && !row.__new && row.fieldKey) {
      try {
        await deleteCustomerCustomField(customerId, row.fieldKey);
      } catch (e) {
        setError(e?.response?.data?.message || 'Could not delete field.');
        return;
      }
    }
    setRows((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const save = async () => {
    const map = {};
    for (const r of rows) {
      const k = (r.fieldKey || '').trim();
      if (!k) continue;
      map[k] = r.fieldValue || '';
    }
    setSaving(true);
    setError('');
    try {
      await bulkSaveCustomerCustomFields(customerId, map);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not save custom fields.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={800}>Custom fields</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addRow}
            sx={{ textTransform: 'none' }}
          >
            Add field
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={save}
            disabled={!dirty || saving}
            disableElevation
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
      ) : rows.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderRadius: 2.5 }}>
          <ListAltIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No custom fields yet. Add key/value pairs to store shop-specific info about this customer.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {rows.map((r, idx) => (
            <Paper key={r.id ?? `new-${idx}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                <TextField
                  size="small"
                  label="Field key"
                  placeholder="e.g. delivery_day"
                  value={r.fieldKey || ''}
                  onChange={(e) => setRow(idx, { fieldKey: e.target.value })}
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <TextField
                  size="small"
                  label="Value"
                  value={r.fieldValue || ''}
                  onChange={(e) => setRow(idx, { fieldValue: e.target.value })}
                  sx={{ flex: 2 }}
                />
                <Tooltip title="Remove field">
                  <IconButton size="small" onClick={() => removeRow(idx)} aria-label="Remove custom field">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
