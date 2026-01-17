import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationHeader from '../../components/ui/NavigationHeader';
import { FaSync, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useTheme } from '../../contexts/ThemeContext';

const MainCriticalStockPage = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

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
        message += `   - Stok Saat Ini: ${parseInt(item.current_stock)} ${item.unit}\n`;
        message += `   - Stok Menu (diolah): ${parseInt(item.menu_stock)} ${item.unit}\n`;
        message += `   - *Total Stok: ${parseInt(item.current_stock) + parseInt(item.menu_stock)} ${item.unit}*\n`;
        message += `   - Stok Minimum: ${parseInt(item.stok_minimum)} ${item.unit}\n`;
        message += `   - *Saran Pembelian: ${parseInt(item.suggestion_purchase_quantity)} ${item.unit}*\n\n`;
      });

      message += `_Mohon segera dilakukan pengadaan stok tersebut. Terima kasih._`;

      const encodedMessage = encodeURIComponent(message);
      // Clean ownerPhone (remove non-digits, ensure it starts with 62)
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
      {theme === 'default' && <NavigationHeader />}
      <div className={`${theme === 'default' ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 mt-16" : "p-4 sm:p-6"}`}>
        {/* Breadcrumb Navigation */}
        <div className="mb-4 hidden md:block">
          <BreadcrumbNavigation />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0">Daftar Pembelian Stok (Stok Kritis)</h1>
          <div className="flex flex-wrap items-center gap-2"> {/* New div for buttons */}
            <button
              onClick={() => navigate('/raw-material-stock')}
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
              className="bg-green-600 hover:bg-green-700 active:scale-95 transition-transform text-white font-bold py-2 px-4 rounded flex items-center justify-center w-full sm:w-auto shadow-md"
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Kirim Laporan ke Owner
            </button>
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
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto bg-card rounded-lg shadow">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Nama Bahan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stok Saat Ini
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stok Menu
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total Stok
                    </th>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stok Minimum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Saran Pembelian
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Notifikasi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="bg-destructive/10 hover:bg-destructive/20">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground flex items-center">
                        <FaExclamationTriangle className="text-destructive mr-2" />
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive font-bold">
                        {parseInt(item.current_stock)} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive font-bold">
                        {parseInt(item.menu_stock)} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-bold">
                        {parseInt(item.current_stock) + parseInt(item.menu_stock)} {item.unit}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {parseInt(item.stok_minimum)} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-success font-bold">
                        {parseInt(item.suggestion_purchase_quantity)} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive">
                        {item.deficit > 0 ? `Stok menipis, kurang ${parseInt(item.deficit)} dari standar.` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-4">
              {lowStockItems.map((item) => (
                <div key={item.id} className="bg-card rounded-lg shadow border border-destructive/50 p-4">
                  <div className="flex items-center pb-2 mb-3 border-b border-border">
                    <FaExclamationTriangle className="text-destructive mr-3 flex-shrink-0" />
                    <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="font-medium text-muted-foreground">Stok Saat Ini:</div>
                    <div className="text-destructive font-bold">{parseInt(item.current_stock)} {item.unit}</div>

                    <div className="font-medium text-muted-foreground">Stok Menu:</div>
                    <div className="text-destructive font-bold">{parseInt(item.menu_stock)} {item.unit}</div>

                    <div className="font-medium text-muted-foreground">Total Stok:</div>
                    <div className="text-foreground font-bold">{parseInt(item.current_stock) + parseInt(item.menu_stock)} {item.unit}</div>



                    <div className="font-medium text-muted-foreground">Stok Minimum:</div>
                    <div className="text-foreground">{parseInt(item.stok_minimum)} {item.unit}</div>

                    <div className="font-medium text-muted-foreground">Estimasi Porsi:</div>
                    <div className="text-foreground">{item.estimated_menu_portions !== null ? `${parseInt(item.estimated_menu_portions)} porsi` : 'N/A'}</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="font-medium text-muted-foreground text-sm">Saran Pembelian:</div>
                    <div className="text-success font-bold text-lg">{parseInt(item.suggestion_purchase_quantity)} {item.unit}</div>
                    {item.deficit > 0 && (
                      <div className="text-destructive text-sm mt-2">
                        Notifikasi: Stok menipis, kurang {parseInt(item.deficit)} dari standar.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MainCriticalStockPage;