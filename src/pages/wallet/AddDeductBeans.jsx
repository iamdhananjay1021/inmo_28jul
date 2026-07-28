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
  Plus,
  Minus,
  Bean, Calendar
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import MediaPreview from '../../components/MediaPreview';
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

const getInitialDates = () => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  return {
    from: formatDate(sevenDaysAgo),
    to: formatDate(today)
  };
};

export const AddDeductBeans = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const openPreview = (src, title = 'Image Preview') => {
    if (!src) return;
    setPreviewSrc(src);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const isSearchActive = searchInput.trim().length > 0;
  const [showReasonPopup, setShowReasonPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState("");
  const [reason, setReason] = useState('');
  // Date filter states (Default to last 1 week)
  const initialDates = useMemo(() => getInitialDates(), []);
  const [fromDate, setFromDate] = useState(initialDates.from);
  const [toDate, setToDate] = useState(initialDates.to);
  const [dateFilterActive, setDateFilterActive] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    const itemDate = new Date(dateString);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    itemDate.setHours(0, 0, 0, 0);
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(0, 0, 0, 0);

    if (from && to) {
      return itemDate >= from && itemDate <= to;
    } else if (from) {
      return itemDate >= from;
    } else if (to) {
      return itemDate <= to;
    }
    return true;
  };

  const filteredBeans = useMemo(() => {
    return users.filter(user => {
      // Date filter
      const matchesDate = !dateFilterActive || isDateInRange(user.dateTime);
      // Reason filter: only include Beans transactions unless searching
      const reasonText = (user.reasonOfEntry || user.ReasonOfEntry || user.reason || '').toLowerCase();
      const matchesBeansReason = isSearchActive || !reasonText || reasonText.includes('beans');
      return matchesDate && matchesBeansReason;
    });
  }, [users, dateFilterActive, fromDate, toDate, isSearchActive]);

  // Pagination
  const totalPages = Math.ceil(filteredBeans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredBeans.slice(startIndex, startIndex + itemsPerPage);

  const handleDateFilter = () => {
    setDateFilterActive(!!fromDate || !!toDate);
    fetchUsers(fromDate, toDate);
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setDateFilterActive(false);
    fetchUsers('', '');
    setCurrentPage(1);
  };
  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  // Amount input states for each row
  const [amountInputs, setAmountInputs] = useState({});
  const fetchUsers = async (fDate = fromDate, tDate = toDate) => {
    try {
      setLoading(true);
      const payload = {};
      if (fDate) payload.FromDate = fDate;
      if (tDate) payload.ToDate = tDate;

      const response = await userAPI.getCoinsAndBeansTransactions(payload);
      const isSuccess = response && (response.Status || response.status);

      if (isSuccess) {
        const rawList = response.data || response.Data || [];
        const mapped = rawList
          .filter(u => {
            const r = (u.ReasonOfEntry || u.reasonOfEntry || u.reason || '').toLowerCase();
            return !r || r.includes('beans');
          })
          .map((u, idx) => ({
            ...u,
            id: u.Id || u.id || idx,
            userId: u.UserId || u.userId,
            name: u.UserName || u.userName || u.Name || u.name || 'User',
            image: u.ProfilePhoto || u.profilePhoto || u.image || u.Image,
            availableBeans: u.UpdatedBeans !== undefined ? u.UpdatedBeans : (u.availableBeans !== undefined ? u.availableBeans : (u.beans || 0)),
            availableAmount: u.UpdatedBeans !== undefined ? u.UpdatedBeans : (u.availableBeans !== undefined ? u.availableBeans : (u.beans || 0)),
            reasonOfEntry: u.ReasonOfEntry || u.reason || '-',
            dateTime: u.Created_Date || u.created_date || u.dateTime,
          }));
        setUsers(mapped);
      } else {
        const fallback = await userAPI.getAddDeductBeansUserDetails();
        setUsers(fallback.addDeductCoinList || fallback.data || []);
      }
    } catch (err) {
      console.error('Fetch beans transactions error:', err);
      try {
        const fallback = await userAPI.getAddDeductBeansUserDetails();
        setUsers(fallback.addDeductCoinList || fallback.data || []);
      } catch (e) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(fromDate, toDate);
  }, []);

  // Search with API - same as Add/Deduct Coins
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      fetchUsers();
      return;
    }

    setIsSearching(true);
    try {
      const response = await userAPI.getAllUsersSearch(searchInput);
      const isSuccess = response.status || response.Status;
      if (isSuccess) {
        const listKey = Object.keys(response).find(key => Array.isArray(response[key]));
        const rawList = listKey ? response[listKey] : (response.data || response.Data || []);
        
        const mapped = rawList.map(u => ({
          ...u,
          userId: u.userId || u.UserId || u.id || u.Id,
          name: u.name || u.Name || u.userName || u.UserName || 'Unknown',
          image: u.image || u.Image || u.imagePreview || u.ImagePreview || u.profileImage || u.ProfileImage,
          availableCoins: u.availableCoins !== undefined ? u.availableCoins : (u.latestCoins !== undefined ? u.latestCoins : (u.coins !== undefined ? u.coins : u.availableAmount)),
          availableAmount: u.availableAmount !== undefined ? u.availableAmount : (u.availableCoins !== undefined ? u.availableCoins : (u.latestCoins !== undefined ? u.latestCoins : u.coins)),
          beans: u.beans !== undefined ? u.beans : (u.latestBeans !== undefined ? u.latestBeans : u.availableBeans),
        }));
        setUsers(mapped);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim()) {
        handleSearch();
      } else {
        fetchUsers(fromDate, toDate);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle amount input change
  const handleAmountChange = (userId, value) => {
    setAmountInputs(prev => ({ ...prev, [userId]: value }));
  };

  const handleAddBeans = async (user, reasonText) => {
    const userId = user.userId;
    const beanAmount = amountInputs[userId];

    if (!beanAmount || parseFloat(beanAmount) <= 0) {
      showWarning('Please enter a valid amount');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`${userId}-add`]: true }));

    try {
      const response = await userAPI.sendCoinsBeansToUser(
        userId,
        beanAmount,
        "Beans",
        "Credit"
      );

      const isSuccess = response.status || response.Status;
      if (isSuccess) {
        showSuccess(response.message || response.Message || 'Beans added successfully!');
        setAmountInputs(prev => ({ ...prev, [userId]: '' }));
        fetchUsers();
      } else {
        showError(response.message || response.Message || 'Failed to add beans');
      }
    } catch (err) {
      console.error('Add beans error:', err);
      showError('Failed to add beans. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${userId}-add`]: false }));
    }
  };

  const handleDeductBeans = async (user, reasonText) => {
    const userId = user.userId;
    const beanAmount = amountInputs[userId];

    if (!beanAmount || parseFloat(beanAmount) <= 0) {
      showWarning('Please enter a valid amount');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`${userId}-deduct`]: true }));

    try {
      const response = await userAPI.sendCoinsBeansToUser(
        userId,
        beanAmount,
        "Beans",
        "Debit"
      );

      const isSuccess = response.status || response.Status;
      if (isSuccess) {
        showSuccess(response.message || response.Message || 'Beans deducted successfully!');
        setAmountInputs(prev => ({ ...prev, [userId]: '' }));
        fetchUsers();
      } else {
        showError(response.message || response.Message || 'Failed to deduct beans');
      }
    } catch (err) {
      console.error('Deduct beans error:', err);
      showError('Failed to deduct beans. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${userId}-deduct`]: false }));
    }
  };

  const handleReasonConfirm = async () => {
    if (!reason.trim()) {
      showWarning('Please enter reason');
      return;
    }

    if (!selectedUser) return;

    const beanAmount = amountInputs[selectedUser.userId];
    const { isConfirmed } = await showConfirm({
      title: actionType === "add" ? 'Add Beans?' : 'Deduct Beans?',
      text: actionType === "add"
        ? `Are you sure you want to add ${beanAmount} beans to ${selectedUser.name || selectedUser.userId}?`
        : `Are you sure you want to deduct ${beanAmount} beans from ${selectedUser.name || selectedUser.userId}?`,
      confirmButtonText: actionType === "add" ? 'Yes, Add Beans' : 'Yes, Deduct',
      icon: actionType === "add" ? 'question' : 'warning',
    });

    if (!isConfirmed) return;

    setShowReasonPopup(false);

    if (actionType === "add") {
      await handleAddBeans(selectedUser, reason);
    } else {
      await handleDeductBeans(selectedUser, reason);
    }

    setReason("");
    setSelectedUser(null);
  };

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <Bean className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Add / Deduct Beans</h1>
            <p className="text-gray-400">Total {users.length.toLocaleString()} user records</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <DownloadExcelButton
          data={users.map((user, index) => ({ ...user, serialNumber: index + 1 }))}
          columns={[
            { key: 'serialNumber', header: 'S.No' },
            { key: 'userId', header: 'User ID' },
            { key: 'name', header: 'Name' },
            { key: 'availableAmount', header: 'Available Beans' },
            { key: 'transactionType', header: 'Transaction Type' },
            { key: 'dateTime', header: 'Date & Time' },
            { key: 'reasonOfEntry', header: 'Reason' },
          ]}
          filename={`add_deduct_beans_${new Date().toISOString().split('T')[0]}.xlsx`}
          options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 20 }, { wch: 18 }] }}
        />
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>        </div>

      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by User ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />
            )}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 w-[130px]"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 w-[130px]"
            />
            <button
              onClick={handleDateFilter}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white transition-colors"
            >
              Filter
            </button>
            {dateFilterActive && (
              <button
                onClick={clearDateFilter}
                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
              >
                Clear
              </button>
            )}
          </div>
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
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                  S.No
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Available Beans
                </th>
                {/* <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Transaction Type
                </th> */}
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <motion.tr
                    key={`${user.userId}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {startIndex + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <img
                        src={user.image || '/assets/default-avatar.png'}
                        alt={user.name || 'User'}
                        className={`w-10 h-10 rounded-lg object-cover border border-purple-500/30 ${user.image ? 'cursor-pointer' : ''}`}
                        onClick={() => user.image && openPreview(user.image, `${user.name || 'User'} Image`)}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%239333ea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E👤%3C/text%3E%3C/svg%3E'; }}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <CopyableUserId userId={user.userId} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-white">
                        {user.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-green-400 font-medium">
                        {(user.UpdatedBeans !== undefined ? user.UpdatedBeans : (user.availableAmount || user.BeansBalance || 0)).toLocaleString()}
                      </span>
                    </td>
                    {/* <td className="px-4 py-4">
                      <span className="text-sm text-white-400">
                        {(user.transactionType || "-")}
                      </span>
                    </td> */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-white-400">
                        {(user.dateTime || user.Created_Date || "-")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-white-400">
                        {(user.reasonOfEntry || user.reason || "-")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        placeholder="Enter bean amount"
                        value={amountInputs[user.userId] || ''}
                        onChange={(e) => handleAmountChange(user.userId, e.target.value)}
                        className="w-32 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 placeholder:text-gray-600"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("add");
                            setReason("");
                            setShowReasonPopup(true);
                          }}
                          disabled={
                            actionLoading[`${user.userId}-add`] ||
                            !amountInputs[user.userId]
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600/30 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors"
                        >
                          {actionLoading[`${user.userId}-add`] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          Add
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("deduct");
                            setReason("");
                            setShowReasonPopup(true);
                          }}
                          disabled={
                            actionLoading[`${user.userId}-deduct`] ||
                            !amountInputs[user.userId]
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600/30 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors"
                        >
                          {actionLoading[`${user.userId}-deduct`] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          Deduct
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, users.length)} of {users.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-4">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {showReasonPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1625] p-6 shadow-2xl border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">
              {actionType === "add" ? "Add Beans" : "Deduct Beans"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Reason
                </label>

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReasonPopup(false);
                    setReason("");
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={handleReasonConfirm}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MediaPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={previewSrc}
        title={previewTitle}
      />
    </div>
  );
};
