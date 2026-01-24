import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import EditRawMaterialModal from '../RawMaterialStock/EditRawMaterialModal';
import AddRawMaterialModal from '../RawMaterialStock/AddRawMaterialModal';
import { useTheme } from '../../contexts/ThemeContext';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import AdminMobileHeader from '../../components/ui/AdminMobileHeader';
import useNotification from '../../hooks/useNotification';
import MetricsCard from '../main-dashboard/components/MetricsCard';
import Icon from '../../components/AppIcon';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { exportToExcel, exportToPdf, prepareRawMaterialStockDataForExport } from '../../utils/exportUtils';
import UnitSettingsModal from '../RawMaterialStock/UnitSettingsModal';

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
  const [isUnitSettingsOpen, setIsUnitSettingsOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [units, setUnits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchRawMaterials();
    fetchUnits();
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
    setIsUnitSettingsOpen(false);
    setSelectedMaterial(null);
    fetchRawMaterials();
    fetchUnits();
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

  const handleExportExcel = () => {
    const dataToExport = prepareRawMaterialStockDataForExport(rawMaterials, units);
    exportToExcel(dataToExport, `Laporan_Stok_Bahan_Mentah_Owner_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPdf = () => {
    const dataToExport = prepareRawMaterialStockDataForExport(rawMaterials, units);
    exportToPdf(dataToExport, `Laporan_Stok_Bahan_Mentah_Owner_${new Date().toISOString().split('T')[0]}`);
  };

  const isUnitCalculable = (unitName) => {
    const unit = units.find(u => u.name.toLowerCase() === (unitName || '').toLowerCase());
    return unit ? unit.is_calculable : true;
  };

  // Metrics calculations
  const totalMenuStockValue = rawMaterials.reduce((sum, material) => {
    const isCalculable = isUnitCalculable(material.unit);
    const menuStock = parseFloat(material.menu_stock || 0);
    const pricePerItem = parseFloat(material.price_per_item || 0);

    if (isCalculable) {
      return sum + (menuStock * pricePerItem);
    } else {
      return sum + (menuStock > 0 ? pricePerItem : 0);
    }
  }, 0);

  const totalStockValue = rawMaterials.reduce((sum, material) => {
    const isCalculable = isUnitCalculable(material.unit);
    const menuStock = parseFloat(material.menu_stock || 0);
    const currentStock = parseFloat(material.current_stock || 0);
    const pricePerItem = parseFloat(material.price_per_item || 0);
    const rawStockPrice = parseFloat(material.raw_stock_price || 0);

    if (isCalculable) {
      const menuValue = menuStock * pricePerItem;
      const rawValue = currentStock * rawStockPrice;
      return sum + menuValue + rawValue;
    } else {
      const menuValue = menuStock > 0 ? pricePerItem : 0;
      const rawValue = currentStock > 0 ? rawStockPrice : 0;
      return sum + menuValue + rawValue;
    }
  }, 0);

  const lowStockItemsCount = rawMaterials.filter(material => (parseFloat(material.current_stock || 0) + parseFloat(material.menu_stock || 0)) < parseFloat(material.stok_minimum || 0)).length;

  const currentRawMaterialStockValue = rawMaterials.reduce((sum, material) => {
    const isCalculable = isUnitCalculable(material.unit);
    const currentStock = parseFloat(material.current_stock || 0);
    const rawStockPrice = parseFloat(material.raw_stock_price || 0);

    if (isCalculable) {
      return sum + (currentStock * rawStockPrice);
    } else {
      return sum + (currentStock > 0 ? rawStockPrice : 0);
    }
  }, 0);

  const filteredRawMaterials = rawMaterials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-4 md:p-6 text-center">Memuat data...</div>;
  }

  if (error) {
    return <div className="p-4 md:p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && (
        <>
          <OwnerNavigationHeader hideMobileHeader={true} />
          <AdminMobileHeader
            title="Stok Bahan Mentah"
            subtitle="Owner Dashboard"
            badgeText="RAW MATERIALS"
            decorativeIcon="Package"
            stickyTitle="Stok Bahan Mentah"
            rightIcon="Home"
            onRightAction={() => navigate('/owner-dashboard')}
            actions={[
              {
                label: 'Tambah Bahan',
                icon: 'Plus',
                color: 'success',
                onClick: handleAddMaterialClick
              },
              {
                label: 'Stok Kritis',
                icon: 'AlertTriangle',
                color: 'danger',
                onClick: () => navigate('/critical-stock')
              }
            ]}
          />
        </>
      )}
      <main className={`${theme === 'default' ? 'lg:pt-16' : ''} pb-24 lg:pb-8`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 mt-6 lg:mt-0" : "py-4 md:py-6"}>
          <div className="hidden lg:block mb-4">
            <BreadcrumbNavigation paths={[{ name: 'Beranda Owner', path: '/owner-dashboard' }, { name: 'Stok Bahan Mentah Owner', path: '/owner-raw-material-stock' }]} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 hidden lg:block">Dashboard Stok Bahan Mentah Owner</h1>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 -mt-24 lg:mt-0">
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
              onClick={handleAddMaterialClick}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
            >
              <FaPlus className="mr-2" /> Tambah Bahan Mentah Baru
            </button>
            <button
              onClick={() => navigate('/critical-stock')}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
            >
              <FaExclamationTriangle className="mr-2" /> Lihat Stok Kritis
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
            >
              <Icon name="FileText" className="mr-2" /> Export Excel
            </button>
            <button
              onClick={handleExportPdf}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
            >
              <Icon name="FileText" className="mr-2" /> Export PDF
            </button>
            <button
              onClick={() => setIsUnitSettingsOpen(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
            >
              <Icon name="Settings" className="mr-2" /> Atur Satuan
            </button>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto bg-card rounded-lg shadow p-4 hidden sm:block">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nama Bahan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stok Mentah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stok Menu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total Stok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Satuan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stok Min</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Harga Stok Menu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Harga Stok Mentah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredRawMaterials.map((material) => (
                  <tr key={material.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">{material.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{parseFloat(material.current_stock || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{parseFloat(material.menu_stock || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground font-bold">{parseFloat(material.current_stock || 0) + parseFloat(material.menu_stock || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{material.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{parseFloat(material.stok_minimum || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatCurrency(material.price_per_item)}
                      {!isUnitCalculable(material.unit) && <span className="text-xs text-red-500 block">(Nilai Flat)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatCurrency(material.raw_stock_price)}
                      {!isUnitCalculable(material.unit) && <span className="text-xs text-red-500 block">(Nilai Flat)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {(parseFloat(material.current_stock || 0) + parseFloat(material.menu_stock || 0)) < parseFloat(material.stok_minimum || 0) ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-destructive/10 text-destructive flex items-center">
                          <FaExclamationTriangle className="mr-1" /> Stok Menipis!
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/10 text-success">
                          Cukup
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEditClick(material)} className="text-blue-600 hover:text-blue-900 mr-3"><FaEdit /></button>
                      <button onClick={() => handleDeleteClick(material.id)} className="text-red-600 hover:text-red-900"><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="block sm:hidden space-y-4 mt-4 pb-24">
            {filteredRawMaterials.map((material) => (
              <div key={material.id} className="bg-card rounded-lg shadow p-4 border border-border">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-border">
                  <p className="text-lg font-bold text-card-foreground">{material.name}</p>
                  <div>
                    {(parseFloat(material.current_stock || 0) + parseFloat(material.menu_stock || 0)) < parseFloat(material.stok_minimum || 0) ? (
                      <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-destructive/10 text-destructive">Stok Menipis!</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-success/10 text-success">Cukup</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground pb-2 mb-2 border-b border-border">
                  <div><p className="font-medium">Stok Mentah:</p><p>{material.current_stock} {material.unit}</p></div>
                  <div><p className="font-medium">Stok Menu:</p><p>{material.menu_stock} {material.unit}</p></div>
                  <div><p className="font-medium">Total Stok:</p><p>{parseFloat(material.current_stock || 0) + parseFloat(material.menu_stock || 0)} {material.unit}</p></div>
                  <div><p className="font-medium">Stok Min:</p><p>{material.stok_minimum} {material.unit}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground pb-2 mb-2 border-b border-border">
                  <div><p className="font-medium">Harga Stok Menu:</p><p>{formatCurrency(material.price_per_item)}</p></div>
                  <div><p className="font-medium">Harga Stok Mentah:</p><p>{formatCurrency(material.raw_stock_price)}</p></div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => handleEditClick(material)} className="text-blue-600 p-2 rounded-full bg-primary/10"><FaEdit /></button>
                  <button onClick={() => handleDeleteClick(material.id)} className="text-red-600 p-2 rounded-full bg-destructive/10"><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>

          {selectedMaterial && (
            <EditRawMaterialModal
              isOpen={isEditModalOpen}
              onClose={handleCloseModals}
              material={selectedMaterial}
              onMaterialUpdated={fetchRawMaterials}
              showMessage={showMessage}
              showError={showError}
            />
          )}

          <AddRawMaterialModal
            isOpen={isAddModalOpen}
            onClose={handleCloseModals}
            onMaterialAdded={fetchRawMaterials}
            showMessage={showMessage}
            showError={showError}
          />

          <UnitSettingsModal
            isOpen={isUnitSettingsOpen}
            onClose={handleCloseModals}
            showMessage={showMessage}
            showError={showError}
          />
        </div>
      </main>

      {message && <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{message}</div>}
      {notificationError && <div className="fixed bottom-5 right-5 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{notificationError}</div>}
    </div>
  );
};

export default OwnerRawMaterialStockDashboard;
