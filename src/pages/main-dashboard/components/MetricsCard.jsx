import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ title, value, icon, color = 'primary', trend = null, description = null }) => {
  const isWhite = color === 'white';

  const gradientClasses = {
    primary: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    success: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    warning: 'bg-gradient-to-br from-orange-500 to-amber-600',
    accent: 'bg-gradient-to-br from-pink-500 to-rose-600',
    info: 'bg-gradient-to-br from-blue-500 to-sky-600',
    destructive: 'bg-gradient-to-br from-red-500 to-rose-700',
    white: 'bg-white border border-gray-100 shadow-xl lg:bg-gradient-to-br lg:from-blue-500 lg:to-sky-600 lg:border-none lg:shadow-lg',
  };

  const gradient = gradientClasses[color] || gradientClasses.primary;

  return (
    <div className={`${gradient} rounded-2xl p-5 lg:p-6 lg:pt-6 transition-all duration-300 h-full relative overflow-hidden group`}>
      {/* Decorative background circle */}
      {(!isWhite) ? (
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
      ) : (
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500 hidden lg:block"></div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Top Section: Icon & Trend */}
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 rounded-2xl backdrop-blur-md border shadow-sm transition-transform group-hover:scale-110 ${isWhite ? 'bg-blue-50 lg:bg-white/20 border-blue-100 lg:border-white/10 text-blue-600 lg:text-white' : 'bg-white/20 border-white/10 text-white'}`}>
            <Icon name={icon} size={22} />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${isWhite ? 'bg-gray-50 lg:bg-white/20 border-gray-100 lg:border-white/10 text-gray-500 lg:text-white' : 'bg-white/20 border-white/10 text-white'}`}>
              <Icon
                name={trend?.type === 'up' ? 'TrendingUp' : trend?.type === 'down' ? 'TrendingDown' : 'Minus'}
                size={10}
              />
              <span>{trend?.value}</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-end">
          <p className={`text-[10px] font-bold uppercase tracking-[0.15em] mb-1 ${isWhite ? 'text-gray-400 lg:text-white/70' : 'text-white/70'}`}>
            {title}
          </p>
          <p className={`text-2xl lg:text-3xl font-black tracking-tight leading-none mb-2 transition-all group-hover:scale-105 origin-left ${isWhite ? 'text-gray-900 lg:text-white' : 'text-white'}`}>
            {value}
          </p>
          {description && (
            <p className={`text-[10px] font-bold uppercase tracking-tight leading-tight line-clamp-1 ${isWhite ? 'text-gray-400 lg:text-white/40' : 'text-white/40'}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;