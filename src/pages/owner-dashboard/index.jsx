import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import MetricsCard from '../main-dashboard/components/MetricsCard';
import QuickActionCard from '../main-dashboard/components/QuickActionCard';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import authFetch from '../../utils/authFetch';
import Icon from '../../components/AppIcon';
import StockAlertBanner from '../../components/StockAlertBanner';
import OwnerMotivationalModal from '../../components/ui/OwnerMotivationalModal';
import { useDarkMode } from '../../contexts/DarkModeContext';
import NotificationBell from '../../components/ui/NotificationBell';

const apiUrl = import.meta.env.VITE_API_URL;

const OwnerDashboard = ({ headerTitle }) => {
    const { theme } = useTheme();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [showStickyHeader, setShowStickyHeader] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowStickyHeader(window.scrollY > 80);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navigationItems = [
        { label: 'Beranda', path: '/owner-dashboard', icon: 'LayoutDashboard' },
        { label: 'Uang Bisnis', path: '/uang-bisnis', icon: 'Wallet' },
        { label: 'Analisis', path: '/analisis-data', icon: 'BarChart' },
        { label: 'Stok', path: '/owner-raw-material-stock', icon: 'Package' },
        { label: 'Kritis', path: '/critical-stock', icon: 'AlertTriangle' },
        { label: 'Profil', path: '/owner-profile', icon: 'User' },
    ];

    const isActiveRoute = (path) => {
        if (path === '/owner-dashboard') {
            return location.pathname === '/owner-dashboard' || location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allTransRes, menuRes, expenseRes, ownerAccountRes, lapakAccountRes, rawMaterialsRes, criticalItemsRes, allSettingsRes, allMenuItemsRes, unitsRes] = await Promise.all([
                    authFetch(`${apiUrl}/api/transactions/all`),
                    authFetch(`${apiUrl}/api/menu-items/all`),
                    authFetch(`${apiUrl}/api/expenses/all`),
                    authFetch(`${apiUrl}/api/accounts/owner_deposit`),
                    authFetch(`${apiUrl}/api/accounts/lapak_deposit`),
                    authFetch(`${apiUrl}/api/raw-materials`),
                    authFetch(`${apiUrl}/api/stock-alerts/count`),
                    authFetch(`${apiUrl}/api/all-settings`),
                    authFetch(`${apiUrl}/api/menu-items/all`),
                    authFetch(`${apiUrl}/api/units`)
                ]);

                const allTransactions = allTransRes.ok ? (await allTransRes.json()).data : [];
                const menuItems = menuRes.ok ? (await menuRes.json()).data : [];
                const expenses = expenseRes.ok ? (await expenseRes.json()).data : [];
                const ownerAccountData = ownerAccountRes.ok ? (await ownerAccountRes.json()).data : { account: { balance: 0 } };
                const lapakAccountData = lapakAccountRes.ok ? (await lapakAccountRes.json()).data : { account: { balance: 0 } };
                const rawMaterials = rawMaterialsRes.ok ? (await rawMaterialsRes.json()).data : [];
                const criticalItemsCount = criticalItemsRes.ok ? (await criticalItemsRes.json()).data.low_stock_count : 0;
                const allSettings = allSettingsRes.ok ? (await allSettingsRes.json()).data : {};
                const allMenuItems = allMenuItemsRes.ok ? (await allMenuItemsRes.json()).data : [];
                const unitsData = unitsRes.ok ? (await unitsRes.json()).data : [];

                processDashboardData(allTransactions, menuItems, expenses, ownerAccountData, lapakAccountData, rawMaterials, criticalItemsCount, allSettings, allMenuItems, unitsData);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setDashboardData({}); // Set to empty object to stop loading on error
            }
        };

        fetchData();
    }, []);

    const processDashboardData = (allTransactions, menuItems, expenses, ownerAccountData, lapakAccountData, rawMaterials, criticalItemsCount, allSettings, allMenuItems, unitsData) => {
        const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const monthlyTransactions = allTransactions.filter(t => {
            const transactionDate = new Date(t.timestamp);
            return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
        });

        const totalMonthlyRevenue = monthlyTransactions
            .filter(t => t.payment_method !== 'employee_meal')
            .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

        const monthlyExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        });

        const totalMonthlyExpenses = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        const rawMaterialStockValue = rawMaterials.reduce((sum, m) => {
            const unitDef = unitsData.find(u => u.name.toLowerCase() === (m.unit || '').toLowerCase());
            const isCalculable = unitDef ? (unitDef.is_calculable === 1 || unitDef.is_calculable === true) : true;
            const currentStock = parseFloat(m.current_stock || 0);
            const rawPrice = parseFloat(m.raw_stock_price || 0);

            if (isCalculable) {
                return sum + (currentStock * rawPrice);
            } else {
                return sum + (currentStock > 0 ? rawPrice : 0);
            }
        }, 0);

        const monthlyNetProfit = totalMonthlyRevenue - totalMonthlyExpenses;

        // Lifetime calculations
        const initialCapital = parseFloat(allSettings.initial_capital || 0);
        const totalLifetimeRevenue = allTransactions
            .filter(t => t.payment_method !== 'employee_meal')
            .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
        const totalLifetimeExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const currentFinalCapital = initialCapital + totalLifetimeRevenue - totalLifetimeExpenses;

        const totalMenuItemStockValue = allMenuItems.reduce((sum, item) => sum + (parseFloat(item.stock || 0) * parseFloat(item.price || 0)), 0);

        // Value of raw materials currently in menu_stock form
        const rawStockInMenuValue = rawMaterials.reduce((sum, m) => {
            const unitDef = unitsData.find(u => u.name.toLowerCase() === (m.unit || '').toLowerCase());
            const isCalculable = unitDef ? (unitDef.is_calculable === 1 || unitDef.is_calculable === true) : true;
            const menuStock = parseFloat(m.menu_stock || 0);
            const menuPrice = parseFloat(m.price_per_item || 0);

            if (isCalculable) {
                return sum + (menuStock * menuPrice);
            } else {
                return sum + (menuStock > 0 ? menuPrice : 0);
            }
        }, 0);

        const totalCombinedStockValue = rawMaterialStockValue + rawStockInMenuValue;
        const allTimeNetProfit = totalLifetimeRevenue - totalLifetimeExpenses;

        // Formula: Modal Awal + Total Pendapatan + Total Stok - Total Pengeluaran
        const runningCapital = initialCapital + totalLifetimeRevenue + totalCombinedStockValue - totalLifetimeExpenses;


        setDashboardData({
            ownerBalance: ownerAccountData?.account?.balance || 0,
            lapakBalance: lapakAccountData?.account?.balance || 0,
            monthlyRevenue: totalMonthlyRevenue,
            monthlyExpenses: totalMonthlyExpenses,
            monthlyNetProfit: monthlyNetProfit,
            rawMaterialStockValue: rawMaterialStockValue,
            criticalItemsCount: criticalItemsCount,
            currentFinalCapital: currentFinalCapital,
            initialCapital: initialCapital,
            runningCapital: runningCapital,
            allTimeRevenue: totalLifetimeRevenue,
            allTimeExpenses: totalLifetimeExpenses,
            allTimeNetProfit: allTimeNetProfit,
            totalCombinedStockValue: totalCombinedStockValue,
            timestamps: {
                menuStock: allSettings?.menu_stock_last_updated,
                rawMaterials: allSettings?.raw_materials_last_updated,
                lapakFunds: allSettings?.lapak_funds_last_updated
            }
        });
    };

    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Memuat data dashboard owner...</p>
                </div>
            </div>
        );
    }

    const ownerMetrics = [
        {
            title: 'Modal Awal',
            value: formatCurrency(dashboardData.initialCapital),
            icon: 'PiggyBank',
            color: 'primary',
            description: 'Jumlah modal awal yang disetor'
        },
        {
            title: 'Modal Berjalan',
            value: formatCurrency(dashboardData.runningCapital),
            icon: 'Wallet',
            color: 'info',
            description: 'Modal awal + total pendapatan + total stok (menu dan mentah) - total pengeluaran'
        },
        {
            title: 'Modal Akhir Saat Ini',
            value: formatCurrency((parseFloat(dashboardData.ownerBalance) || 0) + (parseFloat(dashboardData.lapakBalance) || 0)),
            icon: 'TrendingUp',
            color: 'success',
            description: 'Saldo owner + saldo lapak'
        },
        {
            title: 'Total Nilai Stok (Mentah + Menu)',
            value: formatCurrency(dashboardData.totalCombinedStockValue),
            icon: 'DollarSign',
            color: 'primary',
            description: 'Nilai total stok bahan mentah dan stok menu'
        },
        {
            title: 'Saldo Owner',
            value: formatCurrency(dashboardData.ownerBalance),
            icon: 'Wallet',
            color: 'success',
            description: 'Dana lapak Di Owner'
        },
        {
            title: 'Kekayaan Bisnis (Equity)',
            value: formatCurrency((parseFloat(dashboardData.initialCapital) || 0) + (parseFloat(dashboardData.allTimeNetProfit) || 0)),
            icon: 'ShieldCheck',
            color: 'accent',
            description: 'Modal Awal + Laba Bersih (Target Kekayaan)'
        },
        {
            title: 'Total Pendapatan (Semua Waktu)',
            value: formatCurrency(dashboardData.allTimeRevenue),
            icon: 'TrendingUp',
            color: 'success',
            description: 'Total seluruh pendapatan yang tercatat'
        },
        {
            title: 'Total Pengeluaran (Semua Waktu)',
            value: formatCurrency(dashboardData.allTimeExpenses),
            icon: 'TrendingDown',
            color: 'destructive',
            description: 'Total seluruh pengeluaran yang tercatat'
        },
        {
            title: 'Total Laba Bersih (Semua Waktu)',
            value: formatCurrency(dashboardData.allTimeNetProfit),
            icon: 'BarChart',
            color: 'accent',
            description: 'Hasil bersih Pendapatan - Pengeluaran'
        },
        // Dynamic logic for 'Selisih Perhitungan'
        (() => {
            const currentPhysicalCash = (parseFloat(dashboardData.ownerBalance) || 0) + (parseFloat(dashboardData.lapakBalance) || 0);
            const initialCapital = parseFloat(dashboardData.initialCapital) || 0;
            const totalRevenue = parseFloat(dashboardData.allTimeRevenue) || 0;
            const totalExpenses = parseFloat(dashboardData.allTimeExpenses) || 0;

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

    const ownerFeatures = [
        {
            title: "Uang Bisnis",
            icon: "DollarSign",
            color: "success",
            description: "Pantau saldo, deposit, dan pengeluaran",
            path: "/uang-bisnis"
        },
        {
            title: "Laporan Bisnis",
            icon: "BarChart3",
            color: "primary",
            description: "Analisis komprehensif performa bisnis",
            path: "/owner/business-reports"
        },
        {
            title: "Stok Bahan Baku",
            icon: "Archive",
            color: "warning",
            description: "Manajemen stok bahan baku mentah",
            path: "/owner-raw-material-stock"
        },
        {
            title: "Stok Kritis",
            icon: "AlertTriangle",
            color: "destructive",
            description: "Lihat bahan yang perlu dibeli",
            path: "/critical-stock"
        },
        {
            title: "Statistik V2",
            icon: "BarChart3",
            color: "accent",
            description: "Visualisasi data bisnis modern",
            path: "/dashboard-v2"
        },
        {
            title: "Profil Pengguna",
            icon: "User",
            color: "secondary",
            description: "Kelola pengaturan profil Anda",
            path: "/owner-profile"
        }
    ];

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50 dark:bg-slate-950' : 'bg-transparent'}`}>
            {theme === 'default' && (
                <OwnerNavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle || 'Dashboard Owner'} hideMobileHeader={true} />
            )}

            {/* Sticky Mobile Header */}
            <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 lg:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm py-3 ${showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="px-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-2xl transition-all bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 active:scale-95"
                    >
                        <Icon name="ChevronLeft" size={24} />
                    </button>
                    <div className="text-center">
                        <h2 className="font-black text-gray-800 dark:text-white tracking-tight">
                            Dashboard Owner
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell size={20} className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200" />
                    </div>
                </div>
            </div>

            {/* --- MOBILE OWNER DANA-STYLE UI (lg:hidden) --- */}
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
                                onClick={() => navigate('/owner-profile')}
                            >
                                <Icon name="User" size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-100 dark:text-blue-200/60 uppercase tracking-widest leading-none mb-1.5 opacity-80">Kasir Berkah 88</p>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-black tracking-tight">Owner Dashboard</h2>
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
                        <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate('/uang-bisnis')}>
                            <div className="w-full aspect-square bg-white/20 dark:bg-slate-800/40 rounded-[1.25rem] border border-white/20 dark:border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                                <Icon name="Wallet" size={32} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight text-white/90 dark:text-gray-300">Saldo</span>
                        </div>
                        <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate('/owner/business-reports')}>
                            <div className="w-full aspect-square bg-white/20 dark:bg-slate-800/40 rounded-[1.25rem] border border-white/20 dark:border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                                <Icon name="BarChart3" size={32} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight text-white/90 dark:text-gray-300">Laporan</span>
                        </div>
                        <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate('/owner-raw-material-stock')}>
                            <div className="w-full aspect-square bg-white/20 dark:bg-slate-800/40 rounded-[1.25rem] border border-white/20 dark:border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                                <Icon name="Archive" size={32} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight text-white/90 dark:text-gray-300">Bahan</span>
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
                <section className="px-5 -mt-10 relative z-30">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-900/10 dark:shadow-none border border-blue-50/50 dark:border-slate-700">
                        {/* Header Row: Label & Status */}
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 tracking-[0.25em] uppercase">KAS GABUNGAN (OWNER + LAPAK)</p>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-emerald-100/50 dark:shadow-none">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                Terpantau
                            </div>
                        </div>

                        {/* Balance Row */}
                        <div className="flex items-center gap-3 cursor-pointer group mb-8" onClick={() => navigate('/uang-bisnis')}>
                            <h3 className="text-[2.5rem] font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                                {formatCurrency((parseFloat(dashboardData.ownerBalance) || 0) + (parseFloat(dashboardData.lapakBalance) || 0))}
                            </h3>
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-active:translate-x-1 transition-transform border border-blue-100/30 dark:border-blue-700/30">
                                <Icon name="ChevronRight" size={16} className="text-blue-500" />
                            </div>
                        </div>

                        <div className="h-[1px] bg-gray-50 dark:bg-slate-700 w-full mb-8"></div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Omzet Bulan Ini</span>
                                <span className="text-base font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(dashboardData.monthlyRevenue || 0)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Keluar Bulan Ini</span>
                                <span className="text-base font-black text-rose-500 tracking-tight">-{formatCurrency(dashboardData.monthlyExpenses || 0)}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stock Alert Banner (Mobile) */}
                <section className="px-1 mt-2">
                    <StockAlertBanner />
                </section>

                <section className="mt-10 px-5">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tighter uppercase">Layanan Owner</h3>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none grid grid-cols-4 gap-y-10 border border-transparent dark:border-slate-700">
                        {ownerFeatures.map((feature, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3 active:scale-95 transition-transform" onClick={() => navigate(feature.path)}>
                                <div className={`w-12 h-12 rounded-2xl bg-${feature.color}/10 dark:bg-${feature.color}/20 flex items-center justify-center`}>
                                    <Icon name={feature.icon} size={24} className={`text-${feature.color}`} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400 text-center leading-tight">{feature.title}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-10 px-5 mb-8">
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tighter uppercase mb-5 px-1">Pembaruan Sistem</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Stok Menu Card */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                                    <Icon name="BookUser" className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Stok Menu</h3>
                                    <p className="text-[10px] text-blue-100 font-medium">Data porsi tersedia</p>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/10 relative z-10">
                                <p className="text-[10px] text-blue-200 font-medium mb-0.5">Terakhir diperbarui</p>
                                <p className="text-xs font-bold text-white">
                                    {dashboardData.timestamps?.menuStock
                                        ? new Date(dashboardData.timestamps.menuStock).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : 'Belum pernah'}
                                </p>
                            </div>
                        </div>

                        {/* Bahan Baku Card */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                                    <Icon name="Package" className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Bahan Baku</h3>
                                    <p className="text-[10px] text-blue-100 font-medium">Stok mentah terpantau</p>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/10 relative z-10">
                                <p className="text-[10px] text-blue-200 font-medium mb-0.5">Terakhir diperbarui</p>
                                <p className="text-xs font-bold text-white">
                                    {dashboardData.timestamps?.rawMaterials
                                        ? new Date(dashboardData.timestamps.rawMaterials).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : 'Belum pernah'}
                                </p>
                            </div>
                        </div>

                        {/* Uang Lapak Card */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                                    <Icon name="Wallet" className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Uang Lapak</h3>
                                    <p className="text-[10px] text-blue-100 font-medium">Dana kas tercatat</p>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/10 relative z-10">
                                <p className="text-[10px] text-blue-200 font-medium mb-0.5">Terakhir diperbarui</p>
                                <p className="text-xs font-bold text-white">
                                    {dashboardData.timestamps?.lapakFunds
                                        ? new Date(dashboardData.timestamps.lapakFunds).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : 'Belum pernah'}
                                </p>
                            </div>
                        </div>

                        {/* Activity Logs Card */}
                        <div
                            onClick={() => navigate('/all-logs')}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl p-5 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                            <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/10 rounded-full -ml-4 -mb-4 blur-lg"></div>

                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 text-white">
                                    <Icon name="History" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Log Aktivitas</h3>
                                    <p className="text-[10px] text-purple-100 font-medium">Pantau histori sistem</p>
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-white/10 relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-purple-200 font-medium mb-0.5">Status Sistem</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <p className="text-xs font-bold text-white">Aktif Memantau</p>
                                    </div>
                                </div>
                                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                                    <Icon name="ArrowRight" className="text-white" size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* --- DESKTOP UI (hidden lg:block) --- */}
            <main className={`hidden lg:block ${theme === 'default' ? 'pt-20 lg:pt-16' : ''} pb-24 lg:pb-8`}>
                <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 pb-8" : ""}>
                    {/* Stock Alert Banner */}
                    <StockAlertBanner isOwner={true} />

                    {/* Owner AI Motivational Popup */}
                    <OwnerMotivationalModal />

                    <div className="mb-6 mt-4">
                        <BreadcrumbNavigation />
                        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                            Dashboard Owner
                        </h1>
                        <p className="text-text-secondary mt-1">
                            Selamat datang! Lihat ringkasan data penting bisnis Anda.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                        {ownerMetrics.map((metric, index) => (
                            <MetricsCard
                                key={index}
                                title={metric.title}
                                value={metric.value}
                                icon={metric.icon}
                                description={metric.description}
                                color={metric.color}
                            />
                        ))}
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-text-primary mb-4">
                            Aksi Cepat
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ownerFeatures.map((feature, index) => (
                                <QuickActionCard
                                    key={index}
                                    title={feature.title}
                                    description={feature.description}
                                    icon={feature.icon}
                                    route={feature.path}
                                    color={feature.color}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="mt-8 pb-16 lg:pb-8">
                        <h2 className="text-xl font-semibold text-text-primary mb-4">
                            Status Sinkronisasi Data
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;


