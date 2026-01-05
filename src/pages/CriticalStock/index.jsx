import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { FaSync, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const CriticalStockPage = () => {
  const { theme } = useTheme();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const fetchLowStockItems = async () => {
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
  };

  const handleWhatsAppShare = async () => {
    if (lowStockItems.length === 0) {
      alert('Tidak ada stok kritis untuk dibagikan.');
      return;
    }

    try {
      // Fetch owner phone from restaurant settings
      const settingsRes = await fetch(`${API_BASE_URL}/api/restaurant-settings`);
      const settingsData = await settingsRes.json();
      const ownerPhone = settingsData.data?.owner_phone;
      const restaurantName = settingsData.data?.restaurant_name || 'Restoran Kami';

      if (!ownerPhone) {
        alert('Nomor WhatsApp Owner belum diatur di Pengaturan Restoran.');
        return;
      }

      // Format message
      let message = `*LAPORAN STOK KRITIS - ${restaurantName}*\n`;
      message += `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
      message += `Berikut daftar stok yang perlu segera dibeli:\n\n`;

      lowStockItems.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        message += `   - Stok Saat Ini: ${parseFloat(item.current_stock || 0)} ${item.unit}\n`;
        message += `   - Stok Menu (diolah): ${parseFloat(item.menu_stock || 0)} ${item.unit}\n`;
        message += `   - *Total Stok: ${parseFloat(item.current_stock || 0) + parseFloat(item.menu_stock || 0)} ${item.unit}*\n`;
        message += `   - Stok Minimum: ${parseFloat(item.stok_minimum || 0)} ${item.unit}\n`;
        message += `   - *Saran Pembelian: ${parseFloat(item.suggestion_purchase_quantity || 0)} ${item.unit}*\n\n`;
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
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && <OwnerNavigationHeader headerTitle="Stok Kritis" />}
      <main className={`pb-20 lg:pb-8 ${theme === 'default' ? 'pt-16' : ''}`}>
        <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-6" : ""}>
          <div className="mb-6 mt-4">
            <BreadcrumbNavigation paths={[{ name: 'Beranda Owner', path: '/owner-dashboard' }, { name: 'Stok Bahan Mentah Owner', path: '/owner-raw-material-stock' }, { name: 'Stok Kritis', path: '/critical-stock' }]} className="mb-4" />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Stok Kritis</h1>
                <p className="text-text-secondary mt-1">Daftar bahan baku yang perlu segera dibeli.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
                <button
                  onClick={() => navigate('/owner-raw-material-stock')}
                  className="bg-muted hover:bg-muted/80 text-muted-foreground font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
                >
                  <FaArrowLeft className="mr-2" /> Kembali
                </button>
                <button
                  onClick={fetchLowStockItems}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded flex items-center justify-center w-full sm:w-auto"
                  disabled={loading}
                >
                  <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Memuat...' : 'Refresh Data'}
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center w-full sm:w-auto shadow-md"
                  disabled={loading}
                >
                  <FaSync className="mr-2" /> Bagikan Laporan
                </button>
              </div>
            </div>
          </div>

          {error && <div className="p-4 text-center text-red-500 bg-red-100 rounded-lg">{error}</div>}

          {loading ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8 px-4 bg-success/10 text-success rounded-lg">
              <p className="text-lg">👍 Semua stok dalam kondisi aman. Tidak ada yang perlu dibeli saat ini.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto bg-card rounded-lg shadow border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nama Bahan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stok Mentah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stok Menu</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total Stok</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stok Min</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Saran Beli</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Notifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {lowStockItems.map((item) => (
                      <tr key={item.id} className="bg-destructive/5 hover:bg-destructive/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground flex items-center">
                          <FaExclamationTriangle className="text-destructive mr-2" /> {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive font-bold">{parseFloat(item.current_stock || 0)} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive font-bold">{parseFloat(item.menu_stock || 0)} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{parseFloat(item.current_stock || 0) + parseFloat(item.menu_stock || 0)} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{parseFloat(item.stok_minimum || 0)} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-success font-bold">{parseFloat(item.suggestion_purchase_quantity || 0)} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive">
                          {item.deficit > 0 ? `Kurang ${parseFloat(item.deficit)}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="block sm:hidden space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="bg-card rounded-lg shadow border border-destructive/30 p-4">
                    <div className="flex items-center pb-2 mb-2 border-b border-border">
                      <FaExclamationTriangle className="text-destructive mr-2" />
                      <h3 className="font-bold text-foreground">{item.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Stok Mentah:</div>
                      <div className="text-destructive font-bold">{item.current_stock} {item.unit}</div>
                      <div className="text-muted-foreground">Stok Menu:</div>
                      <div className="text-destructive font-bold">{item.menu_stock} {item.unit}</div>
                      <div className="text-muted-foreground">Total Stok:</div>
                      <div className="font-bold">{parseFloat(item.current_stock || 0) + parseFloat(item.menu_stock || 0)} {item.unit}</div>
                      <div className="text-muted-foreground">Stok Minimum:</div>
                      <div>{item.stok_minimum} {item.unit}</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Saran Beli:</span>
                      <span className="text-success font-bold text-lg">{item.suggestion_purchase_quantity} {item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CriticalStockPage;
