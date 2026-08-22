import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Stack, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import { Download as DownloadIcon, Check as CheckIcon } from '@mui/icons-material';

export default function BankingIntegration() {
  const [bankConfig, setBankConfig] = useState({
    bankName: 'ICICI Bank',
    accountNumber: '1234567890',
    ifsc: 'ICIC0000001',
    branch: 'Mumbai',
    payoutMethod: 'razorpayx',
  });

  const [razorpayConfig, setRazorpayConfig] = useState({
    apiKey: '••••••••••••••••',
    apiSecret: '••••••••••••••••',
    accountId: 'rzp_123456789'
  });

  const [transactions, setTransactions] = useState([
    { id: 1, date: '2024-09-15', employee: 'John Doe', amount: 50000, status: 'COMPLETED', utr: 'UTR123456' },
    { id: 2, date: '2024-09-15', employee: 'Jane Smith', amount: 55000, status: 'COMPLETED', utr: 'UTR123457' },
    { id: 3, date: '2024-09-14', employee: 'Bob Wilson', amount: 48000, status: 'FAILED', utr: 'N/A' }
  ]);

  const [batchDialog, setBatchDialog] = useState({ open: false, type: null });

  const handleBankConfigChange = (field, value) => {
    setBankConfig({ ...bankConfig, [field]: value });
  };

  const handleDownloadBatch = (type) => {
    alert(`Downloading ${type} batch file...`);
    setBatchDialog({ open: false, type: null });
  };

  return (
    <Box>
      <h1>Banking Integration & Payout Methods</h1>

      {/* Bank Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <h3>Bank Account Details</h3>
          <Stack spacing={2}>
            <TextField
              label="Bank Name"
              value={bankConfig.bankName}
              onChange={(e) => handleBankConfigChange('bankName', e.target.value)}
              fullWidth
            />
            <TextField
              label="Account Number"
              value={bankConfig.accountNumber}
              onChange={(e) => handleBankConfigChange('accountNumber', e.target.value)}
              fullWidth
            />
            <TextField
              label="IFSC Code"
              value={bankConfig.ifsc}
              onChange={(e) => handleBankConfigChange('ifsc', e.target.value)}
              fullWidth
            />
            <TextField
              label="Branch"
              value={bankConfig.branch}
              onChange={(e) => handleBankConfigChange('branch', e.target.value)}
              fullWidth
            />
            <Button variant="contained">Save Bank Details</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Payout Method Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <h3>Payout Method Configuration</h3>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select your preferred payout method for salary disbursement
          </Alert>
          
          <Stack spacing={2}>
            <div style={{ border: '1px solid #e0e0e0', padding: '12px', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>1-Click Direct Disbursal (RazorpayX)</h4>
              <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                Instant payout to employee bank accounts. Charges: ₹5-10 per transaction.
              </p>
              <TextField
                label="RazorpayX API Key"
                type="password"
                value={razorpayConfig.apiKey}
                size="small"
                fullWidth
                sx={{ mb: 1 }}
              />
              <TextField
                label="RazorpayX Secret"
                type="password"
                value={razorpayConfig.apiSecret}
                size="small"
                fullWidth
              />
              <Button variant="contained" size="small" sx={{ mt: 1 }}>Configure RazorpayX</Button>
            </div>

            <div style={{ border: '1px solid #e0e0e0', padding: '12px', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>NEFT Batch File Export</h4>
              <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                Download batch file for manual upload to your corporate banking portal.
              </p>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => setBatchDialog({ open: true, type: 'NEFT' })}>
                Download NEFT Batch
              </Button>
            </div>

            <div style={{ border: '1px solid #e0e0e0', padding: '12px', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>NACH Mandate File Export</h4>
              <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                For mandate-based recurring transfers. Requires employee mandate registration.
              </p>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => setBatchDialog({ open: true, type: 'NACH' })}>
                Download NACH File
              </Button>
            </div>
          </Stack>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardContent>
          <h3>Recent Transactions</h3>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>UTR Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map(txn => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.date}</TableCell>
                    <TableCell>{txn.employee}</TableCell>
                    <TableCell align="right">₹{txn.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={txn.status}
                        color={txn.status === 'COMPLETED' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{txn.utr}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Batch Download Dialog */}
      <Dialog open={batchDialog.open} onClose={() => setBatchDialog({ open: false, type: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Download {batchDialog.type} Batch File</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2 }}>
            {batchDialog.type === 'NEFT' 
              ? 'Download the NEFT batch file and upload it to your bank portal for processing.'
              : 'Download the NACH mandate file for mandate-based recurring transfers.'
            }
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDialog({ open: false, type: null })}>Cancel</Button>
          <Button variant="contained" onClick={() => handleDownloadBatch(batchDialog.type)}>
            Download File
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
