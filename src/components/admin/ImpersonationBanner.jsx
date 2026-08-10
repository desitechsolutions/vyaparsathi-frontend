import React from 'react';
import { Paper, Box, Typography, Button, Stack } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

export default function ImpersonationBanner({ sessionData, onExit }) {
  if (!sessionData) return null;

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        bgcolor: '#DC2626',
        color: '#FFFFFF',
        borderRadius: 0,
        px: 3,
        py: 1,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WarningIcon sx={{ color: '#FDE047' }} />
          <Typography variant="body2" fontWeight={800}>
            ⚡ IMPERSONATION MODE ACTIVE: Currently operating as merchant account #{sessionData.targetShopId} ({sessionData.targetShopName}). Actions are recorded.
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={<ExitToAppIcon />}
          onClick={onExit}
          sx={{
            bgcolor: '#FFFFFF',
            color: '#DC2626',
            fontWeight: 900,
            '&:hover': { bgcolor: '#FEE2E2' },
          }}
        >
          Exit Impersonation
        </Button>
      </Stack>
    </Paper>
  );
}
