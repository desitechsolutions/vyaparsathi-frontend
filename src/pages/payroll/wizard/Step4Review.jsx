import React from 'react';
import {
  Box, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Alert, Stack, Chip, LinearProgress
} from '@mui/material';

export default function Step4Review({ payrollData, onDataChange }) {
  // Mock data for review
  const mockData = {
    runNumber: 'PAY-2026-08',
    period: 'August 2026',
    totalEmployees: 25,
    totalGross: 1250000,
    totalDeductions: 185000,
    totalNet: 1065000,
    employerContributions: 75000,
    totalCompanyCost: 1140000,
    employees: [
      { id: 1, name: 'John Doe', gross: 50000, deductions: 8000, net: 42000 },
      { id: 2, name: 'Jane Smith', gross: 55000, deductions: 9000, net: 46000 },
      { id: 3, name: 'Bob Wilson', gross: 48000, deductions: 7500, net: 40500 },
    ]
  };

  const impactPercentage = (mockData.totalDeductions / mockData.totalGross) * 100;
  const bankBalance = 5000000; // Mock bank balance
  const canDisburse = bankBalance >= mockData.totalNet;

  return (
    <Box>
      <h3>Step 4: Review & P&L Impact</h3>

      <Alert severity="info" sx={{ mb: 3 }}>
        Review the complete payroll calculation and financial impact before proceeding to disbursal.
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>Run Number</p>
              <h3 style={{ margin: '8px 0' }}>{mockData.runNumber}</h3>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>{mockData.period}</p>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>Total Employees</p>
              <h3 style={{ margin: '8px 0', color: '#1976d2' }}>{mockData.totalEmployees}</h3>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>Gross Earnings</p>
              <h3 style={{ margin: '8px 0' }}>₹{(mockData.totalGross / 100000).toFixed(1)}L</h3>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light' }}>
            <CardContent>
              <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>Net Payable</p>
              <h3 style={{ margin: '8px 0' }}>₹{(mockData.totalNet / 100000).toFixed(1)}L</h3>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <h4>Financial Breakdown</h4>
          <Stack spacing={2}>
            <div>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <span>Total Gross Earnings</span>
                <span sx={{ fontWeight: 600 }}>₹{mockData.totalGross.toLocaleString()}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <span>Total Deductions</span>
                <span sx={{ fontWeight: 600, color: '#f44336' }}>-₹{mockData.totalDeductions.toLocaleString()}</span>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={impactPercentage}
                sx={{ mb: 2, height: '8px', borderRadius: '4px' }}
              />
              <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
                Deduction impact: {impactPercentage.toFixed(1)}%
              </p>
            </div>
            <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #eee' }} />
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <span sx={{ fontWeight: 600 }}>Net Payable</span>
              <span sx={{ fontWeight: 600, fontSize: '18px', color: '#4caf50' }}>₹{mockData.totalNet.toLocaleString()}</span>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <span>Employer Contributions</span>
              <span sx={{ fontWeight: 600 }}>₹{mockData.employerContributions.toLocaleString()}</span>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ pt: 2, borderTop: '1px solid #eee' }}>
              <span sx={{ fontWeight: 600 }}>Total Company Cost</span>
              <span sx={{ fontWeight: 600, fontSize: '18px' }}>₹{mockData.totalCompanyCost.toLocaleString()}</span>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Bank Balance Check */}
      <Card sx={{ mb: 3, bgcolor: canDisburse ? 'success.light' : 'error.light' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <div>
              <h4 style={{ margin: 0 }}>Bank Account Balance Check</h4>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                Available: ₹{bankBalance.toLocaleString()}
              </p>
            </div>
            <Chip
              label={canDisburse ? '✓ Sufficient Balance' : '✗ Insufficient Balance'}
              color={canDisburse ? 'success' : 'error'}
              sx={{ height: '40px', fontSize: '14px' }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Employee Breakdown */}
      <h4>Top Employees (Sample)</h4>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Gross</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Deductions</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Net</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockData.employees.map(emp => (
              <TableRow key={emp.id}>
                <TableCell>{emp.name}</TableCell>
                <TableCell align="right">₹{emp.gross.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ color: '#f44336' }}>₹{emp.deductions.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>₹{emp.net.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <p style={{ marginTop: '16px', color: '#666', fontSize: '12px' }}>
        <strong>Note:</strong> Review is complete. Proceed to the next step to select payout method and disburse.
      </p>
    </Box>
  );
}