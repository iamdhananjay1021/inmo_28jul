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
  Lock,
  LockOpen,
  Wallet
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showError } from '../../utils/swalUtils';
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

export const WalletFreezeUnfreeze = () => {
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState(null);
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Date filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState({});
const fetchWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userAPI.getWalletDetails();
      
      if (response.success) {
        setWallets(response.data || []);
      } else {
        // Show empty table instead of error
        setWallets([]);
      }
    } catch (err) {
      console.error('Fetch wallets error:', err);
      // Show empty table instead of error
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);
  const isSearchActive = searchInput.trim().length > 0;

  // Search with API
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      fetchWallets();
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await userAPI.searchWalletFreezeUnfreeze(searchInput);
      if (response.status) {
        setWallets(response.walletFreezeSearchList || []);
      } else {
        // Show empty table instead of error
        setWallets([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      // Show empty table instead of error
      setWallets([]);
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
        fetchWallets();
      }
    }, 500);
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

  // Filter wallets
  const filteredWallets = useMemo(() => {
    return wallets.filter(wallet => {
      // Date filter
      const matchesDate = !dateFilterActive || isDateInRange(wallet.freezeUnfreezeDateTime);
      return matchesDate;
    });
  }, [wallets, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredWallets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWallets = filteredWallets.slice(startIndex, startIndex + itemsPerPage);

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

  // Handle Freeze/Unfreeze
  const handleFreezeUnfreeze = async (wallet, action) => {
    const userId = wallet.userId;
    const updateStatus = action === 'unfreeze'; // true for unfreeze, false for freeze
    
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await userAPI.updateWalletStatus(userId, updateStatus);
      
      if (response.success) {
        // Update local state
        setWallets(prev => prev.map(w => 
          w.userId === userId 
            ? { ...w, walletStatus: updateStatus ? 1 : 0, freezeUnfreezeDateTime: new Date().toISOString() }
            : w
        ));
        showSuccess(`Wallet ${action === 'freeze' ? 'frozen' : 'unfrozen'} successfully!`);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || `Failed to ${action} wallet`);
      }
    } catch (err) {
      console.error(`${action} error:`, err);
      showError(`Failed to ${action} wallet. Please try again.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const frozen = wallets.filter(w => w.walletStatus === 0 || w.walletStatus === '0' || w.walletStatus === "False").length;
    const active = wallets.length - frozen;
    return { frozen, active, total: wallets.length };
  }, [wallets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading wallet details...</p>
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
            <Wallet className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Wallet Freeze / Unfreeze</h1>
            <p className="text-gray-400">Total {wallets.length.toLocaleString()} wallet records</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <DownloadExcelButton
          data={filteredWallets.map((wallet, index) => ({ ...wallet, serialNumber: index + 1 }))}
          columns={[
            { key: 'serialNumber', header: 'S.No' },
            { key: 'userId', header: 'User ID' },
            { key: 'name', header: 'Name' },
            { key: 'coins', header: 'Coins' },
            { key: 'beans', header: 'Beans' },
            { key: 'status', header: 'Status' },
            { key: 'lastUpdated', header: 'Last Updated' }
          ]}
          filename={`wallet_freeze_unfreeze_${new Date().toISOString().split('T')[0]}.xlsx`}
          options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }] }}
        />
        <button
          onClick={fetchWallets}
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
          <p className="text-sm text-gray-400 mt-1">Total Wallets</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.active.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Active Wallets</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.frozen.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Inactive (Frozen) Wallets</p>
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
                  User ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Coins
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Beans
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Last Updated
                </th>
                {/* <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">
                  Actions
                </th> */}
                   {isSearchActive && (
                  <>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedWallets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                    No wallet records found
                  </td>
                </tr>
              ) : (
                paginatedWallets.map((wallet, index) => {
                  // walletStatus = 0 means Frozen/Inactive, 1 means Active
                  const isFrozen = wallet.walletStatus === 0 || wallet.walletStatus === '0' || wallet.walletStatus === "False";
                  const isActive = !isFrozen;
                  
                  return (
                    <motion.tr
                      key={wallet.userId}
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
                        <CopyableUserId userId={wallet.userId} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-white">
                          {wallet.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-yellow-400">
                          {(wallet.coinAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-green-400">
                          {(wallet.beans || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isFrozen 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {isFrozen ? (
                            <><Lock className="w-3 h-3" /> Frozen</>
                          ) : (
                            <><LockOpen className="w-3 h-3" /> Active</>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">
                          {wallet.freezeUnfreezeDateTime || 'N/A'}
                        </span>
                      </td>
                       {isSearchActive && (
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleFreezeUnfreeze(wallet, 'freeze')}
                            disabled={isFrozen || actionLoading[wallet.userId]}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              isFrozen
                                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                            }`}
                          >
                            {actionLoading[wallet.userId] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                            Freeze
                          </button>
                          <button
                            onClick={() => handleFreezeUnfreeze(wallet, 'unfreeze')}
                            disabled={!isFrozen || actionLoading[wallet.userId]}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              !isFrozen
                                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                            }`}
                          >
                            {actionLoading[wallet.userId] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <LockOpen className="w-3 h-3" />
                            )}
                            Unfreeze
                          </button>
                        </div>
                      </td>)}
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredWallets.length)} of {filteredWallets.length} entries
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
