import React from 'react';
import {
  Box, Grid, TextField, MenuItem, Switch, FormControlLabel, Typography,
  Divider, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { GST_STATES, SUPPLY_TYPES, formatPlaceOfSupply, parsePlaceOfSupply } from '../utils/gstStates';

/**
 * Shared statutory GST inputs for Sale / PO / GRN editors. Renders as a
 * compact fieldset so the caller decides where it sits inside the parent
 * form. All fields are optional — the caller controls which are shown via
 * the `show*` props.
 *
 * Value shape (owned by the parent):
 *   {
 *     placeOfSupply: "27-Maharashtra"  // "code-name" string, matches BE
 *     supplyType:    "INTRASTATE"      // SupplyType enum name
 *     reverseCharge: false
 *     billToAddress: "..."             // free-text snapshot (multi-line)
 *     shipToAddress: "..."
 *     consigneeAddress: "..."          // only meaningful outward
 *   }
 *
 * onChange is called with the whole next state — same shape.
 */
export default function StatutoryFieldset({
  value = {},
  onChange,
  showAddresses = true,
  showConsignee = true,
  showReverseCharge = true,
  showSupplyType = true,
  disabled = false,
  title = 'Statutory / GST',
}) {
  const v = value || {};
  const patch = (next) => onChange && onChange({ ...v, ...next });

  const posParsed = parsePlaceOfSupply(v.placeOfSupply);

  const handlePosChange = (code) => {
    const row = GST_STATES.find((r) => r[0] === code);
    const name = row ? row[1] : '';
    patch({ placeOfSupply: formatPlaceOfSupply(code, name) });
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" select
            label="Place of Supply (state)"
            value={posParsed.code}
            onChange={(e) => handlePosChange(e.target.value)}
            disabled={disabled}
            helperText="GST state where the supply is deemed to occur"
          >
            <MenuItem value=""><em>— Auto (customer / shop state) —</em></MenuItem>
            {GST_STATES.map(([code, name]) => (
              <MenuItem key={code} value={code}>{code} — {name}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {showSupplyType && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" select
              label="Supply type"
              value={v.supplyType || ''}
              onChange={(e) => patch({ supplyType: e.target.value || null })}
              disabled={disabled}
              helperText="Drives CGST+SGST vs IGST vs zero-rated"
            >
              <MenuItem value=""><em>— Auto (derived from PoS) —</em></MenuItem>
              {SUPPLY_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        {showReverseCharge && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={!!v.reverseCharge}
                  onChange={(e) => patch({ reverseCharge: e.target.checked })}
                  disabled={disabled}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Reverse charge applicable
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Recipient is liable to pay tax; PDF prints a notice; GSTR‑1 rchrg="Y".
                  </Typography>
                </Box>
              }
            />
          </Grid>
        )}
      </Grid>

      {showAddresses && (
        <Accordion elevation={0} disableGutters
                   sx={{ mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Bill-to / Ship-to {showConsignee ? '/ Consignee' : ''} addresses
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, alignSelf: 'center' }}>
              Optional — leave blank to use the party's default address
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={showConsignee ? 4 : 6}>
                <TextField
                  fullWidth size="small" multiline minRows={3}
                  label="Bill-to address"
                  value={v.billToAddress || ''}
                  onChange={(e) => patch({ billToAddress: e.target.value })}
                  disabled={disabled}
                  helperText="Snapshot at the time of doc creation"
                />
              </Grid>
              <Grid item xs={12} sm={showConsignee ? 4 : 6}>
                <TextField
                  fullWidth size="small" multiline minRows={3}
                  label="Ship-to address"
                  value={v.shipToAddress || ''}
                  onChange={(e) => patch({ shipToAddress: e.target.value })}
                  disabled={disabled}
                />
              </Grid>
              {showConsignee && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth size="small" multiline minRows={3}
                    label="Consignee address"
                    value={v.consigneeAddress || ''}
                    onChange={(e) => patch({ consigneeAddress: e.target.value })}
                    disabled={disabled}
                    helperText="Third-party recipient, if different"
                  />
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}
