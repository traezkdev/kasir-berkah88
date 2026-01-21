import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { exportToExcel, exportToPdf } from '../../../utils/exportUtils';
import { useTheme } from '../../../contexts/ThemeContext';

const MenuSearchAndFilter = ({
  searchTerm,
  onSearchChange,
  menuItems,
  onExportData,
  onShareStock,
  isExporting,
  activeFilter,
  onFilterChange
}) => {
  const { theme } = useTheme();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const filterOptions = [
    { key: 'all', label: 'Semua', count: menuItems?.length },
    { key: 'available', label: 'Tersedia', count: menuItems?.filter(item => item?.stock > 5)?.length },
    { key: 'low', label: 'Menipis', count: menuItems?.filter(item => item?.stock <= 5 && item?.stock > 0)?.length },
    { key: 'out', label: 'Habis', count: menuItems?.filter(item => item?.stock === 0)?.length },
    { key: 'makanan', label: 'Makanan', count: menuItems?.filter(item => item?.category === 'makanan')?.length },
    { key: 'minuman', label: 'Minuman', count: menuItems?.filter(item => item?.category === 'minuman')?.length },
    { key: 'lainnya', label: 'Lainnya', count: menuItems?.filter(item => item?.category === 'lainnya')?.length }
  ];

  const handleExport = (format) => {
    if (format === 'excel') {
      exportToExcel(menuItems, 'Menu_Items');
    } else if (format === 'pdf') {
      exportToPdf(menuItems, 'Menu_Items');
    }
    onExportData(format);
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Search & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon name="Search" size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Cari produk menu..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onShareStock}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
          >
            <Icon name="Share2" size={16} />
            <span className="lg:inline">Status Stok</span>
          </button>

          <div className="relative flex-1 lg:flex-none">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-50 dark:bg-slate-900/50 text-gray-600 dark:text-gray-300 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100 dark:border-slate-700 active:scale-95 transition-all"
            >
              <Icon name="Download" size={16} />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                    <Icon name="FileSpreadsheet" size={16} />
                  </div>
                  Excel Report
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                    <Icon name="FileText" size={16} />
                  </div>
                  PDF Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="relative group">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {filterOptions.map(option => (
            <button
              key={option.key}
              onClick={() => onFilterChange(option.key)}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === option.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                : 'bg-gray-50 dark:bg-slate-900/50 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
            >
              {option.label}
              {option.count > 0 && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeFilter === option.key ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-800'
                  }`}>
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {showExportMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
      )}
    </div>
  );
};

export default MenuSearchAndFilter;