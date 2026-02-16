import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Paper,
  Link,
  IconButton,
  Stack,
  Avatar,
  Grid,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, register as registerApi, forgotPassword } from '../services/api';
import { useTranslation } from 'react-i18next';

const APP_NAME = "VyaparSathi";
const COMPANY_NAME = "Aapki Mehnat, Hamara Saath";

const Login = () => {
  const { login, user } = useAuthContext();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [view, setView] = useState('login'); // 'login', 'register', 'forgotPin'
  const [username, setUsername] = useState(localStorage.getItem('lastUsername') || '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameRef = useRef(null);
  const pinRef = useRef(null);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Autofill handling (unchanged)
  useEffect(() => {
    const handleAnimationStart = (e) => {
      if (e.animationName === 'mui-auto-fill' || e.animationName === 'mui-auto-fill-cancel') {
        if (usernameRef.current && usernameRef.current.value !== username) {
          setUsername(usernameRef.current.value);
          localStorage.setItem('lastUsername', usernameRef.current.value);
        }
        if (pinRef.current && pinRef.current.value !== pin) {
          setPin(pinRef.current.value);
        }
      }
    };

    const inputs = [usernameRef.current, pinRef.current].filter(ref => ref);
    inputs.forEach(input => input?.addEventListener('animationstart', handleAnimationStart));

    return () => {
      inputs.forEach(input => input?.removeEventListener('animationstart', handleAnimationStart));
    };
  }, [username, pin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      if (view === 'login') {
        if (!username.trim() || !pin.trim()) {
          setError(t('login.errorAllFieldsRequired'));
          return;
        }
        const response = await loginApi({ username, pin });
        login(response.data.token, response.data.refreshToken);

        if (response.data.role === 'SUPER_ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } 
      else if (view === 'register') {
        if (!firstName.trim() || !username.trim() || !pin.trim() || !confirmPin.trim()) {
          setError(t('login.errorAllFieldsRequired'));
          return;
        }
        if (pin !== confirmPin) {
          setError(t('login.errorPinsDontMatch'));
          return;
        }
        if (email && !/\S+@\S+\.\S+/.test(email)) {
          setError(t('login.errorInvalidEmail'));
          return;
        }

        const payload = {
          firstName,
          lastName: lastName || null,
          email: email || null,
          phone,
          username,
          pin,
          role: 'PENDING_OWNER',
        };

        await registerApi(payload);

        // Auto-login after registration
        const loginRes = await loginApi({ username, pin });
        login(loginRes.data.token, loginRes.data.refreshToken);

        setSuccessMessage(t('login.successRegister'));
        setTimeout(() => navigate('/setup-shop', { replace: true }), 1500);
      } 
      else if (view === 'forgotPin') {
        if (!email.trim()) {
          setError(t('login.errorRequired', { field: t('login.email') }));
          return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          setError(t('login.errorInvalidEmail'));
          return;
        }
        const response = await forgotPassword({ email });
        setSuccessMessage(response.data.message || t('login.successPinReset'));
        setTimeout(() => setView('login'), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('login.errorUnexpected'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    switch (view) {
      case 'login':
        return (
          <Stack spacing={2.5} sx={{ width: '100%' }}>
            <Stack alignItems="center" spacing={1}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.light' }}>
                <PersonOutlineIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">{APP_NAME}</Typography>
              <Typography variant="caption" color="text.secondary">{COMPANY_NAME}</Typography>
            </Stack>

            <Typography variant="h6" component="h1" align="center" fontWeight="bold">
              {t('login.signIn')}
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                label={t('login.username')}
                fullWidth
                margin="dense"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  localStorage.setItem('lastUsername', e.target.value);
                }}
                disabled={isSubmitting}
                required
                inputRef={usernameRef}
                size="small"
              />
              <TextField
                label={t('login.pin')}
                type="password"
                fullWidth
                margin="dense"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isSubmitting}
                required
                inputRef={pinRef}
                size="small"
              />
              <Button
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
                disabled={isSubmitting}
                sx={{ mt: 2.5, py: 1.2, fontWeight: 'bold' }}
              >
                {isSubmitting ? <CircularProgress size={22} color="inherit" /> : t('login.signIn')}
              </Button>
            </Box>

            <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 1.5 }}>
              <Link
                component="button"
                variant="caption"
                onClick={() => { setView('forgotPin'); setError(''); setSuccessMessage(''); }}
                sx={{ color: 'primary.main', textDecoration: 'none' }}
              >
                {t('login.forgotPin')}
              </Link>
              <Typography variant="caption" color="text.secondary">
                {t('login.noAccount')}{' '}
                <Link
                  component="button"
                  variant="caption"
                  onClick={() => { setView('register'); setError(''); setSuccessMessage(''); }}
                  sx={{ fontWeight: 'bold', textDecoration: 'none' }}
                >
                  {t('login.signUp')}
                </Link>
              </Typography>
            </Stack>
          </Stack>
        );

      case 'register':
        return (
          <Stack spacing={2.5} sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <IconButton size="small" onClick={() => setView('login')} aria-label={t('login.backToLogin')}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Box>

            <Stack alignItems="center" spacing={1}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'secondary.light' }}>
                <PersonAddAltOutlinedIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">{APP_NAME}</Typography>
              <Typography variant="caption" color="text.secondary">{COMPANY_NAME}</Typography>
            </Stack>

            <Typography variant="h6" component="h1" align="center" fontWeight="bold">
              {t('login.signUp')}
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('login.firstName')}
                    fullWidth
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSubmitting}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('login.lastName')}
                    fullWidth
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSubmitting}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('login.email')}
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('login.phone') || "Mobile Number"}
                    fullWidth
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                    required
                    size="small"
                    inputProps={{ maxLength: 10 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('login.username')}
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSubmitting}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('login.createPin')}
                    type="password"
                    fullWidth
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    disabled={isSubmitting}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('login.confirmPin')}
                    type="password"
                    fullWidth
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    disabled={isSubmitting}
                    required
                    error={pin !== confirmPin && confirmPin.length > 0}
                    helperText={pin !== confirmPin && confirmPin.length > 0 ? t('login.errorPinsDontMatch') : ''}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                color="secondary"
                type="submit"
                fullWidth
                disabled={isSubmitting || pin !== confirmPin}
                sx={{ mt: 2.5, py: 1.2, fontWeight: 'bold' }}
              >
                {isSubmitting ? <CircularProgress size={22} color="inherit" /> : t('login.register')}
              </Button>
            </Box>
          </Stack>
        );

      case 'forgotPin':
        return (
          <Stack spacing={2.5} sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <IconButton size="small" onClick={() => setView('login')} aria-label={t('login.backToLogin')}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Box>

            <Stack alignItems="center" spacing={1}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'error.light' }}>
                <VpnKeyOutlinedIcon sx={{ fontSize: 32, color: 'error.main' }} />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">{APP_NAME}</Typography>
              <Typography variant="caption" color="text.secondary">{COMPANY_NAME}</Typography>
            </Stack>

            <Typography variant="h6" component="h1" align="center" fontWeight="bold">
              {t('login.forgotPinTitle')}
            </Typography>

            <Typography variant="caption" align="center" color="text.secondary" sx={{ mb: 2 }}>
              {t('login.forgotPinPrompt')}
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                label={t('login.email')}
                fullWidth
                margin="dense"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                size="small"
              />
              <Button
                variant="contained"
                color="error"
                type="submit"
                fullWidth
                disabled={isSubmitting}
                sx={{ mt: 2.5, py: 1.2, fontWeight: 'bold' }}
              >
                {isSubmitting ? <CircularProgress size={22} color="inherit" /> : t('login.sendResetLink')}
              </Button>
            </Box>
          </Stack>
        );

      default:
        return null;
    }
  };

return (
    <Box 
      sx={{ 
        width: '100%',
        minHeight: '100vh', // Ensures it takes full height of the parent
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', // Centers vertically in the right panel
        alignItems: 'center',
        p: { xs: 2, sm: 4 },
        background: 'transparent', // Let the PublicLayout handle the background
      }}
    >
      {/* Removed absolute elevation for a cleaner "Integrated" look.
         If you prefer the card look, keep the Paper but reduce elevation.
      */}
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          width: '100%',
          maxWidth: 400, // Standard width for login forms
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {error && (
          <Alert severity="error" variant="filled" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" variant="filled" sx={{ mb: 2, borderRadius: 2 }}>
            {successMessage}
          </Alert>
        )}

        {renderForm()}
      </Box>
    </Box>
  );
};

export default Login;