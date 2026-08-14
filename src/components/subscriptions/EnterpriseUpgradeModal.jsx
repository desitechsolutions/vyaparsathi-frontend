import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Stack,
  CircularProgress,
  Alert,
  Card,
  Divider,
  IconButton,
  LinearProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../context/SubscriptionContext';

const SectionCaption = ({ icon, label }) => (
  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
    {icon}
    <Typography
      variant="overline"
      sx={{ letterSpacing: '0.08em', fontWeight: 700, color: 'text.secondary', lineHeight: 1 }}
    >
      {label}
    </Typography>
  </Stack>
);

const EnterpriseUpgradeModal = ({
  open,
  onClose,
  upgradeOptions,
  message,
  feature,
  onSaveDraft,
}) => {
  const navigate = useNavigate();
  const { initiateTrial, refreshStatus, subscription } = useSubscription();
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canStartTrial = upgradeOptions?.canStartTrial !== false;
  const trialDays = upgradeOptions?.trialDays || 14;

  const isQuotaCase = useMemo(() => {
    if (feature !== 'CAN_PROCESS_SALE') return false;
    const m = (message || '').toLowerCase();
    return m.includes('monthly limit') || m.includes('quota') || m.includes('sales per month');
  }, [feature, message]);

  const usedThisMonth = subscription?.salesUsedThisMonth ?? null;
  const maxThisMonth = subscription?.maxSalesPerMonth ?? null;
  const showUsageBar =
    isQuotaCase && usedThisMonth != null && maxThisMonth != null && maxThisMonth > 0;
  const usagePct = showUsageBar
    ? Math.min(100, Math.round((usedThisMonth / maxThisMonth) * 100))
    : 0;

  const headline = isQuotaCase
    ? 'Monthly Sales Limit Reached'
    : 'Upgrade Required to Continue';
  const HeaderIcon = isQuotaCase ? ReceiptLongIcon : LockOutlinedIcon;
  const headerColor = isQuotaCase ? 'warning.main' : 'primary.main';

  const bodyMessage =
    message ||
    (isQuotaCase
      ? 'You have used every sale included in your current plan for this month.'
      : 'This action is not included in your current plan configuration.');

  const handleActivateTrial = async () => {
    setActivatingTrial(true);
    setErrorMsg('');
    try {
      await initiateTrial();
      await refreshStatus(false);
      onClose(true);
    } catch (err) {
      console.error('Failed to activate trial:', err);
      const msg =
        err.response?.data?.message ||
        'Failed to activate trial. You may have already used your trial.';
      setErrorMsg(msg);
    } finally {
      setActivatingTrial(false);
    }
  };

  const handleSaveDraft = async () => {
    if (onSaveDraft) {
      await onSaveDraft();
    }
    onClose(false);
  };

  const handleViewPlans = () => {
    onClose(false);
    navigate('/pricing');
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        variant: 'outlined',
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          pt: 2.5,
          pb: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'action.selected'
                : theme.palette.grey[100],
            color: headerColor,
            flexShrink: 0,
          }}
        >
          <HeaderIcon fontSize="small" />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
            {headline}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Vyapar Sathi &middot; Plan &amp; usage
          </Typography>
        </Box>

        <IconButton size="small" onClick={() => onClose(false)} sx={{ mt: -0.5, mr: -0.5 }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2.5}>
          <Box>
            <SectionCaption
              icon={<AutoAwesomeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />}
              label={isQuotaCase ? 'Why you’re seeing this' : 'What’s restricted'}
            />
            <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.55 }}>
              {bodyMessage}
            </Typography>
          </Box>

          {showUsageBar && (
            <Card
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Sales this month
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {usedThisMonth} / {maxThisMonth}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={usagePct}
                color={usagePct >= 100 ? 'error' : usagePct >= 80 ? 'warning' : 'primary'}
                sx={{ height: 8, borderRadius: 999 }}
              />
            </Card>
          )}

          <Box>
            <SectionCaption
              icon={
                <WorkspacePremiumOutlinedIcon
                  sx={{ fontSize: 14, color: 'text.secondary' }}
                />
              }
              label="What you unlock"
            />
            <Card
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}
            >
              <Stack spacing={1}>
                {[
                  'Higher monthly sales limits',
                  'GST invoices, e-way bills &amp; payment tracking',
                  'Full inventory, batches &amp; multi-user access',
                ].map((line) => (
                  <Stack key={line} direction="row" spacing={1} alignItems="flex-start">
                    <CheckCircleOutlineIcon
                      fontSize="small"
                      sx={{ color: 'success.main', mt: '2px' }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.primary' }}
                      dangerouslySetInnerHTML={{ __html: line }}
                    />
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {!canStartTrial && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              14-Day Free Trial has already been used on this account.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="text"
          onClick={handleViewPlans}
          sx={{ fontWeight: 600, mr: 'auto' }}
        >
          View Plans
        </Button>

        {onSaveDraft && (
          <Button
            variant="outlined"
            onClick={handleSaveDraft}
            startIcon={<SaveOutlinedIcon />}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Save as Draft
          </Button>
        )}

        {canStartTrial && (
          <Button
            variant="contained"
            disabled={activatingTrial}
            onClick={handleActivateTrial}
            startIcon={
              activatingTrial ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <AutoAwesomeIcon />
              )
            }
            sx={{ fontWeight: 700, borderRadius: 2, px: 2.25 }}
          >
            {activatingTrial ? 'Activating…' : `Start ${trialDays}-day trial`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EnterpriseUpgradeModal;
