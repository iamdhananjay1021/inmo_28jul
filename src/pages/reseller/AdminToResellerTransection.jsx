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
    History
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';

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

export const AdminToResellerTransection = () => {
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allTransactions, setAllTransactions] = useState([]);

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

            const response = await userAPI.getAdminToResellerTransactions({});

            if (response?.Status) {
                setAllTransactions(
                    response.data.map((item) => ({
                        id: item.Id,
                        resellerId: item.ResellerId,
                        resellerName: item.ResellerName,
                        resellerImage: item.ResellerImage,
                        coinAmount: item.CoinAmount,
                        type: item.Type,
                        balanceBefore: item.BalanceBefore,
                        balanceAfter: item.BalanceAfter,
                        createdAt: item.CreatedAt,
                    }))
                );
            } else {
                setAllTransactions([]);
            }
        } catch (error) {
            console.error(error);
            setAllTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Date range filter
    const isDateInRange = (dateString) => {
        if (!fromDate && !toDate) return true;
        if (!dateString) return false;

        let itemDate = new Date(dateString);

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

    // Filter data
    const filteredData = useMemo(() => {
        return allTransactions.filter(item => {
            const searchLower = searchInput.toLowerCase();
            const matchesSearch = !searchInput ||
                (item.resellerId?.toLowerCase().includes(searchLower) ||
                    item.resellerName?.toLowerCase().includes(searchLower) ||
                    item.type?.toLowerCase().includes(searchLower) ||
                    String(item.coinAmount).toLowerCase().includes(searchLower));

            const matchesDate = !dateFilterActive || isDateInRange(item.createdAt);

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
        const totalBalanceBefore = allTransactions.reduce(
            (sum, item) => sum + (Number(item.balanceBefore) || 0), 0
        );
        const totalBalanceAfter = allTransactions.reduce(
            (sum, item) => sum + (Number(item.balanceAfter) || 0), 0
        );

        return {
            total: allTransactions.length,
            totalCoinAmount,
            totalBalanceBefore,
            totalBalanceAfter,
        };
    }, [allTransactions]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading transactions...</p>
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
                            Admin to Reseller Transactions
                        </h1>
                        <p className="text-gray-400">Total {stats.total.toLocaleString()} records</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>

                    <DownloadExcelButton
                        data={filteredData.map((item, index) => ({ ...item, serialNumber: index + 1 }))}
                        columns={[
                            { key: 'serialNumber', header: 'S.No' },
                            { key: 'resellerId', header: 'Reseller ID' },
                            { key: 'resellerName', header: 'Reseller Name' },
                            { key: 'type', header: 'Type' },
                            { key: 'coinAmount', header: 'Coin Amount' },
                            { key: 'balanceBefore', header: 'Balance Before' },
                            { key: 'balanceAfter', header: 'Balance After' },
                            { key: 'createdAt', header: 'Date' }
                        ]}
                        filename={`admin_to_reseller_transactions_${new Date().toISOString().split('T')[0]}.xlsx`}
                        options={{
                            colWidths: [
                                { wch: 8 }, { wch: 18 }, { wch: 25 },
                                { wch: 15 }, { wch: 15 }, { wch: 18 },
                                { wch: 18 }, { wch: 22 }
                            ]
                        }}
                    />
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                <div className="glass rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{stats.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-400 mt-1">Total Records</p>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{stats.totalCoinAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-400 mt-1">Total Coin Amount</p>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{stats.totalBalanceBefore.toLocaleString()}</p>
                    <p className="text-sm text-gray-400 mt-1">Balance Before</p>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{stats.totalBalanceAfter.toLocaleString()}</p>
                    <p className="text-sm text-gray-400 mt-1">Balance After</p>
                </div>
            </motion.div>

            {/* Search & Filter */}
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
                            placeholder="Search by Reseller ID, Name, Type..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
                        />
                    </div>

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
                <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1625] sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reseller</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Coin Amount</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Balance Before</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Balance After</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/5">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                        No Records Found
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => (
                                    <motion.tr
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-400">{startIndex + index + 1}</span>
                                        </td>

                                        {/* Reseller Info with Image */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {item.resellerImage ? (
                                                    <>
                                                        <div
                                                            onClick={() =>
                                                                setPreviewImage(
                                                                    item.resellerImage ||
                                                                    DEFAULT_AVATAR
                                                                )
                                                            }
                                                            className="w-11 h-11 rounded-full overflow-hidden border border-white/20 bg-gray-800 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                                                        >
                                                            <img
                                                                src={
                                                                    item.resellerImage ||
                                                                    DEFAULT_AVATAR
                                                                }
                                                                alt={item.resellerName || "User"}
                                                                className="w-full h-full object-cover"
                                                            // onError={(e) => {
                                                            //   e.currentTarget.onerror = null;
                                                            //   e.currentTarget.src = DEFAULT_AVATAR;
                                                            // }}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                        👤
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-white">{item.resellerName || 'N/A'}</p>
                                                    <CopyableUserId userId={item.resellerId} />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className={`text-sm font-medium ${item.type === 'Credit' ? 'text-green-400' : 'text-red-400'}`}>
                                                {item.type || 'N/A'}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="text-sm text-yellow-400 font-semibold">
                                                {Number(item.coinAmount || 0).toLocaleString()}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="text-sm text-blue-400">
                                                {Number(item.balanceBefore || 0).toLocaleString()}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="text-sm text-orange-400">
                                                {Number(item.balanceAfter || 0).toLocaleString()}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-400">
                                                {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
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
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-400 px-4">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
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