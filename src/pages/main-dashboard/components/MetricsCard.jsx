import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ title, value, icon, color = 'primary', trend = null, description = null }) => {
  const gradientClasses = {
    primary: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    success: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    warning: 'bg-gradient-to-br from-orange-500 to-amber-600',
    accent: 'bg-gradient-to-br from-pink-500 to-rose-600',
    info: 'bg-gradient-to-br from-blue-500 to-sky-600',
    destructive: 'bg-gradient-to-br from-red-500 to-rose-700',
  };

  const gradient = gradientClasses[color] || gradientClasses.primary;

  return (
    <div className={`${gradient} rounded-xl p-4 lg:p-5 shadow-lg hover:shadow-xl transition-all duration-300 h-full relative overflow-hidden group`}>
      {/* Decorative background circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Top Section: Icon & Trend */}
        <div className="flex items-center justify-between mb-1 lg:mb-2">
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/10 shadow-sm transition-transform group-hover:scale-110">
            <Icon name={icon} size={20} className="text-white" />
          </div>
          {trend && (
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm border border-white/10">
              <Icon
                name={trend?.type === 'up' ? 'TrendingUp' : trend?.type === 'down' ? 'TrendingDown' : 'Minus'}
                size={10}
                className="text-white"
              />
              <span className="text-white">{trend?.value}</span>
            </div>
          )}
        </div>

        {/* Content Section: Label -> Value -> Description (Centered in the remaining space) */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-1">
            {title}
          </p>
          <p className="text-2xl lg:text-2xl font-mono font-black text-white tracking-tighter leading-none mb-1 lg:mb-2 transition-all group-hover:scale-105 origin-left">
            {value}
          </p>
          {description && (
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight leading-tight line-clamp-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;