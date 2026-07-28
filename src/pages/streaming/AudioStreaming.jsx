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
  Radio,
  Eye,
  ArrowLeft
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

// Get today's date in YYYY-MM-DD format in local timezone
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get current datetime in local timezone (YYYY-MM-DDTHH:mm:ss)
const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// Get start of today datetime in local timezone (YYYY-MM-DDT00:00:00)
const getStartOfToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00`;
};

// View More Detail Component
const ViewMoreDetail = ({ userId, userName, fromDate, toDate, onBack }) => {
  const [activeTab, setActiveTab] = useState('host');
  const [loading, setLoading] = useState(true);
  const [hostData, setHostData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [dateRange, setDateRange] = useState({ from: fromDate, to: toDate });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 40, 100, 200, 300, 500];

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'host') {
        const response = await userAPI.getAudioStreamingByUser(userId, dateRange.from, dateRange.to);
        if (response.status) {
          setHostData(response.data || []);
        }
      } else {
        const response = await userAPI.getRoomLogsByUser(userId, dateRange.from, dateRange.to);
        if (response.status) {
          setUserData(response.data || []);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (activeTab === 'host') {
        setHostData([]);
      } else {
        setUserData([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange]);

  const currentData = activeTab === 'host' ? hostData : userData;

  // Calculate date-wise total durations
  const dateWiseStats = useMemo(() => {
    const stats = {};

    currentData.forEach(item => {
      let dateKey;
      let durationStr;

      if (activeTab === 'host') {
        // Host data: StartDate format "2026-03-13T19:10:19"
        dateKey = item.StartDate ? item.StartDate.split('T')[0] : null;
        durationStr = item.LiveDuration;
      } else {
        // User data: created_Date format "2026-03-12 22:42:39"
        dateKey = item.created_Date ? item.created_Date.split(' ')[0] : null;
        durationStr = item.inRoomDuration;
      }

      if (!dateKey || !durationStr) return;

      // Parse duration string
      let totalMinutes = 0;
      let totalSeconds = 0;

      // Handle formats like "0 Minutes 5 Seconds", "29 Minutes 47 Seconds", "17 Minutes"
      const minMatch = durationStr.match(/(\d+)\s*Minutes?/i);
      const secMatch = durationStr.match(/(\d+)\s*Seconds?/i);

      if (minMatch) totalMinutes = parseInt(minMatch[1]) || 0;
      if (secMatch) totalSeconds = parseInt(secMatch[1]) || 0;

      if (!stats[dateKey]) {
        stats[dateKey] = { totalMinutes: 0, totalSeconds: 0, count: 0 };
      }

      stats[dateKey].totalMinutes += totalMinutes;
      stats[dateKey].totalSeconds += totalSeconds;
      stats[dateKey].count += 1;
    });

    // Convert excess seconds to minutes
    Object.keys(stats).forEach(date => {
      const extraMinutes = Math.floor(stats[date].totalSeconds / 60);
      stats[date].totalMinutes += extraMinutes;
      stats[date].totalSeconds = stats[date].totalSeconds % 60;
    });

    // Sort by date
    return Object.entries(stats)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, data]) => ({
        date,
        ...data,
        formattedDuration: `${data.totalMinutes} Minutes ${data.totalSeconds} Seconds`
      }));
  }, [currentData, activeTab]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(currentData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = currentData.slice(startIndex, startIndex + itemsPerPage);

  const handleDateFilter = () => {
    setCurrentPage(1);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading details...</p>
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
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <Radio className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Audio Streaming Details</h1>
            <p className="text-gray-400">{userName} ({userId})</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setActiveTab('host');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'host'
            ? 'bg-purple-600 text-white'
            : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
        >
          <Radio className="w-4 h-4" />
          As Host
        </button>
        <button
          onClick={() => {
            setActiveTab('user');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'user'
            ? 'bg-purple-600 text-white'
            : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
        >
          <Eye className="w-4 h-4" />
          As User
        </button>
      </div>

      {/* Date-wise Duration Stats */}
      {dateWiseStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {dateWiseStats.map((stat, index) => (
            <div key={stat.date} className="glass rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">{new Date(stat.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p className="text-lg font-bold text-yellow-400">{stat.formattedDuration}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.count} stream{stat.count > 1 ? 's' : ''}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Date Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Date Range:</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">From</span>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">To</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={handleDateFilter}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white transition-colors"
          >
            Apply Filter
          </button>
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
                {activeTab === 'host' ? (
                  <>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Date</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Time</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">End Time</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Room ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Host Name</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User Name</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Time</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">End Time</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'host' ? 9 : 10} className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">{startIndex + index + 1}</span>
                    </td>
                    {activeTab === 'host' ? (
                      <>
                        <td className="px-4 py-4"><span className="text-sm text-gray-300">{item.id}</span></td>
                        <td className="px-4 py-4"><CopyableUserId userId={item.userid} /></td>
                        <td className="px-4 py-4"><span className="text-sm text-white">{item.Name}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-green-400">{item.StartDate ? new Date(item.StartDate).toLocaleDateString() : 'N/A'}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-gray-400">{item.Start_Time}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-gray-400">{item.End_Time}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-blue-400">{item.Type}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-yellow-400">{item.LiveDuration}</span></td>
                        <td className="px-4 py-4">
                          <span className={`text-sm ${item.StreamStatus === 'Stream Ended' ? 'text-red-400' : 'text-green-400'}`}>
                            {item.StreamStatus}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-4"><span className="text-sm text-gray-300">{item.id}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-purple-400">{item.roomId}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-white">{item.hostName}</span></td>
                        <td className="px-4 py-4"><CopyableUserId userId={item.userId} /></td>
                        <td className="px-4 py-4"><span className="text-sm text-gray-300">{item.userName}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-gray-400">{item.startTime}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-gray-400">{item.endTime}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-yellow-400">{item.inRoomDuration}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-blue-400">{item.type}</span></td>
                      </>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {currentData.length > 0
              ? `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, currentData.length)} of ${currentData.length} entries`
              : 'No records to display'
            }
          </p>
          {totalPages >= 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                Rows per page:
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500">
                  {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-4">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const AudioStreaming = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [viewMoreUser, setViewMoreUser] = useState(null);

  // Search state
  const [searchInput, setSearchInput] = useState('');

  // Date filter states
  const [fromDate, setFromDate] = useState(getStartOfToday());
  const [toDate, setToDate] = useState(getCurrentDateTime());
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 40, 100, 200, 300, 500];

  const fetchRecords = async () => {
    try {
      setLoading(true);

      let response;
      if (dateFilterActive) {
        response = await userAPI.getAudioStreamingByDate(fromDate, toDate);
      } else {
        response = await userAPI.getAudioStreamingToday();
      }

      if (response.status) {
        setRecords(response.data || []);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [dateFilterActive]);

  // Filter records
  const filteredRecords = useMemo(() => {
    if (!searchInput.trim()) return records;

    const searchLower = searchInput.toLowerCase().trim();
    return records.filter(record => {
      const userId = String(record.userid || '').toLowerCase();
      const name = String(record.Name || '').toLowerCase();
      return userId.includes(searchLower) || name.includes(searchLower);
    });
  }, [records, searchInput]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const handleDateFilter = () => {
    setDateFilterActive(true);
    setCurrentPage(1);
    fetchRecords();
  };

  const clearDateFilter = () => {
    setFromDate(getStartOfToday());
    setToDate(getCurrentDateTime());
    setDateFilterActive(false);
    setCurrentPage(1);
    fetchRecords();
  };

  // Handle View More
  const handleViewMore = (record) => {
    // Use the current date range for view more, or default to today
    const from = dateFilterActive ? fromDate.split('T')[0] : getTodayDate();
    const to = dateFilterActive ? toDate.split('T')[0] : getTodayDate();

    setViewMoreUser({
      userId: record.userid,
      userName: record.Name,
      fromDate: from,
      toDate: to
    });
  };

  // Calculate stats
  const stats = useMemo(() => {
    return { total: records.length };
  }, [records]);

  if (viewMoreUser) {
    return (
      <ViewMoreDetail
        userId={viewMoreUser.userId}
        userName={viewMoreUser.userName}
        fromDate={viewMoreUser.fromDate}
        toDate={viewMoreUser.toDate}
        onBack={() => setViewMoreUser(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading audio streaming records...</p>
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
          <div className="p-3 bg-pink-500/20 rounded-lg">
            <Radio className="w-8 h-8 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Audio Streaming Details</h1>
            <p className="text-gray-400">Total {stats.total.toLocaleString()} records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRecords}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <DownloadExcelButton
            data={filteredRecords.map((record, index) => ({ ...record, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'id', header: 'ID' },
              { key: 'userId', header: 'User ID' },
              { key: 'name', header: 'Name' },
              { key: 'startTime', header: 'Start Time' },
              { key: 'endTime', header: 'End Time' },
              { key: 'type', header: 'Type' },
              { key: 'duration', header: 'Duration' },
              { key: 'status', header: 'Status' }
            ]}
            filename={`audio_streaming_${new Date().toISOString().split('T')[0]}.xlsx`}
            options={{ colWidths: [{ wch: 8 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 12 }] }}
          />
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
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 w-[170px]"
            />
            <span className="text-gray-400">-</span>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 w-[170px]"
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
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Time</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">End Time</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-gray-400">No Records Found</td>
                </tr>
              ) : (
                paginatedRecords.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4"><span className="text-sm text-gray-400">{startIndex + index + 1}</span></td>
                    <td className="px-4 py-4"><span className="text-sm text-gray-300">{record.id}</span></td>
                    <td className="px-4 py-4"><CopyableUserId userId={record.userid} /></td>
                    <td className="px-4 py-4"><span className="text-sm text-white">{record.Name}</span></td>
                    <td className="px-4 py-4"><span className="text-sm text-gray-400">{record.Start_Time}</span></td>
                    <td className="px-4 py-4"><span className="text-sm text-gray-400">{record.End_Time}</span></td>
                    <td className="px-4 py-4"><span className="text-sm text-blue-400">{record.Type}</span></td>
                    <td className="px-4 py-4"><span className="text-sm text-yellow-400">{record.LiveDuration}</span></td>
                    <td className="px-4 py-4">
                      <span className={`text-sm ${record.StreamStatus === 'Stream Ended' ? 'text-red-400' : 'text-green-400'}`}>
                        {record.StreamStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleViewMore(record)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View More
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
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {filteredRecords.length > 0
              ? `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filteredRecords.length)} of ${filteredRecords.length} entries`
              : 'No records to display'
            }
          </p>
          {totalPages >= 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                Rows per page:
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500">
                  {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-4">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
