import React, { useState } from 'react';
import {
  Paper, Typography, Stack, Box, Chip, Button, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  CircularProgress, Tooltip, Avatar, Grid, LinearProgress, IconButton,
  Stepper, Step, StepLabel,
} from '@mui/material';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import ShieldIcon from '@mui/icons-material/Shield';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';

/**
 * Enterprise AutoPay Mandate Command Center for VyaparSathi.
 * Provides real-time mandate lifecycle tracking, copyable identifiers,
 * RBI e-mandate limit compliance details, and granular cancellation management.
 */
export default function AutoPayStatusCard({
  razorpayStatus,
  actionLoading = false,
  onPause,
  onResume,
  onCancel,
}) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelAtEnd, setCancelAtEnd] = useState(true);
  const [certificateOpen, setCertificateOpen] = useState(false);

  const copyToClipboard = (text, label) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    }
  };

  if (!razorpayStatus || razorpayStatus.status === 'NONE') {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: '20px',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Avatar
          sx={{
            width: 60,
            height: 60,
            bgcolor: '#F1F5F9',
            color: '#64748B',
            mx: 'auto',
            mb: 2,
          }}
        >
          <ShieldIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Typography variant="h6" fontWeight={800} color="text.primary">
          No Active AutoPay Mandate
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 440, mx: 'auto' }}>
          Your account is currently operating without an automatic renewal mandate. Select an enterprise plan from the
          <strong> Pricing & Plans</strong> tab to activate automated e-mandate billing.
        </Typography>
      </Paper>
    );
  }

  const status = razorpayStatus.status?.toUpperCase() || 'NONE';
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

  const paid = razorpayStatus.paidCount || 0;
  const remaining = razorpayStatus.remainingCount || 0;
  const totalCycles = paid + remaining || 12;
  const progressPct = Math.min(100, Math.round((paid / totalCycles) * 100));

  // Determine active step for Stepper
  let activeStep = 1;
  if (isActive) activeStep = 3;
  if (isPaused) activeStep = 2;
  if (isCancelled) activeStep = 4;

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
          position: 'relative',
        }}
      >
        {/* Header Ribbon */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: '#EFF6FF', color: '#2563EB', width: 42, height: 42 }}>
              <AutoAwesomeIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={900}>
                AutoPay Mandate Command Center
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Razorpay Automated Recurring Billing (RBI e-Mandate Compliant)
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={status}
              color={statusColor()}
              size="small"
              sx={{ fontWeight: 900, borderRadius: '6px', fontSize: '0.7rem' }}
            />
            {cancelPending && (
              <Chip
                label="CANCELS AT CYCLE END"
                color="warning"
                size="small"
                variant="outlined"
                sx={{ fontWeight: 800, borderRadius: '6px', fontSize: '0.65rem' }}
              />
            )}
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Technical Identifiers Grid */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', mb: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Subscription ID
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'text.primary' }}>
                  {razorpayStatus.razorpaySubscriptionId || 'N/A'}
                </Typography>
                {razorpayStatus.razorpaySubscriptionId && (
                  <IconButton size="small" onClick={() => copyToClipboard(razorpayStatus.razorpaySubscriptionId, 'Subscription ID')}>
                    <ContentCopyIcon fontSize="small" sx={{ fontSize: 13 }} />
                  </IconButton>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Customer ID
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'text.primary' }}>
                  {razorpayStatus.razorpayCustomerId || 'N/A'}
                </Typography>
                {razorpayStatus.razorpayCustomerId && (
                  <IconButton size="small" onClick={() => copyToClipboard(razorpayStatus.razorpayCustomerId, 'Customer ID')}>
                    <ContentCopyIcon fontSize="small" sx={{ fontSize: 13 }} />
                  </IconButton>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Parameters Grid */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
              Plan Tier
            </Typography>
            <Typography variant="body2" fontWeight={900}>
              {razorpayStatus.planCode || 'N/A'} ({razorpayStatus.billingCycle || 'MONTHLY'})
            </Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
              Auto-Charge Amount
            </Typography>
            <Typography variant="body2" fontWeight={900} color="primary">
              ₹{razorpayStatus.priceAmount ? Number(razorpayStatus.priceAmount).toFixed(2) : '999.00'}
            </Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
              Next Scheduled Debit
            </Typography>
            <Typography variant="body2" fontWeight={800}>
              {formatDate(razorpayStatus.nextChargeAt)}
            </Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
              Access Period Valid Till
            </Typography>
            <Typography variant="body2" fontWeight={800}>
              {formatDate(razorpayStatus.validTill)}
            </Typography>
          </Grid>
        </Grid>

        {/* Cycle Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              Billing Cycles Progress: <strong>{paid} of {totalCycles} paid</strong>
            </Typography>
            <Typography variant="caption" fontWeight={800} color="primary">
              {remaining} cycles remaining
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{ height: 8, borderRadius: 4, bgcolor: '#E2E8F0' }}
          />
        </Box>

        {/* Mandate Lifecycle Stepper */}
        <Box sx={{ mb: 3, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
            Mandate Lifecycle Progress
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.7rem', fontWeight: 700 } }}>
            <Step completed>
              <StepLabel>Mandate Configured</StepLabel>
            </Step>
            <Step completed={isActive || isPaused}>
              <StepLabel>NPCI / Bank Auth</StepLabel>
            </Step>
            <Step completed={isActive}>
              <StepLabel>{isPaused ? 'AutoPay Paused' : 'Active Recurring'}</StepLabel>
            </Step>
            <Step completed={isCancelled}>
              <StepLabel>{isCancelled ? 'Terminated' : 'Next Auto-Debit'}</StepLabel>
            </Step>
          </Stepper>
        </Box>

        {/* Compliance Footer */}
        <Box sx={{ p: 1.5, bgcolor: '#F1F5F9', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <VerifiedUserIcon color="primary" sx={{ fontSize: 18 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              RBI e-Mandate Regulated · Max Recurring Debit Limit: ₹15,000 / charge
            </Typography>
          </Stack>
          <Button
            size="small"
            variant="text"
            startIcon={<ReceiptLongIcon />}
            onClick={() => setCertificateOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.7rem' }}
          >
            Mandate Certificate
          </Button>
        </Box>

        {/* Action Buttons */}
        {!isCancelled && !cancelPending && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            {isActive && (
              <Tooltip title="Temporarily halt recurring debits. Your active subscription access remains fully functional until the current cycle expires.">
                <span style={{ flex: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={actionLoading ? <CircularProgress size={14} /> : <PauseCircleOutlineIcon />}
                    disabled={actionLoading}
                    onClick={onPause}
                    sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', py: 1 }}
                  >
                    Pause Recurring Charges
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
                sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', py: 1, flex: 1 }}
              >
                Resume AutoPay Mandate
              </Button>
            )}

            <Button
              variant="text"
              color="error"
              size="small"
              startIcon={<CancelOutlinedIcon />}
              disabled={actionLoading}
              onClick={() => setCancelDialogOpen(true)}
              sx={{ fontWeight: 800, textTransform: 'none', px: 2 }}
            >
              Cancel Mandate
            </Button>
          </Stack>
        )}

        {cancelPending && (
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px' }}>
            <Typography variant="caption" color="#92400E" fontWeight={800} sx={{ display: 'block' }}>
              ⚠ Cancellation scheduled at end of current billing cycle.
            </Typography>
            <Typography variant="caption" color="#92400E">
              Your AutoPay e-mandate will not auto-charge next period. Your premium access remains uninterrupted until <strong>{formatDate(razorpayStatus.validTill)}</strong>.
            </Typography>
          </Paper>
        )}
      </Paper>

      {/* ── Granular Cancellation Dialog ── */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <Box sx={{ textAlign: 'center', pt: 2.5 }}>
          <Avatar sx={{ bgcolor: '#FEE2E2', color: '#DC2626', width: 52, height: 52, mx: 'auto', mb: 1 }}>
            <CancelOutlinedIcon fontSize="large" />
          </Avatar>
        </Box>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 900, pb: 1 }}>
          Manage Mandate Cancellation
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.85rem', mb: 2 }}>
            Choose how you would like to terminate your Razorpay recurring mandate.
          </DialogContentText>

          <Stack spacing={1.5}>
            <Paper
              elevation={0}
              onClick={() => setCancelAtEnd(true)}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: '2px solid',
                borderColor: cancelAtEnd ? 'primary.main' : 'divider',
                bgcolor: cancelAtEnd ? '#EFF6FF' : 'background.paper',
                cursor: 'pointer',
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} color={cancelAtEnd ? 'primary.main' : 'text.primary'}>
                Cancel at End of Cycle (Recommended)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Retain access to all premium features until your paid period concludes on <strong>{formatDate(razorpayStatus.validTill)}</strong>.
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              onClick={() => setCancelAtEnd(false)}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: '2px solid',
                borderColor: !cancelAtEnd ? 'error.main' : 'divider',
                bgcolor: !cancelAtEnd ? '#FEF2F2' : 'background.paper',
                cursor: 'pointer',
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} color={!cancelAtEnd ? 'error.main' : 'text.primary'}>
                Cancel Immediately
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Revoke the mandate immediately and downgrade your account to the FREE tier today.
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2.5 }}>
          <Button
            fullWidth
            variant="contained"
            color={cancelAtEnd ? 'primary' : 'error'}
            onClick={() => {
              setCancelDialogOpen(false);
              if (onCancel) onCancel(cancelAtEnd);
            }}
            sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', py: 1.25 }}
          >
            Confirm Cancellation
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => setCancelDialogOpen(false)}
            sx={{ fontWeight: 700, textTransform: 'none', color: 'text.secondary' }}
          >
            Keep AutoPay Active
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Mandate Certificate Modal ── */}
      <Dialog
        open={certificateOpen}
        onClose={() => setCertificateOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AccountBalanceIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={900}>
              e-Mandate Authorization Certificate
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => setCertificateOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #CBD5E1', borderRadius: '12px', bgcolor: '#F8FAFC' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase' }}>
              National Payments Corporation of India (NPCI) / RBI Mandate Proof
            </Typography>
            <Typography variant="h6" fontWeight={900} sx={{ mt: 0.5, mb: 2 }}>
              Recurring Debit Registration Proof
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Mandate Reference ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                  {razorpayStatus.razorpaySubscriptionId || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Customer Reference</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                  {razorpayStatus.razorpayCustomerId || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Service Beneficiary</Typography>
                <Typography variant="body2" fontWeight={700}>DesiTech Solutions Pvt. Ltd.</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Maximum Debit Cap</Typography>
                <Typography variant="body2" fontWeight={800}>₹15,000.00 / charge</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Billing Frequency</Typography>
                <Typography variant="body2" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
                  {razorpayStatus.billingCycle || 'Monthly'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Mandate Status</Typography>
                <Typography variant="body2" fontWeight={800} color="success.main">
                  {status} (NPCI Verified)
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
              * This electronic mandate record validates authorized recurring debits executed via Razorpay Payment Network in full accordance with Reserve Bank of India (RBI) circular on e-mandates.
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none' }}
          >
            Print Proof
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
