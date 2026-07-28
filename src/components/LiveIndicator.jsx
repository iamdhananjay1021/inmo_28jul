import { motion } from 'framer-motion';

export const LiveIndicator = ({ isLive = true, label = 'LIVE' }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.div
          className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500' : 'bg-gray-500'}`}
          animate={isLive ? {
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {isLive && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500"
            animate={{
              scale: [1, 2, 2],
              opacity: [0.5, 0, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </div>
      <span className={`text-xs font-bold ${isLive ? 'text-red-400' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
};
