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
  Flag,
  MessageSquare,
  Star,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';

// Static placeholder image
const STATIC_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23374151"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%239CA3AF" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

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

// Image Modal
const ImageModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={imageUrl}
          alt="Feedback"
          className="max-w-full max-h-[80vh] rounded-lg object-contain"
          onError={(e) => {
            e.target.src = STATIC_IMAGE;
          }}
        />
      </motion.div>
    </div>
  );
};

export const Reports = () => {
  const [activeTab, setActiveTab] = useState('reportFeedback');
  const [loading, setLoading] = useState(true);
  const [reportFeedback, setReportFeedback] = useState([]);
  const [agentFeedback, setAgentFeedback] = useState([]);
  const [userReports, setUserReports] = useState([]);

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

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'reportFeedback') {
        const response = await userAPI.getReportFeedback();
        if (response.status) {
          setReportFeedback(response.reportFeedbackList || []);
        }
      } else if (activeTab === 'agentFeedback') {
        const response = await userAPI.getAgentFeedback();
        if (response.status) {
          setAgentFeedback(response.feedbackList || []);
        }
      } else {
        const response = await userAPI.getUserReports();
        if (response.status) {
          setUserReports(response.reports || []);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (activeTab === 'reportFeedback') setReportFeedback([]);
      else if (activeTab === 'agentFeedback') setAgentFeedback([]);
      else setUserReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Get current data based on active tab
  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'reportFeedback': return reportFeedback;
      case 'agentFeedback': return agentFeedback;
      case 'userReports': return userReports;
      default: return [];
    }
  }, [activeTab, reportFeedback, agentFeedback, userReports]);

  // Parse date from different formats
  const parseDate = (dateString) => {
    if (!dateString) return null;

    // Format: "13-10-2025 12:28:08" or "2026-02-26 17:37:50" or "2025-11-28T11:09:07.653"
    if (dateString.includes('T')) {
      return new Date(dateString);
    } else if (dateString.includes('-')) {
      const parts = dateString.split(/[-\s:]/);
      if (parts[0].length === 4) {
        // Format: "2026-02-26 17:37:50"
        return new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        // Format: "13-10-2025 12:28:08"
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
    return new Date(dateString);
  };

  // Check if date is in range
  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    const itemDate = parseDate(dateString);
    if (!itemDate) return true;

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    itemDate.setHours(0, 0, 0, 0);
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(0, 0, 0, 0);

    if (from && to) return itemDate >= from && itemDate <= to;
    else if (from) return itemDate >= from;
    else if (to) return itemDate <= to;
    return true;
  };

  // Filter data
  const filteredData = useMemo(() => {
    return currentData.filter(item => {
      // Search filter
      const searchLower = searchInput.toLowerCase().trim();
      let matchesSearch = !searchInput;

      if (activeTab === 'reportFeedback') {
        matchesSearch = !searchInput || (
          String(item.userId || '').toLowerCase().includes(searchLower) ||
          String(item.message || '').toLowerCase().includes(searchLower) ||
          String(item.id || '').toLowerCase().includes(searchLower)
        );
      } else if (activeTab === 'agentFeedback') {
        matchesSearch = !searchInput || (
          String(item.userId || '').toLowerCase().includes(searchLower) ||
          String(item.agentId || '').toLowerCase().includes(searchLower) ||
          String(item.description || '').toLowerCase().includes(searchLower)
        );
      } else {
        matchesSearch = !searchInput || (
          String(item.userId || '').toLowerCase().includes(searchLower) ||
          String(item.reporterId || '').toLowerCase().includes(searchLower) ||
          String(item.report || '').toLowerCase().includes(searchLower)
        );
      }

      // Date filter
      let dateField;
      if (activeTab === 'reportFeedback') dateField = item.date;
      else if (activeTab === 'agentFeedback') dateField = item.created_Date;
      else dateField = item.created_Date;

      const matchesDate = !dateFilterActive || isDateInRange(dateField);

      return matchesSearch && matchesDate;
    });
  }, [currentData, searchInput, dateFilterActive, fromDate, toDate, activeTab]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
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

  // Handle image click
  const handleImageClick = (imageUrl) => {
    if (imageUrl && imageUrl !== STATIC_IMAGE) {
      setSelectedImage(imageUrl);
      setImageModalOpen(true);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    return { total: currentData.length };
  }, [currentData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => {
          setImageModalOpen(false);
          setSelectedImage('');
        }}
        imageUrl={selectedImage}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"

      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-lg">
            <Flag className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Reports & Feedback</h1>
            <p className="text-gray-400">Total {stats.total.toLocaleString()} records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <DownloadExcelButton
            data={filteredData.map((item, index) => ({ ...item, serialNumber: index + 1 }))}
            columns={
              activeTab === 'reportFeedback'
                ? [
                  { key: 'serialNumber', header: 'S.No' },
                  { key: 'id', header: 'ID' },
                  { key: 'userId', header: 'User ID' },
                  { key: 'message', header: 'Feedback' },
                  { key: 'feedbackImage', header: 'Image URL' },
                  { key: 'date', header: 'Created Date' }
                ]
                : activeTab === 'agentFeedback'
                  ? [
                    { key: 'serialNumber', header: 'S.No' },
                    { key: 'userId', header: 'User ID' },
                    { key: 'agentId', header: 'Agent ID' },
                    { key: 'ratings', header: 'Ratings' },
                    { key: 'description', header: 'Description' },
                    { key: 'created_Date', header: 'Created Date' }
                  ]
                  : [
                    { key: 'serialNumber', header: 'S.No' },
                    { key: 'userId', header: 'User ID' },
                    { key: 'reporterId', header: 'Reporter ID' },
                    { key: 'report', header: 'Report' },
                    { key: 'created_Date', header: 'Created Date' }
                  ]
            }
            filename={`${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`}
            options={{ colWidths: [{ wch: 8 }, { wch: 16 }, { wch: 18 }, { wch: 34 }, { wch: 20 }] }}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            setActiveTab('reportFeedback');
            setCurrentPage(1);
            setSearchInput('');
            clearDateFilter();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'reportFeedback'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
        >
          <MessageSquare className="w-4 h-4" />
          User Report & Feedback
        </button>
        <button
          onClick={() => {
            setActiveTab('agentFeedback');
            setCurrentPage(1);
            setSearchInput('');
            clearDateFilter();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'agentFeedback'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
        >
          <Star className="w-4 h-4" />
          Feedback On Agent
        </button>
        <button
          onClick={() => {
            setActiveTab('userReports');
            setCurrentPage(1);
            setSearchInput('');
            clearDateFilter();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'userReports'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
        >
          <Flag className="w-4 h-4" />
          User Reports
        </button>
      </div>

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
              placeholder={
                activeTab === 'reportFeedback'
                  ? "Search by User ID, Name, Type, Message..."
                  : activeTab === 'agentFeedback'
                    ? "Search by User ID, Agent ID, Description..."
                    : "Search by User ID, Reporter ID, Report..."
              }
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
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                {activeTab === 'reportFeedback' ? (
                  <>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Feedback</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Image</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created Date</th>
                  </>
                ) : activeTab === 'agentFeedback' ? (
                  <>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Agent ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ratings</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created Date</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reporter ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Report</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created Date</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'reportFeedback' ? 6 : activeTab === 'agentFeedback' ? 6 : 5} className="px-6 py-8 text-center text-gray-400">
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
                    {activeTab === 'reportFeedback' ? (
                      <>
                        <td className="px-4 py-4"><span className="text-sm text-gray-300 font-mono">{item.id}</span></td>
                        <td className="px-4 py-4"><CopyableUserId userId={item.userId} /></td>
                        <td className="px-4 py-4"><span className="text-sm text-gray-300 max-w-xs truncate block">{item.message || 'N/A'}</span></td>
                        <td className="px-4 py-4">
                          <div
                            className="w-12 h-12 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleImageClick(item.feedbackImage)}
                          >
                            <img
                              src={item.feedbackImage || STATIC_IMAGE}
                              alt="Feedback"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = STATIC_IMAGE;
                                e.target.onerror = null;
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4"><span className="text-sm text-gray-400">{item.date || 'N/A'}</span></td>
                      </>
                    ) : activeTab === 'agentFeedback' ? (
                      <>
                        <td className="px-4 py-4"><CopyableUserId userId={item.userId} /></td>
                        <td className="px-4 py-4"><CopyableUserId userId={item.agentId} /></td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-yellow-400 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {item.ratings || '0'}
                          </span>
                        </td>
                        <td className="px-4 py-4"><span className="text-sm text-gray-300">{item.description || 'N/A'}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-gray-400">{item.created_Date || 'N/A'}</span></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-4"><CopyableUserId userId={item.userId} /></td>
                        <td className="px-4 py-4"><CopyableUserId userId={item.reporterId} /></td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-red-400 font-medium">{item.report || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-4"><span className="text-sm text-gray-400">{item.created_Date || 'N/A'}</span></td>
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
            {filteredData.length > 0
              ? `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filteredData.length)} of ${filteredData.length} entries`
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
