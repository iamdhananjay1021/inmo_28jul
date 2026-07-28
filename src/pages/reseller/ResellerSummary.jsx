import { copyToClipboard } from '../../utils/clipboardUtils';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  Trash2,
  Coins, MinusCircle, PlusCircle, Key, Eye, EyeOff, X
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';
import { showSuccess, showError, showWarning, showConfirm } from '../../utils/swalUtils';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%239333ea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E👤%3C/text%3E%3C/svg%3E';

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

const PasswordCell = ({ password }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!password || password === 'N/A') return;
    try {
      await copyToClipboard(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  if (!password || password === 'N/A') {
    return <span className="text-sm text-gray-500 font-mono">N/A</span>;
  }

  return (
    <div className="flex items-center gap-1.5 font-mono text-sm">
      <span className="text-purple-300 font-medium select-all">
        {showPassword ? password : '••••••••'}
      </span>
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="p-1 text-gray-400 hover:text-white transition-colors rounded"
        title={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 text-gray-400 hover:text-purple-400 transition-colors rounded"
        title="Copy password"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

const UpdatePasswordModal = ({ reseller, onClose, onSuccess }) => {
  const [oldPassword, setOldPassword] = useState(
    reseller.password && reseller.password !== 'N/A' ? reseller.password : ''
  );
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newPassword.trim()) {
      showWarning('Please enter a new password');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        UserId: String(reseller.userId),
        OldPassword: oldPassword.trim(),
        NewPassword: newPassword.trim()
      };

      const response = await userAPI.updateResellerPassword(payload);
      const isSuccess = response?.Status === true || response?.status === true;

      if (isSuccess) {
        showSuccess(response.Message || response.message || 'Password updated successfully');
        onSuccess();
      } else {
        showError(response.Message || response.message || 'Failed to update password');
      }
    } catch (err) {
      console.error('Update password error:', err);
      showError(err.response?.data?.Message || err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#1a1625] border border-white/10 rounded-xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-purple-400">
            <Key className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">Update Reseller Password</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Reseller User ID</label>
            <input
              type="text"
              value={`${reseller.name || 'Reseller'} (${reseller.userId})`}
              disabled
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Old Password</label>
            <input
              type="text"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter old password"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">New Password *</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !newPassword.trim()}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Update Password
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const ResellerSummary = () => {
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resellers, setResellers] = useState([]);
  const [coinAmounts, setCoinAmounts] = useState({});

  // Password Modal states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedResellerForPassword, setSelectedResellerForPassword] = useState(null);

  console.log("coinAmounts", coinAmounts)
  // Search state
  const [searchInput, setSearchInput] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  const fetchResellers = async () => {
    try {
      setLoading(true);

      const response = await userAPI.getResellerList();

      if (response?.Status) {
        const mappedResellers = (response.data || []).map(item => ({
          userId: item.UserId,
          adminId: item.AdminId,
          name: item.Name,
          mobileNumber: item.MobileNumber,
          image: item.Image,
          password: item.Password || item.password || item.PassWord || 'N/A',

          availableCoins: Number(item.LatestCoinAmount || 0),

          createdDate: item.CreatedAt,

          totalSendingToday: item.TotalSendingToday || 0,
          totalSendingWeekly: item.TotalSendingWeekly || 0,
          totalSendingMonthly: item.TotalSendingMonthly || 0,
        }));

        setResellers(mappedResellers);
      } else {
        setResellers([]);
      }
    } catch (err) {
      console.error(err);
      setResellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResellers();
  }, []);

  const handleCoinAmountChange = async (userId, value) => {
    setCoinAmounts(prev => ({ ...prev, [userId]: value }));
  };

  // Filter resellers
  const filteredResellers = useMemo(() => {
    return resellers.filter((reseller) => {
      const searchLower = searchInput.toLowerCase();

      return (
        !searchInput ||
        reseller.userId?.toLowerCase().includes(searchLower) ||
        reseller.name?.toLowerCase().includes(searchLower) ||
        reseller.mobileNumber?.includes(searchLower)
      );
    });
  }, [resellers, searchInput]);

  // Pagination
  const totalPages = Math.ceil(filteredResellers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResellers = filteredResellers.slice(startIndex, startIndex + itemsPerPage);

  // Handle Remove
  const handleRemove = async (reseller) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to remove reseller: ${reseller.userName} (${reseller.userId})?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setActionLoading(prev => ({ ...prev, [reseller.userId]: true }));

    try {
      const response = await userAPI.removeReseller(reseller.userId);

      if (response.status) {
        showSuccess(response.message || 'Reseller removed successfully');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to remove reseller');
      }
    } catch (err) {
      console.error('Remove error:', err);
      showError('Failed to remove reseller. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [reseller.userId]: false }));
    }
  };

  const handleAddDeduct = async (reseller, type) => {
    const amount = Number(coinAmounts[reseller.userId]);

    if (!amount || amount <= 0) {
      showError("Please enter a valid coin amount.");
      return;
    }

    const { isConfirmed } = await showConfirm({
      title: `${type} Coins`,
      text: `Are you sure you want to ${type === "Credit" ? "credit" : "debit"} ${amount} coins ${type === "Credit" ? "to" : "from"} ${reseller.name} (${reseller.userId})?`,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
      variant: "warning",
    });

    if (!isConfirmed) return;

    setActionLoading((prev) => ({
      ...prev,
      [reseller.userId]: true,
    }));

    try {
      const payload = {
        ResellerId: reseller.userId,
        CoinAmount: amount,
        Type: type,
      };

      console.log("AdminToResellerCoinTransfer Payload :", payload);

      const response = await userAPI.adminToResellerCoinTransfer(payload);

      if (!response.Status && !response.status) {
        await fetchResellers()
        throw new Error(response.Message || response.message);
      }

      showSuccess(response.Message || "Transaction successful.");

    } catch (err) {
      console.error(err);
      showError(err.message || "Transaction failed.");
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [reseller.userId]: false,
      }));
    }
  };


  // const handleAddDeduct = async (reseller, transactionType) => {
  //   const amount = coinAmounts[reseller.userId];

  //   if (!amount || parseFloat(amount) <= 0) {
  //     showWarning("Please enter a valid coin amount");
  //     return;
  //   }

  //   const { isConfirmed } = await showConfirm({
  //     title: `Confirm ${transactionType}`,
  //     text: `Are you sure you want to ${transactionType} ${amount} coins ${transactionType === "Add" ? "to" : "from"
  //       } ${reseller.name} (${reseller.userId})?`,
  //     confirmButtonText: "Yes, Proceed",
  //     cancelButtonText: "Cancel",
  //     variant: "warning",
  //   });

  //   if (!isConfirmed) return;

  //   setActionLoading((prev) => ({
  //     ...prev,
  //     [reseller.userId]: true,
  //   }));

  //   const payload = {
  //     ResellerId: reseller.userId,
  //     CoinAmount: amount,
  //     Type: type,
  //   };

  //   try {
  //     const response = await userAPI.addDeductResellerCoin(payload);

  //     showSuccess(
  //       response.message ||
  //       `Coins ${transactionType === "Add" ? "added" : "deducted"} successfully`
  //     );

  //     setCoinAmounts((prev) => ({
  //       ...prev,
  //       [reseller.userId]: "",
  //     }));

  //     window.location.reload();

  //   } catch (err) {
  //     console.error(`${transactionType} error:`, err);
  //     showError(`Failed to ${transactionType.toLowerCase()} coins. Please try again.`);
  //   } finally {
  //     setActionLoading((prev) => ({
  //       ...prev,
  //       [reseller.userId]: false,
  //     }));
  //   }
  // };


  // Calculate stats


  const stats = useMemo(() => {
    const totalCoinAmount = resellers.reduce(
      (sum, r) => sum + r.availableCoins,
      0
    );

    return {
      total: resellers.length,
      totalCoinAmount,
    };
  }, [resellers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading resellers...</p>
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
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Reseller Summary</h1>
            <p className="text-gray-400">Total {resellers.length.toLocaleString()} resellers</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={fetchResellers}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <DownloadExcelButton
            data={filteredResellers.map((reseller, index) => ({ ...reseller, serialNumber: index + 1 }))}
            columns={[
              { key: "serialNumber", header: "S.No" },
              { key: "userId", header: "User ID" },
              { key: "name", header: "Username" },
              { key: "password", header: "Password" },
              { key: "adminId", header: "Admin ID" },
              { key: "availableCoins", header: "Available Coins" },
              { key: "totalSendingToday", header: "Today Sent" },
              { key: "totalSendingWeekly", header: "Weekly Sent" },
              { key: "totalSendingMonthly", header: "Monthly Sent" },
              { key: "createdDate", header: "Created Date" },
            ]}
            filename={`reseller_summary_${new Date().toISOString().split('T')[0]}.xlsx`}
            options={{ colWidths: [{ wch: 8 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 18 }] }}
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
          <p className="text-sm text-gray-400 mt-1">Total Resellers</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {stats.totalCoinAmount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Total Coin Amount</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by User ID or Name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
          />
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
                  Image
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Password
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reseller ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Available Coins
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Today Sent
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Weekly Sent
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Monthly Sent
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Coin Amount
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedResellers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedResellers.map((reseller, index) => (
                  <motion.tr
                    key={reseller.userId}
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
                      <CopyableUserId userId={reseller.userId} />
                    </td>
                    <td className="px-4 py-4">

                      <div
                        onClick={() =>
                          setPreviewImage(
                            reseller?.image ||
                            DEFAULT_AVATAR
                          )
                        }
                        className="w-11 h-11 rounded-full overflow-hidden border border-white/20 bg-gray-800 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      >
                        <img
                          src={
                            reseller?.image ||
                            DEFAULT_AVATAR
                          }
                          alt={reseller?.name || "User"}
                          className="w-full h-full object-cover"
                        // onError={(e) => {
                        //   e.currentTarget.onerror = null;
                        //   e.currentTarget.src = DEFAULT_AVATAR;
                        // }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-white">
                        {reseller.name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <PasswordCell password={reseller.password} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-white">
                        {reseller.adminId || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-green-400 font-semibold">
                        {parseFloat(reseller.availableCoins || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-cyan-400 font-semibold">
                        {reseller.totalSendingToday.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-sm text-orange-400 font-semibold">
                        {reseller.totalSendingWeekly.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-sm text-pink-400 font-semibold">
                        {reseller.totalSendingMonthly.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">
                        {reseller.createdDate || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        value={coinAmounts[reseller.userId] || ''}
                        onChange={(e) => handleCoinAmountChange(reseller.userId, e.target.value)}
                        placeholder="Enter amount"
                        className="w-28 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleAddDeduct(reseller, "Credit")}
                          disabled={actionLoading[reseller.userId] || !coinAmounts[reseller.userId]}
                          className="flex items-center gap-1 me-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[reseller.userId] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <PlusCircle className="w-3 h-3" />
                          )}
                          Add
                        </button>

                        <button
                          onClick={() => handleAddDeduct(reseller, "Debit")}
                          disabled={actionLoading[reseller.userId] || !coinAmounts[reseller.userId]}
                          className="flex items-center gap-1 me-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[reseller.userId] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <MinusCircle className="w-3 h-3" />
                          )}
                          Deduct
                        </button>
                        <button
                          onClick={() => {
                            setSelectedResellerForPassword(reseller);
                            setPasswordModalOpen(true);
                          }}
                          disabled={actionLoading[reseller.userId]}
                          className="flex items-center gap-1 me-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50"
                          title="Update Password"
                        >
                          <Key className="w-3 h-3" />
                          Password
                        </button>

                        <button
                          onClick={() => handleRemove(reseller)}
                          disabled={actionLoading[reseller.userId]}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                        >
                          {actionLoading[reseller.userId] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Remove
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
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredResellers.length)} of {filteredResellers.length} entries
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
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white text-3xl hover:text-red-400"
            >
              ✕
            </button>

            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/600x400?text=No+Image";
              }}
            />
          </div>
        </div>
      )}

      {passwordModalOpen && selectedResellerForPassword && (
        <UpdatePasswordModal
          reseller={selectedResellerForPassword}
          onClose={() => {
            setPasswordModalOpen(false);
            setSelectedResellerForPassword(null);
          }}
          onSuccess={() => {
            setPasswordModalOpen(false);
            setSelectedResellerForPassword(null);
            fetchResellers();
          }}
        />
      )}
    </div>
  );
};
