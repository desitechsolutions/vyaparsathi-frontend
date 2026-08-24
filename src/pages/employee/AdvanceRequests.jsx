import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, TextField, CircularProgress, Snackbar, Alert, Typography
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function AdvanceRequests() {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [dialog, setDialog] = useState({ open: false, amount: '', reason: '' });

  useEffect(() => { fetchAdvances(); }, []);

  const fetchAdvances = async () => {
    try {
      setLoading(true);
      const res = await api.fetchMyAdvanceRequests(0, 20);
      setAdvances(res?.content || res || []);
    } catch (err) {
      showToast('Failed to load advance requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const handleRequestAdvance = async () => {
    if (!dialog.amount) {
      showToast('Please enter amount', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.requestSalaryAdvance(parseFloat(dialog.amount), dialog.reason || 'Not specified');
      showToast('Advance request submitted successfully');
      setDialog({ open: false, amount: '', reason: '' });
      fetchAdvances();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit advance request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'warning';
      case 'DISBURSED': return 'info';
      default: return 'default';
    }
  };

  const fmtRs = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  if (loading && advances.length === 0) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Salary Advance Requests</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ ...dialog, open: true })}>
          Request Advance
        </Button>
      </Stack>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Request Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {advances.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No advance requests yet
                </TableCell>
              </TableRow>
            )}
            {advances.map(adv => (
              <TableRow key={adv.id} hover>
                <TableCell>{fmtRs(adv.amount)}</TableCell>
                <TableCell>{adv.reason}</TableCell>
                <TableCell>{new Date(adv.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip label={adv.status} size="small" color={getStatusColor(adv.status)} />
                </TableCell>
                <TableCell>{adv.remarks || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Request Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Request Salary Advance</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Advance Amount"
              type="number"
              value={dialog.amount}
              onChange={(e) => setDialog({ ...dialog, amount: e.target.value })}
              fullWidth
              inputProps={{ min: 0, step: 100 }}
            />
            <TextField
              label="Reason"
              multiline
              rows={3}
              value={dialog.reason}
              onChange={(e) => setDialog({ ...dialog, reason: e.target.value })}
              placeholder="Brief reason for advance (optional)"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={handleRequestAdvance} disabled={loading}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
