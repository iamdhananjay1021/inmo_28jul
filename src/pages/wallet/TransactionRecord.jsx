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
  Coins,
  Bean,
  FileText
} from 'lucide-react';
import { userAPI } from '../../services/api';
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

export const TransactionRecord = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Date filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userAPI.getTransactionalRecords(searchTerm);

      const isSuccess = response.status || response.Status;
      if (isSuccess) {
        setTransactions(response.data || []);
      } else {
        setError(response.message || response.Message || 'Failed to fetch transaction records');
      }
    } catch (err) {
      console.error('Fetch transaction records error:', err);
      setError('Failed to load transaction records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [searchTerm]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

    if (from && to) {
      return itemDate >= from && itemDate <= to;
    } else if (from) {
      return itemDate >= from;
    } else if (to) {
      return itemDate <= to;
    }
    return true;
  };

  // Filter transactions by date locally
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      return !dateFilterActive || isDateInRange(t.Created_Date || t.createdDate);
    });
  }, [transactions, dateFilterActive, fromDate, toDate]);

  // Calculate totals for summary cards
  const totals = useMemo(() => {
    return {
      totalRecords: filteredTransactions.length,
      totalCoins: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.UpdatedCoins || t.updatedCoins) || 0), 0),
      totalBeans: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.UpdatedBeans || t.updatedBeans) || 0), 0),
      totalMinus: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.AnyAmountMinus || t.anyAmountMinus) || 0), 0),
    };
  }, [filteredTransactions]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

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

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading transaction records...</p>
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
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Transaction Records</h1>
            <p className="text-gray-400">Total {filteredTransactions.length.toLocaleString()} transaction entries</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DownloadExcelButton
            data={filteredTransactions.map((t, index) => ({ ...t, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'UserId', header: 'User ID' },
              { key: 'UpdatedCoins', header: 'Coins Balance' },
              { key: 'UpdatedBeans', header: 'Beans Balance' },
              { key: 'ReasonOfEntry', header: 'Reason of Entry' },
              { key: 'AnyAmountMinus', header: 'Deducted Amount' },
              { key: 'Created_Date', header: 'Date' }
            ]}
            filename={`transaction_records_${new Date().toISOString().split('T')[0]}.xlsx`}
            options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 45 }, { wch: 18 }, { wch: 22 }] }}
          />
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{totals.totalRecords.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Records</p>
        </div>
        {/* <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{totals.totalCoins.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Sum of Coins Balance</p>
        </div> */}
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{totals.totalBeans.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Sum of Beans Balance</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-400">-{totals.totalMinus.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Deducted Amount</p>
        </div>
      </motion.div>

      {/* Search and Filters */}
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
                  User ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Coins Balance
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Beans Balance
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reason of Entry
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Deducted Amount
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                    <span>Loading transactions...</span>
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                    {error || 'No transaction records found'}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t, index) => (
                  <motion.tr
                    key={`${t.Id || t.id}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {startIndex + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <CopyableUserId userId={t.UserId || t.userId} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-yellow-400 font-medium">
                        {(t.UpdatedCoins || t.updatedCoins || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-green-400 font-medium">
                        {(t.UpdatedBeans || t.updatedBeans || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-normal break-words">
                      <span className="text-sm text-gray-300">
                        {t.ReasonOfEntry || t.reasonOfEntry || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-medium ${t.AnyAmountMinus > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {t.AnyAmountMinus > 0 ? `-${t.AnyAmountMinus.toLocaleString()}` : '0'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {t.Created_Date ? new Date(t.Created_Date).toLocaleString('en-IN') : 'N/A'}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} entries
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#3d2a60] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {[20, 50, 100, 250, 500].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
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
          </div>
        )}
      </motion.div>
    </div>
  );
};
