import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Checkbox, Button, Chip, Stack, IconButton,
  Tooltip, CircularProgress, TextField, InputAdornment, Alert,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Snackbar
} from '@mui/material';
import { 
  fetchPendingVerifications, 
  approvePayment, 
  rejectPayment 
} from '../../services/api';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CallIcon from '@mui/icons-material/Call';
import HistoryIcon from '@mui/icons-material/History';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const AdminPaymentQueue = () => {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);

  // --- Modal & Feedback States ---
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await fetchPendingVerifications();
      setQueue(data);
    } catch (error) {
      showSnackbar("Failed to load payment queue", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // --- Bulk Selection Logic ---
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(queue.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // --- Dialog Control ---
  const openConfirm = (type, id = null) => {
    setConfirmDialog({ open: true, type, id });
  };

  const closeConfirm = () => {
    setConfirmDialog({ open: false, type: '', id: null });
  };

  // --- Action Handlers ---
  const processAction = async () => {
    const { type, id } = confirmDialog;
    setProcessing(true);
    try {
      if (type === 'approve') {
        await approvePayment(id);
        setQueue((prev) => prev.filter((item) => item.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        showSnackbar("Payment approved and shop activated!");
      } 
      else if (type === 'bulk_approve') {
        await Promise.all(selectedIds.map(id => approvePayment(id)));
        await loadQueue();
        setSelectedIds([]);
        showSnackbar(`${selectedIds.length} payments approved!`);
      }
      else if (type === 'reject') {
        await rejectPayment(id, "Invalid UTR or payment not found.");
        setQueue((prev) => prev.filter((item) => item.id !== id));
        showSnackbar("Payment request rejected", "info");
      }
    } catch (error) {
      showSnackbar("Action failed. Please try again.", "error");
    } finally {
      setProcessing(false);
      closeConfirm();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSnackbar("UTR copied to clipboard");
  };

  const openWhatsApp = (phone, shopName, utr) => {
    const message = `Hello from VyaparSathi! Regarding your shop "${shopName}", we received a payment request with UTR ${utr}. Could you please provide a screenshot for verification?`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredQueue = queue.filter(item => 
    item.utrNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ownerPhone?.includes(searchTerm)
  );

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress color="error" thickness={5} />
    </Box>
  );

  return (
    <Box sx={{ p: 1 }}>
      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="white">Payment Verification Queue</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Reconcile {queue.length} pending Indian UPI/Bank transfers
          </Typography>
        </Box>

        {selectedIds.length > 0 && (
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<VerifiedUserIcon />}
            onClick={() => openConfirm('bulk_approve')}
            sx={{ borderRadius: 2, fontWeight: 800, boxShadow: '0 4px 14px 0 rgba(74, 222, 128, 0.39)' }}
          >
            Bulk Approve ({selectedIds.length})
          </Button>
        )}
      </Stack>

      <Paper sx={{ bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <TextField
            fullWidth
            placeholder="Search by Shop, Owner, Phone or UTR..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled' }} /></InputAdornment>,
              sx: { color: 'text.primary', bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox 
                    indeterminate={selectedIds.length > 0 && selectedIds.length < queue.length}
                    checked={queue.length > 0 && selectedIds.length === queue.length}
                    onChange={handleSelectAll}
                    sx={{ color: 'text.disabled' }}
                  />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>SHOP & OWNER</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>CONTACT</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>PLAN / AMT</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>UTR DETAILS</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }} align="right">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10, color: 'text.disabled' }}>
                    <HistoryIcon sx={{ fontSize: 48, mb: 1, opacity: 0.1 }} />
                    <Typography>No pending payments to verify.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQueue.map((item) => (
                  <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell padding="checkbox">
                      <Checkbox 
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectOne(item.id)}
                        sx={{ color: 'text.disabled' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: 'text.primary', fontWeight: 700 }}>{item.shopName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Owner: {item.ownerName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton size="small" onClick={() => openWhatsApp(item.ownerPhone, item.shopName, item.utrNumber)} sx={{ color: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.1)' }}>
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" href={`tel:${item.ownerPhone}`} sx={{ color: 'primary.main', bgcolor: 'rgba(25, 118, 210, 0.12)' }}>
                          <CallIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>{item.ownerPhone}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.planRequested} size="small" sx={{ bgcolor: '#3b82f6', color: 'text.primary', fontWeight: 800, mb: 0.5 }} />
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 800 }}>₹{item.amount?.toLocaleString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', px: 1, py: 0.5, borderRadius: 1 }}>
                           <Typography sx={{ color: 'warning.main', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.utrNumber}</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => copyToClipboard(item.utrNumber)}>
                          <ContentCopyIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <IconButton onClick={() => openConfirm('approve', item.id)} sx={{ color: 'success.main' }}>
                          <CheckCircleIcon />
                        </IconButton>
                        <IconButton onClick={() => openConfirm('reject', item.id)} sx={{ color: '#f87171' }}>
                          <CancelIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* --- Confirmation Dialog --- */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={closeConfirm}
        PaperProps={{ sx: { bgcolor: 'background.paper', color: 'text.primary', borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          {confirmDialog.type.includes('approve') ? "Confirm Approval" : "Confirm Rejection"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>
            {confirmDialog.type === 'bulk_approve' 
              ? `Are you sure you want to approve all ${selectedIds.length} selected payments? This action will immediately activate these shops.`
              : confirmDialog.type === 'approve' 
                ? "Have you verified this UTR in your bank statement? Approving this will grant the user full access to the platform."
                : "Are you sure you want to reject this payment? The user will be notified to resubmit their details."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeConfirm} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button 
            onClick={processAction} 
            variant="contained" 
            color={confirmDialog.type.includes('approve') ? "success" : "error"}
            disabled={processing}
            startIcon={processing && <CircularProgress size={16} color="inherit" />}
          >
            {confirmDialog.type.includes('approve') ? "Yes, Approve" : "Yes, Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Feedback Snackbar --- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AdminPaymentQueue;