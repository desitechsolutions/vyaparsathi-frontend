import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Button, Stack, Chip, LinearProgress, Alert,
  CircularProgress, Snackbar, Typography
} from '@mui/material';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import * as api from '../../services/api';

const fmtRs = (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`;

const downloadPayslipPdf = async (slipId) => {
  try {
    const response = await api.getPayslipPdf(slipId);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payslip-${slipId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  } catch (err) {
    console.error('Failed to download payslip:', err);
  }
};

export default function ESSDashboard() {
  const [latestPayslip, setLatestPayslip] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [myPayslips, setMyPayslips] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [slipsRes, attendRes, leaveRes] = await Promise.allSettled([
        api.fetchMyPayslips(0, 6),
        api.getMyAttendance(currentMonth, currentYear),
        api.getLeaveBalance(null, null),
      ]);
      if (slipsRes.status === 'fulfilled') {
        const slips = slipsRes.value?.content || slipsRes.value || [];
        setMyPayslips(slips);
        setLatestPayslip(slips[0] || null);
      }
      if (attendRes.status === 'fulfilled') setAttendance(attendRes.value);
      if (leaveRes.status === 'fulfilled') setLeaveBalance(leaveRes.value);
    } catch (err) {
      setToast({ open: true, message: 'Some data could not be loaded', severity: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  const presentDays = attendance?.presentDays ?? 0;
  const workingDays = attendance?.workingDays ?? 26;
  const paidLeaves = attendance?.paidLeaves ?? 0;
  const lopDays = attendance?.lopDays ?? 0;

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>My Payroll Dashboard</Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Welcome to your employee self-service portal. View payslips, track your earnings and attendance.
      </Alert>

      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>

      {/* Key Metrics — from real API */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Latest Gross Earnings</Typography>
              <Typography variant="h5" fontWeight={700}>
                {latestPayslip ? fmtRs(latestPayslip.grossEarnings) : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {latestPayslip ? `${latestPayslip.payrollMonth}/${latestPayslip.payrollYear}` : 'No payslips yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Net Salary (Latest)</Typography>
              <Typography variant="h5" fontWeight={700}>
                {latestPayslip ? fmtRs(latestPayslip.netSalary) : '—'}
              </Typography>
              <Chip label={latestPayslip?.payoutStatus || 'N/A'} size="small" color="success" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Total Deductions</Typography>
              <Typography variant="h5" fontWeight={700}>
                {latestPayslip ? fmtRs(latestPayslip.totalDeductions) : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">PF + ESI + PT + TDS</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Total Payslips</Typography>
              <Typography variant="h4" fontWeight={700}>{myPayslips.length}</Typography>
              <Typography variant="caption" color="text.secondary">Available to download</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* YTD & Leave Balance */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">YTD Earnings</Typography>
              <Typography variant="h5" fontWeight={700}>
                {myPayslips.length > 0 ? fmtRs(myPayslips.reduce((sum, s) => sum + (s.grossEarnings || 0), 0)) : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Year to date</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">YTD Net Paid</Typography>
              <Typography variant="h5" fontWeight={700}>
                {myPayslips.length > 0 ? fmtRs(myPayslips.reduce((sum, s) => sum + (s.netSalary || 0), 0)) : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Cumulative</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Annual Leave Balance</Typography>
              <Typography variant="h5" fontWeight={700}>
                {leaveBalance?.annualDays ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">days remaining</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Sick Leave Balance</Typography>
              <Typography variant="h5" fontWeight={700}>
                {leaveBalance?.sickDays ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">days remaining</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attendance + Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Attendance — This Month</Typography>
              {attendance ? (
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <div>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2">Present Days</Typography>
                      <Typography variant="body2" fontWeight={600}>{presentDays}/{workingDays}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={workingDays > 0 ? (presentDays / workingDays) * 100 : 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </div>
                  <Stack direction="row" spacing={3}>
                    <Typography variant="body2" color="text.secondary">Paid Leaves: <strong>{paidLeaves}</strong></Typography>
                    <Typography variant="body2" color={lopDays > 0 ? 'error' : 'text.secondary'}>
                      LOP: <strong>{lopDays}</strong>
                    </Typography>
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No attendance data for this month.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Button
                  variant="contained" fullWidth startIcon={<FileDownloadIcon />}
                  disabled={!latestPayslip}
                  onClick={() => latestPayslip && downloadPayslipPdf(latestPayslip.id)}
                >
                  Download Latest Payslip
                </Button>
                <Button variant="outlined" fullWidth href="/employee/payslips">
                  View All Payslips ({myPayslips.length})
                </Button>
                <Button variant="outlined" fullWidth href="/employee/tax-declaration">Tax Declaration</Button>
                <Button variant="outlined" fullWidth href="/employee/loans">View My Loans</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Payslips */}
      {myPayslips.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Payslips</Typography>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {myPayslips.slice(0, 3).map(slip => (
                <Stack key={slip.id} direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                  <div>
                    <Typography variant="body2" fontWeight={600}>
                      {slip.payrollMonth}/{slip.payrollYear} Payslip
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Net: {fmtRs(slip.netSalary)}
                    </Typography>
                  </div>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={slip.payoutStatus} size="small" color="success" />
                    <Button size="small" startIcon={<FileDownloadIcon />}
                      onClick={() => downloadPayslipPdf(slip.id)}>
                      PDF
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
