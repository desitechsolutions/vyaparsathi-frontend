import React, { useMemo, useState } from 'react';
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
  Alert,
  alpha,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import API from '../../services/api';

const theme = {
  primary: '#0f766e',
  primaryLight: '#14b8a6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#dc2626',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
};

const InvoiceModal = ({
  open,
  setOpen,
  saleId,
  invoiceNo,
  signedInvoiceUrl,
  customerPhone,
  totalAmount,
  shopName,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isDisabled = !signedInvoiceUrl;

  const formattedAmount = useMemo(() => {
    if (totalAmount == null || totalAmount === '') return '';
    const n = Number(totalAmount);
    if (Number.isNaN(n)) return '';
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [totalAmount]);

  /**
   * Fetch PDF as Blob with proper error handling.
   * Uses timeout and abort controller to prevent hanging requests.
   */
  const fetchPdfBlob = async (isDownload = false) => {
    setLoading(true);
    setError(null);

    let fileURL = null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const path = signedInvoiceUrl;

      const requestUrl = isDownload
        ? path.includes('?')
          ? `${path}&download=true`
          : `${path}?download=true`
        : path;

      // Fetch with proper blob response type
      const response = await fetch(requestUrl, {
        method: 'GET',
        signal: controller.signal,
        credentials: 'include', // Include auth cookies
        headers: {
          'Accept': 'application/pdf',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      // Verify it's actually a PDF
      if (!blob.type.includes('pdf')) {
        throw new Error('Invalid file type received. Expected PDF.');
      }

      fileURL = URL.createObjectURL(blob);

      if (isDownload) {
        // Download: Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `Invoice_${invoiceNo || saleId}.pdf`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Revoke URL immediately after download
        setTimeout(() => {
          URL.revokeObjectURL(fileURL);
        }, 100);
      } else {
        // Preview: Open in new tab without affecting current page
        const previewWindow = window.open(
          fileURL,
          `invoice_${invoiceNo || saleId}`,
          'width=1000,height=800,noopener,noreferrer'
        );

        if (!previewWindow || previewWindow.closed) {
          setError('Popup blocked. Please allow popups to view the invoice.');
          URL.revokeObjectURL(fileURL);
        } else {
          // Revoke after 2 minutes (PDF should be loaded by then)
          setTimeout(() => {
            URL.revokeObjectURL(fileURL);
          }, 120000);
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('PDF Generation Error:', err);

      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (err instanceof TypeError) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Failed to load PDF. The link may have expired.');
      }

      if (fileURL) {
        URL.revokeObjectURL(fileURL);
      }
    } finally {
      setLoading(false);
    }
  };

  const normalizePhoneForWhatsApp = (raw) => {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
    return `91${last10}`;
  };

  const handleWhatsApp = () => {
    if (isDisabled) {
      setError('Invoice not available for sharing.');
      return;
    }

    const phone = normalizePhoneForWhatsApp(customerPhone);
    if (!phone || phone.length < 12) {
      setError('Customer phone number is missing or invalid.');
      return;
    }

    // Build WhatsApp message with plain text (no emojis to avoid encoding issues)
    // Include a clickable link to view/download the invoice
    const invoiceLink = signedInvoiceUrl;
    
    const lines = [
      `Invoice from ${shopName || 'VyaparSathi'}`,
      '',
      `Invoice Number: ${invoiceNo || saleId}`,
      `Amount: ${formattedAmount}`,
      '',
      'View or download your invoice:',
      invoiceLink,
      '',
      'Thank you for your business!',
    ];

    const message = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${phone}?text=${message}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async () => {
    if (isDisabled) return;
    await fetchPdfBlob(true);
  };

  const handlePreview = async () => {
    if (isDisabled) return;
    await fetchPdfBlob(false);
  };

  const handleClose = () => {
    setError(null);
    if (onClose) {
      onClose();
    } else if (setOpen) {
      setOpen(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth 
      disableEscapeKeyDown={loading}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: alpha(theme.primary, 0.04),
          borderBottom: `1.5px solid ${alpha(theme.primary, 0.1)}`,
          py: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: theme.textPrimary }}>
            Invoice Ready
          </Typography>
          <Typography variant="caption" sx={{ color: theme.textSecondary, mt: 0.5, display: 'block' }}>
            Invoice #{invoiceNo || saleId}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={loading} sx={{ color: theme.primary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, mb: 1 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              py: 5,
              gap: 2,
            }}
          >
            <CircularProgress size={50} sx={{ color: theme.primary }} />
            <Typography variant="body2" color={theme.textSecondary} sx={{ fontWeight: 600 }}>
              Generating PDF...
            </Typography>
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.danger, 0.1),
              color: theme.danger,
              '& .MuiAlert-icon': { color: theme.danger },
            }}
          >
            {error}
          </Alert>
        ) : null}

        {!loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: alpha(theme.success, 0.08),
                border: `2px solid ${alpha(theme.success, 0.25)}`,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: theme.textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                Invoice Amount
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ fontWeight: 900, color: theme.primary, fontSize: '1.8rem', mt: 0.5 }}
              >
                {formattedAmount}
              </Typography>
            </Box>

            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{ color: theme.textPrimary, mb: 1, fontWeight: 600 }}>
                Invoice #{invoiceNo || saleId}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                Your invoice is ready. You can:
              </Typography>
              <Box sx={{ mt: 1.5, pl: 1 }}>
                <Typography variant="caption" sx={{ color: theme.textSecondary, display: 'block', mb: 0.75 }}>
                  • <strong>Preview</strong> - View the invoice in your browser
                </Typography>
                <Typography variant="caption" sx={{ color: theme.textSecondary, display: 'block', mb: 0.75 }}>
                  • <strong>Download</strong> - Save as PDF to your device
                </Typography>
                <Typography variant="caption" sx={{ color: theme.textSecondary, display: 'block' }}>
                  • <strong>WhatsApp</strong> - Send invoice link to customer
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.warning, 0.08),
                border: `1px solid ${alpha(theme.warning, 0.2)}`,
                mt: 1,
              }}
            >
              <Typography variant="caption" sx={{ color: theme.warning, fontWeight: 700 }}>
                Note: Invoice links expire after 24 hours. Download or share immediately.
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions 
        sx={{ 
          px: 3, 
          pb: 3, 
          gap: 1, 
          flexWrap: 'wrap',
          borderTop: `1px solid ${alpha(theme.primary, 0.1)}`,
          pt: 2.5,
        }}
      >
        <Button
          variant="contained"
          startIcon={<VisibilityIcon />}
          onClick={handlePreview}
          disabled={loading || isDisabled}
          sx={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            boxShadow: `0 4px 12px ${alpha(theme.primary, 0.3)}`,
            '&:hover': {
              boxShadow: `0 6px 16px ${alpha(theme.primary, 0.4)}`,
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Preview
        </Button>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={loading || isDisabled}
          sx={{
            background: `linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.primary} 100%)`,
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            boxShadow: `0 4px 12px ${alpha(theme.primary, 0.3)}`,
            '&:hover': {
              boxShadow: `0 6px 16px ${alpha(theme.primary, 0.4)}`,
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Download
        </Button>

        <Button
          variant="contained"
          startIcon={<WhatsAppIcon />}
          onClick={handleWhatsApp}
          disabled={loading || isDisabled}
          sx={{
            bgcolor: '#25D366',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
            color: '#fff',
            '&:hover': {
              bgcolor: '#1ebe5d',
              boxShadow: '0 6px 16px rgba(37, 211, 102, 0.4)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Share WhatsApp
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button 
          variant="text" 
          onClick={handleClose} 
          disabled={loading}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            color: theme.textSecondary,
            '&:hover': {
              bgcolor: alpha(theme.primary, 0.05),
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceModal;