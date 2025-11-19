import axios from 'axios';
import { API_URL } from '../utils/constants';

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`
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
  }
};

