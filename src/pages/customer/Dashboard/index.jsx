import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useAppSettings } from '../../../contexts/AppSettingsContext';

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Pelanggan');
    const [points, setPoints] = useState(0);
    const { isOpen } = useAppSettings();

    const [banners, setBanners] = useState([]);
    const [scrolled, setScrolled] = useState(false);
    const [orderNotificationCount, setOrderNotificationCount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 150;
            setScrolled(prev => {
                if (prev !== isScrolled) return isScrolled;
                return prev;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        const fetchData = async () => {
            try {
                // Fetch User Name (from token or profile endpoint if available)
                const storedName = localStorage.getItem('username');
                if (storedName) setUserName(storedName);

                // Fetch Banners
                const bannerRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/banners`);
                const bannerData = await bannerRes.json();
                if (bannerData.data) setBanners(bannerData.data);

                // Fetch Categories
                const catRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/categories`);
                const catData = await catRes.json();
                if (catData.data) setCategories(catData.data.slice(0, 5));

                // Fetch Points
                try {
                    const pointsRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/customer/points`);
                    const pointsData = await pointsRes.json();
                    if (pointsData.data) setPoints(pointsData.data.points);
                } catch (pErr) {
                    console.log("Error fetching points:", pErr.message);
                }

                // Fetch Recommended Menus (Top 5)
                const menuRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/menu-items?limit=6`);
                const menuData = await menuRes.json();
                if (menuData.data) setMenus(menuData.data);

                // Fetch Orders to count active ones for notification
                const ordersRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/orders?limit=10`);
                const ordersData = await ordersRes.json();
                if (ordersData.message === 'success' && ordersData.data) {
                    const currentOrders = ordersData.data;

                    // Get seen order states from localStorage
                    const seenOrderStates = JSON.parse(localStorage.getItem('seenOrderStates') || '{}');

                    // Count orders based on new logic:
                    // 1. 'pending' always counts (persistent notification)
                    // 2. 'accepted' or 'rejected' counts only if status changed since last seen
                    const unreadOrders = currentOrders.filter(order => {
                        // Persistent for pending
                        if (order.status === 'pending') return true;

                        // New status notification for accepted/rejected
                        if (['accepted', 'rejected'].includes(order.status)) {
                            const lastSeenStatus = seenOrderStates[order.id];
                            return lastSeenStatus !== order.status;
                        }

                        return false;
                    });

                    setOrderNotificationCount(unreadOrders.length);
                    // Store current orders temporarily to mark as read when clicked
                    window.currentDashboardOrders = currentOrders;
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const pollInterval = setInterval(fetchData, 10000); // Poll every 10s for better responsiveness

        // Socket.io Realtime Implementation
        const API_URL = import.meta.env.VITE_API_URL || '';
        const socket = io(API_URL, {
            transports: ['websocket'],
            forceNew: true
        });

        socket.on('order_update', (data) => {
            console.log('Realtime Order Update (Customer Dash):', data);
            fetchData();
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(pollInterval);
            socket.disconnect();
        };
    }, []);

    const handleStatusClick = () => {
        // Mark all current orders as seen
        if (window.currentDashboardOrders) {
            const seenOrderStates = JSON.parse(localStorage.getItem('seenOrderStates') || '{}');
            window.currentDashboardOrders.forEach(order => {
                seenOrderStates[order.id] = order.status;
            });
            localStorage.setItem('seenOrderStates', JSON.stringify(seenOrderStates));
        }
        setOrderNotificationCount(0);
        navigate('/customer/order-confirmation');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return 'Selamat Pagi';
        if (hour >= 11 && hour < 15) return 'Selamat Siang';
        if (hour >= 15 && hour < 19) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="pb-24">
            {/* Floating Compact Header on Scroll */}
            <div className={`fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100 p-3 transition-all duration-300 max-w-md mx-auto ${scrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-green-600 p-2 rounded-xl">
                        <Icon name="Coffee" className="w-5 h-5 text-white" />
                    </div>
                    <div onClick={() => navigate('/customer/menu')} className="flex-1 bg-gray-100 rounded-full py-2 px-4 flex items-center gap-2 cursor-pointer">
                        <Icon name="Search" className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-xs font-medium">Cari menu favorit...</span>
                    </div>
                    <Link to="/customer/profile" className="p-2 text-gray-400">
                        <Icon name="Bell" className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Header Section with Gradient */}
            <header className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 pt-6 pb-28 rounded-b-[2rem] text-white shadow-lg sticky top-0 z-30">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-green-100 text-sm font-medium">{getGreeting()},</p>
                        <h1 className="text-2xl font-bold">{userName}</h1>
                    </div>
                    <Link to="/customer/profile" className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm">
                        <Icon name="Bell" className="w-5 h-5 text-white" />
                    </Link>
                </div>

                {!isOpen && (
                    <div className="bg-red-500/90 backdrop-blur-md text-white p-3 rounded-2xl mb-4 flex items-center justify-between shadow-lg border border-red-400/50 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Icon name="XCircle" className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Maaf, Toko Sedang Tutup</p>
                                <p className="text-[10px] opacity-90 font-medium">Kamu tetap bisa melihat menu, tapi belum bisa pesan.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div onClick={() => navigate('/customer/menu')} className="bg-white rounded-full py-3 px-5 flex items-center gap-3 shadow-md cursor-pointer hover:scale-[1.02] transition-transform">
                    <Icon name="Search" className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400 text-sm font-medium">Mau makan apa hari ini?</span>
                </div>

                {/* Quick Shortcut Chips */}
                <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap pb-1 animate-scroll-hint">
                    {[
                        { label: 'Sedang Promo', icon: 'Zap', color: 'bg-amber-400' },
                        { label: 'Paling Laris', icon: 'TrendingUp', color: 'bg-rose-500' },
                        { label: 'Paket Hemat', icon: 'Package', color: 'bg-sky-500' },
                        { label: 'Terbaru', icon: 'Sparkles', color: 'bg-indigo-500' }
                    ].map((chip, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(`/customer/menu?filter=${chip.label.toLowerCase().replace(' ', '_')}`)}
                            className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full cursor-pointer active:scale-95 transition-all"
                        >
                            <div className={`${chip.color} p-1 rounded-full`}>
                                <Icon name={chip.icon} className="w-2.5 h-2.5 text-white" />
                            </div>
                            <span className="text-[10px] font-bold text-white tracking-tight">{chip.label}</span>
                        </div>
                    ))}
                </div>
            </header>

            {/* Integrated Action Card (Floated Half-In Half-Out) */}
            <div className="mx-6 -mt-20 relative z-40 bg-white rounded-[2rem] shadow-xl text-gray-800 overflow-hidden border border-white">
                {/* Saldo Section */}
                <div className="p-5 flex justify-between items-center border-b border-gray-50">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mb-0.5">Poin Berkah 88</span>
                        <span className="text-xl font-black text-gray-900 tracking-tight">{new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(points)} Poin</span>
                    </div>
                    <div className="flex gap-4">
                        <div
                            onClick={() => navigate('/customer/points-history')}
                            className="flex flex-col items-center gap-1 cursor-pointer group"
                        >
                            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 border border-blue-100 group-active:scale-90 transition-transform">
                                <Icon name="History" className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-black text-gray-500 uppercase">Riwayat</span>
                        </div>
                    </div>
                </div>

                {/* Status Pesanan Section (The one user liked) */}
                <div
                    onClick={handleStatusClick}
                    className="flex items-center gap-4 p-5 cursor-pointer active:bg-gray-50 transition-all duration-200 group relative"
                >
                    <div className="p-3 rounded-2xl group-active:scale-90 transition-transform bg-orange-50 text-orange-500 relative">
                        <Icon name="ShoppingBag" className="w-6 h-6" />
                        {orderNotificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce-subtle shadow-sm">
                                {orderNotificationCount}
                            </span>
                        )}
                    </div>
                    <div className="flex-1">
                        <span className="block font-extrabold text-gray-800 tracking-tight">Status Pesanan</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Lacak pesanan aktif Anda</span>
                    </div>
                    <Icon name="ChevronRight" className="w-4 h-4 text-gray-300" />
                </div>
            </div>


            {/* Banners Carousel */}
            <section className="mt-8 px-4">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-[0.2em]">Promo Spesial</h3>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <span>Geser</span>
                        <Icon name="ChevronRight" size={10} />
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar flex gap-4 pb-4 snap-x animate-scroll-hint scroll-smooth" id="banner-scroll">
                    {banners.map((banner) => (
                        <div key={banner.id} className={`${banner.color_class} min-w-[90%] h-40 rounded-3xl p-6 text-white flex flex-col justify-between shadow-xl snap-center active:scale-95 transition-all cursor-pointer relative overflow-hidden`}>
                            <div className="z-10 relative">
                                <h3 className="font-black text-2xl tracking-tighter leading-tight mb-1">{banner.title}</h3>
                                <p className="text-xs font-bold opacity-80">{banner.subtitle}</p>
                            </div>
                            <div className="flex items-center gap-2 z-10">
                                <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">Ambil Promo</div>
                            </div>
                            {/* Decorative Icon */}
                            <Icon name={banner.icon_name} size={120} className="absolute -bottom-6 -right-6 text-white/10 rotate-12" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories */}
            <section className="mt-4 px-4 font-black">
                <div className="flex justify-between items-center mb-5 px-1">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.2em]">Kategori</h3>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <span>Geser</span>
                        <Icon name="ChevronRight" size={10} />
                    </div>
                </div>
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2 animate-scroll-hint">
                    {/* All Category */}
                    <Link to="/customer/menu" className="flex flex-col items-center gap-3 min-w-[75px] cursor-pointer group">
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-[1.8rem] flex items-center justify-center border border-green-100 dark:border-green-800/30 group-hover:bg-green-100 transition-all shadow-sm group-active:scale-95">
                            <Icon name="LayoutGrid" size={28} className="text-green-600" />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center truncate w-full">Semua</span>
                    </Link>
                    {/* Dynamic Categories */}
                    {categories.map((cat) => (
                        <Link to={`/customer/menu?category=${cat.id}`} key={cat.id} className="flex flex-col items-center gap-3 min-w-[75px] cursor-pointer group">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-[1.8rem] flex items-center justify-center border border-gray-100 dark:border-slate-700 group-hover:bg-gray-100 transition-all shadow-sm group-active:scale-95">
                                <Icon name="Coffee" size={28} className="text-gray-500" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center truncate w-full">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Recommended Menu */}
            <section className="mt-6 px-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Rekomendasi Pilihan</h3>
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {menus.map((menu) => (
                            <div
                                key={menu.id}
                                onClick={() => isOpen && navigate(`/customer/menu/${menu.id}`)}
                                className={`bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all flex flex-col h-full ${!isOpen ? 'opacity-75 grayscale-[0.5] cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}`}
                            >
                                <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
                                    {menu.image_url ? (
                                        <img src={`${import.meta.env.VITE_API_URL}${menu.image_url}`} alt={menu.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Icon name="Image" className="w-8 h-8" />
                                        </div>
                                    )}
                                    {/* Add Button Overlay */}
                                    <button
                                        disabled={!isOpen}
                                        className={`absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-sm border border-gray-100 transition-transform ${!isOpen ? 'opacity-50' : 'active:scale-95'}`}
                                    >
                                        <Icon name="Plus" className="w-4 h-4 text-green-600" />
                                    </button>
                                    {/* Promo Badge */}
                                    {menu.discount > 0 && (
                                        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 animate-pulse">
                                            <Icon name="Zap" className="w-2.5 h-2.5 fill-current" />
                                            <span>PROMO {parseFloat(menu.discount).toFixed(0)}%</span>
                                        </div>
                                    )}
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1">{menu.name}</h4>
                                <div className="flex justify-between items-end mt-auto">
                                    <div className="flex flex-col">
                                        {menu.discount > 0 ? (
                                            <>
                                                <span className="text-[10px] text-gray-400 line-through leading-none">{formatCurrency(menu.price)}</span>
                                                <span className="font-bold text-green-600 text-sm leading-none">{formatCurrency(Math.round(menu.price * (1 - menu.discount / 100)))}</span>
                                            </>
                                        ) : (
                                            <span className="font-bold text-green-600 text-sm leading-none">{formatCurrency(menu.price)}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                        <Icon name="Star" className="w-3 h-3 text-yellow-400 fill-current" />
                                        <span>{menu.average_rating ? parseFloat(menu.average_rating).toFixed(1) : '0.0'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default CustomerDashboard;
