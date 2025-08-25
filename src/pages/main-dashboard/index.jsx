import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationHeader from '../../components/ui/NavigationHeader';
import DashboardMetricsBar from '../../components/ui/DashboardMetricsBar';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import MetricsCard from './components/MetricsCard';
import QuickActionCard from './components/QuickActionCard';
import RecentTransactionsList from './components/RecentTransactionsList';
import BusinessSummaryCard from './components/BusinessSummaryCard';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import authFetch from '../../utils/authFetch'; // Add this import

const apiUrl = import.meta.env.VITE_API_URL;

const MainDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);

  const fetchData = async () => { // Moved outside useEffect
    const token = localStorage.getItem('token');
    if (!token) return; // Exit if no token
    try {
      const [transRes, menuRes, expenseRes] = await Promise.all([
        authFetch(`${apiUrl}/api/transactions`),
        authFetch(`${apiUrl}/api/menu-items`),
        authFetch(`${apiUrl}/api/expenses`)
      ]);

      const transactions = await transRes.json();
      const menuItems = await menuRes.json();
      const expenses = await expenseRes.json();

      if (transactions.message === 'success' && menuItems.message === 'success' && expenses.message === 'success') {
        processDashboardData(transactions.data, menuItems.data, expenses.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData(); // Call the function
  }, []);

  const processDashboardData = (transactions, menuItems, expenses) => {
    const today = new Date().toDateString();

    // Overall Metrics
    const totalRevenue = transactions.filter(t => !t.isEmployeeMeal).reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const stockValue = menuItems.reduce((sum, i) => sum + (i.stock * parseFloat(i.price || 0)), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Today's Stats
    const todayTransactions = transactions.filter(t => new Date(t.timestamp).toDateString() === today);
    const todaySales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    const itemsSoldToday = todayTransactions.flatMap(t => t.items).reduce((sum, i) => sum + i.quantity, 0);
    const averageOrderToday = todayTransactions.length > 0 ? todaySales / todayTransactions.length : 0;

    // Low Stock
    const lowStockItems = menuItems.filter(item => item.stock <= 5 && item.stock > 0).length;

    // Recent Transactions
    const recentTransactions = transactions.slice(0, 6);

    setDashboardData({
      metrics: {
        totalRevenue,
        totalExpenses,
        stockValue,
        netProfit
      },
      todayStats: {
        transactions: todayTransactions.length,
        itemsSold: itemsSoldToday,
        averageOrder: averageOrderToday,
        peakHour: 'N/A' // Placeholder
      },
      recentTransactions,
      dashboardMetrics: {
        todaySales: { value: formatCurrency(todaySales), change: '+12%', trend: 'up' },
        totalTransactions: { value: todayTransactions.length.toString(), change: '+8', trend: 'up' },
        averageOrder: { value: formatCurrency(averageOrderToday), change: '+5%', trend: 'up' },
        lowStock: { value: lowStockItems.toString(), change: '-2', trend: 'down' }
      }
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  const handleViewAllTransactions = () => {
    navigate('/transaction-history');
  };

  const quickActions = [
    {
      title: 'Proses Penjualan',
      description: 'Buat transaksi penjualan baru',
      icon: 'ShoppingCart',
      route: '/sales-transaction-processing',
      color: 'primary'
    },
    {
      title: 'Kelola Menu',
      description: 'Tambah & edit menu warung',
      icon: 'UtensilsCrossed',
      route: '/menu-management',
      color: 'success'
    },
    {
      title: 'Catat Pengeluaran',
      description: 'Input pengeluaran operasional',
      icon: 'Receipt',
      route: '/expense-tracking',
      color: 'accent'
    },
    {
      title: 'Lihat Laporan',
      description: 'Analisis performa bisnis',
      icon: 'FileText',
      route: '/business-reports',
      color: 'secondary'
    }
  ];

  const metricsData = [
    {
      title: 'Total Pendapatan',
      value: formatCurrency(dashboardData.metrics.totalRevenue),
      icon: 'TrendingUp',
      color: 'success',
      description: 'Tidak termasuk makan karyawan'
    },
    {
      title: 'Total Pengeluaran',
      value: formatCurrency(dashboardData.metrics.totalExpenses),
      icon: 'Receipt',
      color: 'warning',
      description: 'Operasional & pembelian'
    },
    {
      title: 'Nilai Stok',
      value: formatCurrency(dashboardData.metrics.stockValue),
      icon: 'Package',
      color: 'primary',
      description: 'Berdasarkan harga jual'
    },
    {
      title: 'Keuntungan Bersih',
      value: formatCurrency(dashboardData.metrics.netProfit),
      icon: 'DollarSign',
      color: 'accent',
      description: 'Pendapatan - pengeluaran'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onToggleSidebar={() => {}} />
      <div className="pt-16">
        <DashboardMetricsBar metrics={dashboardData.dashboardMetrics} />
        <main className="pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            {/* Header Section */}
            <div className="mb-6">
              <BreadcrumbNavigation />
              <div className="flex items-center justify-between mt-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                    Dashboard Kasir Berkah 88
                  </h1>
                  <p className="text-text-secondary mt-1">
                    Selamat datang! Kelola warung Anda dengan mudah
                  </p>
                </div>
                <div className="hidden lg:block">
                  <Button
                    variant="primary"
                    iconName="Plus"
                    iconPosition="left"
                    onClick={() => navigate('/sales-transaction-processing')}
                  >
                    Transaksi Baru
                  </Button>
                </div>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metricsData.map((metric, index) => (
                <MetricsCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  icon={metric.icon}
                  color={metric.color}
                  description={metric.description}
                />
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Aksi Cepat
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <QuickActionCard
                    key={index}
                    title={action.title}
                    description={action.description}
                    icon={action.icon}
                    route={action.route}
                    color={action.color}
                  />
                ))}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Transactions */}
              <div className="lg:col-span-2">
                <RecentTransactionsList
                  transactions={dashboardData.recentTransactions}
                  onViewAll={handleViewAllTransactions}
                />
              </div>

              {/* Business Summary */}
              <div className="lg:col-span-1">
                <BusinessSummaryCard
                  todayStats={dashboardData.todayStats}
                />
              </div>
            </div>

            {/* Status Banner */}
            <div className="mt-8 bg-gradient-to-r from-primary/10 to-success/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/20 rounded-md">
                  <Icon name="CheckCircle" size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">
                    Sistem Berjalan Normal
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Semua fitur POS tersedia dan data tersinkronisasi dengan baik
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-secondary">Terakhir dicek</p>
                  <p className="text-sm font-medium text-text-primary">
                    {new Date().toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default MainDashboard;