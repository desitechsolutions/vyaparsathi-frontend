import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Stack, CircularProgress, Snackbar, Alert, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid,
  Button, Chip,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function PayrollReports() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.fetchPayrollRuns(0, 100);
      setRuns(data.content || data || []);
    } catch {
      showToast('Failed to load payroll reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const fmtRs = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // Derived summary from runs list
  const disbursedRuns = runs.filter(r => r.status === 'DISBURSED');
  const summary = {
    totalRuns: runs.length,
    totalEmployees: runs[0]?.totalEmployees || 0,
    totalPaidYtd: disbursedRuns.reduce((s, r) => s + (Number(r.totalNetPayable) || 0), 0),
    totalDeductionsYtd: disbursedRuns.reduce((s, r) => s + (Number(r.totalEmployeeDeductions) || 0), 0),
    totalGrossYtd: disbursedRuns.reduce((s, r) => s + (Number(r.totalGrossEarnings) || 0), 0),
    totalEmployerYtd: disbursedRuns.reduce((s, r) => s + (Number(r.totalEmployerContributions) || 0), 0),
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Payroll Reports & Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Year-to-date payroll summary across all runs</Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={fetchReports} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>


      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Payroll Runs
                </Typography>
                <Typography variant="h6">
                  {summary.totalRuns || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Employees
                </Typography>
                <Typography variant="h6">
                  {summary.totalEmployees || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Paid (YTD)
                </Typography>
                <Typography variant="h6">
                  {fmtRs(summary.totalPaidYtd)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Deductions (YTD)
                </Typography>
                <Typography variant="h6">
                  {fmtRs(summary.totalDeductionsYtd)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Detailed Run Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            All Payroll Runs
          </Typography>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Run Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Employees</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Gross</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Deductions</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Net Payable</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Employer Cost</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Download</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No payroll runs found. Start your first payroll run from the Dashboard.
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map(run => (
                    <TableRow key={run.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>{run.runNumber}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{run.payrollMonth} {run.payrollYear}</TableCell>
                      <TableCell align="right">{run.totalEmployees || 0}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>{fmtRs(run.totalGrossEarnings)}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>{fmtRs(run.totalEmployeeDeductions)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtRs(run.totalNetPayable)}</TableCell>
                      <TableCell align="right" sx={{ color: 'warning.main' }}>{fmtRs(run.totalEmployerContributions)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={run.status?.replace(/_/g, ' ')}
                          color={run.status === 'DISBURSED' ? 'success' : run.status === 'APPROVED' ? 'info' : run.status === 'PENDING_APPROVAL' ? 'warning' : 'default'}
                          size="small"
                          sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
                          onClick={() => api.exportECRFile(run.id)}
                          sx={{ fontSize: '0.72rem' }}
                        >
                          ECR
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

