import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Settings, LogOut, User, Bell, Palette } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SessionTimer } from './SessionTimer';
import { CustomizationPanel } from './CustomizationPanel';

export const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showCustomization, setShowCustomization] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!showProfile) return;

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 right-0 left-0 lg:left-80 h-14 sm:h-16 backdrop-blur-xl border-b z-30 px-3 sm:px-6"
        style={{
          backgroundColor: 'var(--navbar-bg)',
          borderColor: 'var(--navbar-border)',
        }}
      >
        <div className="h-full flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 flex justify-center">
            <SessionTimer />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCustomization(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all hover:glow-purple group"
              title="Customize Panel"
            >
              <Palette className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
            </button>

            {/* <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button> */}

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium hidden md:block" style={{
                  color: 'var(--navbar-text)',
                }}>{user?.userName || 'Admin'}</span>
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 glass-strong rounded-lg overflow-hidden border"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      <CustomizationPanel isOpen={showCustomization} onClose={() => setShowCustomization(false)} />
    </>
  );
};
