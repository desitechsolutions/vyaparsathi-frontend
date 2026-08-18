import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { fetchMySessions, revokeSession, revokeAllOtherSessions } from '../services/api';

/**
 * Active Sessions — one row per browser/device currently signed in as
 * the caller. Users see this from Account Security. Revoking a row
 * kills that session's access token within milliseconds via the
 * backend denylist (see JwtAuthenticationFilter + SessionDenylistService).
 *
 * The current session is marked and its "Revoke" button is disabled —
 * to end the current session the user should use "Sign out" instead.
 */
export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [revokeDialog, setRevokeDialog] = useState({ open: false, session: null });
  const [revokeAllDialog, setRevokeAllDialog] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMySessions();
      const list = Array.isArray(res?.data) ? res.data : [];
      // Sort: current row on top, then most-recently-active first
      list.sort((a, b) => {
        if (a.current && !b.current) return -1;
        if (b.current && !a.current) return 1;
        return new Date(b.lastActiveAt || 0) - new Date(a.lastActiveAt || 0);
      });
      setSessions(list);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load your active sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRevoke = async () => {
    const sid = revokeDialog.session?.sessionId;
    if (!sid) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await revokeSession(sid);
      setSuccess('Session signed out.');
      setRevokeDialog({ open: false, session: null });
      load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not revoke that session.');
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeAll = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await revokeAllOtherSessions();
      const count = res?.data?.data?.revokedCount ?? 0;
      setSuccess(count === 0
        ? 'You were only signed in on this device.'
        : `Signed out ${count} other session${count === 1 ? '' : 's'}.`);
      setRevokeAllDialog(false);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not revoke your other sessions.');
    } finally {
      setBusy(false);
    }
  };

  const deviceIcon = (label = '') => {
    const l = label.toLowerCase();
    if (l.includes('iphone') || l.includes('android') || l.includes('ipad')) {
      return <PhoneAndroidIcon fontSize="small" />;
    }
    return <LaptopMacIcon fontSize="small" />;
  };

  const timeAgo = (iso) => {
    if (!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60_000) return 'just now';
    const mins = Math.floor(ms / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 48) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const otherActiveCount = sessions.filter((s) => !s.current).length;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
              <DevicesIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800}>Active sessions</Typography>
              <Typography variant="body2" color="text.secondary">
                Every browser and device currently signed in as you. Revoke any session you don't recognize.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Reload sessions">
              <IconButton onClick={load} disabled={loading} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LogoutIcon />}
              disabled={loading || otherActiveCount === 0}
              onClick={() => setRevokeAllDialog(true)}
            >
              Sign out everywhere else
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {loading ? (
          <Stack alignItems="center" py={6}><CircularProgress /></Stack>
        ) : sessions.length === 0 ? (
          <Alert severity="info">No active sessions found.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Signed in</TableCell>
                  <TableCell>Last active</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.sessionId} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        {deviceIcon(s.deviceLabel)}
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {s.deviceLabel || 'Unknown device'}
                          </Typography>
                          {s.current && (
                            <Chip
                              size="small"
                              color="success"
                              variant="outlined"
                              icon={<CheckCircleIcon />}
                              label="This device"
                              sx={{ mt: 0.5, height: 20 }}
                            />
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{s.ipAddress || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{timeAgo(s.createdAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{timeAgo(s.lastActiveAt)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="warning"
                        variant="outlined"
                        disabled={s.current}
                        onClick={() => setRevokeDialog({ open: true, session: s })}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider sx={{ my: 3 }} />

        <Alert severity="info" variant="outlined">
          Don't recognize a session? Revoke it immediately, then change your password from Account Security to
          keep the intruder locked out.
        </Alert>
      </Paper>

      {/* Revoke one — confirm */}
      <Dialog open={revokeDialog.open} onClose={() => !busy && setRevokeDialog({ open: false, session: null })}>
        <DialogTitle>Revoke this session?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {revokeDialog.session?.deviceLabel || 'That device'} will be signed out immediately. If it was you,
            you'll need to sign in again there.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialog({ open: false, session: null })} disabled={busy}>Cancel</Button>
          <Button color="warning" variant="contained" onClick={handleRevoke} disabled={busy}>Revoke</Button>
        </DialogActions>
      </Dialog>

      {/* Revoke all except current — confirm */}
      <Dialog open={revokeAllDialog} onClose={() => !busy && setRevokeAllDialog(false)}>
        <DialogTitle>Sign out everywhere else?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {otherActiveCount} other session{otherActiveCount === 1 ? '' : 's'} will be signed out. This device
            stays signed in.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeAllDialog(false)} disabled={busy}>Cancel</Button>
          <Button color="warning" variant="contained" onClick={handleRevokeAll} disabled={busy}>Sign out others</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
