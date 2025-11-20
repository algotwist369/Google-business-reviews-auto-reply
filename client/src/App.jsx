import React, { useState, useCallback, useEffect, lazy, Suspense, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useReviews } from './hooks/useReviews';
import { useFilterAndSort } from './hooks/useFilterAndSort';
import { useAutoReply } from './hooks/useAutoReply';
import { useSuperAdmin } from './hooks/useSuperAdmin';
import Login from './components/Login';
import Header from './components/Header';
import FilterControls from './components/FilterControls';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import { api } from './services/api';
// Lazy load heavy components for better initial load
const LocationTabs = lazy(() => import('./components/LocationTabs'));
const AutoReplyPanel = lazy(() => import('./components/AutoReplyPanel'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const SubscriptionPanel = lazy(() => import('./components/SubscriptionPanel'));

export default function App() {
  const { token, user, loading: authLoading, logout, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize tab based on role - will be updated when user loads
    return 'admin';
  });
  const [syncingReviews, setSyncingReviews] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [trialInfo, setTrialInfo] = useState(null);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const trialDismissKey = user?._id ? `trial-modal-${user._id}` : null;

  const openProfilePanel = useCallback(() => setProfilePanelOpen(true), []);
  const closeProfilePanel = useCallback(() => setProfilePanelOpen(false), []);

  const handleDismissTrialModal = useCallback(() => {
    if (trialDismissKey) {
      localStorage.setItem(trialDismissKey, 'dismissed');
    }
    setShowTrialModal(false);
  }, [trialDismissKey]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Only load user-side hooks if not super admin OR if super admin is on user tab
  const shouldLoadUserFeatures = !isSuperAdmin || activeTab === 'user';
  const {
    loading,
    data,
    replyText,
    sendingReply,
    generatingReply,
    handleReplySubmit,
    updateReplyText,
    handleGenerateReply,
    fetchReviews
  } = useReviews(shouldLoadUserFeatures ? token : null, handleLogout);
  const autoReply = useAutoReply(shouldLoadUserFeatures ? token : null);

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
    newReviews: autoReply.newReviews,
    options: autoReply.options,
    tasksLoading: autoReply.tasksLoading,
    newReviewsLoading: autoReply.newReviewsLoading,
    settingsReady: autoReply.settingsReady,
    settingsLoading: autoReply.settingsLoading,
    statsLoading: autoReply.statsLoading,
    saving: autoReply.saving,
    running: autoReply.running,
    error: autoReply.error,
    saveSettings: autoReply.saveSettings,
    triggerRun: autoReply.triggerRun,
    retryTask: autoReply.retryTask,
    refreshTasks: autoReply.refreshTasks,
    refreshNewReviews: autoReply.refreshNewReviews,
    refreshStats: autoReply.refreshStats
  }), [
    autoReply.settings,
    autoReply.stats,
    autoReply.tasks,
    autoReply.newReviews,
    autoReply.options,
    autoReply.tasksLoading,
    autoReply.newReviewsLoading,
    autoReply.settingsReady,
    autoReply.settingsLoading,
    autoReply.statsLoading,
    autoReply.saving,
    autoReply.running,
    autoReply.error,
    autoReply.saveSettings,
    autoReply.triggerRun,
    autoReply.retryTask,
    autoReply.refreshTasks,
    autoReply.refreshNewReviews,
    autoReply.refreshStats
  ]);

  // Super admin hook - only load if user is super admin
  const superAdmin = useSuperAdmin(isSuperAdmin ? token : null);

  const handleSyncReviews = useCallback(async () => {
    if (!fetchReviews || syncingReviews) return;
    setSyncingReviews(true);
    try {
      await fetchReviews();
    } finally {
      setSyncingReviews(false);
    }
  }, [fetchReviews, syncingReviews]);

  useEffect(() => {
    if (!token || !shouldLoadUserFeatures) return;

    let cancelled = false;
    const loadSubscriptionStatus = async () => {
      try {
        const response = await api.getSubscriptionStatus(token);
        if (cancelled) return;
        const subscription = response.data?.subscription || null;
        const trial = response.data?.trial || null;
        setSubscriptionStatus(subscription);
        setTrialInfo(trial);

        const hasActiveTrial = trial?.status === 'active' && trial?.endDate;
        if (hasActiveTrial && trialDismissKey && !localStorage.getItem(trialDismissKey)) {
          setShowTrialModal(true);
        }
      } catch (err) {
        console.error('Failed to load subscription status', err);
      }
    };

    loadSubscriptionStatus();
    return () => {
      cancelled = true;
    };
  }, [token, shouldLoadUserFeatures, trialDismissKey]);

  const renderReviewWorkspace = useCallback(() => {
    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="inline-flex rounded-full border border-gray-200 bg-white shadow-sm px-4 py-1.5 text-xs sm:text-sm font-semibold text-gray-700">
            All Reviews
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncReviews}
              disabled={syncingReviews || loading}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncingReviews ? 'Syncing…' : 'Sync Reviews'}
            </button>
          </div>
        </div>
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
              generatingReply={generatingReply}
              onReplyTextChange={updateReplyText}
              onReplySubmit={handleReplySubmit}
              onGenerateReply={handleGenerateReply}
            />
          </Suspense>
        )}
      </>
    );
  }, [
    handleSyncReviews,
    syncingReviews,
    loading,
    filterStatus,
    sortOrder,
    setFilterStatus,
    setSortOrder,
    visibleReviewsCount,
    processedData,
    replyText,
    sendingReply,
    generatingReply,
    updateReplyText,
    handleGenerateReply,
    handleReplySubmit,
    handleClearFilters
  ]);

  const getTrialDaysRemaining = useCallback(() => {
    if (!trialInfo || trialInfo.status !== 'active' || !trialInfo.endDate) return 0;
    const endDate = new Date(trialInfo.endDate);
    const now = new Date();
    const diff = endDate - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [trialInfo]);

  if (!token) {
    return <Login />;
  }

  if (authLoading) {
    return <LoadingState />;
  }

  // Show super admin dashboard for super admins with tab switcher
  const mainContent = isSuperAdmin ? (
    <div className="min-h-screen bg-gray-50">
      <Header
        totalReviews={activeTab === 'user' ? totalRawReviews : 0}
        onLogout={handleLogout}
        onOpenProfile={openProfilePanel}
      />

      {/* Tab Switcher for Super Admin */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${activeTab === 'admin'
                  ? 'border-gray-600 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Super Admin
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${activeTab === 'user'
                  ? 'border-gray-600 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              My Reviews
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {activeTab === 'admin' ? (
          <Suspense fallback={<LoadingState />}>
            <SuperAdminDashboard {...superAdmin} />
          </Suspense>
        ) : (
          <>
            <Suspense fallback={<LoadingState />}>
              <AutoReplyPanel {...autoReplyProps} />
            </Suspense>

            {renderReviewWorkspace()}
          </>
        )}
      </main>
    </div>
  ) : (
    <div className="min-h-screen bg-gray-50">
      <Header totalReviews={totalRawReviews} onLogout={handleLogout} onOpenProfile={openProfilePanel} />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <Suspense fallback={<LoadingState />}>
          <AutoReplyPanel {...autoReplyProps} />
        </Suspense>
        {renderReviewWorkspace()}
      </main>
    </div>
  );

  const trialDaysRemaining = getTrialDaysRemaining();

  return (
    <>
      {mainContent}
      {showTrialModal && trialInfo && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-center border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Your Free Trial is Live</h3>
            <p className="text-sm text-gray-600">
              You have <span className="font-semibold text-gray-600">{trialDaysRemaining}</span> day
              {trialDaysRemaining !== 1 ? 's' : ''} left on your free tier. Unlock unlimited auto replies and priority
              support by choosing a plan now.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
                onClick={handleDismissTrialModal}
              >
                Remind me later
              </button>
              <button
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-gray-600 text-white hover:bg-gray-700"
                onClick={() => {
                  handleDismissTrialModal();
                  openProfilePanel();
                }}
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}

      {profilePanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="absolute inset-0" onClick={closeProfilePanel} />
          <div className="relative w-full max-w-3xl h-full bg-white shadow-2xl border-l border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Profile & Billing</p>
                <h3 className="text-lg font-semibold text-gray-900">{user?.name || 'Your account'}</h3>
              </div>
              <button
                onClick={closeProfilePanel}
                className="text-gray-500 hover:text-gray-900 text-sm font-medium px-3 py-1 rounded-md hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-500">Signed in as</p>
                <p className="text-base font-semibold text-gray-900 break-words">{user?.email}</p>
              </div>

              <Suspense fallback={<LoadingState />}>
                <SubscriptionPanel token={token} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
