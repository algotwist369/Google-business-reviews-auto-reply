import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useSuperAdmin = (token) => {
  const [stats, setStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    role: 'all',
    trialStatus: 'all',
    subscriptionStatus: 'all',
    search: ''
  });

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.getSuperAdminStats(token);
      setStats(response.data);
      setError(null); // Clear error on success
    } catch (err) {
      // Only log and set error for super admin specific errors
      // Don't show errors for 401/403 if user is not super admin
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        // Silent fail for non-super-admin users
        setError(null);
        return;
      }
      console.error('Error loading stats:', err);
      setError(err.response?.data?.error || 'Failed to load statistics');
    }
  }, [token]);

  const loadBusinesses = useCallback(async (page = 1, newFilters = filters) => {
    if (!token) return;
    setBusinessesLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...newFilters
      };
      // Remove 'all' values from params
      Object.keys(params).forEach(key => {
        if (params[key] === 'all' || params[key] === '') {
          delete params[key];
        }
      });

      const response = await api.getAllBusinesses(token, params);
      setBusinesses(response.data || []);
      setPagination(response.pagination || { page, limit: 20, total: 0, pages: 0 });
      setError(null);
    } catch (err) {
      // Only show error if it's not a 401/403 (unauthorized)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        // Silent fail for non-super-admin users
        setError(null);
        return;
      }
      console.error('Error loading businesses:', err);
      setError(err.response?.data?.error || 'Failed to load businesses');
    } finally {
      setBusinessesLoading(false);
    }
  }, [token, filters, pagination.limit]);

  const loadBusinessDetails = useCallback(async (businessId) => {
    if (!token) return;
    try {
      const response = await api.getBusinessDetails(token, businessId);
      setSelectedBusiness(response.data);
      return response.data;
    } catch (err) {
      console.error('Error loading business details:', err);
      setError(err.response?.data?.error || 'Failed to load business details');
      throw err;
    }
  }, [token]);

  const enableTrial = useCallback(async (businessId, days = 14) => {
    if (!token) return;
    try {
      const response = await api.enableTrial(token, businessId, days);
      await loadBusinesses(pagination.page, filters);
      return response;
    } catch (err) {
      console.error('Error enabling trial:', err);
      setError(err.response?.data?.error || 'Failed to enable trial');
      throw err;
    }
  }, [token, pagination.page, filters, loadBusinesses]);

  const disableTrial = useCallback(async (businessId) => {
    if (!token) return;
    try {
      const response = await api.disableTrial(token, businessId);
      await loadBusinesses(pagination.page, filters);
      return response;
    } catch (err) {
      console.error('Error disabling trial:', err);
      setError(err.response?.data?.error || 'Failed to disable trial');
      throw err;
    }
  }, [token, pagination.page, filters, loadBusinesses]);

  const updateSubscription = useCallback(async (businessId, subscription) => {
    if (!token) return;
    try {
      const response = await api.updateSubscription(token, businessId, subscription);
      await loadBusinesses(pagination.page, filters);
      return response;
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err.response?.data?.error || 'Failed to update subscription');
      throw err;
    }
  }, [token, pagination.page, filters, loadBusinesses]);

  const updateBusinessRole = useCallback(async (businessId, role) => {
    if (!token) return;
    try {
      const response = await api.updateBusinessRole(token, businessId, role);
      await loadBusinesses(pagination.page, filters);
      return response;
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.response?.data?.error || 'Failed to update role');
      throw err;
    }
  }, [token, pagination.page, filters, loadBusinesses]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    loadBusinesses(1, newFilters);
  }, [loadBusinesses]);

  const changePage = useCallback((page) => {
    loadBusinesses(page, filters);
  }, [loadBusinesses, filters]);

  useEffect(() => {
    // Only load super admin data if token exists
    // Don't load if token is invalid (will be handled by error state)
    if (token) {
      setLoading(true);
      setError(null); // Clear previous errors
      Promise.all([loadStats(), loadBusinesses()]).catch((err) => {
        // Silently handle errors - they're already set in loadStats/loadBusinesses
        // Only set error if it's a 401 (unauthorized) - means not super admin
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setError('Access denied. Super admin privileges required.');
        }
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [token, loadStats, loadBusinesses]);

  return {
    stats,
    businesses,
    selectedBusiness,
    loading,
    businessesLoading,
    error,
    pagination,
    filters,
    loadStats,
    loadBusinesses,
    loadBusinessDetails,
    enableTrial,
    disableTrial,
    updateSubscription,
    updateBusinessRole,
    updateFilters,
    changePage,
    setSelectedBusiness
  };
};

