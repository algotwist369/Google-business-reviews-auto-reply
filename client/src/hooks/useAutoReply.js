import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const EMPTY_SETTINGS = {
  enabled: true,
  delayMinutes: 15,
  tone: 'friendly',
  respondToPositive: true,
  respondToNeutral: true,
  respondToNegative: true
};

export const useAutoReply = (token) => {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({ totals: {}, sentLast7d: 0 });
  const [tasks, setTasks] = useState([]);
  const [options, setOptions] = useState({ delayMinutes: [], tones: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setSettingsLoading(true);
    try {
      const response = await api.getAutoReplyConfig(token);
      const payload = response || {};
      setSettings(payload.data?.settings || EMPTY_SETTINGS);
      setStats(payload.data?.stats || { totals: {}, sentLast7d: 0 });
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
      setTasksLoading(true);
      try {
        const response = await api.getAutoReplyTasks(token, { limit: 25, ...params });
        setTasks(response.data || []);
      } catch (err) {
        // Don't show errors for 401/403 (unauthorized)
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          console.error('Failed to fetch auto-reply tasks', err);
        }
      } finally {
        setTasksLoading(false);
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
      await refreshTasks();
    } catch (err) {
      // Don't show errors for 401/403 (unauthorized)
      if (err?.response?.status !== 401 && err?.response?.status !== 403) {
        console.error('Failed to trigger auto-reply run', err);
        setError('Unable to trigger auto-reply run.');
      }
    } finally {
      setRunning(false);
    }
  }, [token, refreshTasks]);

  const retryTask = useCallback(
    async (taskId) => {
      if (!token) return;
      try {
        await api.retryAutoReplyTask(token, taskId);
        await refreshTasks();
      } catch (err) {
        // Don't show errors for 401/403 (unauthorized)
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          console.error('Failed to retry task', err);
          setError('Unable to retry task.');
        }
      }
    },
    [token, refreshTasks]
  );

  useEffect(() => {
    if (token) {
      loadConfig();
      refreshTasks();
    } else {
      setSettings(null);
      setStats({ totals: {}, sentLast7d: 0 });
      setTasks([]);
    }
  }, [token, loadConfig, refreshTasks]);

  const computedSettings = settings || EMPTY_SETTINGS;
  const settingsReady = !!settings;

  return {
    settings: computedSettings,
    stats,
    tasks,
    options,
    loading,
    saving,
    running,
    error,
    loadConfig,
    refreshTasks,
    saveSettings,
    triggerRun,
    retryTask,
    tasksLoading,
    settingsLoading,
    settingsReady
  };
};


