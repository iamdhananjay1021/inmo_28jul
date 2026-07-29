import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Search,
  DollarSign,
  Gift,
  HelpCircle
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { showSuccess, showError, showConfirm } from '../../utils/swalUtils';

export const CoinPricing = () => {
  const [loading, setLoading] = useState(true);
  const [pricings, setPricings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [coinValue, setCoinValue] = useState('');
  const [bonus, setBonus] = useState('');
  const [amount, setAmount] = useState('');

  // Fetch coin pricings
  const fetchPricings = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getCoinPricing();

      // Ensure we extract the array of data properly
      let dataList = [];
      if (Array.isArray(response)) {
        dataList = response;
      } else if (response && Array.isArray(response.data)) {
        dataList = response.data;
      } else if (response && Array.isArray(response.Data)) {
        dataList = response.Data;
      } else if (response && Array.isArray(response.result)) {
        dataList = response.result;
      }

      // Sort by Amount ascending
      dataList.sort((a, b) => (Number(a.Amount) || 0) - (Number(b.Amount) || 0));
      setPricings(dataList);
    } catch (err) {
      console.error('Fetch coin pricing error:', err);
      showError('Failed to load coin pricing data.');
      setPricings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricings();
  }, []);

  // Filtered pricing configurations
  const filteredPricings = useMemo(() => {
    return pricings.filter((item) => {
      const valueStr = String(item.CoinValue || '').toLowerCase();
      const bonusStr = String(item.Bonus || '').toLowerCase();
      const amountStr = String(item.Amount || '').toLowerCase();
      const idStr = String(item.Id || item.id || '').toLowerCase();
      const query = searchTerm.toLowerCase();

      return (
        valueStr.includes(query) ||
        bonusStr.includes(query) ||
        amountStr.includes(query) ||
        idStr.includes(query)
      );
    });
  }, [pricings, searchTerm]);

  // Insert a new pricing configuration
  const handleInsert = async (e) => {
    e.preventDefault();

    if (!coinValue || isNaN(coinValue) || Number(coinValue) <= 0) {
      showError('Please enter a valid Coin Value.');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) < 0) {
      showError('Please enter a valid Amount.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        CoinValue: Number(coinValue),
        Bonus: Number(bonus || 0),
        Amount: Number(amount)
      };

      const res = await userAPI.insertCoinPricing(payload);

      // Some APIs return structured response, handle both standard patterns
      const isSuccess = res && (res.success || res.Success || res.Status || res.status || !res.error);

      if (isSuccess || res) {
        showSuccess('Coin Pricing configuration added successfully!');
        // Reset form
        setCoinValue('');
        setBonus('');
        setAmount('');
        // Refresh pricing records
        fetchPricings();
      } else {
        showError(res?.message || 'Failed to add Coin Pricing.');
      }
    } catch (err) {
      console.error('Insert coin pricing error:', err);
      showError('Failed to add Coin Pricing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a pricing configuration
  const handleDelete = async (id) => {
    const confirmRes = await showConfirm({
      title: 'Delete Pricing Configuration?',
      text: 'Are you sure you want to delete this coin pricing config? This action cannot be undone.',
      confirmButtonText: 'Yes, Delete It',
      cancelButtonText: 'Cancel',
      icon: 'warning'
    });

    if (!confirmRes.isConfirmed) return;

    try {
      const res = await userAPI.deleteCoinPricing({ Id: Number(id) });
      const isSuccess = res && (res.success || res.Success || res.Status || res.status || !res.error);

      if (isSuccess || res) {
        showSuccess('Coin Pricing configuration deleted successfully!');
        fetchPricings();
      } else {
        showError(res?.message || 'Failed to delete Coin Pricing.');
      }
    } catch (err) {
      console.error('Delete coin pricing error:', err);
      showError('Failed to delete Coin Pricing. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <Coins className="w-8 h-8 text-purple-400" />
            Coin Pricing Configuration
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage coin packages, bonuses, and pricing configs for UAT environment.
          </p>
        </div>

        <button
          onClick={fetchPricings}
          className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-4 py-2 rounded-xl border border-purple-500/30 transition-all font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              Add New Configuration
            </h2>

            <form onSubmit={handleInsert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Coin Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    value={coinValue}
                    onChange={(e) => setCoinValue(e.target.value)}
                    placeholder="e.g. 500"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Bonus Coins (Optional)
                </label>
                <div className="relative">
                  <Gift className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Amount / Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 49.00"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding Config...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Configuration
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Pricing Cards & Table View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coin packages by value, bonus, amount..."
              className="w-full pl-12 pr-4 py-3 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-gray-400 mt-4 font-medium">Fetching Pricing tiers...</p>
            </div>
          ) : filteredPricings.length === 0 ? (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
              <Coins className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">No configurations found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm ? 'Try a different search query' : 'Get started by creating the first package configuration!'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Premium Visual Cards View */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  Visual Packages
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredPricings.slice(0, 4).map((item) => {
                    const id = item.Id || item.id;
                    const totalCoins = (Number(item.CoinValue) || 0) + (Number(item.Bonus) || 0);

                    return (
                      <motion.div
                        key={id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group bg-gradient-to-br from-purple-900/40 via-slate-900/80 to-slate-950 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl p-5 shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                      >
                        {/* Decorative background glow */}
                        <div className="absolute -right-12 -top-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500" />

                        <div>
                          <div className="flex justify-between items-start">
                            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-300">
                              <Coins className="w-6 h-6" />
                            </div>
                            <button
                              onClick={() => handleDelete(id)}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete Configuration"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mt-4">
                            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
                              {item.CoinValue?.toLocaleString() || 0}
                              <span className="text-xs font-medium text-gray-400">Coins</span>
                            </div>

                            {item.Bonus > 0 && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-500/10 text-pink-400 rounded-full text-xs font-semibold border border-pink-500/20">
                                <Gift className="w-3.5 h-3.5" />
                                +{item.Bonus?.toLocaleString()} Bonus Coins
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center">
                          <span className="text-xs text-gray-400 font-medium">UAT Pricing</span>
                          <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                            ₹{Number(item.Amount || 0).toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Complete List Table */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Full Pricing Tiers
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">
                    Total Packages: {filteredPricings.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs font-semibold text-gray-400 bg-slate-950/40">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Coin Value</th>
                        <th className="px-6 py-4">Bonus</th>
                        <th className="px-6 py-4">Total Coins</th>
                        <th className="px-6 py-4">Price / Amount</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm text-gray-300">
                      {filteredPricings.map((item) => {
                        const id = item.Id || item.id;
                        const totalCoins = (Number(item.CoinValue) || 0) + (Number(item.Bonus) || 0);

                        return (
                          <tr key={id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-purple-400 font-semibold">
                              #{id}
                            </td>
                            <td className="px-6 py-4 font-semibold text-white">
                              {Number(item.CoinValue || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              {item.Bonus > 0 ? (
                                <span className="text-pink-400 font-semibold">
                                  +{Number(item.Bonus).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-100">
                              {totalCoins.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-yellow-400">
                                ₹{Number(item.Amount || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDelete(id)}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
