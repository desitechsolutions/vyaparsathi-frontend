import React, { useState, useEffect } from 'react';
import {
  Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  Snackbar, Alert, Typography, MenuItem
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function AdvanceApprovals() {
  const [advances, setAdvances] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [dialog, setDialog] = useState({ open: false, advanceId: null, action: null, reason: '' });

  useEffect(() => { fetchAdvances(); }, [statusFilter]);

  const fetchAdvances = async () => {
    try {
      setLoading(true);
      // Get all pending advances (this would come from admin endpoint in real impl)
      const res = await api.fetchMyAdvanceRequests(0, 50);
      const filtered = (res?.content || res || []).filter(a => a.status === statusFilter);
      setAdvances(filtered);
    } catch (err) {
      showToast('Failed to load advance requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const handleApprove = async (advanceId) => {
    try {
      setLoading(true);
      // TODO: Call backend API for approval (endpoint doesn't exist yet)
      showToast('Advance approved successfully');
      setDialog({ open: false, advanceId: null, action: null, reason: '' });
      fetchAdvances();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve advance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (advanceId, reason) => {
    if (!reason) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }

    try {
      setLoading(true);
      // TODO: Call backend API for rejection
      showToast('Advance rejected successfully');
      setDialog({ open: false, advanceId: null, action: null, reason: '' });
      fetchAdvances();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject advance', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && advances.length === 0) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Salary Advance Approvals</Typography>
          <Typography variant="body2" color="text.secondary">Review and approve/reject advance requests from employees</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED'].map(s => (
            <Button
              key={s}
              size="small"
              variant={statusFilter === s ? 'contained' : 'outlined'}
              color={s === 'APPROVED' ? 'success' : s === 'REJECTED' ? 'error' : s === 'DISBURSED' ? 'info' : 'warning'}
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </Button>
          ))}
        </Stack>
      </Stack>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      {advances.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          No advance requests with status: {statusFilter}
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Request Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {advances.map(adv => (
                <TableRow key={adv.id} hover>
                  <TableCell>{adv.employeeName || 'Employee'}</TableCell>
                  <TableCell align="right" fontWeight={700}>₹{(adv.amount || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell>{adv.reason || '—'}</TableCell>
                  <TableCell>{new Date(adv.requestDate || adv.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={adv.status}
                      color={adv.status === 'APPROVED' ? 'success' : adv.status === 'REJECTED' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {adv.status === 'PENDING' && (
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => setDialog({ open: true, advanceId: adv.id, action: 'APPROVE', reason: '' })}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => setDialog({ open: true, advanceId: adv.id, action: 'REJECT', reason: '' })}
                        >
                          Reject
                        </Button>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.action === 'APPROVE' ? 'Approve Advance Request' : 'Reject Advance Request'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {dialog.action === 'REJECT' && (
            <TextField
              label="Reason for Rejection"
              multiline
              rows={3}
              value={dialog.reason}
              onChange={(e) => setDialog({ ...dialog, reason: e.target.value })}
              placeholder="Please provide reason for rejection"
              fullWidth
            />
          )}
          {dialog.action === 'APPROVE' && (
            <Typography>Are you sure you want to approve this advance request?</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button
            variant="contained"
            color={dialog.action === 'APPROVE' ? 'success' : 'error'}
            onClick={() => {
              if (dialog.action === 'APPROVE') {
                handleApprove(dialog.advanceId);
              } else {
                handleReject(dialog.advanceId, dialog.reason);
              }
            }}
            disabled={loading}
          >
            {dialog.action === 'APPROVE' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
