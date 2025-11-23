import axios from 'axios';
import { API_URL } from '../utils/constants';

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`
});

const withAuthConfig = (token, config = {}) => ({
  ...config,
  headers: {
    ...getAuthHeaders(token),
    ...(config.headers || {})
  }
});

export const api = {
  /**
   * Get reviews with optional filtering, sorting, and pagination
   * @param {string} token - Auth token
   * @param {Object} options - Query options (page, limit, filter, sort, locationId)
   * @returns {Promise} Response data
   */
  getReviews: async (token, options = {}) => {
    const { page, limit, filter, sort, locationId } = options;
    const params = {};
    
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (filter) params.filter = filter;
    if (sort) params.sort = sort;
    if (locationId) params.locationId = locationId;

    const response = await axios.get(`${API_URL}/api/reviews`, {
      headers: getAuthHeaders(token),
      params
    });
    
    // Handle both new paginated format and backward compatible format
    if (response.data.success !== undefined) {
      // New format with pagination
      return response.data.data || response.data;
    }
    // Backward compatible format (array of locations)
    return response.data;
  },

  /**
   * Get all reviews without pagination (backward compatibility)
   * @param {string} token - Auth token
   * @returns {Promise} Response data
   */
  getAllReviews: async (token) => {
    const response = await axios.get(`${API_URL}/api/reviews/all`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  },

  replyToReview: async (token, reviewName, comment) => {
    const response = await axios.post(
      `${API_URL}/api/reviews/reply`,
      { reviewName, comment },
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  generateAiReply: async (token, payload) => {
    const response = await axios.post(
      `${API_URL}/api/reviews/ai-reply`,
      payload,
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  getAutoReplyConfig: async (token) => {
    const response = await axios.get(`${API_URL}/api/auto-reply/config`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  },

  getAutoReplyStats: async (token) => {
    const response = await axios.get(`${API_URL}/api/auto-reply/stats`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  },

  updateAutoReplyConfig: async (token, payload) => {
    const response = await axios.put(
      `${API_URL}/api/auto-reply/config`,
      payload,
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  getAutoReplyTasks: async (token, params = {}) => {
    const response = await axios.get(`${API_URL}/api/auto-reply/tasks`, {
      headers: getAuthHeaders(token),
      params
    });
    return response.data;
  },

  getNewReviews: async (token, params = {}) => {
    const response = await axios.get(`${API_URL}/api/auto-reply/new-reviews`, {
      headers: getAuthHeaders(token),
      params
    });
    return response.data;
  },

  runAutoReplyNow: async (token) => {
    const response = await axios.post(
      `${API_URL}/api/auto-reply/run`,
      {},
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  retryAutoReplyTask: async (token, taskId) => {
    const response = await axios.post(
      `${API_URL}/api/auto-reply/tasks/${taskId}/retry`,
      {},
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  // Super Admin APIs
  getSuperAdminStats: async (token) => {
    const response = await axios.get(`${API_URL}/api/super-admin/dashboard/stats`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  },

  getAllBusinesses: async (token, params = {}) => {
    const response = await axios.get(`${API_URL}/api/super-admin/businesses`, {
      headers: getAuthHeaders(token),
      params
    });
    return response.data;
  },

  getBusinessDetails: async (token, businessId) => {
    const response = await axios.get(`${API_URL}/api/super-admin/businesses/${businessId}`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  },

  enableTrial: async (token, businessId, days = 14) => {
    const response = await axios.post(
      `${API_URL}/api/super-admin/businesses/${businessId}/trial/enable`,
      { days },
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  disableTrial: async (token, businessId) => {
    const response = await axios.post(
      `${API_URL}/api/super-admin/businesses/${businessId}/trial/disable`,
      {},
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  updateSubscription: async (token, businessId, subscription) => {
    const response = await axios.put(
      `${API_URL}/api/super-admin/businesses/${businessId}/subscription`,
      subscription,
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  updateBusinessRole: async (token, businessId, role) => {
    const response = await axios.put(
      `${API_URL}/api/super-admin/businesses/${businessId}/role`,
      { role },
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  // User profile
  getProfile: async (token, config) => {
    const response = await axios.get(`${API_URL}/api/user/profile`, withAuthConfig(token, config));
    return response.data;
  },

  // Payment APIs
  getSubscriptionPlans: async (token, config) => {
    const response = await axios.get(`${API_URL}/api/payment/plans`, withAuthConfig(token, config));
    return response.data;
  },

  getSubscriptionStatus: async (token, config) => {
    const response = await axios.get(`${API_URL}/api/payment/subscription`, withAuthConfig(token, config));
    return response.data;
  },

  createCheckoutSession: async (token, plan, config) => {
    const response = await axios.post(
      `${API_URL}/api/payment/checkout`,
      { plan },
      withAuthConfig(token, config)
    );
    return response.data;
  },

  verifyRazorpayPayment: async (token, payload, config) => {
    const response = await axios.post(
      `${API_URL}/api/payment/verify`,
      payload,
      withAuthConfig(token, config)
    );
    return response.data;
  },

  cancelSubscription: async (token, config) => {
    const response = await axios.post(
      `${API_URL}/api/payment/cancel`,
      {},
      withAuthConfig(token, config)
    );
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    return response.data;
  },

  logout: async (token, refreshToken) => {
    const response = await axios.post(
      `${API_URL}/auth/logout`,
      { refreshToken },
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  }
};

