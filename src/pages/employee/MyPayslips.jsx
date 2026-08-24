import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Alert,
  CircularProgress, Snackbar, Typography, Divider, LinearProgress, TextField, MenuItem
} from '@mui/material';
import { FileDownload as DownloadIcon, Visibility as ViewIcon } from '@mui/icons-material';
import * as api from '../../services/api';

const fmtRs = (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`;

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDialog, setViewDialog] = useState({ open: false, slip: null });
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => { fetchPayslips(); }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await api.fetchMyPayslips(0, 24);
      setPayslips(res?.content || res || []);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load payslips', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (slip) => {
    try {
      const full = await api.getMyPayslip(slip.id);
      setViewDialog({ open: true, slip: full });
    } catch {
      setViewDialog({ open: true, slip });
    }
  };

  const handleDownload = (slipId) => {
    window.open(`/api/payroll/slips/${slipId}/pdf`, '_blank');
  };

  const filteredSlips = payslips.filter(slip =>
    (!filterYear || slip.payrollYear === filterYear) &&
    (!filterMonth || slip.payrollMonth === filterMonth)
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>My Payslips</Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Download and view your payslips with complete earnings and deductions breakdown.
      </Alert>

      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          label="Year"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          sx={{ width: 150 }}
        >
          {[2024, 2025, 2026].map(y => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          sx={{ width: 150 }}
        >
          <MenuItem value="">All Months</MenuItem>
          {Array.from({ length: 12 }, (_, i) => (
            <MenuItem key={i + 1} value={i + 1}>
              {new Date(2024, i).toLocaleString('en-IN', { month: 'long' })}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" onClick={() => { setFilterYear(new Date().getFullYear()); setFilterMonth(new Date().getMonth() + 1); }}>
          Reset
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Slip Number</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Gross</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Deductions</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Net Salary</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && filteredSlips.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {payslips.length === 0 ? 'No payslips found. They will appear here after payroll is processed.' : 'No payslips match the selected filter.'}
                </TableCell>
              </TableRow>
            )}
            {filteredSlips.map(slip => (
              <TableRow key={slip.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{slip.slipNumber}</TableCell>
                <TableCell>{slip.payrollMonth}/{slip.payrollYear}</TableCell>
                <TableCell align="right">{fmtRs(slip.grossEarnings)}</TableCell>
                <TableCell align="right">{fmtRs(slip.totalDeductions)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtRs(slip.netSalary)}</TableCell>
                <TableCell>
                  <Chip
                    label={slip.payoutStatus}
                    color={['PAID','DISBURSED'].includes(slip.payoutStatus) ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<ViewIcon />} onClick={() => handleView(slip)}>View</Button>
                    <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleDownload(slip.id)}>PDF</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, slip: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Payslip — {viewDialog.slip?.slipNumber}</DialogTitle>
        <DialogContent>
          {viewDialog.slip && (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Period</Typography>
                <Typography variant="body2">{viewDialog.slip.payrollMonth}/{viewDialog.slip.payrollYear}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Working Days</Typography>
                <Typography variant="body2">{viewDialog.slip.workingDays}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Present Days</Typography>
                <Typography variant="body2">{viewDialog.slip.presentDays}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Gross Earnings</Typography>
                <Typography variant="body2" fontWeight={600}>{fmtRs(viewDialog.slip.grossEarnings)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total Deductions</Typography>
                <Typography variant="body2" color="error">{fmtRs(viewDialog.slip.totalDeductions)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body1" fontWeight={700}>Net Salary</Typography>
                <Typography variant="body1" fontWeight={700} color="success.main">{fmtRs(viewDialog.slip.netSalary)}</Typography>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog({ open: false, slip: null })}>Close</Button>
          {viewDialog.slip && (
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => handleDownload(viewDialog.slip.id)}>
              Download PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
