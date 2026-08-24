import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Button, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, Snackbar, Typography, LinearProgress
} from '@mui/material';
import { Add as AddIcon, Check as CheckIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function LeaveApplications() {
  const [applications, setApplications] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [dialog, setDialog] = useState({ open: false, leaveType: '', fromDate: '', toDate: '', reason: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, balanceRes] = await Promise.allSettled([
        api.listLeaveApplications(0, 20),
        api.getLeaveBalance(null, null)
      ]);
      if (appsRes.status === 'fulfilled') setApplications(appsRes.value?.content || appsRes.value || []);
      if (balanceRes.status === 'fulfilled') setLeaveBalance(balanceRes.value);
    } catch (err) {
      showToast('Failed to load leave data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const handleSubmitRequest = async () => {
    if (!dialog.leaveType || !dialog.fromDate || !dialog.toDate) {
      showToast('Please fill all fields', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.createLeaveApplication(null, {
        leaveTypeId: dialog.leaveType,
        fromDate: dialog.fromDate,
        toDate: dialog.toDate,
        reason: dialog.reason,
        days: Math.ceil((new Date(dialog.toDate) - new Date(dialog.fromDate)) / (1000 * 60 * 60 * 24))
      });
      showToast('Leave application submitted successfully');
      setDialog({ open: false, leaveType: '', fromDate: '', toDate: '', reason: '' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit application', 'error');
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

  if (loading && applications.length === 0) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Leave Applications</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ ...dialog, open: true })}>
          Request Leave
        </Button>
      </Stack>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      {leaveBalance && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">Available Leave Balance</Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="caption">Annual Leave</Typography>
                <Typography variant="h6">{leaveBalance.annualDays || 0} days</Typography>
              </Box>
              <Box>
                <Typography variant="caption">Sick Leave</Typography>
                <Typography variant="h6">{leaveBalance.sickDays || 0} days</Typography>
              </Box>
              <Box>
                <Typography variant="caption">Casual Leave</Typography>
                <Typography variant="h6">{leaveBalance.casualDays || 0} days</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>From Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>To Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Days</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No leave applications yet
                </TableCell>
              </TableRow>
            )}
            {applications.map(app => (
              <TableRow key={app.id} hover>
                <TableCell>{app.leaveTypeName}</TableCell>
                <TableCell>{new Date(app.fromDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(app.toDate).toLocaleDateString()}</TableCell>
                <TableCell align="right">{app.days}</TableCell>
                <TableCell>
                  <Chip label={app.status} size="small" color={getStatusColor(app.status)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Request Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              select
              label="Leave Type"
              value={dialog.leaveType}
              onChange={(e) => setDialog({ ...dialog, leaveType: e.target.value })}
              fullWidth
            >
              <MenuItem value="ANNUAL">Annual Leave</MenuItem>
              <MenuItem value="SICK">Sick Leave</MenuItem>
              <MenuItem value="CASUAL">Casual Leave</MenuItem>
              <MenuItem value="UNPAID">Unpaid Leave</MenuItem>
            </TextField>
            <TextField
              label="From Date"
              type="date"
              value={dialog.fromDate}
              onChange={(e) => setDialog({ ...dialog, fromDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To Date"
              type="date"
              value={dialog.toDate}
              onChange={(e) => setDialog({ ...dialog, toDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Reason"
              multiline
              rows={3}
              value={dialog.reason}
              onChange={(e) => setDialog({ ...dialog, reason: e.target.value })}
              placeholder="Optional: provide reason for leave"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitRequest} disabled={loading}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
