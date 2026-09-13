import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, MenuItem, Typography, Box,
  CircularProgress, Stack, Divider, Alert, alpha,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ChequeStatusBadge from './ChequeStatusBadge';
import { updateChequeStatus } from '../../services/api';

// ── Constants ─────────────────────────────────────────────────────────────────

const CHEQUE_STATUSES = [
  { value: 'ISSUED',    label: 'Issued' },
  { value: 'CLEARED',   label: 'Cleared' },
  { value: 'BOUNCED',   label: 'Bounced' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

/** BOUNCED and CANCELLED always require a written reason. */
const REQUIRES_REASON = new Set(['BOUNCED', 'CANCELLED']);

const REASON_PLACEHOLDER = {
  BOUNCED:   'e.g. Insufficient funds, signature mismatch, account closed…',
  CANCELLED: 'e.g. Payment received via alternate mode, customer requested…',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * ChequeTrackerDialog — Admin-only dialog to update the status of a tracked cheque.
 *
 * Props:
 *   open           {boolean}  Dialog open state
 *   onClose        {Function} Fired on cancel or after a successful update
 *   cheque         {object}   Cheque record: { id, chequeNumber, bankName, chequeDate,
 *                                              maturityDate, status, paymentId? }
 *   onStatusUpdate {Function} Optional callback fired with the updated cheque after success
 */
const ChequeTrackerDialog = ({ open, onClose, cheque, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState('ISSUED');
  const [reason, setReason]       = useState('');
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]   = useState(null);

  // Reset form whenever the dialog re-opens with a (possibly different) cheque.
  useEffect(() => {
    if (open && cheque) {
      setNewStatus(cheque.status || 'ISSUED');
      setReason('');
      setErrors({});
      setApiError(null);
      setSubmitting(false);
    }
  }, [open, cheque]);

  const requiresReason  = REQUIRES_REASON.has(newStatus);
  const isStatusChanged = newStatus && newStatus !== cheque?.status;

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = () => {
    const e = {};
    if (!newStatus) {
      e.status = 'Please select a status';
    }
    if (requiresReason && !reason.trim()) {
      e.reason = `A reason is required when marking a cheque as ${newStatus.toLowerCase()}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate() || !cheque?.id) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const updated = await updateChequeStatus(
        cheque.id,
        newStatus,
        reason.trim() || null,
      );
      if (onStatusUpdate) onStatusUpdate(updated);
      onClose();
    } catch (err) {
      setApiError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update cheque status. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Guard: nothing to render without a cheque.
  if (!cheque) return null;

  // Confirm button colour follows the target status.
  const confirmColor =
    newStatus === 'BOUNCED'   ? { bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } } :
    newStatus === 'CLEARED'   ? { bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } } :
    newStatus === 'CANCELLED' ? { bgcolor: '#64748b', '&:hover': { bgcolor: '#475569' } } :
    {};

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="cheque-tracker-dialog-title"
      aria-describedby="cheque-tracker-dialog-desc"
    >
      {/* ── Header ── */}
      <DialogTitle id="cheque-tracker-dialog-title" sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            aria-hidden="true"
            sx={{
              p: 1,
              borderRadius: 1.5,
              bgcolor: alpha('#b45309', 0.1),
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CheckBoxOutlineBlankIcon sx={{ color: '#b45309', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} id="cheque-tracker-dialog-title">
              Update Cheque Status
            </Typography>
            <Typography
              id="cheque-tracker-dialog-desc"
              variant="caption"
              color="text.secondary"
            >
              Cheque #{cheque.chequeNumber}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* API error banner */}
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {apiError}
          </Alert>
        )}

        {/* ── Cheque details (read-only) ── */}
        <Box
          role="region"
          aria-label="Cheque details"
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha('#b45309', 0.05),
            border: `1px solid ${alpha('#b45309', 0.2)}`,
          }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1.5 }}
          >
            Cheque Details
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Cheque No.</Typography>
              <Typography variant="body2" fontWeight={700}>{cheque.chequeNumber || '—'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Bank</Typography>
              <Typography variant="body2" fontWeight={700}>{cheque.bankName || '—'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Cheque Date</Typography>
              <Typography variant="body2" fontWeight={700}>{formatDate(cheque.chequeDate)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Maturity Date</Typography>
              <Typography variant="body2" fontWeight={700}>
                {cheque.maturityDate ? formatDate(cheque.maturityDate) : 'Not post-dated'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption" color="text.secondary">Current Status:</Typography>
                <ChequeStatusBadge status={cheque.status} showIcon size="small" />
              </Stack>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* ── Status + Reason fields ── */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              select
              id="cheque-new-status"
              label="New Status"
              value={newStatus}
              onChange={(e) => {
                setNewStatus(e.target.value);
                setErrors({});
              }}
              error={!!errors.status}
              helperText={errors.status}
              fullWidth
              required
              inputProps={{
                'aria-label': 'Select new cheque status',
                'aria-required': 'true',
                'aria-invalid': !!errors.status,
                'aria-describedby': errors.status ? 'cheque-new-status-helper-text' : undefined,
              }}
              FormHelperTextProps={{ id: 'cheque-new-status-helper-text' }}
            >
              {CHEQUE_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <ChequeStatusBadge status={s.value} showIcon size="small" />
                    {s.value === cheque?.status && (
                      <Typography variant="caption" color="text.secondary">
                        (current)
                      </Typography>
                    )}
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {requiresReason && (
            <Grid item xs={12}>
              <TextField
                id="cheque-status-reason"
                label={`Reason for marking as ${newStatus.charAt(0) + newStatus.slice(1).toLowerCase()} *`}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setErrors((prev) => ({ ...prev, reason: '' }));
                }}
                error={!!errors.reason}
                helperText={errors.reason || 'Explain why this cheque status is changing'}
                multiline
                minRows={2}
                fullWidth
                required
                placeholder={REASON_PLACEHOLDER[newStatus] || ''}
                inputProps={{
                  'aria-label': `Reason for cheque status ${newStatus.toLowerCase()} (required)`,
                  'aria-required': 'true',
                  'aria-invalid': !!errors.reason,
                  'aria-describedby': 'cheque-status-reason-helper-text',
                  maxLength: 500,
                }}
                FormHelperTextProps={{ id: 'cheque-status-reason-helper-text' }}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          aria-label="Cancel and close dialog"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !isStatusChanged}
          startIcon={
            submitting
              ? <CircularProgress size={16} color="inherit" aria-hidden="true" />
              : <CheckCircleIcon aria-hidden="true" />
          }
          aria-label={
            submitting
              ? 'Updating cheque status, please wait'
              : `Confirm cheque status update to ${newStatus}`
          }
          sx={{ minWidth: 140, minHeight: 44, ...confirmColor }}
        >
          {submitting ? 'Updating…' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChequeTrackerDialog;
