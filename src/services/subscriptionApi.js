// Lightweight API wrapper for subscription endpoints
import API from './api'; // existing axios instance in your repo

export const fetchPlans = () => API.get('/api/subscription/plans');

export const fetchSubscriptionStatus = () => API.get('/api/subscription/status');

export const startTrial = () => API.post('/api/subscription/trial/start');

export const createCheckoutSession = (planId) =>
  API.post('/api/subscription/create-checkout-session', { planId });

export const fetchCustomerPortal = () =>
  API.post('/api/subscription/create-portal-session');

export default {
  fetchPlans,
  fetchSubscriptionStatus,
  startTrial,
  createCheckoutSession,
  fetchCustomerPortal,
};