import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DoneIcon from '@mui/icons-material/Done';
import LabelIcon from '@mui/icons-material/LabelOutlined';
import {
  fetchCustomerSegments,
  fetchSegmentsForCustomer,
  createCustomerSegment,
  replaceCustomerSegments,
} from '../../services/api';
import { stringToColor } from '../../utils/customerFormat';

/**
 * Compact segments picker rendered on the customer sidebar. Shows
 * the customer's current segment chips + a "Manage" button that
 * opens a dialog for multi-select from the shop-wide catalogue.
 * Also allows creating a new segment inline (Zoho pattern).
 */
export default function CustomerSegmentsPicker({ customerId }) {
  const [all, setAll] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [newSegName, setNewSegName] = useState('');

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError('');
    try {
      const [allRes, mineRes] = await Promise.all([
        fetchCustomerSegments().catch(() => []),
        fetchSegmentsForCustomer(customerId).catch(() => []),
      ]);
      setAll(Array.isArray(allRes) ? allRes : []);
      setMine(Array.isArray(mineRes) ? mineRes : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load segments.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const openPicker = () => {
    setSelectedIds(mine.map((s) => s.id));
    setNewSegName('');
    setPickerOpen(true);
  };
  const closePicker = () => !busy && setPickerOpen(false);

  const toggleId = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const createNewSegment = async () => {
    const name = newSegName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const created = await createCustomerSegment({ name });
      setAll((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedIds((prev) => [...prev, created.id]);
      setNewSegName('');
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not create segment.');
    } finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const updated = await replaceCustomerSegments(customerId, selectedIds);
      setMine(Array.isArray(updated) ? updated : []);
      setPickerOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not save segments.');
    } finally { setBusy(false); }
  };

  const chipColor = (s) => s.color || stringToColor(s.name);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Segments
        </Typography>
        <Button size="small" onClick={openPicker} disabled={loading} sx={{ textTransform: 'none', minWidth: 0, py: 0 }}>
          Manage
        </Button>
      </Stack>

      {loading ? (
        <Stack alignItems="center" py={1}><CircularProgress size={16} /></Stack>
      ) : mine.length === 0 ? (
        <Typography variant="caption" color="text.disabled">No segments yet</Typography>
      ) : (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {mine.map((s) => (
            <Chip
              key={s.id}
              size="small"
              icon={<LabelIcon fontSize="small" style={{ color: chipColor(s) }} />}
              label={s.name}
              variant="outlined"
              sx={{
                borderColor: chipColor(s),
                color: 'text.primary',
                fontWeight: 600,
                '& .MuiChip-icon': { color: chipColor(s) },
              }}
            />
          ))}
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Manage-segments dialog */}
      <Dialog open={pickerOpen} onClose={closePicker} fullWidth maxWidth="xs">
        <DialogTitle>Manage segments</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add new segment…"
              value={newSegName}
              onChange={(e) => setNewSegName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createNewSegment(); } }}
            />
            <IconButton
              color="primary"
              onClick={createNewSegment}
              disabled={busy || !newSegName.trim()}
              aria-label="Create segment"
            >
              <AddIcon />
            </IconButton>
          </Stack>

          {all.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No segments defined yet. Create your first above.
            </Typography>
          ) : (
            <List dense sx={{ maxHeight: 300, overflowY: 'auto', bgcolor: 'action.hover', borderRadius: 1.5 }}>
              {all.map((s) => {
                const on = selectedIds.includes(s.id);
                return (
                  <ListItem key={s.id} disablePadding>
                    <ListItemButton onClick={() => toggleId(s.id)} dense>
                      <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: chipColor(s), mr: 1.5, flexShrink: 0 }} />
                      <ListItemText
                        primary={s.name}
                        secondary={typeof s.memberCount === 'number' ? `${s.memberCount} customer${s.memberCount === 1 ? '' : 's'}` : null}
                      />
                      {on && <DoneIcon fontSize="small" color="primary" />}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePicker} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={busy}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
