import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Button, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Alert, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Snackbar, Typography
} from '@mui/material';
import {
  CheckCircle as ApproveIcon, CloudDownload as DownloadIcon,
  Refresh as RefreshIcon, Add as AddIcon
} from '@mui/icons-material';
import * as api from '../../services/api';

const fmtRs = (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`;

export default function PayrollAdminDashboard() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [approvalDialog, setApprovalDialog] = useState({ open: false, run: null });

  useEffect(() => { fetchPayrollRuns(); }, []);

  const fetchPayrollRuns = async () => {
    try {
      setLoading(true);
      const response = await api.fetchPayrollRuns(0, 20);
      setRuns(response.content || response || []);
    } catch (error) {
      showToast('Failed to load payroll runs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const confirmApproval = async () => {
    try {
      setLoading(true);
      await api.approvePayrollRun(approvalDialog.run.id, null);
      showToast('Payroll run approved successfully');
      setApprovalDialog({ open: false, run: null });
      fetchPayrollRuns();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisburse = async (run) => {
    try {
      setLoading(true);
      await api.disbursePayrollRun(run.id, null);
      showToast('Payroll disbursed successfully');
      fetchPayrollRuns();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to disburse', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pendingApproval = runs.filter(r => r.status === 'PENDING_APPROVAL');
  const thisMonthRun = runs[0];
  const disbursedRuns = runs.filter(r => r.status === 'DISBURSED');
  const totalDisbursed = disbursedRuns.reduce((sum, r) => sum + (Number(r.totalNetPayable) || 0), 0);

  if (loading && runs.length === 0) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Payroll Admin Dashboard</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPayrollRuns} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      {/* KPI Cards — derived from real data */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Pending Approval</Typography>
              <Typography variant="h4" fontWeight={700} color={pendingApproval.length > 0 ? 'warning.main' : 'text.primary'}>
                {pendingApproval.length}
              </Typography>
              {pendingApproval[0] && (
                <Chip label={`${pendingApproval[0].payrollMonth}/${pendingApproval[0].payrollYear}`} size="small" color="warning" />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Latest Payroll</Typography>
              <Typography variant="h5" fontWeight={700}>
                {thisMonthRun ? fmtRs(thisMonthRun.totalNetPayable) : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {thisMonthRun ? `${thisMonthRun.totalEmployees || 0} employees` : 'No runs yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Total Disbursed (YTD)</Typography>
              <Typography variant="h5" fontWeight={700}>{fmtRs(totalDisbursed)}</Typography>
              <Typography variant="caption" color="text.secondary">{disbursedRuns.length} runs completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Total Payroll Runs</Typography>
              <Typography variant="h4" fontWeight={700}>{runs.length}</Typography>
              <Chip label="This Organization" size="small" variant="outlined" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Quick Actions</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1 }}>
            <Button variant="contained" startIcon={<AddIcon />} href="/payroll/wizard">
              Create New Payroll Run
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>Export ECR (EPFO)</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>Generate All Form 16</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Payroll Runs Table */}
      <Typography variant="h6" gutterBottom>All Payroll Runs</Typography>
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Run Number</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Employees</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Gross</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Net Payable</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No payroll runs yet. Create your first run above.
                </TableCell>
              </TableRow>
            )}
            {runs.map(run => (
              <TableRow key={run.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{run.runNumber}</TableCell>
                <TableCell>{run.payrollMonth}/{run.payrollYear}</TableCell>
                <TableCell align="center">{run.totalEmployees || 0}</TableCell>
                <TableCell align="right">{fmtRs(run.totalGrossEarnings)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtRs(run.totalNetPayable)}</TableCell>
                <TableCell>
                  <Chip
                    label={run.status}
                    color={
                      run.status === 'DISBURSED' ? 'success' :
                      run.status === 'APPROVED' ? 'info' :
                      run.status === 'PENDING_APPROVAL' ? 'warning' :
                      run.status === 'PROCESSING' ? 'secondary' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {run.status === 'PENDING_APPROVAL' && (
                      <Button size="small" variant="contained" startIcon={<ApproveIcon />}
                        onClick={() => setApprovalDialog({ open: true, run })}>
                        Approve
                      </Button>
                    )}
                    {run.status === 'APPROVED' && (
                      <Button size="small" variant="contained" color="success"
                        onClick={() => handleDisburse(run)}>
                        Disburse
                      </Button>
                    )}
                    <Button size="small" variant="outlined">View</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Approval Confirmation Dialog */}
      <Dialog open={approvalDialog.open} onClose={() => setApprovalDialog({ open: false, run: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Payroll Run</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {approvalDialog.run && (
            <Stack spacing={2}>
              <Alert severity="info">
                Once approved, payroll moves to disbursal stage and cannot be rolled back.
              </Alert>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  {[
                    ['Run Number', approvalDialog.run.runNumber],
                    ['Period', `${approvalDialog.run.payrollMonth}/${approvalDialog.run.payrollYear}`],
                    ['Employees', approvalDialog.run.totalEmployees],
                    ['Total Gross', fmtRs(approvalDialog.run.totalGrossEarnings)],
                    ['Total Net', fmtRs(approvalDialog.run.totalNetPayable)],
                  ].map(([label, value]) => (
                    <Stack key={label} direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog({ open: false, run: null })}>Cancel</Button>
          <Button variant="contained" onClick={confirmApproval} disabled={loading} startIcon={<ApproveIcon />}>
            {loading ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
