import React, { useState, useEffect } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import DashboardMetricsBar from '../../components/ui/DashboardMetricsBar';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import DateRangeSelector from './components/DateRangeSelector';
import StockReportSection from './components/StockReportSection';
import SalesReportSection from './components/SalesReportSection';
import ExpenseReportSection from './components/ExpenseReportSection';
import CombinedAnalyticsSection from './components/CombinedAnalyticsSection';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import authFetch from '../../utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

const BusinessReports = ({ headerTitle }) => {
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    range: 'today'
  });
  const [transactions, setTransactions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [expenses, setExpenses] = useState([]); // State for expenses
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const [transRes, menuRes, expenseRes] = await Promise.all([
          authFetch(`${apiUrl}/api/transactions`),
          authFetch(`${apiUrl}/api/menu-items`),
          authFetch(`${apiUrl}/api/expenses`)
        ]);

        const transData = await transRes.json();
        const menuData = await menuRes.json();
        const expenseData = await expenseRes.json();

        if (transData.message === 'success') {
          setTransactions(transData.data.map(t => ({...t, timestamp: new Date(t.timestamp)})));
        }
        if (menuData.message === 'success') {
          setMenuItems(menuData.data);
        }
        if (expenseData.message === 'success') {
          setExpenses(expenseData.data.map(e => ({...e, date: new Date(e.date)})));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isLoading) return; // Don't process until initial data is loaded

    const processReportData = () => {
      const filterByDate = (item) => {
        const itemDate = new Date(item.timestamp || item.date);
        itemDate.setHours(0, 0, 0, 0); // Normalize item date

        const startDate = new Date(selectedDateRange.startDate);
        startDate.setHours(0, 0, 0, 0); // Normalize start date

        const endDate = new Date(selectedDateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day

        return itemDate >= startDate && itemDate <= endDate;
      };

      const filteredTransactions = transactions.filter(filterByDate);
      const filteredExpenses = expenses.filter(filterByDate);

      // Sales Report Data
      const totalRevenue = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const totalTransactions = filteredTransactions.length;
      const averageOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      const topItems = filteredTransactions
        .flatMap(t => t.items)
        .reduce((acc, item) => {
          const existing = acc.find(i => i.name === item.name);
          const itemPrice = parseFloat(item.price || 0);
          if (existing) {
            existing.sold += item.quantity;
            existing.revenue += item.quantity * itemPrice;
          } else {
            acc.push({ name: item.name, sold: item.quantity, revenue: item.quantity * itemPrice });
          }
          return acc;
        }, [])
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Stock Report Data
      const totalStockValue = menuItems.reduce((sum, i) => sum + (i.stock * parseFloat(i.price || 0)), 0);
      const lowStockItems = menuItems.filter(i => i.stock > 0 && i.stock <= 5);

      // Expense Report Data
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const expenseCategories = [...new Set(filteredExpenses.map(e => e.category))].length;
      const averageDailyExpenses = totalTransactions > 0 ? totalExpenses / totalTransactions : 0; // Or divide by days in range

      setReportData({
        sales: {
          totalRevenue,
          totalTransactions,
          averageOrder,
          topItems,
        },
        stock: {
          totalValue: totalStockValue,
          totalItems: menuItems.length,
          lowStockItems: lowStockItems.length,
          items: menuItems,
          lowStock: lowStockItems,
        },
        expenses: {
          summary: {
            totalExpenses: totalExpenses,
            categories: expenseCategories,
            averageDaily: averageDailyExpenses
          },
          items: filteredExpenses
        }
      });
    };

    processReportData();
  }, [transactions, menuItems, expenses, selectedDateRange, isLoading]);

  const handleDateRangeChange = (dateRange) => {
    setSelectedDateRange(dateRange);
  };

  const handleClearData = async () => {
    if (password !== 'berkah88') {
      setError('Kata sandi salah!');
      return;
    }

    try {
      const response = await authFetch(`${apiUrl}/api/transactions`, { method: 'DELETE' });
      const result = await response.json();
      if (result.message === 'all deleted') {
        setTransactions([]);
        setIsModalOpen(false);
        setPassword('');
        setError('');
      } else {
        setError('Gagal menghapus data.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle} />
      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Header Section */}
          <div className="mb-6">
            <BreadcrumbNavigation className="mb-4" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                  Laporan Bisnis
                </h1>
                <p className="text-text-secondary">
                  Analisis komprehensif performa bisnis Anda.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setIsModalOpen(true)} className="mt-4 sm:mt-0">
                Hapus Semua Data
              </Button>
            </div>
          </div>

          {/* Date Range Selector */}
          <DateRangeSelector 
            onDateRangeChange={handleDateRangeChange}
            selectedRange={selectedDateRange?.range}
          />

          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-text-secondary">Memuat data laporan...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-8 mt-6">
              <SalesReportSection data={reportData.sales} />
              <StockReportSection data={reportData.stock} />
              <ExpenseReportSection data={reportData.expenses} />
              <CombinedAnalyticsSection salesData={reportData.sales} stockData={reportData.stock} expensesData={reportData.expenses} />
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-text-secondary">Tidak ada data untuk ditampilkan pada periode ini.</p>
            </div>
          )}
        </div>
      </main>
      

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Konfirmasi Hapus Data</h2>
            <p className="text-text-secondary mb-4">Tindakan ini akan menghapus semua data transaksi secara permanen. Masukkan kata sandi untuk melanjutkan.</p>
            <Input
              type="password"
              placeholder="Kata Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button variant="danger" onClick={handleClearData}>Hapus Data</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessReports;
