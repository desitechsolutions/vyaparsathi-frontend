import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Stack, MenuItem, Divider, Box, InputAdornment 
} from '@mui/material';
import { Payments, InfoOutlined, TrendingDown, TrendingUp } from '@mui/icons-material';

const PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER'];

export default function ProcessSalaryModal({ open, onClose, staff, period, onConfirm }) {
  const [formData, setFormData] = useState({
    bonus: 0,
    deductions: 0,
    advanceDeduction: 0,
    paymentMode: 'CASH',
    remarks: ''
  });

  // Reset form on open
  useEffect(() => {
    if (open) {
      setFormData({
        bonus: 0,
        deductions: 0,
        advanceDeduction: 0,
        paymentMode: 'CASH',
        remarks: ''
      });
    }
  }, [open, staff]);

  // Real-time calculation logic
  const baseSalary = staff?.baseSalary || 0;
  const currentAdvanceBalance = staff?.advanceBalance || 0;
  
  const netAmount = 
    Number(baseSalary) + 
    Number(formData.bonus) - 
    Number(formData.deductions) - 
    Number(formData.advanceDeduction);

  const handleConfirm = () => {
    // Final Payload aligned with PayrollRequestDto
    const payload = {
      staffId: staff.id,
      salaryMonth: period.month,
      salaryYear: period.year,
      bonus: Number(formData.bonus),
      deductions: Number(formData.deductions),
      advanceDeduction: Number(formData.advanceDeduction),
      paymentMode: formData.paymentMode,
      remarks: formData.remarks
    };
    onConfirm(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900, bgcolor: '#f8fafc', py: 2 }}>
        Process Salary: {period.month} {period.year}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={3}>
          {/* Staff Info Header */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #dbeafe' }}>
            <Typography variant="subtitle1" fontWeight={800} color="#1e3a8a">
              {staff?.name} ({staff?.role})
            </Typography>
            <Typography variant="body2" color="#1e40af">
              Monthly Base: <strong>₹{baseSalary.toLocaleString()}</strong>
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Bonus"
              type="number"
              fullWidth
              InputProps={{ startAdornment: <TrendingUp sx={{ mr: 1, color: 'success.main' }} fontSize="small" /> }}
              value={formData.bonus}
              onChange={(e) => setFormData({...formData, bonus: e.target.value})}
            />
            <TextField
              label="Other Deductions"
              type="number"
              fullWidth
              InputProps={{ startAdornment: <TrendingDown sx={{ mr: 1, color: 'error.main' }} fontSize="small" /> }}
              value={formData.deductions}
              onChange={(e) => setFormData({...formData, deductions: e.target.value})}
            />
          </Stack>

          <Divider>
            <Typography variant="caption" fontWeight={700} color="text.secondary">ADVANCE RECOVERY</Typography>
          </Divider>

          <Box sx={{ p: 2, borderRadius: 2, border: '1px dashed #e2e8f0' }}>
            <Typography variant="caption" display="block" mb={1} fontWeight={700}>
              Current Advance Balance: ₹{currentAdvanceBalance.toLocaleString()}
            </Typography>
            <TextField
              label="Deduct from Advance"
              type="number"
              fullWidth
              size="small"
              error={Number(formData.advanceDeduction) > currentAdvanceBalance}
              helperText={Number(formData.advanceDeduction) > currentAdvanceBalance ? "Cannot deduct more than owed balance" : ""}
              value={formData.advanceDeduction}
              onChange={(e) => setFormData({...formData, advanceDeduction: e.target.value})}
            />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Payment Mode"
              fullWidth
              value={formData.paymentMode}
              onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
            >
              {PAYMENT_MODES.map(mode => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
            </TextField>
            <TextField
              label="Remarks"
              fullWidth
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
            />
          </Stack>

          {/* NET AMOUNT DISPLAY */}
          <Box sx={{ 
            p: 3, 
            borderRadius: 3, 
            bgcolor: '#1e293b', 
            color: 'white',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <Typography fontWeight={700}>NET PAYABLE AMOUNT</Typography>
            <Typography variant="h4" fontWeight={900}>₹{netAmount.toLocaleString()}</Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          startIcon={<Payments />}
          disabled={netAmount < 0 || Number(formData.advanceDeduction) > currentAdvanceBalance}
          sx={{ borderRadius: 2, fontWeight: 700, px: 4, bgcolor: '#1e293b' }}
        >
          Disburse Salary
        </Button>
      </DialogActions>
    </Dialog>
  );
}