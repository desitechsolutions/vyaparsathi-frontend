import React, { useState } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { getPaymentReceiptSignedUrl, downloadReceiptPdf } from '../../services/api';

/**
 * Self-contained button that downloads the printable PDF receipt for a payment.
 *
 * Props:
 *   paymentId     — id of the payment record (required)
 *   invoiceNumber — optional; used for the downloaded filename
 *   size          — MUI IconButton size (default "small")
 *   sx            — additional MUI sx styles for the button
 *   color         — icon color (any valid CSS color or MUI theme path)
 */
const ReceiptDownloadButton = ({
  paymentId,
  invoiceNumber,
  size = 'small',
  sx = {},
  color,
  tooltipTitle = 'Download receipt PDF',
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation(); // Prevent DataGrid row selection
    if (loading || !paymentId) return;

    setLoading(true);
    try {
      const signedPath = await getPaymentReceiptSignedUrl(paymentId);
      const safeInvoice = invoiceNumber
        ? invoiceNumber.replace(/[/\\]/g, '_')
        : null;
      const filename = safeInvoice
        ? `receipt_${safeInvoice}.pdf`
        : `receipt_payment_${paymentId}.pdf`;
      await downloadReceiptPdf(signedPath, filename);
    } catch (err) {
      console.error('ReceiptDownloadButton: failed to download receipt', err);
      // Surface a concise message rather than a raw stack trace.
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not download receipt. Please try again.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={tooltipTitle} arrow>
      {/* <span> wrapper keeps the tooltip visible when button is disabled */}
      <span>
        <IconButton
          size={size}
          onClick={handleClick}
          disabled={loading || !paymentId}
          aria-label={tooltipTitle}
          tabIndex={0}
          sx={{ color, ...sx }}
        >
          {loading ? (
            <CircularProgress size={14} color="inherit" />
          ) : (
            <ReceiptLongIcon fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default ReceiptDownloadButton;
