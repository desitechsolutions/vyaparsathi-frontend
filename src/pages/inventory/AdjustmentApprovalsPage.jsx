import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Snackbar, CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  CheckCircleOutline as ApproveIcon,
  Block as RejectIcon,
} from '@mui/icons-material';

import {
  fetchAdjustmentApprovals,
  approveAdjustment,
  rejectAdjustment,
} from '../../services/api';

const formatDateTime = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

const AdjustmentApprovalsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [decisionDialog, setDecisionDialog] = useState({ open: false, mode: null, id: null, note: '' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAdjustmentApprovals();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load approvals', severity: 'error' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDecide = async () => {
    setBusy(true);
    try {
      if (decisionDialog.mode === 'approve') {
        await approveAdjustment(decisionDialog.id, decisionDialog.note || null);
        setSnackbar({ open: true, message: 'Approved.', severity: 'success' });
      } else {
        await rejectAdjustment(decisionDialog.id, decisionDialog.note || null);
        setSnackbar({ open: true, message: 'Rejected.', severity: 'info' });
      }
      setDecisionDialog({ open: false, mode: null, id: null, note: '' });
      refresh();
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Action failed', severity: 'error' });
    } finally { setBusy(false); }
  };

  const columns = [
    { field: 'id', headerName: '#', flex: 0.4, minWidth: 70 },
    { field: 'itemVariantId', headerName: 'Variant', flex: 0.6, minWidth: 100 },
    { field: 'deltaQty', headerName: 'Delta qty', flex: 0.6, minWidth: 100, type: 'number',
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={700}
          color={Number(p.value || 0) < 0 ? 'error.main' : 'success.main'}>
          {Number(p.value || 0) > 0 ? '+' : ''}{Number(p.value || 0)}
        </Typography>
      ),
    },
    { field: 'deltaValue', headerName: 'Delta value', flex: 0.7, minWidth: 130,
      renderCell: (p) => `₹${Number(p.value || 0).toLocaleString('en-IN')}` },
    { field: 'reason', headerName: 'Reason', flex: 1.4, minWidth: 200 },
    { field: 'requestedBy', headerName: 'Requested by', flex: 0.8, minWidth: 130 },
    { field: 'requestedAt', headerName: 'When', flex: 0.9, minWidth: 160,
      renderCell: (p) => formatDateTime(p.value) },
    {
      field: 'actions', headerName: '', flex: 0.9, minWidth: 200,
      sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (p) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="contained" color="success"
            startIcon={<ApproveIcon />}
            onClick={(e) => { e.stopPropagation(); setDecisionDialog({ open: true, mode: 'approve', id: p.row.id, note: '' }); }}
            sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
            Approve
          </Button>
          <Button size="small" variant="outlined" color="error"
            startIcon={<RejectIcon />}
            onClick={(e) => { e.stopPropagation(); setDecisionDialog({ open: true, mode: 'reject', id: p.row.id, note: '' }); }}
            sx={{ textTransform: 'none', fontWeight: 700 }}>
            Reject
          </Button>
        </Stack>
      ),
    },
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
          <Typography variant="h5" fontWeight={800}>Stock adjustment approvals</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label={`${rows.length} pending`} color="warning"
            sx={{ fontWeight: 700, borderRadius: 1 }} />
          <IconButton onClick={refresh} disabled={loading}><RefreshIcon /></IconButton>
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
              localeText={{ noRowsLabel: 'No adjustments awaiting approval.' }}
            />
          )}
        </Paper>

        <Dialog open={decisionDialog.open}
          onClose={() => setDecisionDialog({ open: false, mode: null, id: null, note: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 460 } }}>
          <DialogTitle sx={{ fontWeight: 800,
            color: decisionDialog.mode === 'approve' ? 'success.main' : 'error.main' }}>
            {decisionDialog.mode === 'approve' ? 'Approve adjustment' : 'Reject adjustment'}
          </DialogTitle>
          <DialogContent>
            <TextField autoFocus fullWidth multiline minRows={3} label="Note (optional)"
              value={decisionDialog.note}
              onChange={(e) => setDecisionDialog((s) => ({ ...s, note: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDecisionDialog({ open: false, mode: null, id: null, note: '' })}
              sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleDecide} variant="contained" disabled={busy}
              color={decisionDialog.mode === 'approve' ? 'success' : 'error'}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Working…' : (decisionDialog.mode === 'approve' ? 'Approve' : 'Reject')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdjustmentApprovalsPage;
