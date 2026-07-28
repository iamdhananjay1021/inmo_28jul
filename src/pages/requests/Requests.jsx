import { copyToClipboard } from '../../utils/clipboardUtils';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Building2,
  Users,
  Edit,
  FileText,
  UserPlus,
  X
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showError, showConfirm, showInfo, showWarning } from '../../utils/swalUtils';

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

export const Requests = () => {
  const [activeTab, setActiveTab] = useState('Admin'); // Admin, Agency, Host
  const [loading, setLoading] = useState(true);
  const [requestsList, setRequestsList] = useState([]);

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

  // Agency Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editAgencyName, setEditAgencyName] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editAgencyLocation, setEditAgencyLocation] = useState('');
  const [editAgencyContact, setEditAgencyContact] = useState('');
  const [editAgencyEmail, setEditAgencyEmail] = useState('');
  const [editHostYouHave, setEditHostYouHave] = useState('');
  const [editAdminId, setEditAdminId] = useState('');
  const [editAgencyCode, setEditAgencyCode] = useState('');

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
        fetchRequests();
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

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Pass the status type as configured
      const response = await userAPI.getAdminAgencyHostRequest(activeTab);

      if (response && (response.Status === true || response.status === true)) {
        // Handle all possible response data keys robustly
        const list = response.Requests ||
          response.requests ||
          response.adminRequestList ||
          response.agencyRequestList ||
          response.hostRequestList ||
          response.data ||
          [];

        // Normalize property keys to camelCase for full rendering compatibility
        const normalized = list.map(item => {
          return {
            ...item,
            // Common fields
            userId: item.userId || item.UserId || '',
            status: item.status || item.Status || 'Pending',
            status1: item.status1 || item.Status || item.status || 'Pending',
            createdDate: item.createdDate || item.Created_Date || item.CreatedDate || item.createDate || item.create_Date || 'N/A',
            createDate: item.createdDate || item.Created_Date || item.CreatedDate || item.createDate || item.create_Date || 'N/A',
            create_Date: item.createdDate || item.Created_Date || item.CreatedDate || item.createDate || item.create_Date || 'N/A',

            // Admin fields
            adminName: item.adminName || item.AdminName || '',
            adminid: item.adminid || item.AdminId || '',
            contacts: item.contacts || item.AdminNumber || '',
            whatsapp: item.whatsapp || item.AdminNumber || '',

            // Agency fields
            agencyName: item.agencyName || item.AgencyName || '',
            userName: item.userName || item.AdminName || '',
            agencyCode: item.agencyCode || item.AgencyCode || item.HostAgencyCode || '',
            agencyLocation: item.agencyLocation || item.AgencyLocation || '',
            agencyContact: item.agencyContact || item.AgencyNumber || '',
            adminId: item.adminId || item.AgencyAdminId || '',

            // Host fields
            name: item.name || item.HostName || '',
            phone: item.phone || item.HostNumber || '',
            type: item.type || item.StatusType || '',
            statusUpdated: item.statusUpdated || item.Created_Date || 'N/A'
          };
        });

        setRequestsList(normalized);
      } else {
        setRequestsList([]);
      }
    } catch (err) {
      console.error('Fetch requests error:', err);
      setRequestsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Reset filters and page when active tab changes
    setSearchInput('');
    setStatusFilter('All');
    setFromDate('');
    setToDate('');
    setDateFilterActive(false);
    setCurrentPage(1);
  }, [activeTab]);

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

  // Filter requests list based on active tab columns
  const filteredRequests = useMemo(() => {
    return requestsList.filter(item => {
      const searchLower = searchInput.toLowerCase();

      // Search filter based on active tab
      let matchesSearch = true;
      if (searchInput) {
        if (activeTab === 'Admin') {
          matchesSearch =
            item.userId?.toLowerCase().includes(searchLower) ||
            item.adminName?.toLowerCase().includes(searchLower) ||
            item.contacts?.includes(searchInput) ||
            item.whatsapp?.includes(searchInput);
        } else if (activeTab === 'Agency') {
          matchesSearch =
            item.userId?.toLowerCase().includes(searchLower) ||
            item.agencyName?.toLowerCase().includes(searchLower) ||
            item.userName?.toLowerCase().includes(searchLower) ||
            item.agencyCode?.includes(searchInput) ||
            item.agencyContact?.includes(searchInput);
        } else if (activeTab === 'Host') {
          matchesSearch =
            item.userId?.toLowerCase().includes(searchLower) ||
            item.name?.toLowerCase().includes(searchLower) ||
            item.phone?.includes(searchInput) ||
            item.agencyCode?.includes(searchInput) ||
            item.hostCode?.includes(searchInput);
        }
      }

      // Status filter based on active tab
      let matchesStatus = true;
      const statusValue = activeTab === 'Host' ? item.status1 : item.status;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Pending') {
          matchesStatus = !statusValue || statusValue === '' || statusValue === null;
        } else if (statusFilter === 'Approved') {
          matchesStatus = statusValue === 'Approved' || statusValue === 'Approve';
        } else if (statusFilter === 'Rejected') {
          matchesStatus = statusValue === 'Rejected' || statusValue === 'Reject';
        }
      }

      // Date filter based on active tab
      const dateValue = activeTab === 'Admin' ? item.createdDate :
        activeTab === 'Agency' ? item.statusUpdateDate :
          item.statusUpdated;
      const matchesDate = !dateFilterActive || isDateInRange(dateValue);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [requestsList, activeTab, searchInput, statusFilter, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

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

  // Status helper
  const getStatusDisplay = (statusVal) => {
    if (!statusVal || statusVal === '' || statusVal === null) {
      return { label: 'Pending', class: 'bg-yellow-500/20 text-yellow-400' };
    } else if (statusVal === 'Approved' || statusVal === 'Approve') {
      return { label: 'Approved', class: 'bg-green-500/20 text-green-400' };
    } else if (statusVal === 'Rejected' || statusVal === 'Reject') {
      return { label: 'Rejected', class: 'bg-red-500/20 text-red-400' };
    }
    return { label: statusVal, class: 'bg-gray-500/20 text-gray-400' };
  };

  // Calculate statistics dynamically
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    requestsList.forEach(item => {
      const statusVal = activeTab === 'Host' ? item.status1 : item.status;
      if (!statusVal || statusVal === '' || statusVal === null) {
        pending++;
      } else if (statusVal === 'Approved' || statusVal === 'Approve') {
        approved++;
      } else if (statusVal === 'Rejected' || statusVal === 'Reject') {
        rejected++;
      }
    });

    return { pending, approved, rejected, total: requestsList.length };
  }, [requestsList, activeTab]);

  // ACTION HANDLERS
  // 1. Approve
  const handleApprove = async (item) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: 'Are you sure you want to approve this request?',
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
    });
    if (!isConfirmed) return;

    const id = item.userId;
    setActionLoading(prev => ({ ...prev, [`${id}-approve`]: true }));

    try {
      const response = await userAPI.approveRejectRequest(item.userId, activeTab, 'Approved');

      if (response && (response.status || response.Status)) {
        showSuccess(response.message || 'Approved Successfully');
        fetchRequests();
      } else {
        showError(response?.message || 'Failed to approve');
      }
    } catch (err) {
      console.error('Approve error:', err);
      showError('Failed to approve. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${id}-approve`]: false }));
    }
  };

  // 2. Reject
  const handleReject = async (item) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: 'Are you sure you want to reject this request?',
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
    });
    if (!isConfirmed) return;

    const id = item.userId;
    setActionLoading(prev => ({ ...prev, [`${id}-reject`]: true }));

    try {
      const response = await userAPI.approveRejectRequest(item.userId, activeTab, 'Rejected');

      if (response && (response.status || response.Status)) {
        showSuccess(response.message || 'Rejected Successfully');
        fetchRequests();
      } else {
        showError(response?.message || 'Failed to reject');
      }
    } catch (err) {
      console.error('Reject error:', err);
      showError('Failed to reject. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${id}-reject`]: false }));
    }
  };

  // 3. Delete
  const handleDelete = async (item) => {
    const name = activeTab === 'Admin' ? item.adminName :
      activeTab === 'Agency' ? item.agencyName :
        item.name;
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to delete ${activeTab.toLowerCase()}: ${name || 'Unknown'} (${item.userId})?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    const id = item.userId;
    setActionLoading(prev => ({ ...prev, [`${id}-delete`]: true }));

    try {
      const response = await userAPI.adminAgencyHostDelete(item.userId, activeTab);
      if (response && response.status) {
        showSuccess('Deleted successfully');
        fetchRequests();
      } else {
        showError(response?.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showError('Failed to delete. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${id}-delete`]: false }));
    }
  };

  // 4. Edit Agency Modal triggers
  const handleOpenEditAgency = (agency) => {
    setEditUserId(agency.userId);
    setEditAgencyName(agency.agencyName || '');
    setEditUserName(agency.userName || '');
    setEditAgencyLocation(agency.agencyLocation || '');
    setEditAgencyContact(agency.agencyContact || '');
    setEditAgencyEmail(agency.agencyEmail || '');
    setEditHostYouHave(agency.hostYouHave || '');
    setEditAdminId(agency.adminId || '');
    setEditAgencyCode(agency.agencyCode || '');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const { isConfirmed } = await showConfirm({
        title: 'Confirm Action',
        text: 'Are you sure to change the agency details?',
        confirmButtonText: 'Yes, Proceed',
        cancelButtonText: 'Cancel',
      });
      if (!isConfirmed) return;

      const payload = {
        userId: editUserId,
        agencyName: editAgencyName,
        yourName: editUserName,
        agencyLocation: editAgencyLocation,
        agencyContacts: editAgencyContact,
        agencyEmail: editAgencyEmail,
        hostsYouhave: editHostYouHave,
        agencyCode: editAgencyCode,
        adminId: editAdminId
      };

      const response = await userAPI.editAgencyRequest(payload);
      if (response && response.status) {
        showSuccess("Agency updated successfully");
        setIsEditModalOpen(false);
        fetchRequests();
      } else {
        showError(response?.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      showInfo("Something went wrong");
    }
  };

  // Excel headers / export format configuration
  const excelColumns = useMemo(() => {
    if (activeTab === 'Admin') {
      return [
        { key: 'serialNumber', header: 'S.No' },
        { key: 'userId', header: 'User ID' },
        { key: 'adminName', header: 'Admin Name' },
        { key: 'adminid', header: 'Admin ID' },
        { key: 'contacts', header: 'Contact' },
        { key: 'location', header: 'Admin Location' },
        { key: 'StatusType', header: 'Type' },
        { key: 'status', header: 'Status' },
        { key: 'createdDate', header: 'Created Date' }
      ];
    } else if (activeTab === 'Agency') {
      return [
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
        { key: 'create_Date', header: 'Created Date' }
      ];
    } else {
      return [
        { key: 'serialNumber', header: 'S.No' },
        { key: 'userId', header: 'User ID' },
        { key: 'name', header: 'Name' },
        { key: 'phone', header: 'Phone' },
        { key: 'agencyCode', header: 'Agency Code' },
        { key: 'type', header: 'Type' },
        { key: 'status1', header: 'Status' },
        // { key: 'statusUpdated', header: 'Updated Date' },
        { key: 'createDate', header: 'Created Date' }
      ];
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Requests</h1>
            <p className="text-gray-400">Manage Admin, Agency, and Host registration requests</p>
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
            onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <DownloadExcelButton
            data={filteredRequests.map((item, index) => ({
              ...item,
              serialNumber: index + 1,
              // Flatten status displays for Excel file sheets
              status: activeTab === 'Host' ? item.status1 || 'Pending' : item.status || 'Pending'
            }))}
            columns={excelColumns}
            filename={`${activeTab.toLowerCase()}_requests_${new Date().toISOString().split('T')[0]}.xlsx`}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-white/10 flex gap-4">
        {['Admin', 'Agency', 'Host'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-sm font-semibold transition-all relative ${activeTab === tab
              ? 'text-purple-400'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            {tab} Requests
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.total.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total {activeTab} Requests</p>
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

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'Admin'
                  ? 'Search by User ID, Name, Contact, or WhatsApp...'
                  : activeTab === 'Agency'
                    ? 'Search by User ID, Agency Name, Username, Code, or Contact...'
                    : 'Search by User ID, Name, Phone, Agency Code...'
              }
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* Date Range Picker */}
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
                Clear
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Requests Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading {activeTab} requests...</p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-[#1a1625] sticky top-0 z-10">
                {activeTab === 'Admin' && (
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Name</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Location</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created Date</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">Actions</th>
                  </tr>
                )}
                {activeTab === 'Agency' && (
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Agency Name</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Agency Admin ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Agency Code</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created Date</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-64">Actions</th>
                  </tr>
                )}
                {activeTab === 'Host' && (
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Agency Code</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created Date</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'Agency' ? 12 : 11} className="px-6 py-8 text-center text-gray-400">
                      No Records Found
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((item, index) => {
                    const statusVal = activeTab === 'Host' ? item.status1 : item.status;
                    const statusDisplay = getStatusDisplay(statusVal);
                    const isApproved = statusVal === 'Approved' || statusVal === 'Approve';
                    const isRejected = statusVal === 'Rejected' || statusVal === 'Reject';
                    const actionId = item.userId;

                    return (
                      <motion.tr
                        key={item.userId + '-' + (item.adminid || item.agencyCode || index)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-400">
                            {startIndex + index + 1}
                          </span>
                        </td>

                        {/* Admin Layout */}
                        {activeTab === 'Admin' && (
                          <>
                            <td className="px-4 py-4">
                              <CopyableUserId userId={item.userId} />
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-medium text-white">{item.adminName || 'Unknown'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-blue-400 font-mono">{item.adminid || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-300">{item.contacts || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-300">{item.AdminLocation || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-purple-400">{item.StatusType || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusDisplay.class}`}>
                                {statusDisplay.label}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-400">{item.createdDate || 'N/A'}</span>
                            </td>
                          </>
                        )}

                        {/* Agency Layout */}
                        {activeTab === 'Agency' && (
                          <>
                            <td className="px-4 py-4">
                              <CopyableUserId userId={item.userId} />
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-medium text-white">{item.AgencyName || 'Unknown'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-300">{item.AgencyAdminId || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-blue-400 font-mono">{item.AgencyCode || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-300">{item.AgencyLocation || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-300">{item.AgencyNumber || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusDisplay.class}`}>
                                {statusDisplay.label}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-400">{item.create_Date || 'N/A'}</span>
                            </td>
                          </>
                        )}

                        {/* Host Layout */}
                        {activeTab === 'Host' && (
                          <>
                            <td className="px-4 py-4">
                              <CopyableUserId userId={item.userId} />
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-medium text-white">{item.name || 'Unknown'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-300">{item.phone || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-purple-400 font-mono">{item.agencyCode || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-300">{item.type || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusDisplay.class}`}>
                                {statusDisplay.label}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-400">{item.createDate || 'N/A'}</span>
                            </td>
                          </>
                        )}

                        {/* Action buttons */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleApprove(item)}
                              disabled={isApproved || actionLoading[`${actionId}-approve`]}
                              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isApproved
                                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                                }`}
                              title={isApproved ? 'Already Approved' : 'Approve'}
                            >
                              {actionLoading[`${actionId}-approve`] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(item)}
                              disabled={isRejected || actionLoading[`${actionId}-reject`]}
                              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isRejected
                                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                : 'bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50'
                                }`}
                              title={isRejected ? 'Already Rejected' : 'Reject'}
                            >
                              {actionLoading[`${actionId}-reject`] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              Reject
                            </button>
                            {activeTab === 'Agency' && (
                              <button
                                onClick={() => handleOpenEditAgency(item)}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRequests.length)} of {filteredRequests.length} entries
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400 px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Edit Agency Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-xl w-full max-w-lg p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Edit Agency</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">User ID</label>
                <input
                  type="text"
                  value={editUserId}
                  disabled
                  className="w-full p-2 bg-white/5 border border-white/10 rounded text-gray-400"
                  placeholder="User ID"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Agency Name</label>
                <input
                  type="text"
                  value={editAgencyName}
                  onChange={(e) => setEditAgencyName(e.target.value)}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-purple-500"
                  placeholder="Agency Name"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">User Name</label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-purple-500"
                  placeholder="User Name"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Location</label>
                <input
                  type="text"
                  value={editAgencyLocation}
                  onChange={(e) => setEditAgencyLocation(e.target.value)}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-purple-500"
                  placeholder="Location"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Contact</label>
                <input
                  type="text"
                  value={editAgencyContact}
                  onChange={(e) => setEditAgencyContact(e.target.value)}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-purple-500"
                  placeholder="Contact"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Email</label>
                <input
                  type="email"
                  value={editAgencyEmail}
                  onChange={(e) => setEditAgencyEmail(e.target.value)}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-purple-500"
                  placeholder="Email"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
