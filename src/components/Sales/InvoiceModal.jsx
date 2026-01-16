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

// Backend base URL (move to .env later: process.env.REACT_APP_API_URL)
const API_BASE_URL = 'http://localhost:8080';

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
    if (!signedInvoiceUrl) return null;
    return signedInvoiceUrl.startsWith('http')
      ? signedInvoiceUrl
      : `${API_BASE_URL}${signedInvoiceUrl.startsWith('/') ? '' : '/'}${signedInvoiceUrl}`;
  };

  const handlePrint = () => {
    if (isDisabled) return;
    setLoading(true);
    setError(null);

    const fullUrl = getFullUrl();
    if (fullUrl) {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
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
      // Force download by using attachment disposition via query param
      const downloadUrl = fullUrl.includes('?')
        ? `${fullUrl}&download=true`
        : `${fullUrl}?download=true`;

      // Use <a> click method - most reliable for forcing download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoice_${invoiceNo || saleId || 'unknown'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      setError('No valid URL available.');
    }
    setLoading(false);
  };

  const handleClose = () => {
    if (onClose) onClose();
    setOpen(false);
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