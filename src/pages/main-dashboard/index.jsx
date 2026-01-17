import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import StockAlertBanner from '../../components/StockAlertBanner';

const apiUrl = import.meta.env.VITE_API_URL;

import { useTheme } from '../../contexts/ThemeContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useDarkMode } from '../../contexts/DarkModeContext';

const MainDashboard = ({ headerTitle }) => {
  const { theme } = useTheme();
  const { appMode } = useAppSettings();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [filterType, setFilterType] = useState('monthly'); // Options: 'this_week', 'monthly', 'yearly', 'all_time', 'custom'
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [showDetails, setShowDetails] = useState(false);

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
          settings: {},
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
        settings: {},
        metrics: { totalRevenue: 0, totalExpenses: 0, stockValue: 0, netProfit: 0, workingCapital: 0, allTimeRevenue: 0, allTimeExpenses: 0, allTimeNetProfit: 0, ownerBalance: 0, lapakBalance: 0, rawMaterialStockValue: 0 }, // Ensure all metrics are initialized
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

  const navigationItems = [
    { label: 'Dashboard', path: '/main-dashboard', icon: 'LayoutDashboard' },
    { label: 'Penjualan', path: appMode === 'simple' ? '/transaksi-sederhana' : '/transaksi', icon: 'ShoppingCart' },
    { label: 'Menu', path: '/menu-management', icon: 'UtensilsCrossed' },
    { label: 'Pengeluaran', path: '/expense-tracking', icon: 'Receipt' },
    { label: 'Transaksi', path: '/transaction-history', icon: 'ListOrdered' },
    { label: 'Catatan', path: '/notes', icon: 'Notebook' },
    { label: 'Profil', path: '/profile', icon: 'User' },
    { label: 'Pengaturan', path: '/settings', icon: 'Settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    if (path === '/main-dashboard') {
      return location.pathname === '/' || location.pathname === '/main-dashboard';
    }
    return location.pathname.startsWith(path === '/transaksi-sederhana' ? '/transaksi-sederhana' : path);
  };

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

    // --- last_closing_date Clamping ---
    const lastClosingDateStr = settings?.last_closing_date;
    if (lastClosingDateStr && filterType !== 'all_time') {
      const lastClosingDate = new Date(lastClosingDateStr);
      if (startDate < lastClosingDate) {
        startDate = lastClosingDate;
      }
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
    const initialCapital = parseFloat(settings?.initial_capital) || 0;

    // Use ALL transactions and expenses regardless of initial capital date
    const allTimeTransactions = allTransactions;
    const allTimeExpensesData = expenses;

    const allTimeRevenue = allTimeTransactions
      .filter(t => t.payment_method !== 'employee_meal')
      .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

    const allTimeExpenses = allTimeExpensesData.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const allTimeNetProfit = allTimeRevenue - allTimeExpenses;

    const totalMenuStockValue = menuItems.reduce((sum, i) => sum + (i.stock * parseFloat(i.price || 0)), 0);

    const rawMaterialStockValue = rawMaterialsData.reduce((sum, m) => {
      // Find unit definition to check if calculable
      const unitDef = unitsData.find(u => u.name.toLowerCase() === (m.unit || '').toLowerCase());
      // Default to true if not found, or use the flag.
      // Note: boolean in DB might be returned as 0/1 number.
      const isCalculable = unitDef ? (unitDef.is_calculable === 1 || unitDef.is_calculable === true) : true;

      const currentStock = parseFloat(m.current_stock || 0);
      const rawStockPrice = parseFloat(m.raw_stock_price || 0);

      if (isCalculable) {
        return sum + (currentStock * rawStockPrice);
      } else {
        // Non-calculable: Jangan dikalikan stok (sesuai request user untuk gram), tapi pastikan stok > 0 agar tidak sisa nilai saat kosong
        return sum + (currentStock > 0 ? rawStockPrice : 0);
      }
    }, 0);

    const totalCombinedRawMaterialValue = rawMaterialsData.reduce((sum, m) => {
      const unitDef = unitsData.find(u => u.name.toLowerCase() === (m.unit || '').toLowerCase());
      const isCalculable = unitDef ? (unitDef.is_calculable === 1 || unitDef.is_calculable === true) : true;

      const currentStock = parseFloat(m.current_stock || 0);
      const menuStock = parseFloat(m.menu_stock || 0);
      const pricePerItem = parseFloat(m.price_per_item || 0);
      const rawStockPrice = parseFloat(m.raw_stock_price || 0);

      if (isCalculable) {
        const menuStockValue = menuStock * pricePerItem;
        const rawStockValue = currentStock * rawStockPrice;
        return sum + menuStockValue + rawStockValue;
      } else {
        // Non-calculable: Harga menu diambil jika menu_stock > 0, harga mentah diambil jika current_stock > 0
        const menuStockValue = menuStock > 0 ? pricePerItem : 0;
        const rawStockValue = currentStock > 0 ? rawStockPrice : 0;
        return sum + menuStockValue + rawStockValue;
      }
    }, 0);

    const stockValue = totalCombinedRawMaterialValue || 0;
    let workingCapital = 0;
    if (!isNaN(initialCapital)) {
      // Formula: Modal Awal + Total Pendapatan + Total Stok - Total Pengeluaran
      workingCapital = (initialCapital || 0) + (allTimeRevenue || 0) + (totalCombinedRawMaterialValue || 0) - (allTimeExpenses || 0);
    }
    if (isNaN(workingCapital)) workingCapital = 0;

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



    const todayExpenses = expenses.filter(e => new Date(e.date).toDateString() === todayString).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    setDashboardData({
      metrics: {
        // Filtered Metrics
        totalRevenue,
        totalExpenses,
        todayExpenses,
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
        todayExpenses: { value: formatCurrency(todayExpenses) },
        totalTransactions: { value: todayTransactions.length.toString(), change: transChangeFormatted, trend: transTrend },
        averageOrder: { value: formatCurrency(averageOrderToday), change: avgOrderChangeFormatted, trend: avgOrderTrend },
        lowStock: { value: lowStockItems.toString(), change: '', trend: 'down' }
      },
      timestamps: {
        menuStock: settings?.menu_stock_last_updated,
        rawMaterials: settings?.raw_materials_last_updated,
        lapakFunds: settings?.lapak_funds_last_updated
      },
      settings: settings || {}
    });
  };
  const formatCurrency = (amount) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(value);
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
      route: '/transaksi',
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
      route: '/laporan',
      color: 'secondary'
    },
    {
      title: 'Statistik V2',
      description: 'Dashboard analisis modern',
      icon: 'BarChart3',
      route: '/dashboard-v2',
      color: 'primary'
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
    },
    {
      title: 'Semua Layanan',
      description: 'Lihat seluruh fitur website',
      icon: 'LayoutGrid',
      route: '/all-features',
      color: 'info'
    },
    {
      title: 'AI Assistant',
      description: 'Chat dengan BerkahBot',
      icon: 'Bot',
      route: '/chatbot',
      color: 'accent'
    }
  ];

  // --- Main Metrics (Always Visible) ---
  const monthlyProfit = (dashboardData.metrics?.totalRevenue || 0) - (dashboardData.metrics?.totalExpenses || 0);
  const isClosingActive = Boolean(dashboardData.settings?.last_closing_date);
  const periodLabel = isClosingActive ? 'Periode Ini' : 'Bulan Ini';

  // Metrics untuk Mode Sederhana (fokus pada data harian)
  const todaySalesValue = dashboardData.dashboardMetrics?.todaySales?.value || 0;

  const simpleMetrics = [
    {
      title: 'Penjualan Hari Ini',
      value: todaySalesValue,
      icon: 'TrendingUp',
      color: 'success',
      description: 'Total penjualan hari ini'
    },
    {
      title: `Pendapatan ${periodLabel}`,
      value: formatCurrency(dashboardData.metrics.totalRevenue),
      icon: 'BarChart',
      color: 'info',
      description: `Total pendapatan ${periodLabel.toLowerCase()}`
    },
    {
      title: `Pengeluaran ${periodLabel}`,
      value: formatCurrency(dashboardData.metrics.totalExpenses),
      icon: 'FileText',
      color: 'danger',
      description: `Total pengeluaran ${periodLabel.toLowerCase()}`
    },
    {
      title: `Laba ${periodLabel}`,
      value: formatCurrency(monthlyProfit),
      icon: 'DollarSign',
      color: 'accent',
      description: `Pendapatan - Pengeluaran ${periodLabel.toLowerCase()}`
    }
  ];

  // Metrics untuk Mode Lengkap (data lebih detail)
  const mainMetrics = [
    {
      title: 'Saldo Lapak',
      value: formatCurrency(dashboardData.metrics.lapakBalance),
      icon: 'Wallet',
      color: 'info',
      description: 'Total dana tersedia untuk operasional lapak'
    },
    {
      title: `Pendapatan ${periodLabel}`,
      value: formatCurrency(dashboardData.metrics.totalRevenue),
      icon: 'BarChart',
      color: 'success',
      description: `Total pendapatan ${periodLabel.toLowerCase()}`
    },
    {
      title: `Pengeluaran ${periodLabel}`,
      value: formatCurrency(dashboardData.metrics.totalExpenses),
      icon: 'Receipt',
      color: 'warning',
      description: `Operasional & pembelian ${periodLabel.toLowerCase()}`
    },
    {
      title: `Laba Bersih ${periodLabel}`,
      value: formatCurrency(monthlyProfit),
      icon: 'TrendingUp', // Use TrendingUp for profit
      color: 'accent', // Distinct color
      description: `Pendapatan - Pengeluaran ${periodLabel.toLowerCase()}`
    }
  ];


  // --- Detailed Metrics (Hidden by default) ---

  const detailedMetrics = [
    {
      title: 'Modal Awal',
      value: formatCurrency(dashboardData.metrics.initialCapital),
      icon: 'PiggyBank',
      color: 'primary',
      description: 'Jumlah modal awal yang disetor'
    },
    {
      title: 'Modal Berjalan',
      value: formatCurrency(dashboardData.metrics.workingCapital),
      icon: 'Wallet',
      color: 'info',
      description: 'Modal awal + total pendapatan + total stok (menu dan mentah) - total pengeluaran'
    },
    {
      title: 'Modal Akhir Saat Ini',
      value: formatCurrency((parseFloat(dashboardData.metrics.ownerBalance) || 0) + (parseFloat(dashboardData.metrics.lapakBalance) || 0)),
      icon: 'TrendingUp',
      color: 'success',
      description: 'Saldo owner + saldo lapak'
    },
    {
      title: 'Total Nilai Stok (Bahan & Menu)',
      value: formatCurrency(dashboardData.metrics.totalCombinedRawMaterialValue),
      icon: 'Package',
      color: 'primary',
      description: 'Modal yang sedang berbentuk barang (stok)'
    },
    {
      title: 'Saldo Owner',
      value: formatCurrency(dashboardData.metrics.ownerBalance),
      icon: 'Wallet',
      color: 'success',
      description: 'Dana lapak Di Owner'
    },
    // "Keuntungan Kotor" (Equity) - kept as secondary
    {
      title: 'Kekayaan Bisnis (Equity)',
      value: formatCurrency((parseFloat(dashboardData.metrics.initialCapital) || 0) + (parseFloat(dashboardData.metrics.allTimeNetProfit) || 0)),
      icon: 'ShieldCheck',
      color: 'accent',
      description: 'Modal Awal + Laba Bersih (Target Kekayaan)'
    },
    {
      title: 'Total Pendapatan (Semua Waktu)',
      value: formatCurrency(dashboardData.metrics.allTimeRevenue),
      icon: 'TrendingUp',
      color: 'success',
      description: 'Total seluruh pendapatan yang tercatat'
    },
    {
      title: 'Total Pengeluaran (Semua Waktu)',
      value: formatCurrency(dashboardData.metrics.allTimeExpenses),
      icon: 'TrendingDown',
      color: 'destructive',
      description: 'Total seluruh pengeluaran yang tercatat'
    },
    {
      title: 'Total Laba Bersih (Semua Waktu)',
      value: formatCurrency(dashboardData.metrics.allTimeNetProfit),
      icon: 'BarChart',
      color: 'accent',
      description: 'Total seluruh laba/rugi yang tercatat'
    },
    // Dynamic logic for 'Selisih Perhitungan'
    (() => {
      const currentPhysicalCash = (parseFloat(dashboardData.metrics.ownerBalance) || 0) + (parseFloat(dashboardData.metrics.lapakBalance) || 0);
      const initialCapital = parseFloat(dashboardData.metrics.initialCapital) || 0;
      const totalRevenue = parseFloat(dashboardData.metrics.allTimeRevenue) || 0;
      const totalExpenses = parseFloat(dashboardData.metrics.allTimeExpenses) || 0;

      // Rumus: Modal Akhir - (Modal Awal + Pendapatan - Pengeluaran)
      const expectedCash = initialCapital + totalRevenue - totalExpenses;
      const diff = currentPhysicalCash - expectedCash;

      let color = 'success';
      let icon = 'CheckCircle';
      let valueText = 'Data Akurat (Pas)';

      if (diff > 100) {
        color = 'info';
        icon = 'TrendingUp';
        valueText = `+ ${formatCurrency(diff)} (Uang Lebih)`;
      } else if (diff < -100) {
        color = 'destructive';
        icon = 'AlertCircle';
        valueText = `${formatCurrency(diff)} (Uang Kurang)`;
      }

      return {
        title: 'Selisih Perhitungan (Audit)',
        value: valueText,
        icon: icon,
        color: color,
        description: 'Modal Akhir - (Modal Awal + Pendapatan - Pengeluaran)'
      };
    })()
  ];

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50 dark:bg-slate-950' : 'bg-transparent'}`}>
      {theme === 'default' && (
        <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} hideMobileHeader={true} />
      )}

      {/* --- MOBILE DANA-STYLE UI (lg:hidden) --- */}
      <div className="lg:hidden flex flex-col pb-24">
        {/* Dana Blue Header */}
        <header className={`bg-[#118eea] dark:bg-slate-900 text-white px-5 pt-8 pb-16 shadow-xl relative transition-all duration-300 ${isMobileMenuOpen ? 'z-50' : 'z-20'}`}>
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
          </div>

          {/* Top Bar */}
          <div className="flex justify-between items-center mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl bg-white/20 dark:bg-slate-800/40 backdrop-blur-md border border-white/30 dark:border-slate-700/50 flex items-center justify-center shadow-inner cursor-pointer active:scale-95 transition-transform"
                onClick={() => navigate('/profile')}
              >
                <Icon name="User" size={24} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-100 dark:text-blue-200/60 uppercase tracking-widest leading-none mb-1.5 opacity-80">Kasir Berkah 88</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">{dashboardData.settings?.restaurant_name || 'Beranda'}</h2>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <div className="p-2 active:bg-white/10 rounded-full transition-colors" onClick={toggleDarkMode}>
                <Icon name={isDarkMode ? "Sun" : "Moon"} size={24} />
              </div>
              <div className="p-2 active:bg-white/10 rounded-full transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={24} />
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu (Overlay) */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop Blur Overlay */}
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden animate-in fade-in duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              ></div>
              <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 rounded-none mx-4 mt-2 overflow-hidden z-50">
                <nav className="p-4 grid grid-cols-3 gap-4">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${isActiveRoute(item.path)
                        ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <div className={`p-2 rounded-xl ${isActiveRoute(item.path) ? 'bg-blue-600/10' : 'bg-gray-100 dark:bg-slate-800'}`}>
                        <Icon name={item.icon} size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                    </Link>
                  ))}
                </nav>
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <button
                    onClick={() => {
                      navigate('/all-features');
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"
                  >
                    <Icon name="LayoutGrid" size={14} /> Semua Fitur
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2"
                  >
                    <Icon name="LogOut" size={14} /> Keluar
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Main Action Grid (Icon + Label) */}
          <div className="grid grid-cols-4 gap-4 relative z-10">
            <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate(appMode === 'simple' ? '/transaksi-sederhana' : '/transaksi')}>
              <div className="w-full aspect-square bg-white/20 dark:bg-slate-800/40 rounded-[1.25rem] border border-white/20 dark:border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                <Icon name="QrCode" size={32} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-tight text-white/90 dark:text-gray-300">Pindai</span>
            </div>
            <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate('/admin-uang-bisnis')}>
              <div className="w-full aspect-square bg-white/20 dark:bg-slate-800/40 rounded-[1.25rem] border border-white/20 dark:border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                <Icon name="Wallet" size={32} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-tight text-white/90 dark:text-gray-300">Saldo</span>
            </div>
            <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate('/laporan')}>
              <div className="w-full aspect-square bg-white/20 dark:bg-slate-800/40 rounded-[1.25rem] border border-white/20 dark:border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                <Icon name="FileText" size={32} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-tight text-white/90 dark:text-gray-300">Laporan</span>
            </div>
            <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate('/auditor')}>
              <div className="w-full aspect-square bg-white/20 dark:bg-slate-800/40 rounded-[1.25rem] border border-white/20 dark:border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                <Icon name="SearchCheck" size={32} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-tight text-white/90 dark:text-gray-300">Audit</span>
            </div>
          </div>
        </header>

        {/* Floating Balance Card */}
        <section className="px-5 -mt-8 relative z-20">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-900/10 dark:shadow-none border border-blue-50/50 dark:border-slate-700">
            {/* Header Row: Label & Status */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 tracking-[0.25em] uppercase">Total Kas Lapak</p>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-emerald-100/50 dark:shadow-none">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                Terpantau
              </div>
            </div>

            {/* Balance Row */}
            <div className="flex items-center gap-3 cursor-pointer group mb-8" onClick={() => navigate('/lapak-deposit')}>
              <h3 className="text-[2.5rem] font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                {formatCurrency(dashboardData.metrics?.lapakBalance || 0)}
              </h3>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-active:translate-x-1 transition-transform border border-blue-100/30 dark:border-blue-700/30">
                <Icon name="ChevronRight" size={16} className="text-blue-500" />
              </div>
            </div>

            <div className="h-[1px] bg-gray-50 dark:bg-slate-700 w-full mb-8"></div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Omzet {periodLabel}</span>
                <span className="text-base font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(dashboardData.metrics?.totalRevenue || 0)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Keluar {periodLabel}</span>
                <span className="text-base font-black text-rose-500 tracking-tight">-{formatCurrency(dashboardData.metrics?.totalExpenses || 0)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid (Dana Look) */}
        <section className="mt-10 px-5">
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tighter uppercase">Layanan Kasir</h3>
            <span className="text-[11px] font-bold text-[#118eea] cursor-pointer" onClick={() => navigate('/all-features')}>
              Lihat Semua
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none grid grid-cols-4 gap-y-10 border border-transparent dark:border-slate-700">
            {quickActions.slice(0, 8).map((action, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-3 group"
                onClick={() => navigate(action.route)}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-active:scale-90 ${action.color === 'primary' ? 'bg-blue-50 text-blue-600' :
                  action.color === 'success' ? 'bg-emerald-50 text-emerald-600' :
                    action.color === 'destructive' ? 'bg-rose-50 text-rose-600' :
                      'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  } border border-current/5`}>
                  <Icon name={action.icon} size={24} />
                </div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 text-center leading-tight">
                  {action.title.split(' ').length > 1 ? action.title.split(' ')[0] : action.title}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity Feed */}
        <section className="mt-10 px-5">
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tighter uppercase">Aktivitas Terkini</h3>
            <span className="text-[11px] font-bold text-[#118eea]" onClick={handleViewAllTransactions}>Tampilkan Semua</span>
          </div>

          <div className="space-y-4">
            {dashboardData.recentTransactions.length > 0 ? (
              dashboardData.recentTransactions.slice(0, 5).map((tx, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] flex items-center gap-5 shadow-sm border border-gray-100 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-700 transition-all duration-200"
                  onClick={() => navigate('/transaction-history', { state: { openTransaction: tx.id } })}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${tx.payment_method === 'cash' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    } border border-current/5`}>
                    <Icon name={tx.payment_method === 'cash' ? 'Banknote' : 'CreditCard'} size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1.5">Pesanan #{tx.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                      {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {tx.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-emerald-500 tracking-tighter">+{formatCurrency(tx.total)}</p>
                    <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">Success</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] py-12 text-center border-2 border-dashed border-gray-100 dark:border-slate-700">
                <Icon name="Inbox" size={40} className="mx-auto text-gray-200 dark:text-slate-600 mb-3" />
                <p className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </section>

        {/* Promo / Banner dana style */}
        <section className="mt-10 px-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stok Menu Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 shadow-lg shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                  <Icon name="BookUser" className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Stok Menu</h3>
                  <p className="text-[10px] text-blue-100 font-medium">Data stok tersedia</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 relative z-10">
                <p className="text-[10px] text-blue-200 font-medium mb-0.5">Terakhir diperbarui</p>
                <p className="text-xs font-bold text-white">14 Januari 2026 pukul 16.45</p>
              </div>
            </div>

            {/* Bahan Baku Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 shadow-lg shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                  <Icon name="Package" className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Bahan Baku</h3>
                  <p className="text-[10px] text-blue-100 font-medium">Stok mentah aman</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 relative z-10">
                <p className="text-[10px] text-blue-200 font-medium mb-0.5">Terakhir diperbarui</p>
                <p className="text-xs font-bold text-white">14 Januari 2026 pukul 16.45</p>
              </div>
            </div>

            {/* Uang Lapak Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 shadow-lg shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                  <Icon name="Wallet" className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Uang Lapak</h3>
                  <p className="text-[10px] text-blue-100 font-medium">Saldo kas tercatat</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 relative z-10">
                <p className="text-[10px] text-blue-200 font-medium mb-0.5">Terakhir diperbarui</p>
                <p className="text-xs font-bold text-white">14 Januari 2026 pukul 16.45</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Credit Mobile */}
        <div className="text-center opacity-30 px-5 mb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.4em]">Website App ini di buat oleh M Alfin Firdaus</p>
        </div>
      </div>

      {/* --- DESKTOP VIEW (lg:block hidden) --- */}
      <div className={`hidden lg:block ${theme === 'default' ? 'lg:pt-16' : ''}`}>
        <DashboardMetricsBar metrics={dashboardData.dashboardMetrics} />
        <main className="pb-20 lg:pb-8">
          <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6" : ""}>
            {/* Stock Alert Banner */}
            <StockAlertBanner />

            {/* Header Section */}
            <div className="mb-6">
              <BreadcrumbNavigation />
              <div className="flex items-center justify-between mt-4 flex-wrap gap-y-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-text-primary uppercase tracking-tighter">
                    Dashboard
                  </h1>
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
                        <span className="text-text-secondary px-1 text-xs">ke</span>
                        <input
                          type="date"
                          value={customDateRange.end}
                          onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                          className="bg-card border-border text-text-primary text-sm rounded-md focus:ring-primary focus:border-primary p-2"
                        />
                      </>
                    )}
                  </div>
                  <div className="hidden lg:block">
                    <Button
                      variant="primary"
                      iconName="Plus"
                      iconPosition="left"
                      onClick={() => navigate(appMode === 'simple' ? '/transaksi-sederhana' : '/transaksi')}
                    >
                      Transaksi Baru
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
              {detailedMetrics.map((metric, index) => (
                <MetricsCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  icon={metric.icon}
                  color={metric.color}
                  description={metric.description}
                  trend={metric.trend}
                  change={metric.change}
                />
              ))}
            </div>
            {/* Quick Actions Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter">Aksi Cepat</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
            </section>

            {/* Split Grid: Recent Trans (Left) & Business Summary (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section>

                  <RecentTransactionsList
                    transactions={dashboardData.recentTransactions}
                    onViewAll={handleViewAllTransactions}
                  />
                </section>
              </div>

              <div className="space-y-8">
                <BusinessSummaryCard data={dashboardData} todayStats={dashboardData.todayStats} />
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-center items-center opacity-30">
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.5em]">Di buat oleh M Alfin Firdaus</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainDashboard;
