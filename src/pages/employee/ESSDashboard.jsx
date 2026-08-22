import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Button, Stack, Chip, LinearProgress, Alert
} from '@mui/material';
import { FileDownload as FileDownloadIcon, Send as SendIcon } from '@mui/icons-material';

export default function ESSDashboard() {
  const [dashboardData, setDashboardData] = useState({
    currentMonth: 'September 2026',
    totalEarnings: 50000,
    totalDeductions: 8000,
    netSalary: 42000,
    pfBalance: 45000,
    advanceBalance: 0,
    lastPayslipDate: '2026-09-15',
    nextPayslipDate: '2026-10-15'
  });

  const [attendance, setAttendance] = useState({
    presentDays: 25,
    paidLeaves: 0,
    lopDays: 1,
    workingDays: 26
  });

  return (
    <Box>
      <h1>My Payroll Dashboard</h1>
      <Alert severity="info" sx={{ mb: 3 }}>
        Welcome to your employee self-service portal. View payslips, manage tax declarations, and track your earnings.
      </Alert>

      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>This Month Earnings</p>
              <h3 style={{ margin: '8px 0' }}>₹{dashboardData.totalEarnings.toLocaleString()}</h3>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>{dashboardData.currentMonth}</p>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>Net Salary</p>
              <h3 style={{ margin: '8px 0' }}>₹{dashboardData.netSalary.toLocaleString()}</h3>
              <Chip label="Payable" size="small" color="success" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>PF Balance</p>
              <h3 style={{ margin: '8px 0' }}>₹{dashboardData.pfBalance.toLocaleString()}</h3>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>Accumulated</p>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>Advance Balance</p>
              <h3 style={{ margin: '8px 0' }}>₹{dashboardData.advanceBalance.toLocaleString()}</h3>
              <Button size="small" sx={{ mt: 1 }}>Request Advance</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attendance & Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <h4>Attendance Summary</h4>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <div>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <span>Present Days</span>
                    <span sx={{ fontWeight: 600 }}>{attendance.presentDays}/{attendance.workingDays}</span>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(attendance.presentDays / attendance.workingDays) * 100}
                    sx={{ height: '8px', borderRadius: '4px' }}
                  />
                </div>
                <Stack direction="row" spacing={2}>
                  <span>Paid Leaves: {attendance.paidLeaves}</span>
                  <span style={{ color: '#f44336' }}>LOP: {attendance.lopDays}</span>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <h4>Quick Actions</h4>
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Button variant="contained" fullWidth startIcon={<FileDownloadIcon />}>
                  Download Latest Payslip
                </Button>
                <Button variant="outlined" fullWidth>View All Payslips</Button>
                <Button variant="outlined" fullWidth>Tax Declaration</Button>
                <Button variant="outlined" fullWidth>View My Loans</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <h4>Recent Activity</h4>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <div style={{ borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>September Payslip Dispatched</p>
              <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>15 Sept 2026 • Email, WhatsApp</p>
            </div>
            <div style={{ borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>August Payslip Viewed</p>
              <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>20 Aug 2026</p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Salary Advance Approved</p>
              <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>10 Aug 2026 • ₹5,000</p>
            </div>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
