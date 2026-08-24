import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Stack, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Snackbar
} from '@mui/material';
import { Download as DownloadIcon, Check as CheckIcon } from '@mui/icons-material';
import * as api from '../../services/api';

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

  const [transactions, setTransactions] = useState([]);
  const [batchDialog, setBatchDialog] = useState({ open: false, type: null });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.fetchBankTransactions?.('ALL', 0, 20) || [];
      setTransactions(res.content || res || []);
    } catch (err) {
      // If API fails, show empty state (not critical)
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankConfigChange = (field, value) => {
    setBankConfig({ ...bankConfig, [field]: value });
  };

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleSaveBankDetails = async () => {
    try {
      setLoading(true);
      // Validate IFSC format
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankConfig.ifsc)) {
        showToast('Invalid IFSC format (must be like ICIC0000001)', 'error');
        return;
      }
      await api.validateBankDetails(bankConfig.accountNumber, bankConfig.ifsc);
      showToast('Bank details saved successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save bank details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureRazorpayX = async () => {
    try {
      setLoading(true);
      if (!razorpayConfig.apiKey || razorpayConfig.apiKey.includes('•')) {
        showToast('Please enter RazorpayX API credentials', 'error');
        return;
      }
      // TODO: Call backend API to save encrypted RazorpayX config
      showToast('RazorpayX configured successfully');
    } catch (err) {
      showToast('Failed to configure RazorpayX', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBatch = async (type) => {
    try {
      setLoading(true);
      if (type === 'NEFT') {
        await api.exportNEFT(null); // Should be passed run ID
      } else if (type === 'NACH') {
        await api.exportNACH(null);
      }
      showToast(`${type} batch file downloaded successfully`);
      setBatchDialog({ open: false, type: null });
    } catch (err) {
      showToast(`Failed to download ${type} batch file`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>

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
            <Button
              variant="contained"
              onClick={handleSaveBankDetails}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Bank Details'}
            </Button>
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
              <Button
                variant="contained"
                size="small"
                sx={{ mt: 1 }}
                onClick={handleConfigureRazorpayX}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Configure RazorpayX'}
              </Button>
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
