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
  Building2,
  CheckCircle,
  XCircle,
  Trash2, Edit
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showError, showInfo, showConfirm } from '../../utils/swalUtils';
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

export const AgencyRequest = () => {
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState([]);
  const [open, setOpen] = useState(false);

  const [userId, setUserId] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [userName, setUserName] = useState("");
  const [agencyLocation, setAgencyLocation] = useState("");
  const [agencyContact, setAgencyContact] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [hostYouHave, setHostYouHave] = useState("");
  const [adminId, setAdminId] = useState("");
  const [agencyCode, setAgencyCode] = useState("");
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
  const [actionLoading, setActionLoading] = useState({});const fetchAgencies = async () => {
    try {
      setLoading(true);

      const response = await userAPI.getAgencyRequest();

      if (response.status) {
        setAgencies(response.agencyRequestList || []);
      } else {
        setAgencies([]);
      }
    } catch (err) {
      console.error('Fetch agencies error:', err);
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const handleEdit = (
    userId,
    agencyName,
    userName,
    agencyLocation,
    agencyContact,
    agencyEmail,
    hostYouHave,
    adminId,
    agencyCode
  ) => {
    setOpen(true);

    setUserId(userId);
    setAgencyName(agencyName);
    setUserName(userName);
    setAgencyLocation(agencyLocation);
    setAgencyContact(agencyContact);
    setAgencyEmail(agencyEmail);
    setHostYouHave(hostYouHave);
    setAdminId(adminId);
    setAgencyCode(agencyCode);
  };
  const handleClose = () => {
    setOpen(false);
  };

  // Check if date is in range
  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    // Parse date string
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

  // Filter agencies
  const filteredAgencies = useMemo(() => {
    return agencies.filter(agency => {
      // Search filter
      const searchLower = searchInput.toLowerCase();
      const matchesSearch = !searchInput || (
        agency.userId?.toLowerCase().includes(searchLower) ||
        agency.agencyName?.toLowerCase().includes(searchLower) ||
        agency.userName?.toLowerCase().includes(searchLower) ||
        agency.agencyCode?.includes(searchInput) ||
        agency.agencyContact?.includes(searchInput)
      );

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'Pending') {
        matchesStatus = !agency.status || agency.status === '' || agency.status === null;
      } else if (statusFilter === 'Approved') {
        matchesStatus = agency.status === 'Approve' || agency.status === 'Approved';
      } else if (statusFilter === 'Rejected') {
        matchesStatus = agency.status === 'Reject' || agency.status === 'Rejected';
      }

      // Date filter
      const matchesDate = !dateFilterActive || isDateInRange(agency.statusUpdateDate);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [agencies, searchInput, statusFilter, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAgencies = filteredAgencies.slice(startIndex, startIndex + itemsPerPage);

  const handleDateFilter = async () => {
    setDateFilterActive(!!fromDate || !!toDate);
    setCurrentPage(1);
  };

  const clearDateFilter = async () => {
    setFromDate('');
    setToDate('');
    setDateFilterActive(false);
    setCurrentPage(1);
  };

  // Handle Approve
  const handleApprove = async (agency) => {
    const { isConfirmed: confirmed } = await showConfirm({
      title: 'Confirm Action',
      text: 'Are you sure to approve the request?',
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
    });
    if (!isConfirmed) return;

    setActionLoading(prev => ({ ...prev, [`${agency.userId}-approve`]: true }));
    try {
      const response = await userAPI.agencyRequestApprove(agency.agencyCode, agency.userId);
      if (response.status) {
        setAgencies(prev => {
          const next = [...prev];
          const rowIndex = next.findIndex(item => item.userId === agency.userId && item.agencyCode === agency.agencyCode);
          if (rowIndex !== -1) {
            next[rowIndex] = { ...next[rowIndex], status: 'Approve' };
          }
          return next;
        });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to approve the request');
      }
    } catch (err) {
      console.error('Error approving request:', err);
      showError('Error approving request. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${agency.userId}-approve`]: false }));
    }
  };

  // Handle Reject
  const handleReject = async (agency) => {
    const { isConfirmed: confirmed } = await showConfirm({
      title: 'Confirm Action',
      text: 'Are you sure to reject the request?',
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
    });
    if (!isConfirmed) return;

    setActionLoading(prev => ({ ...prev, [`${agency.userId}-reject`]: true }));
    try {
      const response = await userAPI.agencyRequestReject(agency.agencyCode, agency.userId);
      if (response.status) {
        setAgencies(prev => {
          const next = [...prev];
          const rowIndex = next.findIndex(item => item.userId === agency.userId && item.agencyCode === agency.agencyCode);
          if (rowIndex !== -1) {
            next[rowIndex] = { ...next[rowIndex], status: 'Reject' };
          }
          return next;
        });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to reject the request');
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      showError('Error rejecting request. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${agency.userId}-reject`]: false }));
    }
  };

  // Handle Delete
  const handleDelete = async (agency) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to delete agency: ${agency.agencyName} (${agency.userId})?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setActionLoading(prev => ({ ...prev, [`${agency.userId}-delete`]: true }));

    try {
      const response = await userAPI.adminAgencyHostDelete(agency.userId, 'Agency');

      if (response.status) {
        showSuccess('Agency deleted successfully');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showError('Failed to delete. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${agency.userId}-delete`]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { isConfirmed: confirmed } = await showConfirm({
      title: 'Confirm Action',
      text: 'Are you sure to change the agency details?',
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
    });
    if (confirmed) {

        const payload = {
          userId,
          agencyName,
          yourName: userName,
          agencyLocation,
          agencyContacts: agencyContact,
          agencyEmail,
          hostsYouhave: hostYouHave,
          agencyCode,
          adminId
        };

        const response = await userAPI.editAgencyRequest(payload);

        if (response.status) {
          showSuccess("Agency updated successfully");

          setOpen(false);
        setTimeout(() => window.location.reload(), 1200);

          // clear form
          setUserId("");
          setAgencyName("");
          setUserName("");
          setAgencyLocation("");
          setAgencyContact("");
          setAgencyEmail("");
          setHostYouHave("");
          setAgencyCode("");
          setAdminId("");
        } else {
          showError(response.message || "Update failed");
        }
      }
    } catch (error) {
      console.error(error);
      showInfo("Something went wrong");
    }
  };
  // Get status display
  const getStatusDisplay = (status) => {
    if (!status || status === '' || status === null) {
      return { label: 'Pending', class: 'bg-yellow-500/20 text-yellow-400' };
    } else if (status === 'Approve' || status === 'Approved') {
      return { label: 'Approved', class: 'bg-green-500/20 text-green-400' };
    } else if (status === 'Reject' || status === 'Rejected') {
      return { label: 'Rejected', class: 'bg-red-500/20 text-red-400' };
    }
    return { label: status, class: 'bg-gray-500/20 text-gray-400' };
  };

  // Calculate stats
  const stats = useMemo(() => {
    const pending = agencies.filter(a => !a.status || a.status === '' || a.status === null).length;
    const approved = agencies.filter(a => a.status === 'Approve' || a.status === 'Approved').length;
    const rejected = agencies.filter(a => a.status === 'Reject' || a.status === 'Rejected').length;
    return { pending, approved, rejected, total: agencies.length };
  }, [agencies]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading agency requests...</p>
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
          <div className="p-3 bg-teal-500/20 rounded-lg">
            <Building2 className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Agency Request</h1>
            <p className="text-gray-400">Total {agencies.length.toLocaleString()} agency requests</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={fetchAgencies}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
          <DownloadExcelButton
            data={filteredAgencies.map((agency, index) => ({ ...agency, serialNumber: index + 1 }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'userId', header: 'User ID' },
              { key: 'adminId', header: 'Admin Id' },
              { key: 'agencyCode', header: 'Agency Code' },
              { key: 'agencyName', header: 'Agency Name' },
              { key: 'userName', header: 'User Name' },
              { key: 'agencyLocation', header: 'Agency Location' },
              { key: 'agencyContact', header: 'Agency Contact' },
              { key: 'agencyEmail', header: 'Agency Email' },
              { key: 'hostYouHave', header: 'Host you Have' },
              { key: 'status', header: 'Status' },
              { key: 'statusUpdateDate', header: 'Status Update Date' },
              { key: 'create_Date', header: 'Created Date' },

            ]}
            filename={`agency_requests_${new Date().toISOString().split('T')[0]}.xlsx`}
            options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 24 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 20 }] }}
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
              placeholder="Search by User ID, Agency Name, Username, Code, or Contact..."
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
                  Agency Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Agency Code
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Hosts
                </th>
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
              {paginatedAgencies.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedAgencies.map((agency, index) => {
                  const statusDisplay = getStatusDisplay(agency.status);
                  const isPending = !agency.status || agency.status === '' || agency.status === null;
                  const isApproved = agency.status === 'Approve' || agency.status === 'Approved';
                  const isRejected = agency.status === 'Reject' || agency.status === 'Rejected';

                  return (
                    <motion.tr
                      key={agency.userId}
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
                        <CopyableUserId userId={agency.userId} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-white">
                          {agency.agencyName || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">
                          {agency.userName || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-blue-400 font-mono">
                          {agency.agencyCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">
                          {agency.agencyLocation || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">
                          {agency.agencyContact || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-purple-400">
                          {agency.hostYouHave || '0'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusDisplay.class}`}>
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">
                          {agency.statusUpdateDate || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">
                          {agency.create_Date || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleApprove(agency)}
                            disabled={isApproved}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isApproved
                              ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            title={isApproved ? 'Already Approved' : 'Approve'}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(agency)}
                            disabled={isRejected}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isRejected
                              ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                              : 'bg-orange-600 hover:bg-orange-700 text-white'
                              }`}
                            title={isRejected ? 'Already Rejected' : 'Reject'}
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleEdit(
                              agency.userId,
                              agency.agencyName,
                              agency.userName,
                              agency.agencyLocation,
                              agency.agencyContact,
                              agency.agencyEmail,
                              agency.hostYouHave,
                              agency.adminId,
                              agency.agencyCode
                            )}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                          >

                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(agency)}
                            disabled={actionLoading[`${agency.userId}-delete`]}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {actionLoading[`${agency.userId}-delete`] ? (
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAgencies.length)} of {filteredAgencies.length} entries
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
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-xl w-full max-w-lg p-6 relative">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Edit Agency</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">

              <input
                type="text"
                value={userId}
                disabled
                className="w-full p-2 bg-white/5 border border-white/10 rounded text-gray-400"
                placeholder="User ID"
              />

              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                placeholder="Agency Name"
              />

              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                placeholder="User Name"
              />

              <input
                type="text"
                value={agencyLocation}
                onChange={(e) => setAgencyLocation(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                placeholder="Location"
              />

              <input
                type="text"
                value={agencyContact}
                onChange={(e) => setAgencyContact(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                placeholder="Contact"
              />

              <input
                type="email"
                value={agencyEmail}
                onChange={(e) => setAgencyEmail(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                placeholder="Email"
              />

              <input
                type="text"
                value={hostYouHave}
                onChange={(e) => setHostYouHave(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                placeholder="Hosts"
              />

              <input
                type="number"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                placeholder="Admin ID"
              />

              <input
                type="number"
                value={agencyCode}
                onChange={(e) => setAgencyCode(e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                placeholder="Agency Code"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
              >
                Update
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
