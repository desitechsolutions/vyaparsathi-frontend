import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, Stack, Chip, Button, IconButton,
  Snackbar, Alert, CircularProgress, TextField, Skeleton, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ScheduleIcon from '@mui/icons-material/Schedule';

import {
  getPendingApprovalPurchaseOrders,
  approvePurchaseOrder,
  rejectPurchaseOrder,
} from '../../services/api';

const inr = (v) =>
  Number(v || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2, minimumFractionDigits: 0,
  });

const fmtDate = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

const daysSince = (v) => {
  if (!v) return null;
  try {
    const diff = Date.now() - new Date(v).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  } catch { return null; }
};

// Small KPI cell — same convention as Stock / LowStockAlerts / PO list.
const KpiCell = ({ icon, label, value, color, divider }) => (
  <Box sx={{
    p: 2, display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0,
    borderRight: divider ? '1px solid' : 'none', borderColor: 'divider',
  }}>
    <Box sx={{ display: 'inline-flex', p: 1, borderRadius: 1, bgcolor: alpha(color, 0.1), color }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}
        sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} sx={{
        lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

export default function PurchaseOrderApprovals() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'info' });
  const [rejectDialog, setRejectDialog] = useState({ open: false, po: null, reason: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPendingApprovalPurchaseOrders();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setSnackbar({ open: true, msg: 'Failed to load pending approvals.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const kpi = useMemo(() => {
    const totalValue = rows.reduce((a, r) => a + Number(r.totalAmount || 0), 0);
    let oldestDays = 0;
    rows.forEach((r) => {
      const d = daysSince(r.orderDate);
      if (d != null && d > oldestDays) oldestDays = d;
    });
    return { count: rows.length, totalValue, oldestDays };
  }, [rows]);

  const runApprove = async (po) => {
    setBusy(true);
    try {
      await approvePurchaseOrder(po.id);
      setSnackbar({ open: true, msg: `Approved ${po.poNumber}.`, severity: 'success' });
      load();
    } catch (err) {
      setSnackbar({ open: true, msg: err?.response?.data?.message || 'Approve failed.', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const runReject = async () => {
    if (!rejectDialog.po || !rejectDialog.reason.trim()) return;
    setBusy(true);
    try {
      await rejectPurchaseOrder(rejectDialog.po.id, rejectDialog.reason.trim());
      setSnackbar({ open: true, msg: `Rejected ${rejectDialog.po.poNumber}.`, severity: 'success' });
      setRejectDialog({ open: false, po: null, reason: '' });
      load();
    } catch (err) {
      setSnackbar({ open: true, msg: err?.response?.data?.message || 'Reject failed.', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo(() => [
    {
      field: 'poNumber', headerName: 'PO #', flex: 1, minWidth: 160,
      renderCell: (params) => (
        <Box
          onClick={() => navigate(`/purchase-orders/${params.row.id}`)}
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Typography variant="body2" fontWeight={700} noWrap
            sx={{ fontFamily: 'monospace', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'supplierName', headerName: 'Supplier', flex: 1.2, minWidth: 180,
      valueGetter: (params) => params?.row?.supplier?.name || '—',
      renderCell: (params) => <Typography variant="body2" fontWeight={500} noWrap>{params.value}</Typography>,
    },
    {
      field: 'orderDate', headerName: 'Requested', flex: 0.9, minWidth: 130,
      renderCell: (params) => {
        const d = daysSince(params.value);
        return (
          <Box>
            <Typography variant="body2" color="text.secondary">{fmtDate(params.value)}</Typography>
            {d != null && d > 0 && (
              <Typography variant="caption" color={d > 3 ? 'error.main' : 'text.secondary'}>
                {d} day{d === 1 ? '' : 's'} ago
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'totalAmount', headerName: 'Value', flex: 0.8, minWidth: 130,
      align: 'right', headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700}>₹{inr(params.value)}</Typography>
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 200,
      sortable: false, filterable: false, disableColumnMenu: true,
      align: 'right', headerAlign: 'right',
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
          <Button
            size="small" variant="outlined" color="error"
            startIcon={<CancelIcon fontSize="small" />}
            onClick={(e) => { e.stopPropagation(); setRejectDialog({ open: true, po: params.row, reason: '' }); }}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
          >
            Reject
          </Button>
          <Button
            size="small" variant="contained" color="success"
            startIcon={<CheckCircleIcon fontSize="small" />}
            onClick={(e) => { e.stopPropagation(); runApprove(params.row); }}
            disabled={busy}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, boxShadow: 'none' }}
          >
            Approve
          </Button>
        </Stack>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [busy]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar
          open={snackbar.open} autoHideDuration={3000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled"
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
            {snackbar.msg}
          </Alert>
        </Snackbar>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate('/purchase-orders')} size="small">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
              Purchase Order Approvals
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              POs awaiting your review. Approve to unlock receiving; reject with a reason to send
              the PO back to the requester as a draft.
            </Typography>
          </Box>
        </Stack>

        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
          }}>
            <KpiCell icon={<PendingActionsIcon fontSize="small" />} label="PENDING"
              value={kpi.count} color={theme.palette.warning.main} divider />
            <KpiCell icon={<AttachMoneyIcon fontSize="small" />} label="TOTAL VALUE"
              value={`₹${inr(kpi.totalValue)}`} color={theme.palette.primary.main} divider />
            <KpiCell icon={<ScheduleIcon fontSize="small" />} label="OLDEST WAIT"
              value={kpi.oldestDays > 0 ? `${kpi.oldestDays} day${kpi.oldestDays === 1 ? '' : 's'}` : '—'}
              color={kpi.oldestDays > 3 ? theme.palette.error.main : theme.palette.info.main} />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{
          borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} variant="rectangular" height={54} sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <HourglassEmptyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>All caught up</Typography>
              <Typography variant="body2" color="text.secondary">
                No purchase orders are waiting for approval right now.
              </Typography>
            </Box>
          ) : (
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              rowHeight={64}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'orderDate', sort: 'asc' }] },
              }}
              pageSizeOptions={[10, 25, 50]}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  textTransform: 'uppercase',
                  fontSize: '0.72rem',
                  letterSpacing: 0.5,
                  color: 'text.secondary',
                  fontWeight: 700,
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            />
          )}
        </Paper>

        {/* Reject dialog — reason required */}
        <Dialog
          open={rejectDialog.open}
          onClose={() => setRejectDialog({ open: false, po: null, reason: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}
        >
          <DialogTitle sx={{ p: 2.5, fontWeight: 800, color: 'error.main' }}>
            Reject purchase order?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>{rejectDialog.po?.poNumber}</strong> · {rejectDialog.po?.supplier?.name || 'supplier'}
              <br />
              The requester will see this reason and can revise + resubmit. Rejection sends the
              PO back to DRAFT (does not cancel).
            </Typography>
            <TextField
              autoFocus fullWidth multiline minRows={2} maxRows={5}
              inputProps={{ maxLength: 500 }}
              label="Reason (required)"
              placeholder="e.g. Amount exceeds quarterly budget for this supplier…"
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog((s) => ({ ...s, reason: e.target.value }))}
              helperText={`${rejectDialog.reason.length}/500`}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
            <Button onClick={() => setRejectDialog({ open: false, po: null, reason: '' })}
              sx={{ textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              onClick={runReject}
              variant="contained" color="error"
              disabled={busy || !rejectDialog.reason.trim()}
              startIcon={busy ? <CircularProgress size={16} /> : <CancelIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
            >
              Reject &amp; Return to Draft
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}