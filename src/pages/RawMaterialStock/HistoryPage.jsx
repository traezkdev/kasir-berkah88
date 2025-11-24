import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { FaFilter, FaSyncAlt } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext'; // Import useTheme
import NavigationHeader from '../../components/ui/NavigationHeader'; // Import NavigationHeader

const RawMaterialStockHistory = () => {
  const [history, setHistory] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]); // Untuk dropdown filter bahan
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme(); // Gunakan hook useTheme

  // Filter states
  const [filterMaterialId, setFilterMaterialId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchRawMaterialsForFilter();
    fetchStockHistory();
  }, []); // Hanya dijalankan sekali saat komponen dimuat

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
      // Handle error, but don't block main history load
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
    // Re-fetch history with cleared filters
    setTimeout(fetchStockHistory, 0); // Panggil setelah state di-update
  };

  if (loading) {
    return <div className="p-4 md:p-6 text-center">Memuat riwayat stok...</div>;
  }

  if (error) {
    return <div className="p-4 md:p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <>
      {theme !== 'admin' && (
        <NavigationHeader />
      )}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 ${theme !== 'admin' ? 'mt-16' : ''}`}>
      <h1 className="text-2xl font-bold mb-4">Riwayat Stok Bahan Mentah</h1>

      {/* Filter Section */}
      <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="materialFilter" className="block text-sm font-medium text-gray-700">Bahan Mentah:</label>
          <select
            id="materialFilter"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
          <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700">Jenis Transaksi:</label>
          <select
            id="typeFilter"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Semua Jenis</option>
            <option value="in">Stok Masuk</option>
            <option value="out">Stok Keluar</option>
          </select>
        </div>
        <div>
          <label htmlFor="startDateFilter" className="block text-sm font-medium text-gray-700">Dari Tanggal:</label>
          <input
            type="date"
            id="startDateFilter"
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="endDateFilter" className="block text-sm font-medium text-gray-700">Sampai Tanggal:</label>
          <input
            type="date"
            id="endDateFilter"
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>
        <div className="md:col-span-2 lg:col-span-4 flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaSyncAlt className="mr-2" /> Reset Filter
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaFilter className="mr-2" /> Terapkan Filter
          </button>
        </div>
      </form>

      {/* History Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal Transaksi
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Bahan
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jenis
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jumlah
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satuan
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Keterangan
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.length > 0 ? (
              history.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {moment(record.transaction_date).format('DD MMMM YYYY, HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.material_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {record.type === 'in' ? 'Masuk' : 'Keluar'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {parseInt(record.quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.material_unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.notes}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  Tidak ada riwayat stok yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div> {/* Penutup untuk div container utama */}
    </>
  );
};

export default RawMaterialStockHistory;