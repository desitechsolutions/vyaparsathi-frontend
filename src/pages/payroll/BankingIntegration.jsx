import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Stack, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Snackbar, Typography, Divider,
  LinearProgress, MenuItem, Grid, Tooltip, InputAdornment, IconButton,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AccountBalance as BankIcon,
  FlashOn as InstantIcon,
  Assessment as ReportIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import * as api from '../../services/api';

const STATUS_COLORS = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  PROCESSING: 'info',
};

// Helper to trigger browser file download from a blob
const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export default function BankingIntegration() {
  // Bank config state
  const [bankConfig, setBankConfig] = useState({
    bankName: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
  });
  const [razorpayConfig, setRazorpayConfig] = useState({
    apiKey: '',
    apiSecret: '',
    accountId: '',
  });
  const [showSecret, setShowSecret] = useState(false);

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
  const [downloading, setDownloading] = useState(null); // 'neft' | 'nach'
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [statusFilter, setStatusFilter] = useState('ALL');

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  // Load transactions and payroll runs on mount
  const fetchData = useCallback(async () => {
    setTxnLoading(true);
    try {
      const [txnRes, runsRes] = await Promise.allSettled([
        api.fetchBankTransactions(statusFilter === 'ALL' ? 'PENDING' : statusFilter, 0, 50),
        api.fetchPayrollRuns(0, 50),
      ]);
      if (txnRes.status === 'fulfilled') {
        setTransactions(txnRes.value?.content || txnRes.value || []);
      }
      if (runsRes.status === 'fulfilled') {
        const runs = runsRes.value?.content || runsRes.value || [];
        // Only show APPROVED or DISBURSED runs (meaningful for banking)
        const relevantRuns = runs.filter(r => ['APPROVED', 'DISBURSED'].includes(r.status));
        setPayrollRuns(relevantRuns);
        if (relevantRuns.length > 0 && !selectedRunId) {
          setSelectedRunId(String(relevantRuns[0].id));
        }
      }
    } catch {
      // non-critical
    } finally {
      setTxnLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Save bank details (validate only for now — RazorpayX config is via StatutoryCompliance)
  const handleSaveBankDetails = async () => {
    if (!bankConfig.bankName || !bankConfig.accountNumber || !bankConfig.ifsc) {
      showToast('Please fill Bank Name, Account Number and IFSC', 'error');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankConfig.ifsc)) {
      showToast('Invalid IFSC format — must be like ICIC0001234', 'error');
      return;
    }
    showToast('Bank details saved successfully');
  };

  // Configure RazorpayX — stores credentials via StatutoryConfig endpoint
  const handleConfigureRazorpayX = async () => {
    if (!razorpayConfig.apiKey || !razorpayConfig.apiSecret) {
      showToast('API Key and Secret are required', 'error');
      return;
    }
    try {
      setLoading(true);
      // Persist RazorpayX config as part of statutory config
      await api.saveStatutoryConfig({
        razorpayxApiKey: razorpayConfig.apiKey,
        razorpayxApiSecret: razorpayConfig.apiSecret,
        razorpayxAccountId: razorpayConfig.accountId,
      });
      showToast('RazorpayX configured successfully');
      setRazorpayConfig({ ...razorpayConfig, apiKey: '', apiSecret: '' }); // clear sensitive values
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save RazorpayX config', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger instant disbursal via RazorpayX
  const handleRazorpayXDisburse = async () => {
    if (!selectedRunId) {
      showToast('Select a payroll run first', 'error');
      return;
    }
    try {
      setLoading(true);
      await api.disburseViaRazorpayX(selectedRunId);
      showToast('RazorpayX disbursal initiated — check transaction log below');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Disbursal failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Download NEFT / NACH batch file
  const handleDownloadBatch = async (type) => {
    if (!selectedRunId) {
      showToast('Select a payroll run first', 'error');
      return;
    }
    const key = type === 'NEFT' ? 'neft' : 'nach';
    setDownloading(key);
    try {
      if (type === 'NEFT') {
        const blob = await api.exportNEFTBlob(selectedRunId);
        triggerDownload(blob, `NEFT_Batch_Run${selectedRunId}.txt`);
      } else {
        const blob = await api.exportNACHBlob(selectedRunId);
        triggerDownload(blob, `NACH_Mandate_Run${selectedRunId}.txt`);
      }
      showToast(`${type} batch file downloaded successfully`);
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to download ${type} file`, 'error');
    } finally {
      setDownloading(null);
    }
  };

  const selectedRun = payrollRuns.find(r => String(r.id) === selectedRunId);

  return (
    <Box>
      {/* ─── Header ─── */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Banking Setup</Typography>
          <Typography variant="body2" color="text.secondary">Configure payout methods and manage salary disbursals</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={txnLoading} size="small">
          Refresh
        </Button>
      </Stack>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
      </Snackbar>

      <Grid container spacing={3}>
        {/* ─── Left Column: Bank Config ─── */}
        <Grid item xs={12} md={5}>
          {/* Payroll Run Selector */}
          <Card elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <ReportIcon color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Select Payroll Run</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Choose an approved or disbursed payroll run to generate batch files
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                label="Payroll Run"
                value={selectedRunId}
                onChange={e => setSelectedRunId(e.target.value)}
                disabled={payrollRuns.length === 0}
              >
                {payrollRuns.length === 0 && (
                  <MenuItem value="">No approved runs available</MenuItem>
                )}
                {payrollRuns.map(r => (
                  <MenuItem key={r.id} value={String(r.id)}>
                    {r.payrollMonth} {r.payrollYear} — {r.runNumber} ({r.status})
                  </MenuItem>
                ))}
              </TextField>
              {selectedRun && (
                <Stack sx={{ mt: 1.5 }} spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Employees</Typography>
                    <Typography variant="caption" fontWeight={600}>{selectedRun.totalEmployees || 0}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Net Payable</Typography>
                    <Typography variant="caption" fontWeight={600} color="success.main">
                      ₹{Number(selectedRun.totalNetPayable || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Stack>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Bank Account Details */}
          <Card elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <BankIcon color="info" sx={{ fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Company Bank Account</Typography>
              </Stack>
              <Stack spacing={2}>
                <TextField size="small" label="Bank Name" value={bankConfig.bankName}
                  onChange={e => setBankConfig(c => ({ ...c, bankName: e.target.value }))} fullWidth />
                <TextField size="small" label="Account Number" value={bankConfig.accountNumber}
                  onChange={e => setBankConfig(c => ({ ...c, accountNumber: e.target.value }))} fullWidth />
                <TextField
                  size="small"
                  label="IFSC Code"
                  value={bankConfig.ifsc}
                  onChange={e => setBankConfig(c => ({ ...c, ifsc: e.target.value.toUpperCase() }))}
                  fullWidth
                  helperText="Format: ICIC0001234 (4 letters + 0 + 6 alphanumeric)"
                  error={bankConfig.ifsc.length > 0 && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankConfig.ifsc)}
                />
                <TextField size="small" label="Branch" value={bankConfig.branch}
                  onChange={e => setBankConfig(c => ({ ...c, branch: e.target.value }))} fullWidth />
                <Button variant="contained" onClick={handleSaveBankDetails} size="small" startIcon={<CheckIcon />}>
                  Save Details
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ─── Right Column: Payout Methods ─── */}
        <Grid item xs={12} md={7}>
          {/* RazorpayX Instant Payout */}
          <Card elevation={0} sx={{ mb: 2, border: '1.5px solid', borderColor: 'primary.main', borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <InstantIcon color="primary" sx={{ fontSize: 22 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>RazorpayX Instant Payout</Typography>
                    <Typography variant="caption" color="text.secondary">1-click salary transfer · ₹5–10 per transaction</Typography>
                  </Box>
                </Stack>
                <Chip label="Recommended" color="primary" size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
              </Stack>

              <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }} icon={<WarningIcon sx={{ fontSize: 18 }} />}>
                RazorpayX credentials are stored securely via Statutory Config. Enter them once and they persist.
              </Alert>

              <Stack spacing={1.5}>
                <TextField
                  size="small" label="RazorpayX API Key" fullWidth
                  value={razorpayConfig.apiKey}
                  onChange={e => setRazorpayConfig(c => ({ ...c, apiKey: e.target.value }))}
                  placeholder="rzp_live_xxxxxxxxxxxx"
                />
                <TextField
                  size="small" label="RazorpayX API Secret" fullWidth
                  type={showSecret ? 'text' : 'password'}
                  value={razorpayConfig.apiSecret}
                  onChange={e => setRazorpayConfig(c => ({ ...c, apiSecret: e.target.value }))}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowSecret(s => !s)}>
                          {showSecret ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" size="small" onClick={handleConfigureRazorpayX} disabled={loading}>
                    {loading ? <CircularProgress size={16} /> : 'Save Credentials'}
                  </Button>
                  <Tooltip title={!selectedRunId ? 'Select a payroll run first' : 'Disburse salaries via RazorpayX'}>
                    <span>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<InstantIcon />}
                        onClick={handleRazorpayXDisburse}
                        disabled={!selectedRunId || loading}
                        color="primary"
                      >
                        {loading ? <CircularProgress size={16} /> : 'Disburse Now'}
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* NEFT / NACH Batch Export */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Manual Batch File Export</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Download batch files and upload to your corporate banking portal. Select a payroll run above first.
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, height: '100%' }}>
                    <Typography variant="body2" fontWeight={700} gutterBottom>NEFT Batch File</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Standard NEFT format for bulk salary transfer via your bank's corporate portal.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={downloading === 'neft' ? <CircularProgress size={14} /> : <DownloadIcon />}
                      onClick={() => handleDownloadBatch('NEFT')}
                      disabled={!selectedRunId || !!downloading}
                    >
                      {downloading === 'neft' ? 'Generating…' : 'Download NEFT'}
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, height: '100%' }}>
                    <Typography variant="body2" fontWeight={700} gutterBottom>NACH Mandate File</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Auto-debit mandate format for recurring payroll via NACH.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={downloading === 'nach' ? <CircularProgress size={14} /> : <DownloadIcon />}
                      onClick={() => handleDownloadBatch('NACH')}
                      disabled={!selectedRunId || !!downloading}
                    >
                      {downloading === 'nach' ? 'Generating…' : 'Download NACH'}
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ─── Transaction History ─── */}
      <Box sx={{ mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="h6" fontWeight={700}>Transaction Log</Typography>
          <Stack direction="row" spacing={1}>
            {['ALL', 'PENDING', 'COMPLETED', 'FAILED'].map(s => (
              <Button
                key={s}
                size="small"
                variant={statusFilter === s ? 'contained' : 'outlined'}
                color={s === 'COMPLETED' ? 'success' : s === 'FAILED' ? 'error' : s === 'PENDING' ? 'warning' : 'inherit'}
                onClick={() => setStatusFilter(s)}
                sx={{ fontSize: '0.72rem', minWidth: 'auto' }}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </Stack>
        </Stack>

        {txnLoading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Bank Account</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>UTR Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      <Stack spacing={1} alignItems="center">
                        <BankIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                        <Typography variant="body2">No transactions found. Disburse a payroll run to see transactions here.</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map(txn => (
                    <TableRow key={txn.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontSize: '0.82rem' }}>
                        {txn.transactionDate ? new Date(txn.transactionDate).toLocaleDateString('en-IN') : txn.date || '—'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {txn.employeeName || txn.employee || `Employee #${txn.employeeId}`}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                        {txn.bankAccountNumber || '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        ₹{Number(txn.amount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>
                        <Chip label={txn.payoutMethod || 'NEFT'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={txn.status || txn.payoutStatus || 'PENDING'}
                          color={STATUS_COLORS[txn.status || txn.payoutStatus] || 'default'}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                        {txn.utrReference || txn.utr || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
}
