import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import { loadRazorpayScript } from '../../utils/razorpayLoader';
import razorpaySubscriptionApi from '../../services/razorpaySubscriptionApi';
import { toast } from 'react-toastify';

/**
 * MUI Button that initiates a Razorpay AutoPay mandate checkout flow
 * with Tier Guardrails & Mutual Exclusion protection.
 *
 * @param {string} planCode        - Tier name: STARTER | PRO | ENTERPRISE
 * @param {string} billingCycle    - MONTHLY | YEARLY (default: MONTHLY)
 * @param {string} currentTier     - Current active tier of the shop
 * @param {boolean} hasActiveAutoPay - True if shop has an active Razorpay AutoPay mandate
 * @param {boolean} hasPendingUtr   - True if a manual UTR payment is pending admin verification
 * @param {string} autoPayStatus   - Raw mandate status (e.g. ACTIVE | PAUSED | HALTED) for the current tier
 * @param {string} buttonText      - Optional custom button label
 * @param {string} variant         - MUI button variant (default: 'contained')
 * @param {string} color           - MUI button color (default: 'primary')
 * @param {boolean} disabled       - External disabled flag
 * @param {object} sx              - MUI sx prop
 */
export default function RazorpayCheckoutButton({
  planCode,
  billingCycle = 'MONTHLY',
  currentTier = 'FREE',
  hasActiveAutoPay = false,
  hasPendingUtr = false,
  autoPayStatus = null,
  buttonText,
  variant = 'contained',
  color = 'primary',
  disabled = false,
  sx = {},
}) {
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const getTierRank = (t) => {
    const code = String(t || 'FREE').toUpperCase();
    if (code === 'ENTERPRISE') return 3;
    if (code === 'PRO') return 2;
    if (code === 'STARTER') return 1;
    return 0; // FREE
  };

  const currentRank = getTierRank(currentTier);
  const targetRank = getTierRank(planCode);

  const isCurrentPlan = hasActiveAutoPay && currentRank === targetRank;
  const isDowngrade = hasActiveAutoPay && targetRank < currentRank;
  const isUpgrade = hasActiveAutoPay && targetRank > currentRank;
  const status = String(autoPayStatus || '').toUpperCase();
  const isCurrentPlanPaused = isCurrentPlan && status === 'PAUSED';
  const isCurrentPlanHalted = isCurrentPlan && status === 'HALTED';

  // Determine button state, label, and tooltip
  let effectiveDisabled = disabled || processing || isCurrentPlan || isDowngrade || hasPendingUtr;
  let label = buttonText;
  let tooltipText = '';

  if (hasPendingUtr) {
    label = 'Pending UTR Verification';
    tooltipText = 'A manual UTR payment is currently pending admin verification. Cancel the pending UTR request or wait for verification before subscribing via Razorpay.';
  } else if (isCurrentPlanHalted) {
    label = 'Payment Failed';
    tooltipText = 'Your AutoPay charge for this plan failed after multiple retries. Update your payment method from Billing.';
  } else if (isCurrentPlanPaused) {
    label = 'AutoPay Paused';
    tooltipText = 'Your AutoPay mandate for this plan is paused. Resume it from Billing to continue.';
  } else if (isCurrentPlan) {
    label = 'Current Active Plan';
    tooltipText = 'You are currently subscribed to this plan.';
  } else if (isDowngrade) {
    label = 'Lower Tier (Locked)';
    tooltipText = 'Active mandate running. Cancel current subscription to downgrade.';
  } else if (isUpgrade && !buttonText) {
    label = `Upgrade to ${planCode}`;
  } else if (!label) {
    label = `Subscribe to ${planCode}`;
  }

  const handleCheckout = async () => {
    if (effectiveDisabled) return;

    setProcessing(true);
    const toastId = toast.loading(`Preparing ${planCode} AutoPay checkout...`);

    try {
      // ── 1. Load SDK ───────────────────────────────────────────────────────
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.dismiss(toastId);
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        setProcessing(false);
        return;
      }

      // ── 2. Create subscription order on the backend ────────────────────────
      const order = await razorpaySubscriptionApi.createSubscriptionOrder({
        planCode,
        billingCycle,
      });

      toast.dismiss(toastId);

      if (!order?.razorpaySubscriptionId || !order?.keyId) {
        toast.error('Checkout could not be initialised. Please try again.');
        setProcessing(false);
        return;
      }

      // ── 3. Open Razorpay checkout modal ────────────────────────────────────
      const options = {
        key: order.keyId,
        subscription_id: order.razorpaySubscriptionId,
        name: 'VyaparSathi',
        description: `${planCode} Plan — AutoPay Mandate (${billingCycle})`,
        handler: async function (response) {
          // ── 4. Verify signature on the backend ─────────────────────────────
          const verifyToastId = toast.loading('Verifying mandate authentication...');
          try {
            const verifyRes = await razorpaySubscriptionApi.verifyCheckoutSignature({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.dismiss(verifyToastId);
            if (verifyRes?.status === 'SUCCESS') {
              toast.success('AutoPay mandate authenticated successfully!');
              navigate('/billing/success');
            } else {
              toast.error('Signature verification failed. Please contact support.');
              navigate('/billing/failure?reason=signature_verification_failed');
            }
          } catch (err) {
            toast.dismiss(verifyToastId);
            console.error('[RazorpayCheckoutButton] Verification error:', err);
            toast.error(err?.response?.data?.message || 'Mandate verification error. Please contact support.');
            navigate('/billing/failure?reason=verification_exception');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          // Fires when the user closes the checkout modal without completing
          // payment. Without this, `processing` only cleared via the outer
          // `finally`, which runs right after the synchronous `rzp.open()`
          // call returns — re-enabling the button while the modal is still
          // open and allowing a second `createSubscriptionOrder` call.
          ondismiss: () => {
            setProcessing(false);
          },
        },
        theme: {
          color: '#2563EB',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('[Razorpay] payment.failed:', response.error);
        toast.error(`AutoPay setup failed: ${response.error?.description || response.error?.code || 'Unknown error'}`);
        navigate(
          `/billing/failure?code=${encodeURIComponent(response.error?.code || '')}&desc=${encodeURIComponent(response.error?.description || '')}`
        );
        setProcessing(false);
      });
      rzp.open();
      // `processing` intentionally stays true while the modal is open — it is
      // cleared above by `modal.ondismiss`, the `handler` callback, or
      // `payment.failed`, not by a blanket `finally` here.

    } catch (err) {
      toast.dismiss(toastId);
      console.error('[RazorpayCheckoutButton] Checkout error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Checkout initiation failed. Please try again.');
      setProcessing(false);
    }
  };

  const buttonElement = (
    <span>
      <Button
        variant={isCurrentPlan ? 'outlined' : variant}
        color={isCurrentPlanHalted ? 'error' : isCurrentPlanPaused ? 'warning' : isCurrentPlan ? 'success' : isDowngrade ? 'inherit' : color}
        onClick={handleCheckout}
        disabled={effectiveDisabled}
        startIcon={
          processing ? (
            <CircularProgress size={16} color="inherit" />
          ) : isCurrentPlan ? (
            <CheckCircleIcon />
          ) : isDowngrade || hasPendingUtr ? (
            <LockIcon />
          ) : (
            <BoltIcon />
          )
        }
        aria-label={`Subscribe to ${planCode} plan via Razorpay AutoPay`}
        sx={{
          borderRadius: '10px',
          fontWeight: 700,
          textTransform: 'none',
          px: 3,
          py: 1.25,
          width: '100%',
          ...sx,
        }}
      >
        {processing ? 'Processing...' : label}
      </Button>
    </span>
  );

  if (tooltipText) {
    return (
      <Tooltip title={tooltipText} arrow placement="top">
        {buttonElement}
      </Tooltip>
    );
  }

  return buttonElement;
}
