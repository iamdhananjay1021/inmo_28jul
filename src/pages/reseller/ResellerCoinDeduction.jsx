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
  MinusCircle,
  Coins
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

export const ResellerCoinDeduction = () => {
  const [loading, setLoading] = useState(true);
  const [resellers, setResellers] = useState([]);
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

  // Coin amount inputs
  const [coinAmounts, setCoinAmounts] = useState({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Action loading states
  const [actionLoading, setActionLoading] = useState({}); const fetchResellers = async () => {
    try {
      setLoading(true);

      const response = await userAPI.getResellerDetails();

      if (response.status) {
        setResellers(response.appResellerList || []);
      } else {
        setResellers([]);
      }
    } catch (err) {
      console.error('Fetch resellers error:', err);
      setResellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResellers();
  }, []);

  // Filter resellers
  const filteredResellers = useMemo(() => {
    return resellers.filter(reseller => {
      const searchLower = searchInput.toLowerCase();
      return !searchInput || (
        reseller.userId?.toLowerCase().includes(searchLower) ||
        reseller.name?.toLowerCase().includes(searchLower)
      );
    });
  }, [resellers, searchInput]);

  // Pagination
  const totalPages = Math.ceil(filteredResellers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResellers = filteredResellers.slice(startIndex, startIndex + itemsPerPage);

  // Handle coin amount change
  const handleCoinAmountChange = async (userId, value) => {
    setCoinAmounts(prev => ({ ...prev, [userId]: value }));
  };

  // Handle Deduct
  const handleDeduct = async (reseller) => {
    const amount = coinAmounts[reseller.userId];

    if (!amount || parseFloat(amount) <= 0) {
      showWarning('Please enter a valid coin amount');
      return;
    }

    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to deduct ${amount} coins from ${reseller.name} (${reseller.userId})?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setActionLoading(prev => ({ ...prev, [reseller.userId]: true }));

    try {
      const response = await userAPI.deductResellerCoin(reseller.userId, amount);

      if (response.status) {
        showSuccess(response.message || 'Coins deducted successfully');
        setCoinAmounts(prev => ({ ...prev, [reseller.userId]: '' }));
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to deduct coins');
      }
    } catch (err) {
      console.error('Deduct error:', err);
      showError('Failed to deduct coins. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [reseller.userId]: false }));
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalCoins = resellers.reduce((sum, r) => sum + (parseFloat(r.availableCoins) || 0), 0);
    return { total: resellers.length, totalCoins };
  }, [resellers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading resellers...</p>
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
          <div className="p-3 bg-red-500/20 rounded-lg">
            <MinusCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Reseller Coin Deduction</h1>
            <p className="text-gray-400">Total {resellers.length.toLocaleString()} resellers</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={fetchResellers}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <DownloadExcelButton
            data={filteredResellers.map((reseller, index) => ({ ...reseller, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'userId', header: 'User ID' },
              { key: 'name', header: 'Name' },
              { key: 'availableCoins', header: 'Available Coins' }
            ]}
            filename={`reseller_coin_deduction_${new Date().toISOString().split('T')[0]}.xlsx`}
            options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 20 }, { wch: 16 }] }}
          />        </div>

      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.total.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Resellers</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
            <Coins className="w-6 h-6" />
            {stats.totalCoins.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Total Available Coins</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by User ID or Name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
          />
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
                  Image
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Available Coins
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Coin Amount
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedResellers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedResellers.map((reseller, index) => (
                  <motion.tr
                    key={reseller.userId}
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
                      <CopyableUserId userId={reseller.userId} />
                    </td>
                    <td className="px-4 py-4">
                      <img
                        src={reseller.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%236b7280"/%3E%3C/svg%3E'}
                        alt={reseller.name}
                        className={`w-10 h-10 rounded-lg object-cover ${reseller.image ? 'cursor-pointer' : ''}`}
                        onClick={() => reseller.image && openPreview(reseller.image, reseller.name || 'Reseller Image')}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%236b7280"/%3E%3C/svg%3E';
                          e.target.onerror = null;
                        }}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-white">
                        {reseller.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-yellow-400 font-semibold">
                        {parseFloat(reseller.availableCoins || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        value={coinAmounts[reseller.userId] || ''}
                        onChange={(e) => handleCoinAmountChange(reseller.userId, e.target.value)}
                        placeholder="Enter amount"
                        className="w-28 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDeduct(reseller)}
                          disabled={actionLoading[reseller.userId] || !coinAmounts[reseller.userId]}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[reseller.userId] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <MinusCircle className="w-3 h-3" />
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredResellers.length)} of {filteredResellers.length} entries
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
