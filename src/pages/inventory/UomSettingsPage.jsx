import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Button, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Snackbar, CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { listUomConversions, saveUomConversion, convertUom } from '../../services/api';

const UomSettingsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [addDialog, setAddDialog] = useState({ open: false, fromUnit: '', toUnit: '', factor: '' });
  const [convertDialog, setConvertDialog] = useState({ open: false, qty: '', from: '', to: '', result: null });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listUomConversions();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load conversions', severity: 'error' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSave = async () => {
    if (!addDialog.fromUnit || !addDialog.toUnit || !addDialog.factor) {
      setSnackbar({ open: true, message: 'All fields required.', severity: 'warning' });
      return;
    }
    setBusy(true);
    try {
      await saveUomConversion({
        fromUnit: addDialog.fromUnit.toUpperCase(),
        toUnit: addDialog.toUnit.toUpperCase(),
        factor: Number(addDialog.factor),
        active: true,
      });
      setAddDialog({ open: false, fromUnit: '', toUnit: '', factor: '' });
      setSnackbar({ open: true, message: 'Conversion saved.', severity: 'success' });
      refresh();
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Save failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const handleConvert = async () => {
    setBusy(true);
    try {
      const data = await convertUom(Number(convertDialog.qty || 0), convertDialog.from, convertDialog.to);
      setConvertDialog((s) => ({ ...s, result: data.result }));
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Conversion failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const columns = [
    { field: 'fromUnit', headerName: 'From', flex: 0.5, minWidth: 100 },
    { field: 'toUnit', headerName: 'To', flex: 0.5, minWidth: 100 },
    { field: 'factor', headerName: 'Factor', flex: 0.7, minWidth: 130,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
          × {Number(p.value || 0)}
        </Typography>
      ),
    },
    { field: 'active', headerName: 'Status', flex: 0.5, minWidth: 100,
      renderCell: (p) => <Chip label={p.value ? 'Active' : 'Inactive'} size="small"
        color={p.value ? 'success' : 'default'}
        sx={{ fontWeight: 700, borderRadius: 1 }} /> },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ pt: 3, pb: 4 }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton size="small" onClick={() => navigate('/stock')}><BackIcon /></IconButton>
          <Typography variant="h5" fontWeight={800}>UOM conversions</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" startIcon={<CalculateIcon />}
            onClick={() => setConvertDialog({ open: true, qty: '1', from: '', to: '', result: null })}
            sx={{ textTransform: 'none', fontWeight: 700 }}>
            Convert
          </Button>
          <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setAddDialog({ open: true, fromUnit: '', toUnit: '', factor: '' })}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            New conversion
          </Button>
        </Stack>

        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <DataGrid
              autoHeight rows={rows} columns={columns} getRowId={(r) => r.id}
              disableRowSelectionOnClick rowHeight={54}
              pageSizeOptions={[10, 25, 50]}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  fontSize: '0.72rem', letterSpacing: 0.5, color: 'text.secondary', fontWeight: 700,
                  textTransform: 'uppercase',
                },
              }}
              localeText={{ noRowsLabel: 'No UOM conversions defined. Add one to enable multi-unit reporting.' }}
            />
          )}
        </Paper>

        <Dialog open={addDialog.open} onClose={() => setAddDialog({ ...addDialog, open: false })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 420 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>New UOM conversion</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter <em>from × factor = to</em>. E.g. 1 KG × 1000 = 1000 G.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField label="From unit" value={addDialog.fromUnit}
                onChange={(e) => setAddDialog((s) => ({ ...s, fromUnit: e.target.value }))} fullWidth />
              <TextField label="To unit" value={addDialog.toUnit}
                onChange={(e) => setAddDialog((s) => ({ ...s, toUnit: e.target.value }))} fullWidth />
            </Stack>
            <TextField fullWidth type="number" label="Factor"
              value={addDialog.factor}
              onChange={(e) => setAddDialog((s) => ({ ...s, factor: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAddDialog({ ...addDialog, open: false })} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={convertDialog.open} onClose={() => setConvertDialog({ ...convertDialog, open: false })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 420 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Quick convert</DialogTitle>
          <DialogContent>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField label="Quantity" type="number" value={convertDialog.qty}
                onChange={(e) => setConvertDialog((s) => ({ ...s, qty: e.target.value, result: null }))} fullWidth />
              <TextField label="From" value={convertDialog.from}
                onChange={(e) => setConvertDialog((s) => ({ ...s, from: e.target.value, result: null }))} fullWidth />
              <TextField label="To" value={convertDialog.to}
                onChange={(e) => setConvertDialog((s) => ({ ...s, to: e.target.value, result: null }))} fullWidth />
            </Stack>
            {convertDialog.result != null && (
              <Alert severity="success">
                Result: <strong>{Number(convertDialog.result)}</strong> {convertDialog.to}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setConvertDialog({ ...convertDialog, open: false })} sx={{ textTransform: 'none' }}>Close</Button>
            <Button onClick={handleConvert} variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              Convert
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UomSettingsPage;
