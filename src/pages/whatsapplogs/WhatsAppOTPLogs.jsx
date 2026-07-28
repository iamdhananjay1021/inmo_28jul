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
    MessagesSquare,
    Wallet,
    DollarSign,
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { showSuccess, showError, showWarning, showConfirm } from '../../utils/swalUtils';
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

export const WhatsAppOTPLogs = () => {
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

    const fetchRecords = async () => {
        try {
            setLoading(true);

            const response = await userAPI.getWhatsAppOTPLogs();

            if (response.Status || response.status) {
                setRecords(response.Logs || []);
                setRecordsCount(response.Count || 0);
            } else {
                setRecords([]);
                setRecordsCount(0);
            }
        } catch (err) {
            console.error('Fetch WhatsApp OTP logs error:', err);
            setRecords([]);
            setRecordsCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

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
                record.MobileNumber?.toLowerCase().includes(searchLower) ||
                record.OTP?.toLowerCase().includes(searchLower) ||
                record.Source?.toLowerCase().includes(searchLower);
            // Date filter
            const matchesDate = !dateFilterActive || isDateInRange(record.OtpExpiryTime);

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


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">
                        Loading WhatsApp OTP logs...
                    </p>
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
                        <MessagesSquare className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">WhatsApp OTP Logs</h1>
                        <p className="text-gray-400">Total {recordsCount} records</p>
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
                    <DownloadExcelButton
                        data={filteredRecords.map((record, index) => ({
                            serialNumber: index + 1,
                            UserId: record.UserId,
                            MobileNumber: record.MobileNumber,
                            OTP: record.OTP,
                            OtpExpiryTime: record.OtpExpiryTime
                                ? new Date(record.OtpExpiryTime).toLocaleString("en-IN")
                                : "",
                            Source: record.Source,
                        }))}
                        columns={[
                            { key: "serialNumber", header: "S.No" },
                            { key: "UserId", header: "User ID" },
                            { key: "MobileNumber", header: "Mobile Number" },
                            { key: "OTP", header: "OTP" },
                            { key: "OtpExpiryTime", header: "OTP Expiry Time" },
                            { key: "Source", header: "Source" },
                        ]}
                        filename={`WhatsAppOTPLogs_${new Date().toISOString().split("T")[0]}.xlsx`}
                        options={{
                            colWidths: [
                                { wch: 8 },
                                { wch: 15 },
                                { wch: 18 },
                                { wch: 12 },
                                { wch: 25 },
                                { wch: 20 },
                            ],
                        }}
                    />
                </div>

            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3"
            >
                <div className="glass rounded-xl p-5 text-center">
                    <p className="text-3xl font-bold text-orange-400">
                        {recordsCount}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        Total OTP Records
                    </p>
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
                            placeholder="Search by User ID, Mobile Number, OTP or Source..."
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
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                    S.No
                                </th>

                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                    User ID
                                </th>

                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                    Mobile Number
                                </th>

                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                    OTP
                                </th>

                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                    OTP Expiry Time
                                </th>

                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                    Source
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                        No Records Found
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record, index) => (
                                    <motion.tr
                                        key={`${record.UserId}-${index}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-4 py-4 text-gray-300">
                                            {startIndex + index + 1}
                                        </td>

                                        <td className="px-4 py-4">
                                            <CopyableUserId userId={record.UserId} />
                                        </td>

                                        <td className="px-4 py-4 text-gray-300 font-mono">
                                            {record.MobileNumber}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 font-semibold tracking-wider">
                                                {record.OTP}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-gray-300">
                                            {new Date(record.OtpExpiryTime).toLocaleString("en-IN")}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                                                {record.Source}
                                            </span>
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
        </div>
    );
};
