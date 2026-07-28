import { motion } from 'framer-motion';

export const StatCard = ({ title, value, icon: Icon, trend, color = 'purple', badge, badgeText = 'Pending', onClick }) => {
  const colorClasses = {
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/30 text-purple-400',
    pink: 'from-pink-600/20 to-pink-600/5 border-pink-500/30 text-pink-400',
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/30 text-blue-400',
    green: 'from-green-600/20 to-green-600/5 border-green-500/30 text-green-400',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-500/30 text-orange-400',
    cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400',
    red: 'from-red-600/20 to-red-600/5 border-red-400/30 text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      onClick={onClick}
      className={`relative glass rounded-xl p-6 border bg-gradient-to-br ${colorClasses[color] || colorClasses.purple} transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      {badge !== undefined && badge !== null && (
        <div
          className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg border border-red-400 flex items-center gap-1.5 z-10 animate-pulse"
          title={`${badge} ${badgeText}`}
        >
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>{badge} {badgeText}</span>
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color] || colorClasses.purple}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-400">{title}</p>
    </motion.div>
  );
};
