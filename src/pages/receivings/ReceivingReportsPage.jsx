import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Tabs, Tab, Button, Alert,
  Snackbar, CircularProgress, TextField, IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import {
  fetchReceivingPending,
  fetchReceivingDiscrepancy,
  fetchReceivingAging,
  fetchReceivingAgingTickets,
  fetchReceivingExpiry,
  fetchReceivingSupplierPerformance,
  downloadReceivingCsv,
  downloadReceivingXlsx,
} from '../../services/api';

const formatDate = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
};

const columnMaps = {
  pending: [
    { field: 'poNumber', headerName: 'PO #', flex: 1, minWidth: 140 },
    { field: 'supplier', headerName: 'Supplier', flex: 1.2, minWidth: 160 },
    { field: 'orderDate', headerName: 'Order date', flex: 0.7, minWidth: 120, renderCell: (p) => formatDate(p.value) },
    { field: 'expectedDeliveryDate', headerName: 'Expected', flex: 0.7, minWidth: 120, renderCell: (p) => formatDate(p.value) },
    { field: 'status', headerName: 'Status', flex: 0.7, minWidth: 120 },
    { field: 'orderedQty', headerName: 'Ordered', flex: 0.5, minWidth: 100, type: 'number' },
    { field: 'receivedQty', headerName: 'Received', flex: 0.5, minWidth: 100, type: 'number' },
    { field: 'totalAmount', headerName: 'Value', flex: 0.7, minWidth: 120, align: 'right', headerAlign: 'right' },
  ],
  discrepancy: [
    { field: 'grNumber', headerName: 'GRN #', flex: 1, minWidth: 160 },
    { field: 'poNumber', headerName: 'PO #', flex: 0.9, minWidth: 140 },
    { field: 'supplier', headerName: 'Supplier', flex: 1, minWidth: 160 },
    { field: 'receivedAt', headerName: 'Received', flex: 0.8, minWidth: 130, renderCell: (p) => formatDate(p.value) },
    { field: 'damagedQty', headerName: 'Damaged', flex: 0.5, minWidth: 100, type: 'number' },
    { field: 'rejectedQty', headerName: 'Rejected', flex: 0.5, minWidth: 100, type: 'number' },
    { field: 'status', headerName: 'Status', flex: 0.7, minWidth: 130 },
  ],
  aging: [
    { field: 'grNumber', headerName: 'GRN #', flex: 1, minWidth: 160 },
    { field: 'poNumber', headerName: 'PO #', flex: 0.9, minWidth: 140 },
    { field: 'supplier', headerName: 'Supplier', flex: 1, minWidth: 160 },
    { field: 'receivedAt', headerName: 'Received', flex: 0.8, minWidth: 130, renderCell: (p) => formatDate(p.value) },
    { field: 'ageDays', headerName: 'Age (days)', flex: 0.6, minWidth: 110, type: 'number' },
    { field: 'status', headerName: 'Status', flex: 0.7, minWidth: 130 },
  ],
  agingTickets: [
    { field: 'id', headerName: 'Ticket #', flex: 0.6, minWidth: 100 },
    { field: 'receivingId', headerName: 'GRN', flex: 0.6, minWidth: 100 },
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 160 },
    { field: 'raisedBy', headerName: 'Raised by', flex: 0.8, minWidth: 130 },
    { field: 'raisedAt', headerName: 'Raised', flex: 1, minWidth: 160, renderCell: (p) => formatDate(p.value) },
    { field: 'status', headerName: 'Status', flex: 0.7, minWidth: 130 },
  ],
  expiry: [
    { field: 'grNumber', headerName: 'GRN #', flex: 1, minWidth: 160 },
    { field: 'itemName', headerName: 'Item', flex: 1.2, minWidth: 200 },
    { field: 'batchNumber', headerName: 'Batch', flex: 0.8, minWidth: 120 },
    { field: 'expiryDate', headerName: 'Expiry', flex: 0.8, minWidth: 130, renderCell: (p) => formatDate(p.value) },
    { field: 'daysToExpiry', headerName: 'Days to expiry', flex: 0.7, minWidth: 130, type: 'number' },
    { field: 'acceptedQty', headerName: 'Qty', flex: 0.5, minWidth: 90, type: 'number' },
  ],
  supplier: [
    { field: 'supplierName', headerName: 'Supplier', flex: 1.3, minWidth: 180 },
    { field: 'grnCount', headerName: 'GRNs', flex: 0.5, minWidth: 90, type: 'number' },
    { field: 'onTimeRate', headerName: 'On-time %', flex: 0.6, minWidth: 110, type: 'number',
      valueFormatter: (p) => Number(p.value || 0).toFixed(1) },
    { field: 'damageRate', headerName: 'Damage %', flex: 0.6, minWidth: 110, type: 'number',
      valueFormatter: (p) => Number(p.value || 0).toFixed(1) },
    { field: 'rejectionRate', headerName: 'Rejection %', flex: 0.6, minWidth: 110, type: 'number',
      valueFormatter: (p) => Number(p.value || 0).toFixed(1) },
    { field: 'damagedUnits', headerName: 'Dmg units', flex: 0.5, minWidth: 100, type: 'number' },
    { field: 'rejectedUnits', headerName: 'Rej units', flex: 0.5, minWidth: 100, type: 'number' },
  ],
};

const ReceivingReportsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [expiryWindow, setExpiryWindow] = useState(30);
  const [agingDays, setAgingDays] = useState(7);
  const [agingTicketHours, setAgingTicketHours] = useState(24);
  const [discrepancyFrom, setDiscrepancyFrom] = useState('');
  const [discrepancyTo, setDiscrepancyTo] = useState('');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      switch (tab) {
        case 0: data = await fetchReceivingPending(); break;
        case 1: data = await fetchReceivingDiscrepancy(discrepancyFrom || undefined, discrepancyTo || undefined); break;
        case 2: data = await fetchReceivingAging(agingDays); break;
        case 3: data = await fetchReceivingAgingTickets(agingTicketHours); break;
        case 4: data = await fetchReceivingExpiry(expiryWindow); break;
        case 5: data = await fetchReceivingSupplierPerformance(); break;
        default: data = [];
      }
      setRows((Array.isArray(data) ? data : []).map((row, i) => ({ id: row.id ?? i + 1, ...row })));
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load report', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [tab, expiryWindow, agingDays, agingTicketHours, discrepancyFrom, discrepancyTo]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleExport = async () => {
    try {
      const blob = await downloadReceivingCsv(exportFrom || undefined, exportTo || undefined);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'grn-register.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    }
  };

  const activeColumns = [
    columnMaps.pending, columnMaps.discrepancy, columnMaps.aging,
    columnMaps.agingTickets, columnMaps.expiry, columnMaps.supplier,
  ][tab];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton size="small" onClick={() => navigate('/receivings')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>Receiving reports</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
        </Stack>

        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            variant="scrollable" scrollButtons="auto">
            <Tab label="Pending receivals" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Discrepancy" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Aging GRNs" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Aging tickets" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Expiry watchlist" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Supplier performance" sx={{ textTransform: 'none', fontWeight: 700 }} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }} alignItems="center">
              {tab === 1 && (
                <>
                  <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
                    value={discrepancyFrom} onChange={(e) => setDiscrepancyFrom(e.target.value)} />
                  <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
                    value={discrepancyTo} onChange={(e) => setDiscrepancyTo(e.target.value)} />
                </>
              )}
              {tab === 2 && (
                <TextField size="small" type="number" label="Older than (days)"
                  value={agingDays} onChange={(e) => setAgingDays(Number(e.target.value || 0))} sx={{ width: 180 }} />
              )}
              {tab === 3 && (
                <TextField size="small" type="number" label="Older than (hours)"
                  value={agingTicketHours} onChange={(e) => setAgingTicketHours(Number(e.target.value || 0))} sx={{ width: 200 }} />
              )}
              {tab === 4 && (
                <TextField size="small" type="number" label="Expiring within (days)"
                  value={expiryWindow} onChange={(e) => setExpiryWindow(Number(e.target.value || 0))} sx={{ width: 200 }} />
              )}
              <Box sx={{ flexGrow: 1 }} />
              <TextField size="small" type="date" label="Export from" InputLabelProps={{ shrink: true }}
                value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
              <TextField size="small" type="date" label="Export to" InputLabelProps={{ shrink: true }}
                value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
                CSV
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />}
                onClick={async () => {
                  try {
                    const blob = await downloadReceivingXlsx(exportFrom || undefined, exportTo || undefined);
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'grn-register.xlsx';
                    link.click();
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    setSnackbar({ open: true, message: 'XLSX export failed', severity: 'error' });
                  }
                }}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
                Excel
              </Button>
            </Stack>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                autoHeight rows={rows} columns={activeColumns}
                getRowId={(row) => row.id}
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
                localeText={{ noRowsLabel: 'No rows match the current filters.' }}
              />
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ReceivingReportsPage;
