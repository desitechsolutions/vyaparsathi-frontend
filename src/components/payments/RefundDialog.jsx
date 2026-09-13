import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, MenuItem, Typography, Box, CircularProgress,
} from '@mui/material';
import { refundPayment, getRefundSignedUrl, downloadReceiptPdf } from '../../services/api';

const METHODS = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'CHEQUE', 'OTHER'];

/**
 * Records a refund against an existing Payment. On success, immediately
 * downloads the generated refund receipt PDF.
 *
 * Props:
 *   open          — dialog open state
 *   onClose       — callback fired on cancel or completion
 *   onSuccess     — optional callback fired after successful refund (e.g., to reload history)
 *   payment       — the payment being refunded. Shape: { id, amount, paymentMethod, invoiceNumber? }
 *   maxRefundable — optional; if provided, the amount input is capped here.
 *                    Otherwise defaults to payment.amount.
 */
const RefundDialog = ({ open, onClose, onSuccess, payment, maxRefundable }) => {
  const [form, setForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    reference: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const cap = Number(maxRefundable ?? payment?.amount ?? 0);

  useEffect(() => {
    if (open) {
      setForm({
        amount: cap ? String(cap.toFixed(2)) : '',
        paymentMethod: payment?.paymentMethod || 'CASH',
        reference: '',
        notes: '',
      });
      setErrors({});
      setError(null);
      setSubmitting(false);
    }
  }, [open, payment, cap]);

  const validate = () => {
    const e = {};
    const amt = Number(form.amount);
    if (!amt || amt <= 0) e.amount = 'Enter a positive amount';
    if (amt > cap) e.amount = `Cannot refund more than ₹${cap.toFixed(2)}`;
    if (!form.paymentMethod) e.paymentMethod = 'Method is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !payment?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await refundPayment(payment.id, {
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        reference: form.reference?.trim() || null,
        notes: form.notes?.trim() || null,
      });
      const refund = res?.data;

      // Best-effort auto-download of the refund receipt PDF
      if (refund?.id) {
        try {
          const signedPath = await getRefundSignedUrl(refund.id);
          const filename = `refund_${(refund.refundNo || refund.id).toString().replace(/[\/\\]/g, '_')}.pdf`;
          await downloadReceiptPdf(signedPath, filename);
        } catch (dlErr) {
          console.warn('Refund succeeded but PDF download failed', dlErr);
        }
      }

      if (onSuccess) onSuccess(refund);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Refund failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="refund-dialog-title"
      aria-describedby="refund-dialog-desc"
      // Escape key closes the dialog (MUI default) — preserved
    >
      <DialogTitle id="refund-dialog-title">Refund Payment</DialogTitle>
      <DialogContent dividers>
        <Typography
          id="refund-dialog-desc"
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Refunding {payment?.invoiceNumber ? `payment for invoice #${payment.invoiceNumber}` : `payment #${payment?.id}`}.
          {cap > 0 && (
            <> Maximum refundable: <strong>₹{cap.toFixed(2)}</strong>.</>
          )}
        </Typography>

        {error && (
          <Box
            role="alert"
            aria-live="assertive"
            sx={{ mb: 2, p: 1.5, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}
          >
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              autoFocus
              id="refund-amount"
              label="Refund Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              error={!!errors.amount}
              helperText={errors.amount}
              inputProps={{
                min: 0,
                step: '0.01',
                max: cap,
                'aria-required': 'true',
                'aria-invalid': !!errors.amount,
                'aria-describedby': errors.amount ? 'refund-amount-helper-text' : undefined,
              }}
              FormHelperTextProps={{ id: 'refund-amount-helper-text' }}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              id="refund-method"
              label="Refund Method"
              value={form.paymentMethod}
              onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
              error={!!errors.paymentMethod}
              helperText={errors.paymentMethod}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': !!errors.paymentMethod,
                'aria-describedby': errors.paymentMethod ? 'refund-method-helper-text' : undefined,
              }}
              FormHelperTextProps={{ id: 'refund-method-helper-text' }}
              fullWidth
              required
            >
              {METHODS.map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="refund-reference"
              label="Reference (cheque no, UPI txn id, etc.)"
              value={form.reference}
              onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
              inputProps={{ 'aria-label': 'Reference number for refund (cheque number, UPI transaction ID, etc.)' }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="refund-notes"
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              inputProps={{ 'aria-label': 'Additional notes for this refund (optional)' }}
              multiline
              minRows={2}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={submitting}
          aria-label="Cancel refund and close dialog"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={submitting}
          aria-label={submitting ? 'Processing refund, please wait' : 'Issue refund'}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" aria-hidden="true" /> : null}
        >
          {submitting ? 'Processing...' : 'Issue Refund'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundDialog;
