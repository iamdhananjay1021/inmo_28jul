import { copyToClipboard } from '../../utils/clipboardUtils';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  Power,
  Radio,
  Edit3,
  X
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import MediaPreview from '../../components/MediaPreview';
import { showError, showWarning, showInfo, showConfirm, showSuccess } from '../../utils/swalUtils';

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

// Static placeholder image
const STATIC_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%236b7280"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14"%3EUser%3C/text%3E%3C/svg%3E';

// Edit Rates Modal
const EditRatesModal = ({ isOpen, onClose, user, onSave }) => {
  const [audioRate, setAudioRate] = useState(0);
  const [videoRate, setVideoRate] = useState(0);
  const [loading, setLoading] = useState(false);

  // Auto-fill current values when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setAudioRate(user.audioPricePerMin || 0);
      setVideoRate(user.videoPricePerMin || 0);
    }
  }, [isOpen, user]);

  const handleSubmit = async () => {
    if (audioRate < 0 || videoRate < 0) {
      showError('Rates cannot be negative');
      return;
    }

    setLoading(true);
    await onSave(user.userId, audioRate, videoRate);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass rounded-xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Edit Call Rates</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">User</p>
            <p className="text-white font-medium">{user?.name} ({user?.userId})</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Audio Price Per Minute</label>
              <input
                type="number"
                value={audioRate}
                onChange={(e) => setAudioRate(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Video Price Per Minute</label>
              <input
                type="number"
                value={videoRate}
                onChange={(e) => setVideoRate(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500"
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600/30 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
              Update Rates
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const OnlineAgent = () => {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const [ratesModalOpen, setRatesModalOpen] = useState(false);
  const [selectedUserForRates, setSelectedUserForRates] = useState(null);

  const openPreview = (src, title = 'Image Preview') => {
    if (!src) return;
    setPreviewSrc(src);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  // Search state
  const [searchInput, setSearchInput] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 40, 100, 200, 300, 500];

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getOnlineAgents();
      if (response.Status) {
        const mappedAgents = (response.data || []).map((agent) => ({
          userId: agent.UserId,
          name: agent.Name,
          userImage: agent.Image,
          status: agent.Status,
          audioPricePerMin: agent.AudioPricePerMin || 0,
          videoPricePerMin: agent.VideoPricePerMin || 0,
        }));
        setAgents(mappedAgents);
      } else {
        setAgents([]);
      }
    } catch (err) {
      console.error('Fetch online agents error:', err);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (userId, checked) => {
    setSelectedUsers((prev) => {
      if (checked) return [...new Set([...prev, userId])];
      return prev.filter((id) => id !== userId);
    });
  };

  const selectAllUsers = (checked) => {
    if (checked) {
      const currentPageUserIds = paginatedAgents.map((agent) => agent.userId);
      setSelectedUsers(currentPageUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const openRatesModal = (user) => {
    setSelectedUserForRates(user);
    setRatesModalOpen(true);
  };

  const handleUpdateRates = async (userId, audioRate, videoRate) => {
    setActionLoading(prev => ({ ...prev, [`${userId}-rates`]: true }));

    try {
      const payload = {
        UserId: userId,
        AudioPricePerMin: audioRate,
        ...(videoRate > 0 && { VideoPricePerMin: videoRate })
      };

      const response = await userAPI.updateHostCallRates(payload);

      if (response?.status || response?.Status) {
        showSuccess('Call rates updated successfully!');
        await fetchAgents();
      } else {
        showError(response?.message || 'Failed to update rates');
      }
    } catch (err) {
      console.error('Update rates error:', err);
      showError('Failed to update rates. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${userId}-rates`]: false }));
    }
  };

  // Bulk Go Offline
  const handleBulkGoOffline = async () => {
    if (selectedUsers.length === 0) {
      showWarning('Please select at least one agent to go offline.');
      return;
    }

    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to set ${selectedUsers.length} users offline?`,
      confirmButtonText: 'Yes, Proceed',
    });
    if (!isConfirmed) return;

    setActionLoading((prev) => {
      const next = { ...prev };
      selectedUsers.forEach((id) => { next[id] = true; });
      return next;
    });

    try {
      const usersPayload = selectedUsers.map(userId => ({
        UserId: userId,
        Status: false
      }));

      const response = await userAPI.updateUserIsLiveStatus({ Users: usersPayload });

      showInfo('Selected users are now offline.');
      setSelectedUsers([]);
      await fetchAgents();
    } catch (err) {
      console.error('Bulk go offline error:', err);
      showError('Failed to set users offline. Please try again.');
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        selectedUsers.forEach((id) => { next[id] = false; });
        return next;
      });
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const searchLower = searchInput.toLowerCase();
      return !searchInput || (
        agent.userId?.toLowerCase().includes(searchLower) ||
        agent.name?.toLowerCase().includes(searchLower)
      );
    });
  }, [agents, searchInput]);

  // Pagination
  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + itemsPerPage);

  // Single User Go Offline
  const handleGoOffline = async (agent) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to set ${agent.name} (${agent.userId}) offline?`,
      confirmButtonText: 'Yes, Proceed',
    });
    if (!isConfirmed) return;

    setActionLoading(prev => ({ ...prev, [agent.userId]: true }));

    try {
      const response = await userAPI.updateUserIsLiveStatus({
        UserId: agent.userId,
        Status: false
      });

      showInfo('User Is Offline Now');
      await fetchAgents();
    } catch (err) {
      console.error('Go offline error:', err);
      showError('Failed to set offline. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [agent.userId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading online agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EditRatesModal
        isOpen={ratesModalOpen}
        onClose={() => setRatesModalOpen(false)}
        user={selectedUserForRates}
        onSave={handleUpdateRates}
      />

      <MediaPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={previewSrc}
        title={previewTitle}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <Radio className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Online Agent</h1>
            <p className="text-gray-400">Total {agents.length.toLocaleString()} online agents</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBulkGoOffline}
            disabled={selectedUsers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Power className="w-4 h-4" />
            Bulk Offline ({selectedUsers.length})
          </button>
          <button onClick={fetchAgents} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <DownloadExcelButton
            data={agents.map((agent, index) => ({ ...agent, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'userId', header: 'User ID' },
              { key: 'name', header: 'Name' },
              { key: 'audioPricePerMin', header: 'Audio Price' },
              { key: 'videoPricePerMin', header: 'Video Price' },
              { key: 'status', header: 'Live Status' }
            ]}
            filename={`online_agents_${new Date().toISOString().split('T')[0]}.xlsx`}
          />
        </div>
      </motion.div>

      {/* Stats Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{agents.length.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Online Agents</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by User ID, Name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[#1a1625] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                  <input type="checkbox" checked={selectedUsers.length > 0 && selectedUsers.length === paginatedAgents.length} onChange={(e) => selectAllUsers(e.target.checked)} className="form-checkbox h-4 w-4 text-purple-500" />
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Image</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Audio Price</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Video Price</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Live Status</th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedAgents.length === 0 ? (
                <tr><td colSpan="9" className="px-6 py-8 text-center text-gray-400">No Records Found</td></tr>
              ) : (
                paginatedAgents.map((agent, index) => (
                  <motion.tr key={agent.userId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selectedUsers.includes(agent.userId)} onChange={(e) => selectUser(agent.userId, e.target.checked)} className="form-checkbox h-4 w-4 text-purple-500" />
                    </td>
                    <td className="px-4 py-4"><span className="text-sm text-gray-400">{startIndex + index + 1}</span></td>
                    <td className="px-4 py-4"><CopyableUserId userId={agent.userId} /></td>
                    <td className="px-4 py-4">
                      <img
                        src={agent.userImage || STATIC_IMAGE}
                        alt={agent.name}
                        className={`w-10 h-10 rounded-lg object-cover ${agent.userImage ? 'cursor-pointer' : ''}`}
                        onClick={() => agent.userImage && openPreview(agent.userImage, `${agent.name || 'Agent'} Image`)}
                        onError={(e) => { e.target.src = STATIC_IMAGE; }}
                      />
                    </td>
                    <td className="px-4 py-4"><span className="text-sm font-medium text-white">{agent.name || 'Unknown'}</span></td>
                    <td className="px-4 py-4"><span className="text-sm text-green-400">{agent.audioPricePerMin || 0}</span></td>
                    <td className="px-4 py-4"><span className="text-sm text-blue-400">{agent.videoPricePerMin || 0}</span></td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Live
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openRatesModal(agent)}
                          disabled={actionLoading[`${agent.userId}-rates`]}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg disabled:opacity-50"
                        >
                          {actionLoading[`${agent.userId}-rates`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Edit3 className="w-3 h-3" />} Rates
                        </button>
                        <button
                          onClick={() => handleGoOffline(agent)}
                          disabled={actionLoading[agent.userId] || selectedUsers.includes(agent.userId)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg disabled:opacity-50"
                        >
                          {actionLoading[agent.userId] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />} Offline
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        {filteredAgents.length > 0 && (
          <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAgents.length)} of {filteredAgents.length} entries
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                Rows per page:
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500">
                  {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-4">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};