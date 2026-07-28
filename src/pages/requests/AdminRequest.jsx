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
  UserCog,
  CheckCircle,
  XCircle,
  Trash2,
  UserPlus,
  X
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showError, showConfirm, showWarning } from '../../utils/swalUtils';
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

export const AdminRequest = () => {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);

  // Search states
  const [searchInput, setSearchInput] = useState('');

  // Status filter
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pending, Approved, Rejected

  // Date filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  // Create Admin Modal State
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({
    UserId: '',
    StatusType: 'Admin',
    AdminName: '',
    AdminNumber: '',
  });
  const [createAdminSubmitting, setCreateAdminSubmitting] = useState(false);

  const handleCreateAdminSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!createAdminForm.UserId.trim()) {
      showWarning('Please enter User ID');
      return;
    }
    if (!createAdminForm.AdminName.trim()) {
      showWarning('Please enter Admin Name');
      return;
    }
    if (!createAdminForm.AdminNumber.trim()) {
      showWarning('Please enter Admin Contact Number');
      return;
    }

    setCreateAdminSubmitting(true);
    try {
      const payload = {
        UserId: createAdminForm.UserId.trim(),
        StatusType: createAdminForm.StatusType || 'Admin',
        AdminName: createAdminForm.AdminName.trim(),
        AdminNumber: createAdminForm.AdminNumber.trim(),
      };

      const response = await userAPI.applyForAdminAgencyHost(payload);
      const isSuccess = response && (response.Status || response.status);

      if (isSuccess) {
        showSuccess(response.message || response.Message || 'Admin request submitted successfully!');
        setShowCreateAdminModal(false);
        setCreateAdminForm({
          UserId: '',
          StatusType: 'Admin',
          AdminName: '',
          AdminNumber: '',
        });
        fetchAdmins();
      } else {
        showError(response.message || response.Message || 'Failed to submit Admin request');
      }
    } catch (err) {
      console.error('ApplyForAdminAgencyHost error:', err);
      showError(err.response?.data?.message || err.message || 'Failed to submit Admin request. Please try again.');
    } finally {
      setCreateAdminSubmitting(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);

      const response = await userAPI.getAdminRequest();

      if (response.status) {
        setAdmins(response.adminRequestList || []);
      } else {
        setAdmins([]);
      }
    } catch (err) {
      console.error('Fetch admins error:', err);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Check if date is in range
  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    // Parse date in format "YYYY-MM-DD HH:mm:ss"
    const itemDate = new Date(dateString);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    itemDate.setHours(0, 0, 0, 0);
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(0, 0, 0, 0);

    if (from && to) {
      return itemDate >= from && itemDate <= to;
    } else if (from) {
      return itemDate >= from;
    } else if (to) {
      return itemDate <= to;
    }
    return true;
  };

  // Filter admins
  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => {
      // Search filter
      const searchLower = searchInput.toLowerCase();
      const matchesSearch = !searchInput || (
        admin.userId?.toLowerCase().includes(searchLower) ||
        admin.adminName?.toLowerCase().includes(searchLower) ||
        admin.contacts?.includes(searchInput) ||
        admin.whatsapp?.includes(searchInput)
      );

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'Pending') {
        matchesStatus = !admin.status || admin.status === '' || admin.status === null;
      } else if (statusFilter === 'Approved') {
        matchesStatus = admin.status === 'Approved';
      } else if (statusFilter === 'Rejected') {
        matchesStatus = admin.status === 'Rejected';
      }

      // Date filter
      const matchesDate = !dateFilterActive || isDateInRange(admin.createdDate);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [admins, searchInput, statusFilter, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdmins = filteredAdmins.slice(startIndex, startIndex + itemsPerPage);

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

  // Handle Approve
  const handleApprove = async (admin) => {
    const adminId = admin.adminid;

    setActionLoading(prev => ({ ...prev, [`${adminId}-approve`]: true }));

    try {
      const response = await userAPI.adminRequestApprove(adminId);

      if (response.status) {
        showSuccess(response.message || 'Approval Successful');
        fetchAdmins();
      } else {
        showError(response.message || 'Failed to approve');
      }
    } catch (err) {
      console.error('Approve error:', err);
      showError('Failed to approve. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${adminId}-approve`]: false }));
    }
  };

  // Handle Reject
  const handleReject = async (admin) => {
    const adminId = admin.adminid;

    setActionLoading(prev => ({ ...prev, [`${adminId}-reject`]: true }));

    try {
      const response = await userAPI.adminRequestReject(adminId);

      if (response.status) {
        showSuccess(response.message || 'Admin Rejection Successful');
        fetchAdmins();
      } else {
        showError(response.message || 'Failed to reject');
      }
    } catch (err) {
      console.error('Reject error:', err);
      showError('Failed to reject. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${adminId}-reject`]: false }));
    }
  };

  // Handle Delete
  const handleDelete = async (admin) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to delete admin: ${admin.adminName} (${admin.userId})?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    const userId = admin.userId;

    setActionLoading(prev => ({ ...prev, [`${userId}-delete`]: true }));

    try {
      const response = await userAPI.adminAgencyHostDelete(userId, 'Admin');

      if (response.status) {
        showSuccess('Admin deleted successfully');
        fetchAdmins();
      } else {
        showError(response.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showError('Failed to delete. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${userId}-delete`]: false }));
    }
  };

  // Get status display
  const getStatusDisplay = (status) => {
    if (!status || status === '' || status === null) {
      return { label: 'Pending', class: 'bg-yellow-500/20 text-yellow-400' };
    } else if (status === 'Approved') {
      return { label: 'Approved', class: 'bg-green-500/20 text-green-400' };
    } else if (status === 'Rejected') {
      return { label: 'Rejected', class: 'bg-red-500/20 text-red-400' };
    }
    return { label: status, class: 'bg-gray-500/20 text-gray-400' };
  };

  // Calculate stats
  const stats = useMemo(() => {
    const pending = admins.filter(a => !a.status || a.status === '' || a.status === null).length;
    const approved = admins.filter(a => a.status === 'Approved').length;
    const rejected = admins.filter(a => a.status === 'Rejected').length;
    return { pending, approved, rejected, total: admins.length };
  }, [admins]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading admin requests...</p>
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
          <div className="p-3 bg-indigo-500/20 rounded-lg">
            <UserCog className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Admin Request</h1>
            <p className="text-gray-400">Total {admins.length.toLocaleString()} admin requests</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all text-white font-medium shadow-md shadow-purple-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Create Admin
          </button>
          <button
            onClick={fetchAdmins}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <DownloadExcelButton
            data={filteredAdmins.map((admin, index) => ({ ...admin, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'userId', header: 'User ID' },
              { key: 'adminName', header: 'Admin Name' },
              { key: 'adminid', header: 'Admin ID' },
              { key: 'contacts', header: 'Contact' },
              { key: 'whatsapp', header: 'WhatsApp' },
              { key: 'agencyYouHave', header: 'Agencies' },
              { key: 'label', header: 'Status' },
              { key: 'createdDate', header: 'Created Date' }
            ]}
            filename={`admin_requests_${new Date().toISOString().split('T')[0]}.xlsx`}
            options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 18 }] }}
          />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.total.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Requests</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.pending.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Pending</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.approved.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Approved</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.rejected.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Rejected</p>
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
              placeholder="Search by User ID, Name, Contact, or WhatsApp..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

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
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[#1a1625] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                  S.No
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Admin Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Admin ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  WhatsApp
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Agencies
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedAdmins.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedAdmins.map((admin, index) => {
                  const statusDisplay = getStatusDisplay(admin.status);
                  const isApproved = admin.status === 'Approved';
                  const isRejected = admin.status === 'Rejected';

                  return (
                    <motion.tr
                      key={admin.userId}
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
                      <td className="px-4 py-4">
                        <CopyableUserId userId={admin.userId} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-white">
                          {admin.adminName || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-blue-400 font-mono">
                          {admin.adminid || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">
                          {admin.contacts || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">
                          {admin.whatsapp || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-purple-400">
                          {admin.agencyYouHave || '0'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusDisplay.class}`}>
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">
                          {admin.createdDate || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleApprove(admin)}
                            disabled={isApproved || actionLoading[`${admin.adminid}-approve`]}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isApproved
                              ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                              }`}
                            title={isApproved ? 'Already Approved' : 'Approve'}
                          >
                            {actionLoading[`${admin.adminid}-approve`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(admin)}
                            disabled={isRejected || actionLoading[`${admin.adminid}-reject`]}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isRejected
                              ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                              : 'bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50'
                              }`}
                            title={isRejected ? 'Already Rejected' : 'Reject'}
                          >
                            {actionLoading[`${admin.adminid}-reject`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Reject
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAdmins.length)} of {filteredAdmins.length} entries
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

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-[#1a1625] rounded-2xl border border-white/10 p-6 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/20 rounded-xl">
                  <UserPlus className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create Admin Request</h2>
                  <p className="text-xs text-gray-400">Apply for new Admin / Agency / Host role</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  User ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter User ID (e.g. 2478184)"
                  value={createAdminForm.UserId}
                  onChange={(e) => setCreateAdminForm(prev => ({ ...prev, UserId: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={createAdminForm.StatusType}
                  onChange={(e) => setCreateAdminForm(prev => ({ ...prev, StatusType: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#1a1625] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-all"
                >
                  <option value="Admin">Admin</option>
                  <option value="Agency">Agency</option>
                  <option value="Host">Host</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Admin Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Admin Name (e.g. Rahul)"
                  value={createAdminForm.AdminName}
                  onChange={(e) => setCreateAdminForm(prev => ({ ...prev, AdminName: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Admin Contact Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Admin Number (e.g. 9876543210)"
                  value={createAdminForm.AdminNumber}
                  onChange={(e) => setCreateAdminForm(prev => ({ ...prev, AdminNumber: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAdminSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-purple-500/25"
                >
                  {createAdminSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
