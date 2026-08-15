import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Button, IconButton, TextField,
  Alert, Snackbar, CircularProgress, InputAdornment, Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { fetchItemVariants, printBarcodeLabels } from '../../services/api';

const BarcodeLabelsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState([]);
  const [copies, setCopies] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchItemVariants();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load variants', severity: 'error' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return [r.sku, r.name, r.itemName, r.barcode]
      .filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  const handlePrint = async () => {
    if (!selection.length) {
      setSnackbar({ open: true, message: 'Select at least one variant.', severity: 'warning' });
      return;
    }
    setBusy(true);
    try {
      const blob = await printBarcodeLabels(selection.map((id) => Number(id)), copies);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setSnackbar({ open: true, message: 'Print failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const columns = [
    { field: 'sku', headerName: 'SKU', flex: 0.8, minWidth: 130,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{p.value || '—'}</Typography>
      ),
    },
    { field: 'name', headerName: 'Item', flex: 1.4, minWidth: 200,
      valueGetter: (p) => p?.row?.name || p?.row?.itemName || '—' },
    { field: 'barcode', headerName: 'Barcode', flex: 0.9, minWidth: 130 },
    { field: 'mrp', headerName: 'MRP', flex: 0.6, minWidth: 100,
      renderCell: (p) => p.value ? `₹${Number(p.value)}` : '—' },
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
          <IconButton size="small" onClick={() => navigate('/items')}><BackIcon /></IconButton>
          <Typography variant="h5" fontWeight={800}>Barcode labels</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
        </Stack>

        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
            <TextField size="small" placeholder="Search SKU / name / barcode…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: { xs: '100%', md: 320 } }} />
            <TextField size="small" type="number" label="Copies per variant"
              value={copies} onChange={(e) => setCopies(Math.max(1, Number(e.target.value || 1)))}
              sx={{ width: 180 }} />
            <Chip label={`${selection.length} selected`} color={selection.length ? 'primary' : 'default'}
              sx={{ fontWeight: 700, borderRadius: 1 }} />
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}
              disabled={busy || !selection.length}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
              {busy ? 'Rendering…' : `Print labels (${selection.length * copies})`}
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <DataGrid
              autoHeight rows={filtered} columns={columns} getRowId={(r) => r.id}
              checkboxSelection
              onRowSelectionModelChange={(model) => setSelection(model)}
              rowSelectionModel={selection}
              disableRowSelectionOnClick={false}
              rowHeight={50}
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  fontSize: '0.72rem', letterSpacing: 0.5, color: 'text.secondary', fontWeight: 700,
                  textTransform: 'uppercase',
                },
              }}
              localeText={{ noRowsLabel: 'No variants match your search.' }}
            />
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default BarcodeLabelsPage;
