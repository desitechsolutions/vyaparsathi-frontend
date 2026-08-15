import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Snackbar, CircularProgress, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Checkbox, FormControlLabel, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import {
  listBatchRecalls,
  openBatchRecall,
  closeBatchRecall,
} from '../../services/api';

const formatDateTime = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

const BatchRecallsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [openDialog, setOpenDialog] = useState({
    open: false, batchNumber: '', itemVariantId: '', reason: '',
    notifySupplier: false, notifyCustomers: false,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listBatchRecalls();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load recalls', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleOpen = async () => {
    if (!openDialog.batchNumber?.trim() || !openDialog.reason?.trim()) {
      setSnackbar({ open: true, message: 'Batch number and reason are required.', severity: 'warning' });
      return;
    }
    setBusy(true);
    try {
      const created = await openBatchRecall({
        batchNumber: openDialog.batchNumber.trim(),
        itemVariantId: openDialog.itemVariantId ? Number(openDialog.itemVariantId) : null,
        reason: openDialog.reason.trim(),
        notifySupplier: openDialog.notifySupplier,
        notifyCustomers: openDialog.notifyCustomers,
      });
      setOpenDialog({ open: false, batchNumber: '', itemVariantId: '', reason: '', notifySupplier: false, notifyCustomers: false });
      setSnackbar({ open: true, message: `Recall #${created.id} opened — ${created.impacts?.length || 0} impacts traced.`, severity: 'success' });
      refresh();
      setSelected(created);
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Open failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const handleClose = async () => {
    if (!selected) return;
    const note = window.prompt('Closing note (optional)', '');
    setBusy(true);
    try {
      const closed = await closeBatchRecall(selected.id, note);
      setSelected(closed);
      refresh();
    } catch (e) {
      setSnackbar({ open: true, message: 'Close failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const columns = [
    { field: 'id', headerName: 'Recall #', flex: 0.5, minWidth: 100,
      renderCell: (p) => (
        <Button size="small" variant="text" onClick={() => setSelected(p.row)}
          sx={{ textTransform: 'none', fontWeight: 700, fontFamily: 'monospace' }}>
          #{p.value}
        </Button>
      ),
    },
    { field: 'batchNumber', headerName: 'Batch', flex: 0.8, minWidth: 130 },
    { field: 'reason', headerName: 'Reason', flex: 1.5, minWidth: 200 },
    { field: 'status', headerName: 'Status', flex: 0.5, minWidth: 110,
      renderCell: (p) => (
        <Chip label={p.value} size="small"
          color={p.value === 'CLOSED' ? 'success' : p.value === 'OPEN' ? 'error' : 'warning'}
          sx={{ fontWeight: 700, borderRadius: 1 }} />
      ),
    },
    { field: 'initiatedBy', headerName: 'Initiated by', flex: 0.7, minWidth: 130 },
    { field: 'initiatedAt', headerName: 'Opened', flex: 0.9, minWidth: 160,
      renderCell: (p) => formatDateTime(p.value) },
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
          <IconButton size="small" onClick={() => navigate('/stock')}><BackIcon /></IconButton>
          <Typography variant="h5" fontWeight={800}>Batch recalls</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} color="error"
            onClick={() => setOpenDialog({ open: true, batchNumber: '', itemVariantId: '', reason: '', notifySupplier: false, notifyCustomers: false })}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            Open recall
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
              localeText={{ noRowsLabel: 'No recalls on record.' }}
            />
          )}
        </Paper>

        <Dialog open={openDialog.open}
          onClose={() => setOpenDialog({ ...openDialog, open: false })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
          <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Open a batch recall</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Opening a recall quarantines any remaining stock of this batch (emits an ADJUST) and
              traces outbound movements. Verify the batch number matches supplier records.
            </Typography>
            <Stack spacing={2}>
              <TextField fullWidth label="Batch number (required)"
                value={openDialog.batchNumber}
                onChange={(e) => setOpenDialog((s) => ({ ...s, batchNumber: e.target.value }))} />
              <TextField fullWidth type="number" label="Item variant ID (optional)"
                value={openDialog.itemVariantId}
                onChange={(e) => setOpenDialog((s) => ({ ...s, itemVariantId: e.target.value }))} />
              <TextField fullWidth multiline minRows={2} label="Reason (required)"
                value={openDialog.reason}
                onChange={(e) => setOpenDialog((s) => ({ ...s, reason: e.target.value }))} />
              <FormControlLabel
                control={<Checkbox checked={openDialog.notifySupplier}
                  onChange={(e) => setOpenDialog((s) => ({ ...s, notifySupplier: e.target.checked }))} />}
                label="Notify supplier" />
              <FormControlLabel
                control={<Checkbox checked={openDialog.notifyCustomers}
                  onChange={(e) => setOpenDialog((s) => ({ ...s, notifyCustomers: e.target.checked }))} />}
                label="Notify affected customers" />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog({ ...openDialog, open: false })} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleOpen} variant="contained" color="error" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Working…' : 'Open recall'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="lg"
          PaperProps={{ sx: { borderRadius: 2 } }}>
          {selected && (
            <>
              <DialogTitle sx={{ fontWeight: 800 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <span>Recall #{selected.id} · {selected.batchNumber}</span>
                  <Chip label={selected.status} size="small"
                    color={selected.status === 'CLOSED' ? 'success' : 'error'}
                    sx={{ fontWeight: 700, borderRadius: 1 }} />
                  <Box sx={{ flexGrow: 1 }} />
                  {selected.status !== 'CLOSED' && (
                    <Button size="small" variant="contained" color="success"
                      onClick={handleClose} disabled={busy}
                      sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
                      Close recall
                    </Button>
                  )}
                </Stack>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Reason:</strong> {selected.reason}
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                  Traced impacts ({selected.impacts?.length || 0})
                </Typography>
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Party</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Outcome</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selected.impacts || []).map((i) => (
                        <TableRow key={i.id} hover>
                          <TableCell>{i.referenceNumber || `#${i.referenceId}`}</TableCell>
                          <TableCell>{i.referenceType}</TableCell>
                          <TableCell align="right">{Number(i.quantity || 0)}</TableCell>
                          <TableCell>{i.partyName || '—'}</TableCell>
                          <TableCell>
                            <Chip label={i.outcome || 'NOTIFIED'} size="small"
                              sx={{ fontWeight: 700, borderRadius: 1 }} />
                          </TableCell>
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

export default BatchRecallsPage;
