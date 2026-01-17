import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { FaFilter, FaSyncAlt, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import useNotification from '../../hooks/useNotification';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

const OwnerRawMaterialStockHistory = () => {
  const [history, setHistory] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { message, error: notificationError, showMessage, showError } = useNotification();

  const [filterMaterialId, setFilterMaterialId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [historyEntryToDelete, setHistoryEntryToDelete] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchRawMaterialsForFilter();
    fetchStockHistory();
  }, []);

  const fetchRawMaterialsForFilter = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/raw-materials`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRawMaterials(response.data.data);
    } catch (err) {
      console.error("Error fetching raw materials for filter:", err);
    }
  };

  const fetchStockHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (filterMaterialId) params.material_id = filterMaterialId;
      if (filterType) params.type = filterType;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;

      const response = await axios.get(`${API_BASE_URL}/api/raw-materials/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: params
      });
      setHistory(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching stock history:", err);
      setError("Gagal memuat riwayat stok.");
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchStockHistory();
  };

  const handleResetFilters = () => {
    setFilterMaterialId('');
    setFilterType('');
    setFilterStartDate('');
    setFilterEndDate('');
    setTimeout(fetchStockHistory, 0);
  };

  const handleDeleteHistoryEntry = (historyId) => {
    setHistoryEntryToDelete(historyId);
    setShowDeleteConfirmationModal(true);
  };

  const confirmDeleteHistoryEntry = async () => {
    setShowDeleteConfirmationModal(false);
    if (!historyEntryToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/raw-materials/history/${historyEntryToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showMessage("Entri riwayat stok berhasil dihapus dan stok dikembalikan.");
      fetchStockHistory();
    } catch (err) {
      console.error("Error deleting stock history entry:", err);
      showError(err.response?.data?.error || "Gagal menghapus entri riwayat stok.");
    } finally {
      setHistoryEntryToDelete(null);
    }
  };

  if (loading) {
    return <div className="p-4 md:p-6 text-center">Memuat riwayat stok...</div>;
  }

  if (error) {
    return <div className="p-4 md:p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && <OwnerNavigationHeader />}
      <main className={`${theme === 'default' ? 'pt-20 lg:pt-16' : ''} pb-24 lg:pb-8`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6" : "py-4 md:py-6"}>
          <BreadcrumbNavigation paths={[{ name: 'Beranda Owner', path: '/owner-dashboard' }, { name: 'Stok Bahan Mentah Owner', path: '/owner-raw-material-stock' }, { name: 'Riwayat Stok', path: '/owner-raw-material-stock/history' }]} className="mb-4" />
          <h1 className="text-2xl font-bold mb-4">Riwayat Stok Bahan Mentah Owner</h1>

          {/* Tombol Kembali */}
          <button
            onClick={() => navigate('/owner-raw-material-stock')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Kembali ke Dashboard Stok Owner
          </button>

          {/* Filter Section */}
          <form onSubmit={handleFilterSubmit} className="bg-card p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border border-border">
            <div>
              <label htmlFor="materialFilter" className="block text-sm font-medium text-muted-foreground">Bahan Mentah:</label>
              <select
                id="materialFilter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-border focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-card text-foreground"
                value={filterMaterialId}
                onChange={(e) => setFilterMaterialId(e.target.value)}
              >
                <option value="">Semua Bahan</option>
                {rawMaterials.map(material => (
                  <option key={material.id} value={material.id}>{material.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="typeFilter" className="block text-sm font-medium text-muted-foreground">Jenis Transaksi:</label>
              <select
                id="typeFilter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-border focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-card text-foreground"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Semua Jenis</option>
                <option value="in">Stok Masuk</option>
                <option value="out">Stok Keluar</option>
              </select>
            </div>
            <div>
              <label htmlFor="startDateFilter" className="block text-sm font-medium text-muted-foreground">Dari Tanggal:</label>
              <input
                type="date"
                id="startDateFilter"
                className="mt-1 block w-full shadow-sm sm:text-sm border border-border rounded-md bg-card text-foreground p-2"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="endDateFilter" className="block text-sm font-medium text-muted-foreground">Sampai Tanggal:</label>
              <input
                type="date"
                id="endDateFilter"
                className="mt-1 block w-full shadow-sm sm:text-sm border border-border rounded-md bg-card text-foreground p-2"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-muted-foreground bg-muted hover:bg-muted/80 focus:outline-none"
              >
                <FaSyncAlt className="mr-2" /> Reset Filter
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none"
              >
                <FaFilter className="mr-2" /> Terapkan Filter
              </button>
            </div>
          </form>

          {/* Table View for Larger Screens */}
          <div className="overflow-x-auto bg-card rounded-lg shadow p-4 lg:pb-0 pb-24 hidden sm:block">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Transaksi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Bahan</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Jenis</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Jumlah</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Satuan</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Keterangan</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {history.length > 0 ? (
                  history.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{moment(record.transaction_date).format('DD MMMM YYYY, HH:mm')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{record.material_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.type === 'in' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {record.type === 'in' ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{parseFloat(record.quantity)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{record.material_unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{record.notes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleDeleteHistoryEntry(record.id)} className="text-destructive hover:text-destructive/80" title="Hapus Riwayat"><FaTrash /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-center">Tidak ada riwayat stok yang ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Card View for Mobile */}
          <div className="block sm:hidden space-y-4 mt-4 lg:pb-0 pb-24">
            {history.length > 0 ? (
              history.map((record) => (
                <div key={record.id} className="bg-card rounded-lg shadow-md p-4 border border-border mb-4 w-full">
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">Tanggal:</span> {moment(record.transaction_date).format('DD MMMM YYYY, HH:mm')}
                  </p>
                  <p className="text-lg font-bold text-foreground mb-1">{record.material_name}</p>
                  <div className="flex items-center mb-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.type === 'in' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'} mr-2`}>
                      {record.type === 'in' ? 'Masuk' : 'Keluar'}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Jumlah:</span> {parseFloat(record.quantity)} {record.material_unit}
                    </p>
                  </div>
                  {record.notes && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Keterangan:</span> {record.notes}
                    </p>
                  )}
                  <div className="flex justify-end mt-2">
                    <button onClick={() => handleDeleteHistoryEntry(record.id)} className="text-destructive hover:text-destructive/80 p-2 rounded-full bg-destructive/10" title="Hapus Riwayat"><FaTrash /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground mt-4">Tidak ada riwayat stok yang ditemukan.</div>
            )}
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={showDeleteConfirmationModal}
        onClose={() => setShowDeleteConfirmationModal(false)}
        onConfirm={confirmDeleteHistoryEntry}
        title="Hapus Entri Riwayat Stok"
        message="Apakah Anda yakin ingin menghapus entri riwayat stok ini? Tindakan ini tidak akan mengembalikan stok bahan mentah terkait. Ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />

      {message && <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{message}</div>}
      {notificationError && <div className="fixed bottom-5 right-5 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{notificationError}</div>}
    </div>
  );
};

export default OwnerRawMaterialStockHistory;