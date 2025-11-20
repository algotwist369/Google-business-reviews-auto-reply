import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useWebSocket } from './useWebSocket';
import { debounce } from '../utils/debounce';

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

  // Track ongoing requests to prevent duplicates
  const statsRequestRef = useRef(false);
  const businessesRequestRef = useRef(false);

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
    
    // Prevent duplicate simultaneous requests
    if (businessesRequestRef.current) {
      return;
    }
    
    businessesRequestRef.current = true;
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
      // Only show error if it's not a 401/403/429 (unauthorized/rate limited)
      if (err?.response?.status === 401 || err?.response?.status === 403 || err?.response?.status === 429) {
        // Silent fail for non-super-admin users or rate limited
        setError(null);
        return;
      }
      console.error('Error loading businesses:', err);
      setError(err.response?.data?.error || 'Failed to load businesses');
    } finally {
      setBusinessesLoading(false);
      businessesRequestRef.current = false;
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
      // WebSocket will automatically refresh via 'superAdmin:business:updated' event
      return response;
    } catch (err) {
      console.error('Error enabling trial:', err);
      setError(err.response?.data?.error || 'Failed to enable trial');
      throw err;
    }
  }, [token]);

  const disableTrial = useCallback(async (businessId) => {
    if (!token) return;
    try {
      const response = await api.disableTrial(token, businessId);
      // WebSocket will automatically refresh via 'superAdmin:business:updated' event
      return response;
    } catch (err) {
      console.error('Error disabling trial:', err);
      setError(err.response?.data?.error || 'Failed to disable trial');
      throw err;
    }
  }, [token]);

  const updateSubscription = useCallback(async (businessId, subscription) => {
    if (!token) return;
    try {
      const response = await api.updateSubscription(token, businessId, subscription);
      // WebSocket will automatically refresh via 'superAdmin:business:updated' event
      return response;
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err.response?.data?.error || 'Failed to update subscription');
      throw err;
    }
  }, [token]);

  const updateBusinessRole = useCallback(async (businessId, role) => {
    if (!token) return;
    try {
      const response = await api.updateBusinessRole(token, businessId, role);
      // WebSocket will automatically refresh via 'superAdmin:business:updated' event
      return response;
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.response?.data?.error || 'Failed to update role');
      throw err;
    }
  }, [token]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    loadBusinesses(1, newFilters);
  }, [loadBusinesses]);

  const changePage = useCallback((page) => {
    loadBusinesses(page, filters);
  }, [loadBusinesses, filters]);

  // Initialize WebSocket connection
  const { subscribe } = useWebSocket(token);

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

  // Debounced refresh functions to prevent rapid calls
  const debouncedLoadStats = useRef(debounce(() => loadStats(), 500)).current;
  const debouncedLoadBusinesses = useRef(debounce(() => loadBusinesses(pagination.page, filters), 500)).current;
  const debouncedLoadBoth = useRef(debounce(() => {
    loadStats();
    loadBusinesses(pagination.page, filters);
  }, 500)).current;

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!token) return;

    // Subscribe to stats updates (data comes in payload - no API call needed)
    const unsubscribeStats = subscribe('superAdmin:stats:updated', (payload) => {
      if (payload) {
        setStats(payload);
      }
    });

    // Subscribe to stats refresh request (debounced)
    const unsubscribeStatsRefresh = subscribe('superAdmin:stats:refresh', () => {
      debouncedLoadStats();
    });

    // Subscribe to businesses updates (data comes in payload - no API call needed)
    const unsubscribeBusinesses = subscribe('superAdmin:businesses:updated', (payload) => {
      if (payload.data) {
        setBusinesses(payload.data);
      }
      if (payload.pagination) {
        setPagination(payload.pagination);
      }
    });

    // Subscribe to businesses refresh request (debounced)
    const unsubscribeBusinessesRefresh = subscribe('superAdmin:businesses:refresh', () => {
      debouncedLoadBusinesses();
    });

    // Subscribe to business updated (debounced)
    const unsubscribeBusinessUpdated = subscribe('superAdmin:business:updated', () => {
      // Refresh both stats and businesses when a business is updated
      debouncedLoadBoth();
    });

    return () => {
      unsubscribeStats();
      unsubscribeStatsRefresh();
      unsubscribeBusinesses();
      unsubscribeBusinessesRefresh();
      unsubscribeBusinessUpdated();
    };
  }, [token, subscribe, debouncedLoadStats, debouncedLoadBusinesses, debouncedLoadBoth]);

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

