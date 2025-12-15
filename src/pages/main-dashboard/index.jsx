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
  const [filterType, setFilterType] = useState('monthly'); // Options: 'this_week', 'monthly', 'yearly', 'all_time', 'custom'
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const fetchData = async (currentUserRole) => { // Add currentUserRole parameter
    const token = localStorage.getItem('token');
    if (!token) return; // Exit if no token
    try {
      const [paginatedTransRes, allTransRes, menuRes, expenseRes, settingsRes, ownerAccountRes, lapakAccountRes, rawMaterialsRes, unitsRes] = await Promise.all([
        authFetch(`${apiUrl}/api/transactions`), // This fetches paginated transactions (default limit 20)
        authFetch(`${apiUrl}/api/transactions/all`), // Fetch all transactions for all-time metrics
        authFetch(`${apiUrl}/api/menu-items/all`),
        authFetch(`${apiUrl}/api/expenses/all`), // Fetch all expenses
        authFetch(`${apiUrl}/api/all-settings`),
        authFetch(`${apiUrl}/api/accounts/owner_deposit`),
        authFetch(`${apiUrl}/api/accounts/lapak_deposit`),
        authFetch(`${apiUrl}/api/raw-materials`), // Fetch raw materials
        authFetch(`${apiUrl}/api/units`) // Fetch units
      ]);

      let paginatedTransactionsData = [];
      let allTransactionsData = [];
      let menuItemsData = [];
      let expensesData = [];
      let settingsData = {};
      let ownerAccountData = null;
      let lapakAccountData = null;
      let rawMaterialsData = []; // Initialize rawMaterialsData
      let unitsData = []; // Initialize unitsData

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

      // Handle units data
      if (unitsRes.ok) {
        const units = await unitsRes.json();
        if (unitsRes.ok && units.message === 'success') {
          unitsData = units.data;
        }
      } else {
        console.error("Failed to fetch units data:", unitsRes.status, unitsRes.statusText);
      }




      // Process data if menu items are available (always expected)
      // and other data is fetched (or empty if not available)
      if (menuItemsData.length > 0 || paginatedTransactionsData.length > 0 || allTransactionsData.length > 0 || expensesData.length > 0 || rawMaterialsData.length > 0) {
        processDashboardData(paginatedTransactionsData, allTransactionsData, menuItemsData, expensesData, settingsData, ownerAccountData, lapakAccountData, rawMaterialsData, unitsData);
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
  }, [filterType, customDateRange]); // Re-fetch and process data when filter changes

  const processDashboardData = (paginatedTransactions, allTransactions, menuItems, expenses, settings, ownerAccountData, lapakAccountData, rawMaterialsData, unitsData = []) => {
    // --- Date and Filter Logic ---
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    let startDate, endDate;

    switch (filterType) {
      case 'this_week':
        startDate = new Date(now);
        const firstDayOfWeek = now.getDate() - now.getDay(); // Sunday
        startDate.setDate(firstDayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Saturday
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1); // Start of year
        endDate = new Date(now.getFullYear(), 11, 31); // End of year
        break;
      case 'custom':
        // The date from input is 'YYYY-MM-DD'. new Date() will treat it as UTC midnight.
        // To avoid timezone issues, we construct the date carefully.
        const startParts = customDateRange.start.split('-').map(Number);
        const endParts = customDateRange.end.split('-').map(Number);
        startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
        break;
      case 'all_time':
        // No date filtering needed, handled below
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of month
        break;
    }

    // Set time to beginning and end of day for accurate filtering on all types except all_time
    if (filterType !== 'all_time') {
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
    }

    const filteredTransactions = filterType === 'all_time'
      ? allTransactions
      : allTransactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

    const filteredExpenses = filterType === 'all_time'
      ? expenses
      : expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });

    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayString = today.toDateString();
    const yesterdayString = yesterday.toDateString();

    // --- All-Time & Working Capital Metrics (Unaffected by filter) ---
    const initialCapital = parseFloat(settings?.initial_capital || 0);
    const allTimeRevenue = allTransactions
      .filter(t => t.payment_method !== 'employee_meal')
      .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    const allTimeExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const allTimeNetProfit = allTimeRevenue - allTimeExpenses;
    const totalMenuStockValue = menuItems.reduce((sum, i) => sum + (i.stock * parseFloat(i.price || 0)), 0);

    const rawMaterialStockValue = rawMaterialsData.reduce((sum, m) => {
      // Find unit definition to check if calculable
      const unitDef = unitsData.find(u => u.name.toLowerCase() === (m.unit || '').toLowerCase());
      // Default to true if not found, or use the flag.
      // Note: boolean in DB might be returned as 0/1 number.
      const isCalculable = unitDef ? (unitDef.is_calculable === 1 || unitDef.is_calculable === true) : true;

      if (isCalculable) {
        const currentStock = parseInt(m.current_stock || 0);
        const rawStockPrice = parseFloat(m.raw_stock_price || 0);
        return sum + (currentStock * rawStockPrice);
      } else {
        // For non-calculable units, use raw_stock_price directly
        return sum + parseFloat(m.raw_stock_price || 0);
      }
    }, 0);

    const totalCombinedRawMaterialValue = rawMaterialsData.reduce((sum, m) => {
      const unitDef = unitsData.find(u => u.name.toLowerCase() === (m.unit || '').toLowerCase());
      const isCalculable = unitDef ? (unitDef.is_calculable === 1 || unitDef.is_calculable === true) : true;

      if (isCalculable) {
        const menuStockValue = parseInt(m.menu_stock || 0) * parseFloat(m.price_per_item || 0);
        const rawStockValue = parseInt(m.current_stock || 0) * parseFloat(m.raw_stock_price || 0);
        return sum + menuStockValue + rawStockValue;
      } else {
        // For non-calculable units, use prices directly
        const menuStockValue = parseFloat(m.price_per_item || 0);
        const rawStockValue = parseFloat(m.raw_stock_price || 0);
        return sum + menuStockValue + rawStockValue;
      }
    }, 0);

    const stockValue = totalCombinedRawMaterialValue; let workingCapital = 0;
    if (!isNaN(initialCapital)) {
      workingCapital = initialCapital + allTimeRevenue + totalCombinedRawMaterialValue - allTimeExpenses;
    }

    // --- Metrics for Filtered Period ---
    const totalRevenue = filteredTransactions
      .filter(t => t.payment_method !== 'employee_meal')
      .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // Corrected "Keuntungan Kotor" calculation to use all-time figures for consistency
    const netProfit = allTimeRevenue - allTimeExpenses + totalCombinedRawMaterialValue;

    // --- Daily Stats Calculation (Unaffected by filter) ---
    const todayTransactions = allTransactions.filter(t => new Date(t.timestamp).toDateString() === todayString && t.payment_method !== 'employee_meal');
    const todaySales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    const averageOrderToday = todayTransactions.length > 0 ? todaySales / todayTransactions.length : 0;

    const yesterdayTransactions = allTransactions.filter(t => new Date(t.timestamp).toDateString() === yesterdayString && t.payment_method !== 'employee_meal');
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
        // Filtered Metrics
        totalRevenue,
        totalExpenses,
        // All-Time / Unfiltered Metrics
        netProfit, // This is the "Keuntungan Kotor" metric
        workingCapital,
        allTimeRevenue,
        allTimeExpenses,
        allTimeNetProfit,
        initialCapital,
        // Other
        stockValue, // Now correctly reflects totalCombinedRawMaterialValue
        rawMaterialStockValue, // Add raw material stock value (current stock only)
        totalCombinedRawMaterialValue, // Add total combined value (current + menu stock)
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
      value: formatCurrency(dashboardData.metrics.totalRevenue), // Monthly revenue
      icon: 'BarChart',
      color: 'success',
      description: 'Total pendapatan bulan ini'
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
      title: 'Total Nilai Stok (Mentah + Menu)',
      value: formatCurrency(dashboardData.metrics.totalCombinedRawMaterialValue),
      icon: 'DollarSign',
      color: 'primary',
      description: 'Nilai total stok bahan mentah dan stok menu'
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
      description: 'Total pendapatan (semua waktu) - total pengeluaran (semua waktu) + nilai stok menu + nilai stok mentah'
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
      {theme === 'default' && <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} />}
      <div className={`${theme === 'default' ? 'pt-16' : ''}`}>
        <DashboardMetricsBar metrics={dashboardData.dashboardMetrics} />
        <main className="pb-20 lg:pb-8">
          <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6" : ""}>
            {/* Header Section */}
            <div className="mb-6">
              <BreadcrumbNavigation />
              <div className="flex items-center justify-between mt-4 flex-wrap gap-y-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                    Dashboard
                  </h1>
                  {/* <p className="text-text-secondary mt-1">
                    Selamat datang! Kelola warung Anda dengan mudah
                  </p> */}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {/* New Filter Section */}
                  <div className="flex items-center gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-card border-border text-text-primary text-sm rounded-md focus:ring-primary focus:border-primary p-2"
                    >
                      <option value="this_week">Minggu Ini</option>
                      <option value="monthly">Bulan Ini</option>
                      <option value="yearly">Tahun Ini</option>
                      <option value="all_time">Semua Waktu</option>
                      <option value="custom">Kustom</option>
                    </select>
                    {filterType === 'custom' && (
                      <>
                        <input
                          type="date"
                          value={customDateRange.start}
                          onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                          className="bg-card border-border text-text-primary text-sm rounded-md focus:ring-primary focus:border-primary p-2"
                        />
                        <span className="text-text-secondary">to</span>
                        <input
                          type="date"
                          value={customDateRange.end}
                          onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                          className="bg-card border-border text-text-primary text-sm rounded-md focus:ring-primary focus:border-primary p-2"
                        />
                      </>
                    )}
                  </div>
                  {/* End New Filter Section */}
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
}; export default MainDashboard;
