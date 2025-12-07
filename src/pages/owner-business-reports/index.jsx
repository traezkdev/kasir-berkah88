import React, { useState, useEffect } from 'react';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import DashboardMetricsBar from '../../components/ui/DashboardMetricsBar';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import DateRangeSelector from '../business-reports/components/DateRangeSelector';
import StockReportSection from '../business-reports/components/StockReportSection';
import SalesReportSection from '../business-reports/components/SalesReportSection';
import ExpenseReportSection from '../business-reports/components/ExpenseReportSection';
import EmployeeMealReportSection from '../business-reports/components/EmployeeMealReportSection';
import CombinedAnalyticsSection from '../business-reports/components/CombinedAnalyticsSection';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import authFetch from '../../utils/authFetch';
import { formatInTimeZone } from 'date-fns-tz';
import { exportToExcel, exportToPdf, prepareCombinedDataForExport } from '../../utils/exportUtils';

const apiUrl = import.meta.env.VITE_API_URL;

import { useTheme } from '../../contexts/ThemeContext';

const OwnerBusinessReports = ({ headerTitle }) => {
  const { theme } = useTheme();
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    range: 'today'
  });
  const [transactions, setTransactions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [expenses, setExpenses] = useState([]); // State for expenses
  const [settings, setSettings] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isExporting, setIsExporting] = useState(false); // New state for export loading
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const [transRes, menuRes, expenseRes, settingsRes] = await Promise.all([
          authFetch(`${apiUrl}/api/transactions/all`),
          authFetch(`${apiUrl}/api/menu-items/all`),
          authFetch(`${apiUrl}/api/expenses/all`),
          authFetch(`${apiUrl}/api/all-settings`)
        ]);

        const transData = await transRes.json();
        const menuData = await menuRes.json();
        const expenseData = await expenseRes.json();
        const settingsData = await settingsRes.json();

        if (transData.message === 'success') {
          setTransactions(transData.data.map(t => ({...t, timestamp: new Date(t.timestamp)})));
        }
        if (menuData.message === 'success') {
          setMenuItems(menuData.data);
        }
        if (expenseData.message === 'success') {
          setExpenses(expenseData.data.map(e => ({...e, date: new Date(e.date)})));
        }
        if (settingsData.message === 'success') {
          setSettings(settingsData.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isLoading) return; // Don't process until initial data is loaded

    const processReportData = () => {
                const filterByDate = (item) => {
                const itemDate = new Date(item.timestamp || item.date);
                const startDate = selectedDateRange.startDate;
                const endDate = selectedDateRange.endDate;
      
                return itemDate >= startDate && itemDate <= endDate;
              };
      const filteredTransactions = transactions.filter(filterByDate);
      const filteredExpenses = expenses.filter(filterByDate);

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
        .sort((a, b) => b.revenue - a.revenue)
;

      // Stock Report Data (based on items sold within the filtered period)
      let totalItemsSold = 0;
      let totalValueSold = 0;
      const itemsSoldMap = new Map(); // To aggregate quantities and revenues of sold items

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

      // For 'lowStockItems', we still use the current menuItems as it represents current inventory status
      const currentLowStockItems = menuItems.filter(i => i.stock > 0 && i.stock <= 5);
      
      // Calculate the total value of current stock based on selling price
      const currentStockValue = menuItems.reduce((sum, item) => sum + (Number(item?.stock || 0) * Number(item?.price || 0)), 0);

      // Expense Report Data
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const expenseCategories = [...new Set(filteredExpenses.map(e => e.category))].length;

      // Employee Meals Data
      const employeeMealsTransactions = transactions.filter(t => t.payment_method === 'employee_meal' && filterByDate(t));
      
      let totalItemsServedInEmployeeMeals = 0;
      let estimatedValueEmployeeMeals = 0;
      const employeeMealItems = []; // For detailed table

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
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day

      const averageDailyExpenses = diffDays > 0 ? totalExpenses / diffDays : 0;

      // --- Working Capital Calculation ---
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

      setReportData({
        sales: {
          totalRevenue,
          totalTransactions,
          averageOrder,
          topItems,
          initialCapital: !isNaN(initialCapital) ? initialCapital : 0,
          workingCapital,
        },
        stock: {
          totalValue: totalValueSold, // Now reflects value of items sold in period
          totalItems: totalItemsSold, // Now reflects total items sold in period
          lowStockItems: currentLowStockItems.length, // Still based on current stock
          currentStockValue: currentStockValue, // Add the new value here
          items: Array.from(itemsSoldMap.values()), // Items sold in the period
          lowStock: currentLowStockItems, // Still based on current stock
        },
        expenses: {
          summary: {
            totalExpenses: totalExpenses,
            categories: expenseCategories,
            averageDaily: averageDailyExpenses
          },
          items: filteredExpenses
        },
        employeeMeals: {
          summary: {
            totalMeals: employeeMealsTransactions.length,
            totalItemsServed: totalItemsServedInEmployeeMeals,
            estimatedValue: estimatedValueEmployeeMeals
          },
          items: employeeMealItems
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
      const preparedData = prepareCombinedDataForExport(reportData);
      if (format === 'excel') {
        exportToExcel(preparedData, 'Laporan_Bisnis_Gabungan');
      } else if (format === 'pdf') {
        exportToPdf(preparedData, 'Laporan_Bisnis_Gabungan');
      }
      // Optionally show a success notification
    } catch (error) {
      console.error('Error exporting combined data:', error);
      // Optionally show an error notification
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <OwnerNavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle || "Laporan Bisnis"} />
      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Header Section */}
          <div className="mb-6">
            <BreadcrumbNavigation className="mb-4" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                  Laporan Bisnis
                </h1>
                <p className="text-text-secondary">
                  Analisis komprehensif performa bisnis Anda.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setIsModalOpen(true)} className="mt-4 sm:mt-0">
                Hapus Semua Data
              </Button>
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
            <div className="space-y-8 mt-6 bg-card p-4 rounded-lg shadow-md">
              <SalesReportSection data={reportData.sales} />
              <StockReportSection data={reportData.stock} />
              <ExpenseReportSection data={reportData.expenses} />
              <EmployeeMealReportSection data={reportData.employeeMeals} />
              <CombinedAnalyticsSection salesData={reportData.sales} stockData={reportData.stock} expensesData={reportData.expenses} onExportCombined={handleExportCombinedData} />
              <div className="bg-card rounded-lg border border-border shadow-elevation-1 p-6 mt-6">
                <p className="text-sm text-text-secondary mb-4 text-center dark:text-gray-400">Export laporan gabungan untuk analisis lebih lanjut.</p>
                <div className="flex justify-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => handleExportCombinedData('excel')}
                    iconName="Download"
                    iconPosition="left"
                    loading={isExporting}
                  >
                    Export Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportCombinedData('pdf')}
                    iconName="FileText"
                    iconPosition="left"
                    loading={isExporting}
                  >
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
        </div>
      </main>
      

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Konfirmasi Hapus Data</h2>
            <p className="text-text-secondary mb-4">Tindakan ini akan menghapus semua data transaksi secara permanen. Masukkan kata sandi untuk melanjutkan.</p>
            <Input
              type="password"
              placeholder="Kata Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4"
            />
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

export default OwnerBusinessReports;

