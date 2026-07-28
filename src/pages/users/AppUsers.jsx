import { copyToClipboard } from '../../utils/clipboardUtils';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, RefreshCw, X, Loader2, Edit, Eye, Trash2, Calendar, Copy, Check, CheckSquare, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { API_BASE_URL } from '../../config/apiConfig';
import { commonColumnConfigs } from '../../utils/excelExport';
import DownloadExcelButton from '../../components/DownloadExcelButton';

// Custom hook for debounced search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Default avatar for users without images (circular placeholder)
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%239333ea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E👤%3C/text%3E%3C/svg%3E';

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

export const AppUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For immediate input feedback
  const [isSearching, setIsSearching] = useState(false);

  // Date filter states for joining date
  const today = new Date();
  const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [20, 50, 100, 200, 500, 1000];
  const [totalRecords, setTotalRecords] = useState(0);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    mobile: '',
    dob: '',
    otp: '',
    talkAbout: '',
    about: '',
    language: '',
    email: '',
    password: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: null,
    variant: 'warning'
  });
  const [toast, setToast] = useState({ open: false, message: '', variant: 'success' });
  const toastTimeoutRef = useRef(null);

  const openConfirmDialog = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, variant = 'warning' }) => {
    setConfirmDialog({ open: true, title, message, confirmLabel, cancelLabel, onConfirm, variant });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false, onConfirm: null }));
  };

  const showToast = (message, variant = 'success') => {
    setToast({ open: true, message, variant });
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, open: false }));
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (searchTerm.trim()) {
        setIsSearching(true);
      }
      setError(null);
      setSelectedUsers(new Set()); // Clear selection when fetching

      // Commented out getAppUserDetails
      // const response = await userAPI.getAppUserDetails(currentPage, pageSize);
      // 
      // if (response.status) {
      //   setUsers(response.appUserDetailsList || []);
      //   setTotalRecords(response.totalRecords || 0);
      // } else {
      //   setError(response.message || 'Failed to fetch users');
      // }

      const response = await userAPI.getUsers(currentPage, pageSize, searchTerm);
      const isSuccess = response.status || response.Status;
      if (isSuccess) {
        const listKey = Object.keys(response).find(key => Array.isArray(response[key]));
        const rawList = listKey ? response[listKey] : (response.data || response.Data || []);

        const mapped = (response.data || []).map((u) => ({
          userId: u.UserId,
          name: u.Name,
          imagePreview: u.Image,
          mobile: u.Mobile,
          dob: u.DOB,
          countryName: u.Country,
          about: u.AboutMe,
          latestCoins: Number(u.CoinsBalance || 0),
          latestBeans: Number(u.BeansBalance || 0),
          adminAgencyHostStatus: u.AdminAgencyHostStatus,
          createDate: u.Created_Date || u.CreatedDate || u.createDate,
        }));


        setUsers(mapped);
        setFilteredUsers(mapped);
        setTotalRecords(response.TotalCount);
      } else {
        setError(response.message || response.Message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTerm && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    fetchUsers();
  }, [currentPage, pageSize, searchTerm]);

  const handleImageError = (e) => {
    e.target.src = DEFAULT_AVATAR;
  };

  const handleImageClick = (imageUrl, userName, userId) => {
    setSelectedImage({ url: imageUrl, name: userName, userId });
  };

  const handleClosePreview = () => {
    setSelectedImage(null);
  };

  const handleDeleteImage = async (userId) => {
    closeConfirmDialog();

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/Registration/ClearUserImagePath`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (!response.ok || (data && data.status === false)) {
        throw new Error('Failed to delete image');
      }

      setSelectedImage(null);
      showToast('Image has been deleted successfully.', 'success');
      fetchUsers();

    } catch (error) {
      console.error('Delete image error:', error);
      showToast('Something went wrong while deleting the image!', 'error');
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setEditModalOpen(true);
    console.log('dob', user)
    // Use local data from user listing
    setEditFormData({
      name: user.name || '',
      mobile: user.mobile || '',
      dob: user.dob || '',
      otp: user.otp || '',
      talkAbout: user.talkAbout || '',
      about: user.about || '',
      language: user.language || '',
      email: user.email || '',
      password: ''
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;

    setEditSaving(true);
    try {
      const payload = {
        userId: editUser.userId,
        name: editFormData.name,
        email: editFormData.email,
        mobile: editFormData.mobile,
        dob: editFormData.dob,
        password: editFormData.password || 'string', // API requires this
        about: editFormData.about,
        talkAbout: editFormData.talkAbout,
        language: editFormData.language,
        otp: editFormData.otp
      };

      const response = await userAPI.userEditDetails(payload);

      if (response.status) {
        showToast('User updated successfully!', 'success');
        setEditModalOpen(false);
        setHasChanges(false);
        // Refresh the user list
        fetchUsers();
      } else {
        showToast(response.message || 'Failed to update user', 'error');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      showToast('Failed to update user. Please try again.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const closeEditModal = () => {
    if (hasChanges) {
      openConfirmDialog({
        title: 'Discard changes?',
        message: 'You have unsaved changes. Are you sure you want to close?',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        variant: 'warning',
        onConfirm: () => {
          closeConfirmDialog();
          setEditModalOpen(false);
          setHasChanges(false);
        }
      });
    } else {
      setEditModalOpen(false);
    }
  };

  const handleView = (user) => {
    navigate(`/users/view/${user.userId}`, { state: { user } });
  };

  const handleDelete = (user) => {
    openConfirmDialog({
      title: 'Delete User',
      message: `Are you sure you want to delete user: ${user.name} (${user.userId})?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        closeConfirmDialog();
        try {
          await userAPI.deleteUserDetails(user.userId);
          showToast('User Deleted Successfully.', 'success');
          fetchUsers();
        } catch (err) {
          console.error('Delete user error:', err);
          showToast('User Deleted Successfully.', 'success');
          fetchUsers();
        }
      }
    });
  };

  const toggleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    const allUserIds = new Set(filteredUsers.map(user => user.userId));
    setSelectedUsers(allUserIds);
  };

  const deselectAllUsers = () => {
    setSelectedUsers(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) return;

    const userCount = selectedUsers.size;
    openConfirmDialog({
      title: 'Delete Selected Users',
      message: `Are you sure you want to delete ${userCount} selected user(s)? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        closeConfirmDialog();
        setIsBulkDeleting(true);
        try {
          const deletePromises = Array.from(selectedUsers).map(userId =>
            userAPI.deleteUserDetails(userId).catch(err => {
              console.error(`Failed to delete user ${userId}:`, err);
              return null;
            })
          );

          const results = await Promise.all(deletePromises);
          const successCount = results.filter(r => r).length;

          showToast(`Successfully deleted ${successCount} out of ${userCount} user(s)`, 'success');
          setSelectedUsers(new Set());
          fetchUsers();
        } catch (err) {
          console.error('Bulk delete error:', err);
          showToast('An error occurred during bulk delete. Please try again.', 'error');
        } finally {
          setIsBulkDeleting(false);
        }
      }
    });
  };

  // Debounced search term (300ms delay)
  const debouncedSearchTerm = useDebounce(searchInput, 300);

  // Update searchTerm when debounced value changes
  // useEffect(() => {
  //   setSearchTerm(debouncedSearchTerm);
  // }, [debouncedSearchTerm]);
  useEffect(() => {
    const value = debouncedSearchTerm.trim();

    // Empty search -> load all users
    if (value === "") {
      setSearchTerm("");
      return;
    }

    // Only search after 4 characters
    if (value.length >= 4) {
      setSearchTerm(value);
    }
  }, [debouncedSearchTerm]);
  // Check if a date is within the selected range
  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    const userDate = new Date(dateString);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    // Set time to midnight for accurate comparison
    userDate.setHours(0, 0, 0, 0);
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(0, 0, 0, 0);

    if (from && to) {
      return userDate >= from && userDate <= to;
    } else if (from) {
      return userDate >= from;
    } else if (to) {
      return userDate <= to;
    }
    return true;
  };

  const handleDateFilter = () => {
    if (fromDate || toDate) {
      setDateFilterActive(true);
    } else {
      setDateFilterActive(false);
    }
    // Trigger search with date filter
    performSearch();
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setDateFilterActive(false);
    performSearch();
  };

  const [filteredUsers, setFilteredUsers] = useState([]);
  const abortControllerRef = useRef(null);

  const performSearch = useCallback(() => {
    const hasDateFilter = dateFilterActive && (fromDate || toDate);

    if (!hasDateFilter) {
      setFilteredUsers(users);
      return;
    }

    const results = users.filter((user) => {
      return isDateInRange(user.createDate);
    });

    setFilteredUsers(results);
  }, [users, dateFilterActive, fromDate, toDate]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading users...</p>
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
            onClick={fetchUsers}
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">App User Details</h1>
          <p className="text-gray-400">Total {totalRecords.toLocaleString()} users registered</p>
          {selectedUsers.size > 0 && (
            <p className="text-sm text-blue-400 mt-1 flex items-center gap-1">
              <CheckSquare className="w-4 h-4" />
              {selectedUsers.size} user(s) selected
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedUsers.size > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
              <button
                onClick={deselectAllUsers}
                className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm sm:w-auto"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex w-full items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Bulk Delete ({selectedUsers.size})
                  </>
                )}
              </button>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
            <button
              onClick={fetchUsers}
              className="flex w-full items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors sm:w-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <div className="w-full sm:w-auto">
              <DownloadExcelButton
                data={filteredUsers.length > 0 ? filteredUsers.map((user, index) => ({
                  ...user,
                  serialNumber: ((currentPage - 1) * pageSize) + index + 1
                })) : users.map((user, index) => ({
                  ...user,
                  serialNumber: ((currentPage - 1) * pageSize) + index + 1
                }))}
                columns={[
                  { key: 'serialNumber', header: 'S.No' },
                  ...commonColumnConfigs.users
                ]}
                filename={`app_users_${new Date().toISOString().split('T')[0]}.xlsx`}
                options={{
                  colWidths: [
                    { wch: 8 }, // S.No
                    { wch: 15 }, // User ID
                    { wch: 20 }, // Name
                    { wch: 15 }, // Mobile
                    { wch: 15 }, // Country
                    { wch: 10 }, // Coins
                    { wch: 10 }, // Beans
                    { wch: 20 }  // Joined Date
                  ]
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {totalRecords.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Total Users</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {users.filter((u) => u.latestCoins > 0).length}
          </p>
          <p className="text-sm text-gray-400 mt-1">Users with Coins</p>
        </div>

        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {users.filter((u) => u.latestBeans > 0).length}
          </p>
          <p className="text-sm text-gray-400 mt-1">Users with Beans</p>
        </div>

        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-pink-400">
            {
              users.filter(
                (u) =>
                  u.imagePreview &&
                  u.imagePreview.trim() !== "" &&
                  !u.imagePreview.includes("Demo.webp")
              ).length
            }
          </p>
          <p className="text-sm text-gray-400 mt-1">Users with Photos</p>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Text Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, mobile, user ID (min 4 characters)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />
            )}
          </div>

          {/* Date Filter for Joining Date */}
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

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[#1a1625] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">
                  <button
                    onClick={() => {
                      if (selectedUsers.size === filteredUsers.length && filteredUsers.length > 0) {
                        deselectAllUsers();
                      } else {
                        selectAllUsers();
                      }
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Select all/none"
                  >
                    {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                  S.No
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">
                  Image
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Coins
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Beans
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isSearching ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Searching...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.userId || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`transition-colors ${selectedUsers.has(user.userId) ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'hover:bg-white/5'}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleSelectUser(user.userId)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {selectedUsers.has(user.userId) ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {((currentPage - 1) * pageSize) + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <CopyableUserId userId={user.userId} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-white whitespace-nowrap">
                        {user.name || 'No Name'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <img
                        src={user.imagePreview || DEFAULT_AVATAR}
                        alt={user.name || 'User'}
                        onError={handleImageError}
                        onClick={() => handleImageClick(user.imagePreview || DEFAULT_AVATAR, user.name, user.userId)}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-purple-500/30 cursor-pointer hover:border-purple-500 transition-all hover:scale-110"
                        title="Click to view full image"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {user.mobile || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {user.countryName || user.country || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded">
                        <span className="text-yellow-400 text-sm">🪙</span>
                        <span className="text-xs font-medium text-yellow-400 whitespace-nowrap">
                          {parseInt(user.latestCoins || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 border border-green-500/30 rounded">
                        <span className="text-green-400 text-sm">🫘</span>
                        <span className="text-xs font-medium text-green-400 whitespace-nowrap">
                          {parseInt(user.latestBeans || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400 whitespace-nowrap">
                        {user.createDate || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(user)}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={selectedUsers.size > 0}
                          className={`p-1.5 rounded-lg transition-colors ${selectedUsers.size > 0 ? 'text-red-600 opacity-50 cursor-not-allowed' : 'text-red-400 hover:bg-red-500/20'}`}
                          title={selectedUsers.size > 0 ? "Disabled during multi-select" : "Delete"}
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
        {/* Pagination - Backend Driven */}
        <div className="p-4 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
            {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords.toLocaleString()} users
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              Rows per page:
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#3d2a60] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm text-gray-400 px-4">
                Page {currentPage} of {Math.ceil(totalRecords / pageSize) || 1}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalRecords / pageSize), prev + 1))}
                disabled={currentPage === Math.ceil(totalRecords / pageSize) || totalRecords === 0}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Confirm Dialog + Toast */}
      <AnimatePresence>
        {confirmDialog.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeConfirmDialog}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[#1a1625] border border-white/10 p-6 shadow-2xl"
            >
              <h2 className="text-xl font-semibold text-white mb-3">{confirmDialog.title}</h2>
              <p className="text-sm text-gray-300 leading-relaxed">{confirmDialog.message}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeConfirmDialog}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                >
                  {confirmDialog.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => confirmDialog.onConfirm?.()}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors"
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast.open && (
        <div className="fixed bottom-6 right-6 z-50 max-w-xs rounded-2xl px-4 py-3 shadow-2xl ring-1 ring-white/10 bg-slate-950/95">
          <p className={`text-sm ${toast.variant === 'success' ? 'text-green-300' : 'text-red-300'}`}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Image Popup Modal */}
      <AnimatePresence>
        {selectedImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-3xl w-full"
              >
                <button
                  onClick={handleClosePreview}
                  className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                {selectedImage?.url && selectedImage.url !== DEFAULT_AVATAR && (
                  <button
                    onClick={() => {
                      const previewUserId = selectedImage.userId;
                      openConfirmDialog({
                        title: 'Are you sure?',
                        message: 'Do you want to delete this image?',
                        confirmLabel: 'Yes, delete it!',
                        cancelLabel: 'Cancel',
                        variant: 'warning',
                        onConfirm: () => {
                          handleClosePreview();
                          setTimeout(() => handleDeleteImage(previewUserId), 50);
                        },
                      });
                    }}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      color: '#8F00FF',
                      cursor: 'pointer',
                      fontSize: '26px',
                      border: '2px solid #8F00FF',
                      backgroundColor: '#fff5e7',
                    }}
                    title="Delete image"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
                <div className="flex flex-col items-center">
                  <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-purple-500/30 bg-purple-900/50">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.name}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xl font-semibold text-white">{selectedImage.name || 'User'}</p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#1a1625] rounded-xl border border-white/10"
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-[#1a1625] border-b border-white/10 p-4 flex items-center justify-between z-10">
                  <h2 className="text-xl font-bold text-white">Edit User</h2>
                  <button
                    onClick={closeEditModal}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4">
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={editFormData.mobile}
                        onChange={(e) => handleEditFormChange('mobile', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={editFormData.dob}
                        onChange={(e) => handleEditFormChange('dob', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">OTP</label>
                      <input
                        type="text"
                        value={editFormData.otp}
                        onChange={(e) => handleEditFormChange('otp', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Talk About</label>
                      <input
                        type="text"
                        value={editFormData.talkAbout}
                        onChange={(e) => handleEditFormChange('talkAbout', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">About</label>
                      <textarea
                        value={editFormData.about}
                        onChange={(e) => handleEditFormChange('about', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Language</label>
                      <input
                        type="text"
                        value={editFormData.language}
                        onChange={(e) => handleEditFormChange('language', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">About 2</label>
                      <input
                        type="text"
                        value={editFormData.password}
                        onChange={(e) => handleEditFormChange('password', e.target.value)}
                        placeholder="Enter about 2"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-[#1a1625] border-t border-white/10 p-4 flex justify-end gap-3">
                  <button
                    onClick={closeEditModal}
                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!hasChanges || editSaving}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${hasChanges && !editSaving
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-purple-600/50 text-white/50 cursor-not-allowed'
                      }`}
                  >
                    {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
