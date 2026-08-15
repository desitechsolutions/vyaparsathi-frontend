import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Tabs, Tab, Button, Alert,
  Snackbar, CircularProgress, TextField, IconButton, Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import {
  fetchPoAging,
  fetchPoSupplierSpend,
  fetchPoFulfillment,
  fetchPoBudgetVsActual,
  fetchPoSuggestFromLowStock,
  downloadPoCsv,
} from '../../services/api';

const formatInr = (v) =>
  Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const formatDate = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
};

const columnMaps = {
  aging: [
    { field: 'poNumber', headerName: 'PO #', flex: 1, minWidth: 140 },
    { field: 'supplier', headerName: 'Supplier', flex: 1.2, minWidth: 160 },
    { field: 'status', headerName: 'Status', flex: 0.9, minWidth: 130 },
    { field: 'stuckSince', headerName: 'Stuck since', flex: 0.9, minWidth: 140, renderCell: (p) => formatDate(p.value) },
    { field: 'ageDays', headerName: 'Age (days)', flex: 0.6, minWidth: 100, type: 'number' },
    { field: 'totalAmount', headerName: 'Value', flex: 0.7, minWidth: 110, valueFormatter: (p) => `₹${formatInr(p.value)}` },
  ],
  spend: [
    { field: 'supplierName', headerName: 'Supplier', flex: 1.5, minWidth: 200 },
    { field: 'poCount', headerName: 'POs', flex: 0.4, minWidth: 80, type: 'number' },
    { field: 'totalAmount', headerName: 'Spend', flex: 0.7, minWidth: 130, valueFormatter: (p) => `₹${formatInr(p.value)}` },
  ],
  fulfillment: [
    { field: 'poNumber', headerName: 'PO #', flex: 1, minWidth: 140 },
    { field: 'supplier', headerName: 'Supplier', flex: 1.2, minWidth: 160 },
    { field: 'status', headerName: 'Status', flex: 0.8, minWidth: 120 },
    { field: 'orderedQty', headerName: 'Ordered', flex: 0.5, minWidth: 100, type: 'number' },
    { field: 'receivedQty', headerName: 'Received', flex: 0.5, minWidth: 100, type: 'number' },
    { field: 'fulfillmentPct', headerName: 'Fulfilled %', flex: 0.6, minWidth: 110, type: 'number',
      valueFormatter: (p) => `${Number(p.value || 0).toFixed(1)}%` },
  ],
  suggest: [
    { field: 'supplierName', headerName: 'Supplier', flex: 1.4, minWidth: 180 },
    { field: 'lineCount', headerName: 'Items', flex: 0.4, minWidth: 80, type: 'number' },
    { field: 'estimatedValue', headerName: 'Est. value', flex: 0.7, minWidth: 130,
      valueFormatter: (p) => `₹${formatInr(p.value)}` },
    {
      field: 'actions', headerName: '', flex: 0.6, minWidth: 130,
      sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (params) => (
        <Button size="small" variant="outlined"
          onClick={() => window.location.assign(
            `/purchase-orders/new?supplierId=${params.row.supplierId || ''}&ids=${(params.row.items || []).map((i) => i.itemVariantId).join(',')}`)}
          sx={{ textTransform: 'none', fontWeight: 700 }}>
          Create PO
        </Button>
      ),
    },
  ],
};

const PurchaseOrderReportsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [agingDays, setAgingDays] = useState(7);
  const [spendFrom, setSpendFrom] = useState('');
  const [spendTo, setSpendTo] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      switch (tab) {
        case 0: data = await fetchPoAging(agingDays); break;
        case 1: data = await fetchPoSupplierSpend(spendFrom || undefined, spendTo || undefined); break;
        case 2: data = await fetchPoFulfillment(); break;
        case 3:
          data = await fetchPoBudgetVsActual(budgetInput ? Number(budgetInput) : undefined);
          setBudget(data);
          setLoading(false);
          return;
        case 4: data = await fetchPoSuggestFromLowStock(); break;
        default: data = [];
      }
      setRows((Array.isArray(data) ? data : []).map((row, i) => ({
        id: row.id ?? row.supplierId ?? i + 1, ...row,
      })));
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load report', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [tab, agingDays, spendFrom, spendTo, budgetInput]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleExport = async () => {
    try {
      const blob = await downloadPoCsv(exportFrom || undefined, exportTo || undefined);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'po-register.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    }
  };

  const activeColumns = [
    columnMaps.aging, columnMaps.spend, columnMaps.fulfillment, null, columnMaps.suggest,
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
          <IconButton size="small" onClick={() => navigate('/purchase-orders')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>Purchase order reports</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
        </Stack>

        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            variant="scrollable" scrollButtons="auto">
            <Tab label="Aging by status" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Supplier spend" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Fulfillment rate" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Budget vs actual" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Auto-suggest from low stock" sx={{ textTransform: 'none', fontWeight: 700 }} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }} alignItems="center">
              {tab === 0 && (
                <TextField size="small" type="number" label="Older than (days)"
                  value={agingDays} onChange={(e) => setAgingDays(Number(e.target.value || 0))} sx={{ width: 180 }} />
              )}
              {tab === 1 && (
                <>
                  <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
                    value={spendFrom} onChange={(e) => setSpendFrom(e.target.value)} />
                  <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
                    value={spendTo} onChange={(e) => setSpendTo(e.target.value)} />
                </>
              )}
              {tab === 3 && (
                <TextField size="small" type="number" label="Monthly budget (₹)"
                  value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} sx={{ width: 200 }} />
              )}
              <Box sx={{ flexGrow: 1 }} />
              <TextField size="small" type="date" label="Export from" InputLabelProps={{ shrink: true }}
                value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
              <TextField size="small" type="date" label="Export to" InputLabelProps={{ shrink: true }}
                value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
                Export PO register
              </Button>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : tab === 3 ? (
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
                {budget ? (
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">MONTH START</Typography>
                      <Typography variant="body1" fontWeight={700}>{formatDate(budget.monthStart)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">BUDGET</Typography>
                      <Typography variant="body1" fontWeight={700}>₹{formatInr(budget.budget)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">ACTUAL SPEND</Typography>
                      <Typography variant="body1" fontWeight={700}>₹{formatInr(budget.actual)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">VARIANCE</Typography>
                      <Typography variant="body1" fontWeight={700}
                        color={Number(budget.variance || 0) > 0 ? 'error.main' : 'success.main'}>
                        ₹{formatInr(budget.variance)}
                      </Typography>
                    </Box>
                    <Chip
                      label={Number(budget.variance || 0) > 0 ? 'Over budget' : 'Under budget'}
                      color={Number(budget.variance || 0) > 0 ? 'error' : 'success'}
                      sx={{ fontWeight: 700, borderRadius: 1, alignSelf: 'center' }}
                    />
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">Loading…</Typography>
                )}
              </Paper>
            ) : (
              <DataGrid
                autoHeight rows={rows} columns={activeColumns || []}
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

export default PurchaseOrderReportsPage;
