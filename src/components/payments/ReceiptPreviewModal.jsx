import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Snackbar,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getPaymentReceiptSignedUrl } from '../../services/api';

/**
 * ReceiptPreviewModal
 *
 * Fetches a signed receipt URL for the given paymentId, then exposes
 * Preview (open PDF in new tab) and Download (save to disk) actions.
 * Follows the same AbortController + 30-second timeout pattern as
 * InvoiceModal so behaviour is consistent across the application.
 *
 * Props
 * ─────
 * open          {boolean}  – controlled visibility
 * onClose       {function} – called when the dialog should close
 * paymentId     {string|number} – required; used to fetch the signed URL
 * amount        {number|string} – displayed as formatted ₹ amount
 * receiptNo     {string}   – shown in the header and used in the filename
 * paymentDate   {string}   – ISO date string; displayed + used in filename
 * paymentMethod {string}   – e.g. "CASH", "UPI", "BANK_TRANSFER"
 */
const ReceiptPreviewModal = ({
  open,
  onClose,
  paymentId,
  amount,
  receiptNo,
  paymentDate,
  paymentMethod,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ── State ─────────────────────────────────────────────────────────────────
  const [signedUrl, setSignedUrl]     = useState(null);
  const [urlLoading, setUrlLoading]   = useState(false);
  const [urlError, setUrlError]       = useState(null);
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [pdfError, setPdfError]       = useState(null);
  const [snackbar, setSnackbar]       = useState({ open: false, message: '', severity: 'success' });

  // ── Derived values ─────────────────────────────────────────────────────────
  const formattedAmount = useMemo(() => {
    if (amount == null || amount === '') return '';
    const n = Number(amount);
    if (Number.isNaN(n)) return '';
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [amount]);

  /** YYYY-MM-DD for the download filename */
  const fileDateStr = useMemo(() => {
    if (!paymentDate) return new Date().toISOString().split('T')[0];
    try {
      return new Date(paymentDate).toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }, [paymentDate]);

  /** Human-readable date for display inside the modal */
  const formattedDate = useMemo(() => {
    if (!paymentDate) return '—';
    try {
      return new Date(paymentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return paymentDate;
    }
  }, [paymentDate]);

  /** Normalised method label ("BANK_TRANSFER" → "Bank Transfer") */
  const formattedMethod = useMemo(() => {
    if (!paymentMethod) return null;
    return paymentMethod
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [paymentMethod]);

  // ── Fetch signed URL ───────────────────────────────────────────────────────
  const fetchSignedUrl = useCallback(async () => {
    if (!paymentId) return;

    setUrlLoading(true);
    setUrlError(null);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await getPaymentReceiptSignedUrl(paymentId);
      clearTimeout(timeoutId);

      // Backend may return { url: '…' } or a plain string
      const url = res?.data?.url ?? res?.data ?? null;
      if (!url) throw new Error('No signed URL returned from server.');
      setSignedUrl(url);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        setUrlError('Request timed out. Please try again.');
      } else if (!navigator.onLine) {
        setUrlError('Network error. Please check your connection.');
      } else {
        setUrlError(
          err.response?.data?.message ||
          err.message ||
          'Failed to load receipt. Please try again.',
        );
      }
    } finally {
      setUrlLoading(false);
    }
  }, [paymentId]);

  // Kick off the signed-URL fetch whenever the dialog opens
  useEffect(() => {
    if (open && paymentId) {
      setSignedUrl(null);
      setPdfError(null);
      setUrlError(null);
      fetchSignedUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paymentId]);

  // ── Fetch PDF blob (Preview or Download) ──────────────────────────────────
  /**
   * Fetches the receipt PDF as a Blob with AbortController + 30-second timeout.
   *
   * isDownload=true  → triggers browser download as RCP-YYYY-MM-DD-{receiptNo}.pdf
   * isDownload=false → opens PDF in a new tab via window.open(blobUrl)
   */
  const fetchPdfBlob = useCallback(async (isDownload = false) => {
    if (!signedUrl) return;

    setPdfLoading(true);
    setPdfError(null);

    let fileURL = null;
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30000);

    try {
      // Append ?download=true only for the download action so the server
      // can set Content-Disposition: attachment if it supports the flag.
      const requestUrl = isDownload
        ? signedUrl.includes('?')
          ? `${signedUrl}&download=true`
          : `${signedUrl}?download=true`
        : signedUrl;

      const response = await fetch(requestUrl, {
        method: 'GET',
        signal: controller.signal,
        credentials: 'include',
        headers: { Accept: 'application/pdf' },
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
        const filename = `RCP-${fileDateStr}-${receiptNo || paymentId}.pdf`;
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Revoke after the browser has picked it up
        setTimeout(() => URL.revokeObjectURL(fileURL), 100);
        setSnackbar({ open: true, message: 'Receipt downloaded successfully.', severity: 'success' });
      } else {
        const previewWindow = window.open(
          fileURL,
          `receipt_${receiptNo || paymentId}`,
          'width=1000,height=800,noopener,noreferrer',
        );
        if (!previewWindow || previewWindow.closed) {
          setPdfError('Popup blocked. Please allow popups to preview the receipt.');
          URL.revokeObjectURL(fileURL);
        } else {
          // Keep blob URL alive long enough for the new tab to load the PDF
          setTimeout(() => URL.revokeObjectURL(fileURL), 120000);
          setSnackbar({ open: true, message: 'Receipt opened in a new tab.', severity: 'success' });
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (fileURL) URL.revokeObjectURL(fileURL);
      console.error('Receipt PDF Error:', err);

      const msg =
        err.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : err instanceof TypeError
          ? 'Network error. Please check your connection.'
          : err.message || 'Failed to load receipt PDF. The link may have expired.';

      setPdfError(msg);
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setPdfLoading(false);
    }
  }, [signedUrl, fileDateStr, receiptNo, paymentId]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePreview  = () => fetchPdfBlob(false);
  const handleDownload = () => fetchPdfBlob(true);

  const handleClose = () => {
    if (urlLoading || pdfLoading) return;
    setSignedUrl(null);
    setUrlError(null);
    setPdfError(null);
    onClose();
  };

  const dismissError = () => {
    setUrlError(null);
    setPdfError(null);
  };

  // ── Derived flags ──────────────────────────────────────────────────────────
  const isLoading  = urlLoading || pdfLoading;
  const isUrlReady = Boolean(signedUrl) && !urlLoading;
  const displayError = urlError || pdfError;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        disableEscapeKeyDown={isLoading}
        aria-labelledby="receipt-preview-dialog-title"
        aria-describedby="receipt-preview-dialog-description"
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        {/* ── Title bar ──────────────────────────────────────────────────── */}
        <DialogTitle
          id="receipt-preview-dialog-title"
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
            <Box
              sx={{
                p: 0.75,
                borderRadius: 1.5,
                bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ReceiptIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Payment Receipt
              </Typography>
              {receiptNo && (
                <Typography variant="caption" color="text.secondary">
                  #{receiptNo}
                </Typography>
              )}
            </Box>
          </Stack>

          <IconButton
            onClick={handleClose}
            size="small"
            disabled={isLoading}
            aria-label="Close receipt preview"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <DialogContent
          id="receipt-preview-dialog-description"
          sx={{ pt: 2.5, pb: 2 }}
        >
          {/* Error banner */}
          {displayError && (
            <Alert
              severity="error"
              sx={{ mb: 2, borderRadius: 2 }}
              onClose={dismissError}
              action={
                urlError ? (
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={fetchSignedUrl}
                    aria-label="Retry loading receipt"
                  >
                    Retry
                  </Button>
                ) : undefined
              }
            >
              {displayError}
            </Alert>
          )}

          {/* Loading states */}
          {urlLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 5,
                gap: 1.5,
              }}
            >
              <CircularProgress size={44} aria-label="Loading receipt" />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Loading receipt…
              </Typography>
            </Box>
          ) : pdfLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 5,
                gap: 1.5,
              }}
            >
              <CircularProgress size={44} aria-label="Preparing PDF" />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Preparing PDF…
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {/* Receipt summary tile */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                }}
              >
                <Stack spacing={1.5}>
                  {formattedAmount && (
                    <Box>
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
                        Amount Paid
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.75rem' }}
                      >
                        {formattedAmount}
                      </Typography>
                    </Box>
                  )}

                  <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                    {paymentDate && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600, display: 'block' }}
                        >
                          Date
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formattedDate}
                        </Typography>
                      </Box>
                    )}
                    {formattedMethod && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600, display: 'block' }}
                        >
                          Method
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formattedMethod}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Stack>
              </Box>

              {/* PDF-ready indicator */}
              {isUrlReady && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <PictureAsPdfIcon
                    sx={{ color: 'error.main', fontSize: 28, flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Receipt PDF ready
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click Preview to open in a new tab, or Download to save a copy.
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Expiry notice */}
              <Typography variant="caption" color="text.secondary">
                Receipt links expire after 24 hours. Download to keep a permanent copy.
              </Typography>
            </Stack>
          )}
        </DialogContent>

        <Divider />

        {/* ── Action buttons ─────────────────────────────────────────────── */}
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<VisibilityOutlinedIcon />}
            onClick={handlePreview}
            disabled={isLoading || !isUrlReady}
            aria-label="Preview receipt PDF in new tab"
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Preview
          </Button>

          <Button
            variant="contained"
            startIcon={
              pdfLoading
                ? <CircularProgress size={16} color="inherit" />
                : <DownloadIcon />
            }
            onClick={handleDownload}
            disabled={isLoading || !isUrlReady}
            aria-label="Download receipt as PDF"
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Download
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="text"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close receipt dialog"
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast notification ─────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReceiptPreviewModal;
