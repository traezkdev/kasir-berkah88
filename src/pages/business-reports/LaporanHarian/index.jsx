import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import AdminMobileHeader from '../../../components/ui/AdminMobileHeader';
import Pagination from '../../../components/ui/Pagination';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const apiUrl = import.meta.env.VITE_API_URL;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const LaporanHarian = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [summaryData, setSummaryData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [currentExpensePage, setCurrentExpensePage] = useState(1);
  const expensesPerPage = 10;
  const [currentMenuPage, setCurrentMenuPage] = useState(1);
  const menusPerPage = 10;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch summary (daily recap)
      const recapRes = await authFetch(`${apiUrl}/api/transactions/daily-recap?date=${selectedDate}`);
      const recapData = await recapRes.json();
      if (recapData.message === 'success') {
        setSummaryData(recapData.data);
      } else {
        throw new Error(recapData.error || 'Gagal memuat ringkasan harian.');
      }

      // Fetch all transactions for detailed stats
      const allTxRes = await authFetch(`${apiUrl}/api/transactions/all?startDate=${selectedDate}&endDate=${selectedDate}`);
      const allTxData = await allTxRes.json();
      if (allTxData.message === 'success') {
        setTransactions(allTxData.data);
        setCurrentMenuPage(1); // Reset menu page on new date
      } else {
        throw new Error(allTxData.error || 'Gagal memuat data transaksi lengkap.');
      }

      // Fetch all expenses for the date
      const expensesRes = await authFetch(`${apiUrl}/api/expenses/all?startDate=${selectedDate}&endDate=${selectedDate}&filterClosed=false`);
      const expensesData = await expensesRes.json();
      if (expensesData.message === 'success') {
        const total = expensesData.data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        setTotalExpense(total);
        setExpenses(expensesData.data);
        setCurrentExpensePage(1); // Reset page on new date
      } else {
        throw new Error(expensesData.error || 'Gagal memuat data pengeluaran.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Process Hourly Data for Chart
  const hourlyData = useMemo(() => {
    if (!transactions.length) return [];
    
    // Initialize 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      total_transaksi: 0,
      pendapatan: 0
    }));

    transactions.forEach(t => {
      const dateObj = new Date(t.timestamp);
      const hourIndex = dateObj.getHours();
      // Pastikan valid hour
      if (hourIndex >= 0 && hourIndex < 24) {
        hours[hourIndex].total_transaksi += 1;
        hours[hourIndex].pendapatan += parseFloat(t.total || 0);
      }
    });

    // Filter only hours between 06:00 to 23:00 to make chart cleaner, or show all if needed.
    // For now we show all 24 hours
    return hours;
  }, [transactions]);

  // Process Menu Sold
  const menuSoldStats = useMemo(() => {
    if (!transactions.length) return [];
    
    const menuMap = {};

    transactions.forEach(t => {
      let items = [];
      try {
        items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
      } catch (e) {
        console.error("Error parsing items", e);
      }
      
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (!menuMap[item.name]) {
            menuMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          }
          menuMap[item.name].quantity += item.quantity;
          menuMap[item.name].revenue += (item.price * item.quantity);
        });
      }
    });

    return Object.values(menuMap).sort((a, b) => b.quantity - a.quantity); // Sort by highest quantity
  }, [transactions]);

  // Pagination Logic for Expenses
  const indexOfLastExpense = currentExpensePage * expensesPerPage;
  const indexOfFirstExpense = indexOfLastExpense - expensesPerPage;
  const currentExpenses = expenses.slice(indexOfFirstExpense, indexOfLastExpense);
  const totalPagesExpenses = Math.ceil(expenses.length / expensesPerPage);

  // Pagination Logic for Menus
  const indexOfLastMenu = currentMenuPage * menusPerPage;
  const indexOfFirstMenu = indexOfLastMenu - menusPerPage;
  const currentMenus = menuSoldStats.slice(indexOfFirstMenu, indexOfLastMenu);
  const totalPagesMenus = Math.ceil(menuSoldStats.length / menusPerPage);

  const exportToExcel = () => {
    if (!summaryData) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Ringkasan
    const summaryRows = [
      ["Laporan Harian", selectedDate],
      [],
      ["Ringkasan Pendapatan & Pengeluaran"],
      ["Total Pendapatan", summaryData.grand_total],
      ["Total Pengeluaran", totalExpense],
      ["Total Tunai", summaryData.total_tunai],
      ["Total Transfer/QRIS", summaryData.total_transfer],
      ["Total Aplikasi", summaryData.total_gojek],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Ringkasan");

    // Sheet 2: Menu Terjual
    const menuRows = [
      ["Nama Menu", "Terjual", "Pendapatan"]
    ];
    menuSoldStats.forEach(m => {
      menuRows.push([m.name, m.quantity, m.revenue]);
    });
    const wsMenu = XLSX.utils.aoa_to_sheet(menuRows);
    XLSX.utils.book_append_sheet(workbook, wsMenu, "Menu Terjual");

    // Sheet 3: Pengeluaran
    const expenseRows = [
      ["Waktu", "Deskripsi", "Catatan", "Kategori", "Nominal"]
    ];
    expenses.forEach(e => {
      const timeStr = new Date(e.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      expenseRows.push([timeStr, e.name, e.notes || "", e.category || "Lainnya", e.amount]);
    });
    const wsExpense = XLSX.utils.aoa_to_sheet(expenseRows);
    XLSX.utils.book_append_sheet(workbook, wsExpense, "Pengeluaran");

    XLSX.writeFile(workbook, `Laporan_Harian_${selectedDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!summaryData) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text(`Laporan Harian - ${selectedDate}`, 14, 15);
    
    // Summary
    doc.setFontSize(12);
    doc.text("Ringkasan Pendapatan & Pengeluaran", 14, 25);
    
    autoTable(doc, {
      startY: 30,
      head: [["Keterangan", "Nominal"]],
      body: [
        ["Total Pendapatan", formatCurrency(summaryData.grand_total)],
        ["Total Pengeluaran", formatCurrency(totalExpense)],
        ["Total Tunai", formatCurrency(summaryData.total_tunai)],
        ["Total Transfer/QRIS", formatCurrency(summaryData.total_transfer)],
        ["Total Aplikasi (Gojek dll)", formatCurrency(summaryData.total_gojek)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Menu Terjual
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text("Menu Terjual", 14, finalY);
    
    const menuBody = menuSoldStats.map(m => [m.name, m.quantity, formatCurrency(m.revenue)]);
    autoTable(doc, {
      startY: finalY + 5,
      head: [["Nama Menu", "Terjual", "Pendapatan"]],
      body: menuBody.length > 0 ? menuBody : [["-", "-", "-"]],
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96] }
    });

    // Pengeluaran
    finalY = doc.lastAutoTable.finalY + 10;
    doc.text("Detail Pengeluaran", 14, finalY);
    
    const expenseBody = expenses.map(e => {
      const timeStr = new Date(e.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return [timeStr, `${e.name}\n${e.notes || ""}`.trim(), e.category || "Lainnya", formatCurrency(e.amount)];
    });
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [["Waktu", "Deskripsi", "Kategori", "Nominal"]],
      body: expenseBody.length > 0 ? expenseBody : [["-", "-", "-", "-"]],
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60] },
      styles: { cellPadding: 2 }
    });

    doc.save(`Laporan_Harian_${selectedDate}.pdf`);
  };

  return (
    <>
      <AdminMobileHeader 
        title="Laporan Harian" 
        subtitle="Pantau Penjualan Anda"
        decorativeIcon="TrendingUp"
        actions={[
          {
            label: "Export Excel",
            icon: "FileSpreadsheet",
            onClick: exportToExcel,
            color: "success"
          },
          {
            label: "Export PDF",
            icon: "FileText",
            onClick: exportToPDF,
            color: "danger"
          }
        ]}
      />
      <div className="p-6 space-y-6 max-w-7xl mx-auto pt-6 lg:pt-6">
        <div className="hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-5 rounded-xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Laporan Penjualan Harian</h1>
            <p className="text-text-secondary mt-1 text-sm">Pantau performa penjualan dan statistik pesanan hari ini.</p>
          </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={exportToExcel} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg flex items-center gap-2 transition-colors border border-green-200" title="Export Excel">
              <Icon name="FileSpreadsheet" size={20} />
              <span className="hidden sm:inline text-sm font-medium">Excel</span>
            </button>
            <button onClick={exportToPDF} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors border border-red-200" title="Export PDF">
              <Icon name="FileText" size={20} />
              <span className="hidden sm:inline text-sm font-medium">PDF</span>
            </button>
          </div>
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-1.5 shadow-sm">
            <div className="pl-3 text-text-secondary">
              <Icon name="Calendar" size={18} />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-text-primary focus:ring-0 px-2 py-1 outline-none font-medium"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summaryData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-emerald-100 text-sm font-medium mb-1">Total Pendapatan</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(summaryData.grand_total)}</h3>
                </div>
                <div className="absolute right-[-10%] top-[-10%] opacity-20 group-hover:scale-110 transition-transform duration-300">
                  <Icon name="TrendingUp" size={100} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-rose-100 text-sm font-medium mb-1">Total Pengeluaran</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(totalExpense)}</h3>
                </div>
                <div className="absolute right-[-10%] top-[-10%] opacity-20 group-hover:scale-110 transition-transform duration-300">
                  <Icon name="TrendingDown" size={100} />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-text-secondary text-xs font-medium">Tunai</p>
                  <Icon name="Banknote" size={16} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">{formatCurrency(summaryData.total_tunai)}</h3>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-text-secondary text-xs font-medium">Transfer/QRIS</p>
                  <Icon name="CreditCard" size={16} className="text-purple-500" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">{formatCurrency(summaryData.total_transfer)}</h3>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-text-secondary text-xs font-medium">Aplikasi (Gojek dll)</p>
                  <Icon name="Smartphone" size={16} className="text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">{formatCurrency(summaryData.total_gojek)}</h3>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {/* Chart Section */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Jam Ramai Transaksi</h3>
                  <p className="text-sm text-text-secondary">Distribusi jumlah transaksi per jam</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Icon name="BarChart2" size={20} />
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                      formatter={(value, name) => [name === 'total_transaksi' ? `${value} Trx` : formatCurrency(value), name === 'total_transaksi' ? 'Jumlah Transaksi' : 'Pendapatan']}
                    />
                    <Bar 
                      dataKey="total_transaksi" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={40}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Menu List Section */}
          <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col">
              <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Menu Terjual</h3>
                  <p className="text-sm text-text-secondary">Total: {menuSoldStats.length} item unik</p>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Icon name="Utensils" size={20} />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {menuSoldStats.length > 0 ? (
                  <>
                    {/* Desktop Table */}
                    <table className="hidden md:table w-full text-sm text-left">
                      <thead className="bg-background text-text-secondary font-medium">
                        <tr>
                          <th className="px-6 py-3 rounded-tl-lg w-16">No</th>
                          <th className="px-6 py-3">Nama Menu</th>
                          <th className="px-6 py-3 text-right">Terjual</th>
                          <th className="px-6 py-3 text-right rounded-tr-lg">Pendapatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentMenus.map((item, idx) => (
                          <tr key={idx} className="border-b border-border hover:bg-background/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {indexOfFirstMenu + idx + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-text-primary font-medium">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="inline-block bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                                {item.quantity} x
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-text-secondary">
                              {formatCurrency(item.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col gap-2 p-4 pt-4">
                      {currentMenus.map((item, idx) => (
                        <div key={idx} className="bg-background border border-border rounded-lg p-3 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {indexOfFirstMenu + idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary text-sm line-clamp-1">{item.name}</p>
                              <p className="text-xs text-text-secondary mt-0.5">{formatCurrency(item.revenue)}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="inline-block bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                              {item.quantity} x
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-text-secondary p-10 text-center">
                    <Icon name="UtensilsCrossed" size={48} className="mb-3 opacity-20" />
                    <p>Belum ada data menu terjual pada tanggal ini.</p>
                  </div>
                )}
              </div>
              
              {/* Pagination Component */}
              {menuSoldStats.length > menusPerPage && (
                <div className="pb-4">
                  <Pagination
                    currentPage={currentMenuPage}
                    totalPages={totalPagesMenus}
                    onPageChange={setCurrentMenuPage}
                  />
                </div>
              )}
            </div>

          {/* Pengeluaran List Section */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Detail Pengeluaran</h3>
                <p className="text-sm text-text-secondary">Total: {expenses.length} transaksi</p>
              </div>
              <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg">
                <Icon name="Receipt" size={20} />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {expenses.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <table className="hidden md:table w-full text-sm text-left">
                    <thead className="bg-background text-text-secondary font-medium">
                      <tr>
                        <th className="px-6 py-3 rounded-tl-lg">Waktu</th>
                        <th className="px-6 py-3">Deskripsi</th>
                        <th className="px-6 py-3">Kategori</th>
                        <th className="px-6 py-3 text-right rounded-tr-lg">Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentExpenses.map((expense, idx) => {
                        const timeString = new Date(expense.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <tr key={expense.id || idx} className="border-b border-border hover:bg-background/50 transition-colors">
                            <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                              {timeString}
                            </td>
                            <td className="px-6 py-4 text-text-primary font-medium">
                              {expense.name}
                              {expense.notes && <p className="text-xs text-text-secondary mt-1 font-normal line-clamp-1">{expense.notes}</p>}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                {expense.category || 'Lainnya'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                              {formatCurrency(expense.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Mobile Cards */}
                  <div className="md:hidden flex flex-col gap-3 p-4 pt-4">
                    {currentExpenses.map((expense, idx) => {
                      const timeString = new Date(expense.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={expense.id || idx} className="bg-background border border-border rounded-lg p-3 flex flex-col gap-2 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-text-secondary">{timeString}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                              {expense.category || 'Lainnya'}
                            </span>
                          </div>
                          <div className="flex justify-between items-start mt-1 gap-2">
                            <div>
                              <p className="font-semibold text-text-primary text-sm line-clamp-2">{expense.name}</p>
                              {expense.notes && <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{expense.notes}</p>}
                            </div>
                            <span className="font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap text-sm mt-0.5">
                              {formatCurrency(expense.amount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-text-secondary p-10 text-center">
                  <Icon name="FileX" size={48} className="mb-3 opacity-20" />
                  <p>Tidak ada catatan pengeluaran pada tanggal ini.</p>
                </div>
              )}
            </div>
            
            {/* Pagination Component */}
            {expenses.length > expensesPerPage && (
              <div className="pb-4">
                <Pagination
                  currentPage={currentExpensePage}
                  totalPages={totalPagesExpenses}
                  onPageChange={setCurrentExpensePage}
                />
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </>
  );
};

export default LaporanHarian;
