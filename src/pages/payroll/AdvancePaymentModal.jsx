import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Stack, InputAdornment, Box 
} from '@mui/material';
import { RequestQuote, InfoOutlined } from '@mui/icons-material';

export default function AdvancePaymentModal({ open, onClose, staff, onConfirm }) {
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  // Reset fields when modal opens/staff changes
  useEffect(() => {
    if (open) {
      setAmount('');
      setRemarks('');
    }
  }, [open, staff]);

  const handleConfirm = () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;
    
    // onConfirm now matches the updated backend parameters
    onConfirm(staff.id, numAmount, remarks);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <RequestQuote color="warning" />
        Issue Staff Advance
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Staff Context Header */}
          <Box sx={{ p: 2, bgcolor: '#fff7ed', borderRadius: 2, border: '1px solid #ffedd5' }}>
            <Typography variant="subtitle2" color="#9a3412" fontWeight={700}>
              Staff: {staff?.name}
            </Typography>
            <Typography variant="caption" color="#c2410c">
              Current Outstanding Debt: <strong>₹{staff?.advanceBalance?.toLocaleString()}</strong>
            </Typography>
          </Box>

          <TextField 
            fullWidth 
            label="Advance Amount" 
            type="number" 
            value={amount}
            autoFocus
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            helperText="This will be added to the staff's total debt balance."
          />

          <TextField 
            fullWidth 
            label="Reason / Remarks" 
            placeholder="e.g. Medical emergency, Bike repair"
            multiline
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <InfoOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Advances are recovered during monthly payroll processing.
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="warning"
          disabled={!amount || Number(amount) <= 0}
          sx={{ fontWeight: 700, px: 3 }}
        >
          Confirm & Issue
        </Button>
      </DialogActions>
    </Dialog>
  );
}