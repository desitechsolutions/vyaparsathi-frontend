import API from './api';

const platformApi = {
  /**
   * Fetch public platform vendor & bank details.
   */
  getPublicPlatformInfo: async () => {
    const res = await API.get('/api/v1/public/platform-info');
    return res.data;
  },

  /**
   * Fetch platform details for SuperAdmin management console.
   */
  getAdminPlatformDetails: async () => {
    const res = await API.get('/api/admin/platform');
    return res.data;
  },

  /**
   * Update platform details (SuperAdmin restricted).
   */
  updateAdminPlatformDetails: async (dto) => {
    const res = await API.put('/api/admin/platform', dto);
    return res.data;
  },
};

export default platformApi;
