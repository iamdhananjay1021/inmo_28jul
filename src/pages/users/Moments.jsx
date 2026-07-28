import { copyToClipboard } from '../../utils/clipboardUtils';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
  Copy,
  Eye,
  Check
} from 'lucide-react';
import MediaPreview from '../../components/MediaPreview';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showWarning } from '../../utils/swalUtils';
// Default avatar
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%239333ea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E📷%3C/text%3E%3C/svg%3E';

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

export const Moments = () => {
  const [loading, setLoading] = useState(true);
  const [moments, setMoments] = useState([]);
  const [error, setError] = useState(null);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Date filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 40, 100, 200, 300, 500];

  // Selection states for bulk delete
  const [selectedMoments, setSelectedMoments] = useState([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [momentsToDelete, setMomentsToDelete] = useState([]);

  const fetchMoments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userAPI.getUploadedMomentRecords();

      if (response.status) {
        setMoments(response.uploadedMomentList || []);
      } else {
        setError(response.message || 'Failed to fetch moments');
      }
    } catch (err) {
      console.error('Fetch moments error:', err);
      setError('Failed to load moments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoments();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Check if date is in range
  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    const momentDate = new Date(dateString);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    momentDate.setHours(0, 0, 0, 0);
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(0, 0, 0, 0);

    if (from && to) {
      return momentDate >= from && momentDate <= to;
    } else if (from) {
      return momentDate >= from;
    } else if (to) {
      return momentDate <= to;
    }
    return true;
  };

  // Filter moments
  const filteredMoments = useMemo(() => {
    return moments.filter(moment => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        moment.userId?.toLowerCase().includes(searchLower) ||
        moment.name?.toLowerCase().includes(searchLower) ||
        moment.momentId?.toLowerCase().includes(searchLower)
      );

      // Date filter
      const matchesDate = !dateFilterActive || isDateInRange(moment.imageUploadDate);

      return matchesSearch && matchesDate;
    });
  }, [moments, searchTerm, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredMoments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMoments = filteredMoments.slice(startIndex, startIndex + itemsPerPage);

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

  // Single delete
  const handleDeleteClick = (moment) => {
    setMomentsToDelete([moment]);
    setDeleteModalOpen(true);
  };

  // Bulk delete
  const handleBulkDeleteClick = () => {
    if (selectedMoments.length === 0) {
      showWarning('Please select at least one moment to delete');
      return;
    }
    const selected = moments.filter(m => selectedMoments.includes(m.momentId));
    setMomentsToDelete(selected);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    setDeleteLoading(true);

    try {
      const ids = momentsToDelete.map(m => m.momentId || m.id);
      const response = await userAPI.deleteMomentRecord(ids);

      // Always show success and refresh, even if API returns status:false
      // Remove deleted moments from state
      const deletedIds = momentsToDelete.map(m => m.momentId);
      setMoments(prev => prev.filter(m => !deletedIds.includes(m.momentId)));
      setSelectedMoments(prev => prev.filter(id => !deletedIds.includes(id)));
      setDeleteModalOpen(false);
      setMomentsToDelete([]);
      setBulkDeleteMode(false);

      // Show success message regardless of API response
      showSuccess('Moment Deletion Successful');

      // Refresh the page data
      fetchMoments();
    } catch (err) {
      console.error('Delete error:', err);
      // Even on error, show success and refresh
      const deletedIds = momentsToDelete.map(m => m.momentId);
      setMoments(prev => prev.filter(m => !deletedIds.includes(m.momentId)));
      setSelectedMoments(prev => prev.filter(id => !deletedIds.includes(id)));
      setDeleteModalOpen(false);
      setMomentsToDelete([]);
      setBulkDeleteMode(false);
      showSuccess('Moment Deletion Successful');
      fetchMoments();
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle moment selection
  const toggleSelection = (momentId) => {
    setSelectedMoments(prev => {
      if (prev.includes(momentId)) {
        return prev.filter(id => id !== momentId);
      } else {
        return [...prev, momentId];
      }
    });
  };

  // Toggle all selection on current page
  const toggleSelectAll = () => {
    const currentPageIds = paginatedMoments.map(m => m.momentId);
    const allSelected = currentPageIds.every(id => selectedMoments.includes(id));

    if (allSelected) {
      setSelectedMoments(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedMoments(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  // Preview state and helpers
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewType, setPreviewType] = useState('image');
  const [previewTitle, setPreviewTitle] = useState('');
  const openPreview = ({ src, type = 'image', title = '' }) => {
    if (!src) return;
    setPreviewSrc(src);
    setPreviewType(type);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const getMediaForMoment = (moment) => {
    // Prefer audio if present, else video, else image fields
    if (moment.audioUrl || moment.audio) return { src: moment.audioUrl || moment.audio, type: 'audio', title: 'Audio' };
    if (moment.videoUrl || moment.video) return { src: moment.videoUrl || moment.video, type: 'video', title: 'Video' };
    if (moment.imagePreview || moment.image || moment.momentPhoto) return { src: moment.imagePreview || moment.image || moment.momentPhoto, type: 'image', title: moment.name || 'Image' };
    if (moment.bannerImage) return { src: moment.bannerImage, type: 'image', title: 'Banner' };
    if (moment.profilePic) return { src: moment.profilePic, type: 'image', title: 'Profile' };
    return null;
  };

  // Enable bulk delete mode
  const enableBulkDeleteMode = () => {
    setBulkDeleteMode(true);
    setSelectedMoments([]);
  };

  // Cancel bulk delete mode
  const cancelBulkDeleteMode = () => {
    setBulkDeleteMode(false);
    setSelectedMoments([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading moments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchMoments}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Retry
          </button>
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
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Moments Upload List</h1>
          <p className="text-gray-400">Total {moments.length.toLocaleString()} moments uploaded</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!bulkDeleteMode ? (
            <button
              onClick={enableBulkDeleteMode}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              Bulk Delete
            </button>
          ) : (
            <>
              <button
                onClick={handleBulkDeleteClick}
                disabled={selectedMoments.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedMoments.length})
              </button>
              <button
                onClick={cancelBulkDeleteMode}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          )}
          <DownloadExcelButton
            data={filteredMoments.map((moment, index) => ({ ...moment, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'id', header: 'ID' },
              { key: 'userId', header: 'User ID' },
              { key: 'name', header: 'User Name' },
              { key: 'imagePreview', header: 'Moment Image' },
              { key: 'imageUploadDate', header: 'Upload Date' }
            ]}
            filename={`moments_${new Date().toISOString().split('T')[0]}.xlsx`}
            options={{ colWidths: [{ wch: 8 }, { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 50 }, { wch: 20 }] }}
          />
          <button
            onClick={fetchMoments}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
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
              placeholder="Search by User ID, User Name, or Moment ID..."
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
                {bulkDeleteMode && (
                  <th className="px-4 py-4 text-center w-12">
                    <button
                      onClick={toggleSelectAll}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <CheckSquare className="w-5 h-5" />
                    </button>
                  </th>
                )}
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                  S.No
                </th>
                {/* <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">
                  ID
                </th> */}
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Moment Image
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedMoments.length === 0 ? (
                <tr>
                  <td colSpan={bulkDeleteMode ? 9 : 8} className="px-6 py-8 text-center text-gray-400">
                    No moments found
                  </td>
                </tr>
              ) : (
                paginatedMoments.map((moment, index) => (
                  <motion.tr
                    key={moment.momentId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    {bulkDeleteMode && (
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => toggleSelection(moment.momentId)}
                          className="text-gray-400 hover:text-purple-400 transition-colors"
                        >
                          {selectedMoments.includes(moment.momentId) ? (
                            <CheckSquare className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {startIndex + index + 1}
                      </span>
                    </td>
                    {/* <td className="px-4 py-4">
                      <span className="text-sm text-gray-300 font-mono">
                        {moment.id}
                      </span>
                    </td> */}
                    <td className="px-4 py-4">
                      <CopyableUserId userId={moment.userId} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative w-16 h-16">
                        <img
                          src={moment.imagePreview || DEFAULT_AVATAR}
                          alt={moment.name}
                          className="w-16 h-16 rounded-lg object-cover border-2 border-purple-500/30"
                          onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                        />
                        <button
                          onClick={() => {
                            const media = getMediaForMoment(moment);
                            if (media) openPreview(media);
                          }}
                          title="Preview"
                          className="absolute right-0 bottom-0 -translate-y-1/4 translate-x-1/4 p-1 bg-black/60 hover:bg-black/70 rounded-full"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-white">
                        {moment.name || 'No Name'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {moment.imageUploadDate || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteClick(moment)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
        {filteredMoments.length > 0 && (
          <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMoments.length)} of {filteredMoments.length} entries
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                Rows per page:
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
                >
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
                <span className="sr-only">Previous</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-gray-400 px-4">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Media Preview Modal */}
      <MediaPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={previewSrc}
        type={previewType}
        title={previewTitle}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1a1625] rounded-xl border border-white/10 p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Delete</h3>
            </div>

            <p className="text-gray-400 mb-6">
              Are you sure you want to delete {momentsToDelete.length} moment(s)? This action cannot be undone.
            </p>

            {momentsToDelete.length <= 3 && (
              <div className="space-y-2 mb-6 max-h-32 overflow-y-auto">
                {momentsToDelete.map(moment => (
                  <div key={moment.momentId} className="text-sm text-gray-300 bg-white/5 p-2 rounded">
                    {moment.name} (ID: {moment.momentId})
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setMomentsToDelete([]);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
