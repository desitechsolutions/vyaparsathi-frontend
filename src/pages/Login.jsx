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
  Divider,
  Checkbox,
  FormControlLabel,
  Tooltip,
  FormHelperText,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { login as loginApi, register as registerApi, forgotPassword, resendVerification, verifyMfaChallenge } from '../services/api';
import { captureMessage, captureException } from '../services/sentry';
import { useTranslation } from 'react-i18next';
import PasswordField from '../components/auth/PasswordField';
import PasswordStrengthMeter, { evaluatePassword } from '../components/auth/PasswordStrengthMeter';
import { useForm, Controller } from 'react-hook-form';

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const MicrosoftLogo = () => (
  <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#7FBA00" d="M12 1h10v10H12z" />
    <path fill="#00A4EF" d="M1 12h10v10H1z" />
    <path fill="#FFB900" d="M12 12h10v10H12z" />
  </svg>
);

const Login = () => {
  const { login, user } = useAuthContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [view, setView] = useState('login');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [forgotSubmittedEmail, setForgotSubmittedEmail] = useState('');
  const [resendState, setResendState] = useState({ inFlight: false, message: '' });
  const [mfa, setMfa] = useState({ challengeToken: '', code: '', useBackup: false });
  const [serverError, setServerError] = useState('');
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(null);

  // ─── Refs for browser autofill detection (login form only) ────────────────
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const sessionExpired = searchParams.get('expired') === '1' || searchParams.get('expired') === 'true';

  // ─── Three form instances, one per sub-form ───────────────────────────────

  const loginForm = useForm({
    defaultValues: {
      username: localStorage.getItem('lastUsername') || '',
      password: '',
      rememberMe: true,
    },
  });

  const registerForm = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    mode: 'onChange', // real-time validation for password strength, match check, etc.
  });

  const forgotForm = useForm({
    defaultValues: { email: '' },
  });

  // Watch register password for the strength meter component and confirm-password cross-validation
  const registerPassword = registerForm.watch('password');

  // ─── Redirect if already logged in ───────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      const redirectParam = searchParams.get('redirect');
      const savedRedirect = redirectParam || sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      if (savedRedirect && savedRedirect !== '/login' && savedRedirect !== '/') {
        navigate(savedRedirect, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate, searchParams]);

  // ─── Clear server-level errors when switching views ───────────────────────
  useEffect(() => {
    setServerError('');
    setRetryAfterSeconds(null);
  }, [view]);

  // ─── Browser autofill sync for login form ─────────────────────────────────
  useEffect(() => {
    const handleAnimationStart = (e) => {
      if (e.animationName === 'mui-auto-fill' || e.animationName === 'mui-auto-fill-cancel') {
        if (usernameRef.current) {
          const val = usernameRef.current.value;
          if (val !== loginForm.getValues('username')) {
            loginForm.setValue('username', val, { shouldValidate: false });
            localStorage.setItem('lastUsername', val);
          }
        }
        if (passwordRef.current) {
          const val = passwordRef.current.value;
          if (val !== loginForm.getValues('password')) {
            loginForm.setValue('password', val, { shouldValidate: false });
          }
        }
      }
    };
    const inputs = [usernameRef.current, passwordRef.current].filter(Boolean);
    inputs.forEach((input) => input?.addEventListener('animationstart', handleAnimationStart));
    return () => {
      inputs.forEach((input) => input?.removeEventListener('animationstart', handleAnimationStart));
    };
  }, [loginForm]);

  // ─── API error handler ────────────────────────────────────────────────────
  const handleApiError = (err, fallback) => {
    if (err.response?.status === 429) {
      const retryAfter =
        err.response?.data?.retryAfterSeconds ||
        Number(err.response?.headers?.['retry-after']) ||
        60;
      setRetryAfterSeconds(retryAfter);
      setServerError(err.response?.data?.message || `Too many attempts. Try again in ${retryAfter}s.`);
      return;
    }
    setServerError(err.response?.data?.message || err.message || fallback);
  };

  // ─── Submit handlers ──────────────────────────────────────────────────────

  const onLoginSubmit = async ({ username, password }) => {
    setServerError('');
    setRetryAfterSeconds(null);
    try {
      const response = await loginApi({ username, password });

      if (response.data.mfaRequired) {
        setMfa({ challengeToken: response.data.mfaChallengeToken, code: '', useBackup: false });
        setView('mfaChallenge');
        return;
      }

      login(response.data.accessToken || response.data.token);
      captureMessage('User login', 'info');
      localStorage.setItem('lastUsername', username);

      const redirectParam = searchParams.get('redirect');
      const stashedRedirect = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      const target = redirectParam || stashedRedirect;
      const isSafeTarget = target && target !== '/login' && target !== '/' && target !== '/setup-shop';

      if (response.data.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (isSafeTarget) {
        navigate(target, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      captureException(err, { form: 'login', username });
      handleApiError(err, t('login.errorUnexpected', 'Something went wrong. Please try again.'));
    }
  };

  const onRegisterSubmit = async ({ firstName, lastName, email, phone, username, password }) => {
    setServerError('');
    try {
      const payload = {
        firstName,
        lastName: lastName || null,
        email,
        phone,
        username,
        password,
        role: 'PENDING_OWNER',
      };
      await registerApi(payload);
      const loginRes = await loginApi({ username, password });
      login(loginRes.data.accessToken || loginRes.data.token);
      captureMessage('User registered', 'info');
      setPendingVerificationEmail(email);
      setView('registerSuccess');
    } catch (err) {
      captureException(err, { form: 'register' });
      handleApiError(err, t('login.errorUnexpected', 'Something went wrong. Please try again.'));
    }
  };

  const onForgotSubmit = async ({ email }) => {
    setServerError('');
    setRetryAfterSeconds(null);
    try {
      await forgotPassword({ email });
      setForgotSubmittedEmail(email);
      setView('forgotSent');
    } catch (err) {
      handleApiError(err, t('login.errorUnexpected', 'Something went wrong. Please try again.'));
    }
  };

  const ssoDisabledTooltip = 'Single sign-on is coming soon. Sign in with your email for now.';

  const renderStatusBanners = () => (
    <>
      {sessionExpired && view === 'login' && !serverError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Your session expired. Please sign in again to continue.
        </Alert>
      )}
      {serverError && (
        <Alert severity="error" variant="filled" sx={{ mb: 2, borderRadius: 2 }} role="alert">
          {serverError}
          {retryAfterSeconds ? (
            <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
              Retry after {retryAfterSeconds}s.
            </Typography>
          ) : null}
        </Alert>
      )}
    </>
  );

  // ─── Login view ───────────────────────────────────────────────────────────

  const renderLogin = () => (
    <Stack spacing={{ xs: 2, sm: 3 }} sx={{ width: '100%' }}>
      <Stack spacing={1}>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px', color: 'text.primary' }}>
          {t('login.welcome', 'Welcome back')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('login.welcomeSub', 'Sign in to manage your business dashboard.')}
        </Typography>
      </Stack>

      <Stack spacing={1.25}>
        <Tooltip title={ssoDisabledTooltip} arrow>
          <span>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleLogo />}
              disabled
              aria-label="Continue with Google (coming soon)"
              sx={{
                justifyContent: 'center',
                borderColor: 'divider',
                color: 'text.primary',
                py: 1.1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Continue with Google
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={ssoDisabledTooltip} arrow>
          <span>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MicrosoftLogo />}
              disabled
              aria-label="Continue with Microsoft (coming soon)"
              sx={{
                justifyContent: 'center',
                borderColor: 'divider',
                color: 'text.primary',
                py: 1.1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Continue with Microsoft
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Divider sx={{ my: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          or continue with email
        </Typography>
      </Divider>

      <Box
        component="form"
        onSubmit={loginForm.handleSubmit(onLoginSubmit)}
        noValidate
      >
        <Stack spacing={2}>
          <Controller
            name="username"
            control={loginForm.control}
            rules={{ required: t('login.errorRequired', { field: 'Username', defaultValue: 'Username is required.' }) }}
            render={({ field: { onChange, value, ref: rhfRef }, fieldState: { error } }) => (
              <TextField
                id="username"
                name="username"
                label={t('login.username', 'Username or email')}
                fullWidth
                value={value}
                onChange={(e) => {
                  onChange(e);
                  localStorage.setItem('lastUsername', e.target.value);
                }}
                inputRef={(el) => {
                  usernameRef.current = el;
                  rhfRef(el);
                }}
                disabled={loginForm.formState.isSubmitting}
                required
                autoComplete="username"
                autoFocus
                variant="outlined"
                size="medium"
                error={!!error}
                helperText={error?.message}
                inputProps={{
                  'aria-required': 'true',
                  'aria-invalid': !!error,
                  'aria-describedby': error ? 'login-username-error' : undefined,
                  'aria-label': 'Username or email address',
                }}
                FormHelperTextProps={error ? { id: 'login-username-error', role: 'alert' } : undefined}
                InputProps={{
                  startAdornment: (
                    <PersonOutlineIcon sx={{ mr: 1.5, color: 'text.secondary' }} aria-hidden="true" />
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            )}
          />

          <Stack spacing={0.5}>
            <Controller
              name="password"
              control={loginForm.control}
              rules={{ required: t('login.errorRequired', { field: 'Password', defaultValue: 'Password is required.' }) }}
              render={({ field: { onChange, value, ref: rhfRef }, fieldState: { error } }) => (
                <PasswordField
                  label={t('login.password', 'Password')}
                  fullWidth
                  value={value}
                  onChange={onChange}
                  ref={(el) => {
                    passwordRef.current = el;
                    rhfRef(el);
                  }}
                  disabled={loginForm.formState.isSubmitting}
                  required
                  autoComplete="current-password"
                  variant="outlined"
                  size="medium"
                  error={!!error}
                  helperText={error?.message}
                  inputProps={{
                    'aria-required': 'true',
                    'aria-invalid': !!error,
                    'aria-describedby': error ? 'login-password-error' : undefined,
                  }}
                  FormHelperTextProps={error ? { id: 'login-password-error', role: 'alert' } : undefined}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
              <Controller
                name="rememberMe"
                control={loginForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2">Keep me signed in</Typography>}
                  />
                )}
              />
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => setView('forgotPassword')}
                sx={{ fontWeight: 600, textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
              >
                {t('login.forgotPassword', 'Forgot password?')}
              </Link>
            </Box>
          </Stack>

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={loginForm.formState.isSubmitting}
            sx={{
              py: 1.3,
              fontWeight: 700,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {loginForm.formState.isSubmitting
              ? <CircularProgress size={22} color="inherit" />
              : t('login.signIn', 'Sign in')}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          {t('login.noAccount', 'New to VyaparSathi?')}{' '}
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => setView('register')}
            sx={{ fontWeight: 700, textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
          >
            {t('login.signUp', 'Create an account')}
          </Link>
        </Typography>
      </Box>
    </Stack>
  );

  // ─── Register view ────────────────────────────────────────────────────────

  const renderRegister = () => {
    const { formState: { errors: regErrors, isSubmitting: regSubmitting } } = registerForm;

    return (
      <Stack spacing={{ xs: 2, sm: 3 }} sx={{ width: '100%' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            onClick={() => setView('login')}
            aria-label={t('login.backToLogin', 'Back to sign in')}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" color="text.secondary">Back to sign in</Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            {t('login.createAccount', 'Create your account')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start invoicing, managing inventory, and tracking dues in minutes.
          </Typography>
        </Stack>

        <Box component="form" onSubmit={registerForm.handleSubmit(onRegisterSubmit)} noValidate>
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="firstName"
                control={registerForm.control}
                rules={{ required: t('login.errorRequired', { field: 'First name', defaultValue: 'First name is required.' }) }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label={t('login.firstName', 'First name')}
                    fullWidth
                    autoFocus
                    disabled={regSubmitting}
                    required
                    autoComplete="given-name"
                    error={!!error}
                    helperText={error?.message}
                    inputProps={{
                      'aria-required': 'true',
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'reg-firstname-error' : undefined,
                    }}
                    FormHelperTextProps={error ? { id: 'reg-firstname-error', role: 'alert' } : undefined}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="lastName"
                control={registerForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('login.lastName', 'Last name')}
                    fullWidth
                    disabled={regSubmitting}
                    autoComplete="family-name"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="email"
                control={registerForm.control}
                rules={{
                  required: t('login.errorRequired', { field: 'Email', defaultValue: 'Email is required.' }),
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: t('login.errorInvalidEmail', 'Please enter a valid email address.'),
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label={t('login.email', 'Work email')}
                    type="email"
                    fullWidth
                    disabled={regSubmitting}
                    required
                    autoComplete="email"
                    error={!!error}
                    helperText={error?.message || "We'll send you a verification link at this address."}
                    inputProps={{
                      'aria-required': 'true',
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'reg-email-error' : 'reg-email-hint',
                    }}
                    FormHelperTextProps={error ? { id: 'reg-email-error', role: 'alert' } : { id: 'reg-email-hint' }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="phone"
                control={registerForm.control}
                rules={{ required: t('login.errorRequired', { field: 'Phone', defaultValue: 'Phone number is required.' }) }}
                render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                  <TextField
                    value={value}
                    onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    inputRef={ref}
                    label={t('login.phone', 'Mobile number')}
                    fullWidth
                    disabled={regSubmitting}
                    required
                    autoComplete="tel"
                    error={!!error}
                    helperText={error?.message}
                    inputProps={{
                      maxLength: 15,
                      'aria-required': 'true',
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'reg-phone-error' : undefined,
                    }}
                    FormHelperTextProps={error ? { id: 'reg-phone-error', role: 'alert' } : undefined}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="username"
                control={registerForm.control}
                rules={{ required: t('login.errorRequired', { field: 'Username', defaultValue: 'Username is required.' }) }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label={t('login.username', 'Choose a username')}
                    fullWidth
                    disabled={regSubmitting}
                    required
                    autoComplete="username"
                    error={!!error}
                    helperText={error?.message}
                    inputProps={{
                      'aria-required': 'true',
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'reg-username-error' : undefined,
                    }}
                    FormHelperTextProps={error ? { id: 'reg-username-error', role: 'alert' } : undefined}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="password"
                control={registerForm.control}
                rules={{
                  required: t('login.errorRequired', { field: 'Password', defaultValue: 'Password is required.' }),
                  validate: (val) =>
                    (() => {
                      const s = evaluatePassword(val);
                      return (
                        (s.rules.length && s.rules.upper && s.rules.lower && s.rules.digit && s.rules.special) ||
                        'Password must be at least 8 characters and include uppercase, lowercase, digit and special character.'
                      );
                    })(),
                }}
                render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                  <PasswordField
                    label={t('login.createPassword', 'Create a password')}
                    fullWidth
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      // Re-validate confirmPassword when password changes
                      if (registerForm.getValues('confirmPassword')) {
                        registerForm.trigger('confirmPassword');
                      }
                    }}
                    ref={ref}
                    disabled={regSubmitting}
                    required
                    autoComplete="new-password"
                    showStartIcon={false}
                    error={!!error}
                    helperText={error?.message}
                    inputProps={{
                      'aria-required': 'true',
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'reg-password-error' : undefined,
                    }}
                    FormHelperTextProps={error ? { id: 'reg-password-error', role: 'alert' } : undefined}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="confirmPassword"
                control={registerForm.control}
                rules={{
                  required: 'Please confirm your password.',
                  validate: (val) =>
                    val === registerForm.getValues('password') || t('login.errorPasswordsDontMatch', 'Passwords do not match.'),
                }}
                render={({ field, fieldState: { error } }) => (
                  <PasswordField
                    label={t('login.confirmPassword', 'Confirm password')}
                    fullWidth
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    disabled={regSubmitting}
                    required
                    autoComplete="new-password"
                    showStartIcon={false}
                    error={!!error}
                    helperText={error?.message}
                    inputProps={{
                      'aria-required': 'true',
                      'aria-invalid': !!error,
                      'aria-describedby': error ? 'reg-confirm-password-error' : undefined,
                    }}
                    FormHelperTextProps={error ? { id: 'reg-confirm-password-error', role: 'alert' } : undefined}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <PasswordStrengthMeter value={registerPassword || ''} />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="acceptTerms"
                control={registerForm.control}
                rules={{
                  validate: (val) =>
                    val || 'Please accept the Terms of Service and Privacy Policy to continue.',
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="body2" color={error ? 'error' : 'text.secondary'}>
                          I agree to the{' '}
                          <Link component={RouterLink} to="/terms" target="_blank" rel="noopener" underline="hover">Terms of Service</Link>{' '}
                          and{' '}
                          <Link component={RouterLink} to="/privacy" target="_blank" rel="noopener" underline="hover">Privacy Policy</Link>.
                        </Typography>
                      }
                    />
                    {error && (
                      <FormHelperText error sx={{ ml: 2 }}>
                        {error.message}
                      </FormHelperText>
                    )}
                  </>
                )}
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={regSubmitting}
            sx={{
              mt: 3,
              py: 1.3,
              fontWeight: 700,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {regSubmitting
              ? <CircularProgress size={22} color="inherit" />
              : t('login.register', 'Create account')}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('login.alreadyHaveAccount', 'Already have an account?')}{' '}
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => setView('login')}
              sx={{ fontWeight: 700, textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
            >
              {t('login.signIn', 'Sign in')}
            </Link>
          </Typography>
        </Box>
      </Stack>
    );
  };

  // ─── Forgot password view ─────────────────────────────────────────────────

  const renderForgot = () => (
    <Stack spacing={{ xs: 2, sm: 3 }} sx={{ width: '100%' }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton
          size="small"
          onClick={() => setView('login')}
          aria-label={t('login.backToLogin', 'Back to sign in')}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" color="text.secondary">Back to sign in</Typography>
      </Stack>

      <Stack spacing={1}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
          <VpnKeyOutlinedIcon />
        </Avatar>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
          {t('login.forgotPasswordTitle', 'Reset your password')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter the email associated with your account and we'll send you a link to reset your password.
        </Typography>
      </Stack>

      <Box component="form" onSubmit={forgotForm.handleSubmit(onForgotSubmit)} noValidate>
        <Stack spacing={2}>
          <Controller
            name="email"
            control={forgotForm.control}
            rules={{
              required: t('login.errorRequired', { field: 'Email', defaultValue: 'Email is required.' }),
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: t('login.errorInvalidEmail', 'Please enter a valid email address.'),
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label={t('login.email', 'Registered email address')}
                type="email"
                fullWidth
                disabled={forgotForm.formState.isSubmitting}
                required
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                error={!!error}
                helperText={error?.message}
                inputProps={{
                  'aria-required': 'true',
                  'aria-invalid': !!error,
                  'aria-describedby': error ? 'forgot-email-error' : undefined,
                  'aria-label': 'Registered email address',
                }}
                FormHelperTextProps={error ? { id: 'forgot-email-error', role: 'alert' } : undefined}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1.5, color: 'text.secondary' }} aria-hidden="true" />,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            )}
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={forgotForm.formState.isSubmitting}
            sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }}
          >
            {forgotForm.formState.isSubmitting
              ? <CircularProgress size={22} color="inherit" />
              : t('login.sendResetLink', 'Send reset link')}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );

  // ─── MFA challenge view ───────────────────────────────────────────────────

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!mfa.code.trim()) {
      setServerError(t('login.mfaCodeRequired', 'Enter your authenticator code.'));
      return;
    }
    setServerError('');
    try {
      const res = await verifyMfaChallenge(mfa.challengeToken, mfa.code.trim());
      login(res.data.accessToken);
      const redirectParam = searchParams.get('redirect');
      const stashedRedirect = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      const target = redirectParam || stashedRedirect;
      const isSafeTarget = target && target !== '/login' && target !== '/' && target !== '/setup-shop';
      if (res.data.role === 'SUPER_ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (isSafeTarget) navigate(target, { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      handleApiError(err, t('login.mfaCodeInvalid', 'The code you entered is incorrect. Try again.'));
    }
  };

  const renderMfaChallenge = () => (
    <Stack spacing={{ xs: 2, sm: 3 }} sx={{ width: '100%' }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton
          size="small"
          onClick={() => { setView('login'); setMfa({ challengeToken: '', code: '', useBackup: false }); }}
          aria-label={t('login.backToLogin', 'Back to sign in')}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {t('login.backToLogin', 'Back to sign in')}
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
          <ShieldOutlinedIcon />
        </Avatar>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
          {t('login.mfaTitle', 'Two-factor authentication')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {mfa.useBackup
            ? t('login.mfaBackupPrompt', 'Enter one of the 8-character backup codes you saved when you set up MFA.')
            : t('login.mfaPrompt', 'Open your authenticator app (Google Authenticator, Authy, 1Password) and enter the 6-digit code shown for VyaparSathi.')}
        </Typography>
      </Stack>

      <Box component="form" onSubmit={handleMfaSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label={mfa.useBackup ? t('login.mfaBackupLabel', 'Backup code') : t('login.mfaCodeLabel', 'Authenticator code')}
            fullWidth
            autoFocus
            autoComplete="one-time-code"
            inputMode={mfa.useBackup ? 'text' : 'numeric'}
            value={mfa.code}
            onChange={(e) => setMfa((m) => ({
              ...m,
              code: mfa.useBackup
                ? e.target.value.toUpperCase()
                : e.target.value.replace(/\D/g, '').slice(0, 6),
            }))}
            disabled={false}
            required
            inputProps={{
              'aria-label': mfa.useBackup ? 'Backup code' : 'Six-digit authenticator code',
              maxLength: mfa.useBackup ? 9 : 6,
              style: { letterSpacing: mfa.useBackup ? 4 : 8, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 },
            }}
            placeholder={mfa.useBackup ? 'XXXX-XXXX' : '••••••'}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Button
            variant="contained"
            type="submit"
            fullWidth
            disabled={!mfa.code.trim()}
            sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }}
          >
            {t('login.mfaVerify', 'Verify & continue')}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => setMfa((m) => ({ ...m, code: '', useBackup: !m.useBackup }))}
              underline="hover"
              sx={{ fontWeight: 600 }}
            >
              {mfa.useBackup
                ? t('login.mfaUseCode', 'Use my authenticator app instead')
                : t('login.mfaUseBackup', "Can't access your app? Use a backup code")}
            </Link>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );

  // ─── Post-register success view ───────────────────────────────────────────

  const handleResendPostRegister = async () => {
    if (!pendingVerificationEmail) return;
    setResendState({ inFlight: true, message: '' });
    try {
      const res = await resendVerification(pendingVerificationEmail);
      setResendState({ inFlight: false, message: res.data?.message || 'Verification email sent again.' });
    } catch {
      setResendState({ inFlight: false, message: 'If your email is registered, a fresh link has been sent.' });
    }
  };

  const renderRegisterSuccess = () => (
    <Stack spacing={{ xs: 2, sm: 3 }} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
      <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 64, height: 64 }}>
        <MarkEmailReadIcon fontSize="large" />
      </Avatar>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight={800}>
          {t('login.registerSuccessTitle', "You're in — verify your email")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(
            'login.registerSuccessBody',
            "We've sent a verification link to {{email}}. Confirm your address to secure your account — you can continue setting up your shop while it arrives.",
            { email: pendingVerificationEmail }
          )}
        </Typography>
      </Stack>

      {resendState.message && (
        <Alert severity="success" sx={{ width: '100%', borderRadius: 2 }}>
          {resendState.message}
        </Alert>
      )}

      <Stack spacing={1} sx={{ width: '100%' }}>
        <Button
          variant="contained"
          onClick={() => navigate('/setup-shop', { replace: true })}
          fullWidth
          sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
        >
          {t('login.registerContinueSetup', 'Continue to shop setup')}
        </Button>
        <Button
          variant="text"
          onClick={handleResendPostRegister}
          disabled={resendState.inFlight}
          sx={{ textTransform: 'none' }}
        >
          {resendState.inFlight ? 'Sending…' : t('login.resendVerification', "Didn't get it? Resend verification email")}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        {t('login.registerWrongEmail', 'Used the wrong email?')}{' '}
        <Link
          component="button"
          type="button"
          onClick={() => setView('register')}
          underline="hover"
        >
          {t('login.registerFix', 'Go back and fix it')}
        </Link>
        .
      </Typography>
    </Stack>
  );

  // ─── Forgot-sent confirmation view ────────────────────────────────────────

  const renderForgotSent = () => (
    <Stack spacing={{ xs: 2, sm: 3 }} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
      <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 64, height: 64 }}>
        <MarkEmailReadIcon fontSize="large" />
      </Avatar>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight={800}>
          Check your inbox
        </Typography>
        <Typography variant="body2" color="text.secondary">
          If <strong>{forgotSubmittedEmail || 'your email'}</strong> is registered with us, a password reset link is on its way. The link expires in 30 minutes.
        </Typography>
      </Stack>

      <Stack spacing={1} sx={{ width: '100%' }}>
        <Button
          variant="contained"
          onClick={() => setView('login')}
          fullWidth
          sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
        >
          Return to sign in
        </Button>
        <Button
          variant="text"
          onClick={forgotForm.handleSubmit(onForgotSubmit)}
          fullWidth
          disabled={forgotForm.formState.isSubmitting}
          sx={{ textTransform: 'none' }}
        >
          {forgotForm.formState.isSubmitting ? 'Sending…' : "Didn't get the email? Resend"}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Wrong email?{' '}
        <Link component="button" type="button" onClick={() => setView('forgotPassword')} underline="hover">
          Try a different address
        </Link>.
      </Typography>
    </Stack>
  );

  // ─── Route to active view ─────────────────────────────────────────────────

  const renderCurrentView = () => {
    switch (view) {
      case 'login': return renderLogin();
      case 'register': return renderRegister();
      case 'registerSuccess': return renderRegisterSuccess();
      case 'forgotPassword': return renderForgot();
      case 'forgotSent': return renderForgotSent();
      case 'mfaChallenge': return renderMfaChallenge();
      default: return null;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 400, md: 500 }, px: { xs: 2, sm: 0 } }}>
      {renderStatusBanners()}
      {renderCurrentView()}
    </Box>
  );
};

export default Login;
