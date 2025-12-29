import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authFetch from '../utils/authFetch';
import Icon from './AppIcon';
import Button from './ui/Button';
import { useAppSettings } from '../contexts/AppSettingsContext';

const apiUrl = import.meta.env.VITE_API_URL;

const StockAlertBanner = ({ isOwner = false }) => {
    const { appMode } = useAppSettings();
    const [criticalCount, setCriticalCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAlertData = async () => {
            try {
                // Fetch settings first to see if alert is enabled
                const settingsRes = await authFetch(`${apiUrl}/api/restaurant-settings`);
                const settingsData = await settingsRes.json();

                if (settingsRes.ok && settingsData.data) {
                    setSettings(settingsData.data);

                    // If alert is disabled in settings, don't show anything
                    if (settingsData.data.show_stock_alert === 0 || settingsData.data.show_stock_alert === false) {
                        setIsLoading(false);
                        return;
                    }

                    // Fetch critical items count
                    const countRes = await authFetch(`${apiUrl}/api/stock-alerts/count`);
                    const countData = await countRes.json();

                    if (countRes.ok && countData.data.low_stock_count > 0) {
                        setCriticalCount(countData.data.low_stock_count);
                        setIsVisible(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching stock alert data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlertData();
    }, []);

    const handleWhatsAppShare = async () => {
        try {
            // Fetch the full list of critical items
            const itemsRes = await authFetch(`${apiUrl}/api/stock-alerts`);
            const itemsData = await itemsRes.json();
            const lowStockItems = itemsData.data || [];

            if (lowStockItems.length === 0) return;

            const ownerPhone = settings?.owner_phone;
            const restaurantName = settings?.restaurant_name || 'Restoran Kami';

            if (!ownerPhone) {
                alert('Nomor WhatsApp Owner belum diatur di Pengaturan Restoran.');
                navigate('/settings');
                return;
            }

            // Format message
            let message = `*LAPORAN STOK KRITIS (DASHBOARD) - ${restaurantName}*\n`;
            message += `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
            message += `Berikut daftar stok yang perlu segera dibeli:\n\n`;

            lowStockItems.forEach((item, index) => {
                message += `${index + 1}. *${item.name}*\n`;
                message += `   - Total Stok: ${parseInt(item.current_stock) + parseInt(item.menu_stock)} ${item.unit}\n`;
                message += `   - *Saran Pembelian: ${parseInt(item.suggestion_purchase_quantity)} ${item.unit}*\n\n`;
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
            console.error('Error sharing alert to WhatsApp:', error);
            alert('Gagal memproses laporan.');
        }
    };

    if (!isVisible || isLoading || appMode === 'simple') return null;

    return (
        <div className="my-6 animate-in fade-in slide-in-from-top duration-500 px-1">
            <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-xl shadow-lg border border-red-400/30 overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-white">
                        <div className="p-3 bg-white/20 rounded-full animate-pulse">
                            <Icon name="AlertTriangle" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">⚠ Perhatian: Stok Kritis!</h3>
                            <p className="text-white/80 text-sm mt-1">
                                Ada <strong>{criticalCount}</strong> item bahan baku yang menipis dan perlu segera dibeli.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="primary"
                            className="flex-1 sm:flex-initial bg-white text-red-600 hover:bg-white/90 border-none font-bold"
                            onClick={isOwner ? () => navigate('/critical-stock') : handleWhatsAppShare}
                        >
                            <div className="flex items-center gap-2">
                                {isOwner ? (
                                    <>
                                        <Icon name="Eye" size={18} />
                                        Lihat Detail
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                        Lapor ke Owner
                                    </>
                                )}
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-transparent text-white border-white/50 hover:bg-white/10"
                            onClick={() => setIsVisible(false)}
                            title="Tutup"
                        >
                            <Icon name="X" size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockAlertBanner;
