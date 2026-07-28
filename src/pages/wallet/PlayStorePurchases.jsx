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
  CreditCard,
  TrendingUp
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

export const PlayStorePurchases = () => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
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
  const itemsPerPage = 20;

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userAPI.getPlayStoreRecord();
      
      if (response.status) {
        setPurchases(response.apiAddedCoinDetails || []);
      } else {
        setError(response.message || 'Failed to fetch play store purchases');
      }
    } catch (err) {
      console.error('Fetch play store purchases error:', err);
      setError('Failed to load play store purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);
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

  // Calculate totals
  const totals = useMemo(() => {
    const filtered = purchases.filter(purchase => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        purchase.userId?.toLowerCase().includes(searchLower) ||
        purchase.name?.toLowerCase().includes(searchLower)
      );
      const matchesDate = !dateFilterActive || isDateInRange(purchase.transactionDate);
      return matchesSearch && matchesDate;
    });
    
    return {
      totalPurchases: filtered.length,
      totalCoins: filtered.reduce((sum, p) => sum + (parseFloat(p.purchasedCoins) || 0), 0),
      totalPreviousCoins: filtered.reduce((sum, p) => sum + (parseFloat(p.previousCoinAmount) || 0), 0),
      totalLatestCoins: filtered.reduce((sum, p) => sum + (parseFloat(p.latestCoinAmount) || 0), 0),
    };
  }, [purchases, searchTerm, dateFilterActive, fromDate, toDate]);

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        purchase.userId?.toLowerCase().includes(searchLower) ||
        purchase.name?.toLowerCase().includes(searchLower)
      );
      
      // Date filter
      const matchesDate = !dateFilterActive || isDateInRange(purchase.transactionDate);
      
      return matchesSearch && matchesDate;
    });
  }, [purchases, searchTerm, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPurchases = filteredPurchases.slice(startIndex, startIndex + itemsPerPage);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading play store purchases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchPurchases}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Retry
          </button>
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
          <div className="p-3 bg-green-500/20 rounded-lg">
            <CreditCard className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Play Store Purchases</h1>
            <p className="text-gray-400">Total {purchases.length.toLocaleString()} purchase records</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <DownloadExcelButton
          data={filteredPurchases.map((purchase, index) => ({ ...purchase, serialNumber: index + 1 }))}
          columns={[
            { key: 'serialNumber', header: 'S.No' },
            { key: 'userId', header: 'User ID' },
            { key: 'name', header: 'Name' },
            { key: 'previousCoins', header: 'Previous Coins' },
            { key: 'purchasedCoins', header: 'Purchased Coins' },
            { key: 'latestCoins', header: 'Latest Coins' },
            { key: 'status', header: 'Status' },
            { key: 'transactionDate', header: 'Transaction Date' }
          ]}
          filename={`playstore_purchases_${new Date().toISOString().split('T')[0]}.xlsx`}
          options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 18 }] }}
        />
        <button
          onClick={fetchPurchases}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
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
          <p className="text-2xl font-bold text-blue-400">{totals.totalPurchases.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Purchases</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{totals.totalCoins.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Purchased Coins</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{totals.totalPreviousCoins.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Previous Coins</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{totals.totalLatestCoins.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Latest Coins</p>
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
              placeholder="Search by User ID or Name..."
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
                  Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Previous Coins
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Purchased Coins
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Latest Coins
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Transaction Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                    No purchase records found
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((purchase, index) => (
                  <motion.tr
                    key={`${purchase.userId}-${index}`}
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
                      <CopyableUserId userId={purchase.userId} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-white">
                        {purchase.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {(purchase.previousCoinAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-yellow-400 font-medium">
                        +{(purchase.purchasedCoins || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-green-400">
                        {(purchase.latestCoinAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm ${
                        purchase.status === 'Successful' ? 'text-green-400' : 
                        purchase.status === 'Failed' ? 'text-red-400' : 
                        'text-yellow-400'
                      }`}>
                        {purchase.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {purchase.transactionDate || 'N/A'}
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPurchases.length)} of {filteredPurchases.length} entries
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
