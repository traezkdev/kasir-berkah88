import React, { useState, useEffect } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import DashboardMetricsBar from '../../components/ui/DashboardMetricsBar';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import QuickActionPanel from '../../components/ui/QuickActionPanel';
import ExpenseEntryForm from './components/ExpenseEntryForm';
import ExpenseSummaryCard from './components/ExpenseSummaryCard';
import ExpenseHistoryTable from './components/ExpenseHistoryTable';
import ExpenseAnalytics from './components/ExpenseAnalytics';
import * as XLSX from 'xlsx';

const apiUrl = import.meta.env.VITE_API_URL;

const ExpenseTracking = () => {
  const [expenses, setExpenses] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load expenses from localStorage on component mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('kasir_expenses');
    if (savedExpenses) {
      try {
        const parsedExpenses = JSON.parse(savedExpenses);
        setExpenses(parsedExpenses);
      } catch (error) {
        console.error('Error loading expenses from localStorage:', error);
      }
    }
  }, []);

  // Save expenses to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('kasir_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/menu-items`);
        const data = await response.json();
        if (data.message === 'success') {
          setMenuItems(data.data);
        } else {
          console.error('Failed to fetch menu items:', data.error);
          setMenuItems([]);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setMenuItems([]);
      }
    };
    fetchMenuItems();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/transactions`);
        const data = await response.json();
        if (data.message === 'success') {
          setTransactions(data.data);
        } else {
          console.error('Failed to fetch transactions:', data.error);
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      }
    };
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && menuItems.length > 0) {
      const today = new Date().toDateString();
      const todayTransactions = transactions.filter(t => new Date(t.timestamp).toDateString() === today);
      const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
      const averageOrderToday = todayTransactions.length > 0 ? todayTransactions.reduce((sum, t) => sum + t.total, 0) / todayTransactions.length : 0;
      const lowStockItems = menuItems.filter(item => item.stock <= 5 && item.stock > 0).length;

      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };

      setDashboardMetrics({
        todaySales: { value: formatCurrency(todaySales), change: '+12%', trend: 'up' },
        totalTransactions: { value: todayTransactions.length.toString(), change: '+8%', trend: 'up' },
        averageOrder: { value: formatCurrency(averageOrderToday), change: '+5%', trend: 'up' },
        lowStock: { value: lowStockItems.toString(), change: '-2', trend: 'down' }
      });
    }
  }, [transactions, menuItems]);

  const handleAddExpense = async (expenseData) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setExpenses(prev => [expenseData, ...prev]);
    setIsLoading(false);
  };

  const handleDeleteExpense = (expenseId) => {
    setExpenses(prev => prev?.filter(expense => expense?.id !== expenseId));
  };

  const handleBulkDelete = () => {
    setExpenses([]);
  };

  const handleExportData = () => {
    if (expenses?.length === 0) {
      alert('Tidak ada data pengeluaran untuk diekspor');
      return;
    }

    const exportData = expenses?.map(expense => ({
      'Tanggal': new Date(expense.date)?.toLocaleDateString('id-ID'),
      'Waktu': new Date(expense.date)?.toLocaleTimeString('id-ID'),
      'Kategori': expense?.categoryLabel,
      'Deskripsi': expense?.description,
      'Catatan': expense?.notes || '-',
      'Jumlah': expense?.amount
    }));

    const ws = XLSX?.utils?.json_to_sheet(exportData);
    const wb = XLSX?.utils?.book_new();
    XLSX?.utils?.book_append_sheet(wb, ws, 'Pengeluaran');

    // Auto-size columns
    const colWidths = [
      { wch: 12 }, // Tanggal
      { wch: 10 }, // Waktu
      { wch: 20 }, // Kategori
      { wch: 30 }, // Deskripsi
      { wch: 25 }, // Catatan
      { wch: 15 }  // Jumlah
    ];
    ws['!cols'] = colWidths;

    const fileName = `Pengeluaran_${new Date()?.toLocaleDateString('id-ID')?.replace(/\//g, '-')}.xlsx`;
    XLSX?.writeFile(wb, fileName);
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    const totalExpenses = expenses?.reduce((sum, expense) => sum + expense?.amount, 0);
    const expenseCount = expenses?.length;

    const today = new Date();
    const todayExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate?.toDateString() === today?.toDateString();
      })?.reduce((sum, expense) => sum + expense?.amount, 0);

    const currentMonth = today?.getMonth();
    const currentYear = today?.getFullYear();
    const monthlyExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate?.getMonth() === currentMonth && expenseDate?.getFullYear() === currentYear;
      })?.reduce((sum, expense) => sum + expense?.amount, 0);

    return {
      totalExpenses,
      expenseCount,
      todayExpenses,
      monthlyExpenses
    };
  };

  const summaryMetrics = calculateSummaryMetrics();

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onToggleSidebar={handleToggleSidebar} />
      <div className="pt-16">
        <DashboardMetricsBar metrics={dashboardMetrics} showOnAllPages />
        <main className="pt-6 lg:pt-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-6">
            {/* Breadcrumb */}
            <BreadcrumbNavigation />

            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Tracking Pengeluaran</h1>
                <p className="text-text-secondary mt-1">
                  Kelola dan pantau pengeluaran bisnis untuk analisis keuangan yang akurat
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <ExpenseSummaryCard
              totalExpenses={summaryMetrics?.totalExpenses}
              expenseCount={summaryMetrics?.expenseCount}
              todayExpenses={summaryMetrics?.todayExpenses}
              monthlyExpenses={summaryMetrics?.monthlyExpenses}
            />

            {/* Expense Entry Form */}
            <ExpenseEntryForm
              onAddExpense={handleAddExpense}
              isLoading={isLoading}
            />

            {/* Analytics Section */}
            {expenses?.length > 0 && (
              <ExpenseAnalytics expenses={expenses} />
            )}

            {/* Expense History Table */}
            <ExpenseHistoryTable
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
              onBulkDelete={handleBulkDelete}
              onExportData={handleExportData}
              isLoading={isLoading}
            />
          </div>
        </main>
        {/* Quick Action Panel */}
        <QuickActionPanel />
      </div>
    </div>
  );
};

export default ExpenseTracking;