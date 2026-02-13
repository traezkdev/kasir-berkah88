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
import UnitSettingsModal from './UnitSettingsModal';
import MaterialDetailModal from './MaterialDetailModal';
import AdminMobileHeader from '../../components/ui/AdminMobileHeader';
import { useToast } from '../../components/ui/ToastNotification';

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
  const { showToast } = useToast();
  const { message, error: notificationError, showMessage, showError } = useNotification(); // Use notification hook

  // State untuk modal stok masuk/keluar/edit/tambah
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Tambahkan state ini
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // State for Unit Settings
  const [isUnitSettingsOpen, setIsUnitSettingsOpen] = useState(false);
  const [units, setUnits] = useState([]); // Store units for calculation logic

  // State for search
  const [searchQuery, setSearchQuery] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchRawMaterials();
    fetchUnits(); // Fetch units
  }, []);

  const fetchRawMaterials = async (isInitial = false) => {
    if (isInitial) setLoading(true);
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

  const handleViewDetail = (material) => {
    setSelectedMaterial(material);
    setIsDetailModalOpen(true);
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
    setIsDetailModalOpen(false);
    setSelectedMaterial(null);
    fetchRawMaterials(false); // Refresh data tanpa hard loading
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

  if (loading && rawMaterials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Memuat data stok...</p>
      </div>
    );
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
    // Jika satuan adalah gram, kita anggap tidak dikalikan (langsung ambil harga) sesuai permintaan user
    if ((unitName || '').toLowerCase() === 'gram') return false;

    const unit = units.find(u => u.name.toLowerCase() === (unitName || '').toLowerCase());
    return unit ? unit.is_calculable : true; // Default to true if unit not found in settings
  };

  // Calculate metrics
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

  // Revised calculations based on unit calculability
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

  const lowStockItemsCount = rawMaterials.filter(material => (Number(material.current_stock) + Number(material.menu_stock)) < Number(material.stok_minimum)).length;

  // Filter materials based on search query
  const filteredRawMaterials = rawMaterials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <>
      {theme === 'default' && (
        <>
          <NavigationHeader hideMobileHeader={true} />
          <AdminMobileHeader
            title="Stok Bahan"
            subtitle="Mentah"
            badgeText="Inventory"
            decorativeIcon="Archive"
            stickyTitle="Stok Bahan Mentah"
            actions={[
              {
                label: "Tambah",
                icon: "Plus",
                color: "success",
                onClick: handleAddMaterialClick
              },
              {
                label: "Kritis",
                icon: "AlertTriangle",
                color: "danger",
                onClick: () => navigate('/main-critical-stock')
              }
            ]}
            rightIcon="Settings"
            onRightAction={() => setIsUnitSettingsOpen(true)}
          />
        </>
      )}
      <main className={`${theme === 'default' ? 'lg:pt-16' : ''} pb-24 lg:pb-8`}>
        <div className={`${theme === 'admin' ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} py-4 md:py-6`}>
          {/* Breadcrumb Navigation */}
          <div className="mb-4 hidden md:block">
            <BreadcrumbNavigation />
          </div>
          <h1 className="text-2xl font-bold mb-4 hidden lg:block">Dashboard Stok Bahan Mentah</h1>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-0 mb-6 -mt-16">
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

          <div className="hidden lg:flex flex-wrap justify-start items-center mb-8 gap-4">
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
                  <tr key={material.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-black text-[#118EEA] cursor-pointer hover:underline"
                      onClick={() => handleViewDetail(material)}
                    >
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
          <div className="block sm:hidden space-y-4 mt-4 pb-24">          {filteredRawMaterials.map((material) => {
            const totalStock = (Number(material.current_stock) || 0) + (Number(material.menu_stock) || 0);
            const isLowStock = totalStock < Number(material.stok_minimum);
            // Calculate percentage for progress bar (capped at 100%)
            const stockPercentage = Math.min(100, (totalStock / (Number(material.stok_minimum) * 2)) * 100);

            return (
              <div key={material.id} className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all active:scale-[0.98]">
                {/* Status Indicator */}
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest ${isLowStock ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {isLowStock ? 'Stok Kritis' : 'Stok Aman'}
                </div>

                <div className="p-6">
                  {/* Header: Name & Unit */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${isLowStock ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-blue-50 border-blue-100 text-blue-500'} dark:bg-slate-800 dark:border-slate-700`}>
                      <Icon name="Archive" size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{material.name}</h3>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Satuan: {material.unit}</p>
                    </div>
                  </div>

                  {/* Stock Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Stok Mentah</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{Number(material.current_stock)} {material.unit}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Stok Menu</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{Number(material.menu_stock)} {material.unit}</p>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Kapasitas Stok</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{Number(totalStock)} {material.unit} / <span className="text-slate-400">{Number(material.stok_minimum)} {material.unit}</span></p>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isLowStock ? 'bg-gradient-to-r from-rose-500 to-orange-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                        style={{ width: `${stockPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="flex items-center justify-between py-4 border-y border-slate-100 dark:border-slate-800 mb-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Estimasi Nilai</p>
                      <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                        {(() => {
                          const isCalculable = isUnitCalculable(material.unit);
                          const rawStockPrice = Number(material.raw_stock_price) || 0;
                          const currentStock = Number(material.current_stock) || 0;
                          const menuStock = Number(material.menu_stock) || 0;
                          const pricePerItem = Number(material.price_per_item) || 0;

                          if (isCalculable) {
                            return formatCurrency((currentStock * rawStockPrice) + (menuStock * pricePerItem));
                          } else {
                            // Jika tidak dikalikan (seperti gram), ambil harga langsung jika stok > 0
                            const rawVal = currentStock > 0 ? rawStockPrice : 0;
                            const menuVal = menuStock > 0 ? pricePerItem : 0;
                            return formatCurrency(rawVal + menuVal);
                          }
                        })()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(material)}
                        className="w-11 h-11 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center transition-all active:scale-90 border border-blue-100 dark:border-blue-800/30"
                      >
                        <Icon name="Edit" size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(material.id)}
                        className="w-11 h-11 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center transition-all active:scale-90 border border-rose-100 dark:border-rose-800/30"
                      >
                        <Icon name="Trash" size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Details Footer */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Hrg Mentah: {formatCurrency(material.raw_stock_price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Hrg Menu: {formatCurrency(material.price_per_item)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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

          <MaterialDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseModals}
            material={selectedMaterial}
          />
        </div>
      </main>
      {message && <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{message}</div>}
      {notificationError && <div className="fixed bottom-5 right-5 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg z-[3000]">{notificationError}</div>}
    </>
  );
};

export default RawMaterialStockDashboard;
