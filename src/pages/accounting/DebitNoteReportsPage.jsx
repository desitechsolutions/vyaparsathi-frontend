import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Tabs, Tab, IconButton, Alert,
  Snackbar, CircularProgress, Button, Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';

import {
  fetchDebitNoteAging, fetchDebitNoteSupplierSummary,
  downloadDebitNoteCsv, downloadDebitNoteXlsx,
} from '../../services/api';

const formatInr = (v) =>
  Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const formatDate = (v) => v ? new Date(v).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
}) : '—';

const BUCKET_COLOR = {
  '0-30':  'info',
  '31-60': 'warning',
  '61-90': 'warning',
  '90+':   'error',
};

const DebitNoteReportsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = tab === 0 ? await fetchDebitNoteAging() : await fetchDebitNoteSupplierSummary();
      setRows((data || []).map((r, i) => ({ id: r.id ?? r.supplierId ?? i + 1, ...r })));
    } catch { setSnackbar({ open: true, message: 'Failed to load', severity: 'error' }); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleExport = async (kind) => {
    try {
      const blob = kind === 'xlsx' ? await downloadDebitNoteXlsx() : await downloadDebitNoteCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = kind === 'xlsx' ? 'debit-notes.xlsx' : 'debit-notes.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { setSnackbar({ open: true, message: 'Export failed', severity: 'error' }); }
  };

  const columns = tab === 0 ? [
    { field: 'debitNoteNo', headerName: 'DN #', flex: 1, minWidth: 140,
      renderCell: (p) => (
        <Button size="small" variant="text"
          onClick={() => navigate(`/debit-notes/${p.row.id}`)}
          sx={{ textTransform: 'none', fontWeight: 700, fontFamily: 'monospace' }}>
          {p.value}
        </Button>
      ) },
    { field: 'debitNoteDate', headerName: 'Date', flex: 0.8, minWidth: 130,
      renderCell: (p) => formatDate(p.value) },
    { field: 'supplierName', headerName: 'Supplier', flex: 1.2, minWidth: 160 },
    { field: 'ageDays', headerName: 'Age (days)', flex: 0.5, minWidth: 100, type: 'number' },
    { field: 'ageBucket', headerName: 'Bucket', flex: 0.6, minWidth: 110,
      renderCell: (p) => <Chip label={p.value} size="small"
        color={BUCKET_COLOR[p.value] || 'default'}
        sx={{ fontWeight: 700, borderRadius: 1 }} /> },
    { field: 'totalAmount', headerName: 'Total', flex: 0.7, minWidth: 110,
      renderCell: (p) => `₹${formatInr(p.value)}` },
    { field: 'appliedAmount', headerName: 'Applied', flex: 0.7, minWidth: 100,
      renderCell: (p) => `₹${formatInr(p.value)}` },
    { field: 'outstanding', headerName: 'Outstanding', flex: 0.8, minWidth: 130,
      renderCell: (p) => <Typography variant="body2" fontWeight={700} color="warning.main">
        ₹{formatInr(p.value)}
      </Typography> },
    { field: 'status', headerName: 'Status', flex: 0.7, minWidth: 130 },
  ] : [
    { field: 'supplierName', headerName: 'Supplier', flex: 1.5, minWidth: 200 },
    { field: 'dnCount', headerName: 'DNs', flex: 0.4, minWidth: 80, type: 'number' },
    { field: 'issued', headerName: 'Issued', flex: 0.7, minWidth: 130,
      renderCell: (p) => `₹${formatInr(p.value)}` },
    { field: 'applied', headerName: 'Applied', flex: 0.7, minWidth: 130,
      renderCell: (p) => `₹${formatInr(p.value)}` },
    { field: 'outstanding', headerName: 'Outstanding', flex: 0.8, minWidth: 140,
      renderCell: (p) => <Typography variant="body2" fontWeight={700} color="warning.main">
        ₹{formatInr(p.value)}
      </Typography> },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton size="small" onClick={() => navigate('/debit-notes')}><BackIcon /></IconButton>
          <Typography variant="h5" fontWeight={800}>Debit note reports</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('csv')}
            sx={{ textTransform: 'none', fontWeight: 700 }}>CSV</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('xlsx')}
            sx={{ textTransform: 'none', fontWeight: 700 }}>Excel</Button>
        </Stack>

        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tab label="Aging (unapplied balance by age)" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Supplier-wise summary" sx={{ textTransform: 'none', fontWeight: 700 }} />
          </Tabs>
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
              <DataGrid
                autoHeight rows={rows} columns={columns} getRowId={(r) => r.id}
                disableRowSelectionOnClick rowHeight={50}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    fontSize: '0.72rem', letterSpacing: 0.5, color: 'text.secondary', fontWeight: 700,
                    textTransform: 'uppercase',
                  },
                }}
                localeText={{ noRowsLabel: 'No rows.' }}
              />
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DebitNoteReportsPage;
