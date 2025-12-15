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
import useNotification from '../../hooks/useNotification'; // Import useNotification
import MetricsCard from '../main-dashboard/components/MetricsCard'; // Import MetricsCard
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation'; // Import BreadcrumbNavigation
import Icon from '../../components/AppIcon'; // Import Icon
import { exportToExcel, exportToPdf, prepareRawMaterialStockDataForExport } from '../../utils/exportUtils'; // Import export utilities
import UnitSettingsModal from './UnitSettingsModal';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const RawMaterialStockDashboard = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Keep local error state for initial fetch
  const navigate = useNavigate();
  const { theme } = useTheme(); // Gunakan hook useTheme
  const { message, error: notificationError, showMessage, showError } = useNotification(); // Use notification hook

  // State untuk modal stok masuk/keluar/edit/tambah
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Tambahkan state ini
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // State for Unit Settings
  const [isUnitSettingsOpen, setIsUnitSettingsOpen] = useState(false);
  const [units, setUnits] = useState([]); // Store units for calculation logic

  // State for search
  const [searchQuery, setSearchQuery] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchRawMaterials();
    fetchUnits(); // Fetch units
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

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/units`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnits(response.data.data);
    } catch (err) {
      console.error("Error fetching units:", err);
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
    setIsUnitSettingsOpen(false);
    setSelectedMaterial(null);
    fetchRawMaterials(); // Refresh data setelah modal ditutup dan transaksi dilakukan
    fetchUnits(); // Logic might change if units changed
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

  const handleExportExcel = () => {
    const dataToExport = prepareRawMaterialStockDataForExport(rawMaterials, units);
    exportToExcel(dataToExport, `Laporan_Stok_Bahan_Mentah_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPdf = () => {
    const dataToExport = prepareRawMaterialStockDataForExport(rawMaterials, units);
    exportToPdf(dataToExport, `Laporan_Stok_Bahan_Mentah_${new Date().toISOString().split('T')[0]}`);
  };



  // Helper to check if unit is calculable
  const isUnitCalculable = (unitName) => {
    // Default to true if units not loaded yet or logic fails, to be safe? Or strict? 
    // Plan said: "If no, value = 0". So default false if not found? 
    // But standard units like 'kg' might be missing from DB if not seeded correctly?
    // Assuming DB is seeded.
    const unit = units.find(u => u.name.toLowerCase() === (unitName || '').toLowerCase());
    return unit ? unit.is_calculable : true; // Default to true if unit not found in settings (fallback behavior)
  };

  // Calculate metrics
  const totalMenuStockValue = rawMaterials.reduce((sum, material) => {
    const isCalculable = isUnitCalculable(material.unit);
    if (isCalculable) {
      return sum + (parseInt(material.menu_stock || 0) * parseFloat(material.price_per_item || 0));
    } else {
      // For non-calculable units, use price directly
      return sum + parseFloat(material.price_per_item || 0);
    }
  }, 0);

  // Revised calculations based on unit calculability
  const totalStockValue = rawMaterials.reduce((sum, material) => {
    const isCalculable = isUnitCalculable(material.unit);
    if (isCalculable) {
      const menuValue = (parseInt(material.menu_stock || 0) * parseFloat(material.price_per_item || 0));
      const rawValue = (parseInt(material.current_stock || 0) * parseFloat(material.raw_stock_price || 0));
      return sum + menuValue + rawValue;
    } else {
      // For non-calculable units, use prices directly
      const menuValue = parseFloat(material.price_per_item || 0);
      const rawValue = parseFloat(material.raw_stock_price || 0);
      return sum + menuValue + rawValue;
    }
  }, 0);

  const currentRawMaterialStockValue = rawMaterials.reduce((sum, material) => {
    const isCalculable = isUnitCalculable(material.unit);
    if (isCalculable) {
      return sum + (parseInt(material.current_stock || 0) * parseFloat(material.raw_stock_price || 0));
    } else {
      // For non-calculable units, use raw_stock_price directly
      return sum + parseFloat(material.raw_stock_price || 0);
    }
  }, 0);

  const lowStockItemsCount = rawMaterials.filter(material => (Number(material.current_stock) + Number(material.menu_stock)) < Number(material.stok_minimum)).length;

  // Filter materials based on search query
  const filteredRawMaterials = rawMaterials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <>
      {theme !== 'admin' && (
        <NavigationHeader />
      )}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 ${theme !== 'admin' ? 'mt-16' : ''}`}>
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation className="mb-4" />
        <h1 className="text-2xl font-bold mb-4">Dashboard Stok Bahan Mentah</h1>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricsCard
            title="Total Nilai Stok Menu"
            value={formatCurrency(totalMenuStockValue)}
            icon="DollarSign"
            color="primary"
            description="Total nilai rupiah stok menu"
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
          <MetricsCard
            title="Nilai Stok Bahan Mentah Saat Ini"
            value={formatCurrency(currentRawMaterialStockValue)}
            icon="Archive"
            color="info"
            description="Estimasi nilai stok bahan mentah yang belum diolah/digunakan"
          />
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari bahan mentah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
            />
            <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-4 gap-2">
          <button
            onClick={handleAddMaterialClick} // Panggil fungsi baru
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
          >
            <FaPlus className="mr-2" /> Tambah Bahan Mentah Baru
          </button>
          <button
            onClick={() => navigate('/main-critical-stock')}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
          >
            <FaExclamationTriangle className="mr-2" /> Lihat Stok Kritis
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
            title="Export ke Excel"
          >
            <Icon name="FileText" className="mr-2" /> Export Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
            title="Export ke PDF"
          >
            <Icon name="FileText" className="mr-2" /> Export PDF
          </button>
          <button
            onClick={() => setIsUnitSettingsOpen(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
            title="Atur Satuan"
          >
            <Icon name="Settings" className="mr-2" /> Atur Satuan
          </button>


        </div>

        {/* Table View for Larger Screens */}
        <div className="overflow-x-auto bg-card rounded-lg shadow p-4 hidden sm:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nama Bahan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stok Mentah
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stok Menu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Stok
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Satuan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stok Min
                </th>

                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Harga Stok Menu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Harga Stok Mentah
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {filteredRawMaterials.map((material) => (
                <tr key={material.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">
                    {material.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {(Number(material.current_stock) || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {(Number(material.menu_stock) || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground font-bold">
                    {(Number(material.current_stock) || 0) + (Number(material.menu_stock) || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground cursor-pointer"
                    onClick={() => handleEditClick(material)}
                  >
                    {material.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {(Number(material.stok_minimum) || 0)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {/* Harga Stok Menu */}
                    {(Number(material.price_per_item) || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    {!isUnitCalculable(material.unit) && <span className="text-xs text-red-500 block">(Nilai 0)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {/* Harga Stok Mentah */}
                    {(Number(material.raw_stock_price) || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    {!isUnitCalculable(material.unit) && <span className="text-xs text-red-500 block">(Nilai 0)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {(Number(material.current_stock) + Number(material.menu_stock)) < Number(material.stok_minimum) && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-destructive/10 text-destructive flex items-center">
                        <FaExclamationTriangle className="mr-1" /> Stok Menipis!
                      </span>
                    )}
                    {(Number(material.current_stock) + Number(material.menu_stock)) >= Number(material.stok_minimum) && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/10 text-success">
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

        {/* Card View for Mobile */}
        <div className="block sm:hidden space-y-4 mt-4 pb-24">          {filteredRawMaterials.map((material) => (
          <div key={material.id} className="bg-card rounded-lg shadow p-4 border border-border">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-border">
              <p className="text-lg font-bold text-card-foreground">{material.name}</p>
              <div className="flex-shrink-0">
                {(Number(material.current_stock) + Number(material.menu_stock)) < Number(material.stok_minimum) && (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Stok Menipis!
                  </span>
                )}
                {(Number(material.current_stock) + Number(material.menu_stock)) >= Number(material.stok_minimum) && (
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
                <p className="font-medium">Total Stok:</p>
                <p>{(Number(material.current_stock) || 0) + (Number(material.menu_stock) || 0)} {material.unit}</p>
              </div>
              <div>
                <p className="font-medium">Stok Min:</p>
                <p onClick={() => handleEditClick(material)} className="cursor-pointer">{(Number(material.stok_minimum) || 0)} {material.unit}</p>
              </div>
            </div>

            {/* Block 2: Harga Prices */}
            <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary pb-2 mb-2 border-b border-border">
              <div>
                <p className="font-medium">Harga Stok Menu:</p>
                <p>{(Number(material.price_per_item) || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="font-medium">Harga Stok Mentah:</p>
                <p>{(Number(material.raw_stock_price) || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
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
            <StockInModal
              isOpen={isStockInModalOpen}
              onClose={handleCloseModals}
              material={selectedMaterial}
              onStockUpdated={fetchRawMaterials}
              showMessage={showMessage} // Pass showMessage
              showError={showError}   // Pass showError
            />
            <StockOutModal
              isOpen={isStockOutModalOpen}
              onClose={handleCloseModals}
              material={selectedMaterial}
              onStockUpdated={fetchRawMaterials}
              showMessage={showMessage} // Pass showMessage
              showError={showError}   // Pass showError
            />
            <EditRawMaterialModal
              isOpen={isEditModalOpen}
              onClose={handleCloseModals}
              material={selectedMaterial}
              onMaterialUpdated={fetchRawMaterials}
              showMessage={showMessage} // Pass showMessage
              showError={showError}   // Pass showError
            />
          </>
        )}

        {/* Add Raw Material Modal */}
        <AddRawMaterialModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModals}
          onMaterialAdded={fetchRawMaterials}
          showMessage={showMessage} // Pass showMessage
          showError={showError}   // Pass showError
        />

        <UnitSettingsModal
          isOpen={isUnitSettingsOpen}
          onClose={handleCloseModals}
          showMessage={showMessage}
          showError={showError}
        />
      </div>
      {message && <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{message}</div>}
      {notificationError && <div className="fixed bottom-5 right-5 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{notificationError}</div>}
    </>
  );
};

export default RawMaterialStockDashboard;