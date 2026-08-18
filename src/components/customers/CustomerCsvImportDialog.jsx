import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  TextField,
  Stack,
  Step,
  Stepper,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';

/**
 * 3-step CSV import: pick file → map columns → confirm & upload.
 *
 * <p>The backend expects a fixed column shape (Name, Phone, Email,
 * Customer Type, GSTIN, Address, City, State, Pincode, Credit Limit,
 * Credit Days, Legal Name, Trade Name, Notes). This dialog lets the
 * user upload ANY CSV, then map their header names to the canonical
 * columns before we send it — matches the Zoho Books import flow.</p>
 *
 * <p>Mapping is enforced on the client: we regenerate a canonical CSV
 * from the parsed rows + mapping and post that to the backend. If a
 * required column ("Name") isn't mapped, the Confirm button is
 * disabled with an inline explanation.</p>
 */

const CANONICAL_FIELDS = [
  { key: 'Name',          label: 'Name',           required: true, hint: 'Display name' },
  { key: 'Phone',         label: 'Phone',          hint: '10-digit mobile' },
  { key: 'Email',         label: 'Email',          hint: 'Optional' },
  { key: 'Customer Type', label: 'Customer type',  hint: 'INDIVIDUAL / BUSINESS / GOVERNMENT / EXPORT' },
  { key: 'Legal Name',    label: 'Legal name',     hint: 'Registered name (may differ from display)' },
  { key: 'Trade Name',    label: 'Trade name',     hint: 'Brand / trading-as name' },
  { key: 'GSTIN',         label: 'GSTIN',          hint: '15-char GST number for B2B' },
  { key: 'PAN',           label: 'PAN',            hint: '10-char PAN number' },
  { key: 'Address',       label: 'Address',        hint: 'Address line 1' },
  { key: 'City',          label: 'City' },
  { key: 'State',         label: 'State' },
  { key: 'Pincode',       label: 'Pincode' },
  { key: 'Credit Limit',  label: 'Credit limit',   hint: 'Rupees, no comma / symbol' },
  { key: 'Credit Days',   label: 'Credit days',    hint: 'Net-N terms (default 30)' },
  { key: 'Notes',         label: 'Notes' },
];

const PREVIEW_ROWS = 5;

function parseCsv(text) {
  // Small CSV parser — handles quoted fields with commas / newlines
  // and doubled-quotes as escapes. Enough for the import case; if a
  // shop has genuinely exotic CSVs, we punt to a proper parser later.
  const rows = [];
  let cur = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else { inQ = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQ = true;
    } else if (c === ',') {
      cur.push(field); field = '';
    } else if (c === '\n') {
      cur.push(field); rows.push(cur); cur = []; field = '';
    } else if (c === '\r') {
      /* skip */
    } else {
      field += c;
    }
  }
  if (field.length || cur.length) {
    cur.push(field); rows.push(cur);
  }
  // Drop trailing blank line
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }
  return rows;
}

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Guess a default mapping by matching header names case-insensitively. */
function guessMapping(userHeaders) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const map = {};
  CANONICAL_FIELDS.forEach((f) => {
    const target = norm(f.key);
    const idx = userHeaders.findIndex((h) => norm(h) === target);
    if (idx >= 0) map[f.key] = idx;
  });
  // Common aliases
  if (map.Name == null) {
    const alt = userHeaders.findIndex((h) => /customer\s*name|full\s*name/i.test(h));
    if (alt >= 0) map.Name = alt;
  }
  if (map['Customer Type'] == null) {
    const alt = userHeaders.findIndex((h) => /type|category/i.test(h));
    if (alt >= 0) map['Customer Type'] = alt;
  }
  return map;
}

export const CustomerCsvImportDialog = ({ open, onClose, onImport }) => {
  const [step, setStep] = useState(0); // 0 = pick, 1 = map, 2 = result
  const [file, setFile] = useState(null);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({}); // { canonicalKey: userHeaderIndex }
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const reset = () => {
    setStep(0); setFile(null); setRawHeaders([]); setRows([]);
    setMapping({}); setUploading(false); setResult(null); setError('');
  };
  const handleClose = () => { reset(); onClose(); };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const parsed = parseCsv(String(text || ''));
        if (parsed.length < 2) {
          setError('CSV has no data rows — need at least one header row and one data row.');
          return;
        }
        const headers = parsed[0];
        const dataRows = parsed.slice(1);
        setRawHeaders(headers);
        setRows(dataRows);
        setMapping(guessMapping(headers));
        setStep(1);
      } catch (ex) {
        setError('Could not parse the CSV — check the file is valid text.');
      }
    };
    reader.onerror = () => setError('Failed to read the file.');
    reader.readAsText(f);
  };

  const setFieldMapping = (canonicalKey, headerIdx) => {
    setMapping((prev) => ({ ...prev, [canonicalKey]: headerIdx }));
  };

  const missingRequired = useMemo(
    () => CANONICAL_FIELDS.filter((f) => f.required && mapping[f.key] == null && mapping[f.key] !== 0)
      .filter((f) => mapping[f.key] === undefined),
    [mapping],
  );

  const previewRows = useMemo(() => rows.slice(0, PREVIEW_ROWS), [rows]);

  const doUpload = async () => {
    setUploading(true);
    setError('');
    try {
      // Rebuild the CSV in canonical shape: header row = canonical
      // field keys, data rows built by indexing user rows through
      // the mapping. Missing columns emit empty strings.
      const canonicalHeader = CANONICAL_FIELDS.map((f) => f.key);
      const lines = [canonicalHeader.map(csvEscape).join(',')];
      for (const r of rows) {
        const line = CANONICAL_FIELDS.map((f) => {
          const idx = mapping[f.key];
          const v = (idx == null || idx === undefined) ? '' : (r[idx] ?? '');
          return csvEscape(v);
        }).join(',');
        lines.push(line);
      }
      const rewritten = new File(
        [new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })],
        (file?.name || 'customers').replace(/\.csv$/i, '') + '_mapped.csv',
        { type: 'text/csv' },
      );
      const resp = await onImport(rewritten);
      if (resp && resp.success === false) {
        setError(resp.error || 'Import failed.');
      } else {
        setResult(resp?.data || resp);
        setStep(2);
      }
    } catch (ex) {
      setError(ex?.message || 'Import failed.');
    } finally {
      setUploading(false);
    }
  };

  const totalRows = rows.length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'common.white' }}>
            <UploadIcon />
          </Box>
          <Typography variant="h6" fontWeight={700}>Import customers from CSV</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" aria-label="Close"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step><StepLabel>Choose file</StepLabel></Step>
          <Step><StepLabel>Map columns</StepLabel></Step>
          <Step><StepLabel>Result</StepLabel></Step>
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {step === 0 && (
          <Box
            component="label"
            sx={{
              p: 4,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.default',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'block',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            }}
          >
            <input type="file" accept=".csv,text/csv" hidden onChange={handleFileChange} />
            <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Click to pick a CSV
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Any header names — you'll map them to VyaparSathi fields in the next step.
            </Typography>
          </Box>
        )}

        {step === 1 && (
          <>
            <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>{totalRows}</strong> data rows detected in{' '}
                <strong>{file?.name}</strong>. Map each VyaparSathi field to a column from your CSV,
                or leave it blank to skip.
              </Typography>
            </Alert>

            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {CANONICAL_FIELDS.map((f) => (
                <Stack key={f.key} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {f.label}{f.required && <Chip label="Required" size="small" color="error" sx={{ ml: 1, height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
                    </Typography>
                    {f.hint && <Typography variant="caption" color="text.secondary">{f.hint}</Typography>}
                  </Box>
                  <TextField
                    size="small"
                    select
                    fullWidth
                    value={mapping[f.key] ?? ''}
                    onChange={(e) => setFieldMapping(f.key, e.target.value === '' ? undefined : Number(e.target.value))}
                    label="Source column"
                    error={f.required && mapping[f.key] == null}
                  >
                    <MenuItem value="">— Skip —</MenuItem>
                    {rawHeaders.map((h, idx) => (
                      <MenuItem key={idx} value={idx}>{h || `Column ${idx + 1}`}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
              ))}
            </Stack>

            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Preview (first {Math.min(PREVIEW_ROWS, totalRows)} rows)
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, borderRadius: 2, maxHeight: 240 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {CANONICAL_FIELDS.map((f) => (
                      <TableCell key={f.key} sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'action.hover' }}>
                        {f.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.map((r, i) => (
                    <TableRow key={i}>
                      {CANONICAL_FIELDS.map((f) => {
                        const idx = mapping[f.key];
                        const v = (idx == null || idx === undefined) ? '' : (r[idx] ?? '');
                        return (
                          <TableCell key={f.key} sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {v || <Typography variant="caption" color="text.disabled">—</Typography>}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Uploading and processing {totalRows} rows…</Typography>
                <LinearProgress sx={{ mt: 0.5, borderRadius: 1 }} />
              </Box>
            )}
          </>
        )}

        {step === 2 && result && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <SuccessIcon color="success" sx={{ fontSize: 56, mb: 1 }} />
            <Typography variant="h6" fontWeight={700}>Import completed</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Imported <strong>{result.importedCount ?? 0}</strong> customers
              {typeof result.skippedCount === 'number' && result.skippedCount > 0 && (
                <>. Skipped <strong>{result.skippedCount}</strong> rows.</>
              )}
            </Typography>
            {Array.isArray(result.errors) && result.errors.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'left', maxHeight: 200, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1 }}>
                <Typography variant="caption" color="error" fontWeight={700}>Issues encountered</Typography>
                <List dense>
                  {result.errors.map((err, idx) => (
                    <ListItem key={idx} disableGutters>
                      <ListItemText primary={err} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} color="inherit">
          {step === 2 ? 'Done' : 'Cancel'}
        </Button>
        {step === 1 && (
          <>
            <Button onClick={() => setStep(0)} disabled={uploading}>Back</Button>
            <Button
              variant="contained"
              onClick={doUpload}
              disabled={uploading || missingRequired.length > 0}
              disableElevation
              sx={{ px: 3, fontWeight: 700, textTransform: 'none' }}
            >
              {uploading ? 'Importing…' : `Import ${totalRows} rows`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
