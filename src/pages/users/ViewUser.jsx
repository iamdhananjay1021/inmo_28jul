import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Download,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Gift,
  Gamepad2,
  CreditCard,
  Coins,
  Bean,
  ArrowRightLeft,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { userAPI } from '../../services/api';
import DownloadExcelButton from '../../components/DownloadExcelButton';

// Default avatar
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%239333ea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E👤%3C/text%3E%3C/svg%3E';

const TABS = [
  // { id: 'exchange', label: 'Exchange History', icon: ArrowRightLeft },
  { id: 'game', label: 'Game History', icon: Gamepad2 },
  { id: 'gift', label: 'Gift History', icon: Gift },
  // { id: 'giftSending', label: 'Gift Sending', icon: Gift },
  // { id: 'rewardGiftSummary', label: 'Reward & Gift Summary', icon: Gift },
  // { id: 'payment', label: 'Payment History', icon: CreditCard },
  // { id: 'pk', label: 'PK Receivings', icon: Users },
  // { id: 'coinsBeans', label: 'Coins & Beans', icon: Coins },
];

export const ViewUser = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || {};

  const [activeTab, setActiveTab] = useState('game');
  const [giftSubTab, setGiftSubTab] = useState('sent'); // 'sent' or 'received'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Date filters
  const today = new Date();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const [fromDate, setFromDate] = useState(oneYearAgo.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);

  // Data states
  const [gameHistory, setGameHistory] = useState([]);
  const [giftSentHistory, setGiftSentHistory] = useState([]);
  const [giftReceivedHistory, setGiftReceivedHistory] = useState([]);
  const [manualDateSelected, setManualDateSelected] = useState(false);

  // Pagination states for each tab
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Summary totals
  const [totals, setTotals] = useState({
    totalWinAmount: 0,
    totalBetAmount: 0,
    totalExchangedBeans: 0,
    totalGiftReceiving: 0,
    totalGiftSending: 0,
    totalPurchasing: 0,
    totalPkReceivings: 0,
    latestCoins: 0,
    latestBeans: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [gameResponse, giftResponse] = await Promise.all([
        userAPI.getGameRecords(userId).catch(() => ({ Status: false })),
        userAPI.getGiftRecords(userId).catch(() => ({ Status: false }))
      ]);

      let gameData = [];
      if (gameResponse.Status || gameResponse.status) {
        gameData = gameResponse.data || [];
        setGameHistory(gameData);
      } else {
        setGameHistory([]);
      }

      let sentData = [];
      let receivedData = [];
      if (giftResponse.Status || giftResponse.status) {
        sentData = giftResponse.data?.Sent || [];
        receivedData = giftResponse.data?.Received || [];
        setGiftSentHistory(sentData);
        setGiftReceivedHistory(receivedData);
      } else {
        setGiftSentHistory([]);
        setGiftReceivedHistory([]);
      }

      // Calculate totals
      const totalWinAmount = gameData.reduce((sum, item) => sum + (parseFloat(item.WinAmount) || 0), 0);
      const totalBetAmount = gameData.reduce((sum, item) => sum + (parseFloat(item.TotalBet) || 0), 0);
      const totalGiftSending = sentData.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
      const totalGiftReceiving = receivedData.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);

      // Latest coins and beans fallback
      const latestCoins = parseFloat(user.latestCoins) || 0;
      const latestBeans = parseFloat(user.latestBeans) || 0;

      setTotals({
        totalWinAmount,
        totalBetAmount,
        totalExchangedBeans: parseFloat(user.totalExchangedBeans) || 0,
        totalGiftReceiving,
        totalGiftSending,
        totalPurchasing: parseFloat(user.totalPurchasing) || 0,
        totalPkReceivings: parseFloat(user.totalPkReceivings) || 0,
        latestCoins,
        latestBeans,
      });

      // Reset to first page when data changes
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const isDateInRange = (dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return true;
    
    const start = fromDate ? new Date(fromDate + 'T00:00:00') : null;
    const end = toDate ? new Date(toDate + 'T23:59:59') : null;
    
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  };

  const getCurrentData = () => {
    let rawData = [];
    if (activeTab === 'game') {
      rawData = gameHistory;
    } else if (activeTab === 'gift') {
      rawData = giftSubTab === 'sent' ? giftSentHistory : giftReceivedHistory;
    }

    return rawData.filter(item => {
      const dateStr = item.Created_Date || item.createdDate || item.CreatedDate;
      return isDateInRange(dateStr);
    });
  };

  const getColumns = () => {
    switch (activeTab) {
      case 'game':
        return [
          { key: 'Created_Date', label: 'Date' },
          { key: 'GameType', label: 'Game Type' },
          { key: 'TotalBet', label: 'Total Bet' },
          { key: 'WinAmount', label: 'Win Amount' },
          { key: 'UpdatedCoins', label: 'Updated Coins' },
          { key: 'RoomId', label: 'Room ID' },
        ];
      case 'gift':
        return [
          { key: 'Created_Date', label: 'Date' },
          { key: 'SenderId', label: 'Sender ID' },
          { key: 'ReceiverId', label: 'Receiver ID' },
          { key: 'RoomId', label: 'Room ID' },
          { key: 'Amount', label: 'Amount' },
          { key: 'Type', label: 'Type' },
        ];
      default:
        return [];
    }
  };

  const formatCellValue = (row, key) => {
    const val = row[key];
    if (key === 'Created_Date') {
      if (!val) return 'N/A';
      try {
        return new Date(val).toLocaleString('en-IN');
      } catch (e) {
        return val;
      }
    }
    if (val === true) return 'Yes';
    if (val === false) return 'No';
    return val ?? 'N/A';
  };

  const renderTable = () => {
    const data = getCurrentData();
    const columns = getColumns();

    console.log('renderTable - activeTab:', activeTab, 'data:', data, 'columns:', columns);

    // Ensure data is an array
    if (!Array.isArray(data)) {
      return (
        <div className="text-center py-12 text-gray-400">
          Invalid data format
        </div>
      );
    }

    // Pagination
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

    if (data.length === 0) {
      return (
        <div>
          {activeTab === 'gift' && (
            <div className="flex gap-4 mb-6 border-b border-white/5 pb-4">
              <button
                onClick={() => {
                  setGiftSubTab('sent');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  giftSubTab === 'sent'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Sent Gifts
              </button>
              <button
                onClick={() => {
                  setGiftSubTab('received');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  giftSubTab === 'received'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Received Gifts
              </button>
            </div>
          )}
          <div className="text-center py-12 text-gray-400">
            No data available for this period
          </div>
        </div>
      );
    }

    return (
      <div>
        {activeTab === 'gift' && (
          <div className="flex gap-4 mb-6 border-b border-white/5 pb-4">
            <button
              onClick={() => {
                setGiftSubTab('sent');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                giftSubTab === 'sent'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Sent Gifts
            </button>
            <button
              onClick={() => {
                setGiftSubTab('received');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                giftSubTab === 'received'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Received Gifts
            </button>
          </div>
        )}

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[#1a1625] sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-300">
                      {formatCellValue(row, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
       

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
            </p>
             <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Rows per page:
            </span>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
           className="bg-[#3d2a60] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors"

            >
              {[20, 50, 100, 250, 500, 1000].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* <p className="text-sm text-gray-400">
            Total: {totalItems} rows
          </p> */}
        </div>
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
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate('/users/app-users')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <div className="flex items-center gap-4">
          <img
            src={user.imagePreview || DEFAULT_AVATAR}
            alt={user.name}
            className="w-16 h-16 rounded-lg object-cover border-2 border-purple-500/30"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">{user.name || 'User Details'}</h1>
            <p className="text-gray-400">User ID: {user.userId}</p>
            <p className="text-gray-400">{user.mobile}</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
      >
        <div className="glass rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-400">{totals.totalWinAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total Win Amount</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-purple-400">{totals.totalBetAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total Bet Amount</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-orange-400">{totals.totalExchangedBeans.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total Exchanged Beans</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-pink-400">{totals.totalGiftReceiving.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total Gift Receiving</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-purple-400">{totals.totalGiftSending.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total Gift Sending</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-yellow-400">{totals.totalPurchasing.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total Purchasing</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{totals.totalPkReceivings.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total PK Receivings</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-orange-400">{totals.latestCoins.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Latest Coins</p>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-red-400">{totals.latestBeans.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Latest Beans</p>
        </div>
      </motion.div>

      {/* Date Filter & Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setManualDateSelected(true);
              }}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setManualDateSelected(true);
              }}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
          <DownloadExcelButton
            data={getCurrentData()}
            columns={getColumns().map(c => ({ key: c.key, header: c.label }))}
            filename={`${activeTab}_${userId}_${new Date().toISOString().split('T')[0]}.xlsx`}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto border-b border-white/10">
          <div className="flex min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                    ? 'text-purple-400 border-purple-400 bg-purple-500/10'
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <span className="ml-2 text-gray-400">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              {error}
            </div>
          ) : (
            renderTable()
          )}
        </div>
      </motion.div>
    </div>
  );
};
