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
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleSearchChange = (e) => {
    const value = e?.target?.value;
    setSearchTerm(value);
    onSearch(value);
  };

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
    setSearchTerm('');
    setDateRange({ startDate: '', endDate: '' });
    setActiveFilters({ paymentMethod: 'all', amountRange: 'all' });
    onSearch('');
    onFilterChange({ paymentMethod: 'all', amountRange: 'all' });
    onDateRangeChange({ startDate: '', endDate: '' });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (dateRange?.startDate || dateRange?.endDate) count++;
    if (activeFilters?.paymentMethod !== 'all') count++;
    if (activeFilters?.amountRange !== 'all') count++;
    return count;
  };

  return (
    <div className="transaction-filters-root">
      {/* Search and Filter Controls */}
      <div className="filter-section-container">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1">
            <div className="flex items-center px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm group focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:shadow-md transition-all duration-300">
              <Icon
                name="Search"
                size={20}
                className="text-gray-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors flex-shrink-0"
              />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 placeholder:font-normal ml-3 outline-none"
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); onSearch(''); }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all active:scale-95 flex-shrink-0"
                >
                  <Icon name="X" size={16} className="text-gray-400 dark:text-slate-500" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-center gap-2 h-12 px-5 rounded-xl border transition-all duration-300 active:scale-95 font-bold text-sm ${isFilterOpen
                ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/30'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-slate-700 shadow-sm hover:border-blue-500 dark:hover:border-blue-400'
                }`}
            >
              <Icon name="Filter" size={18} className={isFilterOpen ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
              <span className="hidden sm:inline">Filter</span>
              {getActiveFilterCount() > 0 && (
                <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full font-black ${isFilterOpen ? 'bg-white text-blue-600' : 'bg-blue-600 dark:bg-blue-500 text-white'
                  }`}>
                  {getActiveFilterCount()}
                </span>
              )}
            </button>

            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="h-12 w-12 flex items-center justify-center rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md"
                title="Reset semua filter"
              >
                <Icon name="RotateCcw" size={18} />
              </button>
            )}
          </div>
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
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${activeFilters?.paymentMethod === method ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${activeFilters?.amountRange === range?.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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