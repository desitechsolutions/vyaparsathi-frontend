import React, { useState } from 'react';
import {
  Paper, Typography, Stack, Box, Chip, Button, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  CircularProgress, Tooltip, Avatar,
} from '@mui/material';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import ShieldIcon from '@mui/icons-material/Shield';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

/**
 * Card component displaying the current Razorpay AutoPay mandate status.
 * Renders action buttons (Pause / Resume / Cancel) based on the mandate state.
 *
 * @param {object} razorpayStatus - Status DTO from GET /api/subscriptions/razorpay/status
 * @param {boolean} actionLoading - True while an action (pause/resume/cancel) is in flight
 * @param {function} onPause      - Pause handler from useRazorpaySubscription
 * @param {function} onResume     - Resume handler
 * @param {function} onCancel     - Cancel handler; called with (cancelAtCycleEnd: boolean)
 */
export default function AutoPayStatusCard({
  razorpayStatus,
  actionLoading = false,
  onPause,
  onResume,
  onCancel,
}) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (!razorpayStatus || razorpayStatus.status === 'NONE') {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '20px',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <ShieldIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
          No AutoPay Mandate
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Subscribe to a plan below to set up an AutoPay mandate.
        </Typography>
      </Paper>
    );
  }

  const status = razorpayStatus.status?.toUpperCase() || 'NONE';
  const mandateStatus = razorpayStatus.mandateStatus?.toUpperCase() || 'NONE';
  const isPaused = status === 'PAUSED';
  const isActive = status === 'ACTIVE' || status === 'AUTHENTICATED';
  const isCancelled = status === 'CANCELLED' || status === 'COMPLETED' || status === 'EXPIRED';
  const isHalted = status === 'HALTED' || status === 'PENDING';
  const cancelPending = razorpayStatus.cancelAtCycleEnd === true;

  const statusColor = () => {
    if (isActive) return 'success';
    if (isPaused) return 'warning';
    if (isCancelled || isHalted) return 'error';
    return 'default';
  };

  const formatDate = (dt) => {
    if (!dt) return 'N/A';
    return new Date(dt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '20px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: '#EFF6FF', color: '#2563EB', width: 36, height: 36 }}>
              <AutoAwesomeIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>AutoPay Mandate</Typography>
              <Typography variant="caption" color="text.secondary">Razorpay Recurring Billing</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip
              label={status}
              color={statusColor()}
              size="small"
              sx={{ fontWeight: 800, borderRadius: '6px', fontSize: '0.65rem' }}
            />
            {cancelPending && (
              <Chip
                label="CANCELS AT CYCLE END"
                color="warning"
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.6rem' }}
              />
            )}
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Info Grid */}
        <Stack spacing={1.5} sx={{ mb: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary" fontWeight={700}>PLAN</Typography>
            <Typography variant="caption" fontWeight={800}>
              {razorpayStatus.planCode || 'N/A'} ({razorpayStatus.billingCycle || 'MONTHLY'})
            </Typography>
          </Stack>

          {razorpayStatus.priceAmount && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" fontWeight={700}>AMOUNT</Typography>
              <Typography variant="caption" fontWeight={800}>₹{razorpayStatus.priceAmount}/cycle</Typography>
            </Stack>
          )}

          {razorpayStatus.nextChargeAt && (
            <Stack direction="row" justifyContent="space-between">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <EventRepeatIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>NEXT CHARGE</Typography>
              </Stack>
              <Typography variant="caption" fontWeight={800}>{formatDate(razorpayStatus.nextChargeAt)}</Typography>
            </Stack>
          )}

          {razorpayStatus.validTill && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" fontWeight={700}>ACCESS UNTIL</Typography>
              <Typography variant="caption" fontWeight={800}>{formatDate(razorpayStatus.validTill)}</Typography>
            </Stack>
          )}

          {razorpayStatus.paidCount !== null && razorpayStatus.paidCount !== undefined && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" fontWeight={700}>CHARGES</Typography>
              <Typography variant="caption" fontWeight={800}>
                {razorpayStatus.paidCount} paid • {razorpayStatus.remainingCount} remaining
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Actions */}
        {!isCancelled && !cancelPending && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {isActive && (
                <Tooltip title="Temporarily stop recurring charges. Access remains active until current period ends.">
                  <span style={{ flex: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="warning"
                      size="small"
                      startIcon={actionLoading ? <CircularProgress size={14} /> : <PauseCircleOutlineIcon />}
                      disabled={actionLoading}
                      onClick={onPause}
                      sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                    >
                      Pause AutoPay
                    </Button>
                  </span>
                </Tooltip>
              )}

              {isPaused && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="success"
                  size="small"
                  startIcon={actionLoading ? <CircularProgress size={14} /> : <PlayCircleOutlineIcon />}
                  disabled={actionLoading}
                  onClick={onResume}
                  sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none', flex: 1 }}
                >
                  Resume AutoPay
                </Button>
              )}

              <Tooltip title="Cancel AutoPay mandate">
                <span>
                  <Button
                    variant="text"
                    color="error"
                    size="small"
                    startIcon={<CancelOutlinedIcon />}
                    disabled={actionLoading}
                    onClick={() => setCancelDialogOpen(true)}
                    sx={{ fontWeight: 700, textTransform: 'none', opacity: 0.75, '&:hover': { opacity: 1 } }}
                  >
                    Cancel
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </>
        )}

        {cancelPending && (
          <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ mt: 1, display: 'block' }}>
            ⚠ Cancellation scheduled at end of current billing cycle. Access remains until then.
          </Typography>
        )}
      </Paper>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '20px', p: 1, maxWidth: 400 } }}
      >
        <Box sx={{ textAlign: 'center', pt: 3 }}>
          <CancelOutlinedIcon color="error" sx={{ fontSize: 56, opacity: 0.2 }} />
        </Box>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
          Cancel Subscription?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: 'center', color: 'text.secondary' }}>
            No future auto-charges will occur. You'll retain access until the end of the
            current billing period, then your plan will revert to FREE.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 3 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => { setCancelDialogOpen(false); onCancel && onCancel(true); }}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5 }}
          >
            Cancel at End of Cycle (Recommended)
          </Button>
          <Button
            fullWidth
            color="error"
            onClick={() => { setCancelDialogOpen(false); onCancel && onCancel(false); }}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Cancel Immediately
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => setCancelDialogOpen(false)}
            sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}
          >
            Keep Subscription
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
