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
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const encodedPayload = token.split('.')[1];
                const decodedPayload = JSON.parse(atob(encodedPayload));
                setUserRole(decodedPayload.role);
            } catch (e) {
                console.error("Error decoding token in StockAlertBanner:", e);
            }
        }

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
        <div className="my-6 animate-in fade-in slide-in-from-top duration-500 px-1 sm:px-0">
            {/* Desktop UI */}
            <div className="hidden sm:block relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl my-6">
                {/* Background with Premium Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-rose-600 to-orange-600"></div>

                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-12 w-48 h-48 bg-orange-400/20 rounded-full blur-3xl"></div>

                <div className="relative p-5 lg:p-6 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5 text-white flex-1">
                        <div className="flex-shrink-0 relative">
                            <div className="absolute inset-0 bg-white/30 rounded-full animate-ping opacity-20 duration-1000"></div>
                            <div className="relative p-3.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-inner">
                                <Icon name="AlertTriangle" size={28} className="text-white drop-shadow-md" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <h3 className="font-bold text-xl leading-none tracking-tight">Perhatian: Stok Kritis!</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 border border-white/10 backdrop-blur-sm uppercase tracking-wider">Urgent</span>
                            </div>
                            <p className="text-red-50 text-sm font-medium leading-relaxed">
                                Terdapat <strong className="text-white text-base border-b-2 border-white/30 px-1">{criticalCount}</strong> item bahan baku yang stoknya menipis. Segera lakukan restock.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 z-10">
                        <Button
                            variant="primary"
                            className="bg-white text-red-600 hover:bg-red-50 border-none font-bold shadow-lg hover:shadow-xl transition-all px-5 py-6 h-auto rounded-xl group"
                            onClick={() => {
                                if (userRole === 'owner') {
                                    navigate('/critical-stock');
                                } else if (userRole === 'admin') {
                                    navigate('/main-critical-stock');
                                } else {
                                    handleWhatsAppShare();
                                }
                            }}
                        >
                            <div className="flex items-center gap-2">
                                {userRole === 'owner' || userRole === 'admin' ? (
                                    <>
                                        <div className="bg-red-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                                            <Icon name="Eye" size={18} />
                                        </div>
                                        <span>Lihat Detail</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-green-100 text-green-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                        </div>
                                        <span>Lapor ke Owner</span>
                                    </>
                                )}
                            </div>
                        </Button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
                            title="Tutup banner"
                        >
                            <Icon name="X" size={22} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile UI (Modern Card Style) */}
            <div className="block sm:hidden relative px-4 mx-1">
                <div className="relative bg-white dark:bg-slate-800 rounded-[2rem] p-5 border border-red-100 dark:border-red-900/30 overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05]">
                        <Icon name="AlertTriangle" size={120} className="text-red-600" />
                    </div>

                    <div className="flex items-start gap-4 mb-4 relative z-10">
                        <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center animate-pulse">
                            <Icon name="AlertTriangle" size={24} className="text-white" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Stok Kritis!</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
                                Ada <span className="text-red-500 font-black">{criticalCount} item</span> bahan baku yang perlu segera dibeli.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1.5 bg-gray-50 dark:bg-slate-700 rounded-full text-gray-400"
                        >
                            <Icon name="X" size={14} />
                        </button>
                    </div>

                    <div className="flex gap-2 relative z-10">
                        <Button
                            variant="primary"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                            onClick={() => {
                                if (userRole === 'owner') {
                                    navigate('/critical-stock');
                                } else if (userRole === 'admin') {
                                    navigate('/main-critical-stock');
                                } else {
                                    handleWhatsAppShare();
                                }
                            }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {userRole === 'owner' || userRole === 'admin' ? (
                                    <>
                                        <Icon name="Eye" size={16} />
                                        Lihat Item
                                    </>
                                ) : (
                                    <>
                                        <Icon name="MessageCircle" size={16} />
                                        Lapor Owner
                                    </>
                                )}
                            </div>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockAlertBanner;
