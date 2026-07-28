import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  // Search, 
  Loader2,
  RefreshCw,
  Smartphone,
  Apple,
  // Users,
  // CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react';
import { userAPI, versionAPI } from '../../services/api';
import { showSuccess, showError, showWarning, showConfirm } from '../../utils/swalUtils';
export const VersionUpdate = () => {
  const [activeTab, setActiveTab] = useState('android');
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);

  // New version input states
  const [newAndroidVersion, setNewAndroidVersion] = useState('');
  const [newIOSVersion, setNewIOSVersion] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // User version check states (Commented out)
  // const [userIdInput, setUserIdInput] = useState('');
  // const [userVersion, setUserVersion] = useState(null);
  // const [userVersionLoading, setUserVersionLoading] = useState(false);
  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await versionAPI.getCurrentVersion();
      if ((response.Status || response.status) && response.data) {
        setVersions([
          { app: 'Android', versions: response.data.AndroidVersion || 'N/A', crDate: response.data.LastVersionUpdate || 'N/A' },
          { app: 'IOS', versions: response.data.IOSVersion || 'N/A', crDate: response.data.LastVersionUpdate || 'N/A' }
        ]);
      } else {
        setVersions([]);
      }
    } catch (err) {
      console.error('Fetch versions error:', err);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  // Get current version for Android or iOS
  const getCurrentVersion = (appType) => {
    const version = versions.find(v => v.app === appType);
    return version ? version.versions : 'N/A';
  };

  const getVersionDate = (appType) => {
    const version = versions.find(v => v.app === appType);
    return version ? version.crDate : 'N/A';
  };

  // Handle version update
  const handleVersionUpdate = async (isAndroid) => {
    const newVersion = isAndroid ? newAndroidVersion : newIOSVersion;

    if (!newVersion.trim()) {
      showWarning('Please enter a version number');
      return;
    }

    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to update ${isAndroid ? 'Android' : 'iOS'} version to ${newVersion}?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setUpdateLoading(true);

    try {
      const payload = isAndroid
        ? { AndroidVersion: newVersion }
        : { IOSVersion: newVersion};
      const response = await versionAPI.updateVersion(payload);

      if (response.status || response.Status) {
        showSuccess(response.message || response.Message || 'Version updated successfully');
        if (isAndroid) {
          setNewAndroidVersion('');
        } else {
          setNewIOSVersion('');
        }
        fetchVersions();
      } else {
        showError(response.message || response.Message || 'Failed to update version');
      }
    } catch (err) {
      console.error('Version update error:', err);
      showError('Failed to update version. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle user version check (Commented out)
  /*
  const handleUserVersionCheck = async () => {
    if (!userIdInput.trim()) {
      showWarning('Please enter a User ID');
      return;
    }
    
    setUserVersionLoading(true);
    setUserVersion(null);
    
    try {
      const response = await userAPI.getUserVersion(userIdInput.trim());
      
      if (response?.appVersion) {
      setUserVersion(response.appVersion);
    } else {
      setUserVersion("N/A");
      showError("Version not found");
    }
    } catch (err) {
      console.error('User version check error:', err);
      setUserVersion('N/A');
      showError('Failed to fetch user version. Please try again.');
    } finally {
      setUserVersionLoading(false);
    }
  };
  */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading app versions...</p>
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
            <RefreshCw className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Version Update</h1>
            <p className="text-gray-400">Manage app versions</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={fetchVersions}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>        </div>

      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('android')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'android'
              ? 'bg-green-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
        >
          <Smartphone className="w-4 h-4" />
          Android
        </button>
        <button
          onClick={() => setActiveTab('ios')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'ios'
              ? 'bg-gray-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
        >
          <Apple className="w-4 h-4" />
          iOS
        </button>
        {/* <button
          onClick={() => setActiveTab('user')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'user'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Users className="w-4 h-4" />
          User
        </button> */}
      </div>

      {/* Android Tab */}
      {activeTab === 'android' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Current Version Card */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-400" />
              Current Android Version
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Version</p>
                <p className="text-2xl font-bold text-green-400">{getCurrentVersion('Android')}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Last Updated</p>
                <p className="text-lg text-gray-300">{getVersionDate('Android')}</p>
              </div>
            </div>
          </div>

          {/* New Version Update */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              New App Version
            </h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={newAndroidVersion}
                onChange={(e) => setNewAndroidVersion(e.target.value)}
                placeholder="Enter new version (e.g., 2.4.0)"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-green-500 transition-all"
              />
              <button
                onClick={() => handleVersionUpdate(true)}
                disabled={updateLoading || !newAndroidVersion.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Update
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* iOS Tab */}
      {activeTab === 'ios' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Current Version Card */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Apple className="w-5 h-5 text-gray-400" />
              Current iOS Version
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Version</p>
                <p className="text-2xl font-bold text-gray-400">{getCurrentVersion('IOS')}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Last Updated</p>
                <p className="text-lg text-gray-300">{getVersionDate('IOS')}</p>
              </div>
            </div>
          </div>

          {/* New Version Update */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              New App Version
            </h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={newIOSVersion}
                onChange={(e) => setNewIOSVersion(e.target.value)}
                placeholder="Enter new version (e.g., 2.0.0)"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-gray-500 transition-all"
              />
              <button
                onClick={() => handleVersionUpdate(false)}
                disabled={updateLoading || !newIOSVersion.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Update
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Tab */}
      {/* {activeTab === 'user' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Check User App Version
            </h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="Enter User ID..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
              />
              <button
                onClick={handleUserVersionCheck}
                disabled={userVersionLoading || !userIdInput.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {userVersionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Check
              </button>
            </div>
          </div>

          {userVersion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                User App Version
              </h3>
              <div className="bg-white/5 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400 mb-2">Current Version</p>
                <p className="text-4xl font-bold text-purple-400">{userVersion}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )} */}
    </div>
  );
};
