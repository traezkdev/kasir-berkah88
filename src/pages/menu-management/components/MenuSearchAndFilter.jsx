import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { exportToExcel, exportToPdf } from '../../../utils/exportUtils';

const MenuSearchAndFilter = ({ 
  searchTerm, 
  onSearchChange, 
  menuItems,
  onExportData,
  isExporting, 
  activeFilter,
  onFilterChange
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const filterOptions = [
    { key: 'all', label: 'Semua', count: menuItems?.length },
    { key: 'available', label: 'Tersedia', count: menuItems?.filter(item => item?.stock > 5)?.length },
    { key: 'low', label: 'Menipis', count: menuItems?.filter(item => item?.stock <= 5 && item?.stock > 0)?.length },
    { key: 'out', label: 'Habis', count: menuItems?.filter(item => item?.stock === 0)?.length }
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
    <div className="bg-card rounded-lg shadow-elevation-1 border border-border p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search */}
        <div className="flex-1 lg:max-w-md">
          <div className="relative">
            <Icon 
              name="Search" 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              type="text"
              placeholder="Cari menu..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e?.target?.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions?.map(option => (
            <Button
              key={option?.key}
              variant={activeFilter === option?.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange(option?.key)}
              className="text-xs"
            >
              {option?.label}
              {option?.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === option?.key 
                    ? 'bg-primary-foreground/20 text-primary-foreground' :'bg-muted text-muted-foreground'
                }`}>
                  {option?.count}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Export */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportMenu(!showExportMenu)}
            iconName="Download"
            iconPosition="left"
            loading={isExporting} // Add loading prop
          >
            Export
          </Button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-popover rounded-lg shadow-elevation-2 border border-border py-2 z-50">
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors duration-200 flex items-center space-x-2"
              >
                <Icon name="FileSpreadsheet" size={16} />
                <span>Export ke Excel</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors duration-200 flex items-center space-x-2"
              >
                <Icon name="FileText" size={16} /> {/* Corrected icon to FileText */}
                <span>Export ke PDF</span>
              </button>
            </div>
          )}
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