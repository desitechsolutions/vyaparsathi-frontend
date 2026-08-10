import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BoltIcon from '@mui/icons-material/Bolt';
import { useSubscription } from '../../context/SubscriptionContext';

/**
 * Payment success page shown after Razorpay mandate is successfully authenticated.
 * Triggers a subscription status refresh and provides navigation back to the app.
 */
export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { refreshStatus } = useSubscription();

  useEffect(() => {
    // Refresh the core subscription context so the sidebar/header reflects the new tier
    refreshStatus(false);
  }, [refreshStatus]);

  return (
    <Container maxWidth="sm" sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 6 }}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          p: { xs: 4, md: 6 },
          borderRadius: '24px',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        {/* Success icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#DCFCE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 44, color: '#16A34A' }} />
        </Box>

        <Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>
          Mandate Authenticated!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Your AutoPay mandate has been successfully set up.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Your subscription is now active. Future renewals will happen automatically
          — no action needed.
        </Typography>

        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
          <Button
            variant="contained"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, px: 4 }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            startIcon={<BoltIcon />}
            onClick={() => navigate('/billing', { state: { tab: 1 } })}
            sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', py: 1.5, px: 3 }}
          >
            View AutoPay Status
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
