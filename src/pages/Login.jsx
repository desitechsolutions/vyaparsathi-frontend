import React, { useState, useEffect, useRef } from 'react';
import {
  TextField, Button, Container, Typography, Alert, Box,
  CircularProgress, Paper, Link, IconButton, Stack, Avatar,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, forgotPin } from '../services/api';
import { useTranslation } from 'react-i18next';

const APP_NAME = "VyaparSathi";
const COMPANY_NAME = "DesiTech Innovations Pvt Ltd.";

const Login = () => {
  const { login, user } = useAuthContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [view, setView] = useState('login'); // 'login' or 'forgotPin'
  const [username, setUsername] = useState(localStorage.getItem('lastUsername') || '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const usernameRef = useRef(null);
  const pinRef = useRef(null);

  useEffect(() => {
    // If user is already logged in, redirect them away from login page
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

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
        // The context's login function now handles everything else (state, headers, navigation)
        login(response.data.token, response.data.refreshToken);
      } else if (view === 'forgotPin') {
        if (!username.trim()) {
          setError(t('login.errorRequired', { field: t('login.username') }));
          setIsSubmitting(false);
          return;
        }
        const response = await forgotPin({ username });
        setSuccessMessage(response.data.message || t('login.successPinReset'));
        setTimeout(() => setView('login'), 3000);
        setIsSubmitting(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('login.errorUnexpected'));
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    switch (view) {
      case 'login':
        return (
          <>
            <Stack alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}><PersonOutlineIcon sx={{ fontSize: 38, color: 'primary.main' }} /></Avatar>
              <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>{APP_NAME}</Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>{COMPANY_NAME}</Typography>
            </Stack>
            <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>{t('login.signIn')}</Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <TextField label={t('login.username')} fullWidth margin="normal" value={username} onChange={(e) => { setUsername(e.target.value); localStorage.setItem('lastUsername', e.target.value); }} disabled={isSubmitting} required InputLabelProps={{ shrink: !!username }} inputRef={usernameRef} />
              <TextField label={t('login.pin')} type="password" fullWidth margin="normal" value={pin} onChange={(e) => setPin(e.target.value)} disabled={isSubmitting} required InputLabelProps={{ shrink: !!pin }} inputRef={pinRef} />
              <Button variant="contained" color="primary" type="submit" fullWidth disabled={isSubmitting} sx={{ mt: 3, height: '50px', fontWeight: 'bold', letterSpacing: '1px' }}>{isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('login.signIn')}</Button>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Link component="button" variant="body2" onClick={() => { setView('forgotPin'); setError(''); setSuccessMessage(''); }} sx={{ textDecoration: 'none', color: 'primary.main' }}>{t('login.forgotPin')}</Link>
            </Box>
          </>
        );
      case 'forgotPin':
        return (
          <>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}><IconButton onClick={() => setView('login')} aria-label={t('login.backToLogin')}><ArrowBackIcon /></IconButton></Box>
            <Stack alignItems="center" spacing={1} sx={{ width: '100%' }}><Avatar sx={{ width: 56, height: 56, bgcolor: 'error.light' }}><VpnKeyOutlinedIcon sx={{ fontSize: 38, color: 'error.main' }} /></Avatar><Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>{APP_NAME}</Typography><Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>{COMPANY_NAME}</Typography></Stack>
            <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>{t('login.forgotPinTitle')}</Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2, color: 'text.secondary' }}>{t('login.forgotPinPrompt')}</Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <TextField label={t('login.username')} fullWidth margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isSubmitting} required InputLabelProps={{ shrink: !!username }} />
              <Button variant="contained" color="error" type="submit" fullWidth disabled={isSubmitting} sx={{ mt: 3, height: '50px', fontWeight: 'bold', letterSpacing: '1px' }}>{isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('login.sendResetLink')}</Button>
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', px: 2, backgroundColor: '#f0f2f5', fontFamily: 'Inter, sans-serif' }}>
      <Paper elevation={6} sx={{ padding: { xs: 3, md: 5 }, borderRadius: 3, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' } }}>
        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ width: '100%' }}>{successMessage}</Alert>}
        {renderForm()}
      </Paper>
    </Container>
  );
};

export default Login;