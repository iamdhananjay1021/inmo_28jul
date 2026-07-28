import { copyToClipboard } from '../../utils/clipboardUtils';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Wallet,
  DollarSign,
  Trash2
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { showSuccess, showError, showWarning, showConfirm } from '../../utils/swalUtils';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%239333ea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E👤%3C/text%3E%3C/svg%3E';

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

export const WalletWithdraw = () => {
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [recordsCount, setRecordsCount] = useState(0);
  // Search state
  const [searchInput, setSearchInput] = useState('');

  // Date filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 40, 100, 200, 300, 500];
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [actionLoading, setActionLoading] = useState(false);


  const fetchRecords = async () => {
    try {
      setLoading(true);

      const response = await userAPI.getWalletWithdrawDetails();

      if (response.Status === true || response.status === true) {
        setRecords(response.data || []);
        setRecordsCount(response.Count || response.count || 0);
      } else {
        setRecords([]);
        setRecordsCount(0);
      }
    } catch (err) {
      console.error('Fetch wallet withdraw error:', err);
      setRecords([]);
      setRecordsCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (ids) => {
    setActionLoading(true);
    try {
      const response = await userAPI.deleteWalletWithdrawDetails(ids);
      if (response.status) {
        showSuccess(response.message || 'Record deleted successfully');
        setSelectedIds(new Set());
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to delete record');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showError('Failed to delete record. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectRow = (recordId) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(recordId)) {
      newSelectedIds.delete(recordId);
    } else {
      newSelectedIds.add(recordId);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedRecords.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(paginatedRecords.map(r => r.Id));
      setSelectedIds(allIds);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      showWarning('Please select records to delete');
      return;
    }

    const { isConfirmed } = await showConfirm({ title: 'Confirm Delete', text: `Are you sure you want to delete ${selectedIds.size} record(s)?`, confirmButtonText: 'Yes, Delete', variant: 'danger' });
    if (confirmed) {
      await handleDelete(Array.from(selectedIds));
    }
  };
  // Check if date is in range
  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    const itemDate = new Date(dateString);

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

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Search filter
      const searchLower = searchInput.toLowerCase();
      const matchesSearch =
        !searchInput ||
        record.UserId?.toLowerCase().includes(searchLower) ||
        record.Name?.toLowerCase().includes(searchLower) ||
        record.WalletNo?.toLowerCase().includes(searchLower) ||
        record.WalletType?.toLowerCase().includes(searchLower);

      // Date filter
      const matchesDate = !dateFilterActive || isDateInRange(record.Created_Date);

      return matchesSearch && matchesDate;
    });
  }, [records, searchInput, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

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

  // Calculate stats
  const stats = useMemo(() => {
    const totalBeans = records.reduce(
      (sum, r) => sum + Number(r.BeansAmount || 0),
      0
    );

    return {
      total: records.length,
      totalBeans,
    };
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading wallet withdraw records...</p>
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
          <div className="p-3 bg-orange-500/20 rounded-lg">
            <Wallet className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Wallet Withdraw Record</h1>
            <p className="text-gray-400">Total {records.length.toLocaleString()} records</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={fetchRecords}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{recordsCount.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Records</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {records.reduce((sum, r) => sum + Number(r.BeansAmount || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Total Beans</p>
        </div>
      </motion.div>

      {/* Search and Filter */}
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
              placeholder="Search by User ID, Name, Mobile, Wallet Name, Wallet No, Wallet Type, Agency or Admin..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
            />
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
          {/* Delete Button */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={actionLoading}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedIds.size})
                </>
              )}
            </button>
          )}
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
                <th className="px-4 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      paginatedRecords.length > 0 &&
                      selectedIds.size === paginatedRecords.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  S.No
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  User ID
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  User
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Wallet No
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Wallet Type
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Beans
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Withdraw Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record, index) => (
                  <motion.tr
                    key={record.Id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.Id)}
                        onChange={() => handleSelectRow(record.Id)}
                        className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </td>

                    <td className="px-4 py-4 text-gray-300">
                      {startIndex + index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <CopyableUserId userId={record.UserId} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() =>
                            setPreviewImage(
                              record.ProfileImage ||
                              DEFAULT_AVATAR
                            )
                          }
                          className="w-11 h-11 rounded-full overflow-hidden border border-white/20 bg-gray-800 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        >
                          <img
                            src={
                              record.ProfileImage ||
                              DEFAULT_AVATAR
                            }
                            alt={record.ProfileImage || "User"}
                            className="w-full h-full object-cover"
                          // onError={(e) => {
                          //   e.currentTarget.onerror = null;
                          //   e.currentTarget.src = DEFAULT_AVATAR;
                          // }}
                          />
                        </div>
                        {/* <img
                          src={record.ProfileImage}
                          alt={record.Name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-700"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/40?text=User";
                          }}
                        /> */}
                        <span className="text-white font-medium">
                          {record.Name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-300">
                      {record.WalletNo || "-"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                        {record.WalletType || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-yellow-400 font-semibold">
                      {Number(record.BeansAmount || 0).toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-gray-400">
                      {record.Created_Date
                        ? new Date(record.Created_Date).toLocaleString("en-IN")
                        : "-"}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <p className="text-sm text-gray-400">
              Showing {filteredRecords.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-400">
              Rows per page:
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400 px-4">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white text-3xl hover:text-red-400"
            >
              ✕
            </button>

            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/600x400?text=No+Image";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
