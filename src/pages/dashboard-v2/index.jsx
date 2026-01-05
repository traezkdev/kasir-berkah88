import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import NavigationHeader from '../../components/ui/NavigationHeader';
import Icon from '../../components/AppIcon';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import axios from 'axios';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
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
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const DashboardV2 = ({ headerTitle }) => {
    const { theme } = useTheme();
    const { isSidebarCollapsed, toggleSidebar } = useAppSettings();

    // State
    const [dateRange, setDateRange] = useState('this_month');
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/analytics/breakdown', {
                params: { startDate, endDate }
            });

            // Process data
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
            setError("Gagal memuat data. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    // Handle date range preset
    const handleDateRangeChange = (range) => {
        setDateRange(range);
        const now = new Date();

        switch (range) {
            case 'today':
                setStartDate(format(now, 'yyyy-MM-dd'));
                setEndDate(format(now, 'yyyy-MM-dd'));
                break;
            case 'this_week':
                setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                break;
            case 'this_month':
                setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
                setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
                break;
            case 'last_30_days':
                setStartDate(format(subDays(now, 30), 'yyyy-MM-dd'));
                setEndDate(format(now, 'yyyy-MM-dd'));
                break;
            case 'custom':
                // Keep current dates
                break;
            default:
                break;
        }
    };

    // Loading State
    if (loading && !data) {
        return (
            <div className="flex bg-background min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary">Memuat data statistik...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
            {theme === 'default' && (
                <NavigationHeader
                    isCollapsed={isSidebarCollapsed}
                    onToggleSidebar={toggleSidebar}
                    headerTitle={headerTitle || "Dashboard Statistik"}
                />
            )}

            <div className={`${theme === 'default' ? 'pt-16' : ''}`}>
                <main className="p-4 md:p-6 space-y-6 max-w-[1800px] mx-auto w-full pb-32 md:pb-8">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-xl p-6 border border-primary/20">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                                        <Icon name="BarChart3" size={24} className="text-primary" />
                                    </div>
                                    Dashboard Statistik Lengkap
                                </h1>
                                <p className="text-text-secondary text-sm mt-2">
                                    Analisis mendalam performa bisnis dengan visualisasi data yang komprehensif
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <Card className="shadow-lg border-border/50">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                                <div className="flex-1 w-full">
                                    <label className="text-sm font-semibold mb-2 block text-text-secondary">
                                        Periode Analisis
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                        {[
                                            { value: 'today', label: 'Hari Ini' },
                                            { value: 'this_week', label: 'Minggu Ini' },
                                            { value: 'this_month', label: 'Bulan Ini' },
                                            { value: 'last_30_days', label: '30 Hari Terakhir' },
                                            { value: 'custom', label: 'Custom' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleDateRangeChange(option.value)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === option.value
                                                    ? 'bg-primary text-primary-foreground shadow-md'
                                                    : 'bg-muted text-text-secondary hover:bg-muted/80'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {dateRange === 'custom' && (
                                    <div className="flex gap-3 w-full lg:w-auto">
                                        <div className="flex-1 lg:flex-initial">
                                            <label className="text-xs font-semibold mb-1 block text-text-secondary">
                                                Dari Tanggal
                                            </label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full lg:w-40"
                                            />
                                        </div>
                                        <div className="flex-1 lg:flex-initial">
                                            <label className="text-xs font-semibold mb-1 block text-text-secondary">
                                                Sampai Tanggal
                                            </label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full lg:w-40"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-lg flex items-center gap-3">
                            <Icon name="AlertCircle" size={20} />
                            <p>{error}</p>
                        </div>
                    )}

                    {data && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    title="Total Pendapatan"
                                    value={formatCurrency(data.summary.totalRevenue)}
                                    icon="TrendingUp"
                                    color="success"
                                    description="Pendapatan periode ini"
                                />
                                <StatCard
                                    title="Total Pengeluaran"
                                    value={formatCurrency(data.summary.totalExpense)}
                                    icon="TrendingDown"
                                    color="destructive"
                                    description="Pengeluaran periode ini"
                                />
                                <StatCard
                                    title="Laba Bersih"
                                    value={formatCurrency(data.summary.netIncome)}
                                    icon="DollarSign"
                                    color="primary"
                                    description="Pendapatan - Pengeluaran"
                                />
                                <StatCard
                                    title="Total Transaksi"
                                    value={data.sales.totalTransactions.toString()}
                                    icon="ShoppingBag"
                                    color="accent"
                                    description="Jumlah transaksi"
                                    isCurrency={false}
                                />
                            </div>

                            {/* Charts Row 1 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Top Selling Items */}
                                <div className="bg-gradient-to-br from-success/20 to-teal-500/20 p-0.5 rounded-xl shadow-lg">
                                    <Card className="border-none shadow-none h-full">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Icon name="TrendingUp" size={20} className="text-success" />
                                                Top 10 Item Terlaris
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[400px]">
                                            {data.sales.topSellingItems && data.sales.topSellingItems.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        layout="vertical"
                                                        data={data.sales.topSellingItems.slice(0, 10)}
                                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                                        <XAxis type="number" />
                                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                                                            formatter={(value) => [value, 'Terjual']}
                                                        />
                                                        <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]}>
                                                            {data.sales.topSellingItems.slice(0, 10).map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState message="Tidak ada data penjualan" />
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Expense Categories Pie Chart */}
                                <div className="bg-gradient-to-br from-destructive/20 to-rose-500/20 p-0.5 rounded-xl shadow-lg">
                                    <Card className="border-none shadow-none h-full">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Icon name="PieChart" size={20} className="text-destructive" />
                                                Pengeluaran per Kategori
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[400px]">
                                            {data.expenses.byCategory && data.expenses.byCategory.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={data.expenses.byCategory}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={120}
                                                            fill="#8884d8"
                                                            dataKey="total"
                                                            nameKey="category"
                                                        >
                                                            {data.expenses.byCategory.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value) => formatCurrency(value)}
                                                            contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                                                        />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyState message="Tidak ada data pengeluaran" />
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Payment Methods Breakdown */}
                            <div className="bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 p-0.5 rounded-xl shadow-lg">
                                <Card className="border-none shadow-none">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Icon name="CreditCard" size={20} className="text-primary" />
                                            Breakdown Metode Pembayaran
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {data.sales.paymentMethods && data.sales.paymentMethods.map((pm, idx) => (
                                                <div key={idx} className="bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl p-0.5 shadow-md hover:shadow-lg transition-all group">
                                                    <div className="bg-card rounded-[10px] p-5 h-full transition-colors group-hover:bg-muted/10">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Icon name="Wallet" size={20} className="text-primary" />
                                                            </div>
                                                            <h3 className="text-md font-semibold capitalize text-text-primary">{pm.payment_method}</h3>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-2xl font-bold text-text-primary">
                                                                {pm.count} <span className="text-sm font-normal text-text-secondary">transaksi</span>
                                                            </div>
                                                            <div className="text-lg font-semibold text-primary">
                                                                {formatCurrency(pm.total)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tables Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Detail Top Selling */}
                                <div className="bg-gradient-to-br from-primary/20 to-indigo-500/20 p-0.5 rounded-xl shadow-lg">
                                    <Card className="border-none shadow-none h-full">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Icon name="List" size={20} className="text-success" />
                                                Detail Penjualan Item
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-y-auto max-h-[500px] pr-2">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted sticky top-0 z-10">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left rounded-tl-lg">Nama Item</th>
                                                            <th className="px-4 py-3 text-center">Qty</th>
                                                            <th className="px-4 py-3 text-right rounded-tr-lg">Total Pendapatan</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.sales.topSellingItems && data.sales.topSellingItems.map((item, idx) => (
                                                            <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                                                                <td className="px-4 py-3 font-medium text-text-primary">{item.name}</td>
                                                                <td className="px-4 py-3 text-center font-semibold text-primary">{item.quantity}</td>
                                                                <td className="px-4 py-3 text-right text-success font-semibold">
                                                                    {formatCurrency(item.revenue)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!data.sales.topSellingItems || data.sales.topSellingItems.length === 0) && (
                                                            <tr>
                                                                <td colSpan="3" className="text-center py-8 text-text-secondary">
                                                                    Tidak ada data penjualan
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Top Expenses List */}
                                <div className="bg-gradient-to-br from-destructive/20 to-orange-500/20 p-0.5 rounded-xl shadow-lg">
                                    <Card className="border-none shadow-none h-full">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Icon name="AlertCircle" size={20} className="text-destructive" />
                                                10 Pengeluaran Terbesar
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-y-auto max-h-[500px] pr-2">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted sticky top-0 z-10">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left rounded-tl-lg">Deskripsi</th>
                                                            <th className="px-4 py-3 text-left">Kategori</th>
                                                            <th className="px-4 py-3 text-right rounded-tr-lg">Jumlah</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.expenses.topExpenses && data.expenses.topExpenses.map((exp, idx) => (
                                                            <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium text-text-primary">{exp.name}</span>
                                                                        <span className="text-xs text-text-secondary">
                                                                            {format(new Date(exp.date), 'dd/MM/yyyy')}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                                                                        {exp.category || 'Umum'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-destructive font-semibold">
                                                                    {formatCurrency(exp.amount)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!data.expenses.topExpenses || data.expenses.topExpenses.length === 0) && (
                                                            <tr>
                                                                <td colSpan="3" className="text-center py-8 text-text-secondary">
                                                                    Tidak ada data pengeluaran
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, description }) => {
    const gradientClasses = {
        primary: 'bg-gradient-to-br from-indigo-400 to-purple-600',
        success: 'bg-gradient-to-br from-green-400 to-teal-600',
        warning: 'bg-gradient-to-br from-amber-400 to-orange-600',
        accent: 'bg-gradient-to-br from-pink-500 to-rose-500',
        info: 'bg-gradient-to-br from-sky-400 to-blue-600',
        destructive: 'bg-gradient-to-br from-red-500 to-red-700',
    };

    const iconColorClasses = {
        success: 'bg-success/10 text-success',
        destructive: 'bg-red-500/10 text-red-500',
        primary: 'bg-primary/10 text-primary',
        accent: 'bg-accent/10 text-accent',
        warning: 'bg-warning/10 text-warning',
        info: 'bg-sky-500/10 text-sky-500',
    };

    const gradient = gradientClasses[color] || gradientClasses.primary;
    const iconColors = iconColorClasses[color] || iconColorClasses.primary;

    return (
        <div className={`${gradient} rounded-xl p-0.5 shadow-lg hover:shadow-xl transition-all duration-300 group`}>
            <div className="bg-card rounded-[10px] p-6 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 opacity-80">{title}</p>
                        <h3 className="text-2xl font-bold text-text-primary break-words tracking-tight group-hover:scale-[1.02] transition-transform origin-left">
                            {value}
                        </h3>
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12 ${iconColors}`}>
                        <Icon name={icon} size={24} />
                    </div>
                </div>
                {description && (
                    <div className="flex items-center gap-1.5 mt-auto">
                        <div className={`w-1.5 h-1.5 rounded-full ${iconColors.split(' ')[1].replace('text-', 'bg-')}`}></div>
                        <p className="text-xs text-text-secondary italic">{description}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Empty State Component
const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Icon name="Inbox" size={32} className="text-text-secondary" />
        </div>
        <p className="text-text-secondary text-center">{message}</p>
    </div>
);

export default DashboardV2;
