import React, { useState } from 'react';
import {
  Box, Card, CardContent, Radio, RadioGroup, FormControlLabel, Button,
  Stack, Alert, LinearProgress, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Snackbar, Typography
} from '@mui/material';
import { Download as DownloadIcon, Check as CheckIcon } from '@mui/icons-material';
import * as api from '../../../services/api';

export default function Step5Disbursal({ payrollData, onDataChange }) {
  const [payoutMethod, setPayoutMethod] = useState('razorpayx');
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [disbursalProgress, setDisbursalProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const runId = payrollData?.payrollRun?.id;

  const handleDisburse = async () => {
    if (!runId) {
      setToast({ open: true, message: 'No payroll run found. Please complete earlier steps.', severity: 'error' });
      return;
    }
    try {
      setLoading(true);
      setDisbursalProgress(30);

      if (payoutMethod === 'razorpayx') {
        await api.disburseViaRazorpayX(runId);
      } else if (payoutMethod === 'neft') {
        await api.exportNEFT(runId);
      } else if (payoutMethod === 'nach') {
        await api.exportNACH(runId);
      }

      setDisbursalProgress(100);
      onDataChange({ disbursalData: { payoutMethod, autoDispatch, status: 'completed' } });
      setToast({ open: true, message: 'Payroll disbursed successfully!', severity: 'success' });
    } catch (err) {
      setToast({
        open: true,
        message: err.response?.data?.message || 'Disbursal failed. Please try again.',
        severity: 'error'
      });
      setDisbursalProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBatch = async () => {
    try {
      if (payoutMethod === 'neft') await api.exportNEFT(runId);
      else if (payoutMethod === 'nach') await api.exportNACH(runId);
    } catch (err) {
      setToast({ open: true, message: 'Failed to download batch file', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Step 5: Disbursal & Payslip Dispatch</Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        Select your preferred payout method and configure payslip delivery options.
      </Alert>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>

      {/* Payout Method */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Payout Method</Typography>
          <RadioGroup value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
            <FormControlLabel
              value="razorpayx"
              control={<Radio />}
              label="1-Click Direct Disbursal (RazorpayX API)"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block', mb: 2 }}>
              Instant payout to employee bank accounts. Fastest option.
            </Typography>

            <FormControlLabel
              value="neft"
              control={<Radio />}
              label="NEFT Batch File Export (Corporate Banking)"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block', mb: 2 }}>
              Download NEFT batch file for your corporate bank. Requires manual upload.
            </Typography>

            <FormControlLabel
              value="nach"
              control={<Radio />}
              label="NACH Mandate File Export"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
              For mandate-based recurring transfers. Upload to your bank.
            </Typography>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Batch File Download (if NEFT/NACH) */}
      {(payoutMethod === 'neft' || payoutMethod === 'nach') && runId && (
        <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <div>
                <Typography variant="subtitle1" fontWeight={600}>Batch File Ready</Typography>
                <Typography variant="caption">
                  Run: {payrollData?.payrollRun?.runNumber} | {payoutMethod.toUpperCase()} format
                </Typography>
              </div>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadBatch}>
                Download
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Payslip Dispatch */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Payslip Dispatch</Typography>
          <FormControlLabel
            control={
              <input
                type="checkbox"
                checked={autoDispatch}
                onChange={(e) => setAutoDispatch(e.target.checked)}
                style={{ marginRight: 8 }}
              />
            }
            label="Auto-dispatch payslips to employees via WhatsApp & Email"
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 3 }}>
            Employees will receive: WhatsApp quick summary • Email PDF attachment
          </Typography>
        </CardContent>
      </Card>

      {/* Progress */}
      {disbursalProgress > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">{disbursalProgress === 100 ? 'Disbursal Complete' : 'Disbursing...'}</Typography>
              <Chip label={`${disbursalProgress}%`} size="small" color={disbursalProgress === 100 ? 'success' : 'default'} />
            </Stack>
            <LinearProgress variant="determinate" value={disbursalProgress} sx={{ height: 8, borderRadius: 4 }} />
          </CardContent>
        </Card>
      )}

      {disbursalProgress === 100 && (
        <Card sx={{ mb: 3, bgcolor: 'success.light' }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CheckIcon sx={{ color: 'success.main', fontSize: 32 }} />
              <div>
                <Typography variant="subtitle1" fontWeight={700}>Payroll Disbursed Successfully</Typography>
                <Typography variant="caption">
                  Run: {payrollData?.payrollRun?.runNumber} | Status: DISBURSED
                </Typography>
              </div>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Summary Table */}
      <Typography variant="h6" gutterBottom>Disbursal Summary</Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Run</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Net Payable</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{payrollData?.payrollRun?.runNumber || '—'}</TableCell>
              <TableCell align="right">
                ₹{(Number(payrollData?.payrollRun?.totalNetPayable) || 0).toLocaleString('en-IN')}
              </TableCell>
              <TableCell>{payoutMethod.toUpperCase()}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={disbursalProgress === 100 ? 'DISBURSED' : 'QUEUED'}
                  color={disbursalProgress === 100 ? 'success' : 'default'}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" sx={{ gap: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleDisburse}
          disabled={loading || disbursalProgress === 100 || !runId}
          fullWidth
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {disbursalProgress === 100 ? 'Payroll Complete' : loading ? 'Disbursing...' : 'Finalize & Disburse'}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
        <strong>Note:</strong> Once finalized, payroll run status becomes DISBURSED and cannot be edited.
        Payslips will be generated and dispatched to employees automatically.
      </Typography>
    </Box>
  );
}
