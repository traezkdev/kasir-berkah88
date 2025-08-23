import React, { useState, useEffect } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import DashboardMetricsBar from '../../components/ui/DashboardMetricsBar';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import QuickActionPanel from '../../components/ui/QuickActionPanel';
import DateRangeSelector from './components/DateRangeSelector';
import StockReportSection from './components/StockReportSection';
import SalesReportSection from './components/SalesReportSection';
import ExpenseReportSection from './components/ExpenseReportSection';
import CombinedAnalyticsSection from './components/CombinedAnalyticsSection';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const apiUrl = import.meta.env.VITE_API_URL;

const BusinessReports = () => {
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    range: 'today'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportTime, setLastExportTime] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, menuRes] = await Promise.all([
          fetch(`${apiUrl}/api/transactions`),
          fetch(`${apiUrl}/api/menu-items`)
        ]);

        const transData = await transRes.json();
        const menuData = await menuRes.json();

        if (transData.message === 'success') {
          setTransactions(transData.data.map(t => ({...t, timestamp: new Date(t.timestamp)})));
        }

        if (menuData.message === 'success') {
          setMenuItems(menuData.data);
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!transactions || !menuItems) return;

    const processReportData = () => {
      // Filter transactions based on selectedDateRange
      const filteredTransactions = transactions.filter(t => {
        const tDate = new Date(t.timestamp);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);

        switch (selectedDateRange.range) {
          case 'today':
            return tDate.toDateString() === today.toDateString();
          case 'yesterday':
            return tDate.toDateString() === yesterday.toDateString();
          case 'week':
            return tDate >= weekAgo;
          case 'month':
            return tDate >= monthAgo;
          default:
            return tDate >= selectedDateRange.startDate && tDate <= selectedDateRange.endDate;
        }
      });

      // Sales Report Data
      const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
      const totalTransactions = filteredTransactions.length;
      const averageOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      const topItems = filteredTransactions
        .flatMap(t => t.items)
        .reduce((acc, item) => {
          const existing = acc.find(i => i.name === item.name);
          if (existing) {
            existing.sold += item.quantity;
            existing.revenue += item.quantity * item.price;
          } else {
            acc.push({ name: item.name, sold: item.quantity, revenue: item.quantity * item.price });
          }
          return acc;
        }, [])
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Stock Report Data
      const totalStockValue = menuItems.reduce((sum, i) => sum + (i.stock * i.price), 0);
      const lowStockItems = menuItems.filter(i => i.stock > 0 && i.stock <= 5);

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
        // Expense data is still mock as we don't have expense tracking in DB
        expenses: {
            summary: {
              totalExpenses: 'Rp 0',
              categories: 0,
              averageDaily: 'Rp 0'
            }
        }
      });
    };

    processReportData();
  }, [transactions, menuItems, selectedDateRange]);

  const handleDateRangeChange = (dateRange) => {
    setSelectedDateRange(dateRange);
    console.log('Date range changed:', dateRange);
  };

  const formatDateRange = () => {
    const { startDate, endDate, range } = selectedDateRange;
    
    if (range === 'today') return 'Hari Ini';
    if (range === 'yesterday') return 'Kemarin';
    if (range === 'week') return '7 Hari Terakhir';
    if (range === 'month') return '30 Hari Terakhir';
    
    if (startDate && endDate) {
      return `${startDate?.toLocaleDateString('id-ID')} - ${endDate?.toLocaleDateString('id-ID')}`;
    }
    
    return 'Pilih Periode';
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleClearData = async () => {
    if (password !== 'berkah88') {
      setError('Kata sandi salah!');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/transactions`, { method: 'DELETE' });
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
      <NavigationHeader onToggleSidebar={() => {}} />
      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Header Section */}
          <div className="mb-6">
            <BreadcrumbNavigation className="mb-4" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                  Laporan Bisnis
                </h1>
                <p className="text-text-secondary">
                  Analisis komprehensif performa bisnis Anda.
                </p>
              </div>
              <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  iconName="Trash2"
                  iconPosition="left"
                >
                  Kosongkan Data
                </Button>
            </div>
          </div>

          {/* Date Range Selector */}
          <DateRangeSelector 
            onDateRangeChange={handleDateRangeChange}
            selectedRange={selectedDateRange?.range}
          />

          {reportData ? (
            <div className="space-y-8 mt-6">
              <SalesReportSection data={reportData.sales} />
              <StockReportSection data={reportData.stock} />
              <ExpenseReportSection data={reportData.expenses} />
              <CombinedAnalyticsSection salesData={reportData.sales} stockData={reportData.stock} />
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-text-secondary">Memuat data laporan...</p>
            </div>
          )}
        </div>
      </main>
      <QuickActionPanel />

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