import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Tabs, Tab, Button, Alert,
  Snackbar, CircularProgress, TextField, IconButton, Chip, Grid,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Inventory2Outlined as InventoryIcon,
  AttachMoney as MoneyIcon,
  TrendingDown as ShrinkageIcon,
  HourglassBottom as AgeingIcon,
  Cached as TurnoverIcon,
} from '@mui/icons-material';

import {
  fetchStockValuation,
  fetchStockDeadReport,
  fetchStockShrinkage,
  fetchStockAgeing,
  fetchStockTurnover,
  downloadStockValuationXlsx,
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
  dead: [
    { field: 'sku', headerName: 'SKU', flex: 0.8, minWidth: 130 },
    { field: 'itemName', headerName: 'Item', flex: 1.4, minWidth: 200 },
    { field: 'category', headerName: 'Category', flex: 0.9, minWidth: 130 },
    { field: 'currentStock', headerName: 'Stock', flex: 0.5, minWidth: 90, type: 'number' },
    { field: 'stockValue', headerName: 'Value', flex: 0.7, minWidth: 110,
      valueFormatter: (p) => `₹${formatInr(p.value)}` },
    { field: 'daysSince', headerName: 'Days idle', flex: 0.6, minWidth: 100, type: 'number' },
    { field: 'lastOutbound', headerName: 'Last outbound', flex: 0.9, minWidth: 140,
      renderCell: (p) => formatDate(p.value) },
  ],
  shrinkage: [
    { field: 'sku', headerName: 'SKU', flex: 0.8, minWidth: 130 },
    { field: 'itemName', headerName: 'Item', flex: 1.4, minWidth: 200 },
    { field: 'category', headerName: 'Category', flex: 0.9, minWidth: 130 },
    { field: 'shrinkageQty', headerName: 'Loss qty', flex: 0.6, minWidth: 110, type: 'number' },
    { field: 'shrinkageValue', headerName: 'Loss value', flex: 0.7, minWidth: 120,
      valueFormatter: (p) => `₹${formatInr(p.value)}` },
    { field: 'adjustCount', headerName: '# adjusts', flex: 0.5, minWidth: 100, type: 'number' },
  ],
  ageing: [
    { field: 'sku', headerName: 'SKU', flex: 0.8, minWidth: 130 },
    { field: 'itemName', headerName: 'Item', flex: 1.3, minWidth: 200 },
    { field: 'batchNumber', headerName: 'Batch', flex: 0.7, minWidth: 120 },
    { field: 'currentStock', headerName: 'Qty', flex: 0.5, minWidth: 90, type: 'number' },
    { field: 'expiryDate', headerName: 'Expiry', flex: 0.7, minWidth: 120,
      renderCell: (p) => formatDate(p.value) },
    { field: 'stockValue', headerName: 'Value', flex: 0.7, minWidth: 110,
      valueFormatter: (p) => `₹${formatInr(p.value)}` },
  ],
  turnover: [
    { field: 'sku', headerName: 'SKU', flex: 0.8, minWidth: 130 },
    { field: 'itemName', headerName: 'Item', flex: 1.3, minWidth: 200 },
    { field: 'category', headerName: 'Category', flex: 0.9, minWidth: 130 },
    { field: 'onHand', headerName: 'On hand', flex: 0.5, minWidth: 90, type: 'number' },
    { field: 'outboundQty', headerName: 'Sold', flex: 0.5, minWidth: 90, type: 'number' },
    { field: 'avgStock', headerName: 'Avg stock', flex: 0.5, minWidth: 100, type: 'number' },
    { field: 'turns', headerName: 'Turns', flex: 0.5, minWidth: 90, type: 'number' },
  ],
};

const InventoryReportsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [valuation, setValuation] = useState(null);
  const [rows, setRows] = useState([]);

  const [deadDays, setDeadDays] = useState(90);
  const [shrinkageFrom, setShrinkageFrom] = useState('');
  const [shrinkageTo, setShrinkageTo] = useState('');
  const [turnoverDays, setTurnoverDays] = useState(30);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      switch (tab) {
        case 0:
          data = await fetchStockValuation();
          setValuation(data);
          setRows(Array.isArray(data?.byCategory) ? data.byCategory.map((r, i) => ({ id: i + 1, ...r })) : []);
          setLoading(false);
          return;
        case 1: data = await fetchStockDeadReport(deadDays); break;
        case 2: data = await fetchStockShrinkage(shrinkageFrom || undefined, shrinkageTo || undefined); break;
        case 3: data = await fetchStockAgeing(); break;
        case 4: data = await fetchStockTurnover(turnoverDays); break;
        default: data = [];
      }
      setRows((Array.isArray(data) ? data : []).map((row, i) => ({ id: row.id ?? row.itemVariantId ?? i + 1, ...row })));
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load report', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [tab, deadDays, shrinkageFrom, shrinkageTo, turnoverDays]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleExportValuation = async () => {
    try {
      const blob = await downloadStockValuationXlsx();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'stock-valuation.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    }
  };

  const activeColumns = [null, columnMaps.dead, columnMaps.shrinkage, columnMaps.ageing, columnMaps.turnover][tab];

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
          <IconButton size="small" onClick={() => navigate('/stock')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>Inventory reports</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
        </Stack>

        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            variant="scrollable" scrollButtons="auto">
            <Tab icon={<MoneyIcon fontSize="small" />} iconPosition="start"
              label="Valuation" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab icon={<InventoryIcon fontSize="small" />} iconPosition="start"
              label="Dead stock" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab icon={<ShrinkageIcon fontSize="small" />} iconPosition="start"
              label="Shrinkage" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab icon={<AgeingIcon fontSize="small" />} iconPosition="start"
              label="Ageing" sx={{ textTransform: 'none', fontWeight: 700 }} />
            <Tab icon={<TurnoverIcon fontSize="small" />} iconPosition="start"
              label="Turnover" sx={{ textTransform: 'none', fontWeight: 700 }} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }} alignItems="center">
              {tab === 1 && (
                <TextField size="small" type="number" label="Idle for (days)"
                  value={deadDays} onChange={(e) => setDeadDays(Number(e.target.value || 0))} sx={{ width: 160 }} />
              )}
              {tab === 2 && (
                <>
                  <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
                    value={shrinkageFrom} onChange={(e) => setShrinkageFrom(e.target.value)} />
                  <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
                    value={shrinkageTo} onChange={(e) => setShrinkageTo(e.target.value)} />
                </>
              )}
              {tab === 4 && (
                <TextField size="small" type="number" label="Window (days)"
                  value={turnoverDays} onChange={(e) => setTurnoverDays(Number(e.target.value || 0))} sx={{ width: 150 }} />
              )}
              <Box sx={{ flexGrow: 1 }} />
              {tab === 0 && (
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportValuation}
                  sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Excel
                </Button>
              )}
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : tab === 0 ? (
              <>
                {valuation && (
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">TOTAL INVENTORY VALUE</Typography>
                        <Typography variant="h5" fontWeight={800}>₹{formatInr(valuation.totalValue)}</Typography>
                        <Typography variant="caption" color="text.secondary">{valuation.variantCount} variants</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">POTENTIAL REVENUE</Typography>
                        <Typography variant="h5" fontWeight={800}>₹{formatInr(valuation.potentialRevenue)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">PROJECTED PROFIT</Typography>
                        <Typography variant="h5" fontWeight={800} color="success.main">
                          ₹{formatInr(valuation.projectedProfit)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
                <DataGrid
                  autoHeight rows={rows} getRowId={(r) => r.id}
                  columns={[
                    { field: 'category', headerName: 'Category', flex: 2, minWidth: 200 },
                    { field: 'value', headerName: 'Inventory value', flex: 1, minWidth: 160,
                      valueFormatter: (p) => `₹${formatInr(p.value)}` },
                  ]}
                  disableRowSelectionOnClick rowHeight={50}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  sx={{
                    border: 0,
                    '& .MuiDataGrid-columnHeaders': {
                      bgcolor: alpha(theme.palette.text.primary, 0.04),
                      fontSize: '0.72rem', letterSpacing: 0.5, color: 'text.secondary', fontWeight: 700,
                      textTransform: 'uppercase',
                    },
                  }}
                />
              </>
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

export default InventoryReportsPage;
