/**
 * Razorpay AutoPay subscription API service.
 * Wraps all /api/subscriptions/razorpay/* and related calls.
 * Uses the existing authenticated API axios instance from services/api.js.
 */
import API from './api';

const BASE = '/api/subscriptions/razorpay';

const razorpaySubscriptionApi = {
  /**
   * Creates a Razorpay subscription order.
   * Returns { keyId, razorpaySubscriptionId, planCode, billingCycle, amount, ... }
   */
  createSubscriptionOrder: async ({ planCode, billingCycle, customerEmail, customerContact }) => {
    const res = await API.post(`${BASE}/create`, {
      planCode,
      billingCycle: billingCycle || 'MONTHLY',
      customerEmail,
      customerContact,
    });
    return res.data;
  },

  /**
   * Verifies the Razorpay checkout signature after mandate authentication.
   * Returns { status: 'SUCCESS' | 'FAILED', message }
   */
  verifyCheckoutSignature: async ({ razorpay_payment_id, razorpay_subscription_id, razorpay_signature }) => {
    const res = await API.post(`${BASE}/verify-checkout-signature`, {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    });
    return res.data;
  },

  /**
   * Returns the aggregated Razorpay subscription status for the authenticated shop.
   * @param {number|null} shopId - Admin override; omit for own shop.
   */
  getStatus: async (shopId = null) => {
    const params = shopId ? { shopId } : {};
    const res = await API.get(`${BASE}/status`, { params });
    return res.data;
  },

  /**
   * Pauses the active AutoPay mandate.
   */
  pauseAutoPay: async (shopId = null) => {
    const params = shopId ? { shopId } : {};
    const res = await API.post(`${BASE}/pause`, null, { params });
    return res.data;
  },

  /**
   * Resumes a paused AutoPay mandate.
   */
  resumeAutoPay: async (shopId = null) => {
    const params = shopId ? { shopId } : {};
    const res = await API.post(`${BASE}/resume`, null, { params });
    return res.data;
  },

  /**
   * Cancels the AutoPay mandate.
   * @param {boolean} cancelAtCycleEnd - true = cancel at end of billing cycle, false = immediate.
   * @param {number|null} shopId - Admin override.
   */
  cancelAutoPay: async (cancelAtCycleEnd = true, shopId = null) => {
    const params = { cancelAtCycleEnd };
    if (shopId) params.shopId = shopId;
    const res = await API.post(`${BASE}/cancel`, null, { params });
    return res.data;
  },

  /**
   * Fetches Razorpay payment log / invoice history.
   */
  getInvoices: async (shopId = null) => {
    const params = shopId ? { shopId } : {};
    const res = await API.get(`${BASE}/invoices`, { params });
    return res.data;
  },

  /**
   * Cancels a pending manual UTR verification request for the shop.
   */
  cancelPendingUtr: async () => {
    const res = await API.post('/api/subscriptions/cancel-pending-utr');
    return res.data;
  },
};

export default razorpaySubscriptionApi;
