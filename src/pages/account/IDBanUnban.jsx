import { copyToClipboard } from '../../utils/clipboardUtils';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  ShieldX,
  X
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showError, showWarning } from '../../utils/swalUtils';

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

// Ban Modal Component
const BanModal = ({ isOpen, onClose, user, onBan }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const duration = user?.blockDuration || '';
  const maxChars = 500;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      showWarning('Please enter a ban reason');
      return;
    }

    setLoading(true);
    await onBan(user.userId, reason, duration);
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
            <h3 className="text-xl font-bold text-white">Ban User ID</h3>
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
              Reason for ID Ban <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, maxChars))}
              placeholder="Enter ban reason..."
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
              Ban Now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const IDBanUnban = () => {
  const [activeTab, setActiveTab] = useState("unban");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 40, 100, 200, 300, 500];

  const [actionLoading, setActionLoading] = useState({});
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const normalizeUsers = (response) => {
    if (!response?.data) return [];

    const parseDateTime = (user) => {
      const dateTimeStr = (user.BlockDateTime || user.blockDateTime || user.BlockDate || user.blockDate || '').trim();
      if (!dateTimeStr) return { blockDate: 'N/A', blockTime: 'N/A' };
      const parts = dateTimeStr.split(' ');
      const blockDate = user.BlockDate || user.blockDate || parts[0] || 'N/A';
      const blockTime = user.BlockTime || user.blockTime || (parts.length > 1 ? parts.slice(1).join(' ') : 'N/A');
      return { blockDate, blockTime };
    };

    const banned = (response.data.BannedUsers || []).map(user => {
      const { blockDate, blockTime } = parseDateTime(user);
      return {
        ...user,
        userId: user.UserId || user.userId,
        name: user.Name || user.name,
        mobile: user.Mobile || user.MobileNumber || user.mobile,
        status: "Active",
        blockReason: user.BanReason || user.BlockReason || user.blockReason || user.block_Reason || 'N/A',
        blockDate,
        blockTime,
        blockCount: user.BlockCount ?? user.blockCount ?? user.Count ?? (user.BlockStatus !== undefined ? user.BlockStatus : 1),
        blockDuration: user.BanDuration || user.BlockDuration || user.blockDuration || 'Permanent',
      };
    });

    const unbanned = (response.data.UnBannedUsers || []).map(user => {
      const { blockDate, blockTime } = parseDateTime(user);
      return {
        ...user,
        userId: user.UserId || user.userId,
        name: user.Name || user.name,
        mobile: user.Mobile || user.MobileNumber || user.mobile,
        status: "Inactive",
        blockReason: user.BanReason || user.BlockReason || user.blockReason || user.block_Reason || 'N/A',
        blockDate,
        blockTime,
        blockCount: user.BlockCount ?? user.blockCount ?? user.Count ?? 0,
        blockDuration: user.BanDuration || user.BlockDuration || user.blockDuration || 'N/A',
      };
    });

    return [...banned, ...unbanned];
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getIDBanUnbanUserDetails();
      if (response?.Status) {
        const normalized = normalizeUsers(response);
        setUsers(normalized);
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

  // Client-Side Search (Frontend Filtering)
  const filteredUsers = useMemo(() => {
    let result = users;

    // Search Filter
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase();
      result = result.filter((user) =>
        user.userId?.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.mobile?.toLowerCase().includes(searchLower) ||
        user.blockReason?.toLowerCase().includes(searchLower)
      );
    }

    // Tab Filter
    if (activeTab === "unban") {
      result = result.filter(user => user.status === "Inactive");
    } else if (activeTab === "ban") {
      result = result.filter(user => user.status === "Active");
    }

    // Date Filter
    if (dateFilterActive) {
      result = result.filter((user) =>
        isDateInRange(user.blockDate || user.BlockDate)
      );
    }

    return result;
  }, [users, searchInput, activeTab, dateFilterActive, fromDate, toDate]);

  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    const parts = dateString.split('-');
    if (parts.length !== 3) return true;

    const itemDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    itemDate.setHours(0, 0, 0, 0);
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(0, 0, 0, 0);

    if (from && to) return itemDate >= from && itemDate <= to;
    if (from) return itemDate >= from;
    if (to) return itemDate <= to;
    return true;
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleDateFilter = () => {
    setDateFilterActive(!!fromDate || !!toDate);
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setDateFilterActive(false);
    setCurrentPage(1);
  };

  const handleBanClick = (user) => {
    setSelectedUser(user);
    setBanModalOpen(true);
  };

  // Corrected Ban Function
  const handleBanConfirm = async (userID, idBanReason, blockDuration) => {
    setActionLoading(prev => ({ ...prev, [`${userID}-ban`]: true }));

    const payload = {
      UserId: userID,
      BlockStatus: 1,
      BanDuration: blockDuration || "Permanent",
      BanReason: idBanReason
    };

    try {
      const response = await userAPI.BanUnBanUsers(payload);
      if (response?.status || response?.Status) {
        showSuccess('User banned successfully!');
        await fetchUsers();
      } else {
        showError(response?.message || 'Failed to ban user');
      }
    } catch (err) {
      showError('Failed to ban user. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${userID}-ban`]: false }));
    }
  };

  // Corrected Unban Function
  const handleUnban = async (user) => {
    const userID = user.userId;
    setActionLoading(prev => ({ ...prev, [`${userID}-unban`]: true }));

    const payload = {
      UserId: userID,
      BlockStatus: 0
    };

    try {
      const response = await userAPI.BanUnBanUsers(payload);
      if (response?.status || response?.Status) {
        showSuccess('User UnBanned successfully!');
        await fetchUsers();
      } else {
        showError(response?.message || 'Failed to unban user');
      }
    } catch (err) {
      showError('Failed to unban user. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${userID}-unban`]: false }));
    }
  };

  const handleDurationChange = (event, user) => {
    const newDuration = event.target.value;
    setUsers(prev =>
      prev.map(u => u.userId === user.userId ? { ...u, blockDuration: newDuration } : u)
    );
  };

  const stats = useMemo(() => {
    const banned = users.filter(u => u.status === 'Active').length;
    const active = users.filter(u => u.status === 'Inactive').length;
    return { banned, active, total: users.length };
  }, [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BanModal
        isOpen={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        user={selectedUser}
        onBan={handleBanConfirm}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-3 bg-orange-500/20 rounded-lg">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">ID Ban / Unban</h1>
            <p className="text-gray-400">Total {users.length.toLocaleString()} user records</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>

          <DownloadExcelButton
            data={users.map((user, index) => ({ ...user, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'userId', header: 'User ID' },
              { key: 'name', header: 'Name' },
              { key: 'mobile', header: 'Mobile' },
              { key: 'status', header: 'Status' },
              { key: 'blockCount', header: 'Block Count' },
              { key: 'blockDate', header: 'Block Date' },
              { key: 'blockTime', header: 'Block Time' },
              { key: 'blockReason', header: 'ID Ban Reason' },
              { key: 'blockDuration', header: 'Block Duration' }
            ]}
            filename={`id_ban_unban_${new Date().toISOString().split('T')[0]}.xlsx`}
          />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.total.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Users</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.active.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Active Users</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.banned.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Banned Users</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
        <div className="glass rounded-xl p-1 inline-flex items-center gap-1 w-fit">
          <button onClick={() => { setActiveTab("unban"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "unban" ? "bg-green-600 text-white shadow-lg" : "text-gray-400 hover:bg-white/5"}`}>
            <ShieldCheck className="w-4 h-4" /> Active <span className="px-1.5 py-0.5 text-xs rounded-full bg-black/20">{stats.active}</span>
          </button>
          <button onClick={() => { setActiveTab("ban"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "ban" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:bg-white/5"}`}>
            <ShieldX className="w-4 h-4" /> Banned <span className="px-1.5 py-0.5 text-xs rounded-full bg-black/20">{stats.banned}</span>
          </button>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by User ID, Name, Mobile or Reason..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 w-[130px]" />
            <span className="text-gray-400">-</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 w-[130px]" />
            <button onClick={handleDateFilter} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white">Filter</button>
            {dateFilterActive && <button onClick={clearDateFilter} className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm">Clear</button>}
          </div>
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
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Mobile</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Block Count</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Block Date</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Block Time</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID Ban Reason</th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">Block Duration</th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.length === 0 ? (
                <tr><td colSpan="11" className="px-6 py-8 text-center text-gray-400">No Records Found</td></tr>
              ) : (
                paginatedUsers.map((user, index) => {
                  const isBanned = user.status === 'Active';
                  return (
                    <motion.tr key={user.userId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4"><span className="text-sm text-gray-400">{startIndex + index + 1}</span></td>
                      <td className="px-4 py-4"><CopyableUserId userId={user.userId} /></td>
                      <td className="px-4 py-4"><span className="text-sm font-medium text-white">{user.name || 'Unknown'}</span></td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-300">{user.mobile || 'N/A'}</span></td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isBanned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          {isBanned ? <><ShieldX className="w-3 h-3" /> Banned</> : <><ShieldCheck className="w-3 h-3" /> Active</>}
                        </span>
                      </td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-300">{user.blockCount || '0'}</span></td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-400">{user.blockDate || 'N/A'}</span></td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-300">{user.blockTime || 'N/A'}</span></td>
                      <td className="px-4 py-4"><span className="text-sm text-orange-400">{user.blockReason || 'N/A'}</span></td>

                      <td className="px-4 py-4">
                        <select value={user.blockDuration || ""} onChange={(e) => handleDurationChange(e, user)} className="p-2 rounded bg-slate-900 text-white w-full">
                          <option value="" disabled>Select Duration</option>
                          <option value="1 Hour">1 Hour</option>
                          <option value="10 Hours">10 Hours</option>
                          <option value="1 Day">1 Day</option>
                          <option value="7 Days">7 Days</option>
                          <option value="15 Days">15 Days</option>
                          <option value="30 Days">30 Days</option>
                          <option value="Permanent">Permanent</option>
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          {activeTab === "unban" ? (
                            <button onClick={() => handleBanClick(user)} disabled={actionLoading[`${user.userId}-ban`]} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white disabled:opacity-50">
                              {actionLoading[`${user.userId}-ban`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldX className="w-3 h-3" />} Ban
                            </button>
                          ) : (
                            <button onClick={() => handleUnban(user)} disabled={actionLoading[`${user.userId}-unban`]} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-white disabled:opacity-50">
                              {actionLoading[`${user.userId}-unban`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />} Unban
                            </button>
                          )}
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
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500">
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