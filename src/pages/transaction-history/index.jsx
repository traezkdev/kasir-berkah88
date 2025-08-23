import React, { useState, useEffect, useMemo } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import QuickActionPanel from '../../components/ui/QuickActionPanel';
import TransactionFilters from './components/TransactionFilters';
import TransactionTable from './components/TransactionTable';
import BulkActions from './components/BulkActions';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    amountRange: 'all'
  });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  

  // Load transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/transactions');
        const data = await response.json();
        if (data.message === 'success') {
          const parsedTransactions = data.data.map(t => ({
            ...t,
            timestamp: new Date(t.timestamp),
            items: Array.isArray(t.items) ? t.items : JSON.parse(t.items || '[]')
          }));
          setTransactions(parsedTransactions);
        } else {
          console.error('Failed to fetch transactions:', data.error);
          setTransactions([]); // Set to empty array on failure
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]); // Set to empty array on network error
      }
    };

    fetchTransactions();
  }, []);

  

  // Filter transactions based on search, filters, and date range
  const applyFilters = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered?.filter(transaction => 
        transaction?.items?.some(item => 
          item?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase())
        ) || 
        transaction?.total?.toString()?.includes(searchTerm) ||
        transaction?.id?.toLowerCase()?.includes(searchTerm?.toLowerCase())
      );
    }

    // Type filter
    if (filters?.type !== 'all') {
      filtered = filtered?.filter(transaction => {
        if (filters?.type === 'regular') return !transaction?.isEmployeeMeal;
        if (filters?.type === 'employee') return transaction?.isEmployeeMeal;
        return true;
      });
    }

    // Amount range filter
    if (filters?.amountRange !== 'all') {
      filtered = filtered?.filter(transaction => {
        const amount = transaction?.total;
        switch (filters?.amountRange) {
          case '0-50000':
            return amount >= 0 && amount <= 50000;
          case '50000-100000':
            return amount > 50000 && amount <= 100000;
          case '100000-200000':
            return amount > 100000 && amount <= 200000;
          case '200000+':
            return amount > 200000;
          default:
            return true;
        }
      });
    }

    // Date range filter
    if (dateRange?.startDate || dateRange?.endDate) {
      filtered = filtered?.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange?.endDate ? new Date(dateRange.endDate) : null;

        if (startDate && endDate) {
          return transactionDate >= startDate && transactionDate <= endDate;
        } else if (startDate) {
          return transactionDate >= startDate;
        } else if (endDate) {
          return transactionDate <= endDate;
        }
        return true;
      });
    }

    // Sort by timestamp (newest first)
    filtered?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered;
  }, [transactions, searchTerm, filters, dateRange]);

  useEffect(() => {
    setFilteredTransactions(applyFilters);
  }, [applyFilters]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalTransactions = filteredTransactions?.length;
    const totalRevenue = filteredTransactions?.filter(t => !t?.isEmployeeMeal)?.reduce((sum, t) => sum + t?.total, 0);
    const employeeMealCount = filteredTransactions?.filter(t => t?.isEmployeeMeal)?.length;

    return {
      totalTransactions,
      totalRevenue,
      employeeMealCount
    };
  }, [filteredTransactions]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.message === 'deleted') {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
      } else {
        console.error('Failed to delete transaction:', data.error);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleClearAllTransactions = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/transactions', {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.message === 'all deleted') {
        setTransactions([]);
      } else {
        console.error('Failed to clear transactions:', data.error);
      }
    } catch (error) {
      console.error('Error clearing transactions:', error);
    }
  };

  const handleExportTransactions = async (format) => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (format === 'excel') {
        // Mock Excel export
        const csvContent = [
          ['ID Transaksi', 'Tanggal', 'Item', 'Total', 'Jenis']?.join(','),
          ...filteredTransactions?.map(t => [
            t?.id,
            new Intl.DateTimeFormat('id-ID')?.format(new Date(t.timestamp)),
            t?.items?.map(item => `${item?.name} (${item?.quantity})`)?.join('; '),
            t?.total,
            t?.isEmployeeMeal ? 'Makan Karyawan' : 'Regular'
          ]?.join(','))
        ]?.join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL?.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `riwayat-transaksi-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
        a?.click();
        window.URL?.revokeObjectURL(url);
      }
      
      console.log(`Exported ${filteredTransactions?.length} transactions as ${format}`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const breadcrumbPath = [
    { label: 'Dashboard', path: '/main-dashboard', isActive: false },
    { label: 'Riwayat Transaksi', path: '/transaction-history', isActive: true }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onToggleSidebar={() => {}} />
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="px-4 lg:px-6 py-6">
          <div className="mb-6">
            <BreadcrumbNavigation customPath={breadcrumbPath} />
            <h1 className="text-2xl lg:text-3xl font-semibold text-text-primary mt-2">
              Riwayat Transaksi
            </h1>
            <p className="text-text-secondary mt-1">
              Kelola dan pantau semua transaksi penjualan Anda
            </p>
          </div>

          <div className="space-y-6">
            <TransactionFilters
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              onDateRangeChange={handleDateRangeChange}
              totalTransactions={summaryStats?.totalTransactions}
              totalRevenue={summaryStats?.totalRevenue}
              employeeMealCount={summaryStats?.employeeMealCount}
            />

            <TransactionTable
              transactions={filteredTransactions}
              onDeleteTransaction={handleDeleteTransaction}
              isMobile={isMobile}
            />

            <BulkActions
              onClearAllTransactions={handleClearAllTransactions}
              onExportTransactions={handleExportTransactions}
              transactionCount={filteredTransactions?.length}
              isExporting={isExporting}
            />
          </div>
        </div>
      </main>
      <QuickActionPanel />
    </div>
  );
};

export default TransactionHistory;