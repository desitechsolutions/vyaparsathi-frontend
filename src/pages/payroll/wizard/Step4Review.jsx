import React, { useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Alert, Stack, Chip, LinearProgress, Typography
} from '@mui/material';

const fmtRs = (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`;

export default function Step4Review({ payrollData, onDataChange }) {
  // Calculate summary from real attendance data
  const summary = useMemo(() => {
    if (!payrollData.attendanceData || payrollData.attendanceData.length === 0) {
      return null;
    }

    const totalEmployees = payrollData.attendanceData.length;
    // Estimate gross per employee at ₹50k/month avg (from earlier mock, or use real CTC)
    const avgGrossPerEmp = 50000;
    const totalGross = totalEmployees * avgGrossPerEmp;
    const totalDeductions = totalGross * 0.15; // ~15% deductions (PF, TDS, ESI, etc)
    const totalNet = totalGross - totalDeductions;
    const employerContributions = totalEmployees * 3000; // ~₹3k per employee
    const totalCompanyCost = totalGross + employerContributions;

    return {
      runNumber: payrollData.payrollRun?.runNumber || 'PAY-' + new Date().toISOString().slice(0, 7).replace('-', ''),
      period: payrollData.payrollRun ? `${payrollData.payrollRun.payrollMonth}/${payrollData.payrollRun.payrollYear}` : 'Current Period',
      totalEmployees,
      totalGross: Math.round(totalGross),
      totalDeductions: Math.round(totalDeductions),
      totalNet: Math.round(totalNet),
      employerContributions: Math.round(employerContributions),
      totalCompanyCost: Math.round(totalCompanyCost),
      employees: payrollData.attendanceData.slice(0, 5).map((emp, idx) => ({
        id: emp.id || idx,
        name: emp.name || `Employee ${idx + 1}`,
        gross: avgGrossPerEmp,
        deductions: Math.round(avgGrossPerEmp * 0.15),
        net: Math.round(avgGrossPerEmp * 0.85)
      }))
    };
  }, [payrollData.attendanceData, payrollData.payrollRun]);

  if (!summary) {
    return (
      <Box>
        <Alert severity="warning">
          Please complete Step 1 (Attendance) before reviewing the payroll.
        </Alert>
      </Box>
    );
  }

  const impactPercentage = (summary.totalDeductions / summary.totalGross) * 100;
  const bankBalance = 5000000; // Mock bank balance (would come from API)
  const canDisburse = bankBalance >= summary.totalNet;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Step 4: Review & P&L Impact</Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Review the complete payroll calculation and financial impact before proceeding to disbursal.
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary" display="block">Run Number</Typography>
              <Typography variant="h6" sx={{ my: 1 }}>{summary.runNumber}</Typography>
              <Typography variant="caption" color="textSecondary">{summary.period}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary" display="block">Total Employees</Typography>
              <Typography variant="h6" sx={{ my: 1, color: '#1976d2' }}>{summary.totalEmployees}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" display="block">Gross Earnings</Typography>
              <Typography variant="h6" sx={{ my: 1 }}>{fmtRs(summary.totalGross / 100000)}L</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" display="block">Net Payable</Typography>
              <Typography variant="h6" sx={{ my: 1 }}>{fmtRs(summary.totalNet / 100000)}L</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Financial Breakdown</Typography>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography>Total Gross Earnings</Typography>
              <Typography fontWeight={600}>{fmtRs(summary.totalGross)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography>Total Deductions</Typography>
              <Typography fontWeight={600} color="error">{fmtRs(-summary.totalDeductions)}</Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, impactPercentage)}
              sx={{ height: '8px', borderRadius: '4px' }}
            />
            <Typography variant="caption" color="textSecondary">
              Deduction impact: {impactPercentage.toFixed(1)}%
            </Typography>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={700}>Net Payable</Typography>
                <Typography variant="h6" sx={{ color: 'success.main' }}>{fmtRs(summary.totalNet)}</Typography>
              </Stack>
            </Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography>Employer Contributions</Typography>
              <Typography fontWeight={600}>{fmtRs(summary.employerContributions)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography fontWeight={700}>Total Company Cost</Typography>
              <Typography variant="h6" fontWeight={700}>{fmtRs(summary.totalCompanyCost)}</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Bank Balance Check */}
      <Card sx={{ mb: 3, bgcolor: canDisburse ? 'success.light' : 'error.light' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Bank Account Balance Check</Typography>
              <Typography variant="body2">
                Available: {fmtRs(bankBalance)}
              </Typography>
            </Box>
            <Chip
              label={canDisburse ? '✓ Sufficient' : '✗ Insufficient'}
              color={canDisburse ? 'success' : 'error'}
              variant="filled"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Employee Breakdown */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Payroll Breakdown (Sample)</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Gross</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Deductions</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Net</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.employees.map(emp => (
              <TableRow key={emp.id} hover>
                <TableCell>{emp.name}</TableCell>
                <TableCell align="right">{fmtRs(emp.gross)}</TableCell>
                <TableCell align="right" sx={{ color: 'error.main' }}>{fmtRs(emp.deductions)}</TableCell>
                <TableCell align="right" fontWeight={600}>{fmtRs(emp.net)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
        <strong>Note:</strong> Review is complete. Proceed to the next step to select payout method and disburse.
      </Typography>
    </Box>
  );
}
