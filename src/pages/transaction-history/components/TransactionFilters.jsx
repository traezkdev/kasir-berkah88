import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const TransactionFilters = ({
  onFilterChange,
  onSearch,
  onDateRangeChange,
  totalTransactions,
  totalRevenue,
  employeeMealCount
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // const [searchTerm, setSearchTerm] = useState(''); // Removed local state
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    paymentMethod: 'all',
    amountRange: 'all'
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  // handleSearchChange removed

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...activeFilters, [filterType]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    onDateRangeChange(newDateRange);
  };

  const clearAllFilters = () => {
    // setSearchTerm(''); // Removed
    setDateRange({ startDate: '', endDate: '' });
    setActiveFilters({ paymentMethod: 'all', amountRange: 'all' });
    onSearch('');
    onFilterChange({ paymentMethod: 'all', amountRange: 'all' });
    onDateRangeChange({ startDate: '', endDate: '' });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    // if (searchTerm) count++; // Removed searchTerm from filter count
    if (dateRange?.startDate || dateRange?.endDate) count++;
    if (activeFilters?.paymentMethod !== 'all') count++;
    if (activeFilters?.amountRange !== 'all') count++;
    return count;
  };

  return (
    <div className="transaction-filters-root">
      {/* Search and Filter Controls */}
      <div className="filter-section-container">

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex-1 flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 rounded-2xl border transition-all duration-300 group text-left ${isFilterOpen
              ? 'text-white shadow-xl shadow-blue-500/20'
              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200'
              }`}
            style={isFilterOpen ? { backgroundColor: '#148FEA', borderColor: '#148FEA' } : {}}
          >
            <div className="flex items-center gap-3 lg:gap-4">
              <div className={`p-2.5 rounded-xl transition-colors ${isFilterOpen ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-slate-600'}`}>
                <Icon name="Filter" size={20} />
              </div>
              <div>
                <span className={`block text-[10px] uppercase tracking-widest font-bold mb-0.5 ${isFilterOpen ? 'text-blue-100' : 'text-gray-400 dark:text-slate-500'}`}>
                  Filter & Sortir
                </span>
                <span className={`block text-sm font-bold ${isFilterOpen ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  Sesuaikan Tampilan Data
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Badge */}
              {getActiveFilterCount() > 0 && (
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isFilterOpen ? 'bg-white text-blue-600' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'}`}>
                  {getActiveFilterCount()} Aktif
                </span>
              )}
              <Icon name={isFilterOpen ? "ChevronUp" : "ChevronDown"} size={20} className={isFilterOpen ? 'text-white' : 'text-gray-400'} />
            </div>
          </button>

          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="h-[70px] w-[70px] flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md hover:bg-red-100 dark:hover:bg-red-900/30 group/reset"
              title="Reset semua filter"
            >
              <Icon name="RotateCcw" size={18} className="group-hover/reset:-rotate-180 transition-transform duration-500" />
              <span className="text-[9px] font-black uppercase tracking-wider">Reset</span>
            </button>
          )}
        </div>

        {/* Expanded Filters Panel */}
        {isFilterOpen && (
          <div className="mt-6 dana-card p-6 border-none shadow-xl shadow-gray-200 bg-white animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Date Range Group */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Rentang Tanggal</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Dari</p>
                    <input
                      type="date"
                      value={dateRange?.startDate}
                      onChange={(e) => handleDateRangeChange('startDate', e?.target?.value)}
                      className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 px-3 h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sampai</p>
                    <input
                      type="date"
                      value={dateRange?.endDate}
                      onChange={(e) => handleDateRangeChange('endDate', e?.target?.value)}
                      className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 px-3 h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Group */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Metode Pembayaran</h4>
                <div className="flex flex-wrap gap-2">
                  {['all', 'cash', 'transfer', 'qris', 'kredit', 'toko(lapak)'].map((method) => (
                    <button
                      key={method}
                      onClick={() => handleFilterChange('paymentMethod', method)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${activeFilters?.paymentMethod === method ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      style={activeFilters?.paymentMethod === method ? { backgroundColor: '#148FEA' } : {}}
                    >
                      {method === 'all' ? 'Semua' : method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Range Group */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Rentang Nominal</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Semua', value: 'all' },
                    { label: '< 50rb', value: '0-50000' },
                    { label: '50rb - 200rb', value: '50000-200000' },
                    { label: '> 200rb', value: '200000-max' }
                  ].map((range) => (
                    <button
                      key={range?.value}
                      onClick={() => handleFilterChange('amountRange', range?.value)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${activeFilters?.amountRange === range?.value ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      style={activeFilters?.amountRange === range?.value ? { backgroundColor: '#148FEA' } : {}}
                    >
                      {range?.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Stats in Filter */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Statistik Filter</h4>
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100/50">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] font-bold text-blue-600/60 uppercase tracking-widest">Total Transaksi</p>
                    <p className="text-xs font-black text-blue-600">{totalTransactions}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-bold text-blue-600/60 uppercase tracking-widest">Total Pendapatan</p>
                    <p className="text-xs font-black text-blue-600">{formatCurrency(totalRevenue)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;