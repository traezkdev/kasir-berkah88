import React, { useState, useEffect, useCallback } from 'react';
import authFetch from '../../utils/authFetch';
import { RingLoader } from 'react-spinners';
import * as XLSX from 'xlsx';
import { exportToPdf } from '../../utils/exportUtils'; // Correctly import the utility
import { useTheme } from '../../contexts/ThemeContext';

const LaporanLengkap = () => {
  const { theme } = useTheme();
  const [laporanData, setLaporanData] = useState(null);
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
      setLaporanData(data.data);
      // Reset all current pages on new data fetch
      setPagination({
        transactions: 1,
        expenses: 1,
        lapak: 1,
        owner: 1,
        menu: 1,
        raw: 1,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchLaporan();
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

    XLSX.writeFile(wb, "Laporan_Lengkap.xlsx");
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

    exportToPdf(sections, 'Laporan_Lengkap');
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
    <div className={theme === 'default' ? "p-4 md:p-6" : ""}>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Laporan Lengkap</h1>

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
        </div>
      )}
    </div>
  );
};

export default LaporanLengkap;
