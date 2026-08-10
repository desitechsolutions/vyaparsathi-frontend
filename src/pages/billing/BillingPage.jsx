import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Stack, Tab, Tabs, Paper,
  Grid, Divider, Button, Alert, AlertTitle, Skeleton,
  IconButton, Tooltip, Chip, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BusinessIcon from '@mui/icons-material/Business';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockIcon from '@mui/icons-material/Lock';
import { toast } from 'react-toastify';

import { useRazorpaySubscription } from '../../hooks/useRazorpaySubscription';
import { useSubscription } from '../../context/SubscriptionContext';
import razorpaySubscriptionApi from '../../services/razorpaySubscriptionApi';
import RazorpayCheckoutButton from '../../components/subscriptions/RazorpayCheckoutButton';
import AutoPayStatusCard from '../../components/subscriptions/AutoPayStatusCard';
import RazorpayInvoiceTable from '../../components/subscriptions/RazorpayInvoiceTable';

// ── Plan definitions ─────────────────────────────────────────────────────────
const PLANS = [
  {
    code: 'STARTER',
    label: 'Starter',
    icon: <StarIcon />,
    color: '#0EA5E9',
    description: 'Perfect for small shops getting started.',
    features: ['Up to 500 invoices/month', 'Basic GST reports', 'Email support'],
  },
  {
    code: 'PRO',
    label: 'Pro',
    icon: <RocketLaunchIcon />,
    color: '#2563EB',
    description: 'The complete toolkit for growing businesses.',
    features: ['Unlimited invoices', 'Advanced analytics', 'Priority support', 'Multi-staff access'],
    popular: true,
  },
  {
    code: 'ENTERPRISE',
    label: 'Enterprise',
    icon: <BusinessIcon />,
    color: '#7C3AED',
    description: 'Tailored for large-scale multi-branch operations.',
    features: ['Everything in Pro', 'API access', 'Dedicated account manager', 'Custom integrations'],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

// ═════════════════════════════════════════════════════════════════════════════
//  BillingPage
// ═════════════════════════════════════════════════════════════════════════════
export default function BillingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [cancellingUtr, setCancellingUtr] = useState(false);

  const { plans: dbPlans, subscriptionStatus, fetchStatus: reloadCoreStatus } = useSubscription();
  const {
    razorpayStatus,
    invoices,
    loading,
    refreshing,
    actionLoading,
    error,
    reload: reloadRazorpay,
    pauseAutoPay,
    resumeAutoPay,
    cancelAutoPay,
  } = useRazorpaySubscription();

  const handleRefresh = () => {
    reloadRazorpay();
    if (reloadCoreStatus) reloadCoreStatus();
  };

  const handleCancelPendingUtr = async () => {
    setCancellingUtr(true);
    try {
      await razorpaySubscriptionApi.cancelPendingUtr();
      toast.success('Pending UTR verification request cancelled.');
      handleRefresh();
    } catch (err) {
      console.error('[BillingPage] Cancel pending UTR error:', err);
      toast.error(err?.response?.data?.message || 'Failed to cancel pending UTR.');
    } finally {
      setCancellingUtr(false);
    }
  };

  // Merge static plan metadata with dynamic prices from DB
  const enrichedPlans = PLANS.map((p) => {
    const dbPlan = dbPlans?.find((d) => d.tier === p.code || d.tier?.name === p.code);
    return {
      ...p,
      monthlyPrice: dbPlan?.monthlyPrice ?? '—',
      yearlyPrice: dbPlan?.yearlyPrice ?? '—',
    };
  });

  const getDisplayPrice = (plan) => {
    const price = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;
    return price === '—' ? '—' : `₹${price}`;
  };

  // Evaluation of AutoPay & Mutual Exclusion states
  const activeAutoPayStatus = razorpayStatus?.status;
  const hasActiveAutoPay = activeAutoPayStatus && !['NONE', 'CANCELLED', 'COMPLETED', 'EXPIRED'].includes(activeAutoPayStatus);
  const currentTier = (razorpayStatus?.planCode || subscriptionStatus?.tier || 'FREE').toUpperCase();

  const hasPendingUtr = subscriptionStatus?.status === 'PENDING';
  const lastUtrNumber = subscriptionStatus?.lastUtr || 'N/A';
  const isUtrActivePlan = subscriptionStatus?.premium && !hasActiveAutoPay;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton size="small" onClick={() => navigate(-1)}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>
              Billing & Subscriptions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your subscription plan, AutoPay mandates, and B2B tax receipts.
            </Typography>
          </Box>
        </Stack>
        <Tooltip title="Refresh billing status">
          <IconButton onClick={handleRefresh} disabled={refreshing} size="small">
            <RefreshIcon fontSize="small" sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => {}}>
          <AlertTitle>Failed to load subscription status</AlertTitle>
          {error}
        </Alert>
      )}

      {/* ── Mutual Exclusion Banners ───────────────────────────────────── */}
      {hasPendingUtr && (
        <Alert
          severity="warning"
          icon={<HourglassTopIcon />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleCancelPendingUtr}
              disabled={cancellingUtr}
              sx={{ fontWeight: 800, textTransform: 'none', border: '1px solid', borderColor: 'currentColor', borderRadius: '8px' }}
            >
              {cancellingUtr ? 'Cancelling...' : 'Cancel Pending UTR'}
            </Button>
          }
          sx={{ mb: 3, borderRadius: '14px', border: '1px solid', borderColor: 'warning.light' }}
        >
          <AlertTitle sx={{ fontWeight: 800 }}>Manual UTR Payment Pending Verification</AlertTitle>
          Manual payment (Ref UTR: <strong>{lastUtrNumber}</strong>) is currently pending admin verification. Razorpay AutoPay checkout is disabled until this request is approved or cancelled.
        </Alert>
      )}

      {hasActiveAutoPay && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '14px', border: '1px solid', borderColor: 'success.light' }}>
          <AlertTitle sx={{ fontWeight: 800 }}>Managed via Razorpay AutoPay ({currentTier} Plan)</AlertTitle>
          Your active subscription is managed via Razorpay e-Mandate. Automatic renewals take place every cycle without manual bank transfers.
        </Alert>
      )}

      {!hasActiveAutoPay && isUtrActivePlan && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: '14px', border: '1px solid', borderColor: 'info.light' }}>
          <AlertTitle sx={{ fontWeight: 800 }}>Active Manual Plan ({currentTier})</AlertTitle>
          You are currently on a manual subscription ({subscriptionStatus?.daysRemaining || 0} days remaining). Subscribing to Razorpay AutoPay will activate your mandate immediately.
        </Alert>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2,
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 52 },
            '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
          }}
        >
          <Tab label="Pricing & Plans" id="tab-plans" aria-controls="tabpanel-plans" />
          <Tab label="AutoPay Mandate Status" id="tab-autopay" aria-controls="tabpanel-autopay" />
          <Tab label="Invoices & Receipts" id="tab-history" aria-controls="tabpanel-history" />
        </Tabs>
      </Paper>

      {/* ════════════════════════════════════════════════════════════════
           TAB 0 — Plans
          ════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={0}>
        {/* Billing cycle toggle */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={700} color="text.secondary">Billing Cycle:</Typography>
          <Stack direction="row" spacing={1}>
            {['MONTHLY', 'YEARLY'].map((cycle) => (
              <Button
                key={cycle}
                variant={billingCycle === cycle ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setBillingCycle(cycle)}
                sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none', px: 2 }}
              >
                {cycle.charAt(0) + cycle.slice(1).toLowerCase()}
                {cycle === 'YEARLY' && (
                  <Chip
                    label="Save 17%"
                    size="small"
                    color="success"
                    sx={{ ml: 1, height: 18, fontSize: '0.55rem', fontWeight: 900, borderRadius: '4px' }}
                  />
                )}
              </Button>
            ))}
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Skeleton variant="rectangular" height={360} sx={{ borderRadius: '20px' }} />
              </Grid>
            ))
          ) : enrichedPlans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.code}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '20px',
                  border: '2px solid',
                  borderColor: plan.popular ? plan.color : 'divider',
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
                }}
              >
                {plan.popular && (
                  <Chip
                    label="MOST POPULAR"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: plan.color,
                      color: 'white',
                      fontWeight: 900,
                      fontSize: '0.6rem',
                      letterSpacing: 0.5,
                      borderRadius: '6px',
                    }}
                  />
                )}

                {/* Plan header */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ color: plan.color }}>{plan.icon}</Box>
                  <Typography variant="h6" fontWeight={900}>{plan.label}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.description}
                </Typography>

                {/* Price */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="h4" fontWeight={900} sx={{ color: plan.color }}>
                    {getDisplayPrice(plan)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    per {billingCycle === 'YEARLY' ? 'year' : 'month'} · billed {billingCycle.toLowerCase()}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Features */}
                <Stack spacing={1} sx={{ mb: 3, flex: 1 }}>
                  {plan.features.map((f) => (
                    <Stack direction="row" spacing={1} alignItems="flex-start" key={f}>
                      <CheckCircleIcon sx={{ fontSize: 16, color: plan.color, mt: 0.2, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>{f}</Typography>
                    </Stack>
                  ))}
                </Stack>

                {/* CTA with Tier Guardrails & Mutual Exclusion Props */}
                <RazorpayCheckoutButton
                  planCode={plan.code}
                  billingCycle={billingCycle}
                  currentTier={currentTier}
                  hasActiveAutoPay={hasActiveAutoPay}
                  hasPendingUtr={hasPendingUtr}
                  sx={{
                    bgcolor: plan.popular ? plan.color : undefined,
                    '&:hover': { bgcolor: plan.popular ? plan.color : undefined, opacity: 0.9 },
                    width: '100%',
                  }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Legacy UTR link */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Prefer manual bank transfer?{' '}
            <Button
              size="small"
              onClick={() => {
                if (hasActiveAutoPay) {
                  toast.info('Active AutoPay mandate running. Cancel AutoPay mandate before submitting manual UTR payments.');
                } else {
                  navigate('/pricing');
                }
              }}
              disabled={hasActiveAutoPay}
              sx={{ textTransform: 'none', fontWeight: 700, p: 0, minWidth: 0, verticalAlign: 'baseline' }}
            >
              Use UTR payment flow →
            </Button>
          </Typography>
        </Box>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════
           TAB 1 — AutoPay Status
          ════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <AutoPayStatusCard
              razorpayStatus={razorpayStatus}
              actionLoading={actionLoading}
              onPause={pauseAutoPay}
              onResume={resumeAutoPay}
              onCancel={cancelAutoPay}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}
            >
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>
                How AutoPay Works
              </Typography>
              <Stack spacing={1.5}>
                {[
                  { step: '1', text: 'Select a plan and click "Subscribe via AutoPay".' },
                  { step: '2', text: 'Authenticate your bank mandate through Razorpay\'s secure checkout.' },
                  { step: '3', text: 'Your subscription renews automatically each billing cycle — no manual action needed.' },
                  { step: '4', text: 'Pause, resume, or cancel anytime from this dashboard.' },
                ].map((item) => (
                  <Stack direction="row" spacing={1.5} key={item.step}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '0.7rem', fontWeight: 900, flexShrink: 0 }}>
                      {item.step}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════
           TAB 2 — Payment History
          ════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={2}>
        <RazorpayInvoiceTable invoices={invoices} razorpayStatus={razorpayStatus} loading={loading} />
      </TabPanel>
    </Container>
  );
}
