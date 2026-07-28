import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  UserCheck,
  Smartphone,
  Key,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { userAPI } from '../../services/api';
import Swal from 'sweetalert2';
import { showSuccess, showError } from '../../utils/swalUtils';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%239333ea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E👤%3C/text%3E%3C/svg%3E';

// Helper to generate non-editable random 6-digit reseller ID
const generateRandomResellerId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const CreateReseller = () => {
  const [searchUserId, setSearchUserId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  // Side Box inputs
  const [generatedResellerId, setGeneratedResellerId] = useState('');
  const [resellerNumber, setResellerNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate the 6-digit Reseller ID once when component mounts or on reset
  useEffect(() => {
    setGeneratedResellerId(generateRandomResellerId());
  }, []);

  // Search user when 7 digits are entered
  useEffect(() => {
    const fetchUser = async () => {
      if (searchUserId.length === 7) {
        setIsSearchingUser(true);
        try {
          const res = await userAPI.getAllUsersSearch(searchUserId);
          if (res && (res.status || res.Status) && res.data && res.data.length > 0) {
            const user = res.data.find(u => String(u.UserId) === searchUserId) || res.data[0];
            setSearchedUser(user);
          } else {
            setSearchedUser(null);
            Swal.fire('Not Found', 'User not found', 'info');
          }
        } catch (err) {
          console.error(err);
          setSearchedUser(null);
          Swal.fire('Error', 'Failed to search user', 'error');
        } finally {
          setIsSearchingUser(false);
        }
      } else {
        setSearchedUser(null);
      }
    };

    const timer = setTimeout(() => {
      fetchUser();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchUserId]);

  const handleReset = () => {
    setSearchUserId('');
    setSearchedUser(null);
    setResellerNumber('');
    setPassword('');
    setGeneratedResellerId(generateRandomResellerId());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!searchedUser) {
      Swal.fire('Error', 'Please search and select a valid 7-Digit user first.', 'error');
      return;
    }
    if (!resellerNumber.trim()) {
      Swal.fire('Error', 'Please enter a Reseller Number.', 'error');
      return;
    }
    if (!password.trim()) {
      Swal.fire('Error', 'Please enter a Password.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        UserId: searchedUser.UserId || searchedUser.userId,
        AdminId: generatedResellerId,
        Password: password,
        ResellerNumber: resellerNumber
      };

      const response = await userAPI.createResellerId(payload);
      console.log('Create reseller API Response:', response);

      if (response?.status === true || response?.Status === true) {
        showSuccess(response.message || response.Message || 'Reseller created successfully!');
        handleReset();
      } else {
        showError(response.message || response.Message || 'Failed to create reseller');
      }
    } catch (err) {
      console.error('Create reseller error:', err);
      showError(err.response?.data?.Message || err.response?.data?.message || 'Failed to create reseller. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="p-3 bg-purple-500/20 rounded-lg">
          <KeyRound className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient mb-2">Create Reseller</h1>
          <p className="text-gray-400">Search User and configure Reseller credentials</p>
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Box 1: User Search (Step 1) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-6 rounded-xl flex flex-col h-[500px]"
        >
          <div className="flex items-center gap-2 mb-6">
            <UserCheck className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Step 1: Select User</h3>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              maxLength={7}
              placeholder="Enter 7-Digit User ID"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="mt-8 flex-1 flex flex-col justify-center">
            {isSearchingUser ? (
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Searching user...</p>
              </div>
            ) : searchedUser ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-white/10"
              >
                <div className="relative w-24 h-24 mb-4">
                  <img
                    src={searchedUser.Image || searchedUser.ProfilePhoto || DEFAULT_AVATAR}
                    alt={searchedUser.Name || 'User'}
                    className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
                <h4 className="text-xl font-semibold text-white mb-1">
                  {searchedUser.Name || 'No Name'}
                </h4>
                <p className="text-sm font-mono text-purple-300">
                  ID: {searchedUser.UserId || searchedUser.userId}
                </p>
              </motion.div>
            ) : (
              <div className="text-center text-gray-500">
                Enter a 7-digit user ID to display profile info
              </div>
            )}
          </div>
        </motion.div>

        {/* Box 2: Reseller Details & Submit (Step 2) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-6 rounded-xl flex flex-col h-[500px] justify-between"
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Key className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Step 2: Reseller Info</h3>
              </div>

              {/* Reseller ID (Non-editable) */}
              <div className="space-y-2 mb-4">
                <label className="text-sm text-gray-400">Generated Reseller ID</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={generatedResellerId}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed select-none focus:outline-none"
                />
              </div>

              {/* Reseller Number (Custom input) */}
              <div className="space-y-2 mb-4">
                <label className="text-sm text-gray-400">Reseller Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter Reseller Number"
                    value={resellerNumber}
                    onChange={(e) => setResellerNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2 mb-6">
                <label className="text-sm text-gray-400">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !searchedUser}
              className={`w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Reseller...
                </>
              ) : (
                'Submit Reseller'
              )}
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
};
