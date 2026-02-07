import React, { useState } from 'react';
import { 
  Box, Typography, Button, TextField, MenuItem, Paper, 
  Stack, Alert, CircularProgress, IconButton, Divider 
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Close as CloseIcon, 
  ConfirmationNumberOutlined as TicketIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import Header from './Header';

const TICKET_REASONS = [
  { value: 'DAMAGED_GOODS', label: 'Damaged Goods' },
  { value: 'SHORTAGE', label: 'Shortage (Missing Items)' },
  { value: 'OVERAGE', label: 'Overage (Unordered Items)' },
  { value: 'WRONG_ITEM', label: 'Incorrect Items Sent' },
  { value: 'QUALITY_ISSUE', label: 'Quality Non-Compliance' },
  { value: 'OTHER', label: 'Other' },
];

const ReceivingTicketForm = ({ onSubmit, onCancel, title, addAttachmentToTicket }) => {
  const [formData, setFormData] = useState({
    receivingId: '',
    reason: '',
    description: '',
    raisedBy: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const ticket = await onSubmit(formData);
      
      if (file && ticket?.id) {
        await addAttachmentToTicket(ticket.id, file);
      }
      // Success handling is usually managed by the parent via a redirect or toast
    } catch (err) {
      setError(err.message || 'Failed to create the support ticket. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: { xs: 1, md: 3 } }}>
      <Header title={title} onBack={onCancel} />
      
      <Paper sx={{ p: 4, mt: 2, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <TicketIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Ticket Information</Typography>
            <Typography variant="body2" color="text.secondary">Report discrepancies or issues with a specific receiving record.</Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>{error}</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Receiving ID"
              type="number"
              name="receivingId"
              value={formData.receivingId}
              onChange={handleChange}
              required
              fullWidth
              placeholder="e.g. 1045"
            />
            <TextField
              select
              label="Reason for Ticket"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              fullWidth
            >
              {TICKET_REASONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            label="Raised By (Full Name)"
            name="raisedBy"
            value={formData.raisedBy}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined"
          />

          <TextField
            label="Detailed Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            fullWidth
            multiline
            rows={4}
            placeholder="Please provide specific details about the issue (e.g., '3 units of SKU-001 arrived with crushed boxes')..."
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Evidence Attachment
            </Typography>
            {!file ? (
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<CloudUploadIcon />}
                sx={{ py: 2, borderStyle: 'dashed', borderWidth: 2, borderRadius: 2 }}
              >
                Upload Photo or Document
                <input type="file" onChange={handleFileChange} hidden />
              </Button>
            ) : (
              <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'grey.50' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AttachFileIcon color="primary" fontSize="small" />
                  <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>{file.name}</Typography>
                </Stack>
                <IconButton size="small" onClick={() => setFile(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Paper>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Max file size: 5MB. Supported formats: JPG, PNG, PDF.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={onCancel} variant="text" color="inherit" disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              size="large"
              disabled={loading}
              sx={{ px: 4, borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Ticket'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReceivingTicketForm;