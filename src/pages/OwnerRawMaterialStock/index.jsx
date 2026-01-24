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


          {/* Premium Action Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {/* Tambah Bahan */}
            <button
              onClick={handleAddMaterialClick}
              className="group relative bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-2 border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 rounded-2xl p-4 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="Plus" size={24} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">Tambah</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bahan</p>
                </div>
              </div>
            </button>

            {/* Stok Kritis */}
            <button
              onClick={() => navigate('/critical-stock')}
              className="group relative bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-2 border-gray-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 rounded-2xl p-4 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <Icon name="AlertTriangle" size={24} className="text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                  {lowStockItemsCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white dark:border-slate-800">
                      {lowStockItemsCount}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">Stok</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Kritis</p>
                </div>
              </div>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              className="group relative bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20 border-2 border-gray-100 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-800 rounded-2xl p-4 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="FileSpreadsheet" size={24} className="text-green-600 dark:text-green-400" strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">Excel</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Export</p>
                </div>
              </div>
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              className="group relative bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 border-2 border-gray-100 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 rounded-2xl p-4 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="FileText" size={24} className="text-red-600 dark:text-red-400" strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">PDF</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Export</p>
                </div>
              </div>
            </button>

            {/* Atur Satuan */}
            <button
              onClick={() => setIsUnitSettingsOpen(true)}
              className="group relative bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-2xl p-4 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="Settings" size={24} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">Satuan</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Atur</p>
                </div>
              </div>
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


          {/* Premium Mobile Cards View */}
          <div className="block sm:hidden space-y-4 mt-4 pb-24">
            {filteredRawMaterials.map((material) => {
              const totalStock = parseFloat(material.current_stock || 0) + parseFloat(material.menu_stock || 0);
              const isLowStock = totalStock < parseFloat(material.stok_minimum || 0);

              return (
                <div
                  key={material.id}
                  className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-lg border-2 border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-xl"
                >
                  {/* Gradient Header with Icon */}
                  <div className={`relative p-5 ${isLowStock
                    ? 'bg-gradient-to-br from-rose-500 to-rose-600'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                          <Icon name="Package" size={24} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                            {material.name}
                          </h3>
                          <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                            {material.unit}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isLowStock
                        ? 'bg-white text-rose-600'
                        : 'bg-white/20 text-white border border-white/30'
                        }`}>
                        {isLowStock ? '⚠ Kritis' : '✓ Aman'}
                      </div>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-5 space-y-4">
                    {/* Stock Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Stok Mentah */}
                      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="Box" size={14} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mentah</p>
                        </div>
                        <p className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">
                          {material.current_stock}
                        </p>
                      </div>

                      {/* Stok Menu */}
                      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="UtensilsCrossed" size={14} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Menu</p>
                        </div>
                        <p className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">
                          {material.menu_stock}
                        </p>
                      </div>

                      {/* Total Stok */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-3 border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Icon name="Layers" size={14} className="text-white" strokeWidth={2.5} />
                          </div>
                          <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Total</p>
                        </div>
                        <p className="text-xl font-black text-blue-700 dark:text-blue-300 tracking-tighter">
                          {totalStock}
                        </p>
                      </div>

                      {/* Stok Minimum */}
                      <div className={`rounded-2xl p-3 border-2 ${isLowStock
                        ? 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-rose-200 dark:border-rose-800'
                        : 'bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-700'
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isLowStock ? 'bg-rose-600' : 'bg-gray-300 dark:bg-slate-700'
                            }`}>
                            <Icon name="AlertCircle" size={14} className={isLowStock ? 'text-white' : 'text-gray-600 dark:text-gray-400'} strokeWidth={2.5} />
                          </div>
                          <p className={`text-[9px] font-black uppercase tracking-widest ${isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'
                            }`}>Min</p>
                        </div>
                        <p className={`text-lg font-black tracking-tighter ${isLowStock ? 'text-rose-700 dark:text-rose-300' : 'text-gray-900 dark:text-white'
                          }`}>
                          {material.stok_minimum}
                        </p>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Harga Menu</p>
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                          {formatCurrency(material.price_per_item)}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30">
                        <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Harga Mentah</p>
                        <p className="text-sm font-black text-blue-700 dark:text-blue-300 tracking-tight">
                          {formatCurrency(material.raw_stock_price)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleEditClick(material)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-3 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                      >
                        <Icon name="Edit" size={18} strokeWidth={2.5} />
                        <span className="text-[11px] font-black uppercase tracking-wider">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(material.id)}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl p-3 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-600/20"
                      >
                        <Icon name="Trash2" size={18} strokeWidth={2.5} />
                        <span className="text-[11px] font-black uppercase tracking-wider">Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
