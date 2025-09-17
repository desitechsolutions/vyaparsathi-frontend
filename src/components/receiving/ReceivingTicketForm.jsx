import React, { useState } from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import Header from './Header';

const ReceivingTicketForm = ({ onSubmit, onCancel, title, addAttachmentToTicket }) => {
  const [formData, setFormData] = useState({
    receivingId: '',
    reason: '', // Aligned with DTO
    description: '', // Replaced items
    raisedBy: ''
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.receivingId || !formData.reason || !formData.description || !formData.raisedBy) {
      setError('Required fields missing.');
      return;
    }
    try {
      const payload = { ...formData };
      const ticket = await onSubmit(payload);
      if (file && ticket.id) {
        await addAttachmentToTicket(ticket.id, file); // Real call
      }
    } catch (err) {
      setError('Failed to create ticket.');
    }
  };

  return (
    <Box>
      <Header title={title} onBack={onCancel} />
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {error && <Typography color="error" sx={{ bgcolor: 'error.light', p: 1, borderRadius: 1 }}>{error}</Typography>}
        <TextField
          label="Receiving ID"
          type="number"
          name="receivingId"
          value={formData.receivingId}
          onChange={handleChange}
          required
          fullWidth
        />
        <TextField
          label="Reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          required
          fullWidth
        />
        <TextField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          fullWidth
          multiline
          rows={4}
          placeholder="Describe the issue..."
        />
        <TextField
          label="Raised By"
          name="raisedBy"
          value={formData.raisedBy}
          onChange={handleChange}
          required
          fullWidth
        />
        <Button variant="outlined" component="label" sx={{ justifyContent: 'flex-start' }}>
          <input type="file" onChange={handleFileChange} hidden />
          {file ? `File selected: ${file.name}` : 'Upload Attachment (Optional)'}
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Create Ticket
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
export default ReceivingTicketForm;