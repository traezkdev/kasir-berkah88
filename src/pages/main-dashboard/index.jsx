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
// import DarkModeToggle from '../../components/ui/DarkModeToggle';
import authFetch from '../../utils/authFetch'; // Add this import

const apiUrl = import.meta.env.VITE_API_URL;

import { useTheme } from '../../contexts/ThemeContext';

const MainDashboard = ({ headerTitle }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);

      const fetchData = async (currentUserRole) => { // Add currentUserRole parameter
      const token = localStorage.getItem('token');
      if (!token) return; // Exit if no token
      try {
        const [paginatedTransRes, allTransRes, menuRes, expenseRes, settingsRes, ownerAccountRes, lapakAccountRes, rawMaterialsRes] = await Promise.all([
          authFetch(`${apiUrl}/api/transactions`), // This fetches paginated transactions (default limit 20)
          authFetch(`${apiUrl}/api/transactions/all`), // Fetch all transactions for all-time metrics
          authFetch(`${apiUrl}/api/menu-items/all`),
          authFetch(`${apiUrl}/api/expenses/all`), // Fetch all expenses
          authFetch(`${apiUrl}/api/all-settings`),
          authFetch(`${apiUrl}/api/accounts/owner_deposit`),
          authFetch(`${apiUrl}/api/accounts/lapak_deposit`),
          authFetch(`${apiUrl}/api/raw-materials`) // Fetch raw materials
        ]);
  
        let paginatedTransactionsData = [];
        let allTransactionsData = [];
        let menuItemsData = [];
        let expensesData = [];
        let settingsData = {};
        let ownerAccountData = null;
        let lapakAccountData = null;
        let rawMaterialsData = []; // Initialize rawMaterialsData
  
              // Handle paginated transactions data (for recent transactions list)
  
              if (paginatedTransRes.ok) {
  
                const paginatedTransactions = await paginatedTransRes.json();
  
                if (paginatedTransactions.message === 'success') {
  
                  paginatedTransactionsData = paginatedTransactions.data;
  
                }
  
              } else {
  
                console.error("Failed to fetch paginated transactions:", paginatedTransRes.status, paginatedTransRes.statusText);
  
              }

      // Handle all transactions data (for all-time metrics)
      if (allTransRes.ok) {
        const allTransactions = await allTransRes.json();
        if (allTransRes.ok && allTransactions.message === 'success') {
          allTransactionsData = allTransactions.data;
        }
      } else {
        console.error("Failed to fetch all transactions:", allTransRes.status, allTransRes.statusText);
      }

      // Handle menu items data
      if (menuRes.ok) {
        const menuItems = await menuRes.json();
        if (menuRes.ok && menuItems.message === 'success') {
          menuItemsData = menuItems.data;
        }
      } else {
        console.error("Failed to fetch menu items:", menuRes.status, menuRes.statusText);
      }

      // Handle expenses data
      if (expenseRes.ok) {
        const expenses = await expenseRes.json();
        if (expenseRes.ok && expenses.message === 'success') {
          expensesData = expenses.data;
        }
      } else {
        console.error("Failed to fetch expenses:", expenseRes.status, expenseRes.statusText);
      }

      // Handle settings data
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settingsRes.ok && settings.message === 'success') {
          settingsData = settings.data;
        }
      } else {
        console.error("Failed to fetch settings:", settingsRes.status, settingsRes.statusText);
      }

      // Handle owner account data
      if (ownerAccountRes.ok) {
        const ownerAccount = await ownerAccountRes.json();
        if (ownerAccountRes.ok && ownerAccount.message === 'success') {
          ownerAccountData = ownerAccount.data;
        }
      } else {
        console.error("Failed to fetch owner account data:", ownerAccountRes.status, ownerAccountRes.statusText);
      }

      // Handle lapak account data
      if (lapakAccountRes.ok) {
        const lapakAccount = await lapakAccountRes.json();
        if (lapakAccountRes.ok && lapakAccount.message === 'success') {
          lapakAccountData = lapakAccount.data;
        }
      } else {
        console.error("Failed to fetch lapak account data:", lapakAccountRes.status, lapakAccountRes.statusText);
      }

      // Handle raw materials data
      if (rawMaterialsRes.ok) {
        const rawMaterials = await rawMaterialsRes.json();
        if (rawMaterialsRes.ok && rawMaterials.message === 'success') {
          rawMaterialsData = rawMaterials.data;
        }
      } else {
        console.error("Failed to fetch raw materials data:", rawMaterialsRes.status, rawMaterialsRes.statusText);
      }



      // Process data if menu items are available (always expected)
      // and other data is fetched (or empty if not available)
      if (menuItemsData.length > 0 || paginatedTransactionsData.length > 0 || allTransactionsData.length > 0 || expensesData.length > 0 || rawMaterialsData.length > 0) {
        processDashboardData(paginatedTransactionsData, allTransactionsData, menuItemsData, expensesData, settingsData, ownerAccountData, lapakAccountData, rawMaterialsData);
      } else {
        // Optionally, set dashboardData to an empty state to stop loading spinner
        setDashboardData({
          metrics: { totalRevenue: 0, totalExpenses: 0, stockValue: 0, netProfit: 0, workingCapital: 0, allTimeRevenue: 0, allTimeExpenses: 0, allTimeNetProfit: 0, ownerBalance: 0, lapakBalance: 0, rawMaterialStockValue: 0 },
          todayStats: { transactions: 0, itemsSold: 0, averageOrder: 0, peakHour: 'N/A' },
          recentTransactions: [],
          dashboardMetrics: {
            todaySales: { value: 'Rp 0', change: '0%', trend: 'up' },
            totalTransactions: { value: '0', change: '0', trend: 'up' },
            averageOrder: { value: 'Rp 0', change: '0%', trend: 'up' },
            lowStock: { value: '0', change: '', trend: 'down' }
          }
        });
      }
    } catch (error) {
      console.error("Error during dashboard data fetch:", error);
      // In case of network error, stop loading and show empty data
      setDashboardData({
        metrics: { totalRevenue: 0, totalExpenses: 0, stockValue: 0, netProfit: 0, workingCapital: 0, allTimeRevenue: 0, allTimeExpenses: 0, allTimeNetProfit: 0, ownerBalance: 0 }, // Ensure all metrics are initialized
        todayStats: { transactions: 0, itemsSold: 0, averageOrder: 0, peakHour: 'N/A' },
        recentTransactions: [],
        dashboardMetrics: {
          todaySales: { value: 'Rp 0', change: '0%', trend: 'up' },
          totalTransactions: { value: '0', change: '0', trend: 'up' },
          averageOrder: { value: 'Rp 0', change: '0%', trend: 'up' },
          lowStock: { value: '0', change: '', trend: 'down' }
        }
      });
    }
  };

  // Get user role from token and then fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const role = decodedToken.role;
        // Pass the role to fetchData
        fetchData(role);
      } catch (e) {
        console.error("Error decoding token in MainDashboard:", e);
        // If token is invalid, maybe redirect to login or handle as unauthenticated
        navigate('/login');
      }
    } else {
      // No token, redirect to login
      navigate('/login');
    }
  }, []); // Empty dependency array to run once on mount

  // Get user role from token and then fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const role = decodedToken.role;
        // Pass the role to fetchData
        fetchData(role);
      } catch (e) {
        console.error("Error decoding token in MainDashboard:", e);
        // If token is invalid, maybe redirect to login or handle as unauthenticated
        navigate('/login');
      }
    }
  }, []); // Empty dependency array to run once on mount

    const processDashboardData = (paginatedTransactions, allTransactions, menuItems, expenses, settings, ownerAccountData, lapakAccountData, rawMaterialsData) => {
      const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
  
      const todayString = today.toDateString();
      const yesterdayString = yesterday.toDateString();
  
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
  
      // --- All-Time & Working Capital Metrics ---
      const initialCapital = parseFloat(settings?.initial_capital || 0);
      const initialCapitalDate = settings?.initial_capital_date ? new Date(settings.initial_capital_date) : null;
      let workingCapital = 0;
  
      // For "All Time" metrics, consider all transactions and expenses regardless of initial_capital_date
      const allTimeTransactions = allTransactions; 
      const allTimeRelevantExpenses = expenses;
  
      const allTimeRevenue = allTimeTransactions
        .filter(t => t.payment_method !== 'Makan Karyawan')
        .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const allTimeExpenses = allTimeRelevantExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const allTimeNetProfit = allTimeRevenue - allTimeExpenses;

      const totalMenuStockValue = menuItems.reduce((sum, i) => sum + (i.stock * parseFloat(i.price || 0)), 0);
      const rawMaterialStockValue = rawMaterialsData.reduce((sum, m) => sum + (parseInt(m.current_stock || 0) * parseFloat(m.price_per_item || 0)), 0);
      const stockValue = totalMenuStockValue; // Only menu stock value

      if (!isNaN(initialCapital)) {
          workingCapital = initialCapital + allTimeRevenue + totalMenuStockValue + rawMaterialStockValue - allTimeExpenses;
      }
  
      // --- Monthly Metrics for Dashboard ---
      // Use allTransactions for monthly metrics to ensure complete data
      const monthlyTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      });
  
      const totalRevenue = monthlyTransactions
        .filter(t => t.payment_method !== 'Makan Karyawan')
        .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const monthlyExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      });
  
      const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      const netProfit = totalRevenue - totalExpenses + totalMenuStockValue + rawMaterialStockValue;
  
      // --- Daily Stats Calculation ---
      // Use allTransactions for today's stats to ensure complete data for the day.
      const todayTransactions = allTransactions.filter(t => new Date(t.timestamp).toDateString() === todayString && t.payment_method !== 'Makan Karyawan');
      const todaySales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const averageOrderToday = todayTransactions.length > 0 ? todaySales / todayTransactions.length : 0;
  
      // Yesterday's Data
      const yesterdayTransactions = allTransactions.filter(t => new Date(t.timestamp).toDateString() === yesterdayString && t.payment_method !== 'Makan Karyawan');
      const yesterdaySales = yesterdayTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const averageOrderYesterday = yesterdayTransactions.length > 0 ? yesterdaySales / yesterdayTransactions.length : 0;
  
      // --- Change & Trend Calculation ---
      let salesChange = 0;
      if (yesterdaySales > 0) {
        salesChange = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
      } else if (todaySales > 0) {
        salesChange = 100;
      }
      const salesChangeFormatted = `${salesChange >= 0 ? '+' : ''}${salesChange.toFixed(0)}%`;
      const salesTrend = salesChange >= 0 ? 'up' : 'down';
  
      const transChange = todayTransactions.length - yesterdayTransactions.length;
      const transChangeFormatted = `${transChange >= 0 ? '+' : ''}${transChange}`;
      const transTrend = transChange >= 0 ? 'up' : 'down';
  
      let avgOrderChange = 0;
      if (averageOrderYesterday > 0) {
        avgOrderChange = ((averageOrderToday - averageOrderYesterday) / averageOrderYesterday) * 100;
      } else if (averageOrderToday > 0) {
        avgOrderChange = 100;
      }
      const avgOrderChangeFormatted = `${avgOrderChange >= 0 ? '+' : ''}${avgOrderChange.toFixed(0)}%`;
      const avgOrderTrend = avgOrderChange >= 0 ? 'up' : 'down';
  
      // --- Other Metrics ---
      const itemsSoldToday = todayTransactions.flatMap(t => {
        try {
          const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
          return Array.isArray(items) ? items : [];
        } catch (e) {
          console.error("Failed to parse transaction items:", e);
          return [];
        }
      }).reduce((sum, i) => sum + (i.quantity || 0), 0);
      const lowStockItems = menuItems.filter(item => item.stock <= 5 && item.stock > 0).length;
      const recentTransactions = paginatedTransactions.slice(0, 6); // Use paginated for recent list
  
      setDashboardData({
        metrics: {
          // Monthly
          totalRevenue,
          totalExpenses,
          netProfit,
          // All-Time
          workingCapital,
          allTimeRevenue,
          allTimeExpenses,
          allTimeNetProfit,
          initialCapital, // Add initialCapital here
          // Other
          stockValue, // Now only totalMenuStockValue
          ownerBalance: ownerAccountData?.account?.balance || 0,
          lapakBalance: lapakAccountData?.account?.balance || 0,
        },
        todayStats: {
          transactions: todayTransactions.length,
          itemsSold: itemsSoldToday,
          averageOrder: averageOrderToday,
          peakHour: (() => {
            if (todayTransactions.length === 0) return 'N/A';
            const hourCounts = Array(24).fill(0);
            todayTransactions.forEach(t => {
              const hour = new Date(t.timestamp).getHours();
              hourCounts[hour]++;
            });
            const busiestHour = hourCounts.indexOf(Math.max(...hourCounts));
            return `${String(busiestHour).padStart(2, '0')}:00 - ${String(busiestHour + 1).padStart(2, '0')}:00`;
          })()
        },
        recentTransactions,
        dashboardMetrics: {
          todaySales: { value: formatCurrency(todaySales), change: salesChangeFormatted, trend: salesTrend },
          totalTransactions: { value: todayTransactions.length.toString(), change: transChangeFormatted, trend: transTrend },
          averageOrder: { value: formatCurrency(averageOrderToday), change: avgOrderChangeFormatted, trend: avgOrderTrend },
          lowStock: { value: lowStockItems.toString(), change: '', trend: 'down' }
        },
        timestamps: {
          menuStock: settings?.menu_stock_last_updated,
          rawMaterials: settings?.raw_materials_last_updated,
          lapakFunds: settings?.lapak_funds_last_updated
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
    },
    {
      title: 'Kalkulator',
      description: 'Akses kalkulator cepat',
      icon: 'Calculator',
      route: '/calculator',
      color: 'destructive'
    },
    {
      title: 'Daftar Karyawan',
      description: 'Lihat struktur organisasi',
      icon: 'Users',
      route: '/employee-list',
      color: 'success'
    },
    {
      title: 'Kalkulator HPP',
      description: 'Hitung harga pokok penjualan',
      icon: 'DollarSign',
      route: '/hpp',
      color: 'primary'
    }
  ];

  const metricsData = [
    {
      title: 'Modal Awal',
      value: formatCurrency(dashboardData.metrics.initialCapital),
      icon: 'PiggyBank', // Changed to PiggyBank for initial capital
      color: 'primary',
      description: 'Jumlah modal awal yang disetor'
    },
    {
      title: 'Modal Berjalan',
      value: formatCurrency(dashboardData.metrics.workingCapital),
      icon: 'Wallet',
      color: 'info',
      description: 'Modal awal + pendapatan + nilai stok + nilai stok mentah - pengeluaran'
    },
    {
      title: 'Pendapatan',
      value: formatCurrency(dashboardData.metrics.allTimeRevenue), // Assuming this refers to total revenue
      icon: 'BarChart',
      color: 'success',
      description: 'Total pendapatan dari semua transaksi'
    },
    {
      title: 'Modal Akhir Saat Ini',
      value: formatCurrency(dashboardData.metrics.initialCapital + dashboardData.metrics.allTimeRevenue - dashboardData.metrics.allTimeExpenses),
      icon: 'TrendingUp',
      color: 'success',
      description: 'Modal awal + pendapatan - pengeluaran'
    }, // Add comma here
    {
      title: 'Pengeluaran Bulan Ini',
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
      title: 'Saldo Owner',
      value: formatCurrency(dashboardData.metrics.ownerBalance),
      icon: 'Wallet', 
      color: 'success',
      description: 'Dana lapak Di Owner'
    },
    {
      title: 'Saldo Lapak',
      value: formatCurrency(dashboardData.metrics.lapakBalance),
      icon: 'Wallet',
      color: 'info',
      description: 'Total dana tersedia untuk operasional lapak'
    },
    {
      title: 'Keuntungan Kotor',
      value: formatCurrency(dashboardData.metrics.netProfit),
      icon: 'DollarSign',
      color: 'accent',
      description: 'Pendapatan - pengeluaran + nilai stok menu + nilai stok mentah'
    },
    {
      title: 'Total Pendapatan (Semua Waktu)',
      value: formatCurrency(dashboardData.metrics.allTimeRevenue),
      icon: 'TrendingUp',
      color: 'success',
      description: 'Total pendapatan sejak modal awal diatur'
    },
    {
      title: 'Total Pengeluaran (Semua Waktu)',
      value: formatCurrency(dashboardData.metrics.allTimeExpenses),
      icon: 'TrendingDown',
      color: 'destructive',
      description: 'Total pengeluaran sejak modal awal diatur'
    },
    {
      title: 'Total Laba Bersih (Semua Waktu)',
      value: formatCurrency(dashboardData.metrics.allTimeNetProfit),
      icon: 'BarChart',
      color: 'accent',
      description: 'Total laba/rugi sejak modal awal diatur'
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && <NavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle} />}
      <div className={`${theme === 'default' ? 'pt-16' : ''}`}>
        <DashboardMetricsBar metrics={dashboardData.dashboardMetrics} />
        <main className="pb-20 lg:pb-8">
          <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6" : ""}>
            {/* Header Section */}
            <div className="mb-6">
              <BreadcrumbNavigation />
              <div className="flex items-center justify-between mt-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                    Dashboard
                  </h1>
                  {/* <p className="text-text-secondary mt-1">
                    Selamat datang! Kelola warung Anda dengan mudah
                  </p> */}
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

            {/* Data Sync Status Section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Status Sinkronisasi Data
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Card: Menu Stock */}
                <div className="bg-card border border-border rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Icon name="BookUser" size={20} className="text-primary" />
                    </div>
                    <h3 className="font-semibold text-text-primary">Stok Menu</h3>
                  </div>
                   <p className="text-xs text-text-secondary">Terakhir diperbarui:</p>
                  <p className="text-sm font-medium text-text-primary">
                    {dashboardData.timestamps?.menuStock 
                      ? new Date(dashboardData.timestamps.menuStock).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Belum pernah'}
                  </p>
                </div>

                {/* Status Card: Raw Materials */}
                <div className="bg-card border border-border rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-2 bg-success/10 rounded-md">
                      <Icon name="Package" size={20} className="text-success" />
                    </div>
                    <h3 className="font-semibold text-text-primary">Bahan Baku</h3>
                  </div>
                   <p className="text-xs text-text-secondary">Terakhir diperbarui:</p>
                  <p className="text-sm font-medium text-text-primary">
                    {dashboardData.timestamps?.rawMaterials
                      ? new Date(dashboardData.timestamps.rawMaterials).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Belum pernah'}
                  </p>
                </div>

                {/* Status Card: Lapak Funds */}
                <div className="bg-card border border-border rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-2 bg-accent/10 rounded-md">
                      <Icon name="Wallet" size={20} className="text-accent" />
                    </div>
                    <h3 className="font-semibold text-text-primary">Uang Lapak</h3>
                  </div>
                   <p className="text-xs text-text-secondary">Terakhir diperbarui:</p>
                  <p className="text-sm font-medium text-text-primary">
                    {dashboardData.timestamps?.lapakFunds
                      ? new Date(dashboardData.timestamps.lapakFunds).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Belum pernah'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-center items-center">
              {/* <DarkModeToggle /> */}
              <p className="mt-2 text-sm text-text-secondary">Website App ini di buat oleh M Alfin Firdaus</p>
            </div>
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default MainDashboard;