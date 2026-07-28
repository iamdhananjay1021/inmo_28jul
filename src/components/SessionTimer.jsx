import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export const SessionTimer = () => {
  const { sessionTime } = useAuth();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = sessionTime < 300;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg glass ${
        isWarning ? 'border-red-500/50 animate-pulse' : 'border-white/10'
      }`}
    >
      <Clock className={`w-4 h-4 ${isWarning ? 'text-red-400' : 'text-purple-400'}`} />
      <span className={`text-sm font-medium ${isWarning ? 'text-red-400' : 'text-gray-300'}`}>
        Session expires in: {formatTime(sessionTime)}
      </span>
    </motion.div>
  );
};
