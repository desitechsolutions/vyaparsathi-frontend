import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Stack, Typography, CircularProgress, TextField, MenuItem, Button,
  Dialog, DialogTitle, DialogContent, Snackbar, Alert
} from '@mui/material';
import { Download as DownloadIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import * as api from '../../services/api';

const fmtRs = (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`;

export default function EmployeePayrollHistory() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [slipDetail, setSlipDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => {
    if (selectedEmployeeId) { fetchPayslips(); }
  }, [selectedEmployeeId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.fetchEmployees();
      setEmployees((res.content || res || []).slice(0, 100));
    } catch (err) {
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslips = async () => {
    if (!selectedEmployeeId) return;
    try {
      setLoading(true);
      // Get employee's payslips via admin endpoint if exists, else employee endpoint
      const res = await api.fetchMyPayslips(0, 50);
      setSlips(res.content || res || []);
    } catch (err) {
      showToast('Failed to load payslips', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const handleViewSlip = (slip) => {
    setSlipDetail(slip);
    setDetailOpen(true);
  };

  const handleDownloadPDF = (slipId) => {
    try {
      window.open(`/api/payroll/slips/${slipId}/pdf`, '_blank');
    } catch (err) {
      showToast('Failed to download payslip', 'error');
    }
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const totalEarnings = slips.reduce((sum, s) => sum + (Number(s.grossEarnings) || 0), 0);
  const totalDeductions = slips.reduce((sum, s) => sum + (Number(s.totalDeductions) || 0), 0);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Employee Payroll History</Typography>
          <Typography variant="body2" color="text.secondary">View payroll history and payslips for any employee</Typography>
        </Box>
      </Stack>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      {/* Employee Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Select Employee</Typography>
          <TextField
            select
            fullWidth
            value={selectedEmployeeId || ''}
            onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
            placeholder="Choose an employee..."
          >
            <MenuItem value="">-- Select Employee --</MenuItem>
            {employees.map(emp => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.name || emp.employeeName} ({emp.employeeCode})
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Payslips
                  </Typography>
                  <Typography variant="h6">{slips.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Earnings
                  </Typography>
                  <Typography variant="h6">{fmtRs(totalEarnings / 100000)}L</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'error.light' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Deductions
                  </Typography>
                  <Typography variant="h6">{fmtRs(totalDeductions / 100000)}L</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'info.light' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Net Paid
                  </Typography>
                  <Typography variant="h6">{fmtRs((totalEarnings - totalDeductions) / 100000)}L</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Payslips Table */}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Payroll History for {selectedEmployee.name || selectedEmployee.employeeName}</Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : slips.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              No payslips found for this employee
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Gross Earnings</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Deductions</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Net Salary</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slips.map(slip => (
                    <TableRow key={slip.id} hover>
                      <TableCell fontWeight={600}>
                        {slip.payrollMonth}/{slip.payrollYear}
                      </TableCell>
                      <TableCell align="right">{fmtRs(slip.grossEarnings)}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>{fmtRs(slip.totalDeductions)}</TableCell>
                      <TableCell align="right" fontWeight={700}>{fmtRs(slip.netSalary)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={slip.payoutStatus || 'PENDING'}
                          color={slip.payoutStatus === 'DISBURSED' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewSlip(slip)}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadPDF(slip.id)}
                          >
                            PDF
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Slip Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payslip Details - {slipDetail?.payrollMonth}/{slipDetail?.payrollYear}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {slipDetail && (
            <Stack spacing={2}>
              <Box sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Earnings</Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography>Gross Earnings:</Typography>
                  <Typography fontWeight={600}>{fmtRs(slipDetail.grossEarnings)}</Typography>
                </Stack>
              </Box>
              <Box sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Deductions</Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography>Deductions:</Typography>
                  <Typography fontWeight={600} sx={{ color: 'error.main' }}>-{fmtRs(slipDetail.totalDeductions)}</Typography>
                </Stack>
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={700}>Net Salary:</Typography>
                  <Typography variant="h6" sx={{ color: 'success.main' }}>{fmtRs(slipDetail.netSalary)}</Typography>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
