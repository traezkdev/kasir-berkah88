import React, { useState, useEffect, useCallback } from 'react';
import authFetch from '../../utils/authFetch';
import { RingLoader } from 'react-spinners';
import * as XLSX from 'xlsx';
import { exportToPdf } from '../../utils/exportUtils'; // Correctly import the utility
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Icon from '../../components/AppIcon';

import NavigationHeader from '../../components/ui/NavigationHeader';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { jwtDecode } from 'jwt-decode';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';

const LaporanLengkap = ({ headerTitle }) => {
  const { theme } = useTheme();
  const { toggleSidebar } = useAppSettings();
  const [laporanData, setLaporanData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states for all sections
  const [pagination, setPagination] = useState({
    transactions: 1,
    expenses: 1,
    lapak: 1,
    owner: 1,
    menu: 1,
    raw: 1,
    reconciliations: 1,
  });
  const ITEMS_PER_PAGE = 10;

  const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/laporan-lengkap';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (startDate && endDate) url += `?${params.toString()}`;

      const response = await authFetch(url);
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Fetch reconciliations
      const reconciliationsUrl = `/api/cash-reconciliation/history?limit=1000${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`;
      const reconciliationsResponse = await authFetch(reconciliationsUrl);
      const reconciliationsData = await reconciliationsResponse.json();



      setLaporanData({
        ...data.data,
        reconciliations: reconciliationsData.data || []
      });

      // Reset all current pages on new data fetch
      setPagination({
        transactions: 1,
        expenses: 1,
        lapak: 1,
        owner: 1,
        menu: 1,
        raw: 1,
        reconciliations: 1,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchLaporan();

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
  }, [fetchLaporan]);

  const handleFilter = () => {
    fetchLaporan();
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Transactions
    const wsTransactions = XLSX.utils.json_to_sheet(laporanData.transactions.map(t => ({
      'ID Transaksi': t.id,
      'Tanggal': new Date(t.timestamp).toLocaleString(),
      'Total': t.total,
      'Metode Pembayaran': t.payment_method,
      'Kasir': t.cashier_name
    })));
    XLSX.utils.book_append_sheet(wb, wsTransactions, "Transaksi");

    // Expenses
    const wsExpenses = XLSX.utils.json_to_sheet(laporanData.expenses.map(e => ({
      'Nama Pengeluaran': e.name,
      'Jumlah': e.amount,
      'Kategori': e.category,
      'Tanggal': new Date(e.date).toLocaleDateString(),
      'Dicatat oleh': e.recorded_by
    })));
    XLSX.utils.book_append_sheet(wb, wsExpenses, "Pengeluaran");

    // Lapak & Owner
    const wsLapak = XLSX.utils.json_to_sheet(laporanData.lapakAccountTransactions.map(t => ({
      'Tipe': t.type,
      'Jumlah': t.amount,
      'Deskripsi': t.description,
      'Dibuat Oleh': t.created_by_username,
      'Tanggal': new Date(t.created_at).toLocaleString()
    })));
    XLSX.utils.book_append_sheet(wb, wsLapak, "Uang Lapak");

    const wsOwner = XLSX.utils.json_to_sheet(laporanData.ownerAccountTransactions.map(t => ({
      'Tipe': t.type,
      'Jumlah': t.amount,
      'Deskripsi': t.description,
      'Dibuat Oleh': t.created_by_username,
      'Tanggal': new Date(t.created_at).toLocaleString()
    })));
    XLSX.utils.book_append_sheet(wb, wsOwner, "Uang Owner");

    // Stocks
    const wsMenuStock = XLSX.utils.json_to_sheet(laporanData.menuStock);
    XLSX.utils.book_append_sheet(wb, wsMenuStock, "Stok Menu");
    const wsRawMaterialStock = XLSX.utils.json_to_sheet(laporanData.rawMaterialStock);
    XLSX.utils.book_append_sheet(wb, wsRawMaterialStock, "Stok Bahan Mentah");

    // Reconciliations
    if (laporanData.reconciliations && laporanData.reconciliations.length > 0) {
      const wsReconciliations = XLSX.utils.json_to_sheet(laporanData.reconciliations.map(r => ({
        'Tanggal': new Date(r.date).toLocaleDateString('id-ID'),
        'User': r.reconciled_by || 'System',
        'Tunai Aktual': r.actual_tunai,
        'Transfer Aktual': r.actual_transfer,
        'Gojek Aktual': r.actual_gojek,
        'Selisih Tunai': r.variance_tunai,
        'Selisih Transfer': r.variance_transfer,
        'Selisih Gojek': r.variance_gojek,
        'Catatan': r.notes || '-'
      })));
      XLSX.utils.book_append_sheet(wb, wsReconciliations, "Rekonsiliasi");
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return 'all';
      const [y, m, d] = dateStr.split('-');
      return `${d}-${m}-${y}`;
    };
    const filename = `Laporan_Lengkap_${formatDate(startDate)}_sd_${formatDate(endDate)}`;
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!laporanData) return;

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    const sections = [
      {
        title: "Laporan Transaksi",
        headers: ['ID', 'Tanggal', 'Total', 'Metode Pembayaran'],
        rows: laporanData.transactions.map(t => [
          t.id,
          new Date(t.timestamp).toLocaleString(),
          formatCurrency(t.total),
          t.payment_method
        ]),
      },
      {
        title: "Laporan Pengeluaran",
        headers: ['Nama', 'Jumlah', 'Tanggal'],
        rows: laporanData.expenses.map(e => [
          e.name,
          formatCurrency(e.amount),
          new Date(e.date).toLocaleDateString()
        ]),
      },
      {
        title: "Laporan Uang Lapak",
        headers: ['Tipe', 'Jumlah', 'Deskripsi', 'Tanggal'],
        rows: laporanData.lapakAccountTransactions.map(t => [
          t.type,
          formatCurrency(t.amount),
          t.description,
          new Date(t.created_at).toLocaleString()
        ]),
      },
      {
        title: "Laporan Uang Owner",
        headers: ['Tipe', 'Jumlah', 'Deskripsi', 'Tanggal'],
        rows: laporanData.ownerAccountTransactions.map(t => [
          t.type,
          formatCurrency(t.amount),
          t.description,
          new Date(t.created_at).toLocaleString()
        ]),
      },
      {
        title: "Laporan Stok Menu",
        headers: ['Nama Menu', 'Stok Tersisa'],
        rows: laporanData.menuStock.map(item => [item.name, item.stock]),
      },
      {
        title: "Laporan Stok Bahan Mentah",
        headers: ['Nama Bahan', 'Stok Tersisa'],
        rows: laporanData.rawMaterialStock.map(item => [item.name, `${item.current_stock} ${item.unit}`]),
      },
    ];

    // Add reconciliations if available
    if (laporanData.reconciliations && laporanData.reconciliations.length > 0) {
      sections.push({
        title: "Laporan Rekonsiliasi Kas",
        headers: ['Tanggal', 'User', 'Tunai', 'Transfer', 'Gojek', 'Selisih Tunai', 'Selisih Transfer', 'Selisih Gojek'],
        rows: laporanData.reconciliations.map(r => [
          new Date(r.date).toLocaleDateString('id-ID'),
          r.reconciled_by || 'System',
          formatCurrency(r.actual_tunai),
          formatCurrency(r.actual_transfer),
          formatCurrency(r.actual_gojek),
          formatCurrency(r.variance_tunai),
          formatCurrency(r.variance_transfer),
          formatCurrency(r.variance_gojek)
        ]),
      });
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return 'all';
      const [y, m, d] = dateStr.split('-');
      return `${d}-${m}-${y}`;
    };
    const filename = `Laporan_Lengkap_${formatDate(startDate)}_sd_${formatDate(endDate)}`;
    exportToPdf(sections, filename, { startDate, endDate });
  };

  // Generic pagination logic
  const getPaginatedData = (data, page) => {
    if (!data) return { paginated: [], totalPages: 0 };
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const paginated = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    return { paginated, totalPages };
  };

  const handlePageChange = (section, newPage) => {
    setPagination(prev => ({ ...prev, [section]: newPage }));
  };

  const { paginated: paginatedTransactions, totalPages: totalPagesTransactions } = getPaginatedData(laporanData?.transactions, pagination.transactions);
  const { paginated: paginatedExpenses, totalPages: totalPagesExpenses } = getPaginatedData(laporanData?.expenses, pagination.expenses);
  const { paginated: paginatedLapak, totalPages: totalPagesLapak } = getPaginatedData(laporanData?.lapakAccountTransactions, pagination.lapak);
  const { paginated: paginatedOwner, totalPages: totalPagesOwner } = getPaginatedData(laporanData?.ownerAccountTransactions, pagination.owner);
  const { paginated: paginatedMenu, totalPages: totalPagesMenu } = getPaginatedData(laporanData?.menuStock, pagination.menu);
  const { paginated: paginatedRaw, totalPages: totalPagesRaw } = getPaginatedData(laporanData?.rawMaterialStock, pagination.raw);
  const { paginated: paginatedReconciliations, totalPages: totalPagesReconciliations } = getPaginatedData(laporanData?.reconciliations, pagination.reconciliations);

  const PaginationControls = ({ section, currentPage, totalPages }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => handlePageChange(section, Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="btn btn-sm"
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => handlePageChange(section, Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="btn btn-sm"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50 lg:bg-background' : ''}`}>
      {theme === 'default' && (
        userRole === 'owner' ? (
          <OwnerNavigationHeader
            onToggleSidebar={toggleSidebar}
            headerTitle={headerTitle || "Laporan Lengkap"}
          />
        ) : (
          <NavigationHeader
            onToggleSidebar={toggleSidebar}
            headerTitle={headerTitle || "Laporan Lengkap"}
          />
        )
      )}

      <main className={`${theme === 'default' ? 'pt-20 lg:pt-16' : ''} pb-24 lg:pb-8`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6 pt-8 lg:py-6" : ""}>
          <div className="mb-8 lg:mb-6">
            <h1 className="text-3xl lg:text-3xl font-black text-text-primary mt-4 tracking-tighter uppercase lg:normal-case">
              Laporan Lengkap
            </h1>
            <div className="w-12 h-1 bg-blue-600 rounded-full mt-2 lg:hidden"></div>
            <p className="text-xs lg:text-sm text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-60">
              Analisis mendalam data penjualan dan operasional
            </p>
          </div>

          <div className="mb-6 p-4 bg-white rounded-lg shadow-md flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm font-medium">Dari:</label>
              <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="input input-bordered input-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm font-medium">Sampai:</label>
              <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="input input-bordered input-sm" />
            </div>
            <button onClick={handleFilter} className="btn btn-primary btn-sm">Filter</button>
            <div className="flex-grow"></div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportExcel} className="btn btn-success btn-sm" disabled={!laporanData || loading}>Export Excel</button>
              <button onClick={handleExportPDF} className="btn btn-error btn-sm" disabled={!laporanData || loading}>Export PDF</button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RingLoader color="#4A90E2" size={80} />
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 bg-red-100 rounded-md">Error: {error}</div>
          ) : (
            <div className="space-y-8">
              {/* Statistics Overview Section */}
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <Icon name="BarChart3" className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary">Ringkasan Statistik</h2>
                    <p className="text-sm text-text-secondary">Visualisasi data periode yang dipilih</p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Total Transaksi */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Icon name="ShoppingCart" className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Total Transaksi</p>
                        <h3 className="text-3xl font-bold mt-1">{laporanData?.transactions?.length || 0}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-blue-100 text-sm">
                      <Icon name="TrendingUp" className="w-4 h-4" />
                      <span>Semua metode pembayaran</span>
                    </div>
                  </div>

                  {/* Total Pendapatan */}
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Icon name="DollarSign" className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Total Pendapatan</p>
                        <h3 className="text-2xl font-bold mt-1">
                          Rp {(laporanData?.transactions?.reduce((sum, t) => sum + parseFloat(t.total || 0), 0) || 0).toLocaleString()}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-100 text-sm">
                      <Icon name="ArrowUpRight" className="w-4 h-4" />
                      <span>Dari penjualan</span>
                    </div>
                  </div>

                  {/* Total Pengeluaran */}
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Icon name="Receipt" className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <p className="text-orange-100 text-xs font-medium uppercase tracking-wider">Total Pengeluaran</p>
                        <h3 className="text-2xl font-bold mt-1">
                          Rp {(laporanData?.expenses?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0).toLocaleString()}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-orange-100 text-sm">
                      <Icon name="ArrowDownRight" className="w-4 h-4" />
                      <span>Operasional & lainnya</span>
                    </div>
                  </div>

                  {/* Laba Bersih */}
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Icon name="Wallet" className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <p className="text-purple-100 text-xs font-medium uppercase tracking-wider">Laba Bersih</p>
                        <h3 className="text-2xl font-bold mt-1">
                          Rp {((laporanData?.transactions?.reduce((sum, t) => sum + parseFloat(t.total || 0), 0) || 0) - (laporanData?.expenses?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0)).toLocaleString()}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-purple-100 text-sm">
                      <Icon name="TrendingUp" className="w-4 h-4" />
                      <span>Pendapatan - Pengeluaran</span>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Payment Methods Distribution */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name="PieChart" className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900">Distribusi Metode Pembayaran</h3>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(() => {
                              const paymentMethods = {};
                              laporanData?.transactions?.forEach(t => {
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
                                name: name.charAt(0).toUpperCase() + name.slice(1),
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
                              laporanData?.transactions?.forEach(t => {
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
                          <Tooltip formatter={(value) => [`${value} transaksi`, 'Jumlah']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top 5 Menu Items */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name="TrendingUp" className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-bold text-gray-900">Top 5 Menu Terlaris</h3>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(() => {
                            const menuSales = {};
                            laporanData?.transactions?.forEach(t => {
                              try {
                                const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
                                if (Array.isArray(items)) {
                                  items.forEach(item => {
                                    const name = item.name || 'Unknown';
                                    menuSales[name] = (menuSales[name] || 0) + (item.quantity || 0);
                                  });
                                }
                              } catch (e) { }
                            });
                            return Object.entries(menuSales)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 5)
                              .map(([name, quantity]) => ({ name, quantity }));
                          })()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} porsi`, 'Terjual']} />
                          <Bar dataKey="quantity" fill="#10b981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Stock Status */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name="Package" className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-bold text-gray-900">Status Stok</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Icon name="UtensilsCrossed" className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Menu</p>
                            <p className="text-2xl font-bold text-gray-900">{laporanData?.menuStock?.length || 0}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Stok Rendah</p>
                          <p className="text-lg font-bold text-orange-600">
                            {laporanData?.menuStock?.filter(m => m.stock <= 5).length || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <Icon name="Leaf" className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Bahan Mentah</p>
                            <p className="text-2xl font-bold text-gray-900">{laporanData?.rawMaterialStock?.length || 0}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Perlu Restock</p>
                          <p className="text-lg font-bold text-orange-600">
                            {laporanData?.rawMaterialStock?.filter(r => parseFloat(r.current_stock) <= 10).length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name="Wallet" className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-bold text-gray-900">Ringkasan Akun</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <Icon name="Store" className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Transaksi Lapak</p>
                            <p className="text-2xl font-bold text-gray-900">{laporanData?.lapakAccountTransactions?.length || 0}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total Mutasi</p>
                          <p className="text-sm font-bold text-gray-700">
                            Rp {(laporanData?.lapakAccountTransactions?.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 0) || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Icon name="User" className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Transaksi Owner</p>
                            <p className="text-2xl font-bold text-gray-900">{laporanData?.ownerAccountTransactions?.length || 0}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total Mutasi</p>
                          <p className="text-sm font-bold text-gray-700">
                            Rp {(laporanData?.ownerAccountTransactions?.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 0) || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section>
                <h2 className="text-xl font-semibold mb-3">Transaksi</h2>
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode Pembayaran</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedTransactions?.map(item => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(item.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">Rp {item.total.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.payment_method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls section="transactions" currentPage={pagination.transactions} totalPages={totalPagesTransactions} />
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Pengeluaran</h2>
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedExpenses?.map(item => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">Rp {item.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(item.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls section="expenses" currentPage={pagination.expenses} totalPages={totalPagesExpenses} />
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <h2 className="text-xl font-semibold mb-3">Uang Lapak</h2>
                  <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLapak?.map(item => (
                          <tr key={item.id}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>{item.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">Rp {item.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls section="lapak" currentPage={pagination.lapak} totalPages={totalPagesLapak} />
                </section>
                <section>
                  <h2 className="text-xl font-semibold mb-3">Uang Owner</h2>
                  <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOwner?.map(item => (
                          <tr key={item.id}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>{item.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">Rp {item.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls section="owner" currentPage={pagination.owner} totalPages={totalPagesOwner} />
                </section>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <h2 className="text-xl font-semibold mb-3">Stok Menu</h2>
                  <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Menu</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Tersisa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedMenu?.map(item => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls section="menu" currentPage={pagination.menu} totalPages={totalPagesMenu} />
                </section>
                <section>
                  <h2 className="text-xl font-semibold mb-3">Stok Bahan Mentah</h2>
                  <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Bahan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Tersisa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRaw?.map(item => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.current_stock} {item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls section="raw" currentPage={pagination.raw} totalPages={totalPagesRaw} />
                </section>
              </div>

              {/* Riwayat Rekonsiliasi Section */}
              <div className="mt-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                      <path d="M12 7v5l4 2"></path>
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-900">Riwayat Rekonsiliasi</h2>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {!laporanData?.reconciliations || laporanData.reconciliations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>Belum ada data rekonsiliasi kas.</p>
                      <p className="text-sm mt-2">Silakan lakukan rekonsiliasi kas terlebih dahulu di halaman Rekonsiliasi Kas.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                          <tr>
                            <th className="px-6 py-3">Tanggal</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Tunai (Act)</th>
                            <th className="px-6 py-3">Transfer (Act)</th>
                            <th className="px-6 py-3">Gojek (Act)</th>
                            <th className="px-6 py-3">Total Selisih</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Catatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedReconciliations?.map(item => {
                            const totalVariance = (parseFloat(item.variance_tunai) || 0) + (parseFloat(item.variance_transfer) || 0) + (parseFloat(item.variance_gojek) || 0);
                            const getStatus = (variance) => {
                              if (variance === 0) return { label: 'PAS', color: 'text-green-600', bgColor: 'bg-green-50' };
                              if (variance > 0) return { label: 'KURANG', color: 'text-red-600', bgColor: 'bg-red-50' };
                              return { label: 'LEBIH', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
                            };
                            const status = getStatus(totalVariance);

                            return (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                                  {new Date(item.date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                  {item.reconciled_by || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                  Rp {(item.actual_tunai || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                  Rp {(item.actual_transfer || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                  Rp {(item.actual_gojek || 0).toLocaleString()}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap font-bold ${status.color}`}>
                                  Rp {Math.abs(totalVariance).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                                    {status.label}
                                  </span>
                                </td>
                                <td className="px-6 py-4 max-w-xs">
                                  <div className="text-sm text-gray-900 truncate" title={item.notes || ''}>
                                    {item.notes ? (
                                      <span className="italic">{item.notes}</span>
                                    ) : (
                                      <span className="text-gray-500">-</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {laporanData?.reconciliations && laporanData.reconciliations.length > 0 && (
                  <PaginationControls section="reconciliations" currentPage={pagination.reconciliations} totalPages={totalPagesReconciliations} />
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LaporanLengkap;
