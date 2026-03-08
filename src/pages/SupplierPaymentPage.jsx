import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Chip, InputAdornment, Stack, Card, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Zoom,
  Divider, IconButton, Badge, Fade
} from '@mui/material';
import {
  ReceiptLong, History, Payment, SentimentSatisfiedAlt,
  Print, FileDownload, InfoOutlined, AccountBalance,
  ArrowForward, FilterList, Wallet, LocalOffer,
  CheckCircleOutline, Close, PictureAsPdf, Dashboard
} from '@mui/icons-material';

// --- SCHEMA & INITIAL MOCK DATA ---
const INITIAL_SUPPLIERS = [
  { id: 1, name: 'Sadhana Silk Mills', balance: 45000, advanceCredit: 5000, lastPayment: '2026-02-15' },
  { id: 2, name: 'Metro Fabrics', balance: 12000, advanceCredit: 0, lastPayment: '2026-02-28' },
  { id: 3, name: 'Royal Trimmings', balance: 0, advanceCredit: 1200, lastPayment: '2026-03-01' },
];

const INITIAL_PENDING_POS = [
  { id: 'PO-1001', supplierId: 1, date: '2026-01-15', total: 25000, due: 15000, status: 'PARTIAL' },
  { id: 'PO-1024', supplierId: 1, date: '2026-01-20', total: 30000, due: 30000, status: 'PENDING' },
  { id: 'PO-1105', supplierId: 2, date: '2026-02-05', total: 12000, due: 12000, status: 'PENDING' },
  { id: 'PO-1180', supplierId: 1, date: '2026-03-05', total: 5000, due: 5000, status: 'PENDING' },
];

const INITIAL_HISTORY = [
  { id: 'PMT-501', date: '2026-03-01 10:30 AM', amount: 5000, mode: 'UPI', type: 'Advance', supplierName: 'Sadhana Silk Mills', ref: 'UTR992831', status: 'SUCCESS' },
  { id: 'PMT-498', date: '2026-02-25 04:15 PM', amount: 15000, mode: 'Bank Transfer', type: 'Against PO', supplierName: 'Metro Fabrics', ref: 'CHQ-0012', status: 'SUCCESS' },
];

export default function FullSupplierManagement() {
  // --- DATABASE STATES ---
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [pendingPOs, setPendingPOs] = useState(INITIAL_PENDING_POS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  
  // --- TRANSACTION FORM STATES ---
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [isAdvance, setIsAdvance] = useState(false);
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [amount, setAmount] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // --- UI & REPORTING STATES ---
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [receiptData, setReceiptData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- BUSINESS LOGIC: DERIVATIONS ---
  const activeSupplier = useMemo(() => 
    suppliers.find(s => s.id === selectedSupplierId), [selectedSupplierId, suppliers]);

  const supplierPOs = useMemo(() => 
    pendingPOs.filter(po => po.supplierId === selectedSupplierId), [selectedSupplierId, pendingPOs]);

  const totalPayableSelected = useMemo(() => 
    pendingPOs.filter(po => selectedPOs.includes(po.id)).reduce((sum, po) => sum + po.due, 0), [selectedPOs, pendingPOs]);

  // --- CORE ENGINE: EXECUTE TRANSACTION ---
  const handlePaymentSubmit = async () => {
    if (!selectedSupplierId || !amount || parseFloat(amount) <= 0) {
      setNotification({ open: true, message: 'Please provide a valid supplier and amount.', severity: 'error' });
      return;
    }

    setIsProcessing(true);
    
    // Simulate API Latency
    setTimeout(() => {
      const payAmount = parseFloat(amount);
      let remaining = payAmount;
      const updatedPOs = [...pendingPOs];

      // 1. Allocation Logic (FIFO for Selected POs)
      if (!isAdvance && selectedPOs.length > 0) {
        for (let poId of selectedPOs) {
          const poIndex = updatedPOs.findIndex(p => p.id === poId);
          if (poIndex > -1 && remaining > 0) {
            const currentDue = updatedPOs[poIndex].due;
            const paymentApplied = Math.min(currentDue, remaining);
            updatedPOs[poIndex].due -= paymentApplied;
            remaining -= paymentApplied;
          }
        }
      }

      // 2. Update Master States
      setPendingPOs(updatedPOs.filter(p => p.due > 0)); // Auto-remove fully paid

      setSuppliers(prev => prev.map(s => {
        if (s.id === selectedSupplierId) {
          return {
            ...s,
            balance: isAdvance ? s.balance : Math.max(0, s.balance - (payAmount - remaining)),
            advanceCredit: s.advanceCredit + (isAdvance ? payAmount : remaining),
            lastPayment: new Date().toISOString().split('T')[0]
          };
        }
        return s;
      }));

      // 3. Generate History Record
      const transactionId = `TXN-${Date.now().toString().slice(-6)}`;
      const newTx = {
        id: transactionId,
        date: new Date().toLocaleString(),
        amount: payAmount,
        mode: paymentMode,
        type: isAdvance ? 'Direct Advance' : (remaining > 0 ? 'Split Pay + Adv' : 'PO Settlement'),
        supplierName: activeSupplier.name,
        ref: refNumber || 'N/A',
        remarks: remarks,
        status: 'SUCCESS'
      };

      setHistory([newTx, ...history]);
      setReceiptData(newTx); // Trigger receipt modal
      
      // 4. Reset Form
      setAmount('');
      setRefNumber('');
      setRemarks('');
      setSelectedPOs([]);
      setIsAdvance(false);
      setIsProcessing(false);
      setNotification({ open: true, message: 'Payment Reconciled Successfully', severity: 'success' });
    }, 800);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
      
      {/* 1. TOP DASHBOARD RIBBON */}
      
      <Grid container spacing={2} mb={4}>
        {[
          { label: 'Accounts Payable', val: suppliers.reduce((a,b)=>a+b.balance,0), color: '#e11d48', icon: <Wallet /> },
          { label: 'Advance Credits', val: suppliers.reduce((a,b)=>a+b.advanceCredit,0), color: '#059669', icon: <AccountBalance /> },
          { label: 'Pending Orders', val: pendingPOs.length, color: '#2563eb', icon: <ReceiptLong />, isQty: true }
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: `${stat.color}15`, p: 1.5, borderRadius: 3, color: stat.color }}>{stat.icon}</Box>
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>{stat.label}</Typography>
                <Typography variant="h5" fontWeight={900}>{stat.isQty ? stat.val : `₹${stat.val.toLocaleString()}`}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* 2. TRANSACTION CONSOLE (LEFT) */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0', position: 'sticky', top: 24 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={3}>
                <Payment color="primary" />
                <Typography variant="h6" fontWeight={900}>Payment Console</Typography>
            </Stack>

            <Stack spacing={2.5}>
              <TextField
                select fullWidth label="Select Supplier"
                value={selectedSupplierId}
                onChange={(e) => { setSelectedSupplierId(e.target.value); setSelectedPOs([]); }}
                sx={formInputSx}
              >
                {suppliers.map(s => (
                  <MenuItem key={s.id} value={s.id} sx={{ justifyContent: 'space-between' }}>
                    <Typography fontWeight={600}>{s.name}</Typography>
                    <Chip size="small" label={`₹${s.balance}`} color={s.balance > 0 ? "error" : "default"} variant="outlined" sx={{ ml: 2 }} />
                  </MenuItem>
                ))}
              </TextField>

              {activeSupplier && (
                <Fade in={!!activeSupplier}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                        <Stack direction="row" justifyContent="space-between" mb={1}>
                            <Typography variant="caption" fontWeight={700}>Supplier Credit:</Typography>
                            <Typography variant="caption" fontWeight={900} color="success.main">₹{activeSupplier.advanceCredit}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" fontWeight={700}>Last Transact:</Typography>
                            <Typography variant="caption">{activeSupplier.lastPayment}</Typography>
                        </Stack>
                    </Box>
                </Fade>
              )}

              <TextField
                fullWidth label="Amount to Transfer" type="number"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                sx={formInputSx}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                    select sx={{ flex: 1, ...formInputSx }} label="Mode"
                    value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                >
                    <MenuItem value="UPI">UPI/QR</MenuItem>
                    <MenuItem value="BANK">IMPS/NEFT</MenuItem>
                    <MenuItem value="CASH">Cash</MenuItem>
                </TextField>
                <TextField
                    sx={{ flex: 1, ...formInputSx }} label="Ref No."
                    value={refNumber} onChange={(e) => setRefNumber(e.target.value)}
                />
              </Stack>

              <TextField 
                fullWidth label="Internal Remarks" 
                multiline rows={2} value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                sx={formInputSx} 
              />

              <Box 
                onClick={() => { setIsAdvance(!isAdvance); if(!isAdvance) setSelectedPOs([]); }}
                sx={{ 
                  p: 2, borderRadius: 4, cursor: 'pointer', border: '2px solid',
                  borderColor: isAdvance ? '#2563eb' : '#f1f5f9',
                  bgcolor: isAdvance ? '#eff6ff' : '#f8fafc',
                  transition: '0.2s ease-in-out'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Checkbox checked={isAdvance} sx={{ p: 0 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={900} color={isAdvance ? '#2563eb' : 'inherit'}>Mark as Advance</Typography>
                    <Typography variant="caption" color="text.secondary">Funds will be parked in supplier's wallet.</Typography>
                  </Box>
                </Stack>
              </Box>

              <Button 
                variant="contained" fullWidth size="large"
                onClick={handlePaymentSubmit} disabled={isProcessing}
                sx={{ borderRadius: 4, py: 2, fontWeight: 900, textTransform: 'none', fontSize: '1.1rem', boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)' }}
              >
                {isProcessing ? 'Processing...' : 'Confirm & Reconcile'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* 3. RECONCILIATION & LOGS (RIGHT) */}
        <Grid item xs={12} lg={7}>
          <Stack spacing={4}>
            
            {/* Reconciliation Interface */}
            <Card variant="outlined" sx={{ borderRadius: 6, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={900}>Pending Reconciliation</Typography>
                    <Typography variant="caption" color="text.secondary">Select specific invoices to pay off</Typography>
                </Box>
                {selectedPOs.length > 0 && (
                  <Button variant="contained" color="success" onClick={() => setAmount(totalPayableSelected.toString())} sx={{ borderRadius: 2, fontWeight: 800 }}>
                    Pay Selected (₹{totalPayableSelected})
                  </Button>
                )}
              </Box>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ bgcolor: '#f8fafc' }} />
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Order Details</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Balance Due</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {supplierPOs.length > 0 ? supplierPOs.map((po) => (
                      <TableRow key={po.id} hover onClick={() => { if(!isAdvance) { setSelectedPOs(prev => prev.includes(po.id) ? prev.filter(x=>x!==po.id) : [...prev, po.id]) } }}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedPOs.includes(po.id)} disabled={isAdvance} />
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2" fontWeight={800}>{po.id}</Typography>
                            <Typography variant="caption" color="text.secondary">{po.date}</Typography>
                        </TableCell>
                        <TableCell>
                            <Chip label={po.status} size="small" color={po.status === 'PENDING' ? 'warning' : 'primary'} sx={{ fontSize: '0.65rem', fontWeight: 900 }} />
                        </TableCell>
                        <TableCell align="right">
                            <Typography variant="body2" fontWeight={900} color="error.main">₹{po.due.toLocaleString()}</Typography>
                        </TableCell>
                      </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                <SentimentSatisfiedAlt sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                                <Typography color="text.secondary">No pending invoices for this supplier.</Typography>
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            {/* History Feed */}
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} px={1}>
                    <Typography variant="subtitle1" fontWeight={900}>Transaction Audit Trail</Typography>
                    <Button size="small" startIcon={<FileDownload />}>Export CSV</Button>
                </Stack>
                <Stack spacing={2}>
                    {history.map((h) => (
                        <Paper key={h.id} variant="outlined" sx={{ p: 2, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s', '&:hover': { borderColor: '#2563eb', bgcolor: '#f8fafc' } }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Badge color="success" variant="dot" overlap="circular">
                                    <Box sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: 3 }}><ReceiptLong color="action" /></Box>
                                </Badge>
                                <Box>
                                    <Typography variant="body2" fontWeight={800}>{h.supplierName}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{h.date} • {h.id}</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#6366f1' }}>{h.type}</Typography>
                                </Box>
                            </Stack>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="subtitle1" fontWeight={900}>- ₹{h.amount.toLocaleString()}</Typography>
                                <Stack direction="row" gap={0.5} justifyContent="flex-end">
                                    <Chip label={h.mode} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />
                                    <IconButton size="small" onClick={() => setReceiptData(h)}><Print sx={{ fontSize: 16 }} /></IconButton>
                                </Stack>
                            </Box>
                        </Paper>
                    ))}
                </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* 4. DIGITAL RECEIPT MODAL */}
      <Dialog open={!!receiptData} onClose={() => setReceiptData(null)} PaperProps={{ sx: { borderRadius: 6, width: '100%', maxWidth: 450, p: 1 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={900}>Payment Voucher</Typography>
            <IconButton onClick={() => setReceiptData(null)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
            {receiptData && (
                <Box sx={{ p: 2 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <CheckCircleOutline sx={{ fontSize: 64, color: '#059669', mb: 1 }} />
                        <Typography variant="h4" fontWeight={900}>₹{receiptData.amount.toLocaleString()}</Typography>
                        <Typography variant="body2" color="text.secondary">Transaction Successful</Typography>
                    </Box>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    <Stack spacing={2}>
                        {[
                          { label: 'Supplier', val: receiptData.supplierName },
                          { label: 'Payment Date', val: receiptData.date },
                          { label: 'Reference ID', val: receiptData.id },
                          { label: 'Payment Mode', val: receiptData.mode },
                          { label: 'Ref/UTR Number', val: receiptData.ref },
                          { label: 'Type', val: receiptData.type },
                        ].map((row, i) => (
                            <Stack key={i} direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                                <Typography variant="body2" fontWeight={800}>{row.val}</Typography>
                            </Stack>
                        ))}
                    </Stack>

                    {receiptData.remarks && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">Remarks:</Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{receiptData.remarks}</Typography>
                        </Box>
                    )}
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button fullWidth variant="outlined" startIcon={<Print />} sx={{ borderRadius: 3 }}>Print Voucher</Button>
            <Button fullWidth variant="contained" startIcon={<PictureAsPdf />} sx={{ borderRadius: 3 }}>Download PDF</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={notification.open} autoHideDuration={4000} 
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3, fontWeight: 700 }}>{notification.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// Custom CSS for standard inputs
const formInputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 4,
    bgcolor: 'white',
    transition: '0.2s',
    '&:hover fieldset': { borderColor: '#2563eb' },
    '&.Mui-focused fieldset': { borderWidth: '2px' }
  },
  '& .MuiInputLabel-root': { fontWeight: 600 }
};