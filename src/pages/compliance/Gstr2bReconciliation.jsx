import React, { useState, useRef } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Button, CircularProgress,
  Alert, Chip, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Tabs, Tab,
} from '@mui/material';
import { CloudUpload, ArrowBackIosNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { uploadGstr2bJson, getGstr2bReconciliation, acceptMismatchGstr2b } from '../../services/api';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const YEAR_NOW = new Date().getFullYear();
const YEARS = [YEAR_NOW, YEAR_NOW - 1, YEAR_NOW - 2];

const STATUS_CHIP = {
  EXACT_MATCH:       { label: 'Exact Match',        color: 'success' },
  PROBABLE_MATCH:    { label: 'Probable Match',      color: 'info' },
  MISMATCH:          { label: 'Mismatch',            color: 'warning' },
  MISSING_IN_BOOKS:  { label: 'Missing in Books',   color: 'error' },
  MISSING_IN_PORTAL: { label: 'Missing in Portal',  color: 'default' },
  MANUAL_MATCH:      { label: 'Manual Match',        color: 'secondary' },
};

function fmt(n) {
  if (n == null) return '₹0.00';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function KpiCard({ label, count, color }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', flex: 1, minWidth: 150 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
      <Typography variant="h5" fontWeight={800} color={color + '.main'} mt={0.5}>{count}</Typography>
    </Paper>
  );
}

const TAB_FILTERS = [null, 'EXACT_MATCH', 'PROBABLE_MATCH', 'MISMATCH', 'MISSING_IN_BOOKS', 'MISSING_IN_PORTAL'];
const TAB_LABELS  = ['All', 'Matched', 'Probable', 'Mismatches', 'Missing in Books', 'Missing in Portal'];

export default function Gstr2bReconciliation() {
  const navigate = useNavigate();
  const fileRef = useRef();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year,  setYear]  = useState(YEAR_NOW);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [data,    setData]    = useState(null);
  const [tab,     setTab]     = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const result = await getGstr2bReconciliation(year, month);
      setData(result);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load reconciliation.');
    } finally { setLoading(false); }
  };

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.json')) { setError('Please upload a .json file.'); return; }
    setLoading(true); setError('');
    try {
      const result = await uploadGstr2bJson(file, year, month);
      setData(result);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Upload failed.');
    } finally { setLoading(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleAcceptMismatch = async (entryId) => {
    try {
      const updated = await acceptMismatchGstr2b(entryId);
      setData(prev => ({ ...prev, entries: prev.entries.map(e => e.id === updated.id ? { ...e, matchStatus: 'MANUAL_MATCH' } : e) }));
    } catch (e) { setError(e.message || 'Action failed.'); }
  };

  const entries = data?.entries ?? [];
  const filtered = TAB_FILTERS[tab] ? entries.filter(e => e.matchStatus === TAB_FILTERS[tab]) : entries;

  return (
    <Box p={3} maxWidth={1300} mx="auto">
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Button startIcon={<ArrowBackIosNew />} onClick={() => navigate(-1)} size="small" sx={{ textTransform: 'none' }}>Back</Button>
      </Stack>
      <Typography variant="h5" fontWeight={800} mb={0.5}>GSTR-2B Reconciliation</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Match portal ITC data against internal purchase invoices.
      </Typography>

      {/* Period selector */}
      <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField select label="Month" value={month} onChange={e => setMonth(Number(e.target.value))} size="small" sx={{ minWidth: 140 }}>
          {MONTHS.map((m, i) => <MenuItem key={i+1} value={i+1}>{m}</MenuItem>)}
        </TextField>
        <TextField select label="Year" value={year} onChange={e => setYear(Number(e.target.value))} size="small" sx={{ minWidth: 110 }}>
          {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={load} disabled={loading} sx={{ textTransform: 'none' }}>Load Existing</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Upload area (shown when no data) */}
      {!data && !loading && (
        <Paper
          elevation={0}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed', borderColor: dragOver ? 'primary.main' : 'divider',
            borderRadius: 3, p: 5, textAlign: 'center', cursor: 'pointer',
            bgcolor: dragOver ? 'action.selected' : 'background.paper',
            transition: 'all .2s',
          }}
          onClick={() => fileRef.current?.click()}
        >
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={700}>Drop GSTN GSTR-2B JSON here</Typography>
          <Typography variant="body2" color="text.secondary">or click to browse — .json files only</Typography>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={e => handleFile(e.target.files?.[0])} />
        </Paper>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* KPI row */}
          <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
            <KpiCard label="Matched"           count={data.matchedCount}          color="success" />
            <KpiCard label="Mismatches"         count={data.mismatchedCount}       color="warning" />
            <KpiCard label="Missing in Books"   count={data.missingInBooksCount}   color="error" />
            <KpiCard label="Missing in Portal"  count={data.missingInPortalCount}  color="text" />
          </Stack>

          <Stack direction="row" spacing={2} mb={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {data.fileName} • {data.returnPeriod} • {data.totalInvoices} portal invoices
            </Typography>
            <Button size="small" variant="outlined" sx={{ textTransform: 'none', ml: 'auto' }}
              onClick={() => fileRef.current?.click()}>
              Re-upload
            </Button>
            <input ref={fileRef} type="file" accept=".json" hidden onChange={e => handleFile(e.target.files?.[0])} />
          </Stack>

          {/* Tabs */}
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
            {TAB_LABELS.map((l, i) => <Tab key={i} label={l} sx={{ textTransform: 'none', fontWeight: 700 }} />)}
          </Tabs>

          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  {['Supplier GSTIN', 'Supplier Name', 'Invoice No', 'Date', 'Portal Tax', 'Status', 'Action'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 800, color: 'text.secondary', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No entries in this category.</TableCell></TableRow>
                )}
                {filtered.map((e, i) => {
                  const chip = STATUS_CHIP[e.matchStatus] || { label: e.matchStatus, color: 'default' };
                  const portalTax = (Number(e.portalIgst||0) + Number(e.portalCgst||0) + Number(e.portalSgst||0));
                  return (
                    <TableRow key={e.id ?? i} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{e.supplierGstin}</TableCell>
                      <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.supplierName}</TableCell>
                      <TableCell>{e.invoiceNumber}</TableCell>
                      <TableCell>{e.invoiceDate}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(portalTax)}</TableCell>
                      <TableCell>
                        <Chip label={chip.label} color={chip.color} size="small" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        {e.matchStatus === 'MISMATCH' && (
                          <Button size="small" variant="text" color="warning" sx={{ textTransform: 'none', fontSize: 11 }}
                            onClick={() => handleAcceptMismatch(e.id)}>Accept</Button>
                        )}
                        {e.matchStatus === 'MISSING_IN_BOOKS' && (
                          <Button size="small" variant="text" color="primary" sx={{ textTransform: 'none', fontSize: 11 }}
                            onClick={() => navigate('/dashboard/purchases/new')}>Create PI</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
