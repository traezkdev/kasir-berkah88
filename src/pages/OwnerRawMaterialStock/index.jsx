import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import EditRawMaterialModal from '../RawMaterialStock/EditRawMaterialModal';
import AddRawMaterialModal from '../RawMaterialStock/AddRawMaterialModal';
import { useTheme } from '../../contexts/ThemeContext';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import useNotification from '../../hooks/useNotification';
import MetricsCard from '../main-dashboard/components/MetricsCard';
import Icon from '../../components/AppIcon';

const formatCurrency = (amount) => {
  const safeAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
  return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
  })?.format(safeAmount);
};

const OwnerRawMaterialStockDashboard = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { message, error: notificationError, showMessage, showError } = useNotification();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Helper function for safe number conversion
  const toSafeNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

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

  const handleEditClick = (material) => {
    setSelectedMaterial(material);
    setIsEditModalOpen(true);
  };

  const handleAddMaterialClick = () => {
    setIsAddModalOpen(true);
  };



  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsAddModalOpen(false);

    setSelectedMaterial(null);
    fetchRawMaterials();
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
        fetchRawMaterials();
        showMessage("Bahan mentah berhasil dihapus.");
      } catch (err) {
        console.error("Error deleting raw material:", err);
        showError("Gagal menghapus bahan mentah.");
      }
    }
  };

  if (loading) {
    return <div className="p-4 md:p-6 text-center">Memuat data...</div>;
  }

  if (error) {
    return <div className="p-4 md:p-6 text-center text-red-500">{error}</div>;
  }

  const totalStockQuantity = rawMaterials.reduce((sum, material) => sum + toSafeNumber(material.current_stock) + toSafeNumber(material.menu_stock), 0);
  const totalStockValue = rawMaterials.reduce((sum, material) => sum + ((toSafeNumber(material.current_stock) + toSafeNumber(material.menu_stock)) * toSafeNumber(material.price_per_item)), 0);
  const lowStockItemsCount = rawMaterials.filter(material => (toSafeNumber(material.current_stock) + toSafeNumber(material.menu_stock)) < toSafeNumber(material.stok_minimum)).length;


  return (
    <>
      <OwnerNavigationHeader />
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 mt-16`}>
      <h1 className="text-2xl font-bold mb-4">Dashboard Stok Bahan Mentah Owner</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <MetricsCard
            title="Total Kuantitas Stok"
            value={`${totalStockQuantity} Item`}
            icon="Package"
            color="primary"
            description="Jumlah total semua bahan mentah"
          />
          <MetricsCard
            title="Total Nilai Stok"
            value={formatCurrency(totalStockValue)}
            icon="DollarSign"
            color="success"
            description="Estimasi nilai total bahan mentah"
          />
          <MetricsCard
            title="Bahan Stok Menipis"
            value={`${lowStockItemsCount} Jenis`}
            icon="AlertCircle"
            color="destructive"
            description="Jumlah jenis bahan di bawah stok minimum"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-4 gap-2">
          <button
            onClick={handleAddMaterialClick}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
          >
            <FaPlus className="mr-2" /> Tambah Bahan Mentah Baru
          </button>
          
        </div>

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
                  Stok Menu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satuan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok Min
                </th>

                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga per Item
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
                    {toSafeNumber(material.current_stock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {toSafeNumber(material.menu_stock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                      onClick={() => handleEditClick(material)}
                  >
                    {material.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {toSafeNumber(material.stok_minimum)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {toSafeNumber(material.price_per_item).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Number(material.current_stock) < Number(material.stok_minimum) && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 flex items-center">
                        <FaExclamationTriangle className="mr-1" /> Stok Menipis!
                      </span>
                    )}
                    {Number(material.current_stock) >= Number(material.stok_minimum) && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Cukup
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">


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

              <div className="block sm:hidden space-y-4 mt-4 pb-24">          {rawMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-200">
                <p className="text-lg font-bold text-gray-900">{material.name}</p>
                <div className="flex-shrink-0">
                  {Number(material.current_stock) < Number(material.stok_minimum) && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Stok Menipis!
                    </span>
                  )}
                  {Number(material.current_stock) >= Number(material.stok_minimum) && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Cukup
                      </span>
                    )}
                  </div>
                </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary pb-2 mb-2 border-b border-border">
                                <div>
                                  <p className="font-medium">Stok Saat Ini:</p>
                                  <p>{(Number(material.current_stock) || 0)} {material.unit}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Stok Menu:</p>
                                  <p>{(Number(material.menu_stock) || 0)} {material.unit}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Stok Min:</p>
                                  <p onClick={() => handleEditClick(material)} className="cursor-pointer">{(Number(material.stok_minimum) || 0)} {material.unit}</p>
                                </div>
                              </div>

                              {/* Block 2: Harga per Item only */}
                              <div className="grid grid-cols-1 gap-2 text-sm text-text-secondary pb-2 mb-2 border-b border-border">
                                <div> {/* Harga per Item */}
                                  <p className="font-medium">Harga per Item:</p>
                                  <p>{(Number(material.price_per_item) || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
                                </div>
                              </div>
                <div className="flex justify-end space-x-2">



                  <button
                    onClick={() => handleEditClick(material)}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded-full bg-primary/10"
                    title="Edit Bahan"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(material.id)}
                    className="text-red-600 hover:text-red-900 p-2 rounded-full bg-destructive/10"
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

            <EditRawMaterialModal
              isOpen={isEditModalOpen}
              onClose={handleCloseModals}
              material={selectedMaterial}
              onMaterialUpdated={fetchRawMaterials}
              showMessage={showMessage}
              showError={showError}
            />
          </>
        )}

        <AddRawMaterialModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModals}
          onMaterialAdded={fetchRawMaterials}
          showMessage={showMessage}
          showError={showError}
        />
      </div>
      {message && <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{message}</div>}
      {notificationError && <div className="fixed bottom-5 right-5 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{notificationError}</div>}
    </>
  );
};

export default OwnerRawMaterialStockDashboard;
