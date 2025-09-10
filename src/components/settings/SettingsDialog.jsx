import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
  Typography, CircularProgress, Alert, IconButton, InputAdornment
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { changePin } from '../../services/api'; // We will create this next
import { useAuthContext } from '../../context/AuthContext';

const SettingsDialog = ({ open, onClose }) => {
  const { logout } = useAuthContext();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPins, setShowPins] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      setError("New PINs do not match.");
      return;
    }
    if (newPin.length !== 4) {
      setError("New PIN must be 4 digits.");
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await changePin({ currentPin, newPin });
      setSuccess(response.data + " You will be logged out for security.");
      setTimeout(() => {
        logout(); // Logout from context
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    setSuccess('');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <LockResetIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
        <DialogTitle sx={{ p: 0, fontWeight: 'bold' }}>Change Your PIN</DialogTitle>
      </Box>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          "A secure key unlocks a thriving business. Keep your account safe."
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPin"
            label="Current PIN"
            type={showPins ? 'text' : 'password'}
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            disabled={loading || !!success}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPin"
            label="New 4-Digit PIN"
            type={showPins ? 'text' : 'password'}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            disabled={loading || !!success}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPin"
            label="Confirm New PIN"
            type={showPins ? 'text' : 'password'}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            disabled={loading || !!success}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPins(!showPins)} edge="end">
                    {showPins ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !!success}>
          {loading ? <CircularProgress size={24} /> : 'Change PIN'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;