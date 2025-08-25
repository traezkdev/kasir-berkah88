import React, { useState, useEffect } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import DashboardMetricsBar from '../../components/ui/DashboardMetricsBar';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

import ExpenseEntryForm from './components/ExpenseEntryForm';
import ExpenseSummaryCard from './components/ExpenseSummaryCard';
import ExpenseHistoryTable from './components/ExpenseHistoryTable';
import ExpenseAnalytics from './components/ExpenseAnalytics';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import authFetch from '../../utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

const ExpenseTracking = ({ headerTitle }) => {
  const [expenses, setExpenses] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define fetch functions outside useEffects
  const fetchExpenses = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Exit if no token
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/expenses`);
      const data = await response.json();
      if (data.message === 'success') {
        setExpenses(data.data);
      } else {
        console.error('Failed to fetch expenses:', data.error);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Exit if no token
    try {
      const response = await authFetch(`${apiUrl}/api/menu-items`);
      const data = await response.json();
      if (data.message === 'success') {
        setMenuItems(data.data);
      } else {
        console.error('Failed to fetch menu items:', data.error);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    }
  };

  const fetchTransactions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Exit if no token
    try {
      const response = await authFetch(`${apiUrl}/api/transactions`);
      const data = await response.json();
      if (data.message === 'success') {
        setTransactions(data.data);
      } else {
        console.error('Failed to fetch transactions:', data.error);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  // Call fetch functions inside useEffects
  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && menuItems.length > 0) {
      const today = new Date().toDateString();
      const todayTransactions = transactions.filter(t => new Date(t.timestamp).toDateString() === today);
      const todaySales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const averageOrderToday = todayTransactions.length > 0 ? todaySales / todayTransactions.length : 0;
      const lowStockItems = menuItems.filter(item => item.stock <= 5 && item.stock > 0).length;

      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };

      setDashboardMetrics({
        todaySales: { value: formatCurrency(todaySales), change: '+12%', trend: 'up' },
        totalTransactions: { value: todayTransactions.length.toString(), change: '+8%', trend: 'up' },
        averageOrder: { value: formatCurrency(averageOrderToday), change: '+5%', trend: 'up' },
        lowStock: { value: lowStockItems.toString(), change: '-2', trend: 'down' }
      });
    }
  }, [transactions, menuItems]);

  const handleAddExpense = async (expenseData) => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      const result = await response.json();
      if (result.message === 'success') {
        fetchExpenses(); // Refetch to get the latest list
      } else {
        console.error('Failed to add expense:', result.error);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const response = await authFetch(`${apiUrl}/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.message === 'deleted') {
        fetchExpenses(); // Refetch to update the list
      } else {
        console.error('Failed to delete expense:', result.error);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua data pengeluaran? Aksi ini tidak dapat dibatalkan.')) {
      try {
        const response = await authFetch(`${apiUrl}/api/expenses`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (result.message === 'all deleted') {
          fetchExpenses(); // Refetch to show an empty list
        } else {
          console.error('Failed to bulk delete expenses:', result.error);
        }
      } catch (error) {
        console.error('Error bulk deleting expenses:', error);
      }
    }
  };

  const handleExportData = (format) => {
    if (expenses?.length === 0) {
      alert('Tidak ada data pengeluaran untuk diekspor');
      return;
    }

    const categoryOptions = [
      { value: 'supplies', label: 'Bahan Baku & Supplies' },
      { value: 'utilities', label: 'Listrik & Air' },
      { value: 'inventory', label: 'Pembelian Stok' },
      { value: 'equipment', label: 'Peralatan' },
      { value: 'maintenance', label: 'Perawatan & Perbaikan' },
      { value: 'transport', label: 'Transportasi' },
      { value: 'marketing', label: 'Promosi & Marketing' },
      { value: 'operational', label: 'Operasional Lainnya' },
      { value: 'other', label: 'Lain-lain' }
    ];
    const categoryLabelMap = new Map(categoryOptions.map(opt => [opt.value, opt.label]));

    const fileName = `Laporan-Pengeluaran-${new Date().toISOString().split('T')[0]}`;

    if (format === 'excel') {
      const header = ['Tanggal', 'Waktu', 'Kategori', 'Deskripsi', 'Catatan', 'Jumlah'];
      const dataForSheet = expenses.map(expense => [
        new Date(expense.date).toLocaleDateString('id-ID'),
        new Date(expense.date).toLocaleTimeString('id-ID'),
        categoryLabelMap.get(expense.category) || expense.category,
        expense.name,
        expense.notes || '-',
        parseFloat(expense.amount) // Keep as number for formatting and sum
      ]);

      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

      const ws_data = [
        ["Laporan Pengeluaran"], // Title
        [], // Empty row
        header,
        ...dataForSheet,
        [], // Empty row
        ['Total Pengeluaran', '', '', '', '', totalExpenses]
      ];

      const ws = XLSX.utils.aoa_to_sheet(ws_data);

      // Merge title and footer cells
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } },
        { s: { r: ws_data.length - 1, c: 0 }, e: { r: ws_data.length - 1, c: header.length - 2 } }
      ];

      // --- Styling ---
      const titleStyle = { font: { bold: true, sz: 16 }, alignment: { horizontal: "center" } };
      const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "228B22" } } }; // Green fill
      const totalStyle = { font: { bold: true } };
      const currencyFormat = '"Rp"#,##0;\-"Rp"#,##0';

      ws['A1'].s = titleStyle;
      ws[`F${ws_data.length}`].s = { ...totalStyle, numFmt: currencyFormat };
      ws[`A${ws_data.length}`].s = totalStyle;

      // Style headers
      header.forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: 2, c: colIndex });
        ws[cellRef].s = headerStyle;
      });

      // Set number format for amount column
      for (let i = 0; i < dataForSheet.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: 3 + i, c: 5 });
        if(ws[cellRef]) ws[cellRef].s = { numFmt: currencyFormat };
      }

      // Auto-fit columns
      const colWidths = header.map((_, i) => ({
        wch: ws_data.reduce((w, r) => Math.max(w, (r[i] || '').toString().length), 10)
      }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pengeluaran');
      XLSX.writeFile(wb, `${fileName}.xlsx`);

    } else if (format === 'pdf') {
      const dataToExport = expenses.map(expense => ({
        'Tanggal': new Date(expense.date).toLocaleDateString('id-ID'),
        'Waktu': new Date(expense.date).toLocaleTimeString('id-ID'),
        'Kategori': categoryLabelMap.get(expense.category) || expense.category,
        'Deskripsi': expense.name,
        'Catatan': expense.notes || '-',
        'Jumlah': new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(expense.amount)
      }));

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Laporan Pengeluaran', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);

      const headers = Object.keys(dataToExport[0]);
      const body = dataToExport.map(row => Object.values(row));

      autoTable(doc, {
        startY: 40,
        head: [headers],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
        styles: { fontSize: 8 },
      });

      const finalY = doc.lastAutoTable.finalY;
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
      doc.setFontSize(12);
      doc.text(`Total Pengeluaran: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalExpenses)}`, 14, finalY + 10);

      doc.save(`${fileName}.pdf`);
    }
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    const totalExpenses = expenses?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);
    const expenseCount = expenses?.length;

    const today = new Date();
    const todayExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate?.toDateString() === today?.toDateString();
      })?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);

    const currentMonth = today?.getMonth();
    const currentYear = today?.getFullYear();
    const monthlyExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate?.getMonth() === currentMonth && expenseDate?.getFullYear() === currentYear;
      })?.reduce((sum, expense) => sum + parseFloat(expense?.amount || 0), 0);

    return {
      totalExpenses,
      expenseCount,
      todayExpenses,
      monthlyExpenses
    };
  };

  const summaryMetrics = calculateSummaryMetrics();

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle} /> 
      <div className="pt-16">
        {/* <DashboardMetricsBar metrics={dashboardMetrics} showOnAllPages />  */}
        <main className="pt-6 lg:pt-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-6">
            {/* Breadcrumb */}
            <BreadcrumbNavigation />

            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Tracking Pengeluaran</h1>
                <p className="text-sm text-text-secondary mt-1">
                  Kelola dan pantau pengeluaran bisnis untuk analisis keuangan yang akurat
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <ExpenseSummaryCard
              totalExpenses={summaryMetrics?.totalExpenses}
              expenseCount={summaryMetrics?.expenseCount}
              todayExpenses={summaryMetrics?.todayExpenses}
              monthlyExpenses={summaryMetrics?.monthlyExpenses}
            />

            {/* Expense Entry Form */}
            <ExpenseEntryForm
              onAddExpense={handleAddExpense}
              isLoading={isLoading}
            />

            {/* Analytics Section */}
            {expenses?.length > 0 && (
              <ExpenseAnalytics expenses={expenses} />
            )}

            {/* Expense History Table */}
            <ExpenseHistoryTable
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
              onBulkDelete={handleBulkDelete}
              onExportData={handleExportData}
              isLoading={isLoading}
            />
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default ExpenseTracking;