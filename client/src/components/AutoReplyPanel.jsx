import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Loader2,
  RefreshCcw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Send,
  BarChart3
} from 'lucide-react';
import { AUTO_REPLY_DELAY_OPTIONS, AUTO_REPLY_TONES } from '../utils/constants';

const statusStyles = {
  detected: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-sky-100 text-sky-700',
  sent: 'bg-emerald-100 text-emerald-700',
  generation_failed: 'bg-red-100 text-red-700',
  delivery_failed: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-600'
};

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString();
};

const statsCards = (stats) => {
  const failed =
    stats.failedTotal !== undefined
      ? stats.failedTotal
      : (stats.totals?.generation_failed || 0) + (stats.totals?.delivery_failed || 0);

  return [
    { label: 'Pending', value: stats.totals?.detected || 0, icon: Clock },
    { label: 'Scheduled', value: stats.totals?.scheduled || 0, icon: Clock },
    { label: 'Sent', value: stats.totals?.sent || 0, icon: Send },
    { label: 'Sent (7d)', value: stats.sentLast7d || 0, icon: CheckCircle },
    { label: 'Failed', value: failed, icon: AlertTriangle },
    { label: 'Total Sent', value: stats.sentAllTime || 0, icon: BarChart3 }
  ];
};

const formatDelayLabel = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  const hours = minutes / 60;
  return `${hours} hour${hours === 1 ? '' : 's'}`;
};

const formatReviewSnippet = (text) => {
  if (!text) return 'No review text';
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 90) return normalized;
  return `${normalized.slice(0, 90)}…`;
};

const TASK_TABS = [
  { id: 'new', label: 'New Review' },
  { id: 'queue', label: 'Queue' },
  { id: 'sent', label: 'AI Replies' },
  { id: 'all', label: 'Show All' }
];

const TAB_REFRESH_COOLDOWN_MS = 8000;

export default function AutoReplyPanel({
  settings,
  stats,
  tasks,
  newReviews,
  options,
  tasksLoading,
  newReviewsLoading,
  saving,
  running,
  error,
  saveSettings,
  triggerRun,
  retryTask,
  refreshTasks,
  refreshNewReviews,
  refreshStats,
  settingsReady,
  settingsLoading,
  statsLoading
}) {
  const { delayMinutes = [], tones = [] } = options || {};
  const delayOptions = useMemo(
    () => (delayMinutes.length ? delayMinutes : AUTO_REPLY_DELAY_OPTIONS),
    [delayMinutes]
  );
  const toneOptions = useMemo(() => (tones.length ? tones : AUTO_REPLY_TONES), [tones]);
  const delayOptionItems = useMemo(
    () => delayOptions.map((option) => ({ value: option, label: formatDelayLabel(option) })),
    [delayOptions]
  );
  const toneOptionItems = useMemo(
    () =>
      toneOptions.map((tone) => ({
        value: tone,
        label: tone.charAt(0).toUpperCase() + tone.slice(1)
      })),
    [toneOptions]
  );
  const [taskTab, setTaskTab] = useState('new');
  const refreshMetaRef = useRef({ new: 0, queue: 0, sent: 0, all: 0 });

  const cards = useMemo(() => statsCards(stats), [stats]);
  const currentTaskFilter = useMemo(() => {
    if (taskTab === 'sent') return { status: 'sent' };
    if (taskTab === 'queue' || taskTab === 'all') return {};
    return null; // 'new' view uses newReviews
  }, [taskTab]);

  const isNewView = taskTab === 'new';
  const taskTabDescription = useMemo(() => {
    switch (taskTab) {
      case 'new':
        return 'Showing newly detected reviews in the last 24 hours.';
      case 'sent':
        return 'Showing replies successfully posted.';
      case 'all':
        return 'Showing all tracked auto-reply tasks.';
      default:
        return 'Monitoring the active queue.';
    }
  }, [taskTab]);

  const filteredTasks = useMemo(() => {
    if (taskTab === 'queue') {
      return tasks.filter((task) => task.status !== 'sent');
    }
    if (taskTab === 'sent') {
      return tasks.filter((task) => task.status === 'sent');
    }
    return tasks;
  }, [tasks, taskTab]);

  const activeListMeta = useMemo(() => {
    const list = isNewView ? newReviews : filteredTasks;
    const loading = isNewView ? newReviewsLoading : tasksLoading;
    return {
      list,
      loading,
      showInitialLoader: loading && list.length === 0
    };
  }, [filteredTasks, isNewView, newReviews, newReviewsLoading, tasksLoading]);

  const { list: activeList, loading: activeListLoading, showInitialLoader } = activeListMeta;
  const manualRefreshDisabled = activeListLoading;

  useEffect(() => {
    if (!settingsReady) return;

    const now = Date.now();
    const lastFetch = refreshMetaRef.current[taskTab] || 0;
    if (now - lastFetch < TAB_REFRESH_COOLDOWN_MS) {
      return;
    }
    refreshMetaRef.current[taskTab] = now;

    if (isNewView) {
      refreshNewReviews();
    } else {
      refreshTasks(currentTaskFilter || {});
    }
  }, [taskTab, settingsReady, isNewView, currentTaskFilter, refreshNewReviews, refreshTasks]);

  const handleToggle = useCallback(
    async (field, value) => {
      try {
        await saveSettings({ [field]: value });
      } catch {
        // Parent hook surfaces errors in UI; suppress console noise.
      }
    },
    [saveSettings]
  );

  const handleSelectChange = useCallback(
    async (field, event) => {
      const value = field === 'delayMinutes' ? Number(event.target.value) : event.target.value;
      try {
        await saveSettings({ [field]: value });
      } catch {
        // Parent hook surfaces errors in UI; suppress console noise.
      }
    },
    [saveSettings]
  );

  // Polling interval removed - WebSocket now handles real-time updates

  const handleManualRefresh = useCallback(() => {
    if (manualRefreshDisabled) return;

    refreshMetaRef.current[taskTab] = Date.now();
    if (isNewView) {
      refreshNewReviews();
    } else {
      refreshTasks(currentTaskFilter || {});
    }
  }, [manualRefreshDisabled, taskTab, isNewView, refreshNewReviews, refreshTasks, currentTaskFilter]);

  const handleRunNow = useCallback(async () => {
    await triggerRun();
  }, [triggerRun]);

  const handleRetry = useCallback(
    async (taskId) => {
      await retryTask(taskId);
    },
    [retryTask]
  );

  const isSettingsSyncing = settingsLoading;
  const controlsDisabled = saving || isSettingsSyncing;

  if (!settingsReady) {
    return (
      <section className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="animate-spin text-gray-500" size={16} />
          Syncing auto-reply preferences...
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Auto-Reply Assistant</h2>
          <p className="text-sm text-gray-500">
            Detect new reviews, draft human replies with GPT, and respond automatically after a delay.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                settings.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {settings.enabled ? 'Auto Reply Active' : 'Auto Reply Paused'}
            </span>
            {isSettingsSyncing && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Loader2 className="animate-spin" size={12} /> updating…
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {settings.enabled ? (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600">
              <Play size={12} className="text-green-500" />
              Auto-reply runs continuously. No manual action needed.
            </div>
          ) : (
            <button
              onClick={handleRunNow}
              disabled={running}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {running ? <Loader2 className="animate-spin" size={16} /> : <Play size={14} />}
              Run Now
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Auto-Reply Status</span>
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-2 text-xs text-gray-500">{settings.enabled ? 'ON' : 'OFF'}</span>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleToggle('enabled', e.target.checked)}
                className="sr-only"
                disabled={controlsDisabled}
              />
              <span className={`w-10 h-5 flex items-center bg-gray-200 rounded-full p-1 ${settings.enabled ? 'bg-gray-500' : ''}`}>
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
                    settings.enabled ? 'translate-x-5' : ''
                  }`}
                ></span>
              </span>
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-500">Reply Delay</label>
            <select
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              value={settings.delayMinutes}
              onChange={(e) => handleSelectChange('delayMinutes', e)}
              disabled={controlsDisabled}
            >
              {delayOptionItems.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-500">Tone</label>
            <select
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              value={settings.tone}
              onChange={(e) => handleSelectChange('tone', e)}
              disabled={controlsDisabled}
            >
              {toneOptionItems.map((tone) => (
                <option key={tone.value} value={tone.value}>
                  {tone.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {['respondToPositive', 'respondToNeutral', 'respondToNegative'].map((field) => (
              <button
                key={field}
                onClick={() => handleToggle(field, !settings[field])}
                disabled={controlsDisabled}
                className={`text-xs py-2 rounded-lg border ${
                  settings[field]
                    ? 'bg-gray-50 border-gray-200 text-gray-700'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                {field.replace('respondTo', '')}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 ">
            <p className="text-sm font-semibold text-gray-600">Realtime Stats</p>
            <button
              onClick={refreshStats}
              disabled={statsLoading}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw size={11} className={statsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
            {cards.map((card, index) => (
              <div
                key={card.label}
                className="px-3 py-2.5 rounded-lg border border-transparent bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
              >
                <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-semibold uppercase tracking-wide">
                  <card.icon size={12} className="text-gray-400" />
                  <span className="truncate">{card.label}</span>
                </div>
                <div className="mt-1.5 flex items-end justify-between">
                  <span className="text-xl font-semibold text-gray-900">
                    {statsLoading ? <Loader2 size={16} className="animate-spin text-gray-400" /> : card.value}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border border-gray-100 rounded-xl">
            <div className="bg-gray-50 px-3 py-2.5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-gray-700">Recent Auto-Replies</p>
                <p className="text-xs text-gray-500">{taskTabDescription}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-white border border-gray-200 rounded-full p-1">
                  {TASK_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTaskTab(tab.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        taskTab === tab.id ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleManualRefresh}
                  className="hidden sm:flex items-center gap-1 text-xs text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={manualRefreshDisabled}
                >
                  <RefreshCcw size={12} /> Refresh
                </button>
              </div>
            </div>
            {showInitialLoader ? (
              <div className="flex items-center justify-center py-5 text-sm text-gray-500">
                <Loader2 className="animate-spin mr-2" size={16} />
                Loading auto-reply data...
              </div>
            ) : activeList.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                {isNewView ? 'No new reviews found in the last 24 hours.' : 'No auto-reply activity yet.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {activeList.map((task) => (
                  <div key={task._id} className="px-3 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{task.reviewerName}</p>
                        <p className="text-xs text-gray-500">{task.locationName}</p>
                      </div>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                          statusStyles[task.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">{formatReviewSnippet(task.comment)}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Scheduled: {formatDate(task.scheduledFor)}</span>
                      <div className="flex gap-2">
                        {task.status === 'generation_failed' && (
                          <button className="text-gray-600" onClick={() => handleRetry(task._id)}>
                            Retry Draft
                          </button>
                        )}
                        {task.status === 'delivery_failed' && (
                          <button className="text-gray-600" onClick={() => handleRetry(task._id)}>
                            Retry Send
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(saving || running) && (
        <div className="text-xs text-gray-400 mt-4 flex items-center gap-2">
          <Loader2 className="animate-spin" size={12} />
          Updating auto-reply service...
        </div>
      )}
    </section>
  );
}
