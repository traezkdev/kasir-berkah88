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
            {/* Desktop UI (Frosted Glass Style) */}
            <div className="hidden sm:block relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-red-200/20 dark:shadow-none transition-all duration-500 hover:shadow-red-300/30 hover:-translate-y-1 my-8 border border-red-100/50 dark:border-red-900/30 group">
                {/* Frosted Glass Background */}
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl"></div>

                {/* Animated Aurora Glows */}
                <div className="absolute -left-16 -top-16 w-64 h-64 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-[80px] group-hover:bg-red-500/20 transition-all duration-700"></div>
                <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-[80px] group-hover:bg-rose-500/20 transition-all duration-700"></div>

                <div className="relative p-7 lg:p-8 flex items-center justify-between gap-8 z-10">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="flex-shrink-0 relative">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-40 duration-1000"></div>
                            <div className="relative p-4 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200 dark:shadow-none border border-red-400">
                                <Icon name="AlertTriangle" size={28} strokeWidth={2.5} className="drop-shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-black text-xl lg:text-2xl text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Stok Kritis Terdeteksi</h3>
                                <div className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm uppercase tracking-widest shadow-sm">
                                    Urgent Alert
                                </div>
                            </div>
                            <p className="text-gray-500 dark:text-slate-400 text-sm lg:text-base font-medium leading-tight">
                                Ada <span className="text-red-500 font-black px-1.5 py-0.5 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/30 mx-1">{criticalCount}</span> item bahan baku yang menipis. Harap segera restock!
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="primary"
                            className="bg-red-600 hover:bg-red-700 text-white border-none font-black shadow-xl shadow-red-200/50 dark:shadow-none hover:scale-105 active:scale-95 transition-all px-7 py-7 h-auto rounded-[1.5rem] group/btn uppercase tracking-widest text-xs"
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
                            <div className="flex items-center gap-3">
                                {userRole === 'owner' || userRole === 'admin' ? (
                                    <>
                                        <div className="bg-white/20 p-2 rounded-xl group-hover/btn:rotate-12 transition-transform">
                                            <Icon name="Eye" size={18} strokeWidth={2.5} />
                                        </div>
                                        <span>Lihat Rincian</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-white/20 p-2 rounded-xl group-hover/btn:rotate-12 transition-transform">
                                            <Icon name="MessageSquare" size={18} strokeWidth={2.5} />
                                        </div>
                                        <span>Lapor ke Owner</span>
                                    </>
                                )}
                            </div>
                        </Button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-3 bg-gray-100 dark:bg-slate-700/50 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-2xl transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 shadow-sm"
                            title="Tutup banner"
                        >
                            <Icon name="X" size={20} strokeWidth={3} />
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
