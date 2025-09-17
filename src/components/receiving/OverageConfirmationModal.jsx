import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';


const OverageConfirmationModal = ({ onConfirm, onCancel, errors, totalOverages }) => {
  return (
    <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 24,
      p: 4,
      textAlign: 'center',
      outline: 'none',
    }}>
      <WarningAmberOutlinedIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
        Confirm Overage
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        An overage of <strong>{totalOverages}</strong> items has been detected. Do you want to proceed and record this?
      </Typography>
      <Box sx={{ bgcolor: 'error.light', p: 2, borderRadius: 1, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 'bold', mb: 1 }}>
          Validation Errors
        </Typography>
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
          {Object.values(errors).map((err, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', color: 'error.dark' }}>
              <CancelOutlinedIcon fontSize="small" sx={{ mr: 1, mt: 0.5 }} />
              <Typography variant="caption" display="block">{err}</Typography>
            </li>
          ))}
        </ul>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-around', gap: 2, mt: 2 }}>
        <Button onClick={onCancel} variant="outlined" sx={{ flexGrow: 1 }}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="success" sx={{ flexGrow: 1 }}>
          Confirm Overage
        </Button>
      </Box>
    </Box>
  );
};
export default OverageConfirmationModal;