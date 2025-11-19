import React, { useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useReviews } from './hooks/useReviews';
import { useFilterAndSort } from './hooks/useFilterAndSort';
import { useAutoReply } from './hooks/useAutoReply';
import Login from './components/Login';
import Header from './components/Header';
import FilterControls from './components/FilterControls';
import LocationTabs from './components/LocationTabs';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import AutoReplyPanel from './components/AutoReplyPanel';

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

  if (!token) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header totalReviews={totalRawReviews} onLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AutoReplyPanel
          settings={autoReply.settings}
          stats={autoReply.stats}
          tasks={autoReply.tasks}
          options={autoReply.options}
          tasksLoading={autoReply.tasksLoading}
          settingsReady={autoReply.settingsReady}
          settingsLoading={autoReply.settingsLoading}
          saving={autoReply.saving}
          running={autoReply.running}
          error={autoReply.error}
          saveSettings={autoReply.saveSettings}
          triggerRun={autoReply.triggerRun}
          retryTask={autoReply.retryTask}
          refreshTasks={autoReply.refreshTasks}
        />

        <FilterControls
          filterStatus={filterStatus}
          sortOrder={sortOrder}
          onFilterChange={setFilterStatus}
          onSortChange={setSortOrder}
        />

        {loading ? (
          <LoadingState />
        ) : visibleReviewsCount === 0 ? (
          <EmptyState onClearFilters={() => setFilterStatus('all')} />
        ) : (
          <LocationTabs
            locations={processedData}
            replyText={replyText}
            sendingReply={sendingReply}
            onReplyTextChange={updateReplyText}
            onReplySubmit={handleReplySubmit}
          />
        )}
      </main>
    </div>
  );
}
