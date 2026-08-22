import React, { useState } from 'react';
import {
  Box, Card, CardContent, Radio, RadioGroup, FormControlLabel, Button,
  Stack, Alert, LinearProgress, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';
import { Download as DownloadIcon, Check as CheckIcon } from '@mui/icons-material';

export default function Step5Disbursal({ payrollData, onDataChange }) {
  const [payoutMethod, setPayoutMethod] = useState('razorpayx');
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [disbursalProgress, setDisbursalProgress] = useState(0);

  const handleDisburse = async () => {
    // Simulate disbursement progress
    for (let i = 0; i <= 100; i += 10) {
      setDisbursalProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    onDataChange({ disbursalData: { payoutMethod, autoDispatch, status: 'completed' } });
  };

  const handleDownloadBatch = () => {
    // Mock batch file download
    alert('NEFT batch file would be downloaded (ABX_20260822_001.csv)');
  };

  return (
    <Box>
      <h3>Step 5: Disbursal & Payslip Dispatch</h3>

      <Alert severity="success" sx={{ mb: 3 }}>
        Select your preferred payout method and configure payslip delivery options.
      </Alert>

      {/* Payout Method Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <h4>Payout Method</h4>
          <RadioGroup value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
            <FormControlLabel
              value="razorpayx"
              control={<Radio />}
              label="1-Click Direct Disbursal (RazorpayX API)"
              sx={{ mb: 2 }}
            />
            <p style={{ marginLeft: '32px', marginTop: '-12px', color: '#666', fontSize: '13px' }}>
              Instant payout to employee bank accounts. Fastest option for 25 employees.
            </p>

            <FormControlLabel
              value="neft"
              control={<Radio />}
              label="NEFT Batch File Export (Corporate Banking)"
              sx={{ mb: 2 }}
            />
            <p style={{ marginLeft: '32px', marginTop: '-12px', color: '#666', fontSize: '13px' }}>
              Download NEFT batch file for your corporate bank account. Requires manual upload.
            </p>

            <FormControlLabel
              value="nach"
              control={<Radio />}
              label="NACH Mandate File Export"
              sx={{ mb: 2 }}
            />
            <p style={{ marginLeft: '32px', marginTop: '-12px', color: '#666', fontSize: '13px' }}>
              For mandate-based recurring transfers. Upload to your bank.
            </p>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Batch File Preview (if NEFT/NACH selected) */}
      {(payoutMethod === 'neft' || payoutMethod === 'nach') && (
        <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <div>
                <h4 style={{ margin: 0 }}>Batch File Ready</h4>
                <p style={{ margin: '4px 0', fontSize: '13px' }}>
                  {payoutMethod === 'neft' ? 'ABX_20260822_001.csv' : 'NACH_20260822_001.txt'}
                </p>
              </div>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadBatch}
              >
                Download
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Payslip Dispatch */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <h4>Payslip Dispatch</h4>
          <FormControlLabel
            control={
              <input
                type="checkbox"
                checked={autoDispatch}
                onChange={(e) => setAutoDispatch(e.target.checked)}
              />
            }
            label="Auto-dispatch payslips to employees via WhatsApp & Email"
            sx={{ mb: 2 }}
          />
          <p style={{ color: '#666', fontSize: '13px', marginTop: '-8px' }}>
            Employees will receive:
            <br />• WhatsApp: Quick summary link
            <br />• Email: PDF attachment + login link
          </p>
        </CardContent>
      </Card>

      {/* Disbursal Progress */}
      {disbursalProgress > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <h4 style={{ margin: 0 }}>Disbursal in Progress</h4>
              <Chip label={`${disbursalProgress}%`} />
            </Stack>
            <LinearProgress variant="determinate" value={disbursalProgress} sx={{ height: '8px', borderRadius: '4px' }} />
          </CardContent>
        </Card>
      )}

      {disbursalProgress === 100 && (
        <Card sx={{ mb: 3, bgcolor: 'success.light' }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CheckIcon sx={{ color: 'success.main', fontSize: '32px' }} />
              <div>
                <h4 style={{ margin: 0 }}>Payroll Disbursed Successfully</h4>
                <p style={{ margin: '4px 0', fontSize: '13px' }}>
                  Run: PAY-2026-08 | Date: Aug 22, 2026 | Total: ₹1,065,000
                </p>
              </div>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Disbursal Summary */}
      <h4>Disbursal Summary</h4>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Account</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>ICICI Corporate Account</TableCell>
              <TableCell align="right">₹1,065,000</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={disbursalProgress === 100 ? 'Disbursed' : 'Queued'}
                  color={disbursalProgress === 100 ? 'success' : 'default'}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Button */}
      <Stack direction="row" sx={{ mt: 3, gap: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleDisburse}
          disabled={disbursalProgress > 0}
          fullWidth
        >
          {disbursalProgress === 100 ? 'Payroll Complete' : 'Finalize & Disburse'}
        </Button>
      </Stack>

      <p style={{ marginTop: '16px', color: '#666', fontSize: '12px' }}>
        <strong>Note:</strong> Once finalized, payroll run status becomes DISBURSED and cannot be edited. Payslips will be generated and dispatched to employees.
      </p>
    </Box>
  );
}