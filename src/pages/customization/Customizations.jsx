import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Loader2, Search, Send, UserCheck, PackageOpen, Check } from 'lucide-react';
import { userAPI } from '../../services/api';
import Swal from 'sweetalert2';

export const Customizations = () => {
  const [activeTab, setActiveTab] = useState('HeadWear');
  const [searchUserId, setSearchUserId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  
  const [mallItems, setMallItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  
  const [isTransferring, setIsTransferring] = useState(false);

  // 1. Fetch user when 7 digits are entered
  useEffect(() => {
    const fetchUser = async () => {
      if (searchUserId.length === 7) {
        setIsSearchingUser(true);
        try {
          const res = await userAPI.getAllUsersSearch(searchUserId);
          if (res && (res.status || res.Status) && res.data && res.data.length > 0) {
            // Partial match might return many, find exact or take first
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

  // 2. Fetch mall items when tab changes
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoadingItems(true);
      setMallItems([]);
      setSelectedItemId(null); // Reset selection
      try {
        const res = await userAPI.getMallFrames(activeTab);
        if (res && (res.Status || res.status) && res.data) {
          if (res.data[activeTab]) {
            setMallItems(res.data[activeTab]);
          } else if (Array.isArray(res.data)) {
            setMallItems(res.data);
          }
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to load items', 'error');
      } finally {
        setIsLoadingItems(false);
      }
    };
    fetchItems();
  }, [activeTab]);

  // 3. Handle Transfer
  const handleTransfer = async () => {
    if (!searchedUser) return Swal.fire('Error', 'Please select a valid user', 'error');
    if (!selectedItemId) return Swal.fire('Error', 'Please select an item to transfer', 'error');

    setIsTransferring(true);
    try {
      const res = await userAPI.sendRideFrameThemeAdmin(searchedUser.UserId, selectedItemId);
      if (res && (res.status || res.Status)) {
        Swal.fire('Success', res.Message || 'Item transferred successfully', 'success');
        setSearchUserId('');
        setSearchedUser(null);
        setSelectedItemId(null);
      } else {
        Swal.fire('Error', res.Message || res.message || 'Failed to transfer item', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'An error occurred during transfer', 'error');
    } finally {
      setIsTransferring(false);
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
          <Palette className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient mb-2">Customizations</h1>
          <p className="text-gray-400">Transfer Headwear, Rides, and Themes to users</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        {['HeadWear', 'Ride', 'Theme'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                : 'glass text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab === 'HeadWear' ? 'Headwear' : tab}
          </button>
        ))}
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: User Search */}
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
                    src={searchedUser.Image || 'https://via.placeholder.com/150'} 
                    alt={searchedUser.Name} 
                    className="w-full h-full rounded-full object-cover border-4 border-purple-500/30"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 p-1.5 rounded-full border-2 border-[#1a1136]">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h4 className="text-xl font-bold text-white mb-1">{searchedUser.Name}</h4>
                <p className="text-purple-300 font-medium bg-purple-500/20 px-3 py-1 rounded-full text-sm">
                  ID: {searchedUser.UserId}
                </p>
              </motion.div>
            ) : (
              <div className="text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Enter a 7-digit ID to view user details</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Box 2: Item Selection */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-6 rounded-xl flex flex-col h-[500px]"
        >
          <div className="flex items-center gap-2 mb-6">
            <PackageOpen className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-semibold text-white">Step 2: Select {activeTab === 'HeadWear' ? 'Headwear' : activeTab} Item</h3>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {isLoadingItems ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                <p className="text-gray-400">Loading items...</p>
              </div>
            ) : mallItems.length > 0 ? (
              <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {mallItems.map((item) => (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={item.ItemId}
                      onClick={() => setSelectedItemId(item.ItemId)}
                      className={`relative flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedItemId === item.ItemId 
                          ? 'border-pink-500 bg-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
                          : 'border-white/5 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <img 
                        src={item.ItemImage} 
                        alt={item.ItemName} 
                        className="w-16 h-16 object-contain mb-2 drop-shadow-md"
                      />
                      <p 
                        className={`text-xs text-center font-medium w-full truncate ${
                          selectedItemId === item.ItemId ? 'text-pink-300' : 'text-gray-300'
                        }`} 
                        title={item.ItemName}
                      >
                        {item.ItemName}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <PackageOpen className="w-12 h-12 mb-3 opacity-20" />
                <p>No items found for this category</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Transfer Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <button
          onClick={handleTransfer}
          disabled={!searchedUser || !selectedItemId || isTransferring}
          className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          {isTransferring ? (
            <Loader2 className="w-6 h-6 animate-spin relative z-10" />
          ) : (
            <Send className="w-6 h-6 relative z-10" />
          )}
          <span className="relative z-10">{isTransferring ? 'Transferring...' : 'Complete Transfer'}</span>
        </button>
      </motion.div>
    </div>
  );
};
