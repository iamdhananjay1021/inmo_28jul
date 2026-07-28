import { copyToClipboard } from '../../utils/clipboardUtils';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Radio,
  Ban,
  PowerOff,
  X
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showError, showWarning, showConfirm } from '../../utils/swalUtils';
// Copy to clipboard component
const CopyableUserId = ({ userId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-sm text-purple-400 font-mono hover:text-purple-300 transition-colors group"
      title="Click to copy"
    >
      {userId}
      {copied ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
};

// Ban Reason Modal
const BanReasonModal = ({ isOpen, onClose, onConfirm, userId, loading }) => {
  const [reason, setReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      showWarning('Please enter a ban reason');
      return;
    }
    onConfirm(userId, reason, blockDuration);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Ban User ID</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Ban Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter ban reason..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Block Duration (optional)</label>
            <input
              type="text"
              value={blockDuration}
              onChange={(e) => setBlockDuration(e.target.value)}
              placeholder="e.g., 7 days, 1 month"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Ban User'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const EndUserStream = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  // Search state
  const [searchInput, setSearchInput] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  // Ban modal state
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banningUserId, setBanningUserId] = useState(null);

  // Bulk action states
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set()); const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await userAPI.getLiveStreamingDetails();

      if (response.status) {
        setUsers(response.userLiveList || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!searchInput.trim()) return users;

    const searchLower = searchInput.toLowerCase().trim();
    return users.filter(user => {
      const userId = String(user.userId || '').toLowerCase();
      const name = String(user.name || '').toLowerCase();
      return userId.includes(searchLower) || name.includes(searchLower);
    });
  }, [users, searchInput]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Handle Live End
  const handleLiveEnd = async (user) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to end the live stream for ${user.name} (${user.userId})?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setActionLoading(prev => ({ ...prev, [`${user.userId}-liveend`]: true }));

    try {
      const response = await userAPI.userLiveEnd(user.userId);

      if (response.status) {
        showSuccess(response.message || 'Live stream ended successfully');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to end live stream');
      }
    } catch (err) {
      console.error('Live end error:', err);
      showError('Failed to end live stream. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${user.userId}-liveend`]: false }));
    }
  };

  // Toggle bulk mode
  const handleToggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedUserIds(new Set());
  };

  // Select/deselect individual user
  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  // Select/deselect all visible users
  const handleSelectAll = async () => {
    if (selectedUserIds.size === paginatedUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      const allIds = new Set(paginatedUsers.map(u => u.userId));
      setSelectedUserIds(allIds);
    }
  };

  // Handle bulk live end
  const handleBulkLiveEnd = async () => {
    if (selectedUserIds.size === 0) {
      showWarning('Please select at least one user');
      return;
    }

    const userIds = Array.from(selectedUserIds).join(',');
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to end live streams for ${selectedUserIds.size} user(s)?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setActionLoading(prev => ({ ...prev, 'bulk-liveend': true }));

    try {
      const response = await userAPI.userLiveEnd(userIds);

      if (response.status) {
        showSuccess(response.message || `Live streams ended successfully for ${selectedUserIds.size} user(s)`);
        setSelectedUserIds(new Set());
        setBulkMode(false);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to end live streams');
      }
    } catch (err) {
      console.error('Bulk live end error:', err);
      showError('Failed to end live streams. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, 'bulk-liveend': false }));
    }
  };

  // Handle Ban Click (open modal)
  const handleBanClick = (userId) => {
    setBanningUserId(userId);
    setBanModalOpen(true);
  };

  // Handle Ban Confirm
  const handleBanConfirm = async (userId, reason, blockDuration) => {
    setActionLoading(prev => ({ ...prev, [`${userId}-ban`]: true }));

    try {
      const response = await userAPI.idBan(userId, reason, blockDuration);

      if (response.status) {
        showSuccess(response.message || 'User banned successfully');
        setBanModalOpen(false);
        setBanningUserId(null);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to ban user');
      }
    } catch (err) {
      console.error('Ban error:', err);
      showError('Failed to ban user. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${userId}-ban`]: false }));
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const liveUsers = users.filter(u => u.liveStatus === 'True').length;
    const bannedUsers = users.filter(u => u.isBan === 'Active').length;
    return { total: users.length, live: liveUsers, banned: bannedUsers };
  }, [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading live streaming users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ban Reason Modal */}
      <BanReasonModal
        isOpen={banModalOpen}
        onClose={() => {
          setBanModalOpen(false);
          setBanningUserId(null);
        }}
        onConfirm={handleBanConfirm}
        userId={banningUserId}
        loading={actionLoading[`${banningUserId}-ban`]}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <Radio className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">End User Stream</h1>
            <p className="text-gray-400">Total {users.length.toLocaleString()} users</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <DownloadExcelButton
            data={filteredUsers.map((user, index) => ({ ...user, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'userId', header: 'User ID' },
              { key: 'name', header: 'Name' },
              { key: 'liveStatus', header: 'Live Status' },
              { key: 'isBan', header: 'Ban Status' }
            ]}
            filename={`end_user_stream_${new Date().toISOString().split('T')[0]}.xlsx`}
            options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 }] }}
          />
          <button
            onClick={handleToggleBulkMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${bulkMode
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
          >
            {bulkMode ? '✓ Bulk Mode' : 'Bulk Live End'}
          </button>
          {bulkMode && selectedUserIds.size > 0 && (
            <button
              onClick={handleBulkLiveEnd}
              disabled={actionLoading['bulk-liveend']}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 text-white"
            >
              {actionLoading['bulk-liveend'] ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PowerOff className="w-4 h-4" />
                  End Live ({selectedUserIds.size})
                </>
              )}
            </button>
          )}        </div>

      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.total.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Users</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.live.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Live Users</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.banned.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Banned Users</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by User ID or Name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[#1a1625] sticky top-0 z-10">
              <tr>
                {bulkMode && (
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.size === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Live Status</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ban Status</th>
                {!bulkMode && (
                  <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={bulkMode ? 7 : 6} className="px-6 py-8 text-center text-gray-400">No Records Found</td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => {
                  const isBanned = user.isBan === 'Active';
                  const isLive = user.liveStatus === 'True';

                  return (
                    <motion.tr
                      key={user.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      {bulkMode && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(user.userId)}
                            onChange={() => handleSelectUser(user.userId)}
                            className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">{startIndex + index + 1}</span>
                      </td>
                      <td className="px-4 py-4">
                        <CopyableUserId userId={user.userId} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-white">{user.name || 'No Name'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isLive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                          {isLive ? 'Live' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isBanned
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-green-500/20 text-green-400'
                          }`}>
                          {isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      {!bulkMode && (
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleLiveEnd(user)}
                              disabled={actionLoading[`${user.userId}-liveend`] || !isLive}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading[`${user.userId}-liveend`] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <PowerOff className="w-3 h-3" />
                              )}
                              Live End
                            </button>
                            {/* 
                            {!isBanned && (
                              <button
                                onClick={() => handleBanClick(user.userId)}
                                disabled={actionLoading[`${user.userId}-ban`]}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                              >
                                {actionLoading[`${user.userId}-ban`] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Ban className="w-3 h-3" />
                                )}
                                ID Ban
                              </button>
                            )} */}
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {filteredUsers.length > 0
              ? `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filteredUsers.length)} of ${filteredUsers.length} entries`
              : 'No records to display'
            }
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-4">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
