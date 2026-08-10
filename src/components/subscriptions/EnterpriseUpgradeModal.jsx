import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Typography,
  Button, Box, Stack, CircularProgress, Alert, Paper, alpha
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SaveIcon from '@mui/icons-material/Save';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../context/SubscriptionContext';

const EnterpriseUpgradeModal = ({
  open,
  onClose,
  upgradeOptions,
  onSaveDraft,
}) => {
  const navigate = useNavigate();
  const { initiateTrial, refreshStatus } = useSubscription();
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canStartTrial = upgradeOptions?.canStartTrial !== false;
  const trialDays = upgradeOptions?.trialDays || 14;

  const handleActivateTrial = async () => {
    setActivatingTrial(true);
    setErrorMsg('');
    try {
      await initiateTrial();
      await refreshStatus(false);
      onClose(true); // pass true indicating trial activated so parent can retry
    } catch (err) {
      console.error('Failed to activate trial:', err);
      const msg = err.response?.data?.message || 'Failed to activate trial. You may have already used your trial.';
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
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ height: 6, background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)' }} />

      <DialogTitle sx={{ pt: 3, pb: 1, px: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: '50%', bgcolor: alpha('#6366f1', 0.15), color: '#818cf8', mb: 1.5 }}>
          <LockIcon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
          Unlock Full Billing & POS Access
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1 }}>
        <Stack spacing={2} textAlign="center">
          <Typography variant="body1" sx={{ color: '#94a3b8', fontSize: '0.975rem' }}>
            Your current plan configuration does not include direct sale completion.
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: alpha('#334155', 0.4),
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'left',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#e2e8f0', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon sx={{ fontSize: 18, color: '#fbbf24' }} />
              Enterprise Features Included:
            </Typography>
            <Stack spacing={0.8} sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ color: '#34d399', fontWeight: 900 }}>✓</Box> Direct POS Checkout & Sale Processing
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ color: '#34d399', fontWeight: 900 }}>✓</Box> Unlimited GST Invoices & Payment Tracking
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ color: '#34d399', fontWeight: 900 }}>✓</Box> Full Stock & Inventory Management
              </Box>
            </Stack>
          </Paper>

          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: 2, bgcolor: alpha('#ef4444', 0.1), color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
              {errorMsg}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 1.5 }}>
        {canStartTrial ? (
          <Button
            fullWidth
            variant="contained"
            disabled={activatingTrial}
            onClick={handleActivateTrial}
            startIcon={activatingTrial ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            sx={{
              py: 1.5,
              borderRadius: 2.5,
              fontWeight: 900,
              fontSize: '1rem',
              background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
              '&:hover': {
                background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
              },
            }}
          >
            {activatingTrial ? 'ACTIVATING TRIAL...' : `Activate ${trialDays}-Day Full Access Trial`}
          </Button>
        ) : (
          <Alert severity="info" sx={{ width: '100%', borderRadius: 2, bgcolor: alpha('#3b82f6', 0.1), color: '#93c5fd' }}>
            14-Day Free Trial has already been used on this account.
          </Alert>
        )}

        <Button
          fullWidth
          variant="outlined"
          onClick={handleSaveDraft}
          startIcon={<SaveIcon />}
          sx={{
            py: 1.2,
            borderRadius: 2.5,
            fontWeight: 800,
            color: '#38bdf8',
            borderColor: alpha('#38bdf8', 0.4),
            '&:hover': {
              borderColor: '#38bdf8',
              bgcolor: alpha('#38bdf8', 0.1),
            },
          }}
        >
          Save Sale as Draft
        </Button>

        <Button
          fullWidth
          variant="text"
          onClick={handleViewPlans}
          startIcon={<ShoppingBagIcon />}
          sx={{
            fontWeight: 700,
            color: '#94a3b8',
            '&:hover': { color: '#ffffff', bgcolor: alpha('#ffffff', 0.05) },
          }}
        >
          View Pricing Plans
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnterpriseUpgradeModal;
