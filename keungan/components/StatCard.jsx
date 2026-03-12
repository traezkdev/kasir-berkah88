import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue} transition-colors duration-300`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${trend === 'up'
              ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trendValue}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">{title}</p>
        <h3 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">{formatCurrency(value)}</h3>
      </div>
    </div>
  );
};

export default StatCard;
