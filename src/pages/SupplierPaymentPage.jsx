import React, { useState, useMemo } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Chip, InputAdornment, Divider, Stack, IconButton, Card, Alert
} from '@mui/material';
import {
  AccountBalanceWallet,
  ReceiptLong,
  History,
  CheckCircle,
  AccountCircle,
  FilterList,
  Add
} from '@mui/icons-material';

// --- DUMMY DATA FOR PREVIEW ---
const DUMMY_SUPPLIERS = [
  { id: 1, name: 'Sadhana Silk Mills', balance: 45000 },
  { id: 2, name: 'Metro Fabrics', balance: 12000 },
  { id: 3, name: 'Royal Trimmings', balance: 0 },
];

const DUMMY_PENDING_POS = [
  { id: 'PO-1001', date: '2026-01-15', total: 25000, paid: 10000, due: 15000 },
  { id: 'PO-1024', date: '2026-01-20', total: 30000, paid: 0, due: 30000 },
];

const DUMMY_HISTORY = [
  { id: 'PMT-501', date: '2026-01-10', amount: 5000, mode: 'UPI', type: 'Advance' },
  { id: 'PMT-498', date: '2026-01-02', amount: 15000, mode: 'Bank Transfer', type: 'Against PO' },
];

export default function SupplierPaymentPage() {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [isAdvance, setIsAdvance] = useState(false);
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [amount, setAmount] = useState('');

  // Bulk Selection Calculation
  const totalSelectedDue = useMemo(() => {
    return DUMMY_PENDING_POS
      .filter(po => selectedPOs.includes(po.id))
      .reduce((sum, po) => sum + po.due, 0);
  }, [selectedPOs]);

  const handlePOSlowToggle = (id) => {
    setSelectedPOs(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePaySelected = () => {
    setAmount(totalSelectedDue.toString());
    setIsAdvance(false);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#1e293b">
            Supplier Payments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage outflows, advance payments, and reconcile purchase orders.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<History />}>View Full Ledger</Button>
      </Stack>

      <Grid container spacing={3}>
        {/* LEFT: Payment Entry Form */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle1" fontWeight={800} mb={3}>Record New Transaction</Typography>
            
            <Stack spacing={3}>
              <TextField
                select
                fullWidth
                label="Supplier"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                sx={formInputSx}
              >
                {DUMMY_SUPPLIERS.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} (Due: ₹{s.balance})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Amount to Pay"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                sx={formInputSx}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="Mode"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    sx={formInputSx}
                  >
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="UPI">UPI / GPay</MenuItem>
                    <MenuItem value="BANK">Bank Transfer</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Ref Number"
                    placeholder="UTR / Check No."
                    sx={formInputSx}
                  />
                </Grid>
              </Grid>

              <Box 
                onClick={() => setIsAdvance(!isAdvance)}
                sx={{ 
                  p: 2, borderRadius: 2, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isAdvance ? 'primary.main' : '#e2e8f0',
                  bgcolor: isAdvance ? '#f0f9ff' : 'transparent',
                  transition: '0.2s'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Checkbox checked={isAdvance} size="small" sx={{ p: 0 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={700}>Mark as Advance Payment</Typography>
                    <Typography variant="caption" color="text.secondary">This will be added to supplier's credit balance.</Typography>
                  </Box>
                </Stack>
              </Box>

              <Button 
                variant="contained" 
                fullWidth 
                size="large"
                sx={{ borderRadius: 3, py: 1.5, fontWeight: 800, fontSize: '1rem', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
              >
                Execute Payment
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* RIGHT: Contextual Info & Bulk Selection */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            
            {/* Bulk Selection Section */}
            <Card variant="outlined" sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" fontWeight={800}>Pending Purchase Orders</Typography>
                {selectedPOs.length > 0 && (
                  <Button size="small" variant="contained" color="secondary" onClick={handlePaySelected}>
                    Pay Selected (₹{totalSelectedDue})
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#fff' }}>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>PO ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Due</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {DUMMY_PENDING_POS.map((po) => (
                      <TableRow key={po.id} hover onClick={() => handlePOSlowToggle(po.id)} sx={{ cursor: 'pointer' }}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedPOs.includes(po.id)} size="small" />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{po.id}</TableCell>
                        <TableCell>{po.date}</TableCell>
                        <TableCell align="right">₹{po.total}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={700} color="error.main">₹{po.due}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            {/* Recent History Table */}
            <Paper variant="outlined" sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" fontWeight={800}>Recent Transactions</Typography>
              </Box>
              <Table size="small">
                <TableBody>
                  {DUMMY_HISTORY.map((hist) => (
                    <TableRow key={hist.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{hist.date}</Typography>
                        <Typography variant="caption" color="text.secondary">{hist.id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={hist.type} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={800} color="success.main">- ₹{hist.amount}</Typography>
                        <Typography variant="caption">{hist.mode}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

const formInputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    bgcolor: 'white',
    '& fieldset': { borderColor: '#e2e8f0' },
  }
};