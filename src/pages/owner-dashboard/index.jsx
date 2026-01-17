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
        <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
            {theme === 'default' && <OwnerNavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle || 'Dashboard Owner'} />}
            <main className={`${theme === 'default' ? 'pt-20 lg:pt-16' : ''} pb-24 lg:pb-8`}>
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
                                </div>                                                                                                                                                <p className="text-xs text-text-secondary">Terakhir diperbarui:</p>
                                <p className="text-sm font-medium text-text-primary">
                                    {dashboardData.timestamps?.menuStock
                                        ? new Date(dashboardData.timestamps.menuStock).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : 'Belum pernah'}
                                </p>
                            </div>                                                        <div className="bg-card border border-border rounded-lg p-4 text-center">
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


