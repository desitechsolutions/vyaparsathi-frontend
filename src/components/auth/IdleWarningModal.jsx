import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  LinearProgress,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';

/**
 * Modal shown when the smart idle timer trips its warning threshold —
 * gives the user a live countdown and a "Stay signed in" button that
 * signals activity back through the idle timer, dismissing the modal.
 *
 * If they don't click and the countdown hits zero, the parent
 * (AuthContext) triggers the actual logout — this component only
 * shows the state, never enforces expiry itself.
 *
 * Props:
 *   open          — whether the modal is shown
 *   initialMs     — milliseconds remaining when the modal opened
 *   onStay        — user clicked "Stay signed in"
 *   onLogout      — user clicked "Sign out now"
 */
export default function IdleWarningModal({ open, initialMs, onStay, onLogout }) {
  const [remainingMs, setRemainingMs] = useState(initialMs || 0);

  // Reset the local countdown whenever the modal opens with fresh data.
  useEffect(() => {
    if (open) setRemainingMs(initialMs || 0);
  }, [open, initialMs]);

  // Tick every second while open. Doesn't drive logout — that happens
  // via the idle timer's own interval — this is just for display.
  useEffect(() => {
    if (!open) return undefined;
    const tick = setInterval(() => {
      setRemainingMs((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [open]);

  const seconds = Math.max(0, Math.floor(remainingMs / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  const progress = initialMs > 0 ? Math.max(0, Math.min(100, (remainingMs / initialMs) * 100)) : 0;

  return (
    <Dialog
      open={!!open}
      onClose={onStay}
      // Prevent accidentally dismissing via backdrop click during a
      // security-adjacent prompt.
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <HourglassBottomIcon color="warning" />
          <span>Still there?</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          You'll be signed out for security in <strong>{mins > 0 ? `${mins}m ` : ''}{secs}s</strong>
          . Any moment of activity — clicking, typing, moving your mouse — will keep you signed in.
        </DialogContentText>
        <Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={progress < 25 ? 'error' : 'warning'}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Time until automatic sign-out
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onLogout}>Sign out now</Button>
        <Button variant="contained" onClick={onStay} autoFocus>Stay signed in</Button>
      </DialogActions>
    </Dialog>
  );
}
