import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Wallet, Ban, FileText, UserCog,
  TrendingDown, DollarSign, Palette, Radio, Flag, MessageSquare, LockKeyhole,
  Gift, RefreshCw, ChevronDown, ChevronRight, Menu, X, Image, Gamepad2, SquareStack
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  {
    label: 'User Management',
    icon: Users,
    submenu: [
      { path: '/users/app-users', label: 'App User Details' },
      { path: '/users/moments', label: 'Moment Upload List' },
      { path: '/users/admin-agency-host', label: 'Admin / Agency / Host' },
      { path: '/users/deleted', label: 'Deleted Accounts' },
    ],
  },
  { path: '/static-otp', icon: LockKeyhole, label: 'Static OTP' },
  {
    label: 'Purchase & Wallet',
    icon: Wallet,
    submenu: [
      // { path: '/wallet/playstore', label: 'Play Store Purchase Record' },
      { path: '/wallet/freeze', label: 'Wallet Freeze / Unfreeze' },
      { path: '/wallet/coins', label: 'Add / Deduct Coins' },
      { path: '/wallet/beans', label: 'Add / Deduct Beans' },
      // { path: '/wallet/mall', label: 'Mall Purchase Record' },
      { path: '/wallet/transactions', label: 'Transaction Record' },
    ],
  },
  {
    label: 'Account Status',
    icon: Ban,
    submenu: [
      { path: '/account/id-ban', label: 'ID Ban / Unban' },
      { path: '/account/device-block', label: 'Device ID Block / Unblock' },
      { path: '/account/user-ban', label: 'Room Ban / Unban' },
    ],
  },
  // {
  //   label: 'Requests',
  //   icon: FileText,
  //   submenu: [
  //     { path: '/requests/admin', label: 'Admin Request' },
  //     { path: '/requests/agency', label: 'Agency Request' },
  //     { path: '/requests/host', label: 'Host Request' },
  //   ],
  // },
  { path: '/requests', icon: FileText, label: 'Requests' },
  {
    label: 'Agent',
    icon: UserCog,
    submenu: [
      // { path: '/agent/request', label: 'Agent Request' },
      { path: '/agent/online', label: 'Online Agent' },
      { path: '/agent/calls', label: 'Agent Calls' },
    ],
  },
  { path: '/banner', icon: SquareStack, label: 'Banner Upload Details' },
  { path: '/gift', icon: Gift, label: 'Gift Upload Details' },
  // { path: '/home-image', icon: Image, label: 'Home Image Upload Details' },
  { path: '/games', icon: Gamepad2, label: 'Game List' },
  { path: '/withdraw/wallet', icon: Image, label: 'Wallet Withdraw Record' },
  // {
  //   label: 'Withdraw Record',
  //   icon: TrendingDown,
  //   submenu: [
  //     { path: '/withdraw/bank', label: 'Bank' },
  //     { path: '/withdraw/wallet', label: 'Wallet' },
  //   ],
  // },
  {
    label: 'Reseller Details',
    icon: DollarSign,
    submenu: [
      { path: '/reseller/create', label: 'Create Reseller' },
      // { path: '/reseller/coin-reselling', label: 'Coin Reselling' },
      // { path: '/reseller/deduct', label: 'Deduct Reseller Coins' },
      { path: '/reseller/summary', label: 'Get All Reseller Summary' },
      { path: '/reseller/transactions', label: 'Reseller Transactions' },
      { path: '/reseller/admintoresellerTransactions', label: 'Admin To Reseller Transactions' },
    ],
  },
  {
    path: '/customizations',
    label: 'Customizations',
    icon: Palette,
  },
  {
    label: 'Streaming Details',
    icon: Radio,
    submenu: [
      { path: '/streaming/audio', label: 'Audio Streaming Details' },
      { path: '/streaming/end-user', label: 'End User Stream' },
    ],
  },
  {
    path: '/reports',
    icon: Flag,
    label: 'Reports',
  },
  { path: '/whatsapp-logs', icon: MessageSquare, label: 'WhatsApp OTP Logs' },
  { path: '/rewards', icon: Gift, label: 'Rewards' },
  { path: '/version-update', icon: RefreshCw, label: 'Version Update' },
];

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const { user } = useAuth();

  const isRestrictedAdmin = user && JSON.stringify(user).includes('8576075126');

  const filteredMenuItems = useMemo(() => {
    if (!isRestrictedAdmin) return menuItems;

    const allowedPaths = [
      '/requests',
      '/account/id-ban',
      '/streaming/end-user',
      '/users/admin-agency-host'
    ];

    return menuItems.map(item => {
      if (item.submenu) {
        const filteredSub = item.submenu.filter(sub => allowedPaths.includes(sub.path));
        if (filteredSub.length > 0) {
          return { ...item, submenu: filteredSub };
        }
        return null;
      }
      return allowedPaths.includes(item.path) ? item : null;
    }).filter(Boolean);
  }, [isRestrictedAdmin]);

  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-screen w-[280px] sm:w-80 border-r z-50 overflow-hidden flex flex-col backdrop-blur-xl"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
        }}
      >
        <div className="p-6 border-b flex items-center justify-between" style={{
          borderColor: 'var(--sidebar-border)',
        }}>
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="SFA Live" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-gradient">SFA Live</h1>
              <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>Admin Panel</p>
            </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-1">
          {filteredMenuItems.map((item, index) => (
            <div key={index}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all group"
                    style={{
                      color: 'var(--sidebar-text)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                        {item.label}
                      </span>
                    </div>
                    {expandedMenus[item.label] ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedMenus[item.label] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 mt-1 space-y-1 overflow-hidden"
                      >
                        {item.submenu.map((subItem, subIndex) => (
                          <NavLink
                            key={subIndex}
                            to={subItem.path}
                            className={({ isActive }) =>
                              `block px-4 py-2 rounded-lg text-sm transition-all ${isActive
                                ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border-l-2 border-purple-500'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                              }`
                            }
                          >
                            {subItem.label}
                          </NavLink>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${isActive
                      ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white glow-purple'
                      : 'hover:bg-white/5 text-gray-300'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">System Status</span>
            </div>
            <p className="text-sm font-medium text-green-400">All Systems Operational</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
