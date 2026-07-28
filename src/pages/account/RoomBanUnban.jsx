import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Loader2,
    ShieldX,
    ShieldCheck,
    Copy,
    Check,
    User,
    History,
    Ban as BanIcon,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showError, showWarning, showConfirm } from '../../utils/swalUtils';

// Duration values sent to the API, per InsertBanForRoom spec
const DURATION_OPTIONS = [
    { value: '1 Hr', label: '1 Hr (1 Hour)' },
    { value: '2 Hr', label: '2 Hr (2 Hours)' },
    { value: '4 Hr', label: '4 Hr (4 Hours)' },
    { value: '1 Day', label: '1 Day (24 Hours)' },
    { value: '1 Week', label: '1 Week (7 Days)' },
];

// Copy to clipboard component
const CopyableUserId = ({ userId }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(userId);
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

// Normalize a user-search API response into a flat {userId, name, image} list
const normalizeSearchResults = (response) => {
    if (!response) return [];
    const isSuccess = response.status || response.Status;
    if (!isSuccess) return [];

    const listKey = Object.keys(response).find((key) => Array.isArray(response[key]));
    const rawList = listKey ? response[listKey] : (response.data || response.Data || []);

    return rawList
        .map((u) => ({
            userId: u.userId || u.UserId || u.id || u.Id,
            name: u.name || u.Name || u.userName || u.UserName || 'Unknown',
            image: u.image || u.Image || u.profileImage || u.ProfileImage,
        }))
        .filter((u) => u.userId);
};

// Small "search a user by ID, pick if multiple matches" block reused for ban & unban
const UserSearchBox = ({ searchInput, setSearchInput, searching, onSearch, results, selectedUser, onSelect }) => (
    <>
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Enter User ID..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
                />
            </div>
            <button
                onClick={onSearch}
                disabled={searching}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm text-white transition-colors flex items-center gap-2"
            >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
            </button>
        </div>

        {results.length > 1 && (
            <select
                value={selectedUser?.userId || ''}
                onChange={(e) => onSelect(results.find((u) => u.userId === e.target.value) || null)}
                className="w-full p-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
            >
                <option value="" disabled>Select matching user...</option>
                {results.map((u) => (
                    <option key={u.userId} value={u.userId}>{u.name} ({u.userId})</option>
                ))}
            </select>
        )}

        {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedUser.image ? (
                        <img src={selectedUser.image} alt={selectedUser.name} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-5 h-5 text-purple-400" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-white">{selectedUser.name}</p>
                    <CopyableUserId userId={selectedUser.userId} />
                </div>
            </div>
        )}
    </>
);

export const RoomBanUnban = () => {
    // Ban form state
    const [banSearchInput, setBanSearchInput] = useState('');
    const [banSearching, setBanSearching] = useState(false);
    const [banResults, setBanResults] = useState([]);
    const [banSelectedUser, setBanSelectedUser] = useState(null);
    const [banDuration, setBanDuration] = useState('');
    const [banReason, setBanReason] = useState('');
    const [banLoading, setBanLoading] = useState(false);

    // Unban form state
    const [unbanSearchInput, setUnbanSearchInput] = useState('');
    const [unbanSearching, setUnbanSearching] = useState(false);
    const [unbanResults, setUnbanResults] = useState([]);
    const [unbanSelectedUser, setUnbanSelectedUser] = useState(null);
    const [unbanLoading, setUnbanLoading] = useState(false);

    // Session-only activity log (there is no "list room banned users" API to load from)
    const [activityLog, setActivityLog] = useState([]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const pageSizeOptions = [20, 40, 100, 200, 300, 500];
    const totalPages = Math.ceil(activityLog.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLog = activityLog.slice(startIndex, startIndex + itemsPerPage);

    const runSearch = async (query, setResults, setSelected, setSearching) => {
        if (!query.trim()) {
            showWarning('Please enter a User ID to search');
            return;
        }
        setSelected(null);
        setSearching(true);
        try {
            const response = await userAPI.getAllUsersSearch(query.trim());
            const results = normalizeSearchResults(response);
            setResults(results);
            if (results.length === 0) {
                showWarning('No user found for this ID');
            } else if (results.length === 1) {
                setSelected(results[0]);
            }
        } catch (err) {
            console.error('User search error:', err);
            showError('Failed to search user. Please try again.');
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleBanSearch = () => runSearch(banSearchInput, setBanResults, setBanSelectedUser, setBanSearching);
    const handleUnbanSearch = () => runSearch(unbanSearchInput, setUnbanResults, setUnbanSelectedUser, setUnbanSearching);

    const addToActivityLog = (entry) => {
        setActivityLog((prev) => [{ id: `${Date.now()}-${prev.length}`, ...entry }, ...prev]);
        setCurrentPage(1);
    };

    const handleBan = async () => {
        if (!banSelectedUser) {
            showWarning('Please search and select a user first');
            return;
        }
        if (!banDuration) {
            showWarning('Please select a ban duration');
            return;
        }
        if (!banReason.trim()) {
            showWarning('Please enter a ban reason');
            return;
        }

        const { isConfirmed } = await showConfirm({
            title: 'Ban User from Rooms?',
            text: `Ban ${banSelectedUser.name} (${banSelectedUser.userId}) for ${banDuration}?`,
            confirmButtonText: 'Yes, Ban',
            icon: 'warning',
        });
        if (!isConfirmed) return;

        setBanLoading(true);
        try {
            const response = await userAPI.insertBanForRoom(banSelectedUser.userId, banDuration, banReason.trim());
            const isSuccess = response?.status || response?.Status;
            if (isSuccess) {
                showSuccess(response?.message || response?.Message || 'User banned from rooms successfully!');
                addToActivityLog({
                    userId: banSelectedUser.userId,
                    name: banSelectedUser.name,
                    action: 'Banned',
                    detail: banDuration,
                    reason: banReason.trim(),
                    time: new Date().toLocaleString(),
                });
                setBanSearchInput('');
                setBanResults([]);
                setBanSelectedUser(null);
                setBanDuration('');
                setBanReason('');
            } else {
                showError(response?.message || response?.Message || 'Failed to ban user');
            }
        } catch (err) {
            console.error('Ban error:', err);
            showError('Failed to ban user. Please try again.');
        } finally {
            setBanLoading(false);
        }
    };

    const handleUnban = async () => {
        const userId = unbanSelectedUser?.userId || unbanSearchInput.trim();
        if (!userId) {
            showWarning('Please enter or search a User ID');
            return;
        }

        const { isConfirmed } = await showConfirm({
            title: 'Unban User from Rooms?',
            text: `Remove room ban for ${unbanSelectedUser?.name ? `${unbanSelectedUser.name} (${userId})` : userId}?`,
            confirmButtonText: 'Yes, Unban',
            icon: 'question',
        });
        if (!isConfirmed) return;

        setUnbanLoading(true);
        try {
            const response = await userAPI.deleteRoomBannedUser(userId);
            const isSuccess = response?.status || response?.Status;
            if (isSuccess) {
                showSuccess(response?.message || response?.Message || 'User unbanned from rooms successfully!');
                addToActivityLog({
                    userId,
                    name: unbanSelectedUser?.name || 'Unknown',
                    action: 'Unbanned',
                    detail: '-',
                    reason: '-',
                    time: new Date().toLocaleString(),
                });
                setUnbanSearchInput('');
                setUnbanResults([]);
                setUnbanSelectedUser(null);
            } else {
                showError(response?.message || response?.Message || 'Failed to unban user');
            }
        } catch (err) {
            console.error('Unban error:', err);
            showError('Failed to unban user. Please try again.');
        } finally {
            setUnbanLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 sm:gap-4"
            >
                <div className="p-3 bg-orange-500/20 rounded-lg">
                    <BanIcon className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Room Ban / Unban</h1>
                    <p className="text-gray-400">Search a user by ID, then ban or unban them from creating/joining rooms</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ban Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <ShieldX className="w-5 h-5 text-red-400" />
                        <h2 className="text-lg font-semibold text-white">Ban User</h2>
                    </div>

                    <UserSearchBox
                        searchInput={banSearchInput}
                        setSearchInput={setBanSearchInput}
                        searching={banSearching}
                        onSearch={handleBanSearch}
                        results={banResults}
                        selectedUser={banSelectedUser}
                        onSelect={setBanSelectedUser}
                    />

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">
                            Ban Duration <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={banDuration}
                            onChange={(e) => setBanDuration(e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                        >
                            <option value="" disabled>Select duration...</option>
                            {DURATION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">
                            Ban Reason <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value.slice(0, 500))}
                            placeholder="e.g. Creating spam rooms"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-red-500 resize-none h-24"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{banReason.length}/500 characters</p>
                    </div>

                    <button
                        onClick={handleBan}
                        disabled={banLoading || !banSelectedUser || !banDuration || !banReason.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600/30 disabled:text-gray-500 rounded-lg text-white font-medium transition-colors"
                    >
                        {banLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
                        Ban User
                    </button>
                </motion.div>

                {/* Unban Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <h2 className="text-lg font-semibold text-white">Unban User</h2>
                    </div>

                    <UserSearchBox
                        searchInput={unbanSearchInput}
                        setSearchInput={setUnbanSearchInput}
                        searching={unbanSearching}
                        onSearch={handleUnbanSearch}
                        results={unbanResults}
                        selectedUser={unbanSelectedUser}
                        onSelect={setUnbanSelectedUser}
                    />

                    <p className="text-xs text-gray-500">
                        You can also unban directly by User ID without searching first.
                    </p>

                    <button
                        onClick={handleUnban}
                        disabled={unbanLoading || (!unbanSelectedUser && !unbanSearchInput.trim())}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600/30 disabled:text-gray-500 rounded-lg text-white font-medium transition-colors"
                    >
                        {unbanLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Unban User
                    </button>
                </motion.div>
            </div>

            {/* Session activity log */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl overflow-hidden"
            >
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Session Activity</h2>
                    </div>
                    {activityLog.length > 0 && (
                        <DownloadExcelButton
                            data={activityLog.map((log, index) => ({ ...log, serialNumber: index + 1 }))}
                            columns={[
                                { key: 'serialNumber', header: 'S.No' },
                                { key: 'userId', header: 'User ID' },
                                { key: 'name', header: 'Name' },
                                { key: 'action', header: 'Action' },
                                { key: 'detail', header: 'Duration' },
                                { key: 'reason', header: 'Reason' },
                                { key: 'time', header: 'Time' },
                            ]}
                            filename={`room_ban_activity_${new Date().toISOString().split('T')[0]}.xlsx`}
                        />
                    )}
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1625] sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {activityLog.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                        No actions performed yet in this session
                                    </td>
                                </tr>
                            ) : (
                                paginatedLog.map((log, index) => (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-400">{startIndex + index + 1}</td>
                                        <td className="px-4 py-3"><CopyableUserId userId={log.userId} /></td>
                                        <td className="px-4 py-3 text-sm font-medium text-white">{log.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${log.action === 'Banned' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {log.action === 'Banned' ? <ShieldX className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-300">{log.detail}</td>
                                        <td className="px-4 py-3 text-sm text-orange-400">{log.reason}</td>
                                        <td className="px-4 py-3 text-sm text-gray-400">{log.time}</td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-white/10 flex items-center justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <p className="text-sm text-gray-400">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, activityLog.length)} of {activityLog.length} entries
                            </p>
                            <label className="flex items-center gap-2 text-sm text-gray-400">
                                Rows per page:
                                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500">
                                    {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
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
