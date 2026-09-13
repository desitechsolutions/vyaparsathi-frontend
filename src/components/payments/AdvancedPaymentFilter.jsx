import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Stack,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  Button,
  OutlinedInput,
  Typography,
  alpha,
  Collapse,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearAllIcon   from '@mui/icons-material/ClearAll';
import CheckIcon      from '@mui/icons-material/Check';
import { useAppPalette } from '../../hooks/useAppPalette';
import { DEFAULT_FILTERS } from '../../hooks/usePaymentFilters';

// ── Constants ─────────────────────────────────────────────────────────────────

const METHODS = [
  { value: 'CASH',        label: 'Cash' },
  { value: 'CARD',        label: 'Card' },
  { value: 'UPI',         label: 'UPI' },
  { value: 'NET_BANKING', label: 'Net Banking' },
  { value: 'CHEQUE',      label: 'Cheque' },
];

const STATUSES = [
  { value: 'PENDING',        label: 'Pending',      color: '#f59e0b' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid', color: '#f97316' },
  { value: 'PAID',           label: 'Paid',         color: '#059669' },
];

const LS_KEY = 'payment_filters_v1';

// ── Helpers ───────────────────────────────────────────────────────────────────

function countActive(f) {
  let n = 0;
  if (f.startDate || f.endDate) n++;
  if (f.methods?.length)        n++;
  if (f.status?.length)         n++;
  if (f.search?.trim())         n++;
  return n;
}

function saveToStorage(filters) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(filters)); } catch {}
}

function clearStorage() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * AdvancedPaymentFilter
 *
 * Collapsible filter bar for the Payment History table.
 * Maintains a local "draft" copy of the filter state so users can adjust
 * multiple fields before clicking "Apply Filters". The applied state is
 * persisted to localStorage under `payment_filters_v1`.
 *
 * Props:
 *   filters          — currently *applied* filter state (from usePaymentFilters)
 *   onFiltersChange  — called with the full new filter object when user applies
 *   loading          — true while the parent is fetching (disables Apply button)
 */
const AdvancedPaymentFilter = ({ filters, onFiltersChange, loading = false }) => {
  const theme = useAppPalette();

  // Whether the filter panel is expanded
  const [expanded, setExpanded] = useState(false);

  // Local draft — user edits here before clicking Apply
  const [draft, setDraft] = useState({ ...filters });

  // Keep draft in sync when the applied filters are reset from outside
  // (e.g. parent calls onFiltersChange with DEFAULT_FILTERS).
  useEffect(() => {
    setDraft({ ...filters });
  }, [filters]);

  // ── Draft handlers ────────────────────────────────────────────────────────

  const handleDraftChange = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Apply / Clear ─────────────────────────────────────────────────────────

  const handleApply = () => {
    const next = {
      startDate: draft.startDate || null,
      endDate:   draft.endDate   || null,
      methods:   draft.methods   ?? [],
      status:    draft.status    ?? [],
      search:    (draft.search   ?? '').trim(),
    };
    saveToStorage(next);
    onFiltersChange(next);
  };

  const handleClearAll = () => {
    setDraft({ ...DEFAULT_FILTERS });
    clearStorage();
    onFiltersChange({ ...DEFAULT_FILTERS });
  };

  // ── Derived values ────────────────────────────────────────────────────────

  /** Count of *applied* filters (shown in the toggle chip). */
  const appliedCount = useMemo(() => countActive(filters), [filters]);

  /** Count of *draft* filters (shown on Apply button). */
  const draftCount = useMemo(() => countActive(draft), [draft]);

  const hasDraftChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(filters),
    [draft, filters]
  );

  // ── Shared MUI styles ─────────────────────────────────────────────────────

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'background.paper',
      borderRadius: 1.5,
      fontSize: '0.85rem',
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: theme.primary },
      '&.Mui-focused fieldset': { borderColor: theme.primary },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: theme.primary },
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box
      component="section"
      aria-label="Payment filter controls"
      sx={{
        px: { xs: 2, md: 3 },
        pt: 2,
        pb: expanded ? 2 : 1.5,
        borderBottom: `1px solid ${alpha(theme.primary, 0.12)}`,
        bgcolor: alpha(theme.primary, 0.02),
      }}
    >
      {/* ── Toggle / summary row ─────────────────────────────────────── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        {/* Left: expand toggle + active count chip */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            size="small"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse payment filters' : 'Expand payment filters'}
            aria-expanded={expanded}
            aria-controls="payment-filter-fields"
            sx={{
              color: appliedCount > 0 ? theme.primary : theme.textSecondary,
              bgcolor: appliedCount > 0 ? alpha(theme.primary, 0.1) : 'transparent',
              '&:hover': { bgcolor: alpha(theme.primary, 0.15) },
              transition: 'all 0.2s',
              minWidth: 32,
              minHeight: 32,
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>

          <Typography
            variant="caption"
            fontWeight={700}
            color={appliedCount > 0 ? theme.primary : theme.textSecondary}
            sx={{ textTransform: 'uppercase', letterSpacing: 0.8, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide Filters' : 'Advanced Filters'}
          </Typography>

          {appliedCount > 0 && (
            <Chip
              label={appliedCount}
              size="small"
              color="primary"
              aria-label={`${appliedCount} filter${appliedCount !== 1 ? 's' : ''} applied`}
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 800,
                minWidth: 24,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
        </Stack>

        {/* Right: Clear All (only visible when filters are applied) */}
        {appliedCount > 0 && (
          <Tooltip title="Remove all applied filters" arrow>
            <Button
              size="small"
              startIcon={<ClearAllIcon fontSize="small" />}
              onClick={handleClearAll}
              disabled={loading}
              aria-label="Clear all payment filters"
              sx={{
                color: theme.textSecondary,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                '&:hover': { color: theme.error || '#e53e3e', bgcolor: alpha(theme.error || '#e53e3e', 0.06) },
              }}
            >
              Clear All
            </Button>
          </Tooltip>
        )}
      </Stack>

      {/* ── Filter fields (collapsible) ──────────────────────────────── */}
      <Collapse in={expanded} timeout={200}>
        <Stack
          id="payment-filter-fields"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ mt: 1.5 }}
          flexWrap="wrap"
          useFlexGap
          alignItems={{ xs: 'stretch', sm: 'flex-end' }}
          role="group"
          aria-label="Filter options"
        >
          {/* Transaction ID search */}
          <TextField
            label="Transaction ID"
            size="small"
            value={draft.search || ''}
            onChange={(e) => handleDraftChange('search', e.target.value)}
            placeholder="Search by transaction ID…"
            disabled={loading}
            sx={{ minWidth: 200, flex: '1 1 200px', ...inputSx }}
            inputProps={{ 'aria-label': 'Search payments by transaction ID' }}
          />

          {/* Date from */}
          <TextField
            label="From"
            type="date"
            size="small"
            value={draft.startDate || ''}
            onChange={(e) => handleDraftChange('startDate', e.target.value || null)}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 155, flex: '0 1 155px', ...inputSx }}
            inputProps={{ 'aria-label': 'Filter start date' }}
          />

          {/* Date to */}
          <TextField
            label="To"
            type="date"
            size="small"
            value={draft.endDate || ''}
            onChange={(e) => handleDraftChange('endDate', e.target.value || null)}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 155, flex: '0 1 155px', ...inputSx }}
            inputProps={{
              min: draft.startDate || undefined,
              'aria-label': 'Filter end date',
            }}
          />

          {/* Payment methods (multi-select) */}
          <FormControl
            size="small"
            disabled={loading}
            sx={{ minWidth: 180, flex: '1 1 180px', ...inputSx }}
          >
            <InputLabel id="filter-methods-label">Payment Methods</InputLabel>
            <Select
              labelId="filter-methods-label"
              multiple
              value={draft.methods || []}
              onChange={(e) => handleDraftChange('methods', e.target.value)}
              input={<OutlinedInput label="Payment Methods" />}
              inputProps={{
                'aria-label': 'Filter by payment method',
                'aria-labelledby': 'filter-methods-label',
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((val) => (
                    <Chip
                      key={val}
                      label={val}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                    />
                  ))}
                </Box>
              )}
            >
              {METHODS.map((m) => (
                <MenuItem key={m.value} value={m.value} dense>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Payment status (multi-select) */}
          <FormControl
            size="small"
            disabled={loading}
            sx={{ minWidth: 180, flex: '1 1 180px', ...inputSx }}
          >
            <InputLabel id="filter-status-label">Payment Status</InputLabel>
            <Select
              labelId="filter-status-label"
              multiple
              value={draft.status || []}
              onChange={(e) => handleDraftChange('status', e.target.value)}
              input={<OutlinedInput label="Payment Status" />}
              inputProps={{
                'aria-label': 'Filter by payment status',
                'aria-labelledby': 'filter-status-label',
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((val) => {
                    const s = STATUSES.find((x) => x.value === val);
                    return (
                      <Chip
                        key={val}
                        label={s?.label ?? val}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor: s ? alpha(s.color, 0.12) : undefined,
                          color: s?.color,
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value} dense>
                  <Chip
                    label={s.label}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      bgcolor: alpha(s.color, 0.1),
                      color: s.color,
                    }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Apply / Clear draft buttons */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleApply}
              disabled={loading || !hasDraftChanges}
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
              aria-label={`Apply filters${draftCount > 0 ? ` — ${draftCount} active` : ''}`}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                px: 2,
                whiteSpace: 'nowrap',
                bgcolor: theme.primary,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none', bgcolor: theme.primary },
              }}
            >
              Apply Filters
              {draftCount > 0 && (
                <Chip
                  label={draftCount}
                  size="small"
                  sx={{
                    ml: 0.75,
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    bgcolor: alpha('#fff', 0.25),
                    color: 'inherit',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              )}
            </Button>

            {draftCount > 0 && (
              <Button
                variant="text"
                size="small"
                onClick={() => setDraft({ ...DEFAULT_FILTERS })}
                disabled={loading}
                aria-label="Reset draft filters"
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  color: theme.textSecondary,
                  '&:hover': { color: theme.error || '#e53e3e' },
                }}
              >
                Reset
              </Button>
            )}
          </Stack>
        </Stack>
      </Collapse>
    </Box>
  );
};

export default AdvancedPaymentFilter;
