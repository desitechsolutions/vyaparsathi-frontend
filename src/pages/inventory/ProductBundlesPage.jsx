import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Snackbar, CircularProgress, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Autocomplete,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import {
  listProductBundles, createProductBundle, deactivateProductBundle,
  fetchItemVariants,
} from '../../services/api';

const ProductBundlesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [createDialog, setCreateDialog] = useState({
    open: false, bundleVariant: null, bundleName: '', notes: '',
    components: [{ variant: null, quantity: '1', unit: '', optional: false }],
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, vlist] = await Promise.all([
        listProductBundles(),
        fetchItemVariants().catch(() => []),
      ]);
      setRows(Array.isArray(list) ? list : (list?.data || []));
      setVariants(Array.isArray(vlist) ? vlist : (vlist?.data || []));
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load bundles', severity: 'error' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    if (!createDialog.bundleVariant || !createDialog.bundleName?.trim()) {
      setSnackbar({ open: true, message: 'Parent variant + name required.', severity: 'warning' });
      return;
    }
    const cleanComponents = createDialog.components
      .filter((c) => c.variant && Number(c.quantity || 0) > 0)
      .map((c) => ({
        componentVariantId: c.variant.id,
        quantity: Number(c.quantity),
        unit: c.unit || null,
        optionalFlag: !!c.optional,
      }));
    if (!cleanComponents.length) {
      setSnackbar({ open: true, message: 'At least one component required.', severity: 'warning' });
      return;
    }
    setBusy(true);
    try {
      await createProductBundle({
        bundleVariantId: createDialog.bundleVariant.id,
        bundleName: createDialog.bundleName.trim(),
        notes: createDialog.notes || null,
        components: cleanComponents,
      });
      setCreateDialog({
        open: false, bundleVariant: null, bundleName: '', notes: '',
        components: [{ variant: null, quantity: '1', unit: '', optional: false }],
      });
      setSnackbar({ open: true, message: 'Bundle created.', severity: 'success' });
      refresh();
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Create failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this bundle?')) return;
    setBusy(true);
    try {
      await deactivateProductBundle(id);
      refresh();
      setSelected(null);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const columns = [
    { field: 'bundleName', headerName: 'Bundle', flex: 1.5, minWidth: 200,
      renderCell: (p) => (
        <Button size="small" variant="text" onClick={() => setSelected(p.row)}
          sx={{ textTransform: 'none', fontWeight: 700 }}>
          {p.value}
        </Button>
      ),
    },
    { field: 'bundleVariantId', headerName: 'Parent variant', flex: 0.8, minWidth: 130 },
    { field: 'active', headerName: 'Status', flex: 0.5, minWidth: 100,
      renderCell: (p) => (
        <Chip label={p.value ? 'Active' : 'Inactive'} size="small"
          color={p.value ? 'success' : 'default'}
          sx={{ fontWeight: 700, borderRadius: 1 }} />
      ),
    },
    { field: 'components', headerName: 'Components', flex: 0.6, minWidth: 120,
      valueGetter: (p) => (p?.row?.components || []).length },
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
          <Typography variant="h5" fontWeight={800}>Product bundles / kits</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setCreateDialog({ ...createDialog, open: true })}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            New bundle
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
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  fontSize: '0.72rem', letterSpacing: 0.5, color: 'text.secondary', fontWeight: 700,
                  textTransform: 'uppercase',
                },
              }}
              localeText={{ noRowsLabel: 'No bundles defined yet.' }}
            />
          )}
        </Paper>

        <Dialog open={createDialog.open}
          onClose={() => setCreateDialog({ ...createDialog, open: false })}
          fullWidth maxWidth="md"
          PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>New bundle</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                options={variants}
                value={createDialog.bundleVariant}
                onChange={(_, v) => setCreateDialog((s) => ({ ...s, bundleVariant: v }))}
                getOptionLabel={(o) => o ? `${o.sku || o.id} — ${o.name || o.itemName || 'Variant'}` : ''}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                renderInput={(params) => <TextField {...params} label="Bundle parent variant" />}
              />
              <TextField fullWidth label="Bundle name"
                value={createDialog.bundleName}
                onChange={(e) => setCreateDialog((s) => ({ ...s, bundleName: e.target.value }))} />
              <TextField fullWidth multiline minRows={2} label="Notes"
                value={createDialog.notes}
                onChange={(e) => setCreateDialog((s) => ({ ...s, notes: e.target.value }))} />
              <Typography variant="subtitle2" fontWeight={800}>Components</Typography>
              {createDialog.components.map((c, idx) => (
                <Stack key={idx} direction="row" spacing={1} alignItems="center">
                  <Autocomplete
                    options={variants}
                    value={c.variant}
                    onChange={(_, v) => setCreateDialog((s) => ({
                      ...s, components: s.components.map((r, i) => i === idx ? { ...r, variant: v } : r),
                    }))}
                    getOptionLabel={(o) => o ? `${o.sku || o.id} — ${o.name || o.itemName || 'Variant'}` : ''}
                    isOptionEqualToValue={(a, b) => a?.id === b?.id}
                    renderInput={(params) => <TextField {...params} label="Component" size="small" />}
                    sx={{ flex: 2 }}
                  />
                  <TextField size="small" type="number" label="Qty" sx={{ width: 100 }}
                    value={c.quantity}
                    onChange={(e) => setCreateDialog((s) => ({
                      ...s, components: s.components.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r),
                    }))} />
                  <TextField size="small" label="Unit" sx={{ width: 90 }}
                    value={c.unit}
                    onChange={(e) => setCreateDialog((s) => ({
                      ...s, components: s.components.map((r, i) => i === idx ? { ...r, unit: e.target.value } : r),
                    }))} />
                  <IconButton onClick={() => setCreateDialog((s) => ({
                    ...s, components: s.components.filter((_, i) => i !== idx),
                  }))} disabled={createDialog.components.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button variant="text" startIcon={<AddIcon />}
                onClick={() => setCreateDialog((s) => ({
                  ...s, components: [...s.components, { variant: null, quantity: '1', unit: '', optional: false }],
                }))}
                sx={{ textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start' }}>
                Add component
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateDialog({ ...createDialog, open: false })}
              sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Creating…' : 'Create bundle'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="md"
          PaperProps={{ sx: { borderRadius: 2 } }}>
          {selected && (
            <>
              <DialogTitle sx={{ fontWeight: 800 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <span>{selected.bundleName}</span>
                  <Chip label={selected.active ? 'Active' : 'Inactive'}
                    color={selected.active ? 'success' : 'default'}
                    size="small" sx={{ fontWeight: 700, borderRadius: 1 }} />
                  <Box sx={{ flexGrow: 1 }} />
                  {selected.active && (
                    <Button size="small" variant="outlined" color="error"
                      onClick={() => handleDeactivate(selected.id)} disabled={busy}
                      sx={{ textTransform: 'none', fontWeight: 700 }}>
                      Deactivate
                    </Button>
                  )}
                </Stack>
              </DialogTitle>
              <DialogContent>
                {selected.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selected.notes}</Typography>
                )}
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Component variant</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Optional</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selected.components || []).map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>#{c.componentVariantId}</TableCell>
                          <TableCell align="right">{Number(c.quantity || 0)}</TableCell>
                          <TableCell>{c.unit || '—'}</TableCell>
                          <TableCell>{c.optionalFlag ? 'Optional' : 'Required'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setSelected(null)} sx={{ textTransform: 'none' }}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default ProductBundlesPage;
