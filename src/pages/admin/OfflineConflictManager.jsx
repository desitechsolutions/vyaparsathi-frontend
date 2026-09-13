import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert as MuiAlert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getOfflineConflictedSales, retryOfflineSale, overrideConflict } from '../../services/api';

function parseTotalAmount(conflict) {
  if (conflict.totalAmount != null && conflict.totalAmount !== 0) {
    return parseFloat(conflict.totalAmount);
  }
  // L-2: totalAmount not on DTO — parse from the stored requestPayloadJson.
  try {
    const payload = typeof conflict.requestPayloadJson === 'string'
      ? JSON.parse(conflict.requestPayloadJson)
      : conflict.requestPayloadJson;
    return parseFloat(payload?.totalAmount || 0);
  } catch (_) {
    return 0;
  }
}

/**
 * Offline Conflict Manager
 * Admin page to review and resolve conflicted offline sales
 */
export function OfflineConflictManager() {
  const { shop } = useShop();
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideSaleId, setOverrideSaleId] = useState('');
  const [processing, setProcessing] = useState(false);

  // L-1: Replace alert() with MUI Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const showSnack = (message, severity = 'error') =>
    setSnackbar({ open: true, message, severity });

  const loadConflicts = async () => {
    if (!shop?.id) return;
    setLoading(true);
    try {
      const res = await getOfflineConflictedSales(shop.id);
      setConflicts(res.data || []);
    } catch (err) {
      console.error('Failed to load conflicts:', err);
      showSnack('Failed to load conflicts: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
    const timer = setInterval(loadConflicts, 30000);
    return () => clearInterval(timer);
  }, [shop?.id]);

  const handleRetry = async (queueId) => {
    setProcessing(true);
    try {
      await retryOfflineSale(queueId);
      setConflicts(conflicts.filter(c => c.id !== queueId));
      showSnack('Sale queued for retry', 'success');
    } catch (err) {
      console.error('Retry failed:', err);
      showSnack('Failed to retry: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenOverrideDialog = (conflict) => {
    setSelectedConflict(conflict);
    setOverrideSaleId('');
    setOverrideDialogOpen(true);
  };

  const handleOverrideSubmit = async () => {
    if (!overrideSaleId.trim()) {
      showSnack('Please enter a sale ID');
      return;
    }
    setProcessing(true);
    try {
      await overrideConflict(selectedConflict.id, {
        saleId: parseInt(overrideSaleId),
      });
      setConflicts(conflicts.filter(c => c.id !== selectedConflict.id));
      setOverrideDialogOpen(false);
      showSnack('Conflict resolved', 'success');
    } catch (err) {
      console.error('Override failed:', err);
      showSnack('Failed to override: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  if (!shop?.id) {
    return (
      <Box sx={{ padding: 2 }}>
        <Alert severity="info">Please select a shop first</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: 2 }}>
        <Typography variant="h5">Offline Sale Conflicts</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadConflicts}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {loading && <CircularProgress />}

      {!loading && conflicts.length === 0 && (
        <Alert severity="success">✓ No conflicted sales. All offline sales processed successfully!</Alert>
      )}

      {!loading && conflicts.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell>Client ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Error</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conflicts.map(conflict => (
                <TableRow key={conflict.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {conflict.clientTxnId?.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{conflict.customerName || 'N/A'}</TableCell>
                  <TableCell>₹{parseTotalAmount(conflict).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={conflict.errorCode || 'CONFLICT'}
                      color="error"
                      variant="outlined"
                      size="small"
                    />
                    <Typography variant="caption" sx={{ display: 'block', marginTop: 0.5 }}>
                      {conflict.errorMessage?.slice(0, 50)}...
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(conflict.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReplayIcon />}
                        onClick={() => handleRetry(conflict.id)}
                        disabled={processing}
                      >
                        Retry
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleOpenOverrideDialog(conflict)}
                        disabled={processing}
                      >
                        Override
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manual Override – Link to Existing Sale</DialogTitle>
        <DialogContent sx={{ paddingTop: 2 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="textSecondary">
              This sale conflicted with an existing record. You can manually link it by entering the Sale ID of an
              existing sale (usually the one it was processed as).
            </Typography>
            <TextField
              label="Sale ID"
              type="number"
              fullWidth
              value={overrideSaleId}
              onChange={e => setOverrideSaleId(e.target.value)}
              placeholder="e.g., 12345"
              disabled={processing}
            />
            <Typography variant="caption" color="textSecondary">
              The offline queue record will be marked as completed, and the offline sale number will be linked to this
              sale.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleOverrideSubmit}
            disabled={processing || !overrideSaleId.trim()}
          >
            {processing ? <CircularProgress size={24} /> : 'Override & Link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* L-1: MUI Snackbar replaces alert() */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}

export default OfflineConflictManager;
