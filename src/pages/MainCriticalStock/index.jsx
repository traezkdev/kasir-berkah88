import React, { useState, useEffect, useCallback, memo } from 'react';
import axios from 'axios';
import NavigationHeader from '../../components/ui/NavigationHeader';
import AdminMobileHeader from '../../components/ui/AdminMobileHeader';
import Icon from '../../components/AppIcon';
import { useNavigate } from 'react-router-dom';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useTheme } from '../../contexts/ThemeContext';

const CriticalItemCard = memo(({ item }) => {
  const totalStock = Number(item.current_stock) + Number(item.menu_stock);
  const suggestion = Number(item.suggestion_purchase_quantity);

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all active:scale-[0.98]">
      {/* Risk Badge */}
      <div className="absolute top-0 right-0 px-4 py-1.5 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-bl-2xl">
        Kritis
      </div>

      <div className="p-6">
        {/* Header: Name & Unit */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-rose-50 border-2 border-rose-100 text-rose-500 dark:bg-rose-900/20 dark:border-rose-800">
            <Icon name="AlertTriangle" size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{item.name}</h3>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Standar: {Number(item.stok_minimum)} {item.unit}</p>
          </div>
        </div>

        {/* Stock Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Stok Mentah</p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400">{Number(item.current_stock)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Stok Menu</p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400">{Number(item.menu_stock)}</p>
          </div>
        </div>

        {/* Total Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ketersediaan Saat Ini</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{totalStock} <span className="text-slate-400">/ {Number(item.stok_minimum)}</span></p>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700">
            <div
              className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-rose-600 to-orange-500"
              style={{ width: `${Math.min(100, (totalStock / Number(item.stok_minimum)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Action Suggestion */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-5 border-2 border-dashed border-emerald-200 dark:border-emerald-800/30">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Saran Pembelian</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{suggestion} <span className="text-sm font-bold opacity-70">{item.unit}</span></p>
            </div>
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Icon name="ShoppingCart" size={20} />
            </div>
          </div>
        </div>

        {item.deficit > 0 && (
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center mt-4 italic">
            * Kekurangan {Number(item.deficit)} {item.unit} dari standar
          </p>
        )}
      </div>
    </div>
  );
});

const MainCriticalStockPage = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const fetchLowStockItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/stock-alerts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLowStockItems(response.data.data);
    } catch (err) {
      console.error("Error fetching low stock items:", err);
      setError("Gagal memuat data stok kritis.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const handleWhatsAppShare = async () => {
    if (lowStockItems.length === 0) {
      alert('Tidak ada stok kritis untuk dibagikan.');
      return;
    }

    try {
      const settingsRes = await fetch(`${API_BASE_URL}/api/restaurant-settings`);
      const settingsData = await settingsRes.json();
      const ownerPhone = settingsData.data?.owner_phone;
      const restaurantName = settingsData.data?.restaurant_name || 'Restoran Kami';

      if (!ownerPhone) {
        alert('Nomor WhatsApp Owner belum diatur di Pengaturan Restoran.');
        return;
      }

      let message = `*LAPORAN STOK KRITIS - ${restaurantName}*\n`;
      message += `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
      message += `Berikut daftar stok yang perlu segera dibeli:\n\n`;

      lowStockItems.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        message += `   - Stok Saat Ini: ${Number(item.current_stock)} ${item.unit}\n`;
        message += `   - Stok Menu (diolah): ${Number(item.menu_stock)} ${item.unit}\n`;
        message += `   - *Total Stok: ${Number(item.current_stock) + Number(item.menu_stock)} ${item.unit}*\n`;
        message += `   - Stok Minimum: ${Number(item.stok_minimum)} ${item.unit}\n`;
        message += `   - *Saran Pembelian: ${Number(item.suggestion_purchase_quantity)} ${item.unit}*\n\n`;
      });

      message += `_Mohon segera dilakukan pengadaan stok tersebut. Terima kasih._`;

      const encodedMessage = encodeURIComponent(message);
      let cleanPhone = ownerPhone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
      } else if (!cleanPhone.startsWith('62')) {
        cleanPhone = '62' + cleanPhone;
      }

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      alert('Gagal membagikan ke WhatsApp. Silakan periksa koneksi internet Anda.');
    }
  };

  useEffect(() => {
    fetchLowStockItems();
  }, [fetchLowStockItems]);

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-slate-50 dark:bg-slate-950' : 'bg-transparent'}`}>
      {theme === 'default' && (
        <>
          <NavigationHeader hideMobileHeader={true} />
          <AdminMobileHeader
            title="Stok Kritis"
            subtitle="Pembelian"
            badgeText="Urgent"
            decorativeIcon="AlertTriangle"
            stickyTitle="Daftar Pembelian Stok"
            actions={[
              {
                label: "Refresh",
                icon: "RefreshCw",
                color: "primary",
                onClick: fetchLowStockItems
              },
              {
                label: "Lapor",
                icon: "MessageSquare",
                color: "success",
                onClick: handleWhatsAppShare
              }
            ]}
            rightIcon="Archive"
            onRightAction={() => navigate('/raw-material-stock')}
          />
        </>
      )}

      <div className={`${theme === 'default' ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 mt-16 md:mt-24" : "p-4 sm:p-6"}`}>
        {/* Breadcrumb Navigation - Desktop Only */}
        <div className="mb-6 hidden md:block">
          <BreadcrumbNavigation />
          <div className="flex justify-between items-center mt-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Daftar Pembelian Stok</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Item yang di bawah standar minimum</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/raw-material-stock')}
                className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                <Icon name="ArrowLeft" size={18} /> Kembali
              </button>
              <button
                onClick={fetchLowStockItems}
                className="bg-blue-600 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs"
                disabled={loading}
              >
                <Icon name="RefreshCw" size={18} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs"
                disabled={loading}
              >
                <Icon name="Send" size={18} /> Kirim WhatsApp
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-100 dark:border-rose-900/30 rounded-3xl p-6 flex flex-col items-center gap-4 text-center my-8 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center text-rose-500">
              <Icon name="AlertTriangle" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-900 dark:text-rose-200 uppercase tracking-tight"> Terjadi Kesalahan</h3>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">{error}</p>
            </div>
            <button onClick={fetchLowStockItems} className="bg-rose-500 text-white font-black px-8 py-3 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-rose-500/30">Coba Lagi</button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Menghitung Data Stok Kritis...</p>
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 p-10 text-center shadow-2xl shadow-slate-200/50 dark:shadow-none my-12 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-emerald-50 dark:border-emerald-800">
              <Icon name="CheckCircle" size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">Semua Stok Aman</h3>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 leading-relaxed">
              Luar biasa! Tidak ada bahan yang berada di bawah standar minimum saat ini.
            </p>
            <button
              onClick={() => navigate('/raw-material-stock')}
              className="mt-8 w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              Kembali ke Inventori
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none mb-24">
              <table className="min-w-full divide-y-2 divide-slate-50 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nama Bahan</th>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stok Sekarang</th>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Standar Min</th>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Defisit</th>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[#118eea]">Saran Beli</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-50 dark:divide-slate-800">
                  {lowStockItems.map((item) => {
                    const total = Number(item.current_stock) + Number(item.menu_stock);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center">
                              <Icon name="Archive" size={18} />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight">{item.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: #{item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-rose-600 dark:text-rose-400">{total} <span className="text-[10px] opacity-70 uppercase">{item.unit}</span></span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Mentah: {Number(item.current_stock)} | Menu: {Number(item.menu_stock)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-sm font-bold text-slate-500 dark:text-slate-400">{Number(item.stok_minimum)}</td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full animate-pulse bg-rose-500"></div>
                            <span className="text-xs font-black text-rose-500 uppercase tracking-widest">-{Number(item.deficit)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl inline-flex items-center gap-2 font-black text-xs uppercase tracking-widest border-2 border-emerald-100 dark:border-emerald-900/30">
                            <Icon name="ShoppingCart" size={14} />
                            {Number(item.suggestion_purchase_quantity)} {item.unit}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-5 pb-24 lg:mt-0 -mt-32">
              {lowStockItems.map((item) => (
                <CriticalItemCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MainCriticalStockPage;