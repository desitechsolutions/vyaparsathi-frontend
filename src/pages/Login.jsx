import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
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
import EmailIcon from '@mui/icons-material/Email';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, register as registerApi, forgotPassword } from '../services/api';
import { useTranslation } from 'react-i18next';

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

  useEffect(() => {
    setError('');
    setSuccessMessage('');
  }, [view]);

  // Autofill handling
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
          setIsSubmitting(false);
          return;
        }
        const response = await loginApi({ username, pin });
        
        login(response.data.accessToken || response.data.token);

        if (response.data.role === 'SUPER_ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } 
      else if (view === 'register') {
        if (!firstName.trim() || !username.trim() || !pin.trim() || !confirmPin.trim()) {
          setError(t('login.errorAllFieldsRequired'));
          setIsSubmitting(false);
          return;
        }
        if (pin !== confirmPin) {
          setError(t('login.errorPinsDontMatch'));
          setIsSubmitting(false);
          return;
        }
        if (email && !/\S+@\S+\.\S+/.test(email)) {
          setError(t('login.errorInvalidEmail'));
          setIsSubmitting(false);
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

        // 1. Attempt Registration
        await registerApi(payload);

        // 2. ONLY proceed if registration succeeded
        const loginRes = await loginApi({ username, pin });
        
        login(loginRes.data.accessToken || loginRes.data.token);

        setSuccessMessage(t('login.successRegister'));
        setTimeout(() => navigate('/setup-shop', { replace: true }), 1500);
      } 
      else if (view === 'forgotPin') {
        if (!email.trim()) {
          setError(t('login.errorRequired', { field: t('login.email') }));
          setIsSubmitting(false);
          return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          setError(t('login.errorInvalidEmail'));
          setIsSubmitting(false);
          return;
        }
        const response = await forgotPassword({ email });
        setSuccessMessage(response.data.message || t('login.successPinReset'));
        setTimeout(() => setView('login'), 5000);
      }
    } catch (err) {
      // Capture detailed error message from backend (e.g., "Email already registered")
      const errorMessage = err.response?.data?.message || err.message || t('login.errorUnexpected');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    switch (view) {
      case 'login':
        return (
          <Stack spacing={3} sx={{ width: '100%' }}>
            {/* Header */}
            <Stack alignItems="center" spacing={2}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.light', border: '3px solid', borderColor: 'primary.main' }}>
                <PersonOutlineIcon sx={{ fontSize: 36, color: 'primary.main' }} />
              </Avatar>
              <Box textAlign="center">
                <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a' }}>
                  {t('login.welcome') || 'Welcome Back'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {t('login.subtitle') || 'Aapki Mehnat, Hamara Saath'}
                </Typography>
              </Box>
            </Stack>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  label={t('login.username') || 'Username or Email'}
                  fullWidth
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    localStorage.setItem('lastUsername', e.target.value);
                  }}
                  disabled={isSubmitting}
                  required
                  inputRef={usernameRef}
                  variant="outlined"
                  size="medium"
                  InputProps={{
                    startAdornment: <PersonOutlineIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:focus-within': {
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                      }
                    }
                  }}
                />
                <TextField
                  label={t('login.pin') || 'PIN/Password'}
                  type="password"
                  fullWidth
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  disabled={isSubmitting}
                  required
                  inputRef={pinRef}
                  variant="outlined"
                  size="medium"
                  InputProps={{
                    startAdornment: <VpnKeyOutlinedIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:focus-within': {
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                      }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  fullWidth
                  disabled={isSubmitting}
                  sx={{ 
                    mt: 2, 
                    py: 1.3, 
                    fontWeight: 900, 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : '🔓 ' + (t('login.signIn') || 'Sign In')}
                </Button>
              </Stack>
            </Box>

            {/* Links */}
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => { setView('forgotPin'); setError(''); setSuccessMessage(''); }}
                  sx={{ 
                    color: 'primary.main', 
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {t('login.forgotPin') || 'Forgot PIN?'}
                </Link>
              </Box>
              <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">
                  {t('login.noAccount') || "Don't have an account?"}{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => { setView('register'); setError(''); setSuccessMessage(''); }}
                    sx={{ 
                      fontWeight: 700, 
                      textDecoration: 'none',
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {t('login.signUp') || 'Create Account'}
                  </Link>
                </Typography>
              </Box>
            </Stack>
          </Stack>
        );

      case 'register':
        return (
          <Stack spacing={3} sx={{ width: '100%' }}>
            {/* Back Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <IconButton 
                size="small" 
                onClick={() => setView('login')} 
                title={t('login.backToLogin')}
                sx={{ 
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'translateX(-4px)' }
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Header */}
            <Stack alignItems="center" spacing={2}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'secondary.light', border: '3px solid', borderColor: 'secondary.main' }}>
                <PersonAddAltOutlinedIcon sx={{ fontSize: 36, color: 'secondary.main' }} />
              </Avatar>
              <Box textAlign="center">
                <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a' }}>
                  {t('login.createAccount') || 'Create Account'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                  Join thousands of shop owners
                </Typography>
              </Box>
            </Stack>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('login.firstName') || 'First Name'}
                    fullWidth
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSubmitting}
                    required
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('login.lastName') || 'Last Name'}
                    fullWidth
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSubmitting}
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('login.email') || 'Email Address'}
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
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
                    variant="outlined"
                    size="medium"
                    inputProps={{ maxLength: 10 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('login.username') || 'Username'}
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSubmitting}
                    required
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('login.createPin') || 'Create PIN (4 digits)'}
                    type="password"
                    fullWidth
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    disabled={isSubmitting}
                    required
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('login.confirmPin') || 'Confirm PIN'}
                    type="password"
                    fullWidth
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    disabled={isSubmitting}
                    required
                    error={pin !== confirmPin && confirmPin.length > 0}
                    helperText={pin !== confirmPin && confirmPin.length > 0 ? (t('login.errorPinsDontMatch') || 'PINs do not match') : ''}
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                color="secondary"
                type="submit"
                fullWidth
                disabled={isSubmitting || pin !== confirmPin}
                sx={{ 
                  mt: 3, 
                  py: 1.3, 
                  fontWeight: 900, 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
                  '&:hover:not(:disabled)': {
                    boxShadow: '0 6px 16px rgba(107, 114, 128, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s'
                }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : '✨ ' + (t('login.register') || 'Create Account')}
              </Button>
            </Box>

            {/* Already have account */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('login.alreadyHaveAccount') || 'Already have an account?'}{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                  sx={{ 
                    fontWeight: 700, 
                    textDecoration: 'none',
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {t('login.signIn') || 'Sign In'}
                </Link>
              </Typography>
            </Box>
          </Stack>
        );

      case 'forgotPin':
        return (
          <Stack spacing={3} sx={{ width: '100%' }}>
            {/* Back Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <IconButton 
                size="small" 
                onClick={() => setView('login')} 
                title={t('login.backToLogin')}
                sx={{ 
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'translateX(-4px)' }
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Header */}
            <Stack alignItems="center" spacing={2}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'error.light', border: '3px solid', borderColor: 'error.main' }}>
                <VpnKeyOutlinedIcon sx={{ fontSize: 36, color: 'error.main' }} />
              </Avatar>
              <Box textAlign="center">
                <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a' }}>
                  {t('login.forgotPinTitle') || 'Reset PIN'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {t('login.forgotPinPrompt') || 'Enter your email to reset your PIN'}
                </Typography>
              </Box>
            </Stack>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  label={t('login.email') || 'Registered Email Address'}
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  variant="outlined"
                  size="medium"
                  placeholder="you@example.com"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:focus-within': {
                        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
                      }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  color="error"
                  type="submit"
                  fullWidth
                  disabled={isSubmitting}
                  sx={{ 
                    mt: 1, 
                    py: 1.3, 
                    fontWeight: 900, 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    '&:hover:not(:disabled)': {
                      boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : '📧 ' + (t('login.sendResetLink') || 'Send Reset Link')}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('login.rememberedPin') || 'Remembered your PIN?'}{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                  sx={{ 
                    fontWeight: 700, 
                    textDecoration: 'none',
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {t('login.backToSignIn') || 'Back to Sign In'}
                </Link>
              </Typography>
            </Box>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
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
  );
};

export default Login;