import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, TextField, CircularProgress, Snackbar, Alert, Typography, MenuItem
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function LoanRequests() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [dialog, setDialog] = useState({ open: false, amount: '', duration: '', purpose: '' });

  useEffect(() => { fetchLoans(); }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.fetchMyLoans(0, 20);
      setLoans(res?.content || res || []);
    } catch (err) {
      showToast('Failed to load loans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const handleRequestLoan = async () => {
    if (!dialog.amount || !dialog.duration) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.createLoanRequest(parseFloat(dialog.amount), {
        durationMonths: parseInt(dialog.duration),
        purpose: dialog.purpose || 'Personal'
      });
      showToast('Loan request submitted successfully');
      setDialog({ open: false, amount: '', duration: '', purpose: '' });
      fetchLoans();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit loan request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const fmtRs = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  if (loading && loans.length === 0) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Loan Requests</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ ...dialog, open: true })}>
          Request Loan
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
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Purpose</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>EMI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loans.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No loans yet
                </TableCell>
              </TableRow>
            )}
            {loans.map(loan => (
              <TableRow key={loan.id} hover>
                <TableCell>{fmtRs(loan.amount)}</TableCell>
                <TableCell>{loan.durationMonths} months</TableCell>
                <TableCell>{loan.purpose}</TableCell>
                <TableCell>
                  <Chip label={loan.status} size="small" color={getStatusColor(loan.status)} />
                </TableCell>
                <TableCell>{fmtRs(loan.emiAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Request Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Request Loan</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Loan Amount"
              type="number"
              value={dialog.amount}
              onChange={(e) => setDialog({ ...dialog, amount: e.target.value })}
              fullWidth
              inputProps={{ min: 0, step: 1000 }}
            />
            <TextField
              select
              label="Duration (months)"
              value={dialog.duration}
              onChange={(e) => setDialog({ ...dialog, duration: e.target.value })}
              fullWidth
            >
              <MenuItem value="6">6 months</MenuItem>
              <MenuItem value="12">12 months</MenuItem>
              <MenuItem value="18">18 months</MenuItem>
              <MenuItem value="24">24 months</MenuItem>
              <MenuItem value="36">36 months</MenuItem>
            </TextField>
            <TextField
              label="Purpose"
              value={dialog.purpose}
              onChange={(e) => setDialog({ ...dialog, purpose: e.target.value })}
              placeholder="Personal, Medical, Emergency, etc."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={handleRequestLoan} disabled={loading}>
            Request Loan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
