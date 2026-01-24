import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReportCard = ({
  title,
  description,
  icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10 dark:bg-primary/20',
  metrics = [],
  exportOptions = [], // New prop for multiple export options
  children
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100/50 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden group">
      <div className="p-7 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl shadow-inner border flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${iconBgColor}`}>
              <Icon name={icon} size={26} strokeWidth={2.5} className={iconColor} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">{title}</h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">{description}</p>
            </div>
          </div>

          {exportOptions.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all active:scale-95"
              >
                <Icon name="Download" size={14} strokeWidth={3} />
                <span>Export Report</span>
                <Icon name="ChevronDown" size={12} strokeWidth={3} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-slate-700 z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {exportOptions.map((option, index) => (
                    <button
                      key={index}
                      className="flex items-center w-full text-left px-5 py-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-primary/5 hover:text-primary transition-colors gap-3"
                      onClick={() => {
                        option.onClick();
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {metrics?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {metrics?.map((metric, index) => (
              <div key={index} className="bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-gray-100/50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{metric?.label}</span>
                  {metric?.trend && (
                    <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg text-[9px] font-black ${metric?.trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
                      metric?.trend === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                      <Icon
                        name={metric?.trend === 'up' ? 'TrendingUp' :
                          metric?.trend === 'down' ? 'TrendingDown' : 'Minus'}
                        size={10}
                        strokeWidth={3}
                      />
                      <span>{metric?.change}</span>
                    </div>
                  )}
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                  {metric?.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ReportCard;