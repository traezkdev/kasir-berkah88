import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const DateRangeSelector = ({ onDateRangeChange, selectedRange = 'today' }) => {
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeRange, setActiveRange] = useState(selectedRange);

  const presetRanges = [
    { key: 'today', label: 'Hari Ini' },
    { key: 'yesterday', label: 'Kemarin' },
    { key: 'week', label: '7 Hari' },
    { key: 'month', label: '30 Hari' },
    { key: 'custom', label: 'Custom' }
  ];

  const handlePresetSelect = (range) => {
    setActiveRange(range);

    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(yesterday);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        return;
    }

    onDateRangeChange({ startDate, endDate, range });
  };

  const handleCustomDateChange = (startDateStr, endDateStr) => {
    if (startDateStr && endDateStr) {
      const startParts = startDateStr.split('-').map(p => parseInt(p, 10));
      const endParts = endDateStr.split('-').map(p => parseInt(p, 10));

      const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      endDate.setHours(23, 59, 59, 999);

      onDateRangeChange({
        startDate,
        endDate,
        range: 'custom'
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 lg:p-7 mb-8 overflow-hidden group transition-all duration-300 lg:-mt-0 -mt-16 relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-sm text-primary">
          <Icon name="Calendar" size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Filter Waktu</h3>
          <p className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Periode Laporan</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-gray-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-gray-100 dark:border-slate-700/50 shadow-inner w-full sm:w-auto scroll-smooth">
          {presetRanges?.map((range) => (
            <button
              key={range?.key}
              onClick={() => handlePresetSelect(range?.key)}
              className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap shrink-0 ${activeRange === range?.key
                ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-slate-800'
                }`}
            >
              {range?.label}
            </button>
          ))}
        </div>

        {activeRange !== 'custom' && (
          <div className="ml-auto px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 rounded-2xl hidden md:flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live Report Aktif</span>
          </div>
        )}
      </div>

      {activeRange === 'custom' && (
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-gray-50 dark:bg-slate-900/30 rounded-2xl border border-gray-100 dark:border-slate-700/50">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dari Tanggal</label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setCustomStartDate(newStartDate);
                  if (newStartDate && customEndDate) {
                    handleCustomDateChange(newStartDate, customEndDate);
                  }
                }}
                className="rounded-xl border-none shadow-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sampai Tanggal</label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  const newEndDate = e.target.value;
                  setCustomEndDate(newEndDate);
                  if (customStartDate && newEndDate) {
                    handleCustomDateChange(customStartDate, newEndDate);
                  }
                }}
                className="rounded-xl border-none shadow-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;