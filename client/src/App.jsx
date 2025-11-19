import React, { useCallback, lazy, Suspense, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useReviews } from './hooks/useReviews';
import { useFilterAndSort } from './hooks/useFilterAndSort';
import { useAutoReply } from './hooks/useAutoReply';
import Login from './components/Login';
import Header from './components/Header';
import FilterControls from './components/FilterControls';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';

// Lazy load heavy components for better initial load
const LocationTabs = lazy(() => import('./components/LocationTabs'));
const AutoReplyPanel = lazy(() => import('./components/AutoReplyPanel'));

export default function App() {
  const { token, logout } = useAuth();
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);
  
  const { loading, data, replyText, sendingReply, handleReplySubmit, updateReplyText } = useReviews(token, handleLogout);
  const autoReply = useAutoReply(token);
  
  const {
    filterStatus,
    sortOrder,
    processedData,
    visibleReviewsCount,
    totalRawReviews,
    setFilterStatus,
    setSortOrder
  } = useFilterAndSort(data);

  const handleClearFilters = useCallback(() => {
    setFilterStatus('all');
  }, [setFilterStatus]);

  // Memoize auto-reply props to prevent unnecessary re-renders
  const autoReplyProps = useMemo(() => ({
    settings: autoReply.settings,
    stats: autoReply.stats,
    tasks: autoReply.tasks,
    options: autoReply.options,
    tasksLoading: autoReply.tasksLoading,
    settingsReady: autoReply.settingsReady,
    settingsLoading: autoReply.settingsLoading,
    saving: autoReply.saving,
    running: autoReply.running,
    error: autoReply.error,
    saveSettings: autoReply.saveSettings,
    triggerRun: autoReply.triggerRun,
    retryTask: autoReply.retryTask,
    refreshTasks: autoReply.refreshTasks
  }), [
    autoReply.settings,
    autoReply.stats,
    autoReply.tasks,
    autoReply.options,
    autoReply.tasksLoading,
    autoReply.settingsReady,
    autoReply.settingsLoading,
    autoReply.saving,
    autoReply.running,
    autoReply.error,
    autoReply.saveSettings,
    autoReply.triggerRun,
    autoReply.retryTask,
    autoReply.refreshTasks
  ]);

  if (!token) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header totalReviews={totalRawReviews} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <Suspense fallback={<LoadingState />}>
          <AutoReplyPanel {...autoReplyProps} />
        </Suspense>

        <FilterControls
          filterStatus={filterStatus}
          sortOrder={sortOrder}
          onFilterChange={setFilterStatus}
          onSortChange={setSortOrder}
        />

        {loading ? (
          <LoadingState />
        ) : visibleReviewsCount === 0 ? (
          <EmptyState onClearFilters={handleClearFilters} />
        ) : (
          <Suspense fallback={<LoadingState />}>
            <LocationTabs
              locations={processedData}
              replyText={replyText}
              sendingReply={sendingReply}
              onReplyTextChange={updateReplyText}
              onReplySubmit={handleReplySubmit}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}
