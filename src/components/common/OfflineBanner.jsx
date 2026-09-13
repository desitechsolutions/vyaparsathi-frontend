import React from 'react';
import { Alert, Stack, Chip, LinearProgress } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import OfflineIcon from '@mui/icons-material/SignalCellularOff';

/**
 * Global Offline Indicator Banner
 * Shows when app is offline with pending sync count
 */
export function OfflineBanner({ isOffline, pendingCount = 0, isSyncing = false }) {
  if (!isOffline) return null;

  return (
    <Stack spacing={0.5}>
      <Alert
        severity="warning"
        sx={{
          alignItems: 'center',
          '& .MuiAlert-icon': {
            marginRight: 1,
          },
        }}
        icon={<OfflineIcon />}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
          <span style={{ flex: 1 }}>
            📡 <strong>App is offline</strong> — Using cached data
            {pendingCount > 0 && (
              <Chip
                size="small"
                label={`${pendingCount} pending`}
                sx={{ marginLeft: 1 }}
                variant="outlined"
              />
            )}
          </span>
          {isSyncing && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <SyncIcon sx={{ fontSize: 18, animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.875rem' }}>Syncing...</span>
            </Stack>
          )}
        </Stack>
      </Alert>
      {isSyncing && <LinearProgress variant="indeterminate" />}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Stack>
  );
}

export default OfflineBanner;
