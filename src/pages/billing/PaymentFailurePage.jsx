import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper, Stack, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

// Reason codes returned from the checkout failure handler
const REASON_MESSAGES = {
  signature_verification_failed:
    'The payment signature could not be verified. Your mandate may not have been activated. Please try again or contact support.',
  verification_exception:
    'An unexpected error occurred during mandate verification. Please contact support with your payment details.',
};

/**
 * Payment failure page shown when the Razorpay checkout fails or the user dismisses it.
 * Reads ?reason= and ?desc= from the URL for context-specific messaging.
 */
export default function PaymentFailurePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || '';
  const errorCode = searchParams.get('code') || '';
  const errorDesc = searchParams.get('desc') || '';

  const message = REASON_MESSAGES[reason]
    || errorDesc
    || 'Your AutoPay setup could not be completed. No charges have been made.';

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
        {/* Failure icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 44, color: '#DC2626' }} />
        </Box>

        <Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>
          Payment Setup Failed
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>

        {errorCode && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', textAlign: 'left' }}>
            <strong>Error Code:</strong> {errorCode}
          </Alert>
        )}

        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => navigate('/billing')}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, px: 4 }}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            startIcon={<SupportAgentIcon />}
            onClick={() => navigate('/support')}
            sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', py: 1.5, px: 3 }}
          >
            Contact Support
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
