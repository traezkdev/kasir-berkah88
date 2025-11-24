import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaSignInAlt, FaSignOutAlt, FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa'; // Menggunakan ikon Font Awesome
import { useNavigate } from 'react-router-dom';
import StockInModal from './StockInModal';
import StockOutModal from './StockOutModal';
import EditRawMaterialModal from './EditRawMaterialModal';
import AddRawMaterialModal from './AddRawMaterialModal'; // Import AddRawMaterialModal
import { useTheme } from '../../contexts/ThemeContext'; // Import useTheme
import NavigationHeader from '../../components/ui/NavigationHeader'; // Import NavigationHeader

const RawMaterialStockDashboard = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme(); // Gunakan hook useTheme

  // State untuk modal stok masuk/keluar/edit/tambah
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Tambahkan state ini
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchRawMaterials();
  }, []);

  const fetchRawMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/raw-materials`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRawMaterials(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching raw materials:", err);
      setError("Gagal memuat data bahan mentah.");
      setLoading(false);
    }
  };

  const handleStockInClick = (material) => {
    setSelectedMaterial(material);
    setIsStockInModalOpen(true);
  };

  const handleStockOutClick = (material) => {
    setSelectedMaterial(material);
    setIsStockOutModalOpen(true);
  };

  const handleEditClick = (material) => {
    setSelectedMaterial(material);
    setIsEditModalOpen(true);
  };

  const handleAddMaterialClick = () => { // Fungsi baru untuk tombol tambah
    setIsAddModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsStockInModalOpen(false);
    setIsStockOutModalOpen(false);
    setIsEditModalOpen(false);
    setIsAddModalOpen(false); // Tambahkan ini
    setSelectedMaterial(null);
    fetchRawMaterials(); // Refresh data setelah modal ditutup dan transaksi dilakukan
  };

  const handleDeleteClick = async (materialId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus bahan mentah ini? Semua riwayat stok terkait juga akan terhapus.")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/raw-materials/${materialId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchRawMaterials(); // Refresh daftar bahan mentah
        alert("Bahan mentah berhasil dihapus.");
      } catch (err) {
        console.error("Error deleting raw material:", err);
        alert("Gagal menghapus bahan mentah.");
      }
    }
  };

  if (loading) {
    return <div className="p-4 md:p-6 text-center">Memuat data...</div>;
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
      <h1 className="text-2xl font-bold mb-4">Dashboard Stok Bahan Mentah</h1>
        
        <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-4 gap-2">
          <button
            onClick={handleAddMaterialClick} // Panggil fungsi baru
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
          >
            <FaPlus className="mr-2" /> Tambah Bahan Mentah Baru
          </button>
          <button
            onClick={() => navigate('/raw-material-stock/history')} // Navigasi ke halaman riwayat
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
          >
            Lihat Riwayat Stok
          </button>
        </div>

        {/* Table View for Larger Screens */}
        <div className="overflow-x-auto bg-white rounded-lg shadow p-4 hidden sm:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Bahan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok Saat Ini
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satuan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min. Stok
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rawMaterials.map((material) => (
                <tr key={material.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {material.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {parseInt(material.current_stock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {material.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {parseInt(material.min_stock_level)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Number(material.current_stock) < Number(material.min_stock_level) && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 flex items-center">
                        <FaExclamationTriangle className="mr-1" /> Stok Menipis!
                      </span>
                    )}
                    {Number(material.current_stock) >= Number(material.min_stock_level) && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Cukup
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleStockInClick(material)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Stok Masuk"
                    >
                      <FaSignInAlt />
                    </button>
                    <button
                      onClick={() => handleStockOutClick(material)}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                      title="Stok Keluar"
                    >
                      <FaSignOutAlt />
                    </button>
                    <button
                      onClick={() => handleEditClick(material)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit Bahan"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(material.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Hapus Bahan"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card View for Mobile */}
        <div className="block sm:hidden space-y-4 mt-4">
          {rawMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <p className="text-lg font-bold text-gray-900">{material.name}</p>
                <div className="flex-shrink-0">
                  {Number(material.current_stock) < Number(material.min_stock_level) && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Stok Menipis!
                    </span>
                  )}
                  {Number(material.current_stock) >= Number(material.min_stock_level) && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Cukup
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-4">
                  <div>
                    <p className="font-medium">Stok Saat Ini:</p>
                    <p>{parseInt(material.current_stock)} {material.unit}</p>
                  </div>
                  <div>
                    <p className="font-medium">Min. Stok:</p>
                    <p>{parseInt(material.min_stock_level)} {material.unit}</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleStockInClick(material)}
                    className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full bg-indigo-100"
                    title="Stok Masuk"
                  >
                    <FaSignInAlt />
                  </button>
                  <button
                    onClick={() => handleStockOutClick(material)}
                    className="text-yellow-600 hover:text-yellow-900 p-2 rounded-full bg-yellow-100"
                    title="Stok Keluar"
                  >
                    <FaSignOutAlt />
                  </button>
                  <button
                    onClick={() => handleEditClick(material)}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded-full bg-blue-100"
                    title="Edit Bahan"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(material.id)}
                    className="text-red-600 hover:text-red-900 p-2 rounded-full bg-red-100"
                    title="Hapus Bahan"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>


        {selectedMaterial && (
          <>
            <StockInModal
              isOpen={isStockInModalOpen}
              onClose={handleCloseModals}
              material={selectedMaterial}
              onStockUpdated={fetchRawMaterials}
            />
            <StockOutModal
              isOpen={isStockOutModalOpen}
              onClose={handleCloseModals}
              material={selectedMaterial}
              onStockUpdated={fetchRawMaterials}
            />
            <EditRawMaterialModal
              isOpen={isEditModalOpen}
              onClose={handleCloseModals}
              material={selectedMaterial}
              onMaterialUpdated={fetchRawMaterials}
            />
          </>
        )}

        {/* Add Raw Material Modal */}
        <AddRawMaterialModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModals}
          onMaterialAdded={fetchRawMaterials}
        />
      </div>
    </>
  );
};

export default RawMaterialStockDashboard;