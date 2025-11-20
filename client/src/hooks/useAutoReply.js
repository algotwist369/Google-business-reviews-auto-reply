import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useWebSocket } from './useWebSocket';
import { debounce } from '../utils/debounce';

const EMPTY_SETTINGS = {
  enabled: true,
  delayMinutes: 5,
  tone: 'friendly',
  respondToPositive: true,
  respondToNeutral: true,
  respondToNegative: true
};

const EMPTY_STATS = {
  totals: {},
  sentLast7d: 0,
  sentAllTime: 0,
  failedTotal: 0
};

export const useAutoReply = (token) => {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [tasks, setTasks] = useState([]);
  const [newReviews, setNewReviews] = useState([]);
  const [ramaReplies, setRamaReplies] = useState([]);
  const [options, setOptions] = useState({ delayMinutes: [], tones: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newReviewsLoading, setNewReviewsLoading] = useState(false);
  const [ramaRepliesLoading, setRamaRepliesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Initialize WebSocket connection
  const { subscribe } = useWebSocket(token);

  // Track ongoing requests to prevent duplicates
  const tasksRequestRef = useRef(false);
  const newReviewsRequestRef = useRef(false);
  const ramaRepliesRequestRef = useRef(false);
  const statsRequestRef = useRef(false);

  const loadConfig = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setSettingsLoading(true);
    try {
      const response = await api.getAutoReplyConfig(token);
      const payload = response || {};
      setSettings(payload.data?.settings || EMPTY_SETTINGS);
      setStats(payload.data?.stats || EMPTY_STATS);
      setOptions(payload.data?.options || { delayMinutes: [], tones: [] });
      setError(null);
    } catch (err) {
      // Don't show errors for 401/403 if user is not authorized (might be super admin)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError(null);
        return;
      }
      console.error('Failed to load auto-reply settings', err);
      setError('Unable to load auto-reply settings.');
    } finally {
      setLoading(false);
      setSettingsLoading(false);
    }
  }, [token]);

  const refreshTasks = useCallback(
    async (params = {}) => {
      if (!token) return;
      
      // Prevent duplicate simultaneous requests
      if (tasksRequestRef.current) {
        return;
      }
      
      tasksRequestRef.current = true;
      setTasksLoading(true);
      try {
        const response = await api.getAutoReplyTasks(token, { limit: 25, ...params });
        setTasks(response.data || []);
      } catch (err) {
        // Don't show errors for 401/403/429 (unauthorized/rate limited)
        if (err?.response?.status !== 401 && err?.response?.status !== 403 && err?.response?.status !== 429) {
          console.error('Failed to fetch auto-reply tasks', err);
        }
      } finally {
        setTasksLoading(false);
        tasksRequestRef.current = false;
      }
    },
    [token]
  );

  const refreshNewReviews = useCallback(
    async (params = {}) => {
      if (!token) return;
      
      // Prevent duplicate simultaneous requests
      if (newReviewsRequestRef.current) {
        return;
      }
      
      newReviewsRequestRef.current = true;
      setNewReviewsLoading(true);
      try {
        const response = await api.getNewReviews(token, { limit: 25, ...params });
        setNewReviews(response.data || []);
      } catch (err) {
        // Don't show errors for 401/403/429 (unauthorized/rate limited)
        if (err?.response?.status !== 401 && err?.response?.status !== 403 && err?.response?.status !== 429) {
          console.error('Failed to fetch new reviews', err);
        }
      } finally {
        setNewReviewsLoading(false);
        newReviewsRequestRef.current = false;
      }
    },
    [token]
  );

  const refreshStats = useCallback(async () => {
    if (!token) return;

    if (statsRequestRef.current) {
      return;
    }

    statsRequestRef.current = true;
    setStatsLoading(true);
    try {
      const response = await api.getAutoReplyStats(token);
      setStats(response.data || EMPTY_STATS);
    } catch (err) {
      if (err?.response?.status !== 401 && err?.response?.status !== 403 && err?.response?.status !== 429) {
        console.error('Failed to fetch auto-reply stats', err);
      }
    } finally {
      setStatsLoading(false);
      statsRequestRef.current = false;
    }
  }, [token]);

  const refreshRamaReplies = useCallback(
    async (params = {}) => {
      if (!token) return;

      if (ramaRepliesRequestRef.current) {
        return;
      }

      ramaRepliesRequestRef.current = true;
      setRamaRepliesLoading(true);
      try {
        const response = await api.getAutoReplyTasks(token, { limit: 200, status: 'sent', days: 7, ...params });
        setRamaReplies(response.data || []);
      } catch (err) {
        if (err?.response?.status !== 401 && err?.response?.status !== 403 && err?.response?.status !== 429) {
          console.error('Failed to fetch Rama replies', err);
        }
      } finally {
        setRamaRepliesLoading(false);
        ramaRepliesRequestRef.current = false;
      }
    },
    [token]
  );

  const saveSettings = useCallback(
    async (updates) => {
      if (!token) return;
      setSaving(true);
      setSettingsLoading(true);
      try {
        const response = await api.updateAutoReplyConfig(token, updates);
        setSettings(response.data || EMPTY_SETTINGS);
        setError(null);
      } catch (err) {
        // Don't show errors for 401/403 (unauthorized)
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          console.error('Failed to update auto-reply settings', err);
          setError('Unable to update auto-reply settings.');
        }
        throw err;
      } finally {
        setSaving(false);
        setSettingsLoading(false);
      }
    },
    [token]
  );

  const triggerRun = useCallback(async () => {
    if (!token) return;
    setRunning(true);
    try {
      await api.runAutoReplyNow(token);
      // WebSocket will automatically refresh tasks via 'autoReply:run:triggered' event
      // No need to manually call refreshTasks()
    } catch (err) {
      // Don't show errors for 401/403 (unauthorized)
      if (err?.response?.status !== 401 && err?.response?.status !== 403) {
        console.error('Failed to trigger auto-reply run', err);
        setError('Unable to trigger auto-reply run.');
      }
    } finally {
      setRunning(false);
    }
  }, [token]);

  const retryTask = useCallback(
    async (taskId) => {
      if (!token) return;
      try {
        await api.retryAutoReplyTask(token, taskId);
        // WebSocket will automatically refresh tasks via 'autoReply:task:updated' event
        // No need to manually call refreshTasks()
      } catch (err) {
        // Don't show errors for 401/403 (unauthorized)
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          console.error('Failed to retry task', err);
          setError('Unable to retry task.');
        }
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      loadConfig();
      refreshTasks();
      refreshNewReviews();
      refreshRamaReplies();
    } else {
      setSettings(null);
      setStats(EMPTY_STATS);
      setTasks([]);
      setNewReviews([]);
      setRamaReplies([]);
    }
  }, [token, loadConfig, refreshTasks, refreshNewReviews, refreshRamaReplies]);

  // Debounced refresh functions to prevent rapid calls
  const debouncedRefreshTasks = useRef(debounce(() => refreshTasks(), 500)).current;
  const debouncedRefreshNewReviews = useRef(debounce(() => refreshNewReviews(), 500)).current;
  const debouncedRefreshBoth = useRef(debounce(() => {
    refreshTasks();
    refreshNewReviews();
    refreshRamaReplies();
  }, 500)).current;
  const debouncedRefreshStats = useRef(debounce(() => refreshStats(), 500)).current;

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!token) return;

    // Subscribe to settings updates
    const unsubscribeSettings = subscribe('autoReply:settings:updated', (payload) => {
      if (payload.settings) {
        setSettings(payload.settings);
      }
    });

    // Subscribe to config updates (includes stats)
    const unsubscribeConfig = subscribe('autoReply:config:updated', (payload) => {
      if (payload.settings) {
        setSettings(payload.settings);
      }
      if (payload.stats) {
        setStats(payload.stats);
      }
    });

    const handleStatsPayload = (payload) => {
      if (payload?.stats) {
        setStats(payload.stats);
      } else {
        debouncedRefreshStats();
      }
    };

    // Subscribe to stats updates (prefer payload, fallback to manual refresh)
    const unsubscribeStats = subscribe('autoReply:stats:updated', handleStatsPayload);

    const unsubscribeStatsRefresh = subscribe('autoReply:stats:refresh', handleStatsPayload);

    // Subscribe to tasks created (new reviews detected) - debounced
    // This single event handles both tasks and new reviews refresh
    const unsubscribeTasksCreated = subscribe('autoReply:tasks:created', () => {
      debouncedRefreshBoth();
    });

    // Subscribe to task updates - debounced
    // This handles both tasks and new reviews refresh
    const unsubscribeTaskUpdated = subscribe('autoReply:task:updated', () => {
      debouncedRefreshBoth();
    });

    // Subscribe to run triggered - debounced
    const unsubscribeRunTriggered = subscribe('autoReply:run:triggered', () => {
      debouncedRefreshBoth();
    });

    return () => {
      unsubscribeSettings();
      unsubscribeConfig();
      unsubscribeStats();
      unsubscribeStatsRefresh();
      unsubscribeTasksCreated();
      unsubscribeTaskUpdated();
      unsubscribeRunTriggered();
    };
  }, [token, subscribe, debouncedRefreshTasks, debouncedRefreshNewReviews, debouncedRefreshBoth, debouncedRefreshStats]);

  const computedSettings = settings || EMPTY_SETTINGS;
  const settingsReady = !!settings;

  return {
    settings: computedSettings,
    stats,
    tasks,
    newReviews,
    ramaReplies,
    options,
    loading,
    saving,
    running,
    error,
    loadConfig,
    refreshTasks,
    refreshStats,
    refreshNewReviews,
    refreshRamaReplies,
    saveSettings,
    triggerRun,
    retryTask,
    tasksLoading,
    newReviewsLoading,
    ramaRepliesLoading,
    statsLoading,
    settingsLoading,
    settingsReady
  };
};


