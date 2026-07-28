import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Loader2,
    Phone,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    PhoneOff,
    Copy,
    Check,
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showError, showWarning } from '../../utils/swalUtils';

const STATIC_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%236b7280"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14"%3EUser%3C/text%3E%3C/svg%3E';

const CopyableId = ({ id }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(id);
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
            title="Click to copy"
        >
            {id}
            {copied ? (
                <Check className="w-3 h-3 text-green-400" />
            ) : (
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </button>
    );
};

const PersonCell = ({ image, name, id }) => (
    <div className="flex items-center gap-3">
        <img
            src={image || STATIC_IMAGE}
            alt={name}
            className="w-9 h-9 rounded-full object-cover shrink-0"
            onError={(e) => { e.target.src = STATIC_IMAGE; }}
        />
        <div>
            <p className="text-sm font-medium text-white">{name || 'Unknown'}</p>
            <CopyableId id={id} />
        </div>
    </div>
);

const TABS = [
    { id: 'Accepted', label: 'Accepted', icon: CheckCircle2, activeClasses: 'text-green-400 border-green-400 bg-green-500/10' },
    { id: 'Rejected', label: 'Rejected', icon: XCircle, activeClasses: 'text-red-400 border-red-400 bg-red-500/10' },
    { id: 'Declined', label: 'Declined', icon: PhoneOff, activeClasses: 'text-orange-400 border-orange-400 bg-orange-500/10' },
];

export const AgentCalls = () => {
    const [searchInput, setSearchInput] = useState('');
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [callData, setCallData] = useState({ Accepted: [], Rejected: [], Declined: [] });

    const [activeTab, setActiveTab] = useState('Accepted');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const pageSizeOptions = [20, 40, 100, 200, 300, 500];

    const handleSearch = async () => {
        if (!searchInput.trim()) {
            showWarning('Please enter a User ID to search');
            return;
        }

        setSearching(true);
        try {
            const response = await userAPI.getPrivateCallData(searchInput.trim());
            const isSuccess = response?.Status || response?.status;
            const data = response?.data || response?.Data || {};

            if (isSuccess) {
                setCallData({
                    Accepted: data.Accepted || [],
                    Rejected: data.Rejected || [],
                    Declined: data.Declined || [],
                });
            } else {
                showWarning(response?.Message || response?.message || 'No call data found for this User ID');
                setCallData({ Accepted: [], Rejected: [], Declined: [] });
            }
            setSearched(true);
            setActiveTab('Accepted');
            setCurrentPage(1);
        } catch (err) {
            console.error('Get private call data error:', err);
            showError('Failed to fetch call data. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    const currentData = callData[activeTab] || [];
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = currentData.slice(startIndex, startIndex + itemsPerPage);

    const isAccepted = activeTab === 'Accepted';

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Phone className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Agent Calls</h1>
                    <p className="text-gray-400">Search a User ID to view their private call history</p>
                </div>
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Enter User ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={searching}
                        className="px-5 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm text-white transition-colors flex items-center gap-2"
                    >
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Search
                    </button>
                </div>
            </motion.div>

            {!searched ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-12 text-center text-gray-400">
                    Enter a User ID above and click Search to view call history.
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl overflow-hidden">
                    {/* Tabs */}
                    <div className="overflow-x-auto border-b border-white/10">
                        <div className="flex min-w-max">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const count = callData[tab.id]?.length || 0;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? tab.activeClasses : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                        <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-xs">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end p-4 pb-0">
                        <DownloadExcelButton
                            data={paginatedData.map((item, index) => ({
                                serialNumber: startIndex + index + 1,
                                callerId: item.CallerId,
                                callerName: item.CallerName,
                                hostId: item.HostId,
                                hostName: item.HostName,
                                callType: item.CallType,
                                ...(isAccepted
                                    ? { callAmount: item.CallAmount, startTime: item.CallStartTime, endTime: item.CallEndTime, duration: item.CallDuration }
                                    : { status: item.CallStatus, coinsDeducted: item.CoinsDeducted }),
                                date: item.Created_Date,
                            }))}
                            columns={[
                                { key: 'serialNumber', header: 'S.No' },
                                { key: 'callerId', header: 'Caller ID' },
                                { key: 'callerName', header: 'Caller Name' },
                                { key: 'hostId', header: 'Host ID' },
                                { key: 'hostName', header: 'Host Name' },
                                { key: 'callType', header: 'Call Type' },
                                ...(isAccepted
                                    ? [
                                        { key: 'callAmount', header: 'Call Amount' },
                                        { key: 'startTime', header: 'Start Time' },
                                        { key: 'endTime', header: 'End Time' },
                                        { key: 'duration', header: 'Duration' },
                                    ]
                                    : [
                                        { key: 'status', header: 'Status' },
                                        { key: 'coinsDeducted', header: 'Coins Deducted' },
                                    ]),
                                { key: 'date', header: 'Date' },
                            ]}
                            filename={`agent_calls_${activeTab.toLowerCase()}_${searchInput.trim()}_${new Date().toISOString().split('T')[0]}.xlsx`}
                        />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto mt-2">
                        <table className="w-full">
                            <thead className="bg-[#1a1625] sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Caller</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Host</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Call Type</th>
                                    {isAccepted ? (
                                        <>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Call Amount</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Time</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">End Time</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Coins Deducted</th>
                                        </>
                                    )}
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAccepted ? 8 : 7} className="px-6 py-8 text-center text-gray-400">
                                            No {activeTab.toLowerCase()} calls found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((item, index) => (
                                        <motion.tr key={item.Id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-400">{startIndex + index + 1}</td>
                                            <td className="px-4 py-3">
                                                <PersonCell image={item.CallerImage} name={item.CallerName} id={item.CallerId} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <PersonCell image={item.HostImage} name={item.HostName} id={item.HostId} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                                                    {item.CallType}
                                                </span>
                                            </td>
                                            {isAccepted ? (
                                                <>
                                                    <td className="px-4 py-3 text-sm text-green-400 font-medium">{item.CallAmount}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-300">{item.CallStartTime}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-300">{item.CallEndTime}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-300">{item.CallDuration}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${activeTab === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                                                            }`}>
                                                            {item.CallStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-orange-400">{item.CoinsDeducted}</td>
                                                </>
                                            )}
                                            <td className="px-4 py-3 text-sm text-gray-400">{item.Created_Date}</td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages >= 1 && (
                        <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <p className="text-sm text-gray-400">
                                    Showing {currentData.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, currentData.length)} of {currentData.length} entries
                                </p>
                                <label className="flex items-center gap-2 text-sm text-gray-400">
                                    Rows per page:
                                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500">
                                        {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
                                    </select>
                                </label>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-400 px-4">Page {currentPage} of {totalPages || 1}</span>
                                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};
