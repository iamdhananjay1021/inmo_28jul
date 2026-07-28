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
    Users,
    Trash2,
    Coins,
    Plus,
    Calendar,
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

export const CoinReselling = () => {
    const DEFAULT_AVATAR = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%239333ea"/%3E%3Ccircle cx="50" cy="35" r="15" fill="white"/%3E%3Cpath d="M25,65 Q25,55 50,55 Q75,55 75,65 L75,85 Q75,90 70,90 L30,90 Q25,90 25,85 Z" fill="white"/%3E%3C/svg%3E';

    const [loading, setLoading] = useState(true);
    const [resellers, setResellers] = useState([]);

    // Search state
    const [searchInput, setSearchInput] = useState('');

    // Date filter states
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [dateFilterActive, setDateFilterActive] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Action loading states
    const [actionLoading, setActionLoading] = useState({});
    const [password, setPassword] = useState("");
    const [coinInputs, setCoinInputs] = useState({});
    const [addCoinLoading, setAddCoinLoading] = useState({});
const fetchResellers = async () => {
        try {
            setLoading(true);

            const response = await userAPI.getCoinReselling();

            if (response.status) {
                setResellers(response.data || []);
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

    const handleDateRangeFilter = async (startDate, endDate) => {
        try {
            setLoading(true);
            const response = await userAPI.getCoinResellingDateRange(startDate, endDate);
            if (response.status) {
                setResellers(response.data || []);
            } else {
                setResellers([]);
            }
        } catch (err) {
            console.error('Date range filter error:', err);
            setResellers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchInput.trim()) return fetchResellers();

        try {
            setLoading(true);
            setCurrentPage(1);
            const response = await userAPI.searchResellerByUserId(searchInput.trim());
            if (response.status) {
                setResellers(response ? [response] : []);
            } else {
                setResellers([]);
            }
        } catch (err) {
            console.error('Search error:', err);
            setResellers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyDateFilter = async () => {
        if (!fromDate || !toDate) {
            showWarning('Please select both start and end dates');
            return;
        }

        setDateFilterActive(true);
        setCurrentPage(1);
        setSearchInput('');
        await handleDateRangeFilter(fromDate, toDate);
    };

    const handleClearDateFilter = async () => {
        setFromDate('');
        setToDate('');
        setDateFilterActive(false);
        setCurrentPage(1);
        setSearchInput('');
        await fetchResellers();
    };

    const handleAddCoin = async (reseller) => {
        const coinAmount = coinInputs[reseller.userId]?.trim();
        if (!coinAmount || isNaN(coinAmount) || parseFloat(coinAmount) <= 0) {
            showWarning('Please enter a valid coin amount');
            return;
        }

        setAddCoinLoading(prev => ({ ...prev, [reseller.userId]: true }));
        try {
            const response = await userAPI.addResellerCoin(reseller.userId, coinAmount);
            // if (response.status) {
                showSuccess('Coins added successfully');
                setCoinInputs(prev => ({ ...prev, [reseller.userId]: '' }));
                fetchResellers();
                setTimeout(() => window.location.reload(), 1200);
            // } else {
            //     showError(response.message || 'Failed to add coin');
            // }
        } catch (err) {
            console.error('Add coin error:', err);
            showError('Failed to add coin. Please try again.');
        } finally {
            setAddCoinLoading(prev => ({ ...prev, [reseller.userId]: false }));
        }
    };
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

    const totalPages = Math.ceil(filteredResellers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedResellers = filteredResellers.slice(startIndex, startIndex + itemsPerPage);

    const stats = useMemo(() => {
        const totalBalance = resellers.reduce((sum, r) => sum + (parseFloat(r.balance) || 0), 0);
        const totalTransfer = resellers.reduce((sum, r) => sum + (parseFloat(r.totalTransferCoin) || 0), 0);
        const totalBeans = resellers.reduce((sum, r) => sum + (parseFloat(r.totalBeans) || 0), 0);
        return { total: resellers.length, totalBalance, totalTransfer, totalBeans };
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
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                        <Users className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Coin Reselling</h1>
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
                    { key: 'resellerId', header: 'Reseller ID' },
                    { key: 'type', header: 'Type' },
                    { key: 'transferredCoins', header: 'Transferred Coins' },
                    { key: 'totalBalance', header: 'Total Balance' },
                    { key: 'created_Date', header: 'Created Date' }
                  ]}
                  filename={`coin_reselling_${new Date().toISOString().split('T')[0]}.xlsx`}
                  options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 18 }] }}
                />        </div>

            </motion.div>

            {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.total.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Resellers</p>
        </div>
      </motion.div> */}

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
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
                        />
                    </div>

                    {/* Search Button */}
                    {searchInput && (
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
                        >
                            Search
                        </button>
                    )}

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
                            onClick={handleApplyDateFilter}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white transition-colors"
                        >
                            Filter
                        </button>
                        {dateFilterActive && (
                            <button
                                onClick={handleClearDateFilter}
                                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors flex items-center gap-1"
                            >
                                <X className="w-3 h-3" />
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
                                {searchInput ? (
                                    <>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            User ID
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Image
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Available Coins
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Coin Amount
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            User ID
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Reseller ID
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Transferred Coins
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Total Balance
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Created Date
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedResellers.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center text-gray-400">
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
                                        {searchInput ? (
                                            <>
                                                <td className="px-4 py-4">
                                                    <CopyableUserId userId={reseller.userId} />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm font-medium text-white">
                                                        {reseller.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <img
                                                        src={reseller.image || DEFAULT_AVATAR}
                                                        alt={reseller.name || 'User'}
                                                        onError={(e) => {
                                                            e.target.src = DEFAULT_AVATAR;
                                                        }}
                                                        className="w-12 h-12 rounded-lg object-cover border-2 border-purple-500/30 cursor-pointer hover:border-purple-500 transition-all hover:scale-110"
                                                        title="User avatar"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-yellow-400 font-medium">
                                                        {reseller.availableCoins || reseller.coin || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="number"
                                                        placeholder="Amount"
                                                        value={coinInputs[reseller.userId] || ''}
                                                        onChange={(e) => setCoinInputs(prev => ({ ...prev, [reseller.userId]: e.target.value }))}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleAddCoin(reseller)}
                                                        className="w-25 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-300 focus:outline-none focus:border-purple-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                            onClick={() => handleAddCoin(reseller)}
                                                            disabled={addCoinLoading[reseller.userId]}
                                                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {addCoinLoading[reseller.userId] ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Coins className="w-3 h-3" />
                                                            )}
                                                            Add
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-4">
                                                    <CopyableUserId userId={reseller.userId} />
                                                </td>
                                                {reseller.resellerId !== undefined && (
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm font-medium text-white">
                                                            {reseller.resellerId || 'No Id'}
                                                        </span>
                                                    </td>
                                                )}
                                                {reseller.type !== undefined && (
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-gray-400">
                                                            {reseller.type || 'N/A'}
                                                        </span>
                                                    </td>
                                                )}
                                                {reseller.transferedCoin !== undefined && (
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-gray-400">
                                                            {reseller.transferedCoin || 'N/A'}
                                                        </span>
                                                    </td>
                                                )}
                                                {reseller.totalBalance !== undefined && (
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-gray-400">
                                                            {reseller.totalBalance || 'N/A'}
                                                        </span>
                                                    </td>
                                                )}
                                                {reseller.createdDate !== undefined && (
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-gray-400">
                                                            {reseller.createdDate || 'N/A'}
                                                        </span>
                                                    </td>
                                                )}
                                            </>
                                        )}
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
