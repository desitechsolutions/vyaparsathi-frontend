import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import API, { fetchShop, fetchMfaStatus } from '../../services/api';

/**
 * Two-factor authentication settings — dedicated shop-level page under
 * Configuration.
 *
 * <p>Consolidates two adjacent concerns that used to live on separate
 * screens:</p>
 * <ul>
 *   <li><b>Your account</b> — a status card that reports whether the
 *       current user has personally enrolled in MFA, plus a jump link to
 *       {@code /account/security/mfa} for enrollment / recovery codes.</li>
 *   <li><b>Shop policy</b> — the {@code requireMfaForAdmins} toggle that
 *       forces every OWNER + ADMIN in the shop to have MFA enabled before
 *       they can sign in.</li>
 * </ul>
 *
 * <p>The policy toggle was previously buried inside the general Settings
 * page's "Approval policies" section — which mixed unrelated concerns
 * (PO approval threshold + MFA policy). It now has its own home matching
 * the enterprise pattern (Google Workspace / Microsoft 365 / Okta):
 * security policy is its own sidebar entry.</p>
 *
 * <p>Save flow reuses the existing {@code PUT /api/shop} multipart
 * endpoint — we fetch the current shop, mutate {@code requireMfaForAdmins},
 * and send the whole DTO back so the backend's ShopService can enforce
 * its FALSE→TRUE guard (rejects the transition when any OWNER/ADMIN
 * still lacks MFA).</p>
 */
export default function TwoFactorAuthenticationPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shopData, setShopData] = useState(null);
  const [ownMfaEnabled, setOwnMfaEnabled] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [shopRes, mfaRes] = await Promise.allSettled([fetchShop(), fetchMfaStatus()]);
      if (shopRes.status === 'fulfilled') {
        setShopData(shopRes.value?.data || null);
      } else {
        setError(shopRes.reason?.response?.data?.message || 'Could not load shop settings.');
      }
      if (mfaRes.status === 'fulfilled') {
        setOwnMfaEnabled(!!mfaRes.value?.data?.enabled);
      } else {
        setOwnMfaEnabled(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const policyOn = !!shopData?.requireMfaForAdmins;

  // Guard: can't turn ON the shop policy if the current user themselves
  // isn't enrolled — that would lock the caller out at their next sign-in.
  // Matches the backend's FALSE→TRUE transition guard (the API rejects
  // the flip anyway when any OWNER/ADMIN lacks MFA); we surface it in
  // the UI so the user doesn't have to hit save to find out.
  const cannotEnable = !policyOn && ownMfaEnabled === false;

  const persistPolicy = async (nextValue) => {
    if (!shopData) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      // Match SettingsPage's payload shape: multipart with a JSON blob
      // named `shop`. Null → '' so backend @NotBlank fields don't trip.
      const jsonPayload = Object.keys(shopData).reduce((acc, key) => {
        // Skip transient FE-only fields
        if (key === 'logoFile' || key === 'signatureFile') return acc;
        acc[key] = shopData[key] === null ? '' : shopData[key];
        return acc;
      }, {});
      jsonPayload.requireMfaForAdmins = nextValue;
      formData.append(
        'shop',
        new Blob([JSON.stringify(jsonPayload)], { type: 'application/json' }),
      );
      await API.put('/api/shop', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(nextValue
        ? 'Shop policy on — owners and admins must have 2FA to sign in.'
        : 'Shop policy off — 2FA is optional for owners and admins.');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save the shop policy.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (e) => {
    const next = e.target.checked;
    if (next && cannotEnable) return;
    persistPolicy(next);
  };

  const impactBullets = useMemo(() => ([
    {
      icon: <CheckCircleIcon color="success" />,
      primary: 'Applies to OWNER and ADMIN roles only.',
      secondary: 'Cashier, staff and viewer roles keep signing in with just their password — 2FA stays optional for them.',
    },
    {
      icon: <CheckCircleIcon color="success" />,
      primary: 'Enforced at every sign-in.',
      secondary: 'When on, an OWNER/ADMIN without 2FA is blocked at the password step until they enroll — no bypass.',
    },
    {
      icon: <CheckCircleIcon color="success" />,
      primary: 'Recovery is self-service.',
      secondary: 'Resetting a password from the sign-in screen also clears 2FA, so a locked-out admin can recover through email without a DBA.',
    },
    {
      icon: <WarningAmberIcon sx={{ color: 'warning.main' }} />,
      primary: 'You cannot turn this on if you personally lack 2FA.',
      secondary: 'Both the UI toggle and the backend reject the change when any OWNER/ADMIN in this shop is still password-only — enable 2FA on your account first, then flip the switch.',
    },
  ]), []);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
              <ShieldOutlinedIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800}>Two-factor authentication</Typography>
              <Typography variant="body2" color="text.secondary">
                A second sign-in step for your team — a rotating six-digit code from an authenticator app on top of the password.
              </Typography>
            </Box>
          </Stack>
          <Tooltip title="Reload">
            <span>
              <IconButton onClick={load} disabled={loading || saving} size="small">
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {loading ? (
          <Stack alignItems="center" py={6}><CircularProgress /></Stack>
        ) : (
          <Stack spacing={3}>
            {/* ── Your account ─────────────────────────────────────── */}
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.08em' }}>
                Your account
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  mt: 1,
                  p: 2.5,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderColor: ownMfaEnabled ? 'success.light' : 'warning.light',
                  bgcolor: ownMfaEnabled ? 'success.50' : 'warning.50',
                }}
              >
                {ownMfaEnabled ? (
                  <VerifiedUserIcon color="success" />
                ) : (
                  <CancelIcon sx={{ color: 'warning.main' }} />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" fontWeight={700}>
                    {ownMfaEnabled ? '2FA is enabled on your account' : '2FA is not set up on your account'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ownMfaEnabled
                      ? 'You use an authenticator code every time you sign in. Manage backup codes or disable from Account security.'
                      : 'Enable 2FA on your own account before turning on the shop policy — otherwise the policy would lock you out.'}
                  </Typography>
                </Box>
                <Button
                  variant={ownMfaEnabled ? 'outlined' : 'contained'}
                  size="small"
                  color={ownMfaEnabled ? 'inherit' : 'primary'}
                  endIcon={<ArrowForwardIcon />}
                  component={RouterLink}
                  to="/account/security/mfa"
                >
                  {ownMfaEnabled ? 'Manage' : 'Set up 2FA'}
                </Button>
              </Paper>
            </Box>

            {/* ── Shop policy ──────────────────────────────────────── */}
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.08em' }}>
                Shop policy
              </Typography>
              <Paper variant="outlined" sx={{ mt: 1, p: 2.5, borderRadius: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policyOn}
                      onChange={handleToggle}
                      disabled={saving || cannotEnable}
                    />
                  }
                  label={
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body1" fontWeight={700}>
                          Require 2FA for owners &amp; admins
                        </Typography>
                        {policyOn && (
                          <Chip size="small" color="success" label="Active" sx={{ fontWeight: 700, height: 22 }} />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        When on, every OWNER and ADMIN in this shop must have 2FA on their account to sign in — <em>including you</em>. Enforced at every login by the backend.
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', m: 0 }}
                />

                {saving && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">Saving…</Typography>
                  </Stack>
                )}

                {cannotEnable && (
                  <Alert severity="warning" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
                    Set up 2FA on your own account first — turning the shop policy on while you're not enrolled would lock you out at your next sign-in.
                  </Alert>
                )}

                {policyOn && (
                  <Alert severity="info" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
                    Every active OWNER/ADMIN of this shop must have 2FA enabled to sign in. Ask co-admins to enable it in <em>Account security</em> before you rely on the policy — sign-in is refused for anyone still password-only.
                  </Alert>
                )}
              </Paper>
            </Box>

            {/* ── What this means ──────────────────────────────────── */}
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.08em' }}>
                What this means
              </Typography>
              <Paper variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                <List dense disablePadding>
                  {impactBullets.map((b, i) => (
                    <React.Fragment key={i}>
                      <ListItem sx={{ py: 1.5, px: 2.5, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>{b.icon}</ListItemIcon>
                        <ListItemText
                          primary={b.primary}
                          secondary={b.secondary}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItem>
                      {i < impactBullets.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
