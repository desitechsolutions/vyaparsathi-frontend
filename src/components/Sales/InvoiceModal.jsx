import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE_URL } from '../../services/api';

const InvoiceModal = ({
  open,
  setOpen,
  saleId,
  invoiceNo,
  signedInvoiceUrl,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isDisabled = !signedInvoiceUrl;

  const getFullUrl = () => {
    if (isDisabled) return null;
    
    // If it's already a full cloud URL (like the one you provided), use it directly
    if (signedInvoiceUrl.startsWith('http')) {
        return signedInvoiceUrl;
    }
    
    // Fallback for local/relative paths
    const cleanPath = signedInvoiceUrl.startsWith('/') ? signedInvoiceUrl : `/${signedInvoiceUrl}`;
    return `${API_BASE_URL}${cleanPath}`;
  };
  const handlePrint = () => {
    if (isDisabled) return;
    setLoading(true);
    setError(null);

    const fullUrl = getFullUrl();
    if (fullUrl) {
      // For cloud environments, window.open is better for Preview
      const printWindow = window.open(fullUrl, '_blank', 'noopener,noreferrer');
      if (!printWindow) {
        setError('Popup blocked. Please allow popups to view the invoice.');
      }
    } else {
      setError('No valid URL available.');
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (isDisabled) return;
    setLoading(true);
    setError(null);

    const fullUrl = getFullUrl();
    if (fullUrl) {
      // Append download param correctly handling existing query strings
      const downloadUrl = fullUrl.includes('?')
        ? `${fullUrl}&download=true`
        : `${fullUrl}?download=true`;

      // On Cloud Run/HTTPS, direct assignment is often more reliable than <a> click
      // as it bypasses certain cross-origin download restrictions
      window.location.assign(downloadUrl);
    } else {
      setError('No valid URL available.');
    }
    
    // Keep loading for a second to show progress before allowing user to close
    setTimeout(() => setLoading(false), 1000);
  };

const handleClose = () => {
    // 1. Check if the parent provided an onClose function (like handleCloseInvoiceModal)
    if (onClose) {
      onClose();
    } 
    // 2. ONLY call setOpen if it was actually passed as a prop
    else if (setOpen) {
      setOpen(false);
    }
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h6" component="div">
          Invoice Ready
        </Typography>
        <IconButton onClick={handleClose} size="small" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Typography variant="body1">
            Invoice <strong>{invoiceNo || saleId || '—'}</strong> has been generated successfully.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={loading || isDisabled}
        >
          Print / Preview
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={loading || isDisabled}
        >
          Download PDF
        </Button>

        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={loading}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceModal;