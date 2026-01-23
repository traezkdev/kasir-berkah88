import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ title, value, icon, color = 'primary', trend = null, description = null }) => {
  const desktopGradients = {
    primary: 'lg:bg-[#1187DE]',
    success: 'lg:bg-gradient-to-br lg:from-emerald-500 lg:to-teal-600',
    warning: 'lg:bg-gradient-to-br lg:from-orange-500 lg:to-amber-600',
    accent: 'lg:bg-gradient-to-br lg:from-pink-500 lg:to-rose-600',
    info: 'lg:bg-[#1187DE]',
    destructive: 'lg:bg-gradient-to-br lg:from-red-500 lg:to-rose-700',
    white: 'lg:bg-[#1187DE]',
  };

  const mobileIconColors = {
    primary: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30',
    success: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30',
    warning: 'text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/30',
    accent: 'text-pink-600 bg-pink-50 border-pink-100 dark:bg-pink-900/20 dark:border-pink-800/30',
    info: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30',
    destructive: 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800/30',
    white: 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700',
  };

  const activeGradient = desktopGradients[color] || desktopGradients.primary;
  const activeMobileIcon = mobileIconColors[color] || mobileIconColors.primary;

  return (
    <div className={`bg-white dark:bg-slate-800 ${activeGradient} lg:border-none rounded-[2rem] p-6 lg:p-7 transition-all duration-300 h-full relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1`}>
      <div className="relative z-10 flex flex-col h-full">
        {/* Top Section: Icon & Trend */}
        <div className="flex items-center justify-between mb-5">
          <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 shadow-sm border lg:border-white/10 lg:bg-white/20 lg:text-white ${activeMobileIcon}`}>
            <Icon name={icon} size={24} strokeWidth={2.5} />
          </div>
          {trend && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-50 dark:bg-slate-700/30 lg:bg-white/20 border border-gray-100 dark:border-slate-700 lg:border-white/10 text-gray-500 dark:text-gray-400 lg:text-white shadow-sm">
              <Icon
                name={trend?.type === 'up' ? 'TrendingUp' : trend?.type === 'down' ? 'TrendingDown' : 'Minus'}
                size={12}
                strokeWidth={3}
              />
              <span>{trend?.value}</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-end">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-gray-400 dark:text-gray-500 lg:text-white/70 leading-none">
            {title}
          </p>
          <p className="text-2xl lg:text-3xl font-black tracking-tight leading-none mb-3 text-slate-800 dark:text-white lg:text-white transition-all group-hover:scale-105 origin-left">
            {value}
          </p>
          {description && (
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 lg:text-white/40 line-clamp-1 opacity-80 leading-snug">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Decorative background circles - Desktop Only */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500 hidden lg:block"></div>

      {/* Subtle Glow Effect - Mobile Only */}
      <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-gray-50 dark:bg-slate-700/10 rounded-full blur-3xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/5 transition-all duration-500 lg:hidden"></div>
    </div>
  );
};

export default MetricsCard;