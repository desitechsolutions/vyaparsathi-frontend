import React, { useState, useEffect } from 'react';
import { Box, Tooltip, useTheme, keyframes } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useOfflineSales } from '../../hooks/useOfflineSales';

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulseAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

/**
 * M-10 fix: isSyncing and isOffline now come from useOfflineSales (the single
 * source of truth). The placeholder setTimeout is removed.
 * L-5 fix: health-check polling is consolidated inside useOfflineSales; no
 * duplicate polling here.
 */
const StatusIndicators = ({ isMobile = false }) => {
  const theme = useTheme();
  const { isOffline, isSyncing, pendingCount } = useOfflineSales();

  const isOnline = !isOffline;
  const syncTooltip = isSyncing
    ? 'Syncing offline sales…'
    : pendingCount > 0
      ? `${pendingCount} sale(s) pending sync`
      : 'All changes synced';

  if (isMobile) {
    return (
      <Tooltip title={isOnline ? 'Online' : 'Offline'}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            opacity: isOnline ? 0.8 : 0.5,
            transition: 'opacity 200ms',
          }}
        >
          {isOnline ? (
            <WifiIcon sx={{ fontSize: 16, color: 'success.main' }} />
          ) : (
            <WifiOffIcon sx={{ fontSize: 16, color: 'error.main' }} />
          )}
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {/* Connection Status */}
      <Tooltip title={isOnline ? 'Connected' : 'Offline — limited functionality'}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            opacity: isOnline ? 0.85 : 0.5,
            transition: 'opacity 200ms',
            animation: !isOnline ? `${pulseAnimation} 2s infinite` : 'none',
          }}
        >
          {isOnline ? (
            <WifiIcon sx={{ fontSize: 16, color: 'success.main' }} />
          ) : (
            <WifiOffIcon sx={{ fontSize: 16, color: 'error.main' }} />
          )}
        </Box>
      </Tooltip>

      {/* Sync Status */}
      <Tooltip title={syncTooltip}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            opacity: isSyncing || pendingCount > 0 ? 1 : 0.6,
            transition: 'opacity 200ms',
          }}
        >
          {isSyncing ? (
            <SyncIcon
              sx={{
                fontSize: 14,
                color: 'primary.main',
                animation: `${spinAnimation} 1s linear infinite`,
              }}
            />
          ) : (
            <CheckCircleIcon
              sx={{
                fontSize: 14,
                color: pendingCount > 0 ? 'warning.main' : 'success.main',
              }}
            />
          )}
        </Box>
      </Tooltip>

      {/* Data readiness dot */}
      <Tooltip title="Data status: Ready">
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'success.main',
            opacity: 0.7,
            transition: 'all 200ms',
          }}
        />
      </Tooltip>
    </Box>
  );
};

export default StatusIndicators;
