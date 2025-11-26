import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import MetricsCard from '../main-dashboard/components/MetricsCard';
import QuickActionCard from '../main-dashboard/components/QuickActionCard';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import authFetch from '../../utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

const OwnerDashboard = ({ headerTitle }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })?.format(amount);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allTransRes, menuRes, expenseRes, ownerAccountRes, lapakAccountRes, rawMaterialsRes, criticalItemsRes] = await Promise.all([
                    authFetch(`${apiUrl}/api/transactions/all`),
                    authFetch(`${apiUrl}/api/menu-items/all`),
                    authFetch(`${apiUrl}/api/expenses/all`),
                    authFetch(`${apiUrl}/api/accounts/owner_deposit`),
                    authFetch(`${apiUrl}/api/accounts/lapak_deposit`),
                    authFetch(`${apiUrl}/api/raw-materials`),
                    authFetch(`${apiUrl}/api/stock-alerts/count`)
                ]);

                const allTransactions = allTransRes.ok ? (await allTransRes.json()).data : [];
                const menuItems = menuRes.ok ? (await menuRes.json()).data : [];
                const expenses = expenseRes.ok ? (await expenseRes.json()).data : [];
                const ownerAccountData = ownerAccountRes.ok ? (await ownerAccountRes.json()).data : { account: { balance: 0 } };
                const lapakAccountData = lapakAccountRes.ok ? (await lapakAccountRes.json()).data : { account: { balance: 0 } };
                const rawMaterials = rawMaterialsRes.ok ? (await rawMaterialsRes.json()).data : [];
                const criticalItemsCount = criticalItemsRes.ok ? (await criticalItemsRes.json()).data.low_stock_count : 0;

                processDashboardData(allTransactions, menuItems, expenses, ownerAccountData, lapakAccountData, rawMaterials, criticalItemsCount);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setDashboardData({}); // Set to empty object to stop loading on error
            }
        };

        fetchData();
    }, []);

    const processDashboardData = (allTransactions, menuItems, expenses, ownerAccountData, lapakAccountData, rawMaterials, criticalItemsCount) => {
        const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const monthlyTransactions = allTransactions.filter(t => {
            const transactionDate = new Date(t.timestamp);
            return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
        });

        const totalRevenue = monthlyTransactions
            .filter(t => t.payment_method !== 'Makan Karyawan')
            .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

        const monthlyExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        });

        const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        
        const rawMaterialStockValue = rawMaterials.reduce((sum, m) => sum + (parseInt(m.current_stock || 0) * parseFloat(m.price_per_item || 0)), 0);
        
        const netProfit = totalRevenue - totalExpenses;

        setDashboardData({
            ownerBalance: ownerAccountData?.account?.balance || 0,
            lapakBalance: lapakAccountData?.account?.balance || 0,
            monthlyRevenue: totalRevenue,
            monthlyExpenses: totalExpenses,
            monthlyNetProfit: netProfit,
            rawMaterialStockValue: rawMaterialStockValue,
            criticalItemsCount: criticalItemsCount
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
            title: 'Saldo Owner',
            value: formatCurrency(dashboardData.ownerBalance),
            icon: 'Wallet',
            color: 'success',
            description: 'Total dana pribadi yang tersimpan'
        },
        {
            title: 'Saldo Lapak',
            value: formatCurrency(dashboardData.lapakBalance),
            icon: 'Store',
            color: 'info',
            description: 'Total dana untuk operasional lapak'
        },
        {
            title: 'Pendapatan (Bulan Ini)',
            value: formatCurrency(dashboardData.monthlyRevenue),
            icon: 'TrendingUp',
            color: 'primary',
            description: 'Total pendapatan di bulan berjalan'
        },
        {
            title: 'Pengeluaran (Bulan Ini)',
            value: formatCurrency(dashboardData.monthlyExpenses),
            icon: 'TrendingDown',
            color: 'warning',
            description: 'Total pengeluaran di bulan berjalan'
        },
        {
            title: 'Laba Bersih (Bulan Ini)',
            value: formatCurrency(dashboardData.monthlyNetProfit),
            icon: 'BarChart3',
            color: 'success',
            description: 'Pendapatan dikurangi pengeluaran bulan ini'
        },
        {
            title: 'Nilai Stok Mentah',
            value: formatCurrency(dashboardData.rawMaterialStockValue),
            icon: 'Package',
            color: 'secondary',
            description: 'Estimasi nilai total bahan mentah'
        },
        {
            title: 'Item Stok Kritis',
            value: `${dashboardData.criticalItemsCount} Jenis`,
            icon: 'AlertTriangle',
            color: 'destructive',
            description: 'Bahan yang perlu segera dibeli'
        },
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
            title: "Profil Pengguna",
            icon: "User",
            color: "secondary",
            description: "Kelola pengaturan profil Anda",
            path: "/owner-profile"
        }
    ];

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
            <OwnerNavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle || 'Dashboard Owner'} />
            <main className={`pb-20 lg:pb-8 pt-16`}>
                <div className="max-w-7xl mx-auto px-4 lg:px-6">
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
                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;

