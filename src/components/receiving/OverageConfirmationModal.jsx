import React, { useState } from 'react';
import { 
  Box, Typography, Button, TextField, MenuItem, 
  Divider, Stack, Paper, Alert, AlertTitle 
} from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';

const OVERAGE_REASONS = [
  { value: 'VENDOR_MIS-SHIPMENT', label: 'Vendor Shipping Error' },
  { value: 'PO_AMENDMENT_PENDING', label: 'Pending PO Amendment' },
  { value: 'PROMOTIONAL_BONUS', label: 'Promotional/Free Units' },
  { value: 'ITEM_SUBSTITUTION', label: 'Approved Substitution' },
  { value: 'OTHER', label: 'Other (Specify in notes)' },
];

const OverageConfirmationModal = ({ onConfirm, onCancel, errors, totalOverages }) => {
  const [reason, setReason] = useState('VENDOR_MIS-SHIPMENT');
  const [notes, setNotes] = useState('');

  const handleFinalConfirm = () => {
    onConfirm({
      overageReason: reason,
      overageNotes: notes,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: { xs: '90%', sm: 500 },
      bgcolor: 'background.paper',
      borderRadius: 3,
      boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
      p: 4,
      outline: 'none',
      border: '1px solid',
      borderColor: 'warning.light'
    }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ 
          bgcolor: 'warning.light', 
          p: 1.5, 
          borderRadius: '50%', 
          display: 'flex' 
        }}>
          <WarningAmberOutlinedIcon sx={{ fontSize: 32, color: 'warning.dark' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Overage Detected
        </Typography>
      </Stack>

      <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle sx={{ fontWeight: 'bold' }}>Financial Impact Warning</AlertTitle>
        You are attempting to receive <strong>{totalOverages} units</strong> more than authorized in the Purchase Order. This may trigger an invoice discrepancy.
      </Alert>

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
        Why are you accepting this overage?
      </Typography>
      
      <TextField
        select
        fullWidth
        size="small"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        sx={{ mb: 2 }}
      >
        {OVERAGE_REASONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        multiline
        rows={2}
        placeholder="Enter mandatory justification notes..."
        variant="outlined"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Divider sx={{ mb: 2 }} />

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
        By confirming, you acknowledge that these items will be added to active inventory and may require a PO update.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          onClick={onCancel} 
          variant="text" 
          sx={{ color: 'text.secondary', fontWeight: 'bold' }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleFinalConfirm} 
          variant="contained" 
          color="warning"
          disabled={!notes.trim()}
          startIcon={<AssignmentLateOutlinedIcon />}
          sx={{ 
            borderRadius: 2, 
            px: 3, 
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(237, 108, 2, 0.3)'
          }}
        >
          Authorize & Record
        </Button>
      </Box>
    </Box>
  );
};

export default OverageConfirmationModal;