import React, { useState, useCallback, memo } from 'react';
import { 
  Users, TrendingUp, MessageSquare, CheckCircle, Clock, Search,
  Play, Pause, Crown, Building2, Calendar, DollarSign, Filter
} from 'lucide-react';

const SuperAdminDashboard = memo(function SuperAdminDashboard({
  stats,
  businesses,
  selectedBusiness,
  loading,
  businessesLoading,
  pagination,
  filters,
  enableTrial,
  disableTrial,
  updateFilters,
  changePage,
  loadBusinessDetails,
  setSelectedBusiness
}) {
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [selectedBusinessForTrial, setSelectedBusinessForTrial] = useState(null);
  const [trialDays, setTrialDays] = useState(14);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleEnableTrial = useCallback(async (business) => {
    setSelectedBusinessForTrial(business);
    setShowTrialModal(true);
  }, []);

  const confirmEnableTrial = useCallback(async () => {
    if (!selectedBusinessForTrial) return;
    try {
      await enableTrial(selectedBusinessForTrial._id, trialDays);
      setShowTrialModal(false);
      setSelectedBusinessForTrial(null);
      setTrialDays(14);
    } catch {
      // Error handled in hook
    }
  }, [selectedBusinessForTrial, trialDays, enableTrial]);

  const handleViewDetails = useCallback(async (business) => {
    try {
      await loadBusinessDetails(business._id);
      setShowDetailsModal(true);
    } catch {
      // Error handled in hook
    }
  }, [loadBusinessDetails]);

  const getTrialStatusBadge = (trial) => {
    if (!trial || !trial.enabled) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">No Trial</span>;
    }
    const status = trial.status;
    const colors = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      converted: 'bg-blue-100 text-blue-700',
      not_started: 'bg-gray-100 text-gray-600'
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors.not_started}`}>{status}</span>;
  };

  const getSubscriptionBadge = (subscription) => {
    const plan = subscription?.plan || 'free';
    const status = subscription?.status || 'active';
    const planColors = {
      trial: 'bg-purple-100 text-purple-700',
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      pro: 'bg-indigo-100 text-indigo-700',
      enterprise: 'bg-yellow-100 text-yellow-700'
    };
    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs rounded-full ${planColors[plan] || planColors.free}`}>{plan}</span>
        <span className={`px-2 py-1 text-xs rounded-full ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{status}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Businesses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overview?.totalBusinesses || 0}</p>
              </div>
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Trials</p>
                <p className="text-2xl font-bold text-green-600">{stats.overview?.activeTrials || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reviews</p>
                <p className="text-2xl font-bold text-blue-600">{stats.overview?.totalReviews || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Replies</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.overview?.totalReplies || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Auto-Reply</p>
                <p className="text-2xl font-bold text-purple-600">{stats.overview?.activeAutoReply || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recent Signups</p>
                <p className="text-2xl font-bold text-orange-600">{stats.overview?.recentSignups || 0}</p>
              </div>
              <Users className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filters.trialStatus}
            onChange={(e) => updateFilters({ ...filters, trialStatus: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="all">All Trial Status</option>
            <option value="not_started">Not Started</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="converted">Converted</option>
          </select>
          <select
            value={filters.subscriptionStatus}
            onChange={(e) => updateFilters({ ...filters, subscriptionStatus: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="all">All Subscription</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Business</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trial</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subscription</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stats</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {businessesLoading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No businesses found</td>
                </tr>
              ) : (
                businesses.map((business) => (
                  <tr key={business._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{business.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{business.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Joined: {new Date(business.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getTrialStatusBadge(business.trial)}
                      {business.trial?.enabled && business.trial?.endDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(business.trial.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getSubscriptionBadge(business.subscription)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p>Reviews: {business.stats?.reviews || 0}</p>
                        <p>Replies: {business.stats?.sentReplies || 0}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(business)}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          View
                        </button>
                        {!business.trial?.enabled ? (
                          <button
                            onClick={() => handleEnableTrial(business)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                          >
                            <Play size={12} /> Trial
                          </button>
                        ) : (
                          <button
                            onClick={() => disableTrial(business._id)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                          >
                            <Pause size={12} /> Disable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => changePage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => changePage(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trial Modal */}
      {showTrialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Enable Trial</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Trial Days</label>
              <input
                type="number"
                min="1"
                max="365"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value) || 14)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTrialModal(false);
                  setSelectedBusinessForTrial(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnableTrial}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
              >
                Enable Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Business Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBusiness(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{selectedBusiness.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedBusiness.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{selectedBusiness.role || 'user'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Trial Status</p>
                {getTrialStatusBadge(selectedBusiness.trial)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Subscription</p>
                {getSubscriptionBadge(selectedBusiness.subscription)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Auto-Reply Enabled</p>
                <p className="font-medium">{selectedBusiness.autoReplySettings?.enabled ? 'Yes' : 'No'}</p>
              </div>
            </div>
            {selectedBusiness.stats && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Reviews</p>
                    <p className="text-xl font-bold">{selectedBusiness.stats.totalReviews || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Tasks</p>
                    <p className="text-xl font-bold">{selectedBusiness.stats.totalTasks || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sent Replies</p>
                    <p className="text-xl font-bold">{selectedBusiness.stats.sentReplies || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-xl font-bold">{selectedBusiness.stats.pendingTasks || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Failed</p>
                    <p className="text-xl font-bold">{selectedBusiness.stats.failedTasks || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

SuperAdminDashboard.displayName = 'SuperAdminDashboard';

export default SuperAdminDashboard;

