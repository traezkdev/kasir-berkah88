import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BreadcrumbNavigation from '../../../components/ui/BreadcrumbNavigation';
import DateRangeSelector from './DateRangeSelector';
import StockReportSection from './StockReportSection';
import SalesReportSection from './SalesReportSection';
import ExpenseReportSection from './ExpenseReportSection';
import EmployeeMealReportSection from './EmployeeMealReportSection';
import ReconciliationReportSection from './ReconciliationReportSection';
import RawMaterialReportSection from './RawMaterialReportSection';
import CombinedAnalyticsSection from './CombinedAnalyticsSection';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import AdminMobileHeader from '../../../components/ui/AdminMobileHeader';
import CardTemplate2 from '../../../components/ui/CardTemplate2';
import authFetch from '../../../utils/authFetch';
import { formatInTimeZone } from 'date-fns-tz';
import { exportToExcel, exportToPdf, prepareCombinedDataForExport } from '../../../utils/exportUtils';
import { useTheme } from '../../../contexts/ThemeContext';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const apiUrl = import.meta.env.VITE_API_URL;

const BusinessReportView = ({ headerTitle, isOwner = false }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [selectedDateRange, setSelectedDateRange] = useState(() => {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return {
            startDate: start,
            endDate: end,
            range: 'today'
        };
    });
    const [transactions, setTransactions] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [reconciliations, setReconciliations] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [units, setUnits] = useState([]);
    const [settings, setSettings] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                setUserRole(decodedToken.role);
            } catch (e) {
                console.error("Error decoding token:", e);
            }
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            let decodedRole = userRole;
            if (!decodedRole && token) {
                try {
                    const decodedToken = JSON.parse(atob(token.split('.')[1]));
                    decodedRole = decodedToken.role;
                } catch (e) { }
            }

            const canAccessOwner = decodedRole === 'admin' || decodedRole === 'owner';

            try {
                const [transRes, menuRes, expenseRes, settingsRes, reconciliationRes, rawMaterialsRes, unitsRes, lapakRes, ownerRes] = await Promise.all([
                    authFetch(`${apiUrl}/api/transactions/all`),
                    authFetch(`${apiUrl}/api/menu-items/all`),
                    authFetch(`${apiUrl}/api/expenses/all`),
                    authFetch(`${apiUrl}/api/all-settings`),
                    authFetch(`${apiUrl}/api/cash-reconciliation/history?limit=1000`),
                    authFetch(`${apiUrl}/api/raw-materials`),
                    authFetch(`${apiUrl}/api/units`),
                    authFetch(`${apiUrl}/api/accounts/lapak_deposit`),
                    canAccessOwner ? authFetch(`${apiUrl}/api/accounts/owner_deposit`) : Promise.resolve({ json: () => ({ message: 'not_authorized' }) })
                ]);

                const transData = await transRes.json();
                const menuData = await menuRes.json();
                const expenseData = await expenseRes.json();
                const settingsData = await settingsRes.json();
                const reconciliationData = await reconciliationRes.json();

                if (transData.message === 'success') {
                    setTransactions(transData.data.map(t => ({ ...t, timestamp: new Date(t.timestamp) })));
                }
                if (menuData.message === 'success') {
                    setMenuItems(menuData.data);
                }
                if (expenseData.message === 'success') {
                    setExpenses(expenseData.data.map(e => ({ ...e, date: new Date(e.date) })));
                }
                if (settingsData.message === 'success') {
                    setSettings(settingsData.data);
                }

                if (reconciliationData.message === 'success' || reconciliationData.data) {
                    setReconciliations(reconciliationData.data || []);
                }

                const rawMaterialsData = await rawMaterialsRes.json();
                if (rawMaterialsData.message === 'success') {
                    setRawMaterials(rawMaterialsData.data);
                }

                const unitsData = await unitsRes.json();
                if (unitsData.message === 'success') {
                    setUnits(unitsData.data);
                }

                // Temporary variables for account balances
                let lapakBalance = 0;
                let ownerBalance = 0;

                const lapakData = await lapakRes.json();
                if (lapakData.message === 'success') {
                    lapakBalance = parseFloat(lapakData.data.account.balance || 0);
                }

                const ownerData = await ownerRes.json();
                if (ownerData.message === 'success') {
                    ownerBalance = parseFloat(ownerData.data.account.balance || 0);
                }

                // Store balances for processReportData
                setReportData(prev => ({
                    ...prev,
                    balances: { lapakBalance, ownerBalance }
                }));
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const processReportData = () => {
            const filterByDate = (item) => {
                const itemDate = new Date(item.timestamp || item.date);
                const startDate = selectedDateRange.startDate;
                const endDate = selectedDateRange.endDate;
                return itemDate >= startDate && itemDate <= endDate;
            };

            const filteredTransactions = transactions.filter(filterByDate);
            const filteredExpenses = expenses.filter(filterByDate);
            const filteredReconciliations = reconciliations.filter(filterByDate);

            // Sales Report Data
            const totalRevenue = filteredTransactions.filter(t => t.payment_method !== 'employee_meal').reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
            const totalTransactions = filteredTransactions.length;
            const averageOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

            const topItems = filteredTransactions
                .flatMap(t => {
                    try {
                        const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
                        return Array.isArray(items) ? items : [];
                    } catch (e) {
                        console.error("Failed to parse transaction items:", e);
                        return [];
                    }
                })
                .reduce((acc, item) => {
                    const existing = acc.find(i => i.name === item.name);
                    const itemPrice = parseFloat(item.price || 0);
                    if (existing) {
                        existing.sold += item.quantity;
                        existing.revenue += item.quantity * itemPrice;
                    } else {
                        acc.push({ name: item.name, sold: item.quantity, revenue: item.quantity * itemPrice });
                    }
                    return acc;
                }, [])
                .sort((a, b) => b.revenue - a.revenue);

            // Stock Report Data
            let totalItemsSold = 0;
            let totalValueSold = 0;
            const itemsSoldMap = new Map();

            filteredTransactions.forEach(t => {
                try {
                    const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
                    if (Array.isArray(items)) {
                        items.forEach(item => {
                            const itemPrice = parseFloat(item.price || 0);
                            const quantity = item.quantity || 0;
                            totalItemsSold += quantity;
                            totalValueSold += quantity * itemPrice;
                            if (itemsSoldMap.has(item.name)) {
                                const existing = itemsSoldMap.get(item.name);
                                existing.sold += quantity;
                                existing.revenue += quantity * itemPrice;
                            } else {
                                itemsSoldMap.set(item.name, { name: item.name, sold: quantity, revenue: quantity * itemPrice });
                            }
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse transaction items for stock report:", e);
                }
            });

            const currentLowStockItems = menuItems.filter(i => (Number(i.stock) || 0) <= 5);
            const currentStockValue = menuItems.reduce((sum, item) => {
                const stock = Number(item?.stock || 0);
                const price = Number(item?.price || 0);
                if (stock <= 0 || price <= 0) return sum;
                return sum + (stock * price);
            }, 0);

            // Expense Report Data
            const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            const expenseCategories = [...new Set(filteredExpenses.map(e => e.category))].length;

            // Employee Meals Data
            const employeeMealsTransactions = transactions.filter(t => t.payment_method === 'employee_meal' && filterByDate(t));
            let totalItemsServedInEmployeeMeals = 0;
            let estimatedValueEmployeeMeals = 0;
            const employeeMealItems = [];

            employeeMealsTransactions.forEach(t => {
                try {
                    const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
                    if (Array.isArray(items)) {
                        items.forEach(item => {
                            const itemPrice = parseFloat(item.price || 0);
                            const quantity = item.quantity || 0;
                            totalItemsServedInEmployeeMeals += quantity;
                            estimatedValueEmployeeMeals += quantity * itemPrice;
                            employeeMealItems.push({
                                date: formatInTimeZone(new Date(t.timestamp), 'Asia/Jakarta', 'dd/MM/yyyy'),
                                name: item.name,
                                quantity: quantity,
                                estimatedValue: quantity * itemPrice
                            });
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse transaction items for employee meals:", e);
                }
            });

            const startOfDayStartDate = new Date(selectedDateRange.startDate);
            const endOfDayEndDate = new Date(selectedDateRange.endDate);
            const diffTime = Math.abs(endOfDayEndDate.getTime() - startOfDayStartDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const averageDailyExpenses = diffDays > 0 ? totalExpenses / diffDays : 0;

            // Working Capital
            const initialCapital = parseFloat(settings?.initial_capital);
            const initialCapitalDate = settings?.initial_capital_date ? new Date(settings.initial_capital_date) : null;
            let workingCapital = 0;

            if (!isNaN(initialCapital)) {
                const relevantTransactions = initialCapitalDate
                    ? transactions.filter(t => new Date(t.timestamp) >= initialCapitalDate)
                    : transactions;
                const relevantExpenses = initialCapitalDate
                    ? expenses.filter(e => new Date(e.date) >= initialCapitalDate)
                    : expenses;
                const revenueSinceDate = relevantTransactions
                    .filter(t => t.payment_method !== 'employee_meal')
                    .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
                const expensesSinceDate = relevantExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
                workingCapital = initialCapital + revenueSinceDate - expensesSinceDate;
            }

            // Raw Materials Metrics
            const isUnitCalculable = (unitName) => {
                const unit = units.find(u => u.name.toLowerCase() === (unitName || '').toLowerCase());
                return unit ? unit.is_calculable : true;
            };

            const totalMenuStockValueRaw = rawMaterials.reduce((sum, material) => {
                const isCalculable = isUnitCalculable(material.unit);
                const menuStock = parseFloat(material.menu_stock || 0);
                const pricePerItem = parseFloat(material.price_per_item || 0);
                if (menuStock <= 0 || pricePerItem <= 0) return sum;
                return isCalculable ? sum + (menuStock * pricePerItem) : sum + pricePerItem;
            }, 0);

            const totalStockValueRaw = rawMaterials.reduce((sum, material) => {
                const isCalculable = isUnitCalculable(material.unit);
                const menuStock = parseFloat(material.menu_stock || 0);
                const currentStock = parseFloat(material.current_stock || 0);
                const pricePerItem = parseFloat(material.price_per_item || 0);
                const rawStockPrice = parseFloat(material.raw_stock_price || 0);

                let value = 0;
                if (isCalculable) {
                    value = (menuStock > 0 ? menuStock * pricePerItem : 0) + (currentStock > 0 ? currentStock * rawStockPrice : 0);
                } else {
                    value = (menuStock > 0 ? pricePerItem : 0) + (currentStock > 0 ? rawStockPrice : 0);
                }
                return sum + value;
            }, 0);

            const currentRawMaterialStockValueProcessed = rawMaterials.reduce((sum, material) => {
                const isCalculable = isUnitCalculable(material.unit);
                const currentStock = parseFloat(material.current_stock || 0);
                const rawStockPrice = parseFloat(material.raw_stock_price || 0);
                if (currentStock <= 0 || rawStockPrice <= 0) return sum;
                return isCalculable ? sum + (currentStock * rawStockPrice) : sum + rawStockPrice;
            }, 0);

            const lowStockRawCount = rawMaterials.filter(material =>
                (Number(material.current_stock) + Number(material.menu_stock)) < Number(material.stok_minimum)
            ).length;

            setReportData({
                sales: { totalRevenue, totalTransactions, averageOrder, topItems, initialCapital: !isNaN(initialCapital) ? initialCapital : 0, workingCapital },
                stock: { totalValue: totalValueSold, totalItems: totalItemsSold, lowStockItems: currentLowStockItems.length, currentStockValue, items: Array.from(itemsSoldMap.values()), lowStock: currentLowStockItems },
                expenses: { summary: { totalExpenses, categories: expenseCategories, averageDaily: averageDailyExpenses }, items: filteredExpenses },
                employeeMeals: { summary: { totalMeals: employeeMealsTransactions.length, totalItemsServed: totalItemsServedInEmployeeMeals, estimatedValue: estimatedValueEmployeeMeals }, items: employeeMealItems },
                reconciliations: filteredReconciliations,
                balances: reportData?.balances || { lapakBalance: 0, ownerBalance: 0 },
                allTime: {
                    totalRevenue: transactions.filter(t => t.payment_method !== 'employee_meal').reduce((sum, t) => sum + parseFloat(t.total || 0), 0),
                    totalExpenses: expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                },
                rawMetrics: {
                    totalMenuStockValue: totalMenuStockValueRaw,
                    totalStockValue: totalStockValueRaw,
                    lowStockRawCount,
                    currentRawMaterialStockValue: currentRawMaterialStockValueProcessed,
                    rawMaterials: rawMaterials // Include rawMaterials for the list
                }
            });
        };

        processReportData();
    }, [transactions, menuItems, expenses, settings, selectedDateRange, isLoading]);

    // NEW: Fetch high-precision audit data when date range changes
    useEffect(() => {
        const fetchPrecisionData = async () => {
            if (isLoading) return;
            try {
                // Ensure we use the correct date format for API
                const startStr = formatInTimeZone(selectedDateRange.startDate, 'Asia/Jakarta', 'yyyy-MM-dd');
                const endStr = formatInTimeZone(selectedDateRange.endDate, 'Asia/Jakarta', 'yyyy-MM-dd');

                const res = await authFetch(`${apiUrl}/api/audit/calculate-accuracy?startDate=${startStr}&endDate=${endStr}`);
                const precision = await res.json();

                if (precision.message === 'success') {
                    setReportData(prev => ({
                        ...prev,
                        precision: precision.data
                    }));
                }
            } catch (err) {
                console.error("Error fetching precision audit data:", err);
            }
        };
        fetchPrecisionData();
    }, [selectedDateRange, isLoading]);

    const handleDateRangeChange = (dateRange) => {
        setSelectedDateRange(dateRange);
    };

    const handleClearData = async () => {
        if (password !== 'berkah88') {
            setError('Kata sandi salah!');
            return;
        }
        try {
            const response = await authFetch(`${apiUrl}/api/transactions`, { method: 'DELETE' });
            const result = await response.json();
            if (result.message === 'all deleted') {
                setTransactions([]);
                setIsModalOpen(false);
                setPassword('');
                setError('');
            } else {
                setError('Gagal menghapus data.');
            }
        } catch (err) {
            setError('Terjadi kesalahan jaringan.');
        }
    };

    const handleExportCombinedData = async (format) => {
        if (!reportData) return;
        setIsExporting(true);
        try {
            const startDateStr = formatInTimeZone(selectedDateRange.startDate, 'Asia/Jakarta', 'dd-MM-yyyy');
            const endDateStr = formatInTimeZone(selectedDateRange.endDate, 'Asia/Jakarta', 'dd-MM-yyyy');
            const filename = `Laporan_Bisnis_Gabungan_${startDateStr}_sd_${endDateStr}`;

            const preparedData = prepareCombinedDataForExport(reportData, units);
            if (format === 'excel') {
                exportToExcel(preparedData, filename);
            } else if (format === 'pdf') {
                exportToPdf(preparedData, filename, selectedDateRange);
            }
        } catch (error) {
            console.error('Error exporting combined data:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full">
            <AdminMobileHeader
                title={headerTitle || "Laporan Bisnis"}
                subtitle="Analisis Komprehensif"
                badgeText="BIZ REPORTS"
                decorativeIcon="TrendingUp"
                showNotificationBell={false}
                rightIcon="Home"
                onRightAction={() => navigate('/owner-dashboard')}
                actions={[
                    {
                        label: 'Analisis Data',
                        icon: 'BarChart3',
                        onClick: () => navigate('/analisis-data')
                    },
                    {
                        label: 'Export Laporan',
                        icon: 'DownloadCloud',
                        color: 'success',
                        onClick: () => setIsExportMenuOpen(true)
                    }
                ]}
            />

            <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 mt-6 lg:mt-0" : "px-4"}>
                {/* Desktop-Only Premium Content Header */}
                <div className="hidden lg:block mb-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <BreadcrumbNavigation />
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white mt-4 tracking-tighter uppercase font-black">
                                {headerTitle || "Laporan Bisnis"}
                            </h1>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-2 opacity-70">
                                Business Insight & Performance Analytics
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/analisis-data')}
                                className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                            >
                                <Icon name="BarChart3" size={16} strokeWidth={2.5} className="text-primary" />
                                <span>Analisis Data</span>
                            </button>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-3 px-6 py-3 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-95"
                            >
                                <Icon name="Trash2" size={16} strokeWidth={2.5} />
                                <span>Reset Data</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Date Range Selector */}
                <DateRangeSelector
                    onDateRangeChange={handleDateRangeChange}
                    selectedRange={selectedDateRange?.range}
                />

                {isLoading ? (
                    <div className="text-center py-16">
                        <p className="text-text-secondary">Memuat data laporan...</p>
                    </div>
                ) : reportData ? (
                    <div className="space-y-8 mt-6">
                        {/* Statistics Overview Section */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                                    <Icon name="BarChart3" className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Ringkasan Statistik</h2>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">Visualisasi data periode yang dipilih</p>
                                </div>
                            </div>
                            {/* ... sisanya tetap sama ... */}

                            {/* Summary Cards (Using Premium Template 2) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <CardTemplate2
                                    title="Total Transaksi"
                                    value={reportData?.sales?.totalTransactions || 0}
                                    icon="ShoppingCart"
                                    description="Total pesanan periode ini"
                                    color="primary"
                                    badgeText="TRX"
                                    trend={{ type: 'neutral', value: 'Periode Ini' }}
                                />
                                <CardTemplate2
                                    title="Total Pendapatan"
                                    value={`Rp ${(reportData?.sales?.totalRevenue || 0).toLocaleString()}`}
                                    icon="DollarSign"
                                    description="Total bruto penjualan"
                                    color="success"
                                    badgeText="REV"
                                    trend={{ type: 'up', value: 'Sales' }}
                                />
                                <CardTemplate2
                                    title="Total Pengeluaran"
                                    value={`Rp ${(reportData?.expenses?.summary?.totalExpenses || 0).toLocaleString()}`}
                                    icon="Receipt"
                                    description="Biaya operasional & stok"
                                    color="warning"
                                    badgeText="EXP"
                                    trend={{ type: 'down', value: 'Cost' }}
                                />
                                <CardTemplate2
                                    title="Laba Bersih"
                                    value={`Rp ${((reportData?.sales?.totalRevenue || 0) - (reportData?.expenses?.summary?.totalExpenses || 0)).toLocaleString()}`}
                                    icon="Wallet"
                                    description="Pendapatan bersih (Nett)"
                                    color="info"
                                    badgeText="PFT"
                                    trend={{ type: 'up', value: 'Profit' }}
                                />
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                {/* Payment Methods Distribution */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 transition-all duration-300 hover:shadow-2xl">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/20">
                                            <Icon name="PieChart" className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Metode Pembayaran</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Distribusi Transaksi</p>
                                        </div>
                                    </div>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={(() => {
                                                        const paymentMethods = {};
                                                        transactions.filter(t => {
                                                            const itemDate = new Date(t.timestamp);
                                                            return itemDate >= selectedDateRange.startDate && itemDate <= selectedDateRange.endDate;
                                                        }).forEach(t => {
                                                            const method = t.payment_method || 'tunai';
                                                            paymentMethods[method] = (paymentMethods[method] || 0) + 1;
                                                        });
                                                        const colors = {
                                                            'tunai': '#3b82f6',
                                                            'qris': '#10b981',
                                                            'transfer': '#8b5cf6',
                                                            'bon': '#f59e0b',
                                                            'employee_meal': '#ef4444'
                                                        };
                                                        return Object.entries(paymentMethods).map(([name, value]) => ({
                                                            name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
                                                            value,
                                                            color: colors[name] || '#6b7280'
                                                        }));
                                                    })()}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {(() => {
                                                        const paymentMethods = {};
                                                        transactions.filter(t => {
                                                            const itemDate = new Date(t.timestamp);
                                                            return itemDate >= selectedDateRange.startDate && itemDate <= selectedDateRange.endDate;
                                                        }).forEach(t => {
                                                            const method = t.payment_method || 'tunai';
                                                            paymentMethods[method] = (paymentMethods[method] || 0) + 1;
                                                        });
                                                        const colors = {
                                                            'tunai': '#3b82f6',
                                                            'qris': '#10b981',
                                                            'transfer': '#8b5cf6',
                                                            'bon': '#f59e0b',
                                                            'employee_meal': '#ef4444'
                                                        };
                                                        return Object.entries(paymentMethods).map(([name], index) => (
                                                            <Cell key={`cell-${index}`} fill={colors[name] || '#6b7280'} />
                                                        ));
                                                    })()}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                                    formatter={(value) => [`${value} transaksi`, 'Jumlah']}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Top 5 Menu Items */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700 transition-all duration-300 hover:shadow-2xl">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/20">
                                            <Icon name="TrendingUp" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Menu Terlaris</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Top 5 Performa</p>
                                        </div>
                                    </div>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={(reportData?.sales?.topItems || []).slice(0, 5).map(item => ({
                                                    name: item.name,
                                                    quantity: item.sold
                                                }))}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                <Tooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                                    formatter={(value) => [`${value} porsi`, 'Terjual']}
                                                />
                                                <Bar dataKey="quantity" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Stats Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Stock Status */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/20">
                                            <Icon name="Package" className="w-5 h-5 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Status Persediaan</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ketersediaan Barang</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="group p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/20 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                                                    <Icon name="UtensilsCrossed" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase text-blue-600/60 tracking-widest leading-none">Total Menu</p>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{menuItems?.length || 0}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item</span>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Rendah: {reportData?.stock?.lowStockItems || 0}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                            </div>
                                        </div>

                                        <div className="group p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/20 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                                                    <Icon name="Leaf" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase text-emerald-600/60 tracking-widest leading-none">Bahan Baku</p>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{rawMaterials?.length || 0}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item</span>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Kritis: {reportData?.rawMetrics?.lowStockRawCount || 0}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100/50 dark:border-slate-700">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/20">
                                            <Icon name="Wallet" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Analisis Keuangan</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rata-rata Performa</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="group p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-blue-800/20 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                                                        <Icon name="TrendingUp" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-indigo-600/60 tracking-widest leading-none mb-1">Rata-rata Order</p>
                                                        <p className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">Rp {(reportData?.sales?.averageOrder || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <Icon name="ChevronRight" size={14} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                        <div className="group p-5 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100/50 dark:border-purple-800/20 transition-all hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                                                        <Icon name="Receipt" className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-purple-600/60 tracking-widest leading-none mb-1">Pengeluaran Harian</p>
                                                        <p className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">Rp {(reportData?.expenses?.summary?.averageDaily || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <Icon name="ChevronRight" size={14} className="text-purple-300 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Existing Report Sections */}
                        <SalesReportSection data={reportData.sales} dateRange={selectedDateRange} />
                        <StockReportSection data={reportData.stock} dateRange={selectedDateRange} />
                        <RawMaterialReportSection data={reportData.rawMetrics} units={units} dateRange={selectedDateRange} />
                        <ExpenseReportSection data={reportData.expenses} dateRange={selectedDateRange} />
                        <EmployeeMealReportSection data={reportData.employeeMeals} dateRange={selectedDateRange} />
                        <ReconciliationReportSection reconciliations={reportData.reconciliations} dateRange={selectedDateRange} />
                        <CombinedAnalyticsSection
                            reportData={reportData}
                            onExportCombined={handleExportCombinedData}
                        />
                        {/* Modern Export Center */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none p-8 lg:p-10 mt-10 overflow-hidden relative group">
                            {/* Decorative Background Element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-primary/10"></div>

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/10 transition-transform group-hover:scale-110 duration-500">
                                    <Icon name="DownloadCloud" size={32} strokeWidth={2.5} className="text-primary" />
                                </div>

                                <h2 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">Export Center</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium max-w-md mx-auto mb-8 leading-relaxed">
                                    Unduh laporan bisnis komprehensif Anda dalam berbagai format untuk keperluan arsip, presentasi, atau analisis mendalam.
                                </p>

                                <div className="flex flex-wrap justify-center gap-4 w-full">
                                    <button
                                        onClick={() => handleExportCombinedData('excel')}
                                        disabled={isExporting}
                                        className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                        <Icon name="FileSpreadsheet" size={18} strokeWidth={2.5} />
                                        <span>Export ke Excel</span>
                                    </button>

                                    <button
                                        onClick={() => handleExportCombinedData('pdf')}
                                        disabled={isExporting}
                                        className="flex items-center gap-3 px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                        <Icon name="FileText" size={18} strokeWidth={2.5} />
                                        <span>Unduh File PDF</span>
                                    </button>
                                </div>

                                <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] opacity-60">
                                    Laporan mencakup semua parameter yang dipilih di atas
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-text-secondary">Tidak ada data untuk ditampilkan pada periode ini.</p>
                    </div>
                )}

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                            <h2 className="text-lg font-bold mb-4">Konfirmasi Hapus Data</h2>
                            <p className="text-text-secondary mb-4">Tindakan ini akan menghapus semua data transaksi secara permanen. Masukkan kata sandi untuk melanjutkan.</p>
                            <Input type="password" placeholder="Kata Sandi" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4" />
                            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                                <Button variant="danger" onClick={handleClearData}>Hapus Data</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Export Format Selection Menu (Bottom Sheet Style for Mobile) */}
            {isExportMenuOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center lg:items-center p-0 lg:p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsExportMenuOpen(false)}
                    ></div>
                    <div className="relative w-full lg:max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] lg:rounded-[2rem] p-8 lg:p-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full mx-auto mb-8 lg:hidden"></div>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800/20">
                                <Icon name="FileDown" size={32} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Format Laporan</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Pilih format dokumen untuk diunduh</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => {
                                    handleExportCombinedData('excel');
                                    setIsExportMenuOpen(false);
                                }}
                                className="group flex items-center justify-between p-5 bg-gray-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-emerald-200 transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                                        <Icon name="FileSpreadsheet" size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight">Microsoft Excel</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Format .xlsx (Editable)</p>
                                    </div>
                                </div>
                                <Icon name="ChevronRight" size={18} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                            </button>

                            <button
                                onClick={() => {
                                    handleExportCombinedData('pdf');
                                    setIsExportMenuOpen(false);
                                }}
                                className="group flex items-center justify-between p-5 bg-gray-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-rose-200 transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20">
                                        <Icon name="FileText" size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight">Dokumen PDF</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Format .pdf (Ready to Print)</p>
                                    </div>
                                </div>
                                <Icon name="ChevronRight" size={18} className="text-gray-300 group-hover:text-rose-500 transition-colors" />
                            </button>
                        </div>

                        <button
                            onClick={() => setIsExportMenuOpen(false)}
                            className="w-full mt-6 p-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-600 transition-colors"
                        >
                            Batalkan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessReportView;
