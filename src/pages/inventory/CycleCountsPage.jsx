import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Snackbar, CircularProgress, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  CheckCircleOutline as CommitIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import {
  listCycleCounts,
  getCycleCount,
  planCycleCount,
  recordCycleCountLine,
  commitCycleCount,
  cancelCycleCount,
} from '../../services/api';

const formatDateTime = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

const STATUS_META = {
  PLANNED:     { tone: 'default', label: 'Planned' },
  IN_PROGRESS: { tone: 'warning', label: 'In progress' },
  COMPLETED:   { tone: 'success', label: 'Completed' },
  CANCELLED:   { tone: 'error',   label: 'Cancelled' },
};

const CycleCountsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [planDialog, setPlanDialog] = useState({ open: false, scope: 'FULL', notes: '' });
  const [countDialog, setCountDialog] = useState({ open: false, line: null, qty: '', reason: '' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listCycleCounts();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load cycle counts', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openDetail = async (id) => {
    setBusy(true);
    try {
      const data = await getCycleCount(id);
      setSelected(data);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load count', severity: 'error' });
    } finally { setBusy(false); }
  };

  const handlePlan = async () => {
    setBusy(true);
    try {
      const created = await planCycleCount({ scope: planDialog.scope, notes: planDialog.notes });
      setPlanDialog({ open: false, scope: 'FULL', notes: '' });
      setSnackbar({ open: true, message: `Cycle count ${created.countNumber} planned.`, severity: 'success' });
      refresh();
      openDetail(created.id);
    } catch (e) {
      setSnackbar({ open: true, message: 'Plan failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const handleRecord = async () => {
    if (!countDialog.line || countDialog.qty === '') return;
    setBusy(true);
    try {
      const updated = await recordCycleCountLine(
        selected.id, countDialog.line.id, Number(countDialog.qty), countDialog.reason || null);
      setSelected(updated);
      setCountDialog({ open: false, line: null, qty: '', reason: '' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Record failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const handleCommit = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const done = await commitCycleCount(selected.id);
      setSelected(done);
      setSnackbar({ open: true, message: 'Count committed — variances applied as ADJUST movements.', severity: 'success' });
      refresh();
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Commit failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const handleCancel = async () => {
    if (!selected) return;
    const reason = window.prompt('Reason for cancelling?', '');
    if (reason == null) return;
    setBusy(true);
    try {
      const done = await cancelCycleCount(selected.id, reason);
      setSelected(done);
      refresh();
    } catch (e) {
      setSnackbar({ open: true, message: 'Cancel failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const columns = [
    { field: 'countNumber', headerName: 'Count #', flex: 1, minWidth: 160,
      renderCell: (p) => (
        <Button size="small" variant="text" onClick={() => openDetail(p.row.id)}
          sx={{ textTransform: 'none', fontWeight: 700, fontFamily: 'monospace' }}>
          {p.value}
        </Button>
      ),
    },
    { field: 'scope', headerName: 'Scope', flex: 0.5, minWidth: 100 },
    { field: 'status', headerName: 'Status', flex: 0.7, minWidth: 120,
      renderCell: (p) => {
        const meta = STATUS_META[p.value] || { tone: 'default', label: p.value };
        return <Chip label={meta.label} size="small" color={meta.tone === 'default' ? undefined : meta.tone}
          sx={{ fontWeight: 700, borderRadius: 1 }} />;
      },
    },
    { field: 'initiatedBy', headerName: 'Initiated by', flex: 0.8, minWidth: 130 },
    { field: 'createdAt', headerName: 'Planned', flex: 0.9, minWidth: 160,
      renderCell: (p) => formatDateTime(p.value) },
    { field: 'completedAt', headerName: 'Completed', flex: 0.9, minWidth: 160,
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
          <Typography variant="h5" fontWeight={800}>Cycle counts / stocktake</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setPlanDialog({ open: true, scope: 'FULL', notes: '' })}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            New count
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
              localeText={{ noRowsLabel: 'No cycle counts yet. Click New count to begin.' }}
            />
          )}
        </Paper>

        <Dialog open={planDialog.open} onClose={() => setPlanDialog({ open: false, scope: 'FULL', notes: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 460 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Plan a cycle count</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              A snapshot of the current system quantity is taken. You then enter counted values;
              on commit, non-zero variances become ADJUST movements.
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Scope</InputLabel>
              <Select value={planDialog.scope} label="Scope"
                onChange={(e) => setPlanDialog((s) => ({ ...s, scope: e.target.value }))}>
                <MenuItem value="FULL">Full — all variants</MenuItem>
                <MenuItem value="SPOT">Spot check</MenuItem>
                <MenuItem value="CATEGORY">By category</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth multiline minRows={2} label="Notes"
              value={planDialog.notes}
              onChange={(e) => setPlanDialog((s) => ({ ...s, notes: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPlanDialog({ open: false, scope: 'FULL', notes: '' })}
              sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handlePlan} variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Planning…' : 'Plan count'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="lg"
          PaperProps={{ sx: { borderRadius: 2 } }}>
          {selected && (
            <>
              <DialogTitle sx={{ fontWeight: 800 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <span>{selected.countNumber}</span>
                  {(() => {
                    const meta = STATUS_META[selected.status] || { tone: 'default', label: selected.status };
                    return <Chip label={meta.label} size="small" color={meta.tone === 'default' ? undefined : meta.tone}
                      sx={{ fontWeight: 700, borderRadius: 1 }} />;
                  })()}
                  <Box sx={{ flexGrow: 1 }} />
                  {selected.status !== 'COMPLETED' && selected.status !== 'CANCELLED' && (
                    <>
                      <Button size="small" variant="outlined" color="error"
                        startIcon={<CancelIcon />} onClick={handleCancel} disabled={busy}
                        sx={{ textTransform: 'none', fontWeight: 700 }}>Cancel</Button>
                      <Button size="small" variant="contained" color="success"
                        startIcon={<CommitIcon />} onClick={handleCommit} disabled={busy}
                        sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>Commit</Button>
                    </>
                  )}
                </Stack>
              </DialogTitle>
              <DialogContent>
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>System qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Counted</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Variance</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selected.lines || []).map((line) => (
                        <TableRow key={line.id} hover>
                          <TableCell>{line.itemVariantId}</TableCell>
                          <TableCell>{line.batchNumber || '—'}</TableCell>
                          <TableCell align="right">{Number(line.systemQty || 0)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {line.countedQty != null ? Number(line.countedQty) : '—'}
                          </TableCell>
                          <TableCell align="right"
                            sx={{ color: Number(line.varianceQty || 0) === 0 ? 'text.secondary'
                              : Number(line.varianceQty || 0) > 0 ? 'success.main' : 'error.main',
                              fontWeight: 700 }}>
                            {line.varianceQty != null ? Number(line.varianceQty) : '—'}
                          </TableCell>
                          <TableCell>{line.reason || '—'}</TableCell>
                          <TableCell align="right">
                            {selected.status !== 'COMPLETED' && selected.status !== 'CANCELLED' && (
                              <Button size="small"
                                onClick={() => setCountDialog({ open: true, line,
                                  qty: line.countedQty != null ? String(line.countedQty) : '',
                                  reason: line.reason || '' })}
                                sx={{ textTransform: 'none', fontWeight: 700 }}>
                                {line.countedQty != null ? 'Update' : 'Record'}
                              </Button>
                            )}
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

        <Dialog open={countDialog.open} onClose={() => setCountDialog({ open: false, line: null, qty: '', reason: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 420 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Record counted quantity</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              System says <strong>{Number(countDialog.line?.systemQty || 0)}</strong>. Enter what you counted.
            </Typography>
            <TextField autoFocus fullWidth type="number" label="Counted qty"
              value={countDialog.qty}
              onChange={(e) => setCountDialog((s) => ({ ...s, qty: e.target.value }))}
              sx={{ mb: 2 }} />
            <TextField fullWidth multiline minRows={2} label="Reason (optional)"
              placeholder="e.g. damaged in transit, miscount on last stocktake…"
              value={countDialog.reason}
              onChange={(e) => setCountDialog((s) => ({ ...s, reason: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCountDialog({ open: false, line: null, qty: '', reason: '' })}
              sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleRecord} variant="contained" disabled={busy || countDialog.qty === ''}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CycleCountsPage;
