import React from 'react';
import {
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
} from '@mui/material';

/**
 * IndustrySlot — a thin field-renderer driven entirely by the server-
 * side IndustryFieldSpec (see backend IndustryFieldRegistry). It reads
 * an array of FieldSpec objects and dispatches on `type` to pick the
 * right MUI widget.
 *
 * Keeps the item / variant forms industry-agnostic: adding an industry
 * or renaming a field on the backend is picked up on the next page
 * load, without a frontend change.
 */
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: 'background.paper',
    '& fieldset': { borderColor: 'divider' },
    '&:hover fieldset': { borderColor: 'divider' },
    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
  },
};

/**
 * @param {object} props
 * @param {object[]} props.fields — normalised FieldSpec list (key, label, type, required, min, max, options, helpText).
 * @param {object}   props.values — value bag the fields read from.
 * @param {(key: string, value: any) => void} props.onChange — writes to the value bag.
 * @param {string}   [props.valueContainerKey] — when set, the component reads and writes
 *                   values from `values[valueContainerKey][key]` instead of top-level.
 *                   Used for custom attributes stored in the `customAttributes` JSON map.
 */
export default function IndustrySlot({ fields = [], values = {}, onChange, valueContainerKey }) {
  if (!fields || fields.length === 0) return null;

  const readValue = (key) => {
    if (valueContainerKey) return values?.[valueContainerKey]?.[key] ?? '';
    return values?.[key] ?? '';
  };

  const setField = (key, value) => {
    if (!onChange) return;
    if (valueContainerKey) {
      const nested = { ...(values?.[valueContainerKey] || {}), [key]: value };
      onChange(valueContainerKey, nested);
    } else {
      onChange(key, value);
    }
  };

  return (
    <>
      {fields.map((f) => {
        const value = readValue(f.key);

        if (f.type === 'select') {
          return (
            <Grid item xs={12} sm={6} key={f.key}>
              <TextField
                select
                label={f.label}
                required={f.required}
                value={value}
                onChange={(e) => setField(f.key, e.target.value)}
                fullWidth
                sx={inputSx}
                helperText={f.helpText || ''}
              >
                <MenuItem value=""><em>—</em></MenuItem>
                {(f.options || []).map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            </Grid>
          );
        }

        if (f.type === 'number') {
          const inputProps = {};
          if (f.min !== null && f.min !== undefined) inputProps.min = f.min;
          if (f.max !== null && f.max !== undefined) inputProps.max = f.max;
          inputProps.step = 'any';
          return (
            <Grid item xs={12} sm={6} key={f.key}>
              <TextField
                label={f.label}
                required={f.required}
                type="number"
                value={value}
                onChange={(e) => setField(f.key, e.target.value)}
                fullWidth
                sx={inputSx}
                helperText={f.helpText || ''}
                InputProps={{ inputProps }}
              />
            </Grid>
          );
        }

        if (f.type === 'date') {
          return (
            <Grid item xs={12} sm={6} key={f.key}>
              <TextField
                label={f.label}
                required={f.required}
                type="date"
                value={value}
                onChange={(e) => setField(f.key, e.target.value)}
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: true }}
                helperText={f.helpText || ''}
              />
            </Grid>
          );
        }

        if (f.type === 'boolean') {
          return (
            <Grid item xs={12} sm={6} key={f.key} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!value}
                    onChange={(e) => setField(f.key, e.target.checked)}
                  />
                }
                label={f.label + (f.required ? ' *' : '')}
              />
            </Grid>
          );
        }

        // Default = text
        return (
          <Grid item xs={12} sm={6} key={f.key}>
            <TextField
              label={f.label}
              required={f.required}
              value={value}
              onChange={(e) => setField(f.key, e.target.value)}
              fullWidth
              sx={inputSx}
              helperText={f.helpText || ''}
              InputProps={f.helpText && /₹/.test(f.helpText) ? {
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              } : undefined}
            />
          </Grid>
        );
      })}
    </>
  );
}
