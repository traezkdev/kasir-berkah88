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
  onShareStock, // Tambahkan prop ini
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
    onExportData(format); // Keep this if there's external handling, otherwise remove
    setShowExportMenu(false);
  };

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border p-5 mb-8 transition-all duration-300">
      <div className="flex flex-col gap-6">
        {/* Top Row: Search & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-2xl group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon
                name="Search"
                size={20}
                className="text-text-secondary group-focus-within:text-primary transition-colors"
              />
            </div>
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e?.target?.value)}
              className="block w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-text-primary shadow-sm hover:border-primary/50"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Share Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onShareStock}
              iconName="Share2"
              iconPosition="left"
              className="h-11 px-4 font-medium"
            >
              Bagikan Stok
            </Button>

            {/* Export Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                iconName="Download"
                iconPosition="left"
                loading={isExporting}
                className="h-11 px-4 font-medium"
              >
                Export
              </Button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-popover rounded-xl shadow-2xl border border-border py-2 z-50 animate-in fade-in zoom-in duration-200">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full px-4 py-3 text-left text-sm text-text-primary hover:bg-muted transition-colors duration-200 flex items-center space-x-3"
                  >
                    <Icon name="FileSpreadsheet" size={18} className="text-green-500" />
                    <span className="font-medium">Export ke Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-3 text-left text-sm text-text-primary hover:bg-muted transition-colors duration-200 flex items-center space-x-3"
                  >
                    <Icon name="FileText" size={18} className="text-red-500" />
                    <span className="font-medium">Export ke PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/50">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mr-2 hidden md:inline">Filter:</span>
          {filterOptions?.map(option => (
            <button
              key={option?.key}
              onClick={() => onFilterChange(option?.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeFilter === option?.key
                  ? 'bg-primary text-white shadow-md shadow-primary/25 transform scale-105'
                  : 'bg-muted/50 text-text-secondary hover:bg-muted hover:text-text-primary'
                }`}
            >
              {option?.label}
              {option?.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeFilter === option?.key
                    ? 'bg-white/20 text-white'
                    : 'bg-muted-foreground/20 text-text-secondary'
                  }`}>
                  {option?.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Click outside handler */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
};

export default MenuSearchAndFilter;