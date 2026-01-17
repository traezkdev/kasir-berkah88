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
        return (
            <div className="flex bg-background min-h-screen items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen text-foreground ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>

            {theme === 'default' && (
                userRole === 'owner' ? (
                    <OwnerNavigationHeader
                        onToggleSidebar={toggleSidebar}
                        headerTitle="Analisis Bisnis"
                    />
                ) : (
                    <NavigationHeader
                        isCollapsed={isSidebarCollapsed}
                        onToggleSidebar={toggleSidebar}
                        headerTitle="Analisis Bisnis"
                    />
                )
            )}

            <main className={`${theme === 'default' ? 'pt-20 lg:pt-16' : ''} pb-24 lg:pb-8`}>
                <div className="p-4 md:p-6 space-y-8 max-w-[1600px] mx-auto w-full">

                    {/* --- Filter Section --- */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-card p-4 rounded-xl shadow-sm border border-border gap-4 md:gap-0">
                        <div className="w-full md:w-auto">
                            <h2 className="text-xl font-bold mb-1">Periode Analisis</h2>
                            <p className="text-sm text-muted-foreground">Pilih rentang tanggal untuk melihat breakdown data.</p>
                        </div>
                        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3 w-full md:w-auto">
                            <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:flex md:items-end md:gap-4">
                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold mb-1 text-muted-foreground">Dari Tanggal</label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full md:w-36 text-sm px-2"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold mb-1 text-muted-foreground">Sampai Tanggal</label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full md:w-36 text-sm px-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:flex md:items-center gap-2 mt-2 md:mt-0">
                                <button
                                    onClick={fetchData}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all h-[38px] flex justify-center items-center"
                                >
                                    Terapkan
                                </button>
                                <button
                                    onClick={handleSetAllTime}
                                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all h-[38px] whitespace-nowrap flex justify-center items-center"
                                >
                                    Semua Waktu
                                </button>
                            </div>

                            {/* Export Button with Dropdown */}
                            {data && (
                                <div className="relative mt-2 md:mt-auto w-full md:w-auto">
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all h-[38px] w-full md:w-auto whitespace-nowrap"
                                        title="Export Data"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        Export Data
                                    </button>

                                    {showExportMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setShowExportMenu(false)}
                                            ></div>
                                            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <button
                                                    onClick={() => {
                                                        handleExportExcel();
                                                        setShowExportMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors border-b border-border/50"
                                                >
                                                    <span className="text-green-600"><FileDown size={16} /></span>
                                                    Export Excel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleExportPDF();
                                                        setShowExportMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
                                                >
                                                    <span className="text-red-600"><FileDown size={16} /></span>
                                                    Export PDF
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    {data && (
                        <>
                            {/* --- Summary Cards --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <SummaryCard
                                    title="Total Pendapatan"
                                    value={formatCurrency(data.summary.totalRevenue)}
                                    icon={<TrendingUp className="text-green-500" />}
                                    colorClass="text-green-600 dark:text-green-400"
                                />
                                <SummaryCard
                                    title="Total Pengeluaran"
                                    value={formatCurrency(data.summary.totalExpense)}
                                    icon={<TrendingDown className="text-red-500" />}
                                    colorClass="text-red-600 dark:text-red-400"
                                />
                                <SummaryCard
                                    title="Laba Bersih"
                                    value={formatCurrency(data.summary.netIncome)}
                                    icon={<DollarSign className="text-blue-500" />}
                                    colorClass="text-blue-600 dark:text-blue-400"
                                    desc="Pendapatan - Pengeluaran"
                                />
                                <SummaryCard
                                    title="Total Transaksi"
                                    value={data.sales.totalTransactions}
                                    icon={<ShoppingBag className="text-purple-500" />}
                                    colorClass="text-purple-600 dark:text-purple-400"
                                    isCurrency={false}
                                />
                            </div>

                            {/* --- Visualizations --- */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Top Selling Chart */}
                                <Card className="shadow-lg border-border/50">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <ShoppingBag className="w-5 h-5 text-primary" />
                                            Top 5 Item Terlaris
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                layout="vertical"
                                                data={data.sales.topSellingItems.slice(0, 5)}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                                <XAxis type="number" />
                                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                                                    itemStyle={{ color: 'var(--color-text-primary)' }}
                                                    formatter={(value) => [value, 'Terjual']}
                                                />
                                                <Bar dataKey="quantity" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                                    {data.sales.topSellingItems.slice(0, 5).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Expense Categories Chart */}
                                <Card className="shadow-lg border-border/50">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <TrendingDown className="w-5 h-5 text-red-500" />
                                            Pengeluaran berdasarkan Kategori
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[350px]">
                                        {data.expenses.byCategory && data.expenses.byCategory.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={data.expenses.byCategory}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={100}
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
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-muted-foreground text-center">
                                                    Tidak ada data pengeluaran untuk periode ini
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* --- Tables --- */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Detail Top Selling */}
                                <Card className="shadow-lg border-border/50">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Detail Penjualan Item</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted text-muted-foreground sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 rounded-tl-md">Nama Item</th>
                                                        <th className="px-3 py-2 text-center">Qty</th>
                                                        <th className="px-3 py-2 text-right rounded-tr-md">Total Pendapatan</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.sales.topSellingItems.map((item, idx) => (
                                                        <tr key={idx} className="border-b border-border hover:bg-muted/30">
                                                            <td className="px-3 py-2 font-medium">{item.name}</td>
                                                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                                                            <td className="px-3 py-2 text-right text-green-600 dark:text-green-400 font-medium">
                                                                {formatCurrency(item.revenue)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {data.sales.topSellingItems.length === 0 && (
                                                        <tr><td colSpan="3" className="text-center py-4 text-muted-foreground">Tidak ada data penjualan</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Top Expenses List */}
                                <Card className="shadow-lg border-border/50">
                                    <CardHeader>
                                        <CardTitle className="text-lg">10 Pengeluaran Terbesar</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted text-muted-foreground sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 rounded-tl-md">Deskripsi</th>
                                                        <th className="px-3 py-2">Kategori</th>
                                                        <th className="px-3 py-2 text-right rounded-tr-md">Jumlah</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.expenses.topExpenses.map((exp, idx) => (
                                                        <tr key={idx} className="border-b border-border hover:bg-muted/30">
                                                            <td className="px-3 py-2 font-medium">
                                                                <div className="flex flex-col">
                                                                    <span>{exp.name}</span>
                                                                    <span className="text-xs text-muted-foreground">{format(new Date(exp.date), 'dd/MM/yyyy')}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                                                                    {exp.category || 'Umum'}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-red-600 dark:text-red-400 font-medium">
                                                                {formatCurrency(exp.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {data.expenses.topExpenses.length === 0 && (
                                                        <tr><td colSpan="3" className="text-center py-4 text-muted-foreground">Tidak ada data pengeluaran</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* --- Payment Methods (Initiative) --- */}
                            <Card className="shadow-lg border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-blue-500" />
                                        Breakdown Metode Pembayaran
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {data.sales.paymentMethods.map((pm, idx) => (
                                            <div key={idx} className="bg-background border border-border p-4 rounded-lg flex flex-col items-center">
                                                <h3 className="text-md font-semibold capitalize">{pm.payment_method}</h3>
                                                <div className="text-2xl font-bold mt-2">{pm.count} <span className="text-sm font-normal text-muted-foreground">Transaksi</span></div>
                                                <div className="text-sm font-medium mt-1 text-primary">{formatCurrency(pm.total)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

// Sub-component for simple card
// Sub-component for simple card
const SummaryCard = ({ title, value, icon, colorClass, desc, isCurrency = true }) => {
    return (
        <Card className="shadow-md border-border/60 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className={`p-3 rounded-full bg-secondary/50 shrink-0`}>
                        {icon}
                    </div>
                </div>
                <div>
                    <h3 className={`text-2xl font-bold ${colorClass} break-words`}>
                        {value}
                    </h3>
                    {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
                </div>
            </CardContent>
        </Card>
    );
};

export default AnalisisData;
