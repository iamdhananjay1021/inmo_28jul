import { copyToClipboard } from '../../utils/clipboardUtils';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Building2,
  Shield,
  Mic,
  ArrowLeft,
  XCircle
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import MediaPreview from '../../components/MediaPreview';
import { showSuccess, showError, showConfirm } from '../../utils/swalUtils';

// Default avatar
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%239333ea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E👤%3C/text%3E%3C/svg%3E';

const CopyableUserId = ({ userId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (!userId) return;
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
      {userId || '-'}
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
};

export const AdminAgencyHost = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hierarchy Navigation State
  // currentLevel: 'admins' | 'agencies' | 'hosts'
  const [currentLevel, setCurrentLevel] = useState('admins');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [listData, setListData] = useState([]);

  // Search & Date Filter
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 40, 100, 200, 300, 500];

  // Action loading state
  const [actionLoading, setActionLoading] = useState({});

  // Image Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const openPreview = (src, title = 'Profile Photo') => {
    if (!src) return;
    setPreviewSrc(src);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  // Fetch Level 1: Approved Admins (Default: {})
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentLevel('admins');
      setSelectedAdmin(null);
      setSelectedAgency(null);
      setCurrentPage(1);

      const response = await userAPI.getAdminAgencyHostLinking({});
      const isSuccess = response && (response.Status || response.status);

      if (isSuccess) {
        setListData(response.data || response.Data || response.Requests || []);
      } else {
        setError(response.Message || response.message || 'Failed to fetch admins data');
        setListData([]);
      }
    } catch (err) {
      console.error('Fetch admins error:', err);
      setError('Failed to load admins. Please try again.');
      setListData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Level 2: Agencies under Admin ({ AdminId })
  const fetchAgenciesForAdmin = async (admin) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentLevel('agencies');
      setSelectedAdmin(admin);
      setSelectedAgency(null);
      setCurrentPage(1);

      const adminId = admin.AdminId || admin.UserId || admin.agencyAdminId;
      const payload = { AdminId: String(adminId) };

      const response = await userAPI.getAdminAgencyHostLinking(payload);
      const isSuccess = response && (response.Status || response.status);

      if (isSuccess) {
        setListData(response.data || response.Data || []);
      } else {
        setError(response.Message || response.message || 'Failed to fetch agencies under this admin');
        setListData([]);
      }
    } catch (err) {
      console.error('Fetch agencies error:', err);
      setError('Failed to load agencies. Please try again.');
      setListData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Level 3: Hosts under Agency ({ AgencyId })
  const fetchHostsForAgency = async (agency) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentLevel('hosts');
      setSelectedAgency(agency);
      setCurrentPage(1);

      const agencyId = agency.AgencyCode || agency.AgencyId || agency.UserId;
      const payload = { AgencyId: String(agencyId) };

      const response = await userAPI.getAdminAgencyHostLinking(payload);
      const isSuccess = response && (response.Status || response.status);

      if (isSuccess) {
        setListData(response.data || response.Data || []);
      } else {
        setError(response.Message || response.message || 'Failed to fetch hosts under this agency');
        setListData([]);
      }
    } catch (err) {
      console.error('Fetch hosts error:', err);
      setError('Failed to load hosts. Please try again.');
      setListData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Reject Handler (same API as Requests section)
  const handleReject = async (item) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Rejection',
      text: 'Are you sure you want to reject this record?',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
    });
    if (!isConfirmed) return;

    const userId = item.UserId || item.userId;
    const statusType = currentLevel === 'admins' ? 'Admin' :
      currentLevel === 'agencies' ? 'Agency' : 'Host';

    setActionLoading(prev => ({ ...prev, [`${userId}-reject`]: true }));
    try {
      const response = await userAPI.approveRejectRequest(userId, statusType, 'Rejected');
      if (response && (response.status || response.Status)) {
        showSuccess(response.message || 'Rejected successfully');
        if (currentLevel === 'admins') fetchAdmins();
        else if (currentLevel === 'agencies') fetchAgenciesForAdmin(selectedAdmin);
        else fetchHostsForAgency(selectedAgency);
      } else {
        showError(response?.message || 'Failed to reject');
      }
    } catch (err) {
      console.error('Reject error:', err);
      showError('Failed to reject. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${userId}-reject`]: false }));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 100);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  // Filtered List for Current Level
  const filteredList = useMemo(() => {
    let result = listData;

    // Search filter across all properties
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return Object.values(item).some(val => val && String(val).toLowerCase().includes(searchLower));
      });
    }

    // Date range filter
    if (dateFilterActive && (fromDate || toDate)) {
      result = result.filter((item) => isDateInRange(item.Created_Date || item.created_date || item.createdAt));
    }

    return result;
  }, [listData, searchTerm, dateFilterActive, fromDate, toDate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredList.slice(startIndex, startIndex + itemsPerPage);

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

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1">
            Admin Agency Host Management
          </h1>
          {/* Interactive Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 flex-wrap">
            <button
              onClick={fetchAdmins}
              className={`hover:text-purple-400 transition-colors flex items-center gap-1 ${currentLevel === 'admins' ? 'text-purple-400 font-semibold' : ''}`}
            >
              <Shield className="w-4 h-4" />
              <span>Approved Admins</span>
            </button>

            {(currentLevel === 'agencies' || currentLevel === 'hosts') && selectedAdmin && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <button
                  onClick={() => fetchAgenciesForAdmin(selectedAdmin)}
                  className={`hover:text-pink-400 transition-colors flex items-center gap-1 ${currentLevel === 'agencies' ? 'text-pink-400 font-semibold' : ''}`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Agencies under {selectedAdmin.UserName || selectedAdmin.UserId}</span>
                </button>
              </>
            )}

            {currentLevel === 'hosts' && selectedAgency && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <span className="text-orange-400 font-semibold flex items-center gap-1">
                  <Mic className="w-4 h-4" />
                  <span>Hosts under {selectedAgency.AgencyName || selectedAgency.AgencyCode}</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentLevel !== 'admins' && (
            <button
              onClick={() => {
                if (currentLevel === 'hosts') {
                  fetchAgenciesForAdmin(selectedAdmin);
                } else {
                  fetchAdmins();
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <button
            onClick={() => {
              if (currentLevel === 'admins') fetchAdmins();
              else if (currentLevel === 'agencies') fetchAgenciesForAdmin(selectedAdmin);
              else if (currentLevel === 'hosts') fetchHostsForAgency(selectedAgency);
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-4 rounded-xl space-y-4 border border-purple-500/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${currentLevel}...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-purple-500/20 rounded-lg focus:outline-none focus:border-purple-500 text-sm text-white placeholder-gray-500"
            />
          </div>

          {/* From Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-purple-500/20 rounded-lg focus:outline-none focus:border-purple-500 text-sm text-white"
            />
          </div>

          {/* To Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-purple-500/20 rounded-lg focus:outline-none focus:border-purple-500 text-sm text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDateFilter}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Filter Date
            </button>
            {dateFilterActive && (
              <button
                onClick={clearDateFilter}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Level Header & Export */}
        <div className="flex items-center justify-between pt-2 border-t border-purple-500/10 text-sm">
          <div className="text-gray-400">
            Showing <span className="text-purple-400 font-semibold">{filteredList.length}</span> {currentLevel}
          </div>
          <DownloadExcelButton
            data={filteredList}
            filename={`${currentLevel}_list`}
            sheetName={currentLevel.toUpperCase()}
          />
        </div>
      </motion.div>

      {/* Main Table Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl border border-purple-500/20 overflow-hidden"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-3" />
            <p className="text-sm">Loading {currentLevel} data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 space-y-3">
            <p className="text-base">{error}</p>
            <button
              onClick={() => {
                if (currentLevel === 'admins') fetchAdmins();
                else if (currentLevel === 'agencies') fetchAgenciesForAdmin(selectedAdmin);
                else fetchHostsForAgency(selectedAgency);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
            >
              Retry Loading
            </button>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No {currentLevel} records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-500/20 bg-purple-500/10 text-xs font-semibold uppercase text-purple-300">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Profile</th>
                  <th className="px-4 py-3">User Name</th>
                  <th className="px-4 py-3">User ID</th>

                  {currentLevel === 'agencies' && (
                    <>
                      <th className="px-4 py-3">Agency Name</th>
                      <th className="px-4 py-3">Agency Code</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Mobile</th>
                    </>
                  )}

                  {currentLevel === 'hosts' && (
                    <th className="px-4 py-3">Agency Code</th>
                  )}

                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10 text-sm">
                {paginatedData.map((item, index) => {
                  const itemImg = item.ProfilePhoto || item.profilePhoto || item.image || item.Image;
                  return (
                    <motion.tr
                      key={item.Id || item.UserId || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-purple-500/5 transition-colors"
                    >
                      <td className="px-4 py-4 text-gray-400">
                        {startIndex + index + 1}
                      </td>

                      {/* Profile Image */}
                      <td className="px-4 py-4">
                        <img
                          src={itemImg || DEFAULT_AVATAR}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover border border-purple-500/30 cursor-pointer"
                          onClick={() => openPreview(itemImg || DEFAULT_AVATAR, item.UserName || item.AgencyName || 'Profile Photo')}
                          onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                        />
                      </td>

                      {/* User Name */}
                      <td className="px-4 py-4 font-medium text-white">
                        {item.UserName || item.Name || item.AgencyName || '-'}
                      </td>

                      {/* User ID */}
                      <td className="px-4 py-4">
                        <CopyableUserId userId={item.UserId || item.Id} />
                      </td>

                      {/* Agency Specific Columns */}
                      {currentLevel === 'agencies' && (
                        <>
                          <td className="px-4 py-4 text-pink-300 font-medium">
                            {item.AgencyName || '-'}
                          </td>
                          <td className="px-4 py-4 font-mono text-purple-300">
                            {item.AgencyCode || '-'}
                          </td>
                          <td className="px-4 py-4 text-gray-300">
                            {item.AgencyLocation || '-'}
                          </td>
                          <td className="px-4 py-4 text-gray-300">
                            {item.AgencyNumber || '-'}
                          </td>
                        </>
                      )}

                      {/* Host Specific Columns */}
                      {currentLevel === 'hosts' && (
                        <td className="px-4 py-4 font-mono text-orange-300">
                          {item.AgencyCode || item.HostAgencyCode || '-'}
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          {item.Status || 'Approved'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-4 text-xs text-gray-400">
                        {item.Created_Date || item.created_date || item.CreatedAt || '-'}
                      </td>

                      {/* Actions: Reject + Drill-down View */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Reject Button - visible for all levels */}
                          <button
                            onClick={() => handleReject(item)}
                            disabled={actionLoading[`${item.UserId || item.userId}-reject`]}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all shadow-md hover:shadow-red-500/20"
                            title="Reject"
                          >
                            {actionLoading[`${item.UserId || item.userId}-reject`] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            Reject
                          </button>

                          {/* View Agencies - only for Admins level */}
                          {currentLevel === 'admins' && (
                            <button
                              onClick={() => fetchAgenciesForAdmin(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-all shadow-md hover:shadow-purple-500/20"
                            >
                              <Building2 className="w-3.5 h-3.5" />
                              View Agencies
                            </button>
                          )}

                          {/* View Hosts - only for Agencies level */}
                          {currentLevel === 'agencies' && (
                            <button
                              onClick={() => fetchHostsForAgency(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium rounded-lg transition-all shadow-md hover:shadow-pink-500/20"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              View Hosts
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-purple-500/20 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredList.length)} of{' '}
                <span className="text-white font-medium">{filteredList.length}</span> entries
              </span>
              <label className="flex items-center gap-2 text-gray-400">
                Rows per page:
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-[#1a1625] border border-purple-500/20 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
                >
                  {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 px-2">
                Page <span className="text-white font-medium">{currentPage}</span> of{' '}
                <span className="text-white font-medium">{totalPages || 1}</span>
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Media Preview Modal */}
      <MediaPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={previewSrc}
        title={previewTitle}
      />
    </div>
  );
};