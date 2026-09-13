import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Button, Stack, TextField, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { ArrowBackIosNew, FileDownload, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchGstr3b, downloadGstr3bJson } from '../../services/api';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function fmt(n) {
  if (n == null) return '₹0.00';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function KpiCard({ label, value, primary }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flex: 1, minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
      <Typography variant="h6" fontWeight={800} color={primary ? 'primary.main' : 'text.primary'} mt={0.5}>{value}</Typography>
    </Paper>
  );
}

function SectionTable({ title, rows, columns }) {
  return (
    <Box mb={4}>
      <Typography variant="subtitle1" fontWeight={800} mb={1}>{title}</Typography>
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
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
              <TableRow key={i} hover>
                {columns.map(c => (
                  <TableCell key={c.key} align={c.align || 'left'} sx={c.bold ? { fontWeight: 700 } : {}}>
                    {row[c.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={columns.length} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function Gstr3bSummary() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchGstr3b(year, month);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load GSTR-3B summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const payload = await downloadGstr3bJson(year, month);
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `GSTR3B_${String(month).padStart(2,'0')}_${year}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download GSTR-3B JSON');
    } finally {
      setDownloading(false);
    }
  };

  // Section 3.1 rows
  const section31Rows = data ? [
    { desc: '(a) Outward taxable supplies (other than zero rated, nil rated, exempt)',
      txval: fmt(data.outwardTaxableSupplies?.taxableValue),
      igst:  fmt(data.outwardTaxableSupplies?.igst),
      cgst:  fmt(data.outwardTaxableSupplies?.cgst),
      sgst:  fmt(data.outwardTaxableSupplies?.sgst),
      cess:  fmt(data.outwardTaxableSupplies?.cess) },
    { desc: '(b) Outward taxable supplies (zero rated)',
      txval: fmt(data.zeroRatedExportSupplies?.taxableValue),
      igst:  fmt(data.zeroRatedExportSupplies?.igst),
      cgst:  fmt(data.zeroRatedExportSupplies?.cgst),
      sgst:  fmt(data.zeroRatedExportSupplies?.sgst),
      cess:  fmt(data.zeroRatedExportSupplies?.cess) },
    { desc: '(c) Other outward supplies (nil rated, exempt)',
      txval: fmt(data.nilRatedExemptSupplies?.taxableValue),
      igst:  '—', cgst: '—', sgst: '—', cess: '—' },
    { desc: '(d) Inward supplies (liable to reverse charge)',
      txval: fmt(data.inwardReverseChargeSupplies?.taxableValue),
      igst:  fmt(data.inwardReverseChargeSupplies?.igst),
      cgst:  fmt(data.inwardReverseChargeSupplies?.cgst),
      sgst:  fmt(data.inwardReverseChargeSupplies?.sgst),
      cess:  fmt(data.inwardReverseChargeSupplies?.cess) },
    { desc: '(e) Non-GST outward supplies',
      txval: fmt(data.nonGstSupplies?.taxableValue),
      igst:  '—', cgst: '—', sgst: '—', cess: '—' },
  ] : [];

  const section31Cols = [
    { key: 'desc',  label: 'Nature of Supplies', align: 'left' },
    { key: 'txval', label: 'Taxable Value', align: 'right' },
    { key: 'igst',  label: 'IGST', align: 'right' },
    { key: 'cgst',  label: 'CGST', align: 'right' },
    { key: 'sgst',  label: 'SGST/UTGST', align: 'right' },
    { key: 'cess',  label: 'Cess', align: 'right' },
  ];

  // Table 3.2 rows
  const table32Rows = data?.interStateUnregistered?.map(e => ({
    pos:   e.pos,
    txval: fmt(e.taxableValue),
    igst:  fmt(e.igst),
  })) ?? [];

  const table32Cols = [
    { key: 'pos',   label: 'State/UT (POS code)', align: 'left' },
    { key: 'txval', label: 'Taxable Value', align: 'right' },
    { key: 'igst',  label: 'IGST', align: 'right' },
  ];

  // Section 4 ITC rows
  const itcAvlRows = data ? [
    { ty: 'ISRC — Inward RCM (Section 17)', igst: fmt(data.itcRcm?.igst), cgst: fmt(data.itcRcm?.cgst), sgst: fmt(data.itcRcm?.sgst), cess: fmt(data.itcRcm?.cess) },
    { ty: 'OTH — Other eligible ITC',        igst: fmt(data.itcOther?.igst), cgst: fmt(data.itcOther?.cgst), sgst: fmt(data.itcOther?.sgst), cess: fmt(data.itcOther?.cess) },
    { ty: '(C) Net ITC [4A − 4B]',            igst: fmt(data.itcNet?.igst), cgst: fmt(data.itcNet?.cgst), sgst: fmt(data.itcNet?.sgst), cess: fmt(data.itcNet?.cess), bold: true },
    { ty: '(D) Ineligible ITC',               igst: fmt(data.itcIneligible?.igst), cgst: fmt(data.itcIneligible?.cgst), sgst: fmt(data.itcIneligible?.sgst), cess: fmt(data.itcIneligible?.cess) },
  ] : [];

  const itcCols = [
    { key: 'ty',   label: 'ITC Category', align: 'left' },
    { key: 'igst', label: 'IGST', align: 'right' },
    { key: 'cgst', label: 'CGST', align: 'right' },
    { key: 'sgst', label: 'SGST/UTGST', align: 'right' },
    { key: 'cess', label: 'Cess', align: 'right' },
  ];

  // Section 6 offset rows
  const offsetRows = data ? [
    { head: 'Paid through ITC', igst: fmt(data.itcOffset?.paidThroughItc?.igst), cgst: fmt(data.itcOffset?.paidThroughItc?.cgst), sgst: fmt(data.itcOffset?.paidThroughItc?.sgst), cess: fmt(data.itcOffset?.paidThroughItc?.cess) },
    { head: 'Paid in Cash (PMT-06)', igst: fmt(data.itcOffset?.paidInCash?.igst), cgst: fmt(data.itcOffset?.paidInCash?.cgst), sgst: fmt(data.itcOffset?.paidInCash?.sgst), cess: fmt(data.itcOffset?.paidInCash?.cess), bold: true },
    { head: 'Closing ITC Balance (c/f)', igst: fmt(data.itcOffset?.closingItcBalance?.igst), cgst: fmt(data.itcOffset?.closingItcBalance?.cgst), sgst: fmt(data.itcOffset?.closingItcBalance?.sgst), cess: fmt(data.itcOffset?.closingItcBalance?.cess) },
  ] : [];

  const offsetCols = [
    { key: 'head', label: 'Description', align: 'left' },
    { key: 'igst', label: 'IGST', align: 'right' },
    { key: 'cgst', label: 'CGST', align: 'right' },
    { key: 'sgst', label: 'SGST/UTGST', align: 'right' },
    { key: 'cess', label: 'Cess', align: 'right' },
  ];

  const outLiability = data ? (
    (data.outwardTaxableSupplies?.igst  || 0) +
    (data.outwardTaxableSupplies?.cgst  || 0) +
    (data.outwardTaxableSupplies?.sgst  || 0)
  ) : 0;
  const netItc = data ? (
    (data.itcAvailable?.igst || 0) +
    (data.itcAvailable?.cgst || 0) +
    (data.itcAvailable?.sgst || 0)
  ) : 0;
  const cashPayable = data ? (
    (data.netTaxLiability?.igstPayable  || 0) +
    (data.netTaxLiability?.cgstPayable  || 0) +
    (data.netTaxLiability?.sgstPayable  || 0)
  ) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button startIcon={<ArrowBackIosNew />} onClick={() => navigate(-1)} sx={{ mb: 2, color: 'text.secondary', fontWeight: 700 }}>
        Back
      </Button>

      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={3} gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="text.primary">GSTR-3B Summary</Typography>
          <Typography color="text.secondary" mt={0.5}>Section 3.1 liability, ITC sub-categories, Table 3.2, and Rule 88A/88B offset</Typography>
        </Box>
        <Stack direction="row" spacing={1.5} flexShrink={0} flexWrap="wrap">
          <TextField
            select size="small" label="Month" value={month}
            onChange={e => setMonth(Number(e.target.value))}
            sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            {MONTHS.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
          </TextField>
          <TextField
            select size="small" label="Year" value={year}
            onChange={e => setYear(Number(e.target.value))}
            sx={{ minWidth: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            {[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </TextField>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load} disabled={loading} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Refresh
          </Button>
          <Button
            variant="contained" startIcon={<FileDownload />}
            onClick={handleDownload} disabled={downloading || !data}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {downloading ? 'Downloading…' : 'Download GSTR-3B JSON'}
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && data && (
        <>
          {/* KPI strip */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4} flexWrap="wrap" useFlexGap>
            <KpiCard label="Total Outward Liability"   value={fmt(outLiability)} primary />
            <KpiCard label="Net ITC Available"          value={fmt(netItc)} />
            <KpiCard label="Net Cash Payable (PMT-06)" value={fmt(cashPayable)} />
          </Stack>

          {/* Section 3.1 */}
          <SectionTable
            title="Section 3.1 — Outward and Inward Supplies"
            rows={section31Rows}
            columns={section31Cols}
          />

          {/* Table 3.2 */}
          {table32Rows.length > 0 && (
            <SectionTable
              title="Table 3.2 — Inter-State Supplies to Unregistered Persons (by POS)"
              rows={table32Rows}
              columns={table32Cols}
            />
          )}

          {/* Section 4 ITC */}
          <SectionTable
            title="Section 4 — Input Tax Credit (ITC)"
            rows={itcAvlRows}
            columns={itcCols}
          />

          {/* Section 6 Offset */}
          <SectionTable
            title="Section 6 — ITC Utilisation (Rule 88A/88B)"
            rows={offsetRows}
            columns={offsetCols}
          />
        </>
      )}

      {!loading && !data && !error && (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          Select a period and click Refresh to load GSTR-3B data.
        </Typography>
      )}
    </Box>
  );
}
