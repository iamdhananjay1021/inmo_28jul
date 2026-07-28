import { copyToClipboard } from '../../utils/clipboardUtils';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Calendar,
    Loader2,
    RefreshCw,
    Edit,
    Trash2,
    Copy,
    Check,
    LockKeyhole,
    Plus,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';

// Copyable Field
const CopyableField = ({ value, label }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await copyToClipboard(value.toString());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-sm text-purple-400 font-mono hover:text-purple-300 transition-colors group"
            title={`Copy ${label}`}
        >
            {value}
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
        </button>
    );
};

export const StaticOtp = () => {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [searchInput, setSearchInput] = useState('');

    // Date Filter
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [dateFilterActive, setDateFilterActive] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const pageSizeOptions = [20, 50, 100, 200];

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentEntry, setCurrentEntry] = useState(null);
    const [formData, setFormData] = useState({ mobileNumber: '', otp: '' });
    const [saving, setSaving] = useState(false);

    // Toast
    const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });
    const toastTimeoutRef = useRef(null);

    const showToast = (message, variant = 'success') => {
        setToast({ open: true, message, variant });
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
            setToast({ open: false, message: '', variant: 'success' });
        }, 3000);
    };

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getStaticOtp();

            if (response.Status || response.status) {
                setRecords(response.Data || response.data || []);
            } else {
                setRecords([]);
            }
        } catch (err) {
            console.error('Fetch Static OTP error:', err);
            setRecords([]);
            showToast('Failed to load records', 'error');
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

    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const searchLower = searchInput.toLowerCase();
            const matchesSearch = !searchInput ||
                record.MobileNumber?.toLowerCase().includes(searchLower) ||
                record.OTP?.toLowerCase().includes(searchLower) ||
                (record.UserId || record.userId || record.Id)?.toString().toLowerCase().includes(searchLower);

            return matchesSearch && isDateInRange(record.CreatedDate);
        });
    }, [records, searchInput, fromDate, toDate]);

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

    const openAddModal = () => {
        setIsEditMode(false);
        setCurrentEntry(null);
        setFormData({ mobileNumber: '', otp: '' });
        setModalOpen(true);
    };

    const openEditModal = (entry) => {
        setIsEditMode(true);
        setCurrentEntry(entry);
        setFormData({
            mobileNumber: entry.MobileNumber || '',
            otp: entry.OTP || ''
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.mobileNumber || !formData.otp) {
            showToast('Mobile Number and OTP are required!', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = isEditMode
                ? { Id: currentEntry.Id, MobileNumber: formData.mobileNumber, OTP: formData.otp }
                : { MobileNumber: formData.mobileNumber, OTP: formData.otp };

            const response = isEditMode
                ? await userAPI.updateStaticOtp(payload)
                : await userAPI.insertStaticOtp(payload);

            if (response.Status || response.status) {
                showToast(isEditMode ? 'Updated successfully!' : 'Added successfully!', 'success');
                setModalOpen(false);
                fetchRecords();
            } else {
                showToast(response.Message || 'Operation failed', 'error');
            }
        } catch (err) {
            showToast('Request failed. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (entry) => {
        if (window.confirm(`Delete static OTP for ${entry.MobileNumber}?`)) {
            userAPI.deleteStaticOtp({ Id: entry.Id })
                .then(response => {
                    if (response.Status || response.status) {
                        showToast('Deleted successfully', 'success');
                        fetchRecords();
                    } else {
                        showToast('Delete failed', 'error');
                    }
                })
                .catch(() => showToast('Delete failed', 'error'));
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                        <LockKeyhole className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Static OTP Management</h1>
                        <p className="text-gray-400">Total {records.length} entries</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={fetchRecords} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>

                    <DownloadExcelButton
                        data={filteredRecords.map((record, index) => ({
                            serialNumber: index + 1,
                            UserId: record.UserId || record.userId || record.Id || "",
                            MobileNumber: record.MobileNumber,
                            OTP: record.OTP,
                            CreatedDate: record.CreatedDate
                                ? new Date(record.CreatedDate).toLocaleString("en-IN")
                                : "",
                        }))}
                        columns={[
                            { key: "serialNumber", header: "S.No" },
                            { key: "UserId", header: "User ID" },
                            { key: "MobileNumber", header: "Mobile Number" },
                            { key: "OTP", header: "OTP" },
                            { key: "CreatedDate", header: "Created Date" },
                        ]}
                        filename={`StaticOTP_${new Date().toISOString().split("T")[0]}.xlsx`}
                        options={{
                            colWidths: [
                                { wch: 8 },
                                { wch: 15 },
                                { wch: 18 },
                                { wch: 12 },
                                { wch: 25 },
                            ],
                        }}
                    />

                    <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3"
            >
                <div className="glass rounded-xl p-5 text-center">
                    <p className="text-3xl font-bold text-orange-400">
                        {records.length || 0}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        Total OTP Records
                    </p>
                </div>
            </motion.div>

            {/* Search & Filter */}
            <motion.div className="glass rounded-xl p-4">
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Search */}
                    <div className="relative w-full lg:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Mobile, OTP or User ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:border-purple-500 focus:outline-none"
                        />
                    </div>

                    {/* Date Filter */}
                    <div className="w-full lg:flex-1 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 w-full">
                            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />

                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200"
                            />

                            <span className="text-gray-400">-</span>

                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200"
                            />

                            <button
                                onClick={handleDateFilter}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm whitespace-nowrap"
                            >
                                Filter
                            </button>

                            {dateFilterActive && (
                                <button
                                    onClick={clearDateFilter}
                                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm whitespace-nowrap"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
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
                        <thead className="bg-[#1a1625] sticky top-0">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">S.No</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">User ID</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Mobile Number</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">OTP</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Created Date</th>
                                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {paginatedRecords.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-12 text-gray-400">No records found</td></tr>
                            ) : (
                                paginatedRecords.map((record, idx) => (
                                    <tr key={record.Id} className="hover:bg-white/5">
                                        <td className="px-4 py-4">{startIndex + idx + 1}</td>
                                        <td className="px-4 py-4"><CopyableField value={record.UserId || record.userId || 'N/A'} label="User ID" /></td>
                                        <td className="px-4 py-4"><CopyableField value={record.MobileNumber} label="Mobile" /></td>
                                        <td className="px-4 py-4">
                                            <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 font-semibold tracking-wider">
                                                {record.OTP}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-400">{formatDate(record.CreatedDate)}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center gap-4">
                                                <button onClick={() => openEditModal(record)} title="Edit"><Edit className="w-4 h-4 text-green-400" /></button>
                                                <button onClick={() => handleDelete(record)} title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm">
                    <p className="text-gray-400">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
                    </p>

                    <div className="flex items-center gap-4">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-[#1a1625] border border-white/10 rounded-lg px-3 py-2"
                        >
                            {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
                        </select>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 hover:bg-white/10 rounded disabled:opacity-50">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-gray-400 px-4">Page {currentPage} of {totalPages || 1}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 hover:bg-white/10 rounded disabled:opacity-50">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)}>
                        <motion.div className="bg-[#1a1625] rounded-2xl w-full max-w-md p-6 border border-white/10" onClick={e => e.stopPropagation()}>
                            <h2 className="text-2xl font-semibold mb-6">{isEditMode ? 'Edit Static OTP' : 'Add New Static OTP'}</h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Mobile Number</label>
                                    <input type="text" value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl" placeholder="910000000000" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">OTP</label>
                                    <input type="text" maxLength={6} value={formData.otp} onChange={e => setFormData({ ...formData, otp: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-mono" placeholder="123456" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setModalOpen(false)} className="flex-1 py-3 border border-white/10 rounded-xl hover:bg-white/5">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-70">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast.open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 right-6 bg-zinc-900 border border-white/10 px-5 py-3 rounded-2xl shadow-2xl z-[100]"
                    >
                        <p className={toast.variant === 'success' ? 'text-green-400' : 'text-red-400'}>
                            {toast.message}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};