import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';
import ProfitLossIndicator from './ProfitLossIndicator';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

// Target Form Component
const TargetForm = ({ targets, onSave, onCancel, formatCurrency }) => {
    const [formData, setFormData] = useState(targets);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const inputFields = [
        {
            id: 'dailyRevenue',
            label: 'Target Pendapatan Harian',
            icon: 'DollarSign',
            color: 'blue',
            type: 'currency',
            placeholder: 'Masukkan target pendapatan',
            description: 'Target pendapatan yang ingin dicapai per hari'
        },
        {
            id: 'dailyTransactions',
            label: 'Target Transaksi Harian',
            icon: 'CheckCircle',
            color: 'emerald',
            type: 'number',
            placeholder: 'Masukkan jumlah transaksi',
            description: 'Jumlah transaksi yang ingin dicapai per hari'
        },
        {
            id: 'dailyExpenses',
            label: 'Limit Pengeluaran Harian',
            icon: 'TrendingDown',
            color: 'orange',
            type: 'currency',
            placeholder: 'Masukkan limit pengeluaran',
            description: 'Batas maksimal pengeluaran per hari'
        },
        {
            id: 'profitMargin',
            label: 'Target Margin Laba (%)',
            icon: 'Wallet',
            color: 'purple',
            type: 'percentage',
            placeholder: 'Masukkan persentase margin',
            description: 'Persentase margin laba yang diharapkan'
        }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {inputFields.map((field) => (
                <div key={field.id} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                        <div className={`p-1.5 bg-${field.color}-100 dark:bg-${field.color}-900/20 rounded-lg`}>
                            <Icon name={field.icon} size={16} className={`text-${field.color}-600`} />
                        </div>
                        {field.label}
                    </label>
                    <input
                        type="number"
                        value={formData[field.id]}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-text-primary placeholder:text-text-secondary"
                        min="0"
                        step={field.type === 'currency' ? '1000' : '1'}
                    />
                    <p className="text-xs text-text-secondary">{field.description}</p>
                    {field.type === 'currency' && (
                        <p className="text-xs font-medium text-primary">
                            Preview: {formatCurrency(formData[field.id])}
                        </p>
                    )}
                    {field.type === 'percentage' && (
                        <p className="text-xs font-medium text-primary">
                            Preview: {formData[field.id]}%
                        </p>
                    )}
                </div>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 text-text-primary font-medium rounded-lg transition-colors"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                    Simpan Target
                </button>
            </div>
        </form>
    );
};

const DesktopDashboardLayout = ({ dashboardData, theme }) => {
    const navigate = useNavigate();
    // State for chart filter
    const [chartFilter, setChartFilter] = useState('monthly'); // 'daily', 'weekly', 'monthly'

    // State for target settings modal
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [targets, setTargets] = useState({
        dailyRevenue: 1000000, // Default Rp 1.000.000
        dailyTransactions: 50,  // Default 50 transaksi
        dailyExpenses: 500000,  // Default Rp 500.000
        profitMargin: 30        // Default 30%
    });

    // Helper for currency
    const formatCurrency = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    };

    // 1. Prepare Top Metrics
    const metrics = useMemo(() => {
        return dashboardData?.dashboardMetrics || {};
    }, [dashboardData]);

    // Helper to safely parse numbers from strings
    // Handles both raw API numbers ("50000.00") and ID formatted currency ("Rp 50.000")
    const parseValue = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const str = val.toString();

        // If raw number string (e.g. "50000" or "50000.00")
        if (/^-?\d+(\.\d+)?$/.test(str)) {
            return parseFloat(str);
        }

        // Else assume ID format (Rp. 1.000,00) -> Remove dots, swap comma to dot
        const clean = str.replace(/\./g, '').replace(/[^0-9,-]/g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    };

    // Function to get filtered chart data based on selected period
    const getFilteredChartData = (filterType) => {
        if (!dashboardData?.transactions && !dashboardData?.expenses) return [];

        const now = new Date();
        const transactions = dashboardData?.transactions || [];
        const expenses = dashboardData?.expenses || [];

        if (filterType === 'daily') {
            // Show last 7 days
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                days.push(date);
            }

            return days.map(day => {
                const dayStr = format(day, 'dd MMM', { locale: id });
                const dayStart = new Date(day.setHours(0, 0, 0, 0));
                const dayEnd = new Date(day.setHours(23, 59, 59, 999));

                const dayIncome = transactions
                    .filter(t => {
                        const tDate = new Date(t.timestamp);
                        return tDate >= dayStart && tDate <= dayEnd && t.payment_method !== 'employee_meal';
                    })
                    .reduce((sum, t) => sum + parseValue(t.total), 0);

                const dayExpense = expenses
                    .filter(e => {
                        const eDate = new Date(e.date);
                        return eDate >= dayStart && eDate <= dayEnd;
                    })
                    .reduce((sum, e) => sum + parseValue(e.amount), 0);

                return { name: dayStr, income: dayIncome, expense: dayExpense };
            });
        } else if (filterType === 'weekly') {
            // Show last 4 weeks
            const weeks = [];
            for (let i = 3; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - (i * 7));
                const weekStart = startOfWeek(date, { locale: id });
                const weekEnd = endOfWeek(date, { locale: id });
                weeks.push({ start: weekStart, end: weekEnd });
            }

            return weeks.map((week, idx) => {
                const weekLabel = `Minggu ${idx + 1}`;

                const weekIncome = transactions
                    .filter(t => {
                        const tDate = new Date(t.timestamp);
                        return tDate >= week.start && tDate <= week.end && t.payment_method !== 'employee_meal';
                    })
                    .reduce((sum, t) => sum + parseValue(t.total), 0);

                const weekExpense = expenses
                    .filter(e => {
                        const eDate = new Date(e.date);
                        return eDate >= week.start && eDate <= week.end;
                    })
                    .reduce((sum, e) => sum + parseValue(e.amount), 0);

                return { name: weekLabel, income: weekIncome, expense: weekExpense };
            });
        } else {
            // Monthly - show last 6 months
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                months.push(date);
            }

            return months.map(month => {
                const monthStr = format(month, 'MMM', { locale: id });
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);

                const monthIncome = transactions
                    .filter(t => {
                        const tDate = new Date(t.timestamp);
                        return tDate >= monthStart && tDate <= monthEnd && t.payment_method !== 'employee_meal';
                    })
                    .reduce((sum, t) => sum + parseValue(t.total), 0);

                const monthExpense = expenses
                    .filter(e => {
                        const eDate = new Date(e.date);
                        return eDate >= monthStart && eDate <= monthEnd;
                    })
                    .reduce((sum, e) => sum + parseValue(e.amount), 0);

                return { name: monthStr, income: monthIncome, expense: monthExpense };
            });
        }
    };

    // 2. Prepare Chart Data based on filter
    const chartData = useMemo(() => {
        return getFilteredChartData(chartFilter);
    }, [dashboardData, chartFilter]);

    // 3. Prepare Donut Data (Payment Methods)
    const paymentMethodsData = useMemo(() => {
        if (!dashboardData?.transactions) return [];
        const distribution = dashboardData.transactions.reduce((acc, curr) => {
            const rawMethod = curr.payment_method || 'tunai';
            // Normalize to lowercase to prevent duplicates (e.g. 'Tunai' vs 'tunai')
            const method = rawMethod.toLowerCase();
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {});

        const colors = {
            'tunai': '#3454d1', // Primary
            'qris': '#25b865',  // Success
            'transfer': '#d13b4c', // Danger/Warn
            'bon': '#ffa21d'    // Warning
        };

        return Object.keys(distribution).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: distribution[key],
            color: colors[key] || '#888888'
        }));
    }, [dashboardData]);

    // 4. Recent Transactions Table
    const recentTransactions = useMemo(() => {
        if (dashboardData?.recentTransactions) return dashboardData.recentTransactions;
        if (!dashboardData?.transactions) return [];
        return [...dashboardData.transactions]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
    }, [dashboardData]);

    // Color definitions to match user request styles
    const colors = {
        primary: '#3454d1',
        success: '#25b865',
        warning: '#ffa21d',
        danger: '#d13b4c',
        dark: '#1e2022'
    };

    if (!dashboardData) return null;

    // Helper to calculate profit for the 4th card (Today's Profit)
    const calculateProfit = () => {
        const sales = parseValue(metrics.todaySales?.value);
        const expenses = parseValue(metrics.todayExpenses?.value);
        const profit = sales - expenses;
        return {
            value: formatCurrency(profit),
            change: '0%',
            trend: 'neutral'
        };
    };

    // Helper to parse 'change' string to number for progress bar (e.g. "+12%" -> 12)
    const getProgress = (metric) => {
        if (!metric?.change) return 0;
        const num = parseFloat(metric.change.replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? 0 : Math.abs(num);
    };

    // Calculate progress based on targets
    const calculateProgress = (current, target) => {
        if (!target || target === 0) return 0;
        const progress = (current / target) * 100;
        return Math.min(progress, 100); // Cap at 100%
    };

    // Handle save targets
    const handleSaveTargets = (newTargets) => {
        setTargets(newTargets);
        setIsTargetModalOpen(false);
        // TODO: Save to localStorage or API
        localStorage.setItem('dashboardTargets', JSON.stringify(newTargets));
    };

    // Load targets from localStorage on mount
    React.useEffect(() => {
        const savedTargets = localStorage.getItem('dashboardTargets');
        if (savedTargets) {
            setTargets(JSON.parse(savedTargets));
        }
    }, []);

    const incomeMetric = metrics.todaySales || { value: '0', change: '0%', trend: 'neutral' };
    const transactionMetric = metrics.totalTransactions || { value: '0', change: '0%', trend: 'neutral' };
    // Use todayExpenses instead of totalExpenses
    const expenseMetric = metrics.todayExpenses || { value: 'Rp 0', change: '0%', trend: 'neutral' };
    const profitMetric = calculateProfit();

    // Calculate actual progress values
    const revenueProgress = calculateProgress(parseValue(incomeMetric.value), targets.dailyRevenue);
    const transactionProgress = calculateProgress(parseInt(transactionMetric.value), targets.dailyTransactions);
    const expenseProgress = calculateProgress(parseValue(expenseMetric.value), targets.dailyExpenses);
    const profitProgress = calculateProgress(parseValue(profitMetric.value), (targets.dailyRevenue * targets.profitMargin) / 100);

    return (
        <div className="space-y-6">
            {/* Top Row: 4 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Card 1: Income */}
                <div className="bg-white dark:bg-slate-800 text-card-foreground rounded-2xl border border-gray-100/50 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    {/* Decorative blurred circle */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none bg-blue-400"></div>
                    {/* Ghost icon */}
                    <div className="absolute -left-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none text-slate-900 dark:text-white">
                        <Icon name="DollarSign" size={100} aria-hidden="true" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
                                    <Icon name="DollarSign" size={22} />
                                </div>
                                <div>
                                    <div className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        {incomeMetric.value || 'Rp 0'}
                                    </div>
                                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Pendapatan</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsTargetModalOpen(true)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg"
                                title="Atur Target"
                            >
                                <Icon name="Settings" size={16} className="text-text-secondary" />
                            </button>
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-xs mb-1">
                                <span className="text-text-secondary">Target Harian</span>
                                <span className="font-bold text-blue-600">{revenueProgress.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-blue-100 dark:bg-blue-900/20 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${revenueProgress}%` }}></div>
                            </div>
                            <div className="mt-1 text-xs text-text-secondary">
                                Target: {formatCurrency(targets.dailyRevenue)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Transactions (Success) */}
                <div className="bg-white dark:bg-slate-800 text-card-foreground rounded-2xl border border-gray-100/50 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    {/* Decorative blurred circle */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none bg-emerald-400"></div>
                    {/* Ghost icon */}
                    <div className="absolute -left-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none text-slate-900 dark:text-white">
                        <Icon name="CheckCircle" size={100} aria-hidden="true" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                                    <Icon name="CheckCircle" size={22} />
                                </div>
                                <div>
                                    <div className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        {transactionMetric.value || '0'}
                                    </div>
                                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Transaksi Sukses</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsTargetModalOpen(true)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg"
                                title="Atur Target"
                            >
                                <Icon name="Settings" size={16} className="text-text-secondary" />
                            </button>
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-xs mb-1">
                                <span className="text-text-secondary">Target</span>
                                <span className="font-bold text-emerald-600">{transactionProgress.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-emerald-100 dark:bg-emerald-900/20 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${transactionProgress}%` }}></div>
                            </div>
                            <div className="mt-1 text-xs text-text-secondary">
                                Target: {targets.dailyTransactions} transaksi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Expenses (Warning) */}
                <div className="bg-white dark:bg-slate-800 text-card-foreground rounded-2xl border border-gray-100/50 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    {/* Decorative blurred circle */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none bg-orange-400"></div>
                    {/* Ghost icon */}
                    <div className="absolute -left-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none text-slate-900 dark:text-white">
                        <Icon name="TrendingDown" size={100} aria-hidden="true" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner group-hover:scale-110 transition-transform">
                                    <Icon name="TrendingDown" size={22} />
                                </div>
                                <div>
                                    <div className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        {expenseMetric.value || 'Rp 0'}
                                    </div>
                                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Pengeluaran</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsTargetModalOpen(true)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg"
                                title="Atur Target"
                            >
                                <Icon name="Settings" size={16} className="text-text-secondary" />
                            </button>
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-xs mb-1">
                                <span className="text-text-secondary">Limit</span>
                                <span className="font-bold text-orange-600">{expenseProgress.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-orange-100 dark:bg-orange-900/20 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${expenseProgress}%` }}></div>
                            </div>
                            <div className="mt-1 text-xs text-text-secondary">
                                Limit: {formatCurrency(targets.dailyExpenses)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 4: Net Profit (Purple for profit) */}
                <div className="bg-white dark:bg-slate-800 text-card-foreground rounded-2xl border border-gray-100/50 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    {/* Decorative blurred circle */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none bg-purple-400"></div>
                    {/* Ghost icon */}
                    <div className="absolute -left-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none text-slate-900 dark:text-white">
                        <Icon name="Wallet" size={100} aria-hidden="true" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
                                    <Icon name="Wallet" size={22} />
                                </div>
                                <div>
                                    <div className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        {profitMetric.value || 'Rp 0'}
                                    </div>
                                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Laba Bersih</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsTargetModalOpen(true)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg"
                                title="Atur Target"
                            >
                                <Icon name="Settings" size={16} className="text-text-secondary" />
                            </button>
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-xs mb-1">
                                <span className="text-text-secondary">Margin</span>
                                <span className="font-bold text-purple-600">{profitProgress.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-purple-100 dark:bg-purple-900/20 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${profitProgress}%` }}></div>
                            </div>
                            <div className="mt-1 text-xs text-text-secondary">
                                Target Margin: {targets.profitMargin}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Middle Section: Chart and Stats */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Graph */}
                <div className="xl:col-span-2 bg-card text-card-foreground rounded-xl border border-border shadow-sm">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h5 className="font-bold text-lg">Analisis Keuangan</h5>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setChartFilter('daily')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${chartFilter === 'daily'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-muted text-text-secondary hover:bg-muted/80'
                                    }`}
                            >
                                Harian
                            </button>
                            <button
                                onClick={() => setChartFilter('weekly')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${chartFilter === 'weekly'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-muted text-text-secondary hover:bg-muted/80'
                                    }`}
                            >
                                Mingguan
                            </button>
                            <button
                                onClick={() => setChartFilter('monthly')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${chartFilter === 'monthly'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-muted text-text-secondary hover:bg-muted/80'
                                    }`}
                            >
                                Bulanan
                            </button>
                        </div>
                    </div>
                    <div className="p-6 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3454d1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3454d1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d13b4c" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#d13b4c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}M`;
                                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}Jt`;
                                        if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                                        return value;
                                    }}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Area type="monotone" dataKey="income" stroke="#3454d1" fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" stroke="#d13b4c" fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Side Stats Card (Total Sales Style) */}
                <div className="xl:col-span-1 bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-primary p-6 text-white relative overflow-hidden flex-shrink-0">
                        <div className="relative z-10">
                            <span className="float-right bg-white/20 backdrop-blur-md px-2 py-1 rounded text-xs font-bold">+12%</span>
                            <h4 className="text-3xl font-bold mb-1">{transactionMetric.value || 0}</h4>
                            <p className="text-blue-100 text-sm">Total Penjualan</p>
                        </div>
                        {/* Decorative Circles */}
                        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center gap-6">
                        {/* Detailed Stats Items */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <Icon name="Coffee" size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h6 className="font-bold text-sm">Menu Terlaris</h6>
                                    <span className="text-xs text-text-secondary">Makanan</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">{dashboardData?.todayStats?.bestSeller?.name || '-'}</div>
                                <span className="text-xs text-text-secondary">{dashboardData?.todayStats?.bestSeller?.count || 0} porsi</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-border border-dashed"></div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <Icon name="Users" size={20} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h6 className="font-bold text-sm">Pelanggan</h6>
                                    <span className="text-xs text-text-secondary">Hari Ini</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">{dashboardData?.todayStats?.transactions || 0}</div>
                                <span className="text-xs text-text-secondary">Transaksi</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-border border-dashed"></div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <Icon name="TrendingUp" size={20} className="text-purple-600" />
                                </div>
                                <div>
                                    <h6 className="font-bold text-sm">Rata-rata Transaksi</h6>
                                    <span className="text-xs text-text-secondary">Hari Ini</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">{formatCurrency(dashboardData?.todayStats?.averageOrder || 0)}</div>
                                <span className="text-xs text-text-secondary">per order</span>
                            </div>
                        </div>
                    </div>
                    <div
                        onClick={() => navigate('/laporan')}
                        className="bg-muted/50 p-4 text-center text-xs font-bold uppercase tracking-wider text-text-secondary cursor-pointer hover:bg-muted transition-colors"
                    >
                        Lihat Detail Lengkap
                    </div>
                </div>
            </div>

            {/* Audit & Quick Shortcut Row */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Audit Summary Card */}
                <div className="xl:col-span-1 bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
                    <div className="p-5 border-b border-border flex justify-between items-center bg-gradient-to-r from-purple-500/5 to-blue-500/5">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <Icon name="ShieldCheck" size={18} />
                            </div>
                            <h5 className="font-bold text-base">Audit Saldo Kas</h5>
                        </div>
                        <button
                            onClick={() => navigate('/auditor')}
                            className="text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1 group/btn"
                        >
                            Detail
                            <Icon name="ArrowRight" size={10} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                        {dashboardData?.auditData ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-secondary font-medium">Akurasi Kas</span>
                                    <span className={`text-base font-black ${dashboardData.auditData.isAccurate ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isNaN(parseFloat(dashboardData.auditData.accuracy)) ? '0' : dashboardData.auditData.accuracy}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${dashboardData.auditData.isAccurate ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                        style={{ width: `${isNaN(parseFloat(dashboardData.auditData.accuracy)) ? 0 : dashboardData.auditData.accuracy}%` }}
                                    ></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="p-2.5 bg-muted/50 rounded-xl space-y-0.5">
                                        <p className="text-[9px] font-black text-text-secondary uppercase tracking-tight">Selisih</p>
                                        <p className={`text-xs font-bold ${dashboardData.auditData.gap === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(dashboardData.auditData.gap)}
                                        </p>
                                    </div>
                                    <div className="p-2.5 bg-muted/50 rounded-xl space-y-0.5">
                                        <p className="text-[9px] font-black text-text-secondary uppercase tracking-tight">Status</p>
                                        <p className="text-xs font-bold text-text-primary">
                                            {dashboardData.auditData.isAccurate ? '✓ Aman' : '⚠ Cek'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-text-secondary">
                                    <Icon name="Activity" size={20} />
                                </div>
                                <p className="text-[10px] text-text-secondary font-bold uppercase">Audit hari ini kosong</p>
                                <button
                                    onClick={() => navigate('/auditor')}
                                    className="text-[10px] font-black text-primary uppercase"
                                >
                                    Mulai Audit →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Link Card - Just for better UI balance */}
                <div className="xl:col-span-3 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl border border-blue-200/20 shadow-sm p-6 flex items-center justify-between group">
                    <div className="space-y-2">
                        <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Analisis Keuangan Cepat</h4>
                        <p className="text-sm text-text-secondary max-w-md">Lakukan pemantauan transaksi, stok bahan baku, dan pengeluaran operasional secara real-time untuk menjaga kesehatan bisnis Anda.</p>
                        <div className="flex gap-4 pt-2">
                            <button onClick={() => navigate('/transaksi')} className="text-sm font-bold text-blue-600 hover:underline">Kasir</button>
                            <button onClick={() => navigate('/transaction-history')} className="text-sm font-bold text-purple-600 hover:underline">Riwayat</button>
                            <button onClick={() => navigate('/settings')} className="text-sm font-bold text-text-secondary hover:underline">Pengaturan</button>
                        </div>
                    </div>
                    <div className="hidden lg:block">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform duration-500">
                            <Icon name="Zap" size={40} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Leads Overview (Donut) */}
                <div className="xl:col-span-1 bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h5 className="font-bold text-lg">Metode Pembayaran</h5>
                        <Icon name="MoreVertical" size={16} className="text-text-secondary" />
                    </div>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethodsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {paymentMethodsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [value + ' Transaksi', 'Jumlah']} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold">{dashboardData?.transactions?.length || 0}</span>
                            <span className="text-xs text-text-secondary">Total</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {paymentMethodsData.map((method, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: method.color }}></span>
                                <span className="text-sm text-text-secondary">{method.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Latest Leads (Table) */}
                <div className="xl:col-span-2 bg-card text-card-foreground rounded-xl border border-border shadow-sm p-0 overflow-hidden">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h5 className="font-bold text-lg">Transaksi Terbaru</h5>
                        <div className="flex gap-2 text-text-secondary">
                            <Icon name="MoreVertical" size={16} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-text-secondary font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">ID Transaksi</th>
                                    <th className="px-6 py-4">Metode</th>
                                    <th className="px-6 py-4">Waktu</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentTransactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-text-primary">
                                            #{tx.id}
                                            <span className="block text-xs text-text-secondary font-normal">Warung</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs font-medium">
                                                {tx.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary">
                                            {format(new Date(tx.timestamp), 'dd MMM HH:mm', { locale: id })}
                                        </td>
                                        <td className="px-6 py-4 font-bold">
                                            {formatCurrency(tx.total)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                Selesai
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {recentTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-text-secondary">
                                            Belum ada data transaksi
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Target Settings Modal */}
            {isTargetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsTargetModalOpen(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-card text-card-foreground rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Icon name="Target" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Pengaturan Target</h2>
                                        <p className="text-blue-100 text-sm">Atur target harian untuk dashboard Anda</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsTargetModalOpen(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <Icon name="X" size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            <TargetForm
                                targets={targets}
                                onSave={handleSaveTargets}
                                onCancel={() => setIsTargetModalOpen(false)}
                                formatCurrency={formatCurrency}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Profit/Loss Indicator - Bottom (Desktop) */}
            <div className="mt-8 pb-10">
                <ProfitLossIndicator
                    revenue={dashboardData.metrics?.totalRevenue || 0}
                    expenses={dashboardData.metrics?.totalExpenses || 0}
                    periodLabel={dashboardData.settings?.last_closing_date ? 'Periode Ini' : 'Bulan Ini'}
                />
            </div>
        </div>
    );
};

export default DesktopDashboardLayout;
