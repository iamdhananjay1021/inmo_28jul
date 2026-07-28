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
  Landmark,
  DollarSign,
  Trash2
} from 'lucide-react';
import { userAPI } from '../../services/api';
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

export const BankWithdraw = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  
  // Search state
  const [searchInput, setSearchInput] = useState('');
  
  // Date filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);const fetchRecords = async () => {
    try {
      setLoading(true);
      
      const response = await userAPI.getBankWithdrawDetails();
      
      if (response.status) {
        setRecords(response.bankWithdrawUserList || []);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Fetch bank withdraw error:', err);
      setRecords([]);
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
      const response = await userAPI.deleteBankWithdrawDetails(ids);
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
      const allIds = new Set(paginatedRecords.map(r => r.id));
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
    
    // Parse date format "30-1-2026" to Date object
    const parts = dateString.split('-');
    if (parts.length !== 3) return true;
    
    const itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
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

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Search filter
      const searchLower = searchInput.toLowerCase();
      const matchesSearch = !searchInput || (
        record.userId?.toLowerCase().includes(searchLower) ||
        record.userName?.toLowerCase().includes(searchLower) ||
        record.mobileNo?.includes(searchInput) ||
        record.bankName?.toLowerCase().includes(searchLower) ||
        record.accountNo?.includes(searchInput) ||
        record.ifcsCode?.toLowerCase().includes(searchLower) ||
        record.agencyName?.toLowerCase().includes(searchLower) ||
        record.adminName?.toLowerCase().includes(searchLower)
      );
      
      // Date filter
      const matchesDate = !dateFilterActive || isDateInRange(record.withdrawDate);
      
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
    const totalBeans = records.reduce((sum, r) => sum + (parseFloat(r.beansAmount) || 0), 0);
    const totalDollars = records.reduce((sum, r) => sum + (parseFloat(r.dollarAmount) || 0), 0);
    return { total: records.length, totalBeans, totalDollars };
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading bank withdraw records...</p>
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
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Landmark className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Bank Withdraw Record</h1>
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
        </button>        </div>

      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.total.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Records</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.totalBeans.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Beans</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400 flex items-center justify-center gap-1">
            <DollarSign className="w-5 h-5" />
            {stats.totalDollars.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400 mt-1">Total Dollars</p>
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
              placeholder="Search by User ID, Name, Mobile, Bank, Account No, IFSC, Agency or Admin..."
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
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginatedRecords.length && paginatedRecords.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                  S.No
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Bank Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Account No
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  IFSC Code
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Beans
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Dollars
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Latest Beans
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Agency
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Withdraw Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="15" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={() => handleSelectRow(record.id)}
                        className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {startIndex + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <CopyableUserId userId={record.userId} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-white">
                        {record.userName || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {record.mobileNo || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-blue-400">
                        {record.bankName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300 font-mono">
                        {record.accountNo || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-purple-400 font-mono">
                        {record.ifcsCode || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {record.branchName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-yellow-400">
                        {parseFloat(record.beansAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-green-400">
                        ${parseFloat(record.dollarAmount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-cyan-400">
                        {parseFloat(record.latestBeans || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {record.agencyName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-orange-400">
                        {record.adminName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {record.withdrawDate || 'N/A'}
                      </span>
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
            </p>
            <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );
};
