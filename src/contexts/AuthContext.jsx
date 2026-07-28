import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const INACTIVITY_TIMEOUT_SECONDS = INACTIVITY_TIMEOUT_MS / 1000;
const LAST_ACTIVE_KEY = 'lastActiveTime';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize from localStorage
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [sessionTime, setSessionTime] = useState(INACTIVITY_TIMEOUT_SECONDS);
  const navigate = useNavigate();

  // Check session validity on mount using last active timestamp
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('user');
    const savedLastActive = localStorage.getItem(LAST_ACTIVE_KEY);

    if (savedAuth === 'true' && savedUser && savedLastActive) {
      const elapsed = Date.now() - parseInt(savedLastActive, 10);
      const remaining = INACTIVITY_TIMEOUT_MS - elapsed;

      if (remaining > 0) {
        setIsAuthenticated(true);
        setUser(JSON.parse(savedUser));
        setSessionTime(Math.ceil(remaining / 1000));
      } else {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem(LAST_ACTIVE_KEY);
        setIsAuthenticated(false);
        setUser(null);
        setSessionTime(INACTIVITY_TIMEOUT_SECONDS);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  // Logout function with useCallback to prevent recreation
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setSessionTime(INACTIVITY_TIMEOUT_SECONDS);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem(LAST_ACTIVE_KEY);
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const updateLastActive = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      setSessionTime(INACTIVITY_TIMEOUT_SECONDS);
    };

    const checkInactivity = () => {
      const lastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY));
      if (!lastActive) return;

      const elapsed = Date.now() - lastActive;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        logout();
        return;
      }
      setSessionTime(Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
    };

    updateLastActive();

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const activityHandler = () => updateLastActive();
    const handleVisibilityChange = () => {
      if (!document.hidden) checkInactivity();
    };

    events.forEach((event) => window.addEventListener(event, activityHandler, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', checkInactivity);

    const interval = setInterval(checkInactivity, 60 * 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, activityHandler));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', checkInactivity);
      clearInterval(interval);
    };
  }, [isAuthenticated, logout]);

  const login = useCallback((userData) => {
    const now = Date.now();
    setIsAuthenticated(true);
    setUser(userData);
    setSessionTime(INACTIVITY_TIMEOUT_SECONDS);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
  }, []);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    setSessionTime(INACTIVITY_TIMEOUT_SECONDS);
    localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout, 
      sessionTime, 
      resetTimer 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
