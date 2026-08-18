import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchCustomerSegments } from '../../services/api';

/**
 * Right-side faceted filter drawer for the Customer list. Adds the
 * three filter slots the hook has always supported but the UI never
 * exposed (city / source / segments), plus a credit-status filter
 * for over-limit / on-hold customers.
 *
 * <p>The parent controls filter state via `filters` + `setFilters`;
 * this drawer just proposes changes on Apply. Doesn't fire on every
 * checkbox toggle so the caller isn't fetching mid-flight.</p>
 */
const SOURCES = [
  { value: '', label: 'Any source' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Other' },
];

const CREDIT_STATUS = [
  { value: '', label: 'Any credit status' },
  { value: 'HOLD', label: 'On credit hold' },
  { value: 'OVERDUE', label: 'Has overdue invoices' },
  { value: 'OVER_LIMIT', label: 'Over credit limit' },
];

export default function CustomerFilterDrawer({ open, onClose, filters, onApply }) {
  const [draft, setDraft] = useState(filters);
  const [segments, setSegments] = useState([]);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchCustomerSegments()
      .then((data) => { if (!cancelled) setSegments(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setSegments([]); });
    return () => { cancelled = true; };
  }, [open]);

  const activeCount = [
    draft.city, draft.source, draft.tags,
    draft.creditStatus, (draft.segmentIds || []).length,
  ].filter(Boolean).filter((v) => v !== 0).length;

  const setField = (name, value) => setDraft((s) => ({ ...s, [name]: value }));

  const toggleSegment = (id) => setDraft((s) => {
    const list = s.segmentIds || [];
    return { ...s, segmentIds: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] };
  });

  const clearAll = () => setDraft({
    ...draft,
    city: '',
    source: '',
    tags: '',
    creditStatus: '',
    segmentIds: [],
  });

  const apply = () => {
    onApply({
      city: draft.city || '',
      source: draft.source || '',
      tags: draft.tags || '',
      creditStatus: draft.creditStatus || '',
      segmentIds: draft.segmentIds || [],
    });
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 380 }, borderRadius: 0 } }}
    >
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>Filters</Typography>
          <Typography variant="caption" color="text.secondary">
            {activeCount > 0 ? `${activeCount} active` : 'No active filters'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close filters"><CloseIcon /></IconButton>
      </Box>

      <Box sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
        <Stack spacing={3}>
          {/* City */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              City
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. Bengaluru"
              value={draft.city || ''}
              onChange={(e) => setField('city', e.target.value)}
            />
          </Box>

          {/* Source */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Source
            </Typography>
            <TextField
              size="small"
              fullWidth
              select
              value={draft.source || ''}
              onChange={(e) => setField('source', e.target.value)}
            >
              {SOURCES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Box>

          {/* Credit status */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Credit status
            </Typography>
            <TextField
              size="small"
              fullWidth
              select
              value={draft.creditStatus || ''}
              onChange={(e) => setField('creditStatus', e.target.value)}
            >
              {CREDIT_STATUS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Box>

          {/* Segments */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Segments
            </Typography>
            {segments.length === 0 ? (
              <Typography variant="caption" color="text.disabled">
                No segments defined yet.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {segments.map((s) => {
                  const on = (draft.segmentIds || []).includes(s.id);
                  return (
                    <Chip
                      key={s.id}
                      label={s.name}
                      onClick={() => toggleSegment(s.id)}
                      clickable
                      color={on ? 'primary' : 'default'}
                      variant={on ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 600 }}
                    />
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* Tags (legacy CSV) */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Tags (legacy)
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="comma-separated"
              value={draft.tags || ''}
              onChange={(e) => setField('tags', e.target.value)}
              helperText="Legacy CSV tag column — new work uses Segments above."
            />
          </Box>
        </Stack>
      </Box>

      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
        <Button onClick={clearAll} sx={{ textTransform: 'none' }}>Clear all</Button>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={apply} disableElevation sx={{ textTransform: 'none', fontWeight: 700 }}>
            Apply filters
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
