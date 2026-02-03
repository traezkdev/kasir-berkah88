import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import NavigationHeader from '../components/ui/NavigationHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { formatCurrency } from '../utils/formatCurrency';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import axios from 'axios';
import Input from '../components/ui/Input';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingBag, CreditCard, FileDown } from 'lucide-react';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import OwnerNavigationHeader from '../components/ui/OwnerNavigationHeader';
import AdminMobileHeader from '../components/ui/AdminMobileHeader';
import Icon from '../components/AppIcon';
import LoadingScreen from '../components/ui/LoadingScreen';
import { jwtDecode } from 'jwt-decode';

// Setup axios instance
const apiUrl = import.meta.env.VITE_API_URL;
const api = axios.create({
    baseURL: apiUrl,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalisisData = () => {
    const { theme } = useTheme();
    const { isSidebarCollapsed, toggleSidebar } = useAppSettings();

    // Role Logic
    const [userRole, setUserRole] = useState(null);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role);
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        }
    }, []);

    // State
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd')); // Default 30 hari terakhir, akan disesuaikan di useEffect
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false); // State for export dropdown

    // Fetch Settings to check for last_closing_date
    useEffect(() => {
        const fetchSettingsAndAdjustDate = async () => {
            try {
                const res = await api.get('/api/all-settings');
                if (res.data.data && res.data.data.last_closing_date) {
                    const lcd = new Date(res.data.data.last_closing_date);
                    const thirtyDaysAgo = subDays(new Date(), 30);
                    // Jika tutup buku dilakukan dalam 30 hari terakhir, gunakan tanggal tersebut sebagai awal default
                    if (lcd > thirtyDaysAgo) {
                        setStartDate(format(lcd, 'yyyy-MM-dd'));
                    }
                }
            } catch (err) {
                console.error("Error fetching settings for date adjustment:", err);
            }
        };
        fetchSettingsAndAdjustDate();
    }, []);

    // Initial check for all-time range (Dynamic)
    const handleSetAllTime = async () => {
        // Set loading indicator specifically for this action if needed, 
        // effectively fetchData will interpret date change as loading trigger.
        try {
            const checkOldest = async (endpoint, dateField) => {
                try {
                    // 1. Check total pages
                    const initRes = await api.get(endpoint, { params: { limit: 1, page: 1 } });
                    const pagination = initRes.data.pagination;

                    if (pagination && pagination.totalItems > 0) {
                        // 2. Fetch the very last item (oldest)
                        const lastPage = pagination.totalPages;
                        const lastRes = await api.get(endpoint, { params: { limit: 1, page: lastPage } });
                        if (lastRes.data.data && lastRes.data.data.length > 0) {
                            const item = lastRes.data.data[0];
                            const dateStr = item[dateField];
                            return dateStr ? new Date(dateStr) : null;
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to check oldest for ${endpoint}`, err);
                }
                return null;
            };

            const [oldestTrans, oldestExp] = await Promise.all([
                checkOldest('/api/transactions', 'timestamp'),
                checkOldest('/api/expenses', 'date')
            ]);

            const validDates = [oldestTrans, oldestExp].filter(d => d !== null);
            let earliest;

            if (validDates.length > 0) {
                earliest = new Date(Math.min(...validDates));
            } else {
                // Return to a safe default if no data exists
                earliest = new Date('2024-01-01');
            }

            setStartDate(format(earliest, 'yyyy-MM-dd'));
            setEndDate(format(new Date(), 'yyyy-MM-dd'));

        } catch (error) {
            console.error("Error setting all time:", error);
            // Fallback
            setStartDate('2024-01-01');
            setEndDate(format(new Date(), 'yyyy-MM-dd'));
        }
    };

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const startStr = startDate;
            const endStr = endDate;

            const response = await api.get('/api/analytics/breakdown', {
                params: { startDate: startStr, endDate: endStr }
            });

            // Convert string numbers to actual numbers for charts
            const processedData = {
                ...response.data.data,
                expenses: {
                    ...response.data.data.expenses,
                    byCategory: response.data.data.expenses.byCategory.map(item => ({
                        ...item,
                        total: parseFloat(item.total)
                    }))
                }
            };


            setData(processedData);
        } catch (err) {
            console.error("Error fetching analytics:", err);
            setError("Gagal memuat data analisis. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    // Export Functions
    const handleExportExcel = () => {
        if (!data) return;

        const sections = prepareAnalyticsDataForExport();
        exportToExcel(sections, `Analisis_Bisnis_${format(new Date(startDate), 'dd-MM-yyyy')}_${format(new Date(endDate), 'dd-MM-yyyy')}`);
    };

    const handleExportPDF = () => {
        if (!data) return;

        const sections = prepareAnalyticsDataForExport();
        exportToPdf(sections, `Analisis_Bisnis_${format(new Date(startDate), 'dd-MM-yyyy')}_${format(new Date(endDate), 'dd-MM-yyyy')}`);
    };

    const prepareAnalyticsDataForExport = () => {
        const sections = [];

        // Summary Section
        sections.push({
            title: 'Ringkasan Periode',
            headers: ['Keterangan', 'Nilai'],
            rows: [
                ['Periode', `${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`],
                ['Total Pendapatan', formatCurrency(data.summary.totalRevenue)],
                ['Total Pengeluaran', formatCurrency(data.summary.totalExpense)],
                ['Laba Bersih', formatCurrency(data.summary.netIncome)],
                ['Total Transaksi', data.sales.totalTransactions.toString()],
            ],
        });

        // Top Selling Items
        if (data.sales.topSellingItems && data.sales.topSellingItems.length > 0) {
            sections.push({
                title: 'Item Terlaris',
                headers: ['Nama Item', 'Qty Terjual', 'Total Pendapatan'],
                rows: data.sales.topSellingItems.map(item => [
                    item.name,
                    item.quantity.toString(),
                    formatCurrency(item.revenue)
                ]),
            });
        }

        // Expenses by Category
        if (data.expenses.byCategory && data.expenses.byCategory.length > 0) {
            sections.push({
                title: 'Pengeluaran per Kategori',
                headers: ['Kategori', 'Total Pengeluaran'],
                rows: data.expenses.byCategory.map(cat => [
                    cat.category,
                    formatCurrency(cat.total)
                ]),
            });
        }

        // Top Expenses
        if (data.expenses.topExpenses && data.expenses.topExpenses.length > 0) {
            sections.push({
                title: '10 Pengeluaran Terbesar',
                headers: ['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah'],
                rows: data.expenses.topExpenses.map(exp => [
                    format(new Date(exp.date), 'dd/MM/yyyy'),
                    exp.name,
                    exp.category || 'Umum',
                    formatCurrency(exp.amount)
                ]),
            });
        }

        // Payment Methods
        if (data.sales.paymentMethods && data.sales.paymentMethods.length > 0) {
            sections.push({
                title: 'Metode Pembayaran',
                headers: ['Metode', 'Jumlah Transaksi', 'Total'],
                rows: data.sales.paymentMethods.map(pm => [
                    pm.payment_method,
                    pm.count.toString(),
                    formatCurrency(pm.total)
                ]),
            });
        }

        return sections;
    };

    // Loading State
    if (loading && !data) {
        return <LoadingScreen message="Menganalisis Performa Bisnis" submessage="Mengkalkulasi pendapatan, pengeluaran, dan laba bersih" />;
    }

    return (
        <div className={`min-h-screen text-foreground ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>

            {theme === 'default' && (
                <>
                    {userRole === 'owner' ? (
                        <OwnerNavigationHeader
                            onToggleSidebar={toggleSidebar}
                            headerTitle="Analisis Bisnis"
                            hideMobileHeader={true}
                        />
                    ) : (
                        <NavigationHeader
                            isCollapsed={isSidebarCollapsed}
                            onToggleSidebar={toggleSidebar}
                            headerTitle="Analisis Bisnis"
                            hideMobileHeader={true}
                        />
                    )}
                    <AdminMobileHeader
                        title="Analisis"
                        subtitle="Bisnis"
                        badgeText="Data Breakdown"
                        decorativeIcon="BarChart3"
                        stickyTitle="Analisis Bisnis"
                        rightIcon="Home"
                        onRightAction={() => window.history.back()}
                        actions={[
                            {
                                label: "Terapkan",
                                icon: "RefreshCw",
                                color: "success",
                                onClick: fetchData
                            },
                            {
                                label: "Export PDF",
                                icon: "FileText",
                                color: "danger",
                                onClick: handleExportPDF
                            }
                        ]}
                    />
                </>
            )}

            <main className={`${theme === 'default' ? 'lg:pt-16' : ''} pb-24 lg:pb-8`}>
                <div className="p-4 md:p-6 space-y-8 max-w-[1600px] mx-auto w-full">

                    {/* --- Premium Filter Section (Native App Style) --- */}
                    <div className="lg:mt-0 -mt-16 relative z-20">
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem]  p-6 lg:p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-blue-50/50 dark:border-slate-700 relative overflow-hidden group">
                            {/* Decorative Background Icon */}
                            <div className="absolute -right-6 -top-6 text-blue-500/5 group-hover:text-blue-500/10 transition-colors duration-500 pointer-events-none">
                                <Icon name="Calendar" size={120} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                        <Icon name="CalendarRange" className="text-blue-600 dark:text-blue-400" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm lg:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Periode Analisis</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atur rentang waktu data</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Dari Tanggal</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                <Icon name="Calendar" size={16} />
                                            </div>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full pl-11 h-12 rounded-2xl bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Sampai Tanggal</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                <Icon name="Calendar" size={16} />
                                            </div>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full pl-11 h-12 rounded-2xl bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 lg:col-span-1">
                                        <button
                                            onClick={fetchData}
                                            className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 px-8"
                                        >
                                            <Icon name="RefreshCw" size={14} className={loading ? 'animate-spin' : ''} />
                                            Terapkan
                                        </button>
                                        <button
                                            onClick={handleSetAllTime}
                                            className="h-12 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-200 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 px-8"
                                        >
                                            <Icon name="History" size={14} />
                                            Semua
                                        </button>
                                    </div>

                                    <div className="relative lg:col-span-1">
                                        {data && (
                                            <>
                                                <button
                                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                                >
                                                    <Icon name="FileDown" size={14} />
                                                    Export Data
                                                </button>

                                                {showExportMenu && (
                                                    <div className="absolute bottom-full lg:top-full left-0 right-0 mb-3 lg:mt-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 lg:slide-in-from-top-2 duration-300">
                                                        <button
                                                            onClick={() => {
                                                                handleExportExcel();
                                                                setShowExportMenu(false);
                                                            }}
                                                            className="w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-colors text-gray-700 dark:text-gray-200 border-b border-gray-50 dark:border-slate-700"
                                                        >
                                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                                                                <Icon name="FileDown" size={16} />
                                                            </div>
                                                            Export ke Excel
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleExportPDF();
                                                                setShowExportMenu(false);
                                                            }}
                                                            className="w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-3 transition-colors text-gray-700 dark:text-gray-200"
                                                        >
                                                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600">
                                                                <Icon name="FileText" size={16} />
                                                            </div>
                                                            Export ke PDF
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    {data && (
                        <>
                            {/* --- Summary Cards (Premium Native App Style) --- */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <SummaryCard
                                    title="Total Pendapatan"
                                    value={formatCurrency(data.summary.totalRevenue)}
                                    icon="TrendingUp"
                                    color="success"
                                />
                                <SummaryCard
                                    title="Total Pengeluaran"
                                    value={formatCurrency(data.summary.totalExpense)}
                                    icon="TrendingDown"
                                    color="danger"
                                />
                                <SummaryCard
                                    title="Laba Bersih"
                                    value={formatCurrency(data.summary.netIncome)}
                                    icon="DollarSign"
                                    color="info"
                                    desc="Pendapatan - Pengeluaran"
                                />
                                <SummaryCard
                                    title="Total Transaksi"
                                    value={data.sales.totalTransactions}
                                    icon="ShoppingBag"
                                    color="primary"
                                />
                            </div>

                            {/* --- Visualizations (Premium Native App Style) --- */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Top Selling Chart */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-7 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 relative overflow-hidden group flex flex-col h-full">
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 shadow-sm shrink-0">
                                            <Icon name="ShoppingBag" size={22} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">Top 5 Item Terlaris</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Produk dengan penjualan tertinggi</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[350px] w-full mt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                layout="vertical"
                                                data={data.sales.topSellingItems.slice(0, 5)}
                                                margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }} className="text-gray-500" />
                                                <Tooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                        backdropFilter: 'blur(10px)',
                                                        border: '1px solid #f1f5f9',
                                                        borderRadius: '20px',
                                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
                                                    }}
                                                    formatter={(value) => [value, 'Terjual']}
                                                />
                                                <Bar dataKey="quantity" radius={[0, 12, 12, 0]} barSize={32}>
                                                    {data.sales.topSellingItems.slice(0, 5).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Expense Categories Chart */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-7 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 relative overflow-hidden group flex flex-col h-full">
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 shadow-sm shrink-0">
                                            <Icon name="TrendingDown" size={22} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">Pengeluaran per Kategori</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Breakdown biaya operasional</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[350px] w-full mt-2 flex items-center justify-center">
                                        {data.expenses.byCategory && data.expenses.byCategory.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={data.expenses.byCategory}
                                                        cx="50%"
                                                        cy="45%"
                                                        innerRadius={70}
                                                        outerRadius={100}
                                                        paddingAngle={8}
                                                        dataKey="total"
                                                        nameKey="category"
                                                        stroke="none"
                                                    >
                                                        {data.expenses.byCategory.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value) => formatCurrency(value)}
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                            backdropFilter: 'blur(10px)',
                                                            border: '1px solid #f1f5f9',
                                                            borderRadius: '20px',
                                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
                                                        }}
                                                    />
                                                    <Legend
                                                        verticalAlign="bottom"
                                                        align="center"
                                                        iconType="circle"
                                                        wrapperStyle={{
                                                            fontSize: '9px',
                                                            fontWeight: 800,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            paddingTop: '30px',
                                                            paddingBottom: '10px'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="text-center py-10 text-gray-400">
                                                <Icon name="Inbox" className="mx-auto mb-3" size={40} />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Tidak ada data</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* --- Tables (Premium Native App Style) --- */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Detail Top Selling */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-7 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 relative overflow-hidden group flex flex-col h-full">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 shadow-sm shrink-0">
                                            <Icon name="Award" size={22} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">Peringkat Penjualan</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Detail unit dan pendapatan item</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto max-h-[460px] custom-scrollbar -mx-2 px-2">
                                        <table className="w-full text-left border-separate border-spacing-y-2">
                                            <thead className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md z-10">
                                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                    <th className="px-4 py-3">Item</th>
                                                    <th className="px-4 py-3 text-center">Qty</th>
                                                    <th className="px-4 py-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {data.sales.topSellingItems.map((item, idx) => (
                                                    <tr key={idx} className="group/row bg-gray-50/30 dark:bg-slate-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                                        <td className="px-4 py-4 rounded-l-2xl border-l border-y border-transparent group-hover/row:border-blue-100 dark:group-hover/row:border-blue-900/30">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-black shadow-sm border border-gray-100 dark:border-slate-700">{idx + 1}</span>
                                                                <span className="font-bold text-gray-700 dark:text-gray-200">{item.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center font-black text-gray-500 border-y border-transparent group-hover/row:border-blue-100 dark:group-hover/row:border-blue-900/30">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-4 py-4 text-right rounded-r-2xl border-r border-y border-transparent group-hover/row:border-blue-100 dark:group-hover/row:border-blue-900/30">
                                                            <span className="font-black text-blue-600 dark:text-blue-400">{formatCurrency(item.revenue)}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {data.sales.topSellingItems.length === 0 && (
                                                    <tr>
                                                        <td colSpan="3" className="py-20 text-center">
                                                            <Icon name="SearchX" className="mx-auto mb-3 text-gray-300" size={40} />
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data penjualan kosong</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Top Expenses List */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-7 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 relative overflow-hidden group flex flex-col h-full">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 shadow-sm shrink-0">
                                            <Icon name="Receipt" size={22} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">Pengeluaran Terbesar</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">10 pengeluaran teratas periode ini</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto max-h-[460px] custom-scrollbar -mx-2 px-2">
                                        <table className="w-full text-left border-separate border-spacing-y-2">
                                            <thead className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md z-10">
                                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                    <th className="px-4 py-3">Deskripsi</th>
                                                    <th className="px-4 py-3">Kategori</th>
                                                    <th className="px-4 py-3 text-right">Jumlah</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {data.expenses.topExpenses.map((exp, idx) => (
                                                    <tr key={idx} className="group/row bg-gray-50/30 dark:bg-slate-900/30 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors">
                                                        <td className="px-4 py-4 rounded-l-2xl border-l border-y border-transparent group-hover/row:border-rose-100 dark:group-hover/row:border-rose-900/30">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-700 dark:text-gray-200 line-clamp-1">{exp.name}</span>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{format(new Date(exp.date), 'dd MMM yyyy')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 border-y border-transparent group-hover/row:border-rose-100 dark:group-hover/row:border-rose-900/30">
                                                            <span className="inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700 shadow-sm leading-normal">
                                                                {exp.category || 'Umum'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right rounded-r-2xl border-r border-y border-transparent group-hover/row:border-rose-100 dark:group-hover/row:border-rose-900/30">
                                                            <span className="font-black text-rose-600 dark:text-rose-400">{formatCurrency(exp.amount)}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {data.expenses.topExpenses.length === 0 && (
                                                    <tr>
                                                        <td colSpan="3" className="py-20 text-center">
                                                            <Icon name="Inbox" className="mx-auto mb-3 text-gray-300" size={40} />
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tidak ada pengeluaran</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* --- Payment Methods (Premium Native App Style) --- */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 relative overflow-hidden group">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 shadow-sm shrink-0">
                                        <Icon name="CreditCard" size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">Metode Pembayaran</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Rincian transaksi per kanal</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {data.sales.paymentMethods.map((pm, idx) => {
                                        const isCash = pm.payment_method.toLowerCase().includes('tunai') || pm.payment_method.toLowerCase().includes('cash');
                                        const isDigital = pm.payment_method.toLowerCase().includes('qris') || pm.payment_method.toLowerCase().includes('transfer');

                                        return (
                                            <div key={idx} className="bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 p-5 rounded-3xl flex flex-col relative overflow-hidden group/pm transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:-translate-y-1">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`p-2 rounded-xl border ${isCash ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/20' : isDigital ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/20' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                                        <Icon name={isCash ? "Banknote" : isDigital ? "QrCode" : "Wallet"} size={18} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pm.count} TX</span>
                                                </div>

                                                <div className="mt-auto">
                                                    <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">{pm.payment_method}</h4>
                                                    <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(pm.total)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

// Sub-component for premium summary card
const SummaryCard = ({ title, value, icon, color = 'primary', desc }) => {
    const colorStyles = {
        primary: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/20',
        success: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/20',
        danger: 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/20',
        info: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/20',
    };

    const activeStyle = colorStyles[color] || colorStyles.primary;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 lg:p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            {/* Background Glow */}
            <div className={`absolute -right-12 -bottom-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${color === 'success' ? 'bg-emerald-400' : color === 'danger' ? 'bg-rose-400' : color === 'info' ? 'bg-indigo-400' : 'bg-blue-400'}`}></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6 lg:mb-4">
                    <div className={`p-4 lg:p-3 rounded-[1.5rem] lg:rounded-2xl shadow-inner border flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${activeStyle}`}>
                        <Icon name={icon} size={24} lg:size={20} strokeWidth={2.5} />
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${activeStyle}`}>
                        Analisis
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                        {title}
                    </p>
                    <h3 className="text-2xl lg:text-xl font-black text-gray-900 dark:text-white tracking-tighter leading-none py-1 truncate">
                        {value}
                    </h3>
                    {desc && (
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 mt-2 lg:mt-1">
                            {desc}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalisisData;
