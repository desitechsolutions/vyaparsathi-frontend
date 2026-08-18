import React, { useCallback, useEffect, useState } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Paper, Stack, Chip, Button, Typography, Box, Divider, Tooltip,
  IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert,
} from '@mui/material';
import {
  QrCode2 as IrnIcon,
  LocalShipping as EwbIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  ErrorOutline as MissingIcon,
} from '@mui/icons-material';

import {
  getIrnForDoc, generateIrn, cancelIrn,
  getEwbForDoc, generateEwbNew, cancelEwbNew,
} from '../../services/api';

/**
 * Compact toolbar for any enterprise document (Invoice, Debit Note,
 * Credit Note, Delivery Challan). Shows current IRN + EWB status pills
 * and lets an operator generate or cancel them. Reusable — pass in
 * `documentType`, `documentId`, `documentNumber`, optional `showEwb`.
 */
const EInvoiceActionBar = ({
  documentType,
  documentId,
  documentNumber,
  showEwb = false,
  compact = false,
}) => {
  const theme = useTheme();
  const [irn, setIrn] = useState(null);
  const [ewb, setEwb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [cancelDialog, setCancelDialog] = useState({ open: false, kind: null, reason: '' });

  const showMessage = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const refresh = useCallback(async () => {
    if (!documentType || !documentId) return;
    setLoading(true);
    try {
      const [i, w] = await Promise.all([
        getIrnForDoc(documentType, documentId),
        showEwb ? getEwbForDoc(documentType, documentId) : Promise.resolve(null),
      ]);
      setIrn(i);
      setEwb(w);
    } finally {
      setLoading(false);
    }
  }, [documentType, documentId, showEwb]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleGenerateIrn = async () => {
    setBusy(true);
    try {
      const r = await generateIrn(documentType, documentId, documentNumber);
      setIrn(r);
      showMessage('IRN generated', 'success');
    } catch (e) {
      showMessage(e?.response?.data?.message || 'IRN generation failed', 'error');
    } finally { setBusy(false); }
  };

  const handleGenerateEwb = async () => {
    setBusy(true);
    try {
      const r = await generateEwbNew(documentType, documentId, documentNumber);
      setEwb(r);
      showMessage('E-Way Bill generated', 'success');
    } catch (e) {
      showMessage(e?.response?.data?.message || 'EWB generation failed', 'error');
    } finally { setBusy(false); }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      if (cancelDialog.kind === 'irn') {
        await cancelIrn(irn.irn, cancelDialog.reason);
        setIrn({ ...irn, status: 'CANCELLED' });
        showMessage('IRN cancelled', 'info');
      } else {
        await cancelEwbNew(ewb.ewbNumber, cancelDialog.reason);
        setEwb({ ...ewb, status: 'CANCELLED' });
        showMessage('E-Way Bill cancelled', 'info');
      }
      setCancelDialog({ open: false, kind: null, reason: '' });
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Cancellation failed', 'error');
    } finally { setBusy(false); }
  };

  const irnActive = irn && irn.status !== 'CANCELLED';
  const ewbActive = ewb && ewb.status !== 'CANCELLED';

  return (
    <Paper elevation={0} sx={{
      p: compact ? 1.25 : 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: alpha(theme.palette.text.primary, 0.02),
    }}>
      <Snackbar open={snackbar.open} autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
        {/* IRN block */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{
            display: 'inline-flex', p: 1, borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
          }}>
            <IrnIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={800}
              sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
              E-INVOICE (IRN)
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {loading ? (
                <CircularProgress size={12} />
              ) : irnActive ? (
                <>
                  <Chip icon={<CheckIcon fontSize="small" />} size="small" color="success"
                    label="Active" sx={{ fontWeight: 700, borderRadius: 1, height: 20 }} />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {irn.irn.slice(0, 12)}…
                  </Typography>
                </>
              ) : irn?.status === 'CANCELLED' ? (
                <Chip label="Cancelled" size="small" color="default" variant="outlined"
                  sx={{ fontWeight: 700, borderRadius: 1, height: 20 }} />
              ) : (
                <Chip icon={<MissingIcon fontSize="small" />} size="small" color="warning" variant="outlined"
                  label="Not generated" sx={{ fontWeight: 700, borderRadius: 1, height: 20 }} />
              )}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          {!irnActive && (
            <Button size="small" variant="contained" disabled={busy || loading}
              onClick={handleGenerateIrn}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              Generate IRN
            </Button>
          )}
          {irnActive && (
            <>
              <Tooltip title="Refresh"><IconButton size="small" onClick={refresh}>
                <RefreshIcon fontSize="small" /></IconButton></Tooltip>
              <Button size="small" variant="outlined" color="error" disabled={busy}
                startIcon={<CancelIcon fontSize="small" />}
                onClick={() => setCancelDialog({ open: true, kind: 'irn', reason: '' })}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
                Cancel IRN
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {showEwb && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <Box sx={{
                display: 'inline-flex', p: 1, borderRadius: 1,
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
              }}>
                <EwbIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}
                  sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
                  E-WAY BILL
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {loading ? (
                    <CircularProgress size={12} />
                  ) : ewbActive ? (
                    <>
                      <Chip icon={<CheckIcon fontSize="small" />} size="small" color="success"
                        label="Active" sx={{ fontWeight: 700, borderRadius: 1, height: 20 }} />
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {ewb.ewbNumber}
                      </Typography>
                    </>
                  ) : ewb?.status === 'CANCELLED' ? (
                    <Chip label="Cancelled" size="small" color="default" variant="outlined"
                      sx={{ fontWeight: 700, borderRadius: 1, height: 20 }} />
                  ) : (
                    <Chip icon={<MissingIcon fontSize="small" />} size="small" color="warning" variant="outlined"
                      label="Not generated" sx={{ fontWeight: 700, borderRadius: 1, height: 20 }} />
                  )}
                </Stack>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              {!ewbActive && (
                <Button size="small" variant="contained" color="info" disabled={busy || loading}
                  onClick={handleGenerateEwb}
                  sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
                  Generate EWB
                </Button>
              )}
              {ewbActive && (
                <Button size="small" variant="outlined" color="error" disabled={busy}
                  startIcon={<CancelIcon fontSize="small" />}
                  onClick={() => setCancelDialog({ open: true, kind: 'ewb', reason: '' })}
                  sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Cancel EWB
                </Button>
              )}
            </Stack>
          </Stack>
        </>
      )}

      <Dialog open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, kind: null, reason: '' })}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 420 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>
          Cancel {cancelDialog.kind === 'irn' ? 'IRN' : 'e-Way Bill'}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cancellation is recorded on the IRP and can't be undone. A fresh document
            must be generated if needed. Provide a reason for the audit log.
          </Typography>
          <TextField autoFocus fullWidth multiline minRows={3} label="Reason"
            value={cancelDialog.reason}
            onChange={(e) => setCancelDialog((s) => ({ ...s, reason: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialog({ open: false, kind: null, reason: '' })}
            sx={{ textTransform: 'none' }}>Keep</Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={busy}
            sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
            {busy ? 'Working…' : 'Confirm cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EInvoiceActionBar;
