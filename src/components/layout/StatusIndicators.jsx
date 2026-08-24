import React, { useState, useEffect } from 'react';
import { Box, Tooltip, CircularProgress, useTheme, keyframes } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulseAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const StatusIndicators = ({ isMobile = false }) => {
  const theme = useTheme();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simulate sync state (can be connected to real data sync later)
  useEffect(() => {
    // This would typically be triggered by data mutations
    // For now, it's a placeholder for future integration
    const timer = setTimeout(() => setIsSyncing(false), 2000);
    return () => clearTimeout(timer);
  }, [isSyncing]);

  if (isMobile) {
    // Minimal indicators on mobile (just the main connection status)
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

  // Desktop: Show all three statuses
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {/* Connection Status */}
      <Tooltip title={isOnline ? 'Connected' : 'Offline - Limited functionality'}>
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
      <Tooltip title={isSyncing ? 'Syncing changes...' : 'Changes synced'}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            opacity: isSyncing ? 1 : 0.6,
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
            <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
          )}
        </Box>
      </Tooltip>

      {/* Data Loading Status - Optional for future expansion */}
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
