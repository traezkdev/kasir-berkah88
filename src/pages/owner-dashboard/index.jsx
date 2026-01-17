import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import MetricsCard from '../main-dashboard/components/MetricsCard';
import QuickActionCard from '../main-dashboard/components/QuickActionCard';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import authFetch from '../../utils/authFetch';
import Icon from '../../components/AppIcon';
import StockAlertBanner from '../../components/StockAlertBanner';
import OwnerMotivationalModal from '../../components/ui/OwnerMotivationalModal';

const apiUrl = import.meta.env.VITE_API_URL;

const OwnerDashboard = ({ headerTitle }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);

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
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50' : 'bg-transparent'}`}>
            {theme === 'default' && (
                <OwnerNavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle || 'Dashboard Owner'} hideMobileHeader={true} />
            )}

            {/* --- MOBILE OWNER DANA-STYLE UI (lg:hidden) --- */}
            <div className="lg:hidden flex flex-col pb-24">
                {/* Dana Blue Header */}
                <header className="bg-[#118eea] text-white px-5 pt-8 pb-16 shadow-xl relative z-20 overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                    {/* Top Bar */}
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner cursor-pointer active:scale-95 transition-transform"
                                onClick={() => navigate('/owner-profile')}
                            >
                                <Icon name="User" size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest leading-none mb-1.5 opacity-80">Kasir Berkah 88</p>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-black tracking-tight">Owner Dashboard</h2>
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <div className="p-2 active:bg-white/10 rounded-full transition-colors" onClick={() => navigate('/chatbot')}>
                                <Icon name="Bot" size={24} />
                            </div>
                            <div className="p-2 active:bg-white/10 rounded-full transition-colors" onClick={() => navigate('/settings')}>
                                <Icon name="Settings" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Main Action Grid (Icon + Label) */}
                    <div className="grid grid-cols-4 gap-4 relative z-10">
                        <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate('/uang-bisnis')}>
                            <div className="w-full aspect-square bg-white/20 rounded-[1.25rem] border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                                <Icon name="Wallet" size={32} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight text-white/90">Saldo</span>
                        </div>
                        <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate('/owner/business-reports')}>
                            <div className="w-full aspect-square bg-white/20 rounded-[1.25rem] border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                                <Icon name="BarChart3" size={32} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight text-white/90">Laporan</span>
                        </div>
                        <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate('/owner-raw-material-stock')}>
                            <div className="w-full aspect-square bg-white/20 rounded-[1.25rem] border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                                <Icon name="Archive" size={32} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight text-white/90">Bahan</span>
                        </div>
                        <div className="flex flex-col items-center gap-2.5 group" onClick={() => navigate('/auditor')}>
                            <div className="w-full aspect-square bg-white/20 rounded-[1.25rem] border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg group-active:scale-95 transition-transform duration-200">
                                <Icon name="SearchCheck" size={32} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight text-white/90">Audit</span>
                        </div>
                    </div>
                </header>

                {/* Floating Balance Card */}
                <section className="px-5 -mt-10 relative z-30">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-900/10 border border-blue-50/50">
                        {/* Header Row: Label & Status */}
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] font-black text-gray-400 tracking-[0.25em] uppercase">KAS GABUNGAN (OWNER + LAPAK)</p>
                            <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-emerald-100/50">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                Terpantau
                            </div>
                        </div>

                        {/* Balance Row */}
                        <div className="flex items-center gap-3 cursor-pointer group mb-8" onClick={() => navigate('/uang-bisnis')}>
                            <h3 className="text-[2.5rem] font-black text-gray-900 tracking-tighter leading-none">
                                {formatCurrency((parseFloat(dashboardData.ownerBalance) || 0) + (parseFloat(dashboardData.lapakBalance) || 0))}
                            </h3>
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-active:translate-x-1 transition-transform border border-blue-100/30">
                                <Icon name="ChevronRight" size={16} className="text-blue-500" />
                            </div>
                        </div>

                        <div className="h-[1px] bg-gray-50 w-full mb-8"></div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Omzet Bulan Ini</span>
                                <span className="text-base font-black text-gray-900 tracking-tight">{formatCurrency(dashboardData.monthlyRevenue || 0)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Keluar Bulan Ini</span>
                                <span className="text-base font-black text-rose-500 tracking-tight">-{formatCurrency(dashboardData.monthlyExpenses || 0)}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Service Grid Section */}
                <section className="mt-10 px-5">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h3 className="text-sm font-extrabold text-gray-900 tracking-tighter uppercase">Layanan Owner</h3>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 grid grid-cols-4 gap-y-10">
                        {ownerFeatures.map((feature, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3 active:scale-95 transition-transform" onClick={() => navigate(feature.path)}>
                                <div className={`w-12 h-12 rounded-2xl bg-${feature.color}/10 flex items-center justify-center`}>
                                    <Icon name={feature.icon} size={24} className={`text-${feature.color}`} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{feature.title}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sync Status Section */}
                <section className="mt-10 px-5">
                    <h3 className="text-sm font-extrabold text-gray-900 tracking-tighter uppercase mb-5 px-1">Pembaruan Sistem</h3>
                    <div className="space-y-3">
                        <div className="bg-white p-5 rounded-[2rem] shadow-md border border-gray-50 flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                <Icon name="BookUser" size={24} className="text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Stok Menu</p>
                                <p className="text-xs font-bold text-gray-900">{dashboardData.timestamps?.menuStock ? new Date(dashboardData.timestamps.menuStock).toLocaleString('id-ID') : 'Belum pernah'}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-[2rem] shadow-md border border-gray-50 flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                <Icon name="Package" size={24} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Bahan Baku</p>
                                <p className="text-xs font-bold text-gray-900">{dashboardData.timestamps?.rawMaterials ? new Date(dashboardData.timestamps.rawMaterials).toLocaleString('id-ID') : 'Belum pernah'}</p>
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


