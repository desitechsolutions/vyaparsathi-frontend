import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { sendCustomerStatementEmail } from '../../services/api';

export const CustomerEmailDialog = ({
  open,
  onClose,
  customerId,
  customerName,
  customerEmail,
  onSuccess,
}) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!customerEmail) {
      setError('Customer does not have a registered email address.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await sendCustomerStatementEmail(customerId, {
        from: fromDate || null,
        to: toDate || null,
        message: message || null,
      });
      if (onSuccess) onSuccess('Statement email dispatched successfully!');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to dispatch email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'common.white' }}>
            <EmailIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Email Account Statement
            </Typography>
            <Typography variant="caption" color="text.secondary">
              To: {customerName} ({customerEmail || 'No email registered'})
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!customerEmail && (
          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
            Please update the customer profile with an email address before sending.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="date"
              label="Statement From"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="date"
              label="Statement To"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Custom Note / Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Please find your statement for March 2026 attached. Kindly settle the outstanding balance by Friday."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit" disabled={sending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!customerEmail || sending}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          sx={{ px: 3, fontWeight: 700 }}
        >
          {sending ? 'Sending...' : 'Send Statement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
