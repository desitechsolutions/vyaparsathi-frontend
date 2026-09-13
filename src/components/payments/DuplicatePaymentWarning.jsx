/**
 * DuplicatePaymentWarning.jsx
 *
 * Non-blocking MUI warning shown when a potential duplicate payment is detected.
 * The user retains full agency: they can cancel to review, or explicitly
 * acknowledge the duplicate and proceed.
 *
 * Design:
 *   MUI v5 · Alert severity="warning" · 375px mobile-first
 *   Accessible: role="alert", aria-label on all interactive elements
 */

import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Link,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import WarningIcon    from '@mui/icons-material/Warning';
import OpenInNewIcon  from '@mui/icons-material/OpenInNew';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (rawDate) => {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate);
  return d.toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// ── Sub: loading indicator ─────────────────────────────────────────────────

const CheckingIndicator = () => (
  <Collapse in>
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}
      aria-live="polite"
      aria-label="Checking for duplicate payments"
    >
      <CircularProgress size={14} thickness={5} color="warning" />
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
        Checking for duplicate payments…
      </Typography>
    </Box>
  </Collapse>
);

// ── Sub: soft caution when the check API itself errored ───────────────────

const CheckErrorNotice = ({ message }) => (
  <Collapse in>
    <Alert
      severity="info"
      sx={{ borderRadius: 2, fontSize: '0.8rem', py: 0.75, mt: 1 }}
      aria-label="Duplicate check notice"
    >
      {message}
    </Alert>
  </Collapse>
);

// ── Main component ────────────────────────────────────────────────────────────

/**
 * DuplicatePaymentWarning
 *
 * Props:
 *   loading          {boolean}      true while the API check is in flight
 *   isDuplicate      {boolean}      true when a matching payment was found
 *   previousPayment  {object|null}  matched payment details from the backend
 *   onCancel         {Function}     called when user chooses "Cancel & Review"
 *   onProceed        {Function}     called when user chooses "Proceed Anyway"
 *   apiError         {string|null}  non-null when the check failed (soft warning)
 */
const DuplicatePaymentWarning = ({
  loading         = false,
  isDuplicate     = false,
  previousPayment = null,
  onCancel,
  onProceed,
  apiError        = null,
}) => {
  if (loading) return <CheckingIndicator />;
  if (apiError && !isDuplicate) return <CheckErrorNotice message={apiError} />;
  if (!isDuplicate) return null;

  // Normalise payment details — backend keys differ across versions.
  const receiptNo  = previousPayment?.receiptNo
    || previousPayment?.receiptNumber
    || previousPayment?.receiptId
    || null;

  const prevDate   = previousPayment?.paymentDate
    || previousPayment?.createdAt
    || previousPayment?.date
    || null;

  const prevAmount = previousPayment?.amount
    ?? previousPayment?.totalAmount
    ?? null;

  const receiptPath = receiptNo ? `/receipts/${receiptNo}` : null;

  const formattedDate   = formatDateTime(prevDate);
  const formattedAmount = prevAmount != null ? formatCurrency(prevAmount) : null;

  const detailLine = [
    formattedAmount,
    formattedDate ? `on ${formattedDate}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Collapse in={isDuplicate}>
      <Alert
        severity="warning"
        icon={<WarningIcon fontSize="small" />}
        role="alert"
        aria-label="Duplicate payment detected — review before proceeding"
        sx={{
          borderRadius: 2,
          mt: 2,
          mb: 0.5,
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        <AlertTitle sx={{ fontWeight: 800, fontSize: '0.9rem', mb: 0.5 }}>
          Duplicate Payment Detected
        </AlertTitle>

        {detailLine && (
          <Typography variant="body2" sx={{ fontSize: '0.82rem', mb: receiptPath ? 0.75 : 1.5 }}>
            Similar payment found: {detailLine}
          </Typography>
        )}

        {receiptPath && (
          <Link
            href={receiptPath}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            aria-label={`View previous payment receipt ${receiptNo}`}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.4,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'warning.dark',
              mb: 1.5,
            }}
          >
            View previous payment receipt
            <OpenInNewIcon sx={{ fontSize: 13 }} />
          </Link>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ mt: receiptPath ? 0 : 0.5 }}
        >
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={onCancel}
            aria-label="Cancel payment and review for duplicates"
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.82rem',
              minHeight: 36,
              borderRadius: 1.5,
              borderColor: 'warning.main',
              color: 'warning.dark',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                borderColor: 'warning.dark',
              },
            }}
          >
            Cancel &amp; Review
          </Button>

          <Button
            size="small"
            variant="contained"
            color="warning"
            onClick={onProceed}
            aria-label="Acknowledge duplicate and proceed with recording payment"
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.82rem',
              minHeight: 36,
              borderRadius: 1.5,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
          >
            Proceed Anyway
          </Button>
        </Stack>
      </Alert>
    </Collapse>
  );
};

export default DuplicatePaymentWarning;
