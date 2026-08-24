import React, { useState, useEffect } from 'react';
import { Box, Chip, Collapse, Tooltip } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import { useWebSocketContext } from '../../context/WebSocketContext';

/**
 * OfflineIndicator
 *
 * A fixed-position pill that surfaces two distinct degraded states:
 *
 *   1. Browser offline  → "Offline — changes will sync when back online"
 *      Triggered by navigator.onLine / online + offline window events.
 *
 *   2. Socket disconnected (browser is online but lost STOMP connection)
 *      → "Reconnecting…"
 *      The STOMP client retries automatically every 5 s; this just
 *      lets the user know live updates are temporarily paused.
 *
 * The pill fades in when either condition is true and disappears when
 * the connection is healthy again.  It renders nothing while healthy so
 * it takes zero layout space in the normal case.
 */
const OfflineIndicator = () => {
  const { isOnline, connected } = useWebSocketContext();

  // Small debounce: don't flash the "Reconnecting" chip on every
  // sub-second blip while the STOMP client is doing its initial handshake.
  const [showReconnecting, setShowReconnecting] = useState(false);

  useEffect(() => {
    if (!connected && isOnline) {
      const id = setTimeout(() => setShowReconnecting(true), 2500);
      return () => clearTimeout(id);
    }
    setShowReconnecting(false);
  }, [connected, isOnline]);

  const offline     = !isOnline;
  const reconnecting = isOnline && showReconnecting;
  const visible     = offline || reconnecting;

  return (
    <Collapse in={visible} timeout={300} unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          pointerEvents: 'none',
        }}
      >
        {offline ? (
          <Tooltip
            title="No internet connection — any actions you take will be queued and synced automatically when you reconnect."
            placement="top"
          >
            <Chip
              icon={<WifiOffIcon />}
              label="Offline"
              color="error"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                px: 0.5,
                boxShadow: 4,
                pointerEvents: 'auto',
              }}
            />
          </Tooltip>
        ) : (
          <Tooltip
            title="Lost connection to the server — live updates paused. Reconnecting automatically…"
            placement="top"
          >
            <Chip
              icon={
                <SyncIcon
                  sx={{
                    animation: 'vs-spin 1.2s linear infinite',
                    '@keyframes vs-spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                  }}
                />
              }
              label="Reconnecting…"
              color="warning"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                px: 0.5,
                boxShadow: 4,
                pointerEvents: 'auto',
              }}
            />
          </Tooltip>
        )}
      </Box>
    </Collapse>
  );
};

export default OfflineIndicator;
