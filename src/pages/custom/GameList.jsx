import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  RefreshCw,
  Gamepad2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { gameURL } from '../../config/apiConfig';
import { showSuccess, showError, showConfirm } from '../../utils/swalUtils';

// Toggle Switch Component
const ToggleSwitch = ({ isActive, onChange, disabled }) => {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-green-500' : 'bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
      />
    </button>
  );
};

export const GameList = () => {
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 40, 100, 200, 300, 500];

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  const fetchGames = async () => {
    try {
      setLoading(true);

      const response = await userAPI.getGamesList();

      if (response.Status) {
        const mappedGames = (response.data || []).map((game) => ({
          id: game.Id,
          gameName: game.GameName,
          status: game.Status,
        }));

        setGames(mappedGames);
      } else {
        setGames([]);
      }
    } catch (err) {
      console.error("Fetch games error:", err);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // Pagination Calculations
  const totalPages = Math.ceil(games.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGames = games.slice(startIndex, startIndex + itemsPerPage);

  // Handle Toggle Status - Updated with correct API
  const handleToggleStatus = async (game) => {
    const currentStatus = game.status;
    const newStatus = !currentStatus;
    const action = newStatus ? 'activated' : 'deactivated';

    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to ${action} game: ${game.gameName}?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    const payload = {
      GameName: game.gameName,
      Status: newStatus
    };

    setActionLoading(prev => ({ ...prev, [game.id]: true }));

    try {
      const response = await userAPI.updateGameStatus(payload);

      if (response.status || response.Status) {
        showSuccess(`Game ${action} successfully`);
        await fetchGames();
        // setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to update game status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      showError('Failed to update game status. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [game.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading games...</p>
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
          <div className="p-3 bg-indigo-500/20 rounded-lg">
            <Gamepad2 className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Game List</h1>
            <p className="text-gray-400">Total {games.length.toLocaleString()} games</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`${gameURL}`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Go to Game Admin
          </button>
          <button
            onClick={fetchGames}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
      >
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{games.length.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Total Games</p>
        </div>
        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {games.filter(game => game.status).length}
          </p>
          <p className="text-sm text-gray-400 mt-1">Active</p>
        </div>

        <div className="glass rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-400">
            {games.filter(game => !game.status).length}
          </p>
          <p className="text-sm text-gray-400 mt-1">Inactive</p>
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
                  Game ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Game Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">
                  Toggle
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedGames.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedGames.map((game, index) => {
                  const isActive = game.status;

                  return (
                    <motion.tr
                      key={game.id}
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
                        <span className="text-sm font-mono text-purple-400">
                          {game.id}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-white">
                          {game.gameName || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'
                            }`}></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <ToggleSwitch
                            isActive={isActive}
                            onChange={() => handleToggleStatus(game)}
                            disabled={actionLoading[game.id]}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        {games.length > 0 && (
          <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, games.length)} of {games.length} entries
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                Rows per page:
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
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
      </motion.div>
    </div>
  );
};