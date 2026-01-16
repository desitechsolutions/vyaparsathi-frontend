import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Paper,
  Link,
  IconButton,
  Stack,
  Avatar,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, register as registerApi, forgotPin } from '../services/api'; // Make sure register is exported
import { useTranslation } from 'react-i18next';

const APP_NAME = "VyaparSathi";
const COMPANY_NAME = "DesiTech Innovations Pvt Ltd.";

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
        navigate('/', { replace: true });
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
          username,
          pin,
          role: 'PENDING_OWNER', // Only self-registration as OWNER
        };

        await registerApi(payload);

        // Auto-login immediately after registration
        const loginRes = await loginApi({ username, pin });
        login(loginRes.data.token, loginRes.data.refreshToken);

        setSuccessMessage(t('login.successRegister'));
        setTimeout(() => navigate('/setup-shop', { replace: true }), 1500);
      } 
      else if (view === 'forgotPin') {
        if (!username.trim()) {
          setError(t('login.errorRequired', { field: t('login.username') }));
          return;
        }
        const response = await forgotPin({ username });
        setSuccessMessage(response.data.message || t('login.successPinReset'));
        setTimeout(() => setView('login'), 3000);
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
          <>
            <Stack alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}>
                <PersonOutlineIcon sx={{ fontSize: 38, color: 'primary.main' }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>{APP_NAME}</Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>{COMPANY_NAME}</Typography>
            </Stack>
            <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('login.signIn')}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <TextField
                label={t('login.username')}
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  localStorage.setItem('lastUsername', e.target.value);
                }}
                disabled={isSubmitting}
                required
                InputLabelProps={{ shrink: !!username }}
                inputRef={usernameRef}
              />
              <TextField
                label={t('login.pin')}
                type="password"
                fullWidth
                margin="normal"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isSubmitting}
                required
                InputLabelProps={{ shrink: !!pin }}
                inputRef={pinRef}
              />
              <Button
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
                disabled={isSubmitting}
                sx={{ mt: 3, height: '50px', fontWeight: 'bold', letterSpacing: '1px' }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('login.signIn')}
              </Button>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => { setView('forgotPin'); setError(''); setSuccessMessage(''); }}
                sx={{ textDecoration: 'none', color: 'primary.main' }}
              >
                {t('login.forgotPin')}
              </Link>
            </Box>
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Typography variant="body2">
                {t('login.noAccount')}{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => { setView('register'); setError(''); setSuccessMessage(''); }}
                  sx={{ textDecoration: 'none', fontWeight: 'bold' }}
                >
                  {t('login.signUp')}
                </Link>
              </Typography>
            </Box>
          </>
        );

      case 'register':
        return (
          <>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
              <IconButton onClick={() => setView('login')} aria-label={t('login.backToLogin')}>
                <ArrowBackIcon />
              </IconButton>
            </Box>
            <Stack alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'secondary.light' }}>
                <PersonAddAltOutlinedIcon sx={{ fontSize: 38, color: 'secondary.main' }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>{APP_NAME}</Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>{COMPANY_NAME}</Typography>
            </Stack>
            <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('login.signUp')}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <TextField
                label={t('login.firstName')}
                fullWidth
                margin="normal"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <TextField
                label={t('login.lastName')}
                fullWidth
                margin="normal"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting}
              />
              <TextField
                label={t('login.email')}
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <TextField
                label={t('login.username')}
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <TextField
                label={t('login.createPin')}
                type="password"
                fullWidth
                margin="normal"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <TextField
                label={t('login.confirmPin')}
                type="password"
                fullWidth
                margin="normal"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                disabled={isSubmitting}
                required
                error={pin !== confirmPin && confirmPin.length > 0}
                helperText={pin !== confirmPin && confirmPin.length > 0 ? t('login.errorPinsDontMatch') : ''}
              />
              <Button
                variant="contained"
                color="secondary"
                type="submit"
                fullWidth
                disabled={isSubmitting || pin !== confirmPin}
                sx={{ mt: 3, height: '50px', fontWeight: 'bold', letterSpacing: '1px' }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('login.register')}
              </Button>
            </Box>
          </>
        );

      case 'forgotPin':
        return (
          <>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
              <IconButton onClick={() => setView('login')} aria-label={t('login.backToLogin')}>
                <ArrowBackIcon />
              </IconButton>
            </Box>
            <Stack alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'error.light' }}>
                <VpnKeyOutlinedIcon sx={{ fontSize: 38, color: 'error.main' }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>{APP_NAME}</Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>{COMPANY_NAME}</Typography>
            </Stack>
            <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('login.forgotPinTitle')}
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('login.forgotPinPrompt')}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <TextField
                label={t('login.username')}
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                required
                InputLabelProps={{ shrink: !!username }}
              />
              <Button
                variant="contained"
                color="error"
                type="submit"
                fullWidth
                disabled={isSubmitting}
                sx={{ mt: 3, height: '50px', fontWeight: 'bold', letterSpacing: '1px' }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('login.sendResetLink')}
              </Button>
            </Box>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: 2,
        backgroundColor: '#f0f2f5',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: { xs: 3, md: 5 },
          borderRadius: 3,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ width: '100%' }}>{successMessage}</Alert>}
        {renderForm()}
      </Paper>
    </Container>
  );
};

export default Login;