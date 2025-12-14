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
    <div className="bg-card border-b border-border shadow-elevation-1">

      {/* Search and Filter Controls */}
      <div className="px-4 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Icon
                name="Search"
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
              />
              <Input
                type="text"
                placeholder="Cari transaksi berdasarkan nama item atau jumlah..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
                autoComplete="off" // Add this
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              iconName="Filter"
              iconPosition="left"
              className="relative"
            >
              Filter
              {getActiveFilterCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </Button>

            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                iconName="X"
                className="text-text-secondary"
              />
            )}
          </div>
        </div>

        {/* Expanded Filter Options */}
        {isFilterOpen && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tanggal Mulai
                </label>
                <Input
                  type="date"
                  value={dateRange?.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e?.target?.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tanggal Akhir
                </label>
                <Input
                  type="date"
                  value={dateRange?.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e?.target?.value)}
                />
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Metode Pembayaran
                </label>
                <select
                  value={activeFilters?.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e?.target?.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">Semua</option>
                  <option value="tunai">Tunai</option>
                  <option value="Gojek">Gojek</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Makan Karyawan">Makan Karyawan</option>
                </select>
              </div>

              {/* Amount Range Filter */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Rentang Jumlah
                </label>
                <select
                  value={activeFilters?.amountRange}
                  onChange={(e) => handleFilterChange('amountRange', e?.target?.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">Semua Jumlah</option>
                  <option value="0-50000">Rp 0 - Rp 50.000</option>
                  <option value="50000-100000">Rp 50.000 - Rp 100.000</option>
                  <option value="100000-200000">Rp 100.000 - Rp 200.000</option>
                  <option value="200000+">Rp 200.000+</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;