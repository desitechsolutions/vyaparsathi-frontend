import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Button, Stack, TextField, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { ArrowBackIosNew, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchGstr9 } from '../../services/api';

const YEAR_NOW = new Date().getFullYear();
// Show FY options for years where April has passed (current FY starts April YEAR_NOW)
const FY_OPTIONS = [YEAR_NOW - 1, YEAR_NOW - 2, YEAR_NOW - 3].filter(y => y >= 2020);

function fyLabel(y) { return `${y}–${String(y + 1).slice(2)}`; }

function fmt(n) {
  if (n == null) return '₹0.00';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function KpiCard({ label, value, color }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', flex: 1, minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
      <Typography variant="h6" fontWeight={800} color={color || 'text.primary'} mt={0.5}>{value}</Typography>
    </Paper>
  );
}

function SectionTable({ title, rows, columns }) {
  return (
    <Box mb={4}>
      <Typography variant="subtitle1" fontWeight={800} mb={1}>{title}</Typography>
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              {columns.map(c => (
                <TableCell key={c.key} align={c.align || 'left'} sx={{ fontWeight: 800, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} hover sx={row._highlight ? { bgcolor: 'warning.lighter' } : {}}>
                {columns.map(c => (
                  <TableCell key={c.key} align={c.align || 'left'} sx={c.bold || row._bold ? { fontWeight: 700 } : {}}>
                    {row[c.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function Gstr9Summary() {
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState(FY_OPTIONS[0] ?? YEAR_NOW - 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const result = await fetchGstr9(fiscalYear);
      setData(result);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load GSTR-9 summary.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [fiscalYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const t4Rows = data ? [
    { description: 'Taxable Outward Supplies (4A)', igst: fmt(data.outwardIgst), cgst: fmt(data.outwardCgst), sgst: fmt(data.outwardSgst), taxableValue: fmt(data.table4OutwardTaxable), _bold: false },
    { description: 'Zero-Rated Supplies (4C)',       igst: '—',                   cgst: '—',                   sgst: '—',                   taxableValue: fmt(data.table4ZeroRated),     _bold: false },
    { description: 'Nil-Rated / Exempt (4D)',         igst: '—',                   cgst: '—',                   sgst: '—',                   taxableValue: fmt(data.table4Exempt),        _bold: false },
  ] : [];

  const t6Rows = data ? [
    { description: 'ITC on Inward Supplies (6B)', igst: fmt(data.table6ItcIgst), cgst: fmt(data.table6ItcCgst), sgst: fmt(data.table6ItcSgst) },
  ] : [];

  const t9Rows = data ? [
    { item: 'Tax Payable (declared)',          igst: fmt(data.table9PayableIgst), cgst: fmt(data.table9PayableCgst), sgst: fmt(data.table9PayableSgst) },
    { item: 'Tax Paid (from GSTR-3B offsets)', igst: fmt(data.table9PaidIgst),    cgst: fmt(data.table9PaidCgst),    sgst: fmt(data.table9PaidSgst) },
    {
      item: 'Discrepancy (Payable − Paid)',
      igst: fmt(data.discrepancyIgst), cgst: fmt(data.discrepancyCgst), sgst: fmt(data.discrepancySgst),
      _bold: true,
      _highlight: (Number(data.discrepancyIgst||0) + Number(data.discrepancyCgst||0) + Number(data.discrepancySgst||0)) !== 0,
    },
  ] : [];

  const outwardTaxable = Number(data?.table4OutwardTaxable || 0);
  const itcTotal = Number(data?.table6ItcIgst || 0) + Number(data?.table6ItcCgst || 0) + Number(data?.table6ItcSgst || 0);
  const taxPayableTotal = Number(data?.table9PayableIgst || 0) + Number(data?.table9PayableCgst || 0) + Number(data?.table9PayableSgst || 0);
  const discrepancyTotal = Number(data?.discrepancyIgst || 0) + Number(data?.discrepancyCgst || 0) + Number(data?.discrepancySgst || 0);

  return (
    <Box p={3} maxWidth={1100} mx="auto">
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Button startIcon={<ArrowBackIosNew />} onClick={() => navigate(-1)} size="small" sx={{ textTransform: 'none' }}>Back</Button>
      </Stack>
      <Typography variant="h5" fontWeight={800} mb={0.5}>GSTR-9 Annual Return</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Annual summary aggregated from Sales, Purchases, and GSTR-3B data.
      </Typography>

      {/* Controls */}
      <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField select label="Financial Year" value={fiscalYear} onChange={e => setFiscalYear(Number(e.target.value))} size="small" sx={{ minWidth: 160 }}>
          {FY_OPTIONS.map(y => <MenuItem key={y} value={y}>{fyLabel(y)}</MenuItem>)}
        </TextField>
        <Button startIcon={<Refresh />} variant="outlined" onClick={load} disabled={loading} sx={{ textTransform: 'none' }}>
          Refresh
        </Button>
        {data && <Typography variant="body2" color="text.secondary">{data.tradeName} · GSTIN: {data.gstin}</Typography>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading && (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      )}

      {data && !loading && (
        <>
          {/* KPI row */}
          <Stack direction="row" spacing={2} mb={4} flexWrap="wrap" useFlexGap>
            <KpiCard label="Total Outward Taxable" value={fmt(outwardTaxable)} color="primary.main" />
            <KpiCard label="ITC Availed"            value={fmt(itcTotal)}       color="success.main" />
            <KpiCard label="Tax Payable"             value={fmt(taxPayableTotal)} />
            <KpiCard label="Discrepancy"             value={fmt(discrepancyTotal)} color={discrepancyTotal !== 0 ? 'warning.main' : 'text.primary'} />
          </Stack>

          {/* Table 4 */}
          <SectionTable
            title="Table 4 — Outward Supplies"
            columns={[
              { key: 'description', label: 'Description' },
              { key: 'taxableValue', label: 'Taxable Value', align: 'right' },
              { key: 'igst',         label: 'IGST',          align: 'right' },
              { key: 'cgst',         label: 'CGST',          align: 'right' },
              { key: 'sgst',         label: 'SGST/UTGST',    align: 'right' },
            ]}
            rows={t4Rows}
          />

          {/* Table 6 */}
          <SectionTable
            title="Table 6 — ITC Availed"
            columns={[
              { key: 'description', label: 'Description' },
              { key: 'igst',         label: 'IGST', align: 'right' },
              { key: 'cgst',         label: 'CGST', align: 'right' },
              { key: 'sgst',         label: 'SGST', align: 'right' },
            ]}
            rows={t6Rows}
          />

          {/* Table 9 */}
          <SectionTable
            title="Table 9 — Tax Payable vs. Paid"
            columns={[
              { key: 'item', label: 'Item' },
              { key: 'igst', label: 'IGST', align: 'right' },
              { key: 'cgst', label: 'CGST', align: 'right' },
              { key: 'sgst', label: 'SGST', align: 'right' },
            ]}
            rows={t9Rows}
          />
        </>
      )}
    </Box>
  );
}
