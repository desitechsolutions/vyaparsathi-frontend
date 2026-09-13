/**
 * ReconciliationPage.jsx
 *
 * Finance-user workflow for matching bank statements with recorded payments.
 *
 * Phase 1 — Upload
 *   CSV file input (expected columns: Date, Amount, Description, Bank Ref)
 *   Preview table of parsed rows
 *   "Parse & Continue" button
 *
 * Phase 2 — Matching
 *   ReconciliationMatcher (two-column auto+manual matching)
 *   Live summary: matched / unmatched counts
 *   "Submit Reconciliation" button → POST /api/payments/reconcile
 *   "Export Reconciliation Report" button → GET /api/payments/reconciliation-report
 *
 * Design: MUI v5, useAppPalette, mobile-first, accessible.
 */

import React, {
  useState, useCallback, useRef, useMemo,
} from 'react';
import {
  Box, Container, Typography, Stack, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Alert, Snackbar, Chip, IconButton, Tooltip,
  LinearProgress, alpha, Divider, Card, CardContent,
  useMediaQuery, CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAppPalette } from '../../hooks/useAppPalette';
import ReconciliationMatcher from '../../components/payments/ReconciliationMatcher';
import {
  submitReconciliation,
  fetchReconciliationReport,
} from '../../services/api';

// Icons
import ArrowBackIcon            from '@mui/icons-material/ArrowBack';
import UploadFileIcon           from '@mui/icons-material/UploadFile';
import TableChartIcon           from '@mui/icons-material/TableChart';
import CheckCircleIcon          from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon         from '@mui/icons-material/ErrorOutline';
import DownloadIcon             from '@mui/icons-material/Download';
import AccountBalanceIcon       from '@mui/icons-material/AccountBalance';
import NavigateNextIcon         from '@mui/icons-material/NavigateNext';
import RestartAltIcon           from '@mui/icons-material/RestartAlt';
import InfoOutlinedIcon         from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon          from '@mui/icons-material/HelpOutline';

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASE_UPLOAD  = 'upload';
const PHASE_MATCH   = 'match';
const PHASE_DONE    = 'done';

/** Expected CSV column names (case-insensitive, fuzzy matched). */
const EXPECTED_COLS = ['date', 'amount', 'description', 'bank ref'];

// ── CSV Parsing ───────────────────────────────────────────────────────────────

/**
 * Parse a CSV string into an array of row objects.
 * First row is treated as the header.
 * Handles quoted fields, CRLF and LF line endings.
 */
function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

  // Minimal CSV field splitter (handles double-quoted fields)
  const splitLine = (line) => {
    const fields = [];
    let current  = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim());

  // Map standard field names to column indices
  const colOf = (candidates) => {
    for (const c of candidates) {
      const idx = headers.findIndex((h) => h.includes(c));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx   = colOf(['date']);
  const amountIdx = colOf(['amount', 'debit', 'credit']);
  const descIdx   = colOf(['description', 'narration', 'particulars', 'remarks']);
  const refIdx    = colOf(['ref', 'bank ref', 'reference', 'txn', 'transaction id', 'chq']);

  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error('CSV must contain at minimum "Date" and "Amount" columns.');
  }

  return lines.slice(1).map((line, i) => {
    const fields = splitLine(line);
    const rawAmt = fields[amountIdx] ?? '';
    const amount = parseFloat(rawAmt.replace(/[₹,\s]/g, '')) || 0;
    return {
      id:          `bank-${i + 1}`,
      date:        fields[dateIdx]  ?? '',
      amount,
      description: descIdx !== -1 ? (fields[descIdx] ?? '') : '',
      bankRef:     refIdx  !== -1 ? (fields[refIdx]  ?? '') : '',
    };
  }).filter((r) => r.amount !== 0);
}

/** Format amount with INR symbol. */
const fmt = (n) => '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// ── Sub-components ────────────────────────────────────────────────────────────

/** Step indicator pill. */
const StepPill = ({ label, active, done }) => {
  const palette = useAppPalette();
  return (
    <Chip
      size="small"
      label={label}
      icon={done ? <CheckCircleIcon sx={{ fontSize: '0.85rem !important' }} /> : undefined}
      sx={{
        fontWeight: 800,
        fontSize: '0.78rem',
        bgcolor: done
          ? alpha(palette.success, 0.15)
          : active
            ? alpha(palette.primary, 0.15)
            : alpha(palette.borderColor, 0.5),
        color: done ? palette.success : active ? palette.primary : palette.textDisabled,
        border: `1px solid ${done ? alpha(palette.success, 0.35) : active ? alpha(palette.primary, 0.35) : 'transparent'}`,
        '& .MuiChip-icon': { color: 'inherit' },
      }}
    />
  );
};

/** Summary stat card. */
const StatCard = ({ label, value, color, bg }) => (
  <Card variant="outlined" sx={{ flex: 1, minWidth: 120, border: `1px solid ${alpha(color, 0.3)}`, bgcolor: bg }}>
    <CardContent sx={{ p: '12px 16px !important', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={900} sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color, opacity: 0.75, fontWeight: 600, fontSize: '0.72rem' }}>
        {label}
      </Typography>
    </CardContent>
  </Card>
);

// ── Main Component ────────────────────────────────────────────────────────────

const ReconciliationPage = () => {
  const navigate  = useNavigate();
  const palette   = useAppPalette();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));

  // ── Phase state ───────────────────────────────────────────────────────────
  const [phase, setPhase] = useState(PHASE_UPLOAD);

  // ── Upload phase state ────────────────────────────────────────────────────
  const fileInputRef             = useRef(null);
  const [fileName,  setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [bankRows,  setBankRows]  = useState([]);   // parsed CSV rows
  const [isParsing, setIsParsing] = useState(false);

  // ── Matching phase state ──────────────────────────────────────────────────
  // In production these would come from the API; here we seed with sample data
  // so the matching UI is demonstrable even without a live backend.
  const [recordedPayments] = useState(() => [
    { id: 'rp-1', date: '2024-06-01', amount: 15000,  description: 'Razorpay settlement',    reference: 'RZ-001', customerName: 'Priya Sharma' },
    { id: 'rp-2', date: '2024-06-03', amount: 8500,   description: 'UPI payment',             reference: 'UP-088', customerName: 'Ravi Kumar' },
    { id: 'rp-3', date: '2024-06-05', amount: 32000,  description: 'NEFT transfer',           reference: 'NF-221', customerName: 'Anita Patel' },
    { id: 'rp-4', date: '2024-06-07', amount: 5000,   description: 'Cash deposit',            reference: 'CD-007', customerName: 'Suresh Nair' },
    { id: 'rp-5', date: '2024-06-10', amount: 12750,  description: 'Cheque clearance',        reference: 'CQ-034', customerName: 'Meena Verma' },
  ]);

  // Tracks matches from ReconciliationMatcher (bankId → paymentId)
  const matchesRef = useRef(new Map());

  // ── Submission state ──────────────────────────────────────────────────────
  const [submitting,      setSubmitting]      = useState(false);
  const [exportLoading,   setExportLoading]   = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [snackbar,        setSnackbar]        = useState({ open: false, message: '', severity: 'success' });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showSnack = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // ── File upload ───────────────────────────────────────────────────────────

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError('');
    setBankRows([]);
    // Auto-parse on select
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCsv(ev.target.result);
        setBankRows(rows);
        setParseError('');
      } catch (err) {
        setParseError(err.message || 'Failed to parse CSV.');
        setBankRows([]);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setParseError('Could not read file.');
      setIsParsing(false);
    };
    reader.readAsText(file);
    // Reset so re-selecting same file triggers onChange again
    e.target.value = '';
  }, []);

  const handleDropZone = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      // Simulate input onChange via a synthetic event shape
      handleFileChange({ target: { files: [file] }, preventDefault: () => {} });
    }
  }, [handleFileChange]);

  const handleParseProceed = useCallback(() => {
    if (bankRows.length === 0) { showSnack('No valid rows found in CSV.', 'warning'); return; }
    setPhase(PHASE_MATCH);
  }, [bankRows, showSnack]);

  // ── Matching callbacks ────────────────────────────────────────────────────

  const handleMatch = useCallback((bankId, paymentId) => {
    matchesRef.current.set(bankId, paymentId);
  }, []);

  const handleUnmatch = useCallback((bankId) => {
    matchesRef.current.delete(bankId);
  }, []);

  // ── Submission ────────────────────────────────────────────────────────────

  const handleSubmitReconciliation = useCallback(async () => {
    const matchedPairs = [...matchesRef.current.entries()].map(([bankId, paymentId]) => ({
      bankTransactionId: bankId,
      paymentId,
    }));
    if (matchedPairs.length === 0) {
      showSnack('No matches to submit.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        bankTransactions: bankRows,
        matches: matchedPairs,
      };
      const res = await submitReconciliation(payload);
      setReconcileResult(res?.data ?? { matchedCount: matchedPairs.length });
      setPhase(PHASE_DONE);
      showSnack(`Reconciliation submitted — ${matchedPairs.length} match(es) recorded.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      showSnack(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [bankRows, showSnack]);

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExportReport = useCallback(async () => {
    setExportLoading(true);
    try {
      const today      = new Date().toISOString().slice(0, 10);
      const monthAgo   = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
      const res        = await fetchReconciliationReport(monthAgo, today);
      const data       = res?.data;

      // Attempt to trigger a download if the backend returns CSV/blob data
      if (data && typeof data === 'string') {
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `reconciliation-report-${today}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // JSON response — convert to a simple summary CSV
        const lines = [
          'Bank Txn ID,Payment ID,Amount,Date,Status',
          ...(data?.matches ?? []).map((m) =>
            `${m.bankTransactionId},${m.paymentId},${m.amount},${m.date},${m.status}`
          ),
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `reconciliation-report-${today}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      showSnack('Report downloaded.');
    } catch (err) {
      showSnack(err.response?.data?.message || 'Export failed. Please try again.', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [showSnack]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const matchedCount   = matchesRef.current.size;
  const unmatchedBank  = bankRows.length - matchedCount;
  const matchedPayIds  = useMemo(() => new Set([...matchesRef.current.values()]), []);
  const unmatchedPay   = recordedPayments.filter((p) => !matchedPayIds.has(p.id)).length;

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderUploadPhase = () => (
    <Box>
      {/* Drop zone */}
      <Box
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropZone}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Click or drag and drop to upload CSV bank statement"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        sx={{
          border: `2px dashed ${fileName ? palette.primary : palette.borderColor}`,
          borderRadius: 3,
          p: { xs: 4, sm: 6 },
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          bgcolor: fileName ? alpha(palette.primary, 0.04) : 'transparent',
          '&:hover': { borderColor: palette.primary, bgcolor: alpha(palette.primary, 0.04) },
          '&:focus-visible': { outline: `2px solid ${palette.primary}`, outlineOffset: 2 },
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
        <UploadFileIcon sx={{ fontSize: 48, color: fileName ? palette.primary : palette.textDisabled, mb: 1.5 }} />
        <Typography variant="h6" fontWeight={800} sx={{ color: palette.textPrimary }}>
          {fileName || 'Upload Bank Statement CSV'}
        </Typography>
        <Typography variant="body2" sx={{ color: palette.textSecondary, mt: 0.5 }}>
          {fileName ? 'Click to replace file' : 'Drag & drop or click to browse — .csv files only'}
        </Typography>
      </Box>

      {/* Expected columns info */}
      <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(palette.info, 0.07), border: `1px solid ${alpha(palette.info, 0.2)}` }}>
        <HelpOutlineIcon sx={{ color: palette.info, fontSize: 18, flexShrink: 0, mt: 0.15 }} />
        <Box>
          <Typography variant="body2" fontWeight={700} sx={{ color: palette.textPrimary, mb: 0.4 }}>
            Expected CSV columns
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {EXPECTED_COLS.map((col) => (
              <Chip key={col} label={col} size="small"
                sx={{ fontSize: '0.72rem', fontWeight: 700, bgcolor: alpha(palette.info, 0.12), color: palette.info, border: `1px solid ${alpha(palette.info, 0.25)}` }}
              />
            ))}
          </Stack>
          <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', mt: 0.75 }}>
            Column names are matched case-insensitively. Additional columns are ignored.
          </Typography>
        </Box>
      </Stack>

      {/* Parse error */}
      {parseError && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} icon={<ErrorOutlineIcon />}>
          {parseError}
        </Alert>
      )}

      {/* Loading indicator */}
      {isParsing && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}

      {/* Preview table */}
      {bankRows.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TableChartIcon sx={{ color: palette.primary, fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: palette.textPrimary }}>
                Preview — {bankRows.length} rows parsed
              </Typography>
            </Stack>
            <Chip
              size="small"
              label={`${bankRows.length} transactions`}
              sx={{ bgcolor: alpha(palette.primary, 0.1), color: palette.primary, fontWeight: 700, fontSize: '0.72rem' }}
            />
          </Stack>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2, maxHeight: 300, overflow: 'auto' }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['#', 'Date', 'Amount', 'Description', 'Bank Ref'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        bgcolor: alpha(palette.primary, 0.07),
                        color: palette.textPrimary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {bankRows.slice(0, 50).map((row, idx) => (
                  <TableRow
                    key={row.id}
                    sx={{ '&:nth-of-type(even)': { bgcolor: alpha(palette.primary, 0.025) } }}
                  >
                    <TableCell sx={{ color: palette.textSecondary, fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{row.date}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(row.amount)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200 }}>
                      <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem' }}>
                        {row.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: palette.textSecondary }}>{row.bankRef || '—'}</TableCell>
                  </TableRow>
                ))}
                {bankRows.length > 50 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', color: palette.textSecondary, fontSize: '0.78rem', fontStyle: 'italic' }}>
                      … and {bankRows.length - 50} more rows (showing first 50)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="contained"
            size="large"
            endIcon={<NavigateNextIcon />}
            onClick={handleParseProceed}
            sx={{
              mt: 2.5,
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2.5,
              minHeight: 48,
              px: 4,
              boxShadow: `0 4px 16px ${alpha(palette.primary, 0.35)}`,
              '&:hover': { boxShadow: `0 6px 20px ${alpha(palette.primary, 0.45)}` },
            }}
          >
            Proceed to Matching
          </Button>
        </Box>
      )}
    </Box>
  );

  const renderMatchPhase = () => (
    <Box>
      {/* Summary chips */}
      <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 3 }}>
        <StatCard
          label="Bank Transactions"
          value={bankRows.length}
          color={palette.primary}
          bg={alpha(palette.primary, 0.06)}
        />
        <StatCard
          label="Recorded Payments"
          value={recordedPayments.length}
          color={palette.teal}
          bg={alpha(palette.teal, 0.06)}
        />
        <StatCard
          label="Auto-Matched"
          value={matchesRef.current.size}
          color={palette.success}
          bg={alpha(palette.success, 0.06)}
        />
        <StatCard
          label="Unmatched Bank"
          value={bankRows.length - matchesRef.current.size}
          color={palette.warning}
          bg={alpha(palette.warning, 0.06)}
        />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Matcher */}
      <ReconciliationMatcher
        bankTransactions={bankRows}
        recordedPayments={recordedPayments}
        onMatch={handleMatch}
        onUnmatch={handleUnmatch}
      />

      <Divider sx={{ my: 3 }} />

      {/* Action row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmitReconciliation}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
          sx={{
            fontWeight: 800,
            textTransform: 'none',
            borderRadius: 2.5,
            minHeight: 48,
            px: 4,
            boxShadow: `0 4px 16px ${alpha(palette.primary, 0.35)}`,
            '&:hover': { boxShadow: `0 6px 20px ${alpha(palette.primary, 0.45)}` },
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Reconciliation'}
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={handleExportReport}
          disabled={exportLoading}
          startIcon={exportLoading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
          sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2.5, minHeight: 48, px: 3 }}
        >
          {exportLoading ? 'Exporting…' : 'Export Reconciliation Report'}
        </Button>

        <Button
          variant="text"
          size="large"
          onClick={() => { setPhase(PHASE_UPLOAD); setBankRows([]); setFileName(''); matchesRef.current.clear(); }}
          startIcon={<RestartAltIcon />}
          sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2.5, minHeight: 48, color: palette.textSecondary }}
        >
          Start Over
        </Button>
      </Stack>
    </Box>
  );

  const renderDonePhase = () => (
    <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
      <CheckCircleIcon sx={{ fontSize: 72, color: palette.success, mb: 2 }} />
      <Typography variant="h5" fontWeight={900} sx={{ color: palette.textPrimary, mb: 1 }}>
        Reconciliation Complete
      </Typography>
      <Typography variant="body1" sx={{ color: palette.textSecondary, mb: 4 }}>
        Your matches have been recorded successfully.
      </Typography>

      {/* Result stats */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 4 }}>
        <StatCard label="Matched" value={reconcileResult?.matchedCount ?? matchesRef.current.size} color={palette.success} bg={alpha(palette.success, 0.07)} />
        <StatCard label="Unmatched Bank" value={unmatchedBank} color={palette.warning} bg={alpha(palette.warning, 0.07)} />
        <StatCard label="Unmatched Payments" value={unmatchedPay} color={palette.info} bg={alpha(palette.info, 0.07)} />
      </Stack>

      {unmatchedBank > 0 && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2, textAlign: 'left', mx: 'auto', maxWidth: 520 }}>
          <strong>{unmatchedBank}</strong> bank transaction(s) could not be matched — these may be bank charges, deposits, or errors.
        </Alert>
      )}

      {unmatchedPay > 0 && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, textAlign: 'left', mx: 'auto', maxWidth: 520 }}>
          <strong>{unmatchedPay}</strong> recorded payment(s) have no matching bank entry — these may be pending clearance or require investigation.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
        <Button
          variant="contained"
          size="large"
          startIcon={exportLoading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
          onClick={handleExportReport}
          disabled={exportLoading}
          sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2.5, minHeight: 48, px: 4, boxShadow: `0 4px 16px ${alpha(palette.primary, 0.35)}` }}
        >
          {exportLoading ? 'Exporting…' : 'Export Reconciliation Report'}
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<RestartAltIcon />}
          onClick={() => { setPhase(PHASE_UPLOAD); setBankRows([]); setFileName(''); matchesRef.current.clear(); setReconcileResult(null); }}
          sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2.5, minHeight: 48 }}
        >
          New Reconciliation
        </Button>
        <Button
          variant="text"
          size="large"
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
          sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2.5, minHeight: 48, color: palette.textSecondary }}
        >
          Back
        </Button>
      </Stack>
    </Box>
  );

  // ── Full render ───────────────────────────────────────────────────────────

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          background: palette.headerGradient,
          color: '#fff',
          boxShadow: `0 4px 24px ${alpha(palette.primary, 0.25)}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: { xs: 2, md: 2.5 } }}
            spacing={1}
          >
            {/* Back */}
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              aria-label="Go back"
              sx={{
                color: '#fff',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.9rem',
                minHeight: 44,
                borderRadius: 2,
                px: 1.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', transform: 'translateX(-2px)' },
                transition: 'all 0.2s ease',
              }}
            >
              {isMobile ? '' : 'Back'}
            </Button>

            {/* Title */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, justifyContent: { xs: 'flex-start', sm: 'center' }, pl: { xs: 0.5, sm: 0 } }}>
              <Box sx={{ p: 0.875, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <AccountBalanceIcon sx={{ fontSize: 22, color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: '#fff', lineHeight: 1.1, fontSize: { xs: '1rem', sm: '1.15rem' }, letterSpacing: '-0.3px' }}>
                  Bank Reconciliation
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem' }}>
                  Match bank statements with recorded payments
                </Typography>
              </Box>
            </Stack>

            {/* Phase indicators */}
            <Stack direction="row" spacing={0.75} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <StepPill label="1. Upload"  active={phase === PHASE_UPLOAD} done={phase !== PHASE_UPLOAD} />
              <StepPill label="2. Match"   active={phase === PHASE_MATCH}  done={phase === PHASE_DONE} />
              <StepPill label="3. Done"    active={phase === PHASE_DONE}   done={false} />
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ── PAGE BODY ────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}>

        {/* Mobile phase indicator */}
        <Stack direction="row" spacing={1} sx={{ mb: 2.5, display: { xs: 'flex', sm: 'none' } }}>
          <StepPill label="1. Upload"  active={phase === PHASE_UPLOAD} done={phase !== PHASE_UPLOAD} />
          <StepPill label="2. Match"   active={phase === PHASE_MATCH}  done={phase === PHASE_DONE} />
          <StepPill label="3. Done"    active={phase === PHASE_DONE}   done={false} />
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            p: { xs: 2.5, sm: 3.5 },
            border: `1px solid ${palette.borderColor}`,
          }}
        >
          {phase === PHASE_UPLOAD && renderUploadPhase()}
          {phase === PHASE_MATCH  && renderMatchPhase()}
          {phase === PHASE_DONE   && renderDonePhase()}
        </Paper>
      </Container>

      {/* ── TOAST ────────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          sx={{
            borderRadius: 2.5,
            fontSize: '0.9rem',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            '& .MuiAlert-icon': { fontSize: '1.3rem', alignSelf: 'center' },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReconciliationPage;
