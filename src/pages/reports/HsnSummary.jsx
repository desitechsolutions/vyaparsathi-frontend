import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, TablePagination, Chip, Button, Stack, TextField, MenuItem,
  CircularProgress, Alert, InputAdornment,
} from '@mui/material';
import { ArrowBackIosNew, FileDownload, Refresh, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchHsnPreview } from '../../services/api';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

function fmt(n) {
  if (n == null) return '₹0.00';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function KpiCard({ label, value, primary }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flex: 1, minWidth: 130 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
      <Typography variant="h6" fontWeight={800} color={primary ? 'primary.main' : 'text.primary'} mt={0.5}>{value}</Typography>
    </Paper>
  );
}

export default function HsnSummary() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchHsnPreview(year, month);
      setData(result);
      setPage(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load HSN preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!data?.rows) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter(r =>
      (r.hsnSc || '').toLowerCase().includes(q) ||
      (r.desc  || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleExportCsv = () => {
    if (!data?.rows?.length) return;
    const header = '#,HSN/SAC,Description,UQC,Rate %,Qty,Taxable Value,CGST,SGST,IGST,Cess,Total Value\n';
    const rows = data.rows.map((r, i) => [
      i + 1, r.hsnSc, `"${(r.desc || '').replace(/"/g, '""')}"`,
      r.uqc, r.rt, r.qty,
      r.txval, r.camt, r.samt, r.iamt, r.csamt,
      Number(r.txval) + Number(r.camt) + Number(r.samt) + Number(r.iamt) + Number(r.csamt),
    ].join(',')).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `HSN_Summary_${String(month).padStart(2,'0')}_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button startIcon={<ArrowBackIosNew />} onClick={() => navigate(-1)} sx={{ mb: 2, color: 'text.secondary', fontWeight: 700 }}>
        Back
      </Button>

      {/* Header row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={3} gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="text.primary">HSN Summary — Table 12</Typography>
          <Typography color="text.secondary" mt={0.5}>GSTN HSN/SAC-wise taxable value and tax breakdown for GSTR-1 filing</Typography>
        </Box>
        <Stack direction="row" spacing={1.5} flexShrink={0}>
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
          <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExportCsv} disabled={!data?.rows?.length} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Export CSV
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

      {/* KPI strip */}
      {data && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} flexWrap="wrap" useFlexGap>
          <KpiCard label="Total Taxable"   value={fmt(data.totalTaxable)} primary />
          <KpiCard label="CGST"            value={fmt(data.cgst)} />
          <KpiCard label="SGST"            value={fmt(data.sgst)} />
          <KpiCard label="IGST"            value={fmt(data.igst)} />
          {Number(data.cess) > 0 && <KpiCard label="Cess" value={fmt(data.cess)} />}
        </Stack>
      )}

      {/* Search */}
      <TextField
        size="small" placeholder="Search by HSN/SAC or description…" value={search}
        onChange={e => { setSearch(e.target.value); setPage(0); }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        sx={{ mb: 2, minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'auto' }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  {['#','HSN/SAC','Description','UQC','Rate %','Qty','Taxable Value','CGST','SGST','IGST','Cess','Total Value'].map(h => (
                    <TableCell key={h} align={h === '#' || h === 'HSN/SAC' || h === 'Description' || h === 'UQC' ? 'left' : 'right'}
                      sx={{ fontWeight: 800, color: 'text.secondary', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      {data ? 'No matching HSN/SAC rows found.' : 'No data — adjust the period and click Refresh.'}
                    </TableCell>
                  </TableRow>
                ) : paged.map((row, i) => {
                  const total = Number(row.txval) + Number(row.camt) + Number(row.samt) + Number(row.iamt) + Number(row.csamt);
                  return (
                    <TableRow key={i} hover sx={{ '&:hover': { bgcolor: 'action.hover !important' } }}>
                      <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                      <TableCell><Chip label={row.hsnSc || '—'} size="small" color="primary" variant="outlined" sx={{ fontWeight: 800 }} /></TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.desc || '—'}</TableCell>
                      <TableCell>{row.uqc || '—'}</TableCell>
                      <TableCell align="right">{row.rt}%</TableCell>
                      <TableCell align="right">{Number(row.qty).toFixed(2)}</TableCell>
                      <TableCell align="right">{fmt(row.txval)}</TableCell>
                      <TableCell align="right">{fmt(row.camt)}</TableCell>
                      <TableCell align="right">{fmt(row.samt)}</TableCell>
                      <TableCell align="right">{fmt(row.iamt)}</TableCell>
                      <TableCell align="right">{fmt(row.csamt)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(total)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
            />
          </>
        )}
      </TableContainer>
    </Box>
  );
}
