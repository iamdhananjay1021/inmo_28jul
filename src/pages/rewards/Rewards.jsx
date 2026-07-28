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
  Gift,
  Coins,
  Radio,
  TrendingUp
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';

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

// Get today's date in DD-MM-YYYY format
const getTodayDateString = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDuration = (mins) => {
  if (!mins || mins <= 0) return '0 Mins';
  const totalMins = Math.floor(mins);
  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;

  if (hours > 0) {
    const hrText = hours === 1 ? 'Hr' : 'Hrs';
    return `${hours} ${hrText} : ${remainingMins} Mins`;
  }
  return `${remainingMins} Mins`;
};

export const Rewards = () => {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);

  // Search state
  const [searchInput, setSearchInput] = useState('');

  // Tabs state
  const [activeTab, setActiveTab] = useState('Claimed');

  // Date filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;


  // ----------UAT Slabs-----------
  // const audioSlabs = [
  //   { min: 0, max: 1, amount: 500 },
  //   { min: 1, max: 2, amount: 1000 },
  //   { min: 2, max: 3, amount: 3000 },
  //   { min: 3, max: 4, amount: 4000 },
  //   { min: 4, max: 5, amount: 5000 },
  //   { min: 5, max: 6, amount: 6000 }
  // ];

  // const videoSlabs = [
  //   { min: 0, max: 1, amount: 1000 },
  //   { min: 1, max: 2, amount: 2000 },
  //   { min: 2, max: 3, amount: 4000 },
  //   { min: 3, max: 4, amount: 5000 },
  //   { min: 4, max: 5, amount: 6000 },
  //   { min: 5, max: 6, amount: 7000 }
  // ];
  // const getDecimalHours = (time) => {
  //   if (!time) return 0;

  //   const [hh, mm] = time.split(":");
  //   const hours = Number(hh);
  //   const minutes = Number(mm);

  //   return hours + minutes / 60;
  // };
  // const getAllowedAmount = (row) => {
  //   const duration = getDecimalHours(row.liveDuration);
  //   const type = row.type?.toLowerCase();

  //   const slabs = type === "audio" ? audioSlabs : videoSlabs;

  //   const matchedSlab = slabs.find(
  //     (slab) => duration >= slab.min && duration < slab.max
  //   );

  //   return matchedSlab ? matchedSlab.amount : 0;
  // };
  const conditionalRowStyles = [

    {
      when: (row) => {
        const allowed = getAllowedAmount(row);
        return Number(row.beanAmount) > allowed;
      },
      style: {
        backgroundColor: "#ffe5e5",
        color: "#b30000",
        // fontWeight: "bold"
      }
    },

    {
      when: (row) => {
        const allowed = getAllowedAmount(row);
        return Number(row.beanAmount) === allowed;
      },
      style: {
        backgroundColor: "#e6ffed",
        color: "#008000",
        // fontWeight: "bold"
      }
    }
  ];

  // -----------------prod slabs----------------
  const getTotalMinutes = (time) => {
    if (!time) return 0;

    const [hh, mm] = time.split(":");
    return Number(hh) * 60 + Number(mm);
  };
  const getAllowedAmount = (row) => {
    const totalMinutes = getTotalMinutes(row.liveDuration);
    const type = row.type?.toLowerCase();

    if (type === "audio") {
      if (totalMinutes >= 60 && totalMinutes < 120) return 1000;
      if (totalMinutes >= 120 && totalMinutes < 180) return 3000;
      if (totalMinutes >= 180 && totalMinutes < 240) return 6000;
      if (totalMinutes >= 240 && totalMinutes < 300) return 9000;
      if (totalMinutes >= 300 && totalMinutes < 360) return 12000;
      if (totalMinutes >= 360) return 15000;
    }

    if (type === "video") {
      if (totalMinutes >= 60 && totalMinutes < 120) return 1500;
      if (totalMinutes >= 120 && totalMinutes < 180) return 3500;
      if (totalMinutes >= 180 && totalMinutes < 240) return 6500;
      if (totalMinutes >= 240 && totalMinutes < 300) return 9500;
      if (totalMinutes >= 300 && totalMinutes < 360) return 12500;
      if (totalMinutes >= 360) return 15500;
    }

    return 0;
  };
  const fetchRewards = async (tab = activeTab, from = fromDate, to = toDate) => {
    try {
      setLoading(true);
      let response;
      if (tab === 'Unclaimed') {
        response = await userAPI.getTodayUnclaimedRewards();
      } else {
        response = await userAPI.getClaimedRewards('', from, to);
      }

      if (response && (response.status || response.Status)) {
        const rawData = response.data || [];
        // Standardize properties to lower camelCase for UI compatibility
        const standardData = rawData.map(item => ({
          ...item,
          id: item.id || item.Id,
          userId: item.userId || item.UserId,
          userName: item.userName || item.Name || item.UserName,
          image: item.image || item.Image,
          rewardDate: item.rewardDate || item.RewardDate,
          type: item.type || item.Type,
          roomsHosted: item.roomsHosted || item.RoomsHosted,
          hostDurationMins: item.hostDurationMins || item.HostDurationMins,
          userDurationMins: item.userDurationMins || item.UserDurationMins,
          totalBeansReceived: item.totalBeansReceived || item.TotalBeansReceived,
          rewardBeans: item.rewardBeans || item.RewardBeans,
          insertedDate: item.insertedDate || item.ClaimedAt || item.Created_Date || item.RewardDate,
          beanAmount: item.beanAmount || item.RewardBeans // For stats
        }));
        setRewards(standardData);
      } else {
        setRewards([]);
      }
    } catch (err) {
      console.error('Fetch rewards error:', err);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchInput('');
    setCurrentPage(1);
    if (tab === 'Unclaimed') {
      setFromDate('');
      setToDate('');
      setDateFilterActive(false);
    }
    fetchRewards(tab);
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;

    try {
      // Handles:
      // 20/05/2026 08:22:46
      // 20-05-2026 08:22:46

      const [datePart, timePart = "00:00:00"] = dateString.split(" ");

      let dd, mm, yyyy;

      if (datePart.includes("/")) {
        [dd, mm, yyyy] = datePart.split("/");
      } else if (datePart.includes("-")) {
        [dd, mm, yyyy] = datePart.split("-");
      } else {
        return null;
      }

      const [hh = 0, min = 0, ss = 0] = timePart.split(":");

      const parsedDate = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(min),
        Number(ss)
      );

      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    } catch (error) {
      console.error("Date parse error:", error);
      return null;
    }
  };
  const isDateInRange = (dateString) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    const itemDate = parseDate(dateString);

    if (!itemDate) return false;

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from) {
      from.setHours(0, 0, 0, 0);
    }

    if (to) {
      to.setHours(23, 59, 59, 999);
    }

    return (
      (!from || itemDate.getTime() >= from.getTime()) &&
      (!to || itemDate.getTime() <= to.getTime())
    );
  };

  // Filter rewards
  const filteredRewards = useMemo(() => {
    return rewards.filter(reward => {
      // Search filter
      const searchLower = searchInput.toLowerCase().trim();
      const matchesSearch = !searchInput || (
        String(reward.userId || '').toLowerCase().includes(searchLower) ||
        String(reward.userName || '').toLowerCase().includes(searchLower) ||
        String(reward.type || '').toLowerCase().includes(searchLower)
      );

      // Date filter - check insertedDate
      const matchesDate = !dateFilterActive || isDateInRange(reward.insertedDate);

      return matchesSearch && matchesDate;
    });
  }, [rewards, searchInput, dateFilterActive, fromDate, toDate]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRewards.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRewards = filteredRewards.slice(startIndex, startIndex + itemsPerPage);

  const handleDateFilter = () => {
    setDateFilterActive(!!fromDate || !!toDate);
    setCurrentPage(1);
    fetchRewards(activeTab, fromDate, toDate);
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setDateFilterActive(false);
    setCurrentPage(1);
    fetchRewards(activeTab, '', '');
  };

  // Calculate stats
  const stats = useMemo(() => {
    const todayDate = getTodayDateString();

    // Calculate today's total beans - check insertedDate for today's date
    const todayBeans = rewards.reduce((sum, r) => {
      const insertedDate = r.insertedDate ? r.insertedDate.split(' ')[0] : '';
      if (insertedDate === todayDate) {
        return sum + (parseFloat(r.beanAmount) || 0);
      }
      return sum;
    }, 0);

    const totalBeans = rewards.reduce((sum, r) => sum + (parseFloat(r.beanAmount) || 0), 0);
    const audioCount = rewards.filter(r => r.type === 'Audio').length;
    const videoCount = rewards.filter(r => r.type === 'Video').length;

    return {
      total: rewards.length,
      todayBeans,
      totalBeans,
      audioCount,
      videoCount
    };
  }, [rewards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading rewards...</p>
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
          <div className="p-3 bg-yellow-500/20 rounded-lg">
            <Gift className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Rewards</h1>
            <p className="text-gray-400">Total {stats.total.toLocaleString()} rewards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRewards}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <DownloadExcelButton
            data={rewards.map((reward, index) => ({
              ...reward,
              serialNumber: index + 1
            }))}
            columns={[
              { key: 'serialNumber', header: 'S.No' },
              { key: 'id', header: 'ID' },
              { key: 'userId', header: 'User ID' },
              { key: 'userName', header: 'User Name', formatter: (value) => value || 'N/A' },
              { key: 'rewardDate', header: 'Reward Date', formatter: (value) => value || 'N/A' },
              { key: 'type', header: 'Type', formatter: (value) => value || 'N/A' },
              { key: 'roomsHosted', header: 'Rooms Hosted', formatter: (value) => value || 0 },
              { key: 'hostDurationMins', header: 'Host Duration', formatter: (value) => formatDuration(value) },
              { key: 'userDurationMins', header: 'User Duration', formatter: (value) => formatDuration(value) },
              // { key: 'totalBeansReceived', header: 'Total Beans Received', formatter: (value) => parseFloat(value || 0) },
              { key: 'rewardBeans', header: 'Reward Beans', formatter: (value) => parseFloat(value || 0) },
              { key: 'isClaimed', header: 'Claimed Status', formatter: () => activeTab },
              { key: 'insertedDate', header: 'Claimed Date', formatter: (value) => activeTab === 'Unclaimed' ? 'N/A' : (value || 'N/A') }
            ]}
            filename={`rewards_${new Date().toISOString().split('T')[0]}.xlsx`}
            options={{
              colWidths: [
                { wch: 8 },  // S.No
                { wch: 10 }, // ID
                { wch: 15 }, // User ID
                { wch: 20 }, // User Name
                { wch: 12 }, // Reward Date
                { wch: 10 }, // Type
                { wch: 12 }, // Rooms Hosted
                { wch: 20 }, // Host Duration
                { wch: 20 }, // User Duration
                // { wch: 20 }, // Total Beans Received
                { wch: 15 }, // Reward Beans
                { wch: 15 }, // Claimed Status
                { wch: 20 }  // Claimed Date
              ]
            }}
          />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
            <Coins className="w-6 h-6" />
            {stats.todayBeans.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Today's Beans</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.totalBeans.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Beans</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400 flex items-center justify-center gap-2">
            <Radio className="w-6 h-6" />
            {stats.audioCount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Audio Rewards</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-400 flex items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {stats.videoCount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Video Rewards</p>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => handleTabChange('Claimed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'Claimed' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Claimed Rewards
          </button>
          <button
            onClick={() => handleTabChange('Unclaimed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'Unclaimed' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Unclaimed Rewards (Today)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by User ID, Name, or Type..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* Date Filter */}
          {activeTab === 'Claimed' && (
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
          )}
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
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">S.No</th>
                {/* <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th> */}
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User Image</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User Name</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reward Date</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rooms Hosted</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Host Duration</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User Duration</th>
                {/* <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Beans Received</th> */}
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reward Beans</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Claimed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedRewards.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-6 py-8 text-center text-gray-400">No Records Found</td>
                </tr>
              ) : (
                paginatedRewards.map((reward, index) => (
                  <motion.tr
                    key={reward.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">{startIndex + index + 1}</span>
                    </td>
                    {/* <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">{reward.id}</span>
                    </td> */}
                    <td className="px-4 py-4">
                      {(() => {
                        const allowed = getAllowedAmount(reward);
                        const claimed = Number(reward.beanAmount);

                        let textColor = "";

                        if (claimed > allowed) {
                          textColor = "#ff4d4d"; // red
                        } else if (claimed === allowed) {
                          textColor = "#4ade80"; // green
                        }

                        return (
                          <div
                            style={{
                              color: textColor,
                            }}
                          >
                            <CopyableUserId userId={reward.userId} />
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4">
                      <img
                        src={reward.image}
                        alt=""
                        className="w-6 h-6 rounded-full border border-white/10"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {/* <img
                            src={reward.image}
                            alt=""
                            className="w-6 h-6 rounded-full border border-white/10"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          /> */}
                        <span className="text-sm font-medium text-white">{reward.userName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">
                        {reward.rewardDate
                          ? new Date(reward.rewardDate).toLocaleDateString("en-GB")
                          : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${reward.type === 'Audio'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                        }`}>
                        <Radio className="w-3 h-3" />
                        {reward.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300">{reward.roomsHosted}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-orange-400">{formatDuration(reward.hostDurationMins)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-blue-400">{formatDuration(reward.userDurationMins)}</span>
                    </td>
                    {/* <td className="px-4 py-4">
                      <span className="text-sm text-yellow-500">{parseFloat(reward.totalBeansReceived || 0).toLocaleString()}</span>
                    </td> */}
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-yellow-400">
                        {parseFloat(reward.rewardBeans || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${activeTab === 'Claimed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                        {activeTab}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">{activeTab === 'Claimed' ? (reward.insertedDate || 'N/A') : 'N/A'}</span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {filteredRewards.length > 0
              ? `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filteredRewards.length)} of ${filteredRewards.length} entries`
              : 'No records to display'
            }
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-4">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
