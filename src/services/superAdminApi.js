import api from './api';

const superAdminApi = {
  // Executive Operations Metrics
  getExecutiveMetrics: async () => {
    const response = await api.get('/api/admin/operations/metrics');
    return response.data;
  },

  // Shop 360 Profile
  getShop360: async (shopId) => {
    const response = await api.get(`/api/admin/operations/shops/${shopId}/360`);
    return response.data;
  },

  // Shop Lifecycle Update
  updateShopLifecycle: async (shopId, active, reason) => {
    const response = await api.post(`/api/admin/operations/shops/${shopId}/lifecycle`, { active, reason });
    return response.data;
  },

  // Impersonation
  startImpersonation: async (targetShopId, targetUserId, reason) => {
    const response = await api.post('/api/admin/operations/impersonate', { targetShopId, targetUserId, reason });
    return response.data;
  },

  exitImpersonation: async (sessionUuid) => {
    const response = await api.post(`/api/admin/operations/impersonate/exit?sessionUuid=${sessionUuid}`);
    return response.data;
  },

  // Feature Flags
  getPlatformFlags: async () => {
    const response = await api.get('/api/admin/feature-flags/platform');
    return response.data;
  },

  getShopFeatureOverrides: async (shopId) => {
    const response = await api.get(`/api/admin/feature-flags/shops/${shopId}`);
    return response.data;
  },

  setFeatureOverride: async (shopId, featureKey, enabled) => {
    const response = await api.post(`/api/admin/feature-flags/shops/${shopId}/override`, { featureKey, enabled });
    return response.data;
  },

  // Entitlement Limits
  getShopLimitOverrides: async (shopId) => {
    const response = await api.get(`/api/admin/entitlements/shops/${shopId}`);
    return response.data;
  },

  addLimitOverride: async (shopId, resourceKey, overrideLimit, endDate, reason) => {
    const response = await api.post(`/api/admin/entitlements/shops/${shopId}/override`, {
      resourceKey, overrideLimit, endDate, reason
    });
    return response.data;
  },

  // Admin Invitations
  getPendingInvitations: async () => {
    const response = await api.get('/api/admin/invitations');
    return response.data;
  },

  createAdminInvitation: async (email, role) => {
    const response = await api.post('/api/admin/invitations', { email, role });
    return response.data;
  },

  revokeInvitation: async (id) => {
    const response = await api.post(`/api/admin/invitations/${id}/revoke`);
    return response.data;
  },

  // Public Invitation Flows
  validateInvitationToken: async (token) => {
    const response = await api.get(`/api/v1/public/invitations/validate?token=${token}`);
    return response.data;
  },

  acceptInvitation: async (token, password, firstName, lastName) => {
    const response = await api.post('/api/v1/public/invitations/accept', { token, password, firstName, lastName });
    return response.data;
  },
};

export default superAdminApi;
