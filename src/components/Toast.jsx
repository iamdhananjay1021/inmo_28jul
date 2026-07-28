import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: 'from-green-600 to-green-700 border-green-500/50',
  error: 'from-red-600 to-red-700 border-red-500/50',
  warning: 'from-yellow-600 to-yellow-700 border-yellow-500/50',
  info: 'from-blue-600 to-blue-700 border-blue-500/50',
};

const Toast = ({ id, message, variant = 'success', onClose }) => {
  const Icon = ICONS[variant] || ICONS.info;

  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 3500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-gradient-to-r ${COLORS[variant]} shadow-2xl backdrop-blur-sm min-w-[280px] max-w-[380px]`}
    >
      <Icon className="w-5 h-5 text-white shrink-0" />
      <p className="text-sm text-white font-medium flex-1 break-words">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5 text-white/80" />
      </button>
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, variant = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback: return a no-op function if used outside provider
    return (message, variant) => console.warn('[Toast]', variant, message);
  }
  return context;
};
