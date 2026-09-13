/**
 * ErrorState.jsx — Enterprise error page for connection issues
 *
 * Usage:
 *   if (error) return <ErrorState error={error} onRetry={handleRetry} />;
 */

import React from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Container,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppPalette } from '../../hooks/useAppPalette';

export function ErrorState({
  error = {},
  onRetry = null,
  showGoHome = true,
}) {
  const navigate = useNavigate();
  const palette = useAppPalette();

  const {
    title = 'Something Went Wrong',
    message = 'Unable to load this page. Please check your connection and try again.',
    icon = '⚠️',
  } = error;

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center' }}>
          {/* Icon */}
          <Box
            sx={{
              fontSize: { xs: 56, sm: 64 },
              mb: 2,
              color: palette.error,
            }}
          >
            {icon}
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              mb: 1,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>

          {/* Message */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 3,
              lineHeight: 1.6,
              fontSize: '0.95rem',
            }}
          >
            {message}
          </Typography>

          {/* Action Buttons */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{
              flexWrap: 'wrap',
              gap: 2,
              mb: 3,
            }}
          >
            {onRetry && (
              <Button
                variant="contained"
                size="large"
                onClick={onRetry}
                sx={{
                  minWidth: 160,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                🔄 Try Again
              </Button>
            )}
            {showGoHome && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/', { replace: true })}
                sx={{
                  minWidth: 160,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                🏠 Go Home
              </Button>
            )}
          </Stack>

          {/* Support Message */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              fontSize: '0.85rem',
            }}
          >
            If this problem persists, please contact support or check your internet connection.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default ErrorState;
