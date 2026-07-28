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
  Users,
  CheckCircle,
  XCircle,
  UserCog,
  X
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showError, showConfirm } from '../../utils/swalUtils';
import { useNavigate } from 'react-router-dom';// Copy to clipboard component
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

// Approve Modal Component
const ApproveModal = ({ agent, title = 'Approve Agent', onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    audioPricePerMin: '',
    videoPricePerMin: '',
    adminComission: '',
    language: '',
    talkAbout: ''
  });

  useEffect(() => {
    setFormData({
      audioPricePerMin: agent?.audioPricePerMin ?? '',
      videoPricePerMin: agent?.videoPricePerMin ?? '',
      adminComission: agent?.adminComission ?? '',
      language: agent?.language ?? '',
      talkAbout: agent?.talkAbout ?? ''
    });
  }, [agent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      userId: agent.userId,
      audioPricePerMin: parseFloat(formData.audioPricePerMin) || 0,
      videoPricePerMin: parseFloat(formData.videoPricePerMin) || 0,
      adminComission: formData.adminComission,
      language: formData.language,
      talkAbout: formData.talkAbout
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-strong rounded-xl p-6 w-full max-w-md my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gradient">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-gray-400">Agent</p>
          <p className="text-lg font-semibold text-white">{agent.userName}</p>
          <p className="text-sm text-purple-400">{agent.userId}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Audio Call Price/min</label>
            <input
              type="number"
              value={formData.audioPricePerMin}
              onChange={(e) => setFormData({...formData, audioPricePerMin: e.target.value})}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter price"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Video Call Price/min</label>
            <input
              type="number"
              value={formData.videoPricePerMin}
              onChange={(e) => setFormData({...formData, videoPricePerMin: e.target.value})}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter price"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Admin Commission (%)</label>
            <input
              type="text"
              value={formData.adminComission}
              onChange={(e) => setFormData({...formData, adminComission: e.target.value})}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter commission"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Language</label>
            <input
              type="text"
              value={formData.language}
              onChange={(e) => setFormData({...formData, language: e.target.value})}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter language"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Talk About</label>
            <textarea
              value={formData.talkAbout}
              onChange={(e) => setFormData({...formData, talkAbout: e.target.value})}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Enter talk about"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Submit
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const AgentRequest = () => {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending');// Search states
  const [searchInput, setSearchInput] = useState('');
  
  // Date filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalMode, setModalMode] = useState('approve');

  const fetchAgents = async () => {
    try {
      setLoading(true);
      let response;
      
      if (statusFilter === 'Pending') {
        response = await userAPI.getAgentRequestPending();
        if (response.status) {
          setAgents(response.agentUserList || []);
        }
      } else if (statusFilter === 'Approved') {
        response = await userAPI.getAgentRequestApproved();
        if (response.status) {
          setAgents(response.agentList || []);
        }
      } else if (statusFilter === 'Rejected') {
        response = await userAPI.getAgentRequestRejected();
        if (response.status) {
          setAgents(response.agentList || []);
        }
      }
    } catch (err) {
      console.error('Fetch agents error:', err);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [statusFilter]);

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

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // Search filter
      const searchLower = searchInput.toLowerCase();
      const matchesSearch = !searchInput || (
        agent.userId?.toLowerCase().includes(searchLower) ||
        agent.userName?.toLowerCase().includes(searchLower) ||
        agent.mobileNo?.includes(searchInput) ||
        agent.emailID?.toLowerCase().includes(searchLower) ||
        agent.agencyCode?.includes(searchInput) ||
        agent.agencyName?.toLowerCase().includes(searchLower)
      );
      
      // Date filter
      const matchesDate = !dateFilterActive || isDateInRange(agent.created_Date);
      
      return matchesSearch && matchesDate;
    });
  }, [agents, searchInput, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + itemsPerPage);

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

  // Handle Approve Click - Open Modal
  const handleApproveClick = (agent) => {
    setSelectedAgent(agent);
    setModalMode('approve');
    setApproveModalOpen(true);
  };

  // const handleEditClick = (agent) => {
  //   setSelectedAgent(agent);
  //   setModalMode('edit');
  //   setApproveModalOpen(true);
  // };
  const navigate = useNavigate();

  const handleEditClick = (agent) => {
    navigate('/agent/approve-agent', { state: { selectedRow: agent } });
  };

  const handleModalClose = () => {
    setApproveModalOpen(false);
    setSelectedAgent(null);
    setModalMode('approve');
  };

  const handleModalSubmit = async (formData) => {
    setActionLoading(true);

    try {
      const response = await userAPI.approveAgent(formData);
      const successMessage = modalMode === 'edit' ? 'Agent updated successfully' : 'Agent approved successfully';

      if (response.status) {
        showSuccess(response.message || successMessage);
        setApproveModalOpen(false);
        setSelectedAgent(null);
        setTimeout(() => fetchAgents(), 1200);
      } else {
        showError(response.message || 'Failed to save agent details');
      }
    } catch (err) {
      console.error('Modal submit error:', err);
      showError('Failed to save agent details. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAgent = async (agent) => {
    const { isConfirmed } = await showConfirm({
      title: 'Remove Agent',
      text: `Are you sure you want to remove ${agent.userName} (${agent.userId})?`,
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      const response = await userAPI.rejectAgent(agent.userId);
      if (response.status) {
        showSuccess(response.message || 'Agent removed successfully');
        setTimeout(() => fetchAgents(), 1200);
      } else {
        showError(response.message || 'Failed to remove agent');
      }
    } catch (err) {
      console.error('Remove agent error:', err);
      showError('Failed to remove agent. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async (agent) => {
    const { isConfirmed } = await showConfirm({
      title: 'Reject Agent',
      text: `Are you sure you want to reject agent: ${agent.userName} (${agent.userId})?`,
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    
    setActionLoading(true);
    
    try {
      const response = await userAPI.rejectAgent(agent.userId);
      
      if (response.status) {
        showSuccess(response.message || 'Agent rejected successfully');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to reject');
      }
    } catch (err) {
      console.error('Reject error:', err);
      showError('Failed to reject. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    return { total: agents.length };
  }, [agents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading agent requests...</p>
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
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <UserCog className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-1 sm:mb-2">Agent Request</h1>
            <p className="text-gray-400 text-sm">Total {agents.length.toLocaleString()} agents</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={fetchAgents}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <DownloadExcelButton
          data={agents.map((agent, index) => ({
            ...agent,
            serialNumber: index + 1
          }))}
          columns={[
            { key: 'serialNumber', header: 'S.No' },
            { key: 'userId', header: 'User ID' },
            { key: 'userName', header: 'Name' },
            { key: 'mobileNo', header: 'Mobile' },
            { key: 'emailID', header: 'Email' },
            { key: 'agencyCode', header: 'Agency Code' },
            { key: 'agencyName', header: 'Agency Name' },
            { key: 'gender', header: 'Gender' },
            { key: 'dob', header: 'DOB' },
            { key: 'created_Date', header: 'Created Date' },
            { key: 'status', header: 'Status' }
          ]}
          filename={`agent_requests_${new Date().toISOString().split('T')[0]}.xlsx`}
          options={{
            colWidths: [
              { wch: 8 },
              { wch: 18 },
              { wch: 20 },
              { wch: 16 },
              { wch: 24 },
              { wch: 16 },
              { wch: 20 },
              { wch: 12 },
              { wch: 14 },
              { wch: 18 },
              { wch: 14 }
            ]
          }}
        />        </div>

      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.total.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Agents</p>
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
              placeholder="Search by User ID, Name, Mobile, Email, Agency Code or Name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          //  className="p-2 rounded bg-rgba(147, 51, 234, 0.25) text-white"
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500"
          >
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
                  Username
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Agency Code
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Agency Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  DOB
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Created Date
                </th>
                      {statusFilter === 'Approved' && (
                  <>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Audio Price
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Video Price
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-44">
                      Actions
                    </th>
                  </>
                )}
                {statusFilter === 'Pending' && (
                  <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-40">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedAgents.length === 0 ? (
                <tr>
                  <td colSpan={statusFilter === 'Approved' ? 14 : statusFilter === 'Pending' ? 11 : 10} className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedAgents.map((agent, index) => (
                  <motion.tr
                    key={agent.userId}
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
                      <CopyableUserId userId={agent.userId} />
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-white">
                        {agent.userName || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {agent.mobileNo || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {agent.emailID || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-purple-400 font-mono">
                        {agent.agencyCode || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {agent.agencyName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {agent.gender || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {agent.dob || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {agent.created_Date || 'N/A'}
                      </span>
                    </td>
                    {statusFilter === 'Approved' && (
                      <>
                        <td className="px-4 py-4">
                          <span className="text-sm text-green-400">
                            {agent.audioPricePerMin || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-green-400">
                            {agent.videoPricePerMin || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-blue-400">
                            {agent.adminComission || 0}%
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(agent)}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-600 text-black transition-colors disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemoveAgent(agent)}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                    {statusFilter === 'Pending' && (
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApproveClick(agent)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(agent)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAgents.length)} of {filteredAgents.length} entries
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

      {/* Approve Modal */}
      <AnimatePresence>
        {approveModalOpen && selectedAgent && (
          <ApproveModal
            agent={selectedAgent}
            title={modalMode === 'edit' ? 'Edit Agent Details' : 'Approve Agent'}
            onClose={handleModalClose}
            onSubmit={handleModalSubmit}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
