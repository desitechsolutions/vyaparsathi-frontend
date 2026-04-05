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
  Divider,
  Stack,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import API from '../../services/api';

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

  // Prefer a "downloadable" link for WhatsApp sharing (customers expect download)
  const whatsappInvoiceLink = useMemo(() => {
    if (!signedInvoiceUrl) return '';
    const path = signedInvoiceUrl;
    return path.includes('?') ? `${path}&download=true` : `${path}?download=true`;
  }, [signedInvoiceUrl]);

  const formattedAmount = useMemo(() => {
    if (totalAmount == null || totalAmount === '') return '';
    const n = Number(totalAmount);
    if (Number.isNaN(n)) return '';
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [totalAmount]);

  /**
   * Fetch the PDF as Blob and create a local URL (works behind auth / cloud run etc).
   * - isDownload=true => triggers download
   * - isDownload=false => opens preview
   */
  const fetchPdfBlob = async (isDownload = false) => {
    setLoading(true);
    setError(null);

    let fileURL = null;

    try {
      const path = signedInvoiceUrl;

      const requestUrl = isDownload
        ? path.includes('?')
          ? `${path}&download=true`
          : `${path}?download=true`
        : path;

      const response = await API.get(requestUrl, { responseType: 'blob' });

      const file = new Blob([response.data], { type: 'application/pdf' });
      fileURL = URL.createObjectURL(file);

      if (isDownload) {
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `invoice_${invoiceNo || saleId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const previewWindow = window.open(fileURL, '_blank', 'noopener,noreferrer');
        if (!previewWindow) {
          setError('Popup blocked. Please allow popups to view the invoice.');
        }
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setError('Failed to load PDF. The link may have expired.');
    } finally {
      setLoading(false);
      if (fileURL) {
        // cleanup
        setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
      }
    }
  };

  const normalizePhoneForWhatsApp = (raw) => {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    // If user already stored +91 or 91xxxxxxxxxx, keep last 10 for India and prefix 91
    const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
    return `91${last10}`;
  };

  const handleWhatsApp = () => {
    if (isDisabled) return;

    const phone = normalizePhoneForWhatsApp(customerPhone);
    if (!phone || phone.length < 12) {
      setError('Customer phone number is missing/invalid.');
      return;
    }

    // WhatsApp (wa.me) can only send TEXT (and link inside text)
    const lines = [
      shopName ? `Invoice from *${shopName}*` : null,
      `🧾 *Invoice #${invoiceNo || saleId}*`,
      formattedAmount ? `💰 Amount: ${formattedAmount}` : null,
      'Download invoice PDF:',
      whatsappInvoiceLink, // <= customer opens this link
      'Thank you for your purchase! 🙏',
    ].filter(Boolean);

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    if (!whatsappInvoiceLink) return;
    try {
      await navigator.clipboard.writeText(whatsappInvoiceLink);
      setError(null);
    } catch {
      setError('Failed to copy. Please copy the link manually.');
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
    if (onClose) onClose();
    else if (setOpen) setOpen(false);
    setError(null);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEscapeKeyDown={loading}>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: '#f8fafc',
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
              gap: 2,
            }}
          >
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
              Choose to preview, download, or share the invoice.
            </Typography>

            {!isDisabled && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="textSecondary">
                  Share link (works in WhatsApp):
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    p: 1,
                    border: '1px solid #e2e8f0',
                    borderRadius: 1.5,
                    bgcolor: '#f8fafc',
                    wordBreak: 'break-all',
                  }}
                >
                  {whatsappInvoiceLink}
                </Typography>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
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
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyLink}
          disabled={loading || isDisabled}
        >
          Copy link
        </Button>

        <Button
          variant="contained"
          startIcon={<WhatsAppIcon />}
          onClick={handleWhatsApp}
          disabled={loading || isDisabled}
          sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5d' }, color: '#fff' }}
        >
          WhatsApp
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button variant="text" onClick={handleClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceModal;