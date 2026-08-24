/**
 * FilterBuilderDialog — enterprise advanced filter builder.
 *
 * Usage:
 *   <FilterBuilderDialog
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     fields={CUSTOMER_FILTER_FIELDS}
 *     value={conditions}         // {logic: 'AND'|'OR', conditions: [...]}
 *     onChange={setConditions}
 *     onApply={(filterState) => applyFilters(filterState)}
 *   />
 *
 * fields: Array of field definitions:
 *   { key: string, label: string, type: 'text'|'number'|'select'|'date'|'boolean',
 *     options?: [{value, label}] (for 'select') }
 *
 * Produces a flat filter state object that pages apply client-side or
 * pass as query params to the backend. Export to CSV/JSON and shareable
 * URL encoding are exposed as callbacks so the page decides how to use them.
 */

import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ShareIcon from '@mui/icons-material/Share';

// ── Operators per field type ──────────────────────────────────────────────────
const OPERATORS = {
  text: [
    { value: 'contains',      label: 'contains' },
    { value: 'equals',        label: 'equals' },
    { value: 'starts_with',   label: 'starts with' },
    { value: 'ends_with',     label: 'ends with' },
    { value: 'not_contains',  label: 'does not contain' },
    { value: 'not_equals',    label: 'is not' },
    { value: 'is_empty',      label: 'is empty' },
    { value: 'is_not_empty',  label: 'is not empty' },
  ],
  number: [
    { value: 'equals',        label: '= equals' },
    { value: 'not_equals',    label: '≠ not equals' },
    { value: 'gt',            label: '> greater than' },
    { value: 'gte',           label: '≥ at least' },
    { value: 'lt',            label: '< less than' },
    { value: 'lte',           label: '≤ at most' },
    { value: 'between',       label: 'between' },
  ],
  date: [
    { value: 'equals',        label: 'on date' },
    { value: 'before',        label: 'before' },
    { value: 'after',         label: 'after' },
    { value: 'between',       label: 'between' },
    { value: 'last_n_days',   label: 'last N days' },
    { value: 'is_empty',      label: 'is empty' },
  ],
  select: [
    { value: 'in',            label: 'is any of' },
    { value: 'not_in',        label: 'is none of' },
    { value: 'equals',        label: 'equals' },
    { value: 'not_equals',    label: 'is not' },
  ],
  boolean: [
    { value: 'equals',        label: 'is' },
  ],
};

// Operators that need two value fields
const DUAL_VALUE_OPS = new Set(['between']);
// Operators that need no value field
const NO_VALUE_OPS = new Set(['is_empty', 'is_not_empty']);

const BLANK_CONDITION = { id: Date.now(), field: '', operator: 'contains', value: '', value2: '' };

function makeId() {
  return Date.now() + Math.random();
}

// ── Single condition row ──────────────────────────────────────────────────────
function ConditionRow({ condition, fields, onChange, onRemove, isFirst, logic, onLogicChange }) {
  const theme = useTheme();

  const fieldDef = fields.find((f) => f.key === condition.field);
  const fieldType = fieldDef?.type || 'text';
  const operators = OPERATORS[fieldType] || OPERATORS.text;

  // When field changes, reset operator to first valid one for new type
  const handleFieldChange = (e) => {
    const newField = e.target.value;
    const newFieldDef = fields.find((f) => f.key === newField);
    const newType = newFieldDef?.type || 'text';
    const firstOp = (OPERATORS[newType] || OPERATORS.text)[0].value;
    onChange({ ...condition, field: newField, operator: firstOp, value: '', value2: '' });
  };

  const handleOperatorChange = (e) => {
    onChange({ ...condition, operator: e.target.value, value: '', value2: '' });
  };

  const needsValue = !NO_VALUE_OPS.has(condition.operator);
  const isDual = DUAL_VALUE_OPS.has(condition.operator);

  const renderValueInput = () => {
    if (!needsValue) return null;

    // Select / multi-select value
    if (fieldType === 'select' && fieldDef?.options) {
      if (condition.operator === 'in' || condition.operator === 'not_in') {
        const selectedValues = condition.value ? condition.value.split(',').filter(Boolean) : [];
        return (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              multiple
              value={selectedValues}
              onChange={(e) => onChange({ ...condition, value: e.target.value.join(',') })}
              renderValue={(selected) =>
                selected.length === 0
                  ? <Typography color="text.disabled" variant="body2">Select values</Typography>
                  : (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selected.map((v) => {
                        const opt = fieldDef.options.find((o) => o.value === v);
                        return <Chip key={v} label={opt?.label || v} size="small" sx={{ height: 20 }} />;
                      })}
                    </Box>
                  )
              }
              displayEmpty
            >
              {fieldDef.options.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }
      return (
        <TextField
          select size="small" sx={{ minWidth: 160 }}
          value={condition.value}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
        >
          <MenuItem value=""><em>Any</em></MenuItem>
          {fieldDef.options.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      );
    }

    // Boolean
    if (fieldType === 'boolean') {
      return (
        <TextField
          select size="small" sx={{ minWidth: 120 }}
          value={condition.value}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
        >
          <MenuItem value="true">Yes / True</MenuItem>
          <MenuItem value="false">No / False</MenuItem>
        </TextField>
      );
    }

    // Number — last N days
    if (fieldType === 'date' && condition.operator === 'last_n_days') {
      return (
        <TextField
          size="small" type="number" sx={{ width: 100 }}
          label="Days"
          value={condition.value}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
          inputProps={{ min: 1, max: 3650 }}
        />
      );
    }

    // Date
    if (fieldType === 'date') {
      return (
        <>
          <TextField
            size="small" type="date" sx={{ width: 155 }}
            label={isDual ? 'From' : ''}
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          {isDual && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>and</Typography>
              <TextField
                size="small" type="date" sx={{ width: 155 }}
                label="To"
                value={condition.value2}
                onChange={(e) => onChange({ ...condition, value2: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </>
      );
    }

    // Number
    if (fieldType === 'number') {
      return (
        <>
          <TextField
            size="small" type="number" sx={{ width: 130 }}
            label={isDual ? 'Min' : 'Value'}
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
          />
          {isDual && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>and</Typography>
              <TextField
                size="small" type="number" sx={{ width: 130 }}
                label="Max"
                value={condition.value2}
                onChange={(e) => onChange({ ...condition, value2: e.target.value })}
              />
            </>
          )}
        </>
      );
    }

    // Default text
    return (
      <TextField
        size="small" sx={{ minWidth: 200 }}
        placeholder="Value"
        value={condition.value}
        onChange={(e) => onChange({ ...condition, value: e.target.value })}
      />
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.background.default, 0.5),
        flexWrap: 'wrap',
      }}
    >
      {/* AND/OR logic toggle — only on rows after the first */}
      <Box sx={{ width: 56, flexShrink: 0, pt: 0.5 }}>
        {isFirst ? (
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.disabled"
            sx={{ display: 'block', textAlign: 'center', lineHeight: '32px', fontSize: '0.7rem' }}
          >
            WHERE
          </Typography>
        ) : (
          <ToggleButtonGroup
            exclusive
            value={logic}
            onChange={(_, v) => v && onLogicChange(v)}
            size="small"
            sx={{ height: 32, '& .MuiToggleButton-root': { px: 1, py: 0, fontSize: '0.7rem', fontWeight: 800 } }}
          >
            <ToggleButton value="AND">AND</ToggleButton>
            <ToggleButton value="OR">OR</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Field picker */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Field</InputLabel>
        <Select
          label="Field"
          value={condition.field}
          onChange={handleFieldChange}
        >
          <MenuItem value=""><em>Select field</em></MenuItem>
          {fields.map((f) => (
            <MenuItem key={f.key} value={f.key}>{f.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Operator picker */}
      {condition.field && (
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Operator</InputLabel>
          <Select
            label="Operator"
            value={condition.operator}
            onChange={handleOperatorChange}
          >
            {operators.map((op) => (
              <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Value inputs */}
      {condition.field && renderValueInput()}

      {/* Remove row */}
      <IconButton
        size="small"
        onClick={onRemove}
        sx={{ ml: 'auto', alignSelf: 'center', color: 'text.disabled', '&:hover': { color: 'error.main' } }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

// ── Encode / decode filter state to URL-safe base64 ───────────────────────────
function encodeFilterToUrl(filterState) {
  try {
    return btoa(encodeURIComponent(JSON.stringify(filterState)));
  } catch {
    return '';
  }
}

export function decodeFilterFromUrl(encoded) {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
}

// ── Main dialog ───────────────────────────────────────────────────────────────
/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {Array}  props.fields     - field definitions array
 * @param {object} props.value      - { logic: 'AND'|'OR', conditions: [] }
 * @param {function} props.onChange - called with new filter state on Apply
 * @param {function} [props.onApply] - alias for onChange
 */
export default function FilterBuilderDialog({ open, onClose, fields = [], value, onChange, onApply }) {
  const theme = useTheme();

  const initial = value && value.conditions?.length
    ? value
    : { logic: 'AND', conditions: [{ ...BLANK_CONDITION, id: makeId() }] };

  const [logic, setLogic] = useState(initial.logic || 'AND');
  const [conditions, setConditions] = useState(
    initial.conditions?.length
      ? initial.conditions
      : [{ ...BLANK_CONDITION, id: makeId() }]
  );
  const [snackMsg, setSnackMsg] = useState('');

  // Sync from parent when dialog opens
  React.useEffect(() => {
    if (open) {
      const incoming = value && value.conditions?.length ? value : { logic: 'AND', conditions: [{ ...BLANK_CONDITION, id: makeId() }] };
      setLogic(incoming.logic || 'AND');
      setConditions(incoming.conditions?.length ? incoming.conditions : [{ ...BLANK_CONDITION, id: makeId() }]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const addCondition = () => {
    setConditions((prev) => [...prev, { ...BLANK_CONDITION, id: makeId(), operator: 'contains' }]);
  };

  const updateCondition = (id, updated) => {
    setConditions((prev) => prev.map((c) => (c.id === id ? { ...updated } : c)));
  };

  const removeCondition = (id) => {
    setConditions((prev) => {
      const next = prev.filter((c) => c.id !== id);
      return next.length ? next : [{ ...BLANK_CONDITION, id: makeId() }];
    });
  };

  const handleApply = () => {
    const state = { logic, conditions };
    (onApply || onChange)?.(state);
    onClose();
  };

  const handleClear = () => {
    const empty = { logic: 'AND', conditions: [{ ...BLANK_CONDITION, id: makeId() }] };
    setLogic('AND');
    setConditions(empty.conditions);
    (onApply || onChange)?.(empty);
    onClose();
  };

  // Export current conditions as JSON
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify({ logic, conditions }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filter_${Date.now()}.json`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  // Export conditions as shareable URL fragment
  const handleShareUrl = () => {
    const encoded = encodeFilterToUrl({ logic, conditions });
    const url = `${window.location.origin}${window.location.pathname}?filter=${encoded}`;
    navigator.clipboard.writeText(url).then(
      () => setSnackMsg('Filter URL copied to clipboard!'),
      () => setSnackMsg('Could not copy — try manually: ' + url),
    );
  };

  const activeCount = conditions.filter((c) => c.field && c.value).length;

  // Human-readable summary for the title chip
  const summaryText = activeCount === 0
    ? 'No conditions set'
    : `${activeCount} condition${activeCount > 1 ? 's' : ''} · ${logic}`;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilterAltIcon color="primary" />
            <Box flex={1}>
              <Typography variant="h6" fontWeight={800}>Advanced Filter Builder</Typography>
              <Typography variant="caption" color="text.secondary">
                Build complex conditions with AND / OR logic
              </Typography>
            </Box>
            <Chip
              label={summaryText}
              size="small"
              color={activeCount > 0 ? 'primary' : 'default'}
              variant={activeCount > 0 ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={1.5}>
            {conditions.map((cond, idx) => (
              <ConditionRow
                key={cond.id}
                condition={cond}
                fields={fields}
                isFirst={idx === 0}
                logic={logic}
                onLogicChange={setLogic}
                onChange={(updated) => updateCondition(cond.id, updated)}
                onRemove={() => removeCondition(cond.id)}
              />
            ))}
          </Stack>

          <Button
            startIcon={<AddIcon />}
            onClick={addCondition}
            size="small"
            sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Add condition
          </Button>

          {/* Preview of logic as plain English */}
          {activeCount > 0 && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.2),
              }}
            >
              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ display: 'block', mb: 0.5 }}>
                Filter preview
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', lineHeight: 1.8 }}>
                {conditions
                  .filter((c) => c.field && (c.value || NO_VALUE_OPS.has(c.operator)))
                  .map((c, i) => {
                    const fld = fields.find((f) => f.key === c.field);
                    const ops = OPERATORS[fld?.type || 'text'] || OPERATORS.text;
                    const op = ops.find((o) => o.value === c.operator)?.label || c.operator;
                    const val = NO_VALUE_OPS.has(c.operator) ? '' : DUAL_VALUE_OPS.has(c.operator) ? `${c.value} and ${c.value2}` : c.value;
                    const prefix = i === 0 ? '' : ` ${logic} `;
                    return `${prefix}[${fld?.label || c.field}] ${op}${val ? ` "${val}"` : ''}`;
                  })
                  .join('') || '—'}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 2.5, py: 2, justifyContent: 'space-between' }}>
          {/* Left: export actions */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Export filter as JSON">
              <IconButton size="small" onClick={handleExportJson} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy shareable URL">
              <IconButton size="small" onClick={handleShareUrl} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Right: main actions */}
          <Stack direction="row" spacing={1}>
            <Button onClick={handleClear} color="inherit" sx={{ textTransform: 'none' }}>
              Clear all
            </Button>
            <Button onClick={onClose} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              disableElevation
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5 }}
            >
              Apply filter{activeCount > 1 ? 's' : ''}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Clipboard feedback */}
      {snackMsg && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            bgcolor: 'text.primary',
            color: 'background.paper',
            borderRadius: 2,
            px: 2,
            py: 1,
            boxShadow: 6,
          }}
          onClick={() => setSnackMsg('')}
        >
          <Typography variant="body2">{snackMsg}</Typography>
        </Box>
      )}
    </>
  );
}

// ── Utility: apply filter state to an array of records ────────────────────────
/**
 * Applies a filter state { logic, conditions } to an array of records.
 * Used for client-side filtering.
 *
 * @param {Array}  records
 * @param {object} filterState { logic: 'AND'|'OR', conditions: [...] }
 * @returns {Array} filtered records
 */
export function applyFilterState(records, filterState) {
  if (!filterState || !filterState.conditions?.length) return records;
  const { logic, conditions } = filterState;

  const activeConditions = conditions.filter(
    (c) => c.field && (c.value || c.value2 || NO_VALUE_OPS.has(c.operator))
  );
  if (!activeConditions.length) return records;

  return records.filter((record) => {
    const results = activeConditions.map((cond) => matchCondition(record, cond));
    return logic === 'OR' ? results.some(Boolean) : results.every(Boolean);
  });
}

function matchCondition(record, cond) {
  const rawVal = record[cond.field];
  const fieldVal = rawVal === null || rawVal === undefined ? '' : rawVal;

  switch (cond.operator) {
    case 'equals':
      return String(fieldVal).toLowerCase() === String(cond.value).toLowerCase();
    case 'not_equals':
      return String(fieldVal).toLowerCase() !== String(cond.value).toLowerCase();
    case 'contains':
      return String(fieldVal).toLowerCase().includes(String(cond.value).toLowerCase());
    case 'not_contains':
      return !String(fieldVal).toLowerCase().includes(String(cond.value).toLowerCase());
    case 'starts_with':
      return String(fieldVal).toLowerCase().startsWith(String(cond.value).toLowerCase());
    case 'ends_with':
      return String(fieldVal).toLowerCase().endsWith(String(cond.value).toLowerCase());
    case 'is_empty':
      return !fieldVal || String(fieldVal).trim() === '';
    case 'is_not_empty':
      return Boolean(fieldVal) && String(fieldVal).trim() !== '';
    case 'gt':
      return Number(fieldVal) > Number(cond.value);
    case 'gte':
      return Number(fieldVal) >= Number(cond.value);
    case 'lt':
      return Number(fieldVal) < Number(cond.value);
    case 'lte':
      return Number(fieldVal) <= Number(cond.value);
    case 'between': {
      const n = Number(fieldVal);
      return n >= Number(cond.value) && n <= Number(cond.value2);
    }
    case 'before': {
      const d = new Date(String(fieldVal));
      return d < new Date(cond.value);
    }
    case 'after': {
      const d = new Date(String(fieldVal));
      return d > new Date(cond.value);
    }
    case 'last_n_days': {
      const d = new Date(String(fieldVal));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(cond.value));
      return d >= cutoff;
    }
    case 'in': {
      const selected = cond.value ? cond.value.split(',').filter(Boolean) : [];
      return selected.length === 0 || selected.includes(String(fieldVal));
    }
    case 'not_in': {
      const excluded = cond.value ? cond.value.split(',').filter(Boolean) : [];
      return excluded.length === 0 || !excluded.includes(String(fieldVal));
    }
    default:
      return true;
  }
}
