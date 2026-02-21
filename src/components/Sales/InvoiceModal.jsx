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
import API from '../../services/api'; // Use the API instance to handle the blob fetch

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

  /**
   * Helper to fetch the PDF as a Blob and create a local URL.
   * This is the "Magic Fix" for Cloud Run / HTTPS environments.
   */
  const fetchPdfBlob = async (isDownload = false) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Determine the path (handles full cloud URL or relative path)
      const path = signedInvoiceUrl;
      
      // 2. Add download parameter if needed
      const requestUrl = isDownload 
        ? (path.includes('?') ? `${path}&download=true` : `${path}?download=true`)
        : path;

      // 3. Fetch binary data using the authenticated API instance
      const response = await API.get(requestUrl, {
        responseType: 'blob',
      });

      // 4. Create local Blob URL
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      if (isDownload) {
        // Trigger actual download
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `invoice_${invoiceNo || saleId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Open Preview in new tab
        const previewWindow = window.open();
        if (previewWindow) {
          previewWindow.location.href = fileURL;
        } else {
          setError('Popup blocked. Please allow popups to view the invoice.');
        }
      }

      // 5. Clean up memory after a minute
      setTimeout(() => URL.revokeObjectURL(fileURL), 60000);

    } catch (err) {
      console.error("PDF Generation Error:", err);
      setError('Failed to load PDF. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (isDisabled) return;
    fetchPdfBlob(false);
  };

  const handleDownload = () => {
    if (isDisabled) return;
    fetchPdfBlob(true);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (setOpen) {
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
          alignItems: 'center',
          bgcolor: '#f8fafc'
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          Invoice Ready
        </Typography>
        <IconButton onClick={handleClose} size="small" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 4, gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="textSecondary">
              Preparing your PDF...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            <Typography variant="body1">
              Invoice <strong>{invoiceNo || saleId || '—'}</strong> is ready.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Choose to preview the invoice or save it to your device.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={loading || isDisabled}
          sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
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