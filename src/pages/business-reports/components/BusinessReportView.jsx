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
import authFetch from '../../../utils/authFetch';
import { formatInTimeZone } from 'date-fns-tz';
import { exportToExcel, exportToPdf, prepareCombinedDataForExport } from '../../../utils/exportUtils';
import { useTheme } from '../../../contexts/ThemeContext';

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
        <div className={theme === 'default' && !isOwner ? "max-w-7xl mx-auto px-4 lg:px-6" : ""}>
            {/* Header Section */}
            <div className="mb-6 mt-4">
                <div className="mb-4 hidden md:block">
                    <BreadcrumbNavigation />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                            {headerTitle || "Laporan Bisnis"}
                        </h1>
                        <p className="text-text-secondary">
                            Analisis komprehensif performa bisnis Anda.
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="primary"
                            onClick={() => navigate('/analisis-data')}
                            iconName="BarChart3"
                            iconPosition="left"
                        >
                            Analisis Data
                        </Button>
                        <Button variant="destructive" onClick={() => setIsModalOpen(true)}>
                            Hapus Semua Data
                        </Button>
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
                    <div className="bg-card rounded-lg border border-border shadow-elevation-1 p-6 mt-6">
                        <p className="text-sm text-text-secondary mb-4 text-center dark:text-gray-400">Export laporan gabungan untuk analisis lebih lanjut.</p>
                        <div className="flex justify-center space-x-3">
                            <Button variant="outline" onClick={() => handleExportCombinedData('excel')} iconName="Download" iconPosition="left" loading={isExporting}>
                                Export Excel
                            </Button>
                            <Button variant="outline" onClick={() => handleExportCombinedData('pdf')} iconName="FileText" iconPosition="left" loading={isExporting}>
                                Export PDF
                            </Button>
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
    );
};

export default BusinessReportView;
