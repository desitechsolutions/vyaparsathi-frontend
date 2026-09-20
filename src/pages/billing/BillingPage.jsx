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
import { computePlanPricing } from '../../utils/pricingUtils';
import razorpaySubscriptionApi from '../../services/razorpaySubscriptionApi';
import RazorpayCheckoutButton from '../../components/subscriptions/RazorpayCheckoutButton';
import AutoPayStatusCard from '../../components/subscriptions/AutoPayStatusCard';
import RazorpayInvoiceTable from '../../components/subscriptions/RazorpayInvoiceTable';

// ── Plan visual metadata (icon/color/description only — prices & features come from DB) ──
const PLANS = [
  {
    code: 'STARTER',
    label: 'Starter',
    icon: <StarIcon />,
    color: '#0EA5E9',
    description: 'Perfect for small shops getting started.',
  },
  {
    code: 'PRO',
    label: 'Pro',
    icon: <RocketLaunchIcon />,
    color: '#2563EB',
    description: 'The complete toolkit for growing businesses.',
    popular: true,
  },
  {
    code: 'ENTERPRISE',
    label: 'Enterprise',
    icon: <BusinessIcon />,
    color: '#7C3AED',
    description: 'Tailored for large-scale multi-branch operations.',
  },
];

const TIER_RANK = { FREE: 0, STARTER: 1, PRO: 2, ENTERPRISE: 3 };

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

  const { plans: dbPlans, subscription: subscriptionStatus, refreshStatus: reloadCoreStatus } = useSubscription();
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

  // Merge static visual metadata with live DB plan data
  const enrichedPlans = PLANS.map((p) => {
    const dbPlan = dbPlans?.find((d) => d.tier === p.code || d.tier?.name === p.code);
    return { ...p, dbPlan: dbPlan || null };
  });

  // Evaluation of AutoPay & Mutual Exclusion states
  const activeAutoPayStatus = razorpayStatus?.status;
  const hasActiveAutoPay = activeAutoPayStatus && !['NONE', 'CANCELLED', 'COMPLETED', 'EXPIRED'].includes(activeAutoPayStatus);
  const currentTier = (razorpayStatus?.planCode || subscriptionStatus?.tier || 'FREE').toUpperCase();

  const hasPendingUtr = subscriptionStatus?.status === 'PENDING';
  const lastUtrNumber = subscriptionStatus?.lastUtr || 'N/A';
  const isUtrActiveSubscription = !hasActiveAutoPay && !hasPendingUtr &&
    subscriptionStatus?.status === 'ACTIVE' && currentTier !== 'FREE';

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

      {!hasActiveAutoPay && isUtrActiveSubscription && (
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
        {/* Billing cycle toggle & ITC Note */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="body2" fontWeight={800} color="text.secondary">Billing Frequency:</Typography>
            <Stack direction="row" spacing={1}>
              {['MONTHLY', 'YEARLY'].map((cycle) => (
                <Button
                  key={cycle}
                  variant={billingCycle === cycle ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setBillingCycle(cycle)}
                  sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none', px: 2 }}
                >
                  {cycle.charAt(0) + cycle.slice(1).toLowerCase()}
                  {cycle === 'YEARLY' && (
                    <Chip
                      label="Save up to 20%"
                      size="small"
                      color="success"
                      sx={{ ml: 1, height: 18, fontSize: '0.55rem', fontWeight: 900, borderRadius: '4px' }}
                    />
                  )}
                </Button>
              ))}
            </Stack>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
            All plans include 18% GST with admissible <strong>Input Tax Credit (ITC)</strong> for registered businesses.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Skeleton variant="rectangular" height={380} sx={{ borderRadius: '20px' }} />
              </Grid>
            ))
          ) : enrichedPlans.map((plan) => {
            const cycle = billingCycle.toLowerCase();
            const { pricePerMonth, gstTotal, isCustomPricing, isPromoActive: promoActive, promoLabel, basePricePerMonth } =
              computePlanPricing(plan.dbPlan || {}, cycle);

            const dbFeatures = plan.dbPlan?.features;
            const features = dbFeatures?.length > 0 ? dbFeatures : [];

            const discountPct = plan.dbPlan?.discountPercentage;
            const isPopular = plan.popular || plan.dbPlan?.isPopular;

            const planTierRank = TIER_RANK[plan.code] || 0;
            const userTierRank = TIER_RANK[currentTier] || 0;
            const isCurrentUtrPlan = isUtrActiveSubscription && planTierRank === userTierRank;
            const isUtrDowngrade = isUtrActiveSubscription && planTierRank < userTierRank;

            // Taxable Base vs GST
            const numericTotal = Number(gstTotal || (Number(pricePerMonth || 0) * (billingCycle === 'YEARLY' ? 12 : 1) * 1.18).toFixed(2));
            const numericBase = Number((numericTotal / 1.18).toFixed(2));
            const numericGst = Number((numericTotal - numericBase).toFixed(2));

            return (
              <Grid item xs={12} md={4} key={plan.code}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '20px',
                    border: '2px solid',
                    borderColor: isCurrentUtrPlan ? 'success.main' : isPopular ? plan.color : 'divider',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    bgcolor: 'background.paper',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 28px rgba(0,0,0,0.07)' },
                  }}
                >
                  {isCurrentUtrPlan ? (
                    <Chip
                      label="CURRENT ACTIVE PLAN"
                      size="small"
                      sx={{
                        position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                        bgcolor: 'success.main', color: 'white', fontWeight: 900,
                        fontSize: '0.6rem', letterSpacing: 0.5, borderRadius: '6px', px: 0.5,
                      }}
                    />
                  ) : isPopular ? (
                    <Chip
                      label="MOST POPULAR · ENTERPRISE PICK"
                      size="small"
                      sx={{
                        position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                        bgcolor: plan.color, color: 'white', fontWeight: 900,
                        fontSize: '0.6rem', letterSpacing: 0.5, borderRadius: '6px', px: 0.5,
                      }}
                    />
                  ) : null}

                  {/* Plan header */}
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box sx={{ color: plan.color, display: 'flex' }}>{plan.icon}</Box>
                    <Typography variant="h6" fontWeight={900}>
                      {plan.dbPlan?.displayName || plan.label}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 38 }}>
                    {plan.description}
                  </Typography>

                  {/* Price */}
                  <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {isCustomPricing ? (
                      <Typography variant="h4" fontWeight={900} sx={{ color: plan.color }}>Custom</Typography>
                    ) : !plan.dbPlan ? (
                      <Typography variant="h4" fontWeight={900} sx={{ color: plan.color }}>—</Typography>
                    ) : (
                      <>
                        {promoActive && (
                          <Typography variant="caption" sx={{ color: 'text.disabled', textDecoration: 'line-through', fontWeight: 700 }}>
                            ₹{basePricePerMonth}/mo regular
                          </Typography>
                        )}
                        <Stack direction="row" alignItems="baseline" spacing={0.5}>
                          <Typography variant="h4" fontWeight={900} sx={{ color: promoActive ? 'error.main' : plan.color }}>
                            ₹{pricePerMonth}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={700}>/month</Typography>
                        </Stack>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Taxable: <strong>₹{numericBase.toFixed(2)}</strong> + 18% GST: <strong>₹{numericGst.toFixed(2)}</strong>
                        </Typography>
                        <Typography variant="caption" fontWeight={800} color="primary" sx={{ display: 'block' }}>
                          Total: ₹{numericTotal.toFixed(2)} billed {cycle}
                        </Typography>

                        {promoActive && promoLabel && (
                          <Chip label={promoLabel} size="small" color="error"
                            sx={{ display: 'block', mt: 0.75, fontWeight: 800, fontSize: '0.6rem', height: 20, width: 'fit-content' }} />
                        )}
                      </>
                    )}
                    {billingCycle === 'YEARLY' && discountPct > 0 && !promoActive && (
                      <Chip
                        label={`Annual Savings ${discountPct}% applied`}
                        size="small" color="success"
                        sx={{ mt: 0.75, height: 18, fontSize: '0.55rem', fontWeight: 900, borderRadius: '4px' }}
                      />
                    )}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Features from DB */}
                  <Stack spacing={1} sx={{ mb: 3, flex: 1 }}>
                    {features.length > 0 ? features
                      .filter(f => !f.startsWith('-') && !f.startsWith('~'))
                      .map((f) => (
                        <Stack direction="row" spacing={1} alignItems="flex-start" key={f}>
                          <CheckCircleIcon sx={{ fontSize: 15, color: plan.color, mt: 0.25, flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>{f}</Typography>
                        </Stack>
                      )) : (
                        <Typography variant="caption" color="text.disabled">Features loading…</Typography>
                      )}
                  </Stack>

                  {/* CTA Button */}
                  {isCurrentUtrPlan ? (
                    <Button fullWidth variant="outlined" color="success" disabled
                      startIcon={<CheckCircleIcon />}
                      sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', py: 1.25 }}
                    >
                      Current Active Plan
                    </Button>
                  ) : isUtrDowngrade ? (
                    <Tooltip title="You are currently on a higher subscription plan. Downgrading requires cancelling your active term first." arrow>
                      <span>
                        <Button fullWidth variant="outlined" disabled
                          startIcon={<LockIcon />}
                          sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', py: 1.25 }}
                        >
                          Higher Plan Active
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <RazorpayCheckoutButton
                      planCode={plan.code}
                      billingCycle={billingCycle}
                      currentTier={currentTier}
                      hasActiveAutoPay={hasActiveAutoPay}
                      hasPendingUtr={hasPendingUtr}
                      autoPayStatus={activeAutoPayStatus}
                      sx={{
                        bgcolor: isPopular ? plan.color : undefined,
                        '&:hover': { bgcolor: isPopular ? plan.color : undefined, opacity: 0.9 },
                        width: '100%',
                        borderRadius: '10px',
                        py: 1.25,
                        fontWeight: 800,
                      }}
                    />
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Enterprise Assistance & UTR Footer */}
        <Paper elevation={0} sx={{ mt: 4, p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800}>
                Need multi-branch consolidation or enterprise custom deployment?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Our solutions engineering team can configure custom API rate limits, multi-warehouse clusters, and dedicated support agreements.
              </Typography>
            </Box>
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
              sx={{ textTransform: 'none', fontWeight: 800, whiteSpace: 'nowrap' }}
            >
              Manual UTR Bank Transfer →
            </Button>
          </Stack>
        </Paper>
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
            <Stack spacing={2.5}>
              {/* How AutoPay Works */}
              <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
              >
                <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 2 }}>
                  How e-Mandate AutoPay Works
                </Typography>
                <Stack spacing={2}>
                  {[
                    { step: '1', title: 'Mandate Authorization', text: 'Authenticate your bank mandate via UPI AutoPay, NetBanking, or Debit/Credit card through Razorpay.' },
                    { step: '2', title: 'Pre-Debit Notification', text: 'In full accordance with RBI regulations, you receive an automated SMS/email alert 24 hours prior to each charge.' },
                    { step: '3', title: 'Automated Cycle Renewal', text: 'Your plan renews effortlessly without manual invoice processing or service disruption.' },
                    { step: '4', title: 'Complete User Control', text: 'Pause recurring debits during slow business periods, or cancel anytime with zero cancellation penalties.' },
                  ].map((item) => (
                    <Stack direction="row" spacing={1.5} key={item.step} alignItems="flex-start">
                      <Avatar sx={{ width: 26, height: 26, bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '0.75rem', fontWeight: 900, flexShrink: 0 }}>
                        {item.step}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={800} color="text.primary">
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.text}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              {/* Priority Billing Support Box */}
              <Paper
                elevation={0}
                sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #bfdbfe', bgcolor: '#eff6ff' }}
              >
                <Typography variant="subtitle2" fontWeight={800} color="#1e40af" sx={{ mb: 0.5 }}>
                  Enterprise Billing Support Desk
                </Typography>
                <Typography variant="caption" color="#1e3a8a" sx={{ display: 'block', mb: 1.5, lineHeight: 1.45 }}>
                  Need to update your corporate GSTIN on historical receipts, amend legal billing entities, or query bank mandate clearances?
                </Typography>
                <Typography variant="body2" fontWeight={800} color="#1e40af" sx={{ fontFamily: 'monospace' }}>
                  contact@desitechsolutions.com • info@desitechsolutions.com
                </Typography>
              </Paper>
            </Stack>
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
