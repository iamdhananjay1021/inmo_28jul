import { useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, CheckCircle, Info, X } from 'lucide-react';

const ConfirmContext = createContext(null);

const VARIANT_CONFIG = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    confirmBg: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
    confirmBg: 'bg-green-600 hover:bg-green-700',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    confirmBg: 'bg-blue-600 hover:bg-blue-700',
  },
};

export const ConfirmModalProvider = ({ children }) => {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'danger',
    resolve: null,
  });

  const confirm = useCallback(({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger' }) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        confirmLabel,
        cancelLabel,
        variant,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    state.resolve?.(true);
    setState(prev => ({ ...prev, open: false }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState(prev => ({ ...prev, open: false }));
  };

  const config = VARIANT_CONFIG[state.variant] || VARIANT_CONFIG.danger;
  const Icon = config.icon;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleCancel}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#1a1625] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Top accent bar */}
              <div className={`h-1 w-full ${config.confirmBg.split(' ')[0]}`} />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${config.iconBg} shrink-0`}>
                    <Icon className={`w-6 h-6 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1">{state.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{state.message}</p>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-300 transition-colors"
                  >
                    {state.cancelLabel}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${config.confirmBg}`}
                  >
                    {state.confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Fallback: return a function that always resolves true if used outside provider
    return async () => true;
  }
  return context;
};
