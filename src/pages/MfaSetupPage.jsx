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
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import GppGoodIcon from '@mui/icons-material/GppGood';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import {
  fetchMfaStatus,
  initMfaSetup,
  confirmMfaSetup,
  regenerateBackupCodes,
  disableMfa,
} from '../services/api';

/**
 * MFA setup + management for the currently signed-in user.
 *
 * States:
 *   - loading   — fetching MFA status
 *   - disabled  — user has no MFA, shows "Set up" CTA
 *   - enrolling — QR code shown, waiting for user to confirm first code
 *   - enrolled  — MFA active, shows backup code count + regenerate + disable
 *   - showBackup— transient dialog rendering the 10 raw codes (one-time)
 */
const MfaSetupPage = () => {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'disabled' | 'enrolling' | 'enrolled'
  const [status, setStatus] = useState({ enabled: false, remainingBackupCodes: 0 });
  const [enrollment, setEnrollment] = useState(null); // { secret, qrDataUrl, otpAuthUri }
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [backupDialog, setBackupDialog] = useState({ open: false, codes: [], title: '' });
  const [disableDialog, setDisableDialog] = useState({ open: false, code: '' });
  const [regenDialog, setRegenDialog] = useState({ open: false, code: '' });

  const loadStatus = async () => {
    try {
      const res = await fetchMfaStatus();
      setStatus(res.data);
      setPhase(res.data.enabled ? 'enrolled' : 'disabled');
    } catch (err) {
      setError('Could not load MFA status. Refresh the page to retry.');
      setPhase('disabled');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleStart = async () => {
    clearMessages();
    setBusy(true);
    try {
      const res = await initMfaSetup();
      setEnrollment(res.data);
      setPhase('enrolling');
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start MFA setup.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    clearMessages();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setBusy(true);
    try {
      const res = await confirmMfaSetup(code);
      setBackupDialog({
        open: true,
        codes: res.data.backupCodes || [],
        title: 'Save your backup codes',
      });
      setSuccess('MFA is now active on your account.');
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'The code you entered is incorrect. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    clearMessages();
    if (!regenDialog.code) return;
    setBusy(true);
    try {
      const res = await regenerateBackupCodes(regenDialog.code);
      setRegenDialog({ open: false, code: '' });
      setBackupDialog({
        open: true,
        codes: res.data.backupCodes || [],
        title: 'New backup codes',
      });
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not regenerate backup codes.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    clearMessages();
    if (!disableDialog.code) return;
    setBusy(true);
    try {
      await disableMfa(disableDialog.code);
      setDisableDialog({ open: false, code: '' });
      setSuccess('MFA has been turned off. Consider re-enabling it for your account safety.');
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not disable MFA.');
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); setSuccess('Copied to clipboard.'); }
    catch { setError('Copy failed — select and copy manually.'); }
  };

  const downloadCodes = (codes) => {
    const blob = new Blob([
      'VyaparSathi — MFA backup codes\n',
      'Generated: ' + new Date().toISOString() + '\n\n',
      'Each code works ONCE. Store them offline (paper / password manager).\n\n',
      ...codes.map((c) => `${c}\n`),
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vyaparsathi-mfa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Renderers ───────────────────────────────────────────────────────

  const renderStatusCard = () => (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: status.enabled ? 'success.light' : 'warning.light', color: status.enabled ? 'success.main' : 'warning.main', width: 48, height: 48 }}>
            {status.enabled ? <GppGoodIcon /> : <GppMaybeIcon />}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              Two-factor authentication
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {status.enabled
                ? 'MFA is active — sign-ins require your authenticator code.'
                : 'MFA is off — anyone with your password can sign in.'}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={status.enabled ? 'Enabled' : 'Not set up'}
          color={status.enabled ? 'success' : 'warning'}
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      </Stack>
    </Paper>
  );

  const renderDisabled = () => (
    <Stack spacing={3}>
      {renderStatusCard()}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Set up in 3 steps</Typography>
        <Stack spacing={1.5} sx={{ mb: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>1.</strong> Install an authenticator app (Google Authenticator, Authy, 1Password).
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>2.</strong> Scan the QR code we show you.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>3.</strong> Enter the 6-digit code to confirm — we hand back 10 backup codes to keep offline.
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<ShieldIcon />}
          onClick={handleStart}
          disabled={busy}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {busy ? <CircularProgress size={20} color="inherit" /> : 'Set up MFA'}
        </Button>
      </Paper>
    </Stack>
  );

  const renderEnrolling = () => (
    <Stack spacing={3}>
      {renderStatusCard()}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Scan &amp; confirm</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          <Box sx={{ textAlign: 'center' }}>
            {enrollment?.qrDataUrl && (
              <Box
                component="img"
                src={enrollment.qrDataUrl}
                alt="MFA QR code"
                sx={{ width: 200, height: 200, borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 1, bgcolor: '#fff' }}
              />
            )}
          </Box>
          <Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              Open your authenticator and scan this QR. If you can't scan, enter this secret manually:
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                value={enrollment?.secret || ''}
                InputProps={{ readOnly: true, sx: { fontFamily: 'monospace' } }}
                fullWidth
                size="small"
              />
              <Tooltip title="Copy secret">
                <IconButton size="small" onClick={() => copyToClipboard(enrollment?.secret || '')} aria-label="Copy secret">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Divider />

            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Confirm with the 6-digit code your app shows now:
            </Typography>
            <TextField
              label="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
              inputProps={{
                inputMode: 'numeric',
                maxLength: 6,
                style: { letterSpacing: 8, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 },
              }}
              placeholder="••••••"
              fullWidth
            />

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={() => { setPhase('disabled'); setEnrollment(null); setCode(''); }}
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirm}
                disabled={busy || code.length !== 6}
                sx={{ textTransform: 'none', fontWeight: 700, flex: 1 }}
              >
                {busy ? <CircularProgress size={20} color="inherit" /> : 'Verify & activate'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );

  const renderEnrolled = () => (
    <Stack spacing={3}>
      {renderStatusCard()}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>Backup codes</Typography>
            <Typography variant="body2" color="text.secondary">
              You have <strong>{status.remainingBackupCodes}</strong> unused backup code{status.remainingBackupCodes === 1 ? '' : 's'} left.
              {status.remainingBackupCodes <= 3 && (
                <Typography component="span" color="warning.main" fontWeight={700}> Running low — consider regenerating.</Typography>
              )}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setRegenDialog({ open: true, code: '' })}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Regenerate
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, borderColor: 'error.light' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="error.main">Turn off MFA</Typography>
            <Typography variant="body2" color="text.secondary">
              You'll be able to sign in with just your password. Not recommended.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<PowerSettingsNewIcon />}
            onClick={() => setDisableDialog({ open: true, code: '' })}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Disable MFA
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Stack spacing={0.5} mb={3}>
        <Typography variant="overline" color="text.secondary" fontWeight={700}>Account security</Typography>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
          Two-factor authentication
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add a second factor beyond your password. Every sign-in will need a 6-digit code from your authenticator app.
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} role="alert">{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      {phase === 'loading' && (
        <Stack alignItems="center" py={6} spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">Loading MFA status…</Typography>
        </Stack>
      )}
      {phase === 'disabled' && renderDisabled()}
      {phase === 'enrolling' && renderEnrolling()}
      {phase === 'enrolled' && renderEnrolled()}

      {/* ─── Backup-codes dialog (one-time reveal) ─── */}
      <Dialog open={backupDialog.open} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{backupDialog.title}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            These codes are shown <strong>once</strong>. Each works exactly once. Store them somewhere safe now.
          </Alert>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
            <Stack spacing={0.75}>
              {backupDialog.codes.map((c) => (
                <Typography key={c} sx={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: 2, fontWeight: 700 }}>{c}</Typography>
              ))}
            </Stack>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={() => copyToClipboard(backupDialog.codes.join('\n'))}
            sx={{ textTransform: 'none' }}
          >
            Copy
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => downloadCodes(backupDialog.codes)}
            sx={{ textTransform: 'none' }}
          >
            Download
          </Button>
          <Button
            variant="contained"
            onClick={() => setBackupDialog({ open: false, codes: [], title: '' })}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            I've saved them
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Regenerate dialog ─── */}
      <Dialog open={regenDialog.open} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
        onClose={() => setRegenDialog({ open: false, code: '' })}>
        <DialogTitle sx={{ fontWeight: 800 }}>Regenerate backup codes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your old codes will stop working immediately. Enter a fresh 6-digit code from your authenticator to confirm.
          </Typography>
          <TextField
            label="Authenticator code"
            fullWidth
            autoFocus
            value={regenDialog.code}
            onChange={(e) => setRegenDialog({ ...regenDialog, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            inputProps={{ inputMode: 'numeric', maxLength: 6, style: { letterSpacing: 8, textAlign: 'center', fontWeight: 700 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRegenDialog({ open: false, code: '' })} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleRegenerate} disabled={busy || regenDialog.code.length !== 6} sx={{ textTransform: 'none', fontWeight: 700 }}>
            {busy ? <CircularProgress size={20} color="inherit" /> : 'Regenerate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Disable dialog ─── */}
      <Dialog open={disableDialog.open} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
        onClose={() => setDisableDialog({ open: false, code: '' })}>
        <DialogTitle sx={{ fontWeight: 800 }}>Turn off MFA?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            Once MFA is off, your account is protected by password only.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a 6-digit code (or an 8-char backup code) to confirm.
          </Typography>
          <TextField
            label="Verification code"
            fullWidth
            autoFocus
            value={disableDialog.code}
            onChange={(e) => setDisableDialog({ ...disableDialog, code: e.target.value.toUpperCase() })}
            inputProps={{ maxLength: 9, style: { letterSpacing: 4, textAlign: 'center', fontWeight: 700 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDisableDialog({ open: false, code: '' })} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDisable}
            disabled={busy || !disableDialog.code.trim()}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {busy ? <CircularProgress size={20} color="inherit" /> : 'Disable MFA'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MfaSetupPage;
