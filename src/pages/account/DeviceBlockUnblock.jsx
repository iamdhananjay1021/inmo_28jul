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
  Smartphone,
  Lock,
  LockOpen,
  X
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { showSuccess, showError, showConfirm } from '../../utils/swalUtils';
import DownloadExcelButton from '../../components/DownloadExcelButton';

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

// Block Reason Modal
const BlockModal = ({ isOpen, onClose, user, onBlock }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const maxChars = 500;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      showError('Please enter a block reason');
      return;
    }

    setLoading(true);
    await onBlock(user, reason);
    setLoading(false);
    setReason('');
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
            <h3 className="text-xl font-bold text-white">Block Device</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">User</p>
            <p className="text-white font-medium">{user?.name} ({user?.userId})</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Block Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, maxChars))}
              placeholder="Enter reason for blocking..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-red-500 resize-none h-32"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {reason.length}/{maxChars} characters
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !reason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600/30 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Block Device
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const DeviceBlockUnblock = () => {
  const [activeTab, setActiveTab] = useState("unblocked");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const [searchInput, setSearchInput] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 40, 100, 200, 300, 500];

  const [actionLoading, setActionLoading] = useState({});
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedUserForBlock, setSelectedUserForBlock] = useState(null);

  const normalizeUsers = (response) => {
    if (!response?.data) return [];

    const blocked = (response.data.BlockedDevices || []).map(device => ({
      ...device,
      userId: device.UserId,
      name: device.Name,
      deviceId: device.AndroidDeviceId || device.IOSDeviceId || "N/A",
      deviceStatus: true,
    }));

    const unblocked = (response.data.UnBlockedDevices || []).map(device => ({
      ...device,
      userId: device.UserId,
      name: device.Name,
      deviceId: device.AndroidDeviceId || device.IOSDeviceId || "N/A",
      deviceStatus: false,
    }));

    return [...blocked, ...unblocked];
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getDeviceBlockUserDetails();
      if (response?.Status || response?.status) {
        const normalized = normalizeUsers(response);
        setUsers(normalized);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Fetch devices error:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Client-Side Search (Frontend Filtering)
  const filteredUsers = useMemo(() => {
    let result = users;

    // Search Filter
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase();
      result = result.filter((user) =>
        user.userId?.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.deviceId?.toLowerCase().includes(searchLower)
      );
    }

    // Tab Filter
    if (activeTab === "blocked") {
      result = result.filter(user => user.deviceStatus === true);
    } else if (activeTab === "unblocked") {
      result = result.filter(user => user.deviceStatus === false);
    }

    return result;
  }, [users, searchInput, activeTab]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const openBlockModal = (user) => {
    setSelectedUserForBlock(user);
    setBlockModalOpen(true);
  };

  const handleBlockConfirm = async (user, blockReason) => {
    const payload = {
      UserId: user.userId,
      AndroidDeviceId: user.AndroidDeviceId || user.deviceId || "",
      IOSDeviceId: user.IOSDeviceId || "",
      DeviceIdStatus: 0,
      BlockReason: blockReason
    };

    setActionLoading(prev => ({ ...prev, [`${user.userId}-block`]: true }));

    try {
      const res = await userAPI.userDeviceIdBlockUnBlock(payload);
      if (res?.status || res?.Status) {
        showSuccess('Device Blocked Successfully');
        await fetchUsers();
      } else {
        showError(res?.message || 'Failed to block device');
      }
    } catch (err) {
      console.error('Block error:', err);
      showError('Failed to block device. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${user.userId}-block`]: false }));
    }
  };

  const handleUnblock = async (user) => {
    const { isConfirmed } = await showConfirm({
      title: 'Unblock Device?',
      text: `Do you want to unblock this device for User ID: ${user.userId}?`,
      confirmButtonText: 'Yes, Unblock',
    });
    if (!isConfirmed) return;

    const payload = {
      UserId: user.userId,
      DeviceIdStatus: 1
    };

    setActionLoading(prev => ({ ...prev, [`${user.userId}-unblock`]: true }));

    try {
      const res = await userAPI.userDeviceIdBlockUnBlock(payload);
      if (res?.status || res?.Status) {
        showSuccess('Device Unblocked Successfully');
        await fetchUsers();
      } else {
        showError(res?.message || 'Failed to unblock device');
      }
    } catch (err) {
      showError('Failed to unblock device. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${user.userId}-unblock`]: false }));
    }
  };

  const stats = useMemo(() => {
    const blocked = users.filter(u => u.deviceStatus === true).length;
    const unblocked = users.length - blocked;
    return { blocked, unblocked, total: users.length };
  }, [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading device details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BlockModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        user={selectedUserForBlock}
        onBlock={handleBlockConfirm}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Smartphone className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Device ID Block / Unblock</h1>
            <p className="text-gray-400">Total {users.length.toLocaleString()} device records</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <DownloadExcelButton
            data={users.map((user, index) => ({ ...user, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'userId', header: 'User ID' },
              { key: 'name', header: 'Name' },
              { key: 'deviceId', header: 'Device ID' },
              { key: 'deviceStatus', header: 'Status', formatter: (v) => v ? 'Blocked' : 'Unblocked' }
            ]}
            filename={`device_block_unblock_${new Date().toISOString().split('T')[0]}.xlsx`}
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
          <p className="text-sm text-gray-400 mt-1">Total Devices</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.blocked}</p>
          <p className="text-sm text-gray-400 mt-1">Blocked</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.unblocked}</p>
          <p className="text-sm text-gray-400 mt-1">Unblocked</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
        <div className="glass rounded-xl p-1 inline-flex items-center gap-1 w-fit">
          <button
            onClick={() => { setActiveTab("unblocked"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "unblocked" ? "bg-green-600 text-white shadow-lg" : "text-gray-400 hover:bg-white/5"}`}
          >
            <LockOpen className="w-4 h-4" /> Unblocked <span className="px-1.5 py-0.5 text-xs rounded-full bg-black/20">{stats.unblocked}</span>
          </button>
          <button
            onClick={() => { setActiveTab("blocked"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "blocked" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:bg-white/5"}`}
          >
            <Lock className="w-4 h-4" /> Blocked <span className="px-1.5 py-0.5 text-xs rounded-full bg-black/20">{stats.blocked}</span>
          </button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by User ID, Name or Device ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[#1a1625] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Device ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No Records Found</td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => {
                  const isBlocked = user.deviceStatus === true;
                  return (
                    <motion.tr key={`${user.userId}-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-400">{startIndex + index + 1}</td>
                      <td className="px-4 py-4"><CopyableUserId userId={user.userId} /></td>
                      <td className="px-4 py-4 text-sm font-medium text-white">{user.name || 'Unknown'}</td>
                      <td className="px-4 py-4 text-sm text-blue-400 font-mono">{user.deviceId || 'N/A'}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          {isBlocked ? <><Lock className="w-3 h-3" /> Blocked</> : <><LockOpen className="w-3 h-3" /> Unblocked</>}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openBlockModal(user)}
                            disabled={isBlocked || actionLoading[`${user.userId}-block`]}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600/30 rounded-lg text-white text-sm"
                          >
                            {actionLoading[`${user.userId}-block`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                            Block
                          </button>
                          <button
                            onClick={() => handleUnblock(user)}
                            disabled={!isBlocked || actionLoading[`${user.userId}-unblock`]}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600/30 rounded-lg text-white text-sm"
                          >
                            {actionLoading[`${user.userId}-unblock`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <LockOpen className="w-3 h-3" />}
                            Unblock
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                Rows per page:
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
                >
                  {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-4">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};