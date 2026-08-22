import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Button, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Alert, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Snackbar
} from '@mui/material';
import { CheckCircle as ApproveIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function PayrollAdminDashboard() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [approvalDialog, setApprovalDialog] = useState({ open: false, run: null });

  useEffect(() => {
    fetchPayrollRuns();
  }, []);

  const fetchPayrollRuns = async () => {
    try {
      setLoading(true);
      const response = await api.fetchPayrollRuns(0, 20);
      setRuns(response.content || response);
    } catch (error) {
      console.error('Failed to fetch payroll runs:', error);
      setToast({ open: true, message: 'Failed to load payroll runs', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRun = (run) => {
    setApprovalDialog({ open: true, run });
  };

  const confirmApproval = async () => {
    try {
      setLoading(true);
      await api.approvePayrollRun(approvalDialog.run.id, null);
      setToast({ open: true, message: 'Payroll run approved successfully', severity: 'success' });
      setApprovalDialog({ open: false, run: null });
      fetchPayrollRuns();
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.message || 'Failed to approve payroll run', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && runs.length === 0) return <CircularProgress />;

  return (
    <Box>
      <h1>Payroll Admin Dashboard</h1>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>

      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>Pending Approval</p>
              <h2 style={{ margin: '8px 0' }}>1</h2>
              <Chip label="September 2026" size="small" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>This Month Payroll</p>
              <h2 style={{ margin: '8px 0' }}>₹1,065,000</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>25 employees</p>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>Disbursed This Year</p>
              <h2 style={{ margin: '8px 0' }}>₹9.45L</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>8 months</p>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>Pending Compliance</p>
              <h2 style={{ margin: '8px 0' }}>2</h2>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label="ECR" size="small" variant="outlined" />
                <Chip label="ESIC" size="small" variant="outlined" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <h3>Quick Actions</h3>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained">Create New Payroll Run</Button>
            <Button variant="outlined">Generate All Form16</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>Export Compliance Reports</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Payroll Runs */}
      <h3>Payroll Runs</h3>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Employees</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Gross Earnings</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Net Payable</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runs.map(run => (
              <TableRow key={run.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{run.payrollMonth} {run.payrollYear}</TableCell>
                <TableCell align="center">{run.totalEmployees}</TableCell>
                <TableCell align="right">₹{(run.totalGrossEarnings?.toNumber() / 100000 || 0).toFixed(2)}L</TableCell>
                <TableCell align="right">₹{(run.totalNetPayable?.toNumber() / 100000 || 0).toFixed(2)}L</TableCell>
                <TableCell>
                  <Chip
                    label={run.status}
                    color={run.status === 'DISBURSED' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {run.status === 'DRAFT' && (
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" onClick={() => handleApproveRun(run)}>
                        Approve
                      </Button>
                      <Button size="small" variant="outlined">View</Button>
                    </Stack>
                  )}
                  {run.status !== 'DRAFT' && (
                    <Button size="small" variant="outlined">View</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onClose={() => setApprovalDialog({ open: false, run: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Payroll Run</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {approvalDialog.run && (
            <Stack spacing={2}>
              <Alert severity="info">
                Review the payroll summary before approval. Once approved, the payroll will move to disbursal.
              </Alert>
              <div>
                <p style={{ fontWeight: 600 }}>Period: {approvalDialog.run.payrollMonth} {approvalDialog.run.payrollYear}</p>
                <p>Employees: {approvalDialog.run.totalEmployees}</p>
                <p>Total Gross: ₹{(approvalDialog.run.totalGrossEarnings?.toNumber() || 0).toLocaleString()}</p>
                <p>Total Net: ₹{(approvalDialog.run.totalNetPayable?.toNumber() || 0).toLocaleString()}</p>
              </div>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog({ open: false, run: null })}>Cancel</Button>
          <Button variant="contained" onClick={confirmApproval} startIcon={<ApproveIcon />}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
