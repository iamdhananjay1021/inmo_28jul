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
  History,
  ArrowRight
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import MediaPreview from '../../components/MediaPreview';

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
      className="flex items-center gap-1 text-xs text-purple-400 font-mono hover:text-purple-300 transition-colors group"
      title="Click to copy ID"
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

export const ResellerTransactions = () => {
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState([]);

  // Image Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const openPreview = (src, title = 'Image Preview') => {
    if (!src) return;
    setPreviewSrc(src);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  // Search state
  const [searchInput, setSearchInput] = useState('');

  // Date filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchData = async () => {
    try {
      setLoading(true);

      const payload = { Type: "Reseller" };
      const response = await userAPI.getResellerTransactions(payload);

      if (response?.Status || response?.status) {
        const rawList = response.data || response.Data || [];
        setAllTransactions(
          rawList.map((item, idx) => ({
            id: item.Id || idx,
            resellerId: item.ResellerId,
            userId: item.UserId,
            type: item.Type || 'Credit',
            coinAmount: item.CoinAmount || 0,
            resellerBalanceBefore: item.ResellerBalanceBefore !== undefined ? item.ResellerBalanceBefore : (item.BalanceBefore || 0),
            resellerBalanceAfter: item.ResellerBalanceAfter !== undefined ? item.ResellerBalanceAfter : (item.BalanceAfter || 0),
            userBalanceBefore: item.UserBalanceBefore !== undefined ? item.UserBalanceBefore : 0,
            userBalanceAfter: item.UserBalanceAfter !== undefined ? item.UserBalanceAfter : 0,
            created_Date: item.Created_Date || '-',
            receiverName: item.ReceiverName || 'User',
            receiverPhoto: item.ReceiverPhoto,
            receiverImage: item.ReceiverImage,
          }))
        );
      } else {
        setAllTransactions([]);
      }
    } catch (error) {
      console.error('Fetch reseller transactions error:', error);
      setAllTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check if date is in range
  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    let itemDate;

    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      itemDate = new Date(year, month - 1, day);
    } else if (dateString.includes('-')) {
      if (dateString.startsWith('20')) {
        itemDate = new Date(dateString);
      } else {
        const [day, month, year] = dateString.split(' ')[0].split('-');
        itemDate = new Date(year, month - 1, day);
      }
    } else {
      itemDate = new Date(dateString);
    }

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (itemDate) itemDate.setHours(0, 0, 0, 0);
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(0, 0, 0, 0);

    if (from && to) return itemDate >= from && itemDate <= to;
    if (from) return itemDate >= from;
    if (to) return itemDate <= to;
    return true;
  };

  // Filter data
  const filteredData = useMemo(() => {
    return allTransactions.filter(item => {
      const searchLower = searchInput.toLowerCase();
      const matchesSearch = !searchInput ||
        (String(item.resellerId || '').toLowerCase().includes(searchLower) ||
          String(item.userId || '').toLowerCase().includes(searchLower) ||
          String(item.receiverName || '').toLowerCase().includes(searchLower) ||
          String(item.type || '').toLowerCase().includes(searchLower) ||
          String(item.coinAmount || '').toLowerCase().includes(searchLower));

      const matchesDate = !dateFilterActive || isDateInRange(item.created_Date);

      return matchesSearch && matchesDate;
    });
  }, [allTransactions, searchInput, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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

  // Stats
  const stats = useMemo(() => {
    const totalCoinAmount = allTransactions.reduce(
      (sum, item) => sum + (Number(item.coinAmount) || 0), 0
    );

    return {
      total: allTransactions.length,
      totalCoinAmount,
    };
  }, [allTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading reseller transactions...</p>
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
            <History className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">
              Reseller Transactions
            </h1>
            <p className="text-gray-400">Total {stats.total.toLocaleString()} records</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <DownloadExcelButton
            data={filteredData.map((item, index) => ({ ...item, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'resellerId', header: 'Reseller ID' },
              { key: 'userId', header: 'Receiver User ID' },
              { key: 'receiverName', header: 'Receiver Name' },
              { key: 'type', header: 'Type' },
              { key: 'coinAmount', header: 'Coins Transferred' },
              { key: 'resellerBalanceBefore', header: 'Reseller Bal Before' },
              { key: 'resellerBalanceAfter', header: 'Reseller Bal After' },
              { key: 'userBalanceBefore', header: 'User Bal Before' },
              { key: 'userBalanceAfter', header: 'User Bal After' },
              { key: 'created_Date', header: 'Date & Time' }
            ]}
            filename={`reseller_transactions_${new Date().toISOString().split('T')[0]}.xlsx`}
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {stats.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Total Transactions</p>
        </div>

        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {stats.totalCoinAmount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Total Coins Transferred</p>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Reseller ID, Receiver User ID, Receiver Name, Type, Coins..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Date:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={handleDateFilter}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white transition-colors"
            >
              Apply Filter
            </button>
            {dateFilterActive && (
              <button
                onClick={clearDateFilter}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
              >
                Clear Filter
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
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">
                  S.No
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reseller ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Receiver User
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Coins
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reseller Balance
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User Balance
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date & Time
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <motion.tr
                    key={item.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {startIndex + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <CopyableUserId userId={item.resellerId || 'N/A'} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.receiverImage || '/assets/default-avatar.png'}
                          alt={item.receiverName}
                          className={`w-9 h-9 rounded-full object-cover border border-purple-500/30 ${item.receiverImage ? 'cursor-pointer' : ''}`}
                          onClick={() => item.receiverImage && openPreview(item.receiverImage, `${item.receiverName} Image`)}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%239333ea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E👤%3C/text%3E%3C/svg%3E'; }}
                        />
                        <div>
                          <p className="text-sm font-medium text-white">{item.receiverName || 'Unknown'}</p>
                          <CopyableUserId userId={item.userId} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.type === 'Credit' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {item.type || 'Credit'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-yellow-400 font-bold">
                        {Number(item.coinAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">{Number(item.resellerBalanceBefore || 0).toLocaleString()}</span>
                          <ArrowRight className="w-3 h-3 text-gray-500" />
                          <span className="text-cyan-400 font-semibold">{Number(item.resellerBalanceAfter || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">{Number(item.userBalanceBefore || 0).toLocaleString()}</span>
                          <ArrowRight className="w-3 h-3 text-gray-500" />
                          <span className="text-green-400 font-semibold">{Number(item.userBalanceAfter || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-300 font-mono">
                        {item.created_Date || 'N/A'}
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
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

      <MediaPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={previewSrc}
        title={previewTitle}
      />
    </div>
  );
};