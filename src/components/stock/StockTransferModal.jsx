import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, CircularProgress, Alert, Autocomplete, Tabs, Tab,
  Stack, Tooltip,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import SendIcon from '@mui/icons-material/Send';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import {
  fetchStockTransfers, createStockTransfer, executeStockTransfer,
  cancelStockTransfer, fetchItemVariants,
  requestApprovalStockTransfer, approveStockTransfer,
  dispatchStockTransfer, receiveStockTransfer,
} from '../../services/api';

// Status chip config — covers v1 and V94 statuses
const STATUS_CONFIG = {
  PENDING:          { color: 'warning',   label: 'Pending' },
  PENDING_APPROVAL: { color: 'info',      label: 'Awaiting Approval' },
  APPROVED:         { color: 'secondary', label: 'Approved' },
  IN_TRANSIT:       { color: 'primary',   label: 'In Transit' },
  COMPLETED:        { color: 'success',   label: 'Completed' },
  CANCELLED:        { color: 'error',     label: 'Cancelled' },
};

const statusConfig = (status) =>
  STATUS_CONFIG[status] || { color: 'default', label: status || 'Unknown' };

export default function StockTransferModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [transfers, setTransfers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // New transfer form
  const [toShopId, setToShopId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  // Approval note inline dialog
  const [noteDialog, setNoteDialog] = useState({ open: false, action: null, transferId: null, note: '' });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [transfersData, variantsRes] = await Promise.all([
        fetchStockTransfers(),
        fetchItemVariants({}),
      ]);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
      setVariants(Array.isArray(variantsRes?.data) ? variantsRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stock transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadData();
  }, [open]);

  const withSubmit = async (fn, successText) => {
    setSubmitting(true);
    setError(null);
    try {
      await fn();
      setSuccess(successText);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── v1 handlers ─────────────────────────────────────────────────────────────

  const handleExecute = (id) =>
    withSubmit(() => executeStockTransfer(id), 'Transfer executed successfully.');

  const handleCancel = (id) =>
    withSubmit(() => cancelStockTransfer(id), 'Transfer cancelled.');

  // ── V94 handlers ─────────────────────────────────────────────────────────────

  const handleRequestApproval = (id) => {
    setNoteDialog({ open: true, action: 'request', transferId: id, note: '' });
  };

  const handleApprove = (id) => {
    setNoteDialog({ open: true, action: 'approve', transferId: id, note: '' });
  };

  const handleDispatch = (id) =>
    withSubmit(() => dispatchStockTransfer(id), 'Transfer dispatched — now in transit.');

  const handleReceive = (id) =>
    withSubmit(() => receiveStockTransfer(id), 'Receipt confirmed. Transfer completed.');

  const handleNoteConfirm = () => {
    const { action, transferId, note } = noteDialog;
    setNoteDialog({ open: false, action: null, transferId: null, note: '' });
    if (action === 'request') {
      withSubmit(
        () => requestApprovalStockTransfer(transferId, note || undefined),
        'Approval requested.',
      );
    } else if (action === 'approve') {
      withSubmit(
        () => approveStockTransfer(transferId, note || undefined),
        'Transfer approved.',
      );
    }
  };

  // ── Create transfer ──────────────────────────────────────────────────────────

  const handleCreateTransfer = async () => {
    if (!toShopId || !selectedVariant || !quantity || Number(quantity) <= 0) {
      setError('Fill in destination shop, item variant, and a valid quantity.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createStockTransfer({
        toShopId: Number(toShopId),
        notes,
        items: [{ itemVariantId: selectedVariant.id, quantity: Number(quantity), batchNumber }],
      });
      setSuccess('Transfer request created (Pending).');
      setToShopId(''); setNotes(''); setSelectedVariant(null); setQuantity(''); setBatchNumber('');
      setActiveTab(0);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create stock transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Action buttons per status ────────────────────────────────────────────────

  const renderActions = (t) => {
    switch (t.status) {
      case 'PENDING':
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap">
            <Tooltip title="Execute immediately (no approval needed)">
              <span>
                <Button size="small" variant="contained" color="success"
                  startIcon={<CheckCircleIcon />} disabled={submitting}
                  onClick={() => handleExecute(t.id)}
                  sx={{ fontWeight: 700, textTransform: 'none', boxShadow: 'none', fontSize: '0.72rem' }}>
                  Execute
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Send to manager for approval before dispatch">
              <span>
                <Button size="small" variant="outlined" color="info"
                  startIcon={<SendIcon />} disabled={submitting}
                  onClick={() => handleRequestApproval(t.id)}
                  sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.72rem' }}>
                  Request Approval
                </Button>
              </span>
            </Tooltip>
            <Button size="small" variant="outlined" color="error"
              startIcon={<CancelIcon />} disabled={submitting}
              onClick={() => handleCancel(t.id)}
              sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.72rem' }}>
              Cancel
            </Button>
          </Stack>
        );

      case 'PENDING_APPROVAL':
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Button size="small" variant="contained" color="info"
              startIcon={<ThumbUpIcon />} disabled={submitting}
              onClick={() => handleApprove(t.id)}
              sx={{ fontWeight: 700, textTransform: 'none', boxShadow: 'none', fontSize: '0.72rem' }}>
              Approve
            </Button>
            <Button size="small" variant="outlined" color="error"
              startIcon={<CancelIcon />} disabled={submitting}
              onClick={() => handleCancel(t.id)}
              sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.72rem' }}>
              Reject
            </Button>
          </Stack>
        );

      case 'APPROVED':
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Button size="small" variant="contained" color="primary"
              startIcon={<LocalShippingIcon />} disabled={submitting}
              onClick={() => handleDispatch(t.id)}
              sx={{ fontWeight: 700, textTransform: 'none', boxShadow: 'none', fontSize: '0.72rem' }}>
              Dispatch
            </Button>
            <Button size="small" variant="outlined" color="error"
              startIcon={<CancelIcon />} disabled={submitting}
              onClick={() => handleCancel(t.id)}
              sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.72rem' }}>
              Cancel
            </Button>
          </Stack>
        );

      case 'IN_TRANSIT':
        return (
          <Button size="small" variant="contained" color="success"
            startIcon={<MoveToInboxIcon />} disabled={submitting}
            onClick={() => handleReceive(t.id)}
            sx={{ fontWeight: 700, textTransform: 'none', boxShadow: 'none', fontSize: '0.72rem' }}>
            Confirm Receipt
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHorizIcon color="primary" /> Inter-Location Stock Transfers
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="All Transfers" />
            <Tab label="New Transfer" icon={<AddIcon fontSize="small" />} iconPosition="start" />
          </Tabs>

          {/* ── Transfers list ─────────────────────────────────────── */}
          {activeTab === 0 && (
            <Box>
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : transfers.length === 0 ? (
                <Typography color="text.secondary" align="center" py={4}>
                  No stock transfers found.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Transfer #</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>From</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>To</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transfers.map((t) => {
                        const cfg = statusConfig(t.status);
                        return (
                          <TableRow key={t.id} sx={{ verticalAlign: 'top' }}>
                            <TableCell sx={{ fontWeight: 700 }}>{t.transferNumber}</TableCell>
                            <TableCell>{t.fromShopName || `Shop #${t.fromShopId}`}</TableCell>
                            <TableCell>{t.toShopName || `Shop #${t.toShopId}`}</TableCell>
                            <TableCell>
                              <Chip label={cfg.label} size="small" color={cfg.color}
                                sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell>
                              {(t.items || []).map((item, idx) => (
                                <Typography key={idx} variant="caption" display="block">
                                  {item.itemName || item.sku} × {item.quantity}
                                  {item.batchNumber ? ` (Batch: ${item.batchNumber})` : ''}
                                </Typography>
                              ))}
                            </TableCell>
                            <TableCell align="right" sx={{ minWidth: 200 }}>
                              {renderActions(t)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* ── New transfer form ──────────────────────────────────── */}
          {activeTab === 1 && (
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                label="Destination Shop ID"
                type="number"
                value={toShopId}
                onChange={(e) => setToShopId(e.target.value)}
                placeholder="e.g. 2"
                helperText="Enter the numeric ID of the destination location"
                fullWidth
                required
              />
              <Autocomplete
                options={variants}
                getOptionLabel={(v) =>
                  v ? `${v.itemName} (SKU: ${v.sku}) — ₹${v.pricePerUnit}` : ''
                }
                value={selectedVariant}
                onChange={(_, val) => setSelectedVariant(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Select Item Variant" required />
                )}
              />
              <Box display="flex" gap={2}>
                <TextField label="Transfer Quantity" type="number" value={quantity}
                  onChange={(e) => setQuantity(e.target.value)} fullWidth required />
                <TextField label="Batch Number (Optional)" value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)} fullWidth />
              </Box>
              <TextField label="Transfer Notes" value={notes}
                onChange={(e) => setNotes(e.target.value)} multiline rows={2} fullWidth />
              <Button variant="contained" color="primary" onClick={handleCreateTransfer}
                disabled={submitting}
                sx={{ mt: 1, py: 1.5, fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}>
                {submitting ? <CircularProgress size={24} /> : 'Create Transfer'}
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Approval note dialog ───────────────────────────────────── */}
      <Dialog open={noteDialog.open}
        onClose={() => setNoteDialog({ open: false, action: null, transferId: null, note: '' })}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {noteDialog.action === 'request' ? 'Request Approval' : 'Approve Transfer'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {noteDialog.action === 'request'
              ? 'Optionally add a note for the approver.'
              : 'Optionally add an approval note.'}
          </Typography>
          <TextField
            label="Note (optional)"
            value={noteDialog.note}
            onChange={(e) => setNoteDialog((s) => ({ ...s, note: e.target.value }))}
            multiline rows={3} fullWidth autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setNoteDialog({ open: false, action: null, transferId: null, note: '' })}
            sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleNoteConfirm} variant="contained"
            sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
            {noteDialog.action === 'request' ? 'Send for Approval' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
