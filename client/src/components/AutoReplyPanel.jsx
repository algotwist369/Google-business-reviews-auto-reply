import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, RefreshCcw, Clock, CheckCircle, AlertTriangle, Play } from 'lucide-react';
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

const statsCards = (stats) => [
  { label: 'Pending', value: stats.totals?.detected || 0, icon: Clock },
  { label: 'Scheduled', value: stats.totals?.scheduled || 0, icon: Clock },
  { label: 'Sent (7d)', value: stats.sentLast7d || 0, icon: CheckCircle },
  {
    label: 'Failed',
    value: (stats.totals?.generation_failed || 0) + (stats.totals?.delivery_failed || 0),
    icon: AlertTriangle
  }
];

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

const TASK_TABS = [
  { id: 'queue', label: 'Queue' },
  { id: 'sent', label: 'AI Replies' }
];

export default function AutoReplyPanel({
  settings,
  stats,
  tasks,
  options,
  tasksLoading,
  saving,
  running,
  error,
  saveSettings,
  triggerRun,
  retryTask,
  refreshTasks,
  settingsReady,
  settingsLoading
}) {
  const delayOptions = options?.delayMinutes?.length ? options.delayMinutes : AUTO_REPLY_DELAY_OPTIONS;
  const toneOptions = options?.tones?.length ? options.tones : AUTO_REPLY_TONES;
  const [taskTab, setTaskTab] = useState('queue');

  const currentTaskFilter = useMemo(() => (taskTab === 'sent' ? { status: 'sent' } : {}), [taskTab]);

  useEffect(() => {
    if (!settingsReady) return;
    refreshTasks(currentTaskFilter);
  }, [taskTab, refreshTasks, currentTaskFilter, settingsReady]);

  const handleToggle = async (field, value) => {
    try {
      await saveSettings({ [field]: value });
    } catch (err) {
      console.error('Failed to toggle auto-reply setting', err);
    }
  };

  const handleSelectChange = async (field, event) => {
    const value = field === 'delayMinutes' ? Number(event.target.value) : event.target.value;
    try {
      await saveSettings({ [field]: value });
    } catch (err) {
      console.error('Failed to update auto-reply select option', err);
    }
  };

  useEffect(() => {
    if (!settingsReady || !settings.enabled) return;
    const intervalId = setInterval(() => {
      refreshTasks(currentTaskFilter);
    }, 8000);
    return () => clearInterval(intervalId);
  }, [settingsReady, settings.enabled, refreshTasks, currentTaskFilter]);

  const formatReviewSnippet = (text) => {
    if (!text) return 'No review text';
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= 90) return normalized;
    return `${normalized.slice(0, 90)}…`;
  };

  const handleManualRefresh = () => {
    refreshTasks(currentTaskFilter);
  };

  const handleRunNow = async () => {
    await triggerRun();
    refreshTasks(currentTaskFilter);
  };

  const handleRetry = async (taskId) => {
    await retryTask(taskId);
    refreshTasks(currentTaskFilter);
  };

  const isTaskListLoading = tasksLoading && tasks.length === 0;
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
          <button
            onClick={handleRunNow}
            disabled={running || !settings.enabled}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {running ? <Loader2 className="animate-spin" size={16} /> : <Play size={14} />}
            Run Now
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
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
              disabled={!settings.enabled || controlsDisabled}
            >
              {delayOptions.map((option) => (
                <option key={option} value={option}>
                  {formatDelayLabel(option)}
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
              disabled={!settings.enabled || controlsDisabled}
            >
              {toneOptions.map((tone) => (
                <option key={tone} value={tone}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['respondToPositive', 'respondToNeutral', 'respondToNegative'].map((field) => (
              <button
                key={field}
                onClick={() => handleToggle(field, !settings[field])}
                disabled={!settings.enabled || controlsDisabled}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {statsCards(stats).map((card) => (
              <div key={card.label} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
                  <card.icon size={14} />
                  {card.label}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Recent Auto-Replies</p>
                <p className="text-xs text-gray-500">
                  {taskTab === 'sent' ? 'Showing replies successfully posted.' : 'Monitoring last 25 detected reviews.'}
                </p>
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
                  className="hidden sm:flex items-center gap-1 text-xs text-gray-600 hover:text-gray-700"
                  disabled={tasksLoading}
                >
                  <RefreshCcw size={12} /> Refresh
                </button>
              </div>
            </div>
            {isTaskListLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                <Loader2 className="animate-spin mr-2" size={16} />
                Loading auto-reply data...
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No auto-reply activity yet.</div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task._id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
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
