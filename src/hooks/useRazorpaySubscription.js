import { useState, useEffect, useCallback } from 'react';
import razorpaySubscriptionApi from '../services/razorpaySubscriptionApi';
import { toast } from 'react-toastify';

/**
 * Custom hook for Razorpay AutoPay subscription management.
 * Encapsulates status fetch, invoice fetch, and all mandate lifecycle actions.
 *
 * @example
 * const { razorpayStatus, loading, pauseAutoPay } = useRazorpaySubscription();
 */
export function useRazorpaySubscription() {
  const [razorpayStatus, setRazorpayStatus] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [statusData, invoiceData] = await Promise.all([
        razorpaySubscriptionApi.getStatus(),
        razorpaySubscriptionApi.getInvoices(),
      ]);
      setRazorpayStatus(statusData);
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load AutoPay subscription data';
      setError(msg);
      console.error('[useRazorpaySubscription] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(false);
    // Re-fetch when tab regains focus (catches Razorpay SDK callback side-effects)
    const onFocus = () => fetchAll(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchAll]);

  // ── PAUSE ──────────────────────────────────────────────────────────────────

  const pauseAutoPay = async () => {
    const toastId = toast.loading('Pausing AutoPay mandate...');
    setActionLoading(true);
    try {
      await razorpaySubscriptionApi.pauseAutoPay();
      toast.dismiss(toastId);
      toast.success('AutoPay mandate paused successfully.');
      await fetchAll(true);
      return true;
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to pause AutoPay mandate');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // ── RESUME ─────────────────────────────────────────────────────────────────

  const resumeAutoPay = async () => {
    const toastId = toast.loading('Resuming AutoPay mandate...');
    setActionLoading(true);
    try {
      await razorpaySubscriptionApi.resumeAutoPay();
      toast.dismiss(toastId);
      toast.success('AutoPay mandate resumed successfully.');
      await fetchAll(true);
      return true;
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to resume AutoPay mandate');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // ── CANCEL ─────────────────────────────────────────────────────────────────

  const cancelAutoPay = async (cancelAtCycleEnd = true) => {
    const label = cancelAtCycleEnd ? 'end-of-cycle cancellation' : 'immediate cancellation';
    const toastId = toast.loading(`Processing ${label}...`);
    setActionLoading(true);
    try {
      await razorpaySubscriptionApi.cancelAutoPay(cancelAtCycleEnd);
      toast.dismiss(toastId);
      toast.warning(
        cancelAtCycleEnd
          ? 'Subscription will be cancelled at end of the current billing cycle.'
          : 'Subscription cancelled immediately. Tier reverted to FREE.'
      );
      await fetchAll(true);
      return true;
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel subscription');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    razorpayStatus,
    invoices,
    loading,
    refreshing,
    actionLoading,
    error,
    reload: () => fetchAll(true),
    pauseAutoPay,
    resumeAutoPay,
    cancelAutoPay,
  };
}
