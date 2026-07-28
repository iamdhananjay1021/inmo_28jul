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
  Users,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showError, showConfirm } from '../../utils/swalUtils';
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

export const HostRequest = () => {
  const [loading, setLoading] = useState(true);
  const [hosts, setHosts] = useState([]);

  // Search states
  const [searchInput, setSearchInput] = useState('');

  // Status filter
  const [statusFilter, setStatusFilter] = useState('All');

  // Date filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});const fetchHosts = async () => {
    try {
      setLoading(true);

      const response = await userAPI.getHostRequest();

      if (response.status) {
        setHosts(response.hostRequestList || []);
      } else {
        setHosts([]);
      }
    } catch (err) {
      console.error('Fetch hosts error:', err);
      setHosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  // Check if date is in range
  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

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

  // Filter hosts
  const filteredHosts = useMemo(() => {
    return hosts.filter(host => {
      // Search filter
      const searchLower = searchInput.toLowerCase();
      const matchesSearch = !searchInput || (
        host.userId?.toLowerCase().includes(searchLower) ||
        host.name?.toLowerCase().includes(searchLower) ||
        host.phone?.includes(searchInput) ||
        host.agencyCode?.includes(searchInput) ||
        host.hostCode?.includes(searchInput)
      );

      // Status filter (based on status1)
      let matchesStatus = true;
      if (statusFilter === 'Pending') {
        matchesStatus = !host.status1 || host.status1 === '' || host.status1 === null;
      } else if (statusFilter === 'Approved') {
        matchesStatus = host.status1 === 'Approve' || host.status1 === 'Approved';
      } else if (statusFilter === 'Rejected') {
        matchesStatus = host.status1 === 'Reject' || host.status1 === 'Rejected';
      }

      // Date filter
      const matchesDate = !dateFilterActive || isDateInRange(host.statusUpdated);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [hosts, searchInput, statusFilter, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredHosts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHosts = filteredHosts.slice(startIndex, startIndex + itemsPerPage);

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
  const handleApprove = async (host) => {
    setActionLoading(prev => ({ ...prev, [`${host.userId}-approve`]: true }));

    try {
      const response = await userAPI.hostRequestApprove(host.agencyCode, host.userId);

      if (response.status) {
        showSuccess(response.message || 'Host approved successfully');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to approve');
      }
    } catch (err) {
      console.error('Approve error:', err);
      showError('Failed to approve. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${host.userId}-approve`]: false }));
    }
  };

  // Handle Reject
  const handleReject = async (host) => {
    setActionLoading(prev => ({ ...prev, [`${host.userId}-reject`]: true }));

    try {
      const response = await userAPI.hostRequestReject(host.agencyCode, host.userId);

      if (response.status) {
        showSuccess(response.message || 'Host rejected successfully');
         setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to reject');
      }
    } catch (err) {
      console.error('Reject error:', err);
      showError('Failed to reject. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${host.userId}-reject`]: false }));
    }
  };

  // Handle Delete
  const handleDelete = async (host) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to delete host: ${host.name} (${host.userId})?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setActionLoading(prev => ({ ...prev, [`${host.userId}-delete`]: true }));

    try {
      const response = await userAPI.adminAgencyHostDelete(host.userId, 'Host');

      if (response.status) {
        showSuccess('Host deleted successfully');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showError('Failed to delete. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${host.userId}-delete`]: false }));
    }
  };

  // Get status display (based on status1)
  const getStatusDisplay = (status1) => {
    if (!status1 || status1 === '' || status1 === null) {
      return { label: 'Pending', class: 'bg-yellow-500/20 text-yellow-400' };
    } else if (status1 === 'Approve' || status1 === 'Approved') {
      return { label: 'Approved', class: 'bg-green-500/20 text-green-400' };
    } else if (status1 === 'Reject' || status1 === 'Rejected') {
      return { label: 'Rejected', class: 'bg-red-500/20 text-red-400' };
    }
    return { label: status1, class: 'bg-gray-500/20 text-gray-400' };
  };

  // Calculate stats
  const stats = useMemo(() => {
    const pending = hosts.filter(h => !h.status1 || h.status1 === '' || h.status1 === null).length;
    const approved = hosts.filter(h => h.status1 === 'Approve' || h.status1 === 'Approved').length;
    const rejected = hosts.filter(h => h.status1 === 'Reject' || h.status1 === 'Rejected').length;
    return { pending, approved, rejected, total: hosts.length };
  }, [hosts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading host requests...</p>
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
          <div className="p-3 bg-cyan-500/20 rounded-lg">
            <Users className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Host Request</h1>
            <p className="text-gray-400">Total {hosts.length.toLocaleString()} host requests</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={fetchHosts}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <DownloadExcelButton
          data={filteredHosts.map((host, index) => ({ ...host, serialNumber: index + 1 }))}
          columns={[
            { key: 'serialNumber', header: 'S.No' },
            { key: 'userId', header: 'User ID' },
            { key: 'name', header: 'Name' },
            { key: 'phone', header: 'Phone' },
            { key: 'agencyCode', header: 'Agency Code' },
            { key: 'type', header: 'Type' },
            { key: 'status', header: 'Status' },
            { key: 'status1', header: 'Status 1' },
            { key: 'statusUpdated', header: 'Updated Date' },
            { key: 'createDate', header: 'Created Date' }
          ]}
          filename={`host_requests_${new Date().toISOString().split('T')[0]}.xlsx`}
          options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }] }}
        />        </div>


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
              placeholder="Search by User ID, Name, Phone, Agency Code, or Host Code..."
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
                  Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Agency Code
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                {/* <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th> */}
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Updated Date
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
              {paginatedHosts.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedHosts.map((host, index) => {
                  const statusDisplay = getStatusDisplay(host.status1);
                  const isPending = !host.status1 || host.status1 === '' || host.status1 === null;
                  const isApproved = host.status1 === 'Approve' || host.status1 === 'Approved';
                  const isRejected = host.status1 === 'Reject' || host.status1 === 'Rejected';

                  return (
                    <motion.tr
                      key={host.userId}
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
                        <CopyableUserId userId={host.userId} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-white">
                          {host.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">
                          {host.phone || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-purple-400 font-mono">
                          {host.agencyCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">
                          {host.type || 'N/A'}
                        </span>
                      </td>
                      {/* <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">
                          {host.status || 'N/A'}
                        </span>
                      </td> */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusDisplay.class}`}>
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">
                          {host.statusUpdated || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">
                          {host.createDate || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleApprove(host)}
                            disabled={isApproved || actionLoading[`${host.userId}-approve`]}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isApproved
                                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                              }`}
                            title={isApproved ? 'Already Approved' : 'Approve'}
                          >
                            {actionLoading[`${host.userId}-approve`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(host)}
                            disabled={isRejected || actionLoading[`${host.userId}-reject`]}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isRejected
                                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                : 'bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50'
                              }`}
                            title={isRejected ? 'Already Rejected' : 'Reject'}
                          >
                            {actionLoading[`${host.userId}-reject`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Reject
                          </button>
                          <button
                            onClick={() => handleDelete(host)}
                            disabled={actionLoading[`${host.userId}-delete`]}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {actionLoading[`${host.userId}-delete`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Delete
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredHosts.length)} of {filteredHosts.length} entries
            </p>
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
