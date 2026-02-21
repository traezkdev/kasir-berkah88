import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { useCart } from '../context/CartContext';
import { useChat } from '../../../contexts/ChatContext';
import { motion } from 'framer-motion';

const DesktopDashboard = () => {
    const navigate = useNavigate();
    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Pelanggan');
    const [points, setPoints] = useState(0);
    const { cartCount } = useCart();
    const { unreadCount } = useChat();
    const { isOpen } = useAppSettings();

    const [banners, setBanners] = useState([]);
    const [orderNotificationCount, setOrderNotificationCount] = useState(0);

    const [hasNewInfo, setHasNewInfo] = useState(false);
    const [latestInfoTimestamp, setLatestInfoTimestamp] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedName = localStorage.getItem('username');
                if (storedName) setUserName(storedName);

                const bannerRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/banners`);
                const bannerData = await bannerRes.json();
                if (bannerData.data) setBanners(bannerData.data);

                const catRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/categories`);
                const catData = await catRes.json();
                if (catData.data) {
                    const visibleCategories = catData.data.filter(c => c.is_visible !== 0 && c.is_visible !== false);
                    setCategories(visibleCategories);
                }

                try {
                    const pointsRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/customer/points`);
                    const pointsData = await pointsRes.json();
                    if (pointsData.data) setPoints(pointsData.data.points);
                } catch (pErr) {
                    console.log("Error fetching points:", pErr.message);
                }

                const menuRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/menu-items?limit=12`);
                const menuData = await menuRes.json();
                if (menuData.data) setMenus(menuData.data);

                const ordersRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/orders?limit=10`);
                const ordersData = await ordersRes.json();
                if (ordersData.message === 'success' && ordersData.data) {
                    const currentOrders = ordersData.data;
                    const seenOrderStates = JSON.parse(localStorage.getItem('seenOrderStates') || '{}');
                    const unreadOrders = currentOrders.filter(order => {
                        if (order.status === 'pending') return true;
                        if (['accepted', 'rejected'].includes(order.status)) {
                            return seenOrderStates[order.id] !== order.status;
                        }
                        return false;
                    });
                    setOrderNotificationCount(unreadOrders.length);
                    window.currentDashboardOrders = currentOrders;
                }

                const infoRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/information?limit=1`);
                const infoData = await infoRes.json();
                if (infoData.data && infoData.data.length > 0) {
                    const latestInfo = infoData.data[0];
                    const latestTimestamp = new Date(latestInfo.created_at).getTime();
                    setLatestInfoTimestamp(latestTimestamp);
                    const storedTimestamp = localStorage.getItem('last_seen_info_timestamp');
                    if (Number(storedTimestamp || 0) < latestTimestamp) {
                        setHasNewInfo(true);
                    }
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const pollInterval = setInterval(fetchData, 10000);

        const API_URL = import.meta.env.VITE_API_URL;
        const socket = io(API_URL, {
            transports: ['polling', 'websocket'],
            forceNew: true
        });

        socket.on('order_update', fetchData);

        return () => {
            clearInterval(pollInterval);
            socket.disconnect();
        };
    }, []);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const getCategoryIcon = (categoryName) => {
        const name = categoryName ? categoryName.toUpperCase() : '';
        if (name.includes('AYAM')) return 'Drumstick';
        if (name.includes('IKAN')) return 'Fish';
        if (name.includes('MINUM')) return 'CupSoda';
        if (name.includes('KOPI')) return 'Coffee';
        if (name.includes('HEMAT')) return 'Tag';
        if (name.includes('NASI')) return 'Soup';
        if (name.includes('SNACK')) return 'Cookie';
        return 'Utensils';
    };

    return (
        <div className="min-h-screen bg-transparent pb-12 overflow-x-hidden">
            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 grid grid-cols-12 gap-8">
                {/* Left Side: Sidebar Stats & Info */}
                <aside className="col-span-12 lg:col-span-3 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                        <div className="w-24 h-24 bg-gradient-to-tr from-green-600 to-emerald-400 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-green-600/20">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{userName}</h2>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-6">Pelanggan Setia</p>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 border border-slate-100 dark:border-slate-800">
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Poin</span>
                            <span className="text-2xl font-black text-green-600">{new Intl.NumberFormat('id-ID').format(points)}</span>
                        </div>

                        <button onClick={() => navigate('/customer/profile')} className="w-full mt-6 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                            Pengaturan Akun
                        </button>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => navigate('/customer/order-confirmation')} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 hover:shadow-md transition-all group">
                            <div className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform relative">
                                <Icon name="ShoppingBag" className="w-6 h-6" />
                                {orderNotificationCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center font-bold">{orderNotificationCount}</span>}
                            </div>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">Pesanan</span>
                        </button>
                        <button onClick={() => navigate('/customer/points-history')} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 hover:shadow-md transition-all group">
                            <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                                <Icon name="History" className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">Riwayat</span>
                        </button>
                    </div>

                    {/* Tips Card Desktop */}
                    <div className="bg-green-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-green-600/20">
                        <h4 className="text-xl font-black mb-2 relative z-10">Makin Pinter Makin Hemat!</h4>
                        <p className="text-green-100 text-xs font-medium leading-relaxed mb-6 relative z-10">Tukarkan poinmu dengan diskon langsung di setiap pesanan.</p>
                        <button onClick={() => navigate('/customer/promo')} className="bg-white text-green-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform relative z-10 shadow-lg">Lihat Promo</button>
                        <Icon name="Zap" className="absolute -bottom-10 -right-10 w-40 h-40 text-white/10 rotate-12" />
                    </div>
                </aside>

                {/* Right Side: Content Area */}
                <div className="col-span-12 lg:col-span-9 space-y-8">
                    {/* Custom Banners Grid */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Penawaran Terbatas</h3>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 transition-all"><Icon name="ChevronLeft" size={16} /></button>
                                <button className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 transition-all"><Icon name="ChevronRight" size={16} /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {banners.slice(0, 2).map((banner) => (
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    key={banner.id}
                                    onClick={() => navigate('/customer/promo')}
                                    className={`${banner.color_class} h-56 rounded-[3rem] text-white p-10 flex flex-col justify-between shadow-xl cursor-pointer relative overflow-hidden group border-4 border-white dark:border-slate-800`}
                                >
                                    {banner.image_url && (
                                        <img
                                            src={banner.image_url.startsWith('http') ? banner.image_url : `${import.meta.env.VITE_API_URL}${banner.image_url}`}
                                            alt={banner.title}
                                            className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-110 transition-transform duration-700"
                                        />
                                    )}
                                    <div className={`absolute inset-0 z-10 transition-opacity ${banner.image_url ? 'bg-black/30' : 'bg-transparent'}`} />

                                    {(banner.show_text === 1 || banner.show_text === true) && (
                                        <>
                                            <div className="z-20">
                                                <h3 className="text-3xl font-black tracking-tighter mb-2">{banner.title}</h3>
                                                <p className="text-sm font-bold opacity-80 max-w-xs">{banner.subtitle}</p>
                                            </div>
                                            <div className="z-20">
                                                <div className="inline-block bg-white text-slate-900 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">Cek Sekarang</div>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Desktop Categories Toolbar */}
                    <section>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Cari Berdasarkan Kategori</h3>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            <Link to="/customer/menu" className="bg-white dark:bg-slate-900 aspect-square rounded-[2rem] flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 hover:border-green-500 transition-all hover:shadow-lg group shadow-sm">
                                <Icon name="LayoutGrid" size={32} className="mb-2 text-green-600 transition-transform group-hover:scale-110" />
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Semua</span>
                            </Link>
                            {categories.map((cat) => (
                                <Link to={`/customer/menu?category=${cat.id}`} key={cat.id} className="bg-white dark:bg-slate-900 aspect-square rounded-[2rem] flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 hover:border-green-500 transition-all hover:shadow-lg group shadow-sm">
                                    <div className="mb-2 transition-transform group-hover:scale-110">
                                        {cat.icon ? (
                                            <img src={`${import.meta.env.VITE_API_URL}${cat.icon}`} alt={cat.name} className="w-8 h-8 object-contain" />
                                        ) : (
                                            <Icon name={getCategoryIcon(cat.name)} size={32} className="text-slate-400 dark:text-slate-600 group-hover:text-green-500 transition-colors" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter text-center truncate px-1">{cat.name}</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Recommendations Grid Desktop */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Rekomendasi Spesial <span className="text-green-600">Terlaris</span></h3>
                            <button onClick={() => navigate('/customer/menu')} className="text-sm font-black text-green-600 hover:underline">Lihat Semua Menu</button>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[4/5] bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse shadow-sm" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {menus.map((menu) => (
                                    <motion.div
                                        whileHover={{ y: -8 }}
                                        key={menu.id}
                                        onClick={() => isOpen && navigate(`/customer/menu/${menu.id}`)}
                                        className={`group bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:border-green-100 dark:hover:border-green-900 flex flex-col ${!isOpen ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 relative bg-slate-50 dark:bg-slate-800">
                                            {menu.image_url ? (
                                                <img src={`${import.meta.env.VITE_API_URL}${menu.image_url}`} alt={menu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Icon name="Image" size={48} /></div>
                                            )}

                                            {menu.discount > 0 && (
                                                <div className="absolute top-4 left-4 z-10 bg-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                                                    -{parseFloat(menu.discount).toFixed(0)}% OFF
                                                </div>
                                            )}

                                            <button
                                                disabled={!isOpen}
                                                className="absolute bottom-4 right-4 bg-green-600 text-white p-3 rounded-2xl shadow-xl hover:bg-green-700 active:scale-90 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-300"
                                            >
                                                <Icon name="Plus" size={20} />
                                            </button>
                                        </div>

                                        <div className="flex-1 px-1">
                                            <h4 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-2 line-clamp-1">{menu.name}</h4>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">
                                                <Icon name="Star" className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                <span>{menu.average_rating ? parseFloat(menu.average_rating).toFixed(1) : '5.0'}</span>
                                                <span className="opacity-30 mx-1">|</span>
                                                <span>Stok: {menu.stock}</span>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex flex-col">
                                                    {menu.discount > 0 ? (
                                                        <>
                                                            <span className="text-xs text-slate-400 line-through font-bold">{formatCurrency(menu.price)}</span>
                                                            <span className="text-xl font-black text-green-600 tracking-tighter">{formatCurrency(Math.round(menu.price * (1 - menu.discount / 100)))}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xl font-black text-green-600 tracking-tighter">{formatCurrency(menu.price)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Floating Store Status for Desktop if Closed */}
            {!isOpen && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-rose-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border-2 border-rose-500 animate-bounce-subtle">
                    <Icon name="XCircle" size={24} />
                    <div>
                        <p className="font-black uppercase tracking-widest text-sm">Toko Sedang Istirahat</p>
                        <p className="text-[10px] font-bold opacity-80">Maaf, kami belum bisa melayani pesanan saat ini.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesktopDashboard;
