import { motion } from 'framer-motion';

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        className="relative w-20 h-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-purple-600/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 border-r-pink-600"></div>
      </motion.div>
    </div>
  );
};
