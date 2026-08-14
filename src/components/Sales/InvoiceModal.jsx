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
  Stack,
  Divider,
  alpha,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

// WhatsApp brand green — this is a brand color, not a theme accent.
// Keeping it as a hardcoded constant since it should render identically
// in both light and dark themes.
const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_GREEN_HOVER = '#1ebe5d';

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
   * Fetch PDF as a Blob with proper error handling.
   * Uses AbortController + 30s timeout so a hanging request doesn't
   * leave the modal stuck in the loading state indefinitely.
   */
  const fetchPdfBlob = async (isDownload = false) => {
    setLoading(true);
    setError(null);

    let fileURL = null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const path = signedInvoiceUrl;
      const requestUrl = isDownload
        ? path.includes('?')
          ? `${path}&download=true`
          : `${path}?download=true`
        : path;

      const response = await fetch(requestUrl, {
        method: 'GET',
        signal: controller.signal,
        credentials: 'include',
        headers: { 'Accept': 'application/pdf' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      if (!blob.type.includes('pdf')) {
        throw new Error('Invalid file type received. Expected PDF.');
      }

      fileURL = URL.createObjectURL(blob);

      if (isDownload) {
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `Invoice_${invoiceNo || saleId}.pdf`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Revoke the blob URL after the browser has picked it up.
        setTimeout(() => URL.revokeObjectURL(fileURL), 100);
      } else {
        const previewWindow = window.open(
          fileURL,
          `invoice_${invoiceNo || saleId}`,
          'width=1000,height=800,noopener,noreferrer'
        );
        if (!previewWindow || previewWindow.closed) {
          setError('Popup blocked. Please allow popups to view the invoice.');
          URL.revokeObjectURL(fileURL);
        } else {
          // Keep the blob URL alive long enough for the new tab to load the PDF.
          setTimeout(() => URL.revokeObjectURL(fileURL), 120000);
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
      if (fileURL) URL.revokeObjectURL(fileURL);
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
    const lines = [
      `Invoice from ${shopName || 'VyaparSathi'}`,
      '',
      `Invoice Number: ${invoiceNo || saleId}`,
      `Amount: ${formattedAmount}`,
      '',
      'View or download your invoice:',
      signedInvoiceUrl,
      '',
      'Thank you for your business!',
    ];
    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
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
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 24 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Sale completed
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Invoice #{invoiceNo || saleId}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={handleClose} size="small" disabled={loading} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 1.5 }}>
            <CircularProgress size={44} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Generating PDF…
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {/* Amount tile — matches the enterprise section-header + value pattern
                used across the Sales screen. */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                <ReceiptLongIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'text.secondary',
                    fontSize: '0.72rem',
                  }}
                >
                  Invoice amount
                </Typography>
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.75rem' }}>
                {formattedAmount || '—'}
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary">
              Invoice links expire after 24 hours. Download or share to keep a copy.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<VisibilityOutlinedIcon />}
          onClick={handlePreview}
          disabled={loading || isDisabled}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Preview
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={loading || isDisabled}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Download
        </Button>
        <Button
          variant="contained"
          startIcon={<WhatsAppIcon />}
          onClick={handleWhatsApp}
          disabled={loading || isDisabled}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: WHATSAPP_GREEN,
            color: '#fff',
            '&:hover': { bgcolor: WHATSAPP_GREEN_HOVER },
          }}
        >
          Share on WhatsApp
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="text"
          onClick={handleClose}
          disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceModal;
