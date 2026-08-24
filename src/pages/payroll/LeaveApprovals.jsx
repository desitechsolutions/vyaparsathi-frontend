import React, { useState, useEffect } from 'react';
import {
  Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  Snackbar, Alert, Typography, MenuItem
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function LeaveApprovals() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [dialog, setDialog] = useState({ open: false, applicationId: null, action: null, reason: '' });

  useEffect(() => { fetchApplications(); }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.listAdminLeaveApplications(statusFilter);
      setApplications(res || []);
    } catch (err) {
      showToast('Failed to load leave applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const handleApprove = async (appId) => {
    try {
      setLoading(true);
      await api.approveLeaveApplication(appId);
      showToast('Leave approved successfully');
      setDialog({ open: false, applicationId: null, action: null, reason: '' });
      fetchApplications();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve leave', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (appId, reason) => {
    if (!reason) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.rejectLeaveApplication(appId, reason);
      showToast('Leave rejected successfully');
      setDialog({ open: false, applicationId: null, action: null, reason: '' });
      fetchApplications();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject leave', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && applications.length === 0) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Leave Approvals</Typography>
          <Typography variant="body2" color="text.secondary">Review and approve/reject leave requests from employees</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
            <Button
              key={s}
              size="small"
              variant={statusFilter === s ? 'contained' : 'outlined'}
              color={s === 'APPROVED' ? 'success' : s === 'REJECTED' ? 'error' : 'warning'}
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

      {applications.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          No pending leave applications to approve
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>From Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>To Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Days</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map(app => (
                <TableRow key={app.id} hover>
                  <TableCell>{app.employeeName}</TableCell>
                  <TableCell>{app.leaveTypeName}</TableCell>
                  <TableCell>{new Date(app.fromDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(app.toDate).toLocaleDateString()}</TableCell>
                  <TableCell align="right">{app.days}</TableCell>
                  <TableCell>{app.reason || '—'}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => setDialog({ open: true, applicationId: app.id, action: 'APPROVE', reason: '' })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => setDialog({ open: true, applicationId: app.id, action: 'REJECT', reason: '' })}
                      >
                        Reject
                      </Button>
                    </Stack>
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
          {dialog.action === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
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
            <Typography>Are you sure you want to approve this leave request?</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button
            variant="contained"
            color={dialog.action === 'APPROVE' ? 'success' : 'error'}
            onClick={() => {
              if (dialog.action === 'APPROVE') {
                handleApprove(dialog.applicationId);
              } else {
                handleReject(dialog.applicationId, dialog.reason);
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
