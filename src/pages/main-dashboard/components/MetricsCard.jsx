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
    <div className={`${gradient} rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 h-full relative overflow-hidden group`}>
      {/* Decorative background circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/10 shadow-sm">
            <Icon name={icon} size={22} className="text-white" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm border border-white/10 ${trend?.type === 'up' ? 'text-white' : trend?.type === 'down' ? 'text-white' : 'text-white/80'
              }`}>
              <Icon
                name={trend?.type === 'up' ? 'TrendingUp' : trend?.type === 'down' ? 'TrendingDown' : 'Minus'}
                size={10}
                className="text-white"
              />
              <span className="text-white">{trend?.value}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-2xl font-mono font-black text-white tracking-tighter transition-all">
            {value}
          </p>
          <div className="space-y-0.5">
            <p className="text-[11px] font-black text-white uppercase tracking-widest opacity-90">
              {title}
            </p>
            {description && (
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-tight leading-none">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;