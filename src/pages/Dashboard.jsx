import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Radio, DollarSign, TrendingDown, Activity,
  UserPlus, Shield, Building2, Mic, Wallet, RefreshCw, Star, Gift
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardAPI } from '../services/api';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch GetDashboardDetails
      try {
        const detailsResponse = await dashboardAPI.getDashboardDetails();
        if (detailsResponse && (detailsResponse.Status || detailsResponse.status)) {
          setDashboardData(detailsResponse.Data || detailsResponse.data || detailsResponse);
        }
      } catch (detailsErr) {
        console.error('getDashboardDetails error:', detailsErr);
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Total Stats Cards Data
  const totalStatsData = dashboardData ? [
    {
      title: 'Registered Users',
      value: (dashboardData.RegisteredUsers !== undefined ? dashboardData.RegisteredUsers : (dashboardData.totalDownloads || 0)).toLocaleString(),
      icon: Users,
      color: 'cyan',
      route: '/users/app-users'
    },
    {
      title: 'Today Registered Users',
      value: (dashboardData.TodayRegisteredUser !== undefined ? dashboardData.TodayRegisteredUser : 0).toLocaleString(),
      icon: UserPlus,
      color: 'green',
      route: '/users/app-users'
    },
    {
      title: 'Approved Admins',
      value: (dashboardData.ApprovedAdmins !== undefined ? dashboardData.ApprovedAdmins : (dashboardData.totalAdmin || 0)).toLocaleString(),
      badge: dashboardData.PendingAdmins,
      icon: Shield,
      color: 'purple',
      route: '/users/admin-agency-host'
    },
    {
      title: 'Approved Agencies',
      value: (dashboardData.ApprovedAgencies !== undefined ? dashboardData.ApprovedAgencies : (dashboardData.totalAgency || 0)).toLocaleString(),
      badge: dashboardData.PendingAgencies,
      icon: Building2,
      color: 'pink',
      route: '/users/admin-agency-host'
    },
    {
      title: 'Approved Hosts',
      value: (dashboardData.ApprovedHosts !== undefined ? dashboardData.ApprovedHosts : (dashboardData.totalHost || 0)).toLocaleString(),
      badge: dashboardData.PendingHosts,
      icon: Mic,
      color: 'orange',
      route: '/users/admin-agency-host'
    },
    {
      title: 'Today Claimed Rewards',
      value: (dashboardData.TodayClaimedRewards !== undefined ? dashboardData.TodayClaimedRewards : 0).toLocaleString(),
      badge: dashboardData.TodayUnclaimedRewards,
      badgeText: 'Unclaimed',
      icon: Gift,
      color: 'purple',
      route: '/rewards'
    },
    {
      title: 'Banned Users',
      value: (dashboardData.BannedUsers !== undefined ? dashboardData.BannedUsers : 0).toLocaleString(),
      icon: Users,
      color: 'red',
      route: '/account/id-ban'
    },
    {
      title: 'Banned Devices',
      value: (dashboardData.BannedDevices !== undefined ? dashboardData.BannedDevices : 0).toLocaleString(),
      icon: Activity,
      color: 'red',
      route: '/account/device-block'
    },
  ] : [];

  // Today's Stats Cards Data
  const todayStatsData = todayData ? [
    {
      title: 'Today Admin Requests',
      value: todayData.todayAdminRequests?.toLocaleString() || '0',
      icon: Shield,
      color: 'blue',
      trend: todayData.todayAdminRequests > 0 ? '+' + todayData.todayAdminRequests : 0
    },
    {
      title: 'Today Host Requests',
      value: todayData.todayHostRequests?.toLocaleString() || '0',
      icon: Mic,
      color: 'orange',
      trend: todayData.todayHostRequests > 0 ? '+' + todayData.todayHostRequests : 0
    },
    {
      title: 'Today Agency Requests',
      value: todayData.todayAgencyRequests?.toLocaleString() || '0',
      icon: Building2,
      color: 'pink',
      trend: todayData.todayAgencyRequests > 0 ? '+' + todayData.todayAgencyRequests : 0
    },
    {
      title: 'Today Registered Users',
      value: todayData.todayRegisteredUsers?.toLocaleString() || '0',
      icon: UserPlus,
      color: 'green',
      trend: todayData.todayRegisteredUsers > 0 ? '+' + todayData.todayRegisteredUsers : 0
    },
    {
      title: 'Today Withdrawals',
      value: todayData.todayWalletWithdrawals?.toLocaleString() || '0',
      icon: TrendingDown,
      color: 'purple',
      trend: todayData.todayWalletWithdrawals > 0 ? '+' + todayData.todayWalletWithdrawals : 0
    },
    {
      title: 'Today Reseller Transactions',
      value: todayData.todayResellerTransactions?.toLocaleString() || '0',
      icon: DollarSign,
      color: 'cyan',
      trend: todayData.todayResellerTransactions > 0 ? '+' + todayData.todayResellerTransactions : 0
    },
  ] : [];

  // Chart data for today's activity
  const todayChartData = todayData ? [
    { name: 'Admin Requests', value: todayData.todayAdminRequests || 0 },
    { name: 'Host Requests', value: todayData.todayHostRequests || 0 },
    { name: 'Agency Requests', value: todayData.todayAgencyRequests || 0 },
    { name: 'New Users', value: todayData.todayRegisteredUsers || 0 },
    { name: 'Withdrawals', value: todayData.todayWalletWithdrawals || 0 },
    { name: 'Transactions', value: todayData.todayResellerTransactions || 0 },
  ] : [];

  // Chart data for total overview
  const totalChartData = dashboardData ? [
    { name: 'Downloads', value: dashboardData.totalDownloads || 0 },
    { name: 'Active Users', value: dashboardData.activeUsers || 0 },
    { name: 'Admins', value: dashboardData.totalAdmin || 0 },
    { name: 'Agencies', value: dashboardData.totalAgency || 0 },
    { name: 'Hosts', value: dashboardData.totalHost || 0 },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome back! Here's your overview.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>

      {/* Total Stats Section */}
      <div>
        <h2 className="text-xl font-semibold text-purple-400 mb-4">Total Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {totalStatsData.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                onClick={() => stat.route && navigate(stat.route)}
                className={stat.route ? 'cursor-pointer' : ''}
              >
                <StatCard {...stat} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
};
