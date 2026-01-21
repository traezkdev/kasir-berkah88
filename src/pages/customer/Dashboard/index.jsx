import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useAppSettings } from '../../../contexts/AppSettingsContext';

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Pelanggan');
    const { isOpen } = useAppSettings();

    const [banners, setBanners] = useState([]);

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 150) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        const fetchData = async () => {
            try {
                // Fetch User Name (from token or profile endpoint if available)
                // For now assuming token has payload or default 'Pelanggan'
                const storedName = localStorage.getItem('username'); // Or decode JWT
                if (storedName) setUserName(storedName);

                // Fetch Banners
                const bannerRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/banners`);
                const bannerData = await bannerRes.json();
                if (bannerData.data) setBanners(bannerData.data);

                // Fetch Categories
                const catRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/categories`);
                const catData = await catRes.json();
                if (catData.data) setCategories(catData.data.slice(0, 5)); // Limit 5 for home

                // Fetch Recommended Menus (Top 5)
                const menuRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/menu-items?limit=6`);
                const menuData = await menuRes.json();
                if (menuData.data) setMenus(menuData.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="pb-24">
            {/* Floating Compact Header on Scroll */}
            <div className={`fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100 p-3 transition-all duration-300 max-w-md mx-auto ${scrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
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
                        <p className="text-green-100 text-sm font-medium">Selamat Pagi,</p>
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
                <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap pb-1">
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
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mb-0.5">BerkahPay</span>
                        <span className="text-xl font-black text-gray-900 tracking-tight">Rp 0</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1 cursor-pointer group">
                            <div className="bg-green-50 p-2 rounded-xl text-green-600 border border-green-100 group-active:scale-90 transition-transform">
                                <Icon name="PlusCircle" className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-black text-gray-500 uppercase">Top Up</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 cursor-pointer group">
                            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 border border-blue-100 group-active:scale-90 transition-transform">
                                <Icon name="History" className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-black text-gray-500 uppercase">Riwayat</span>
                        </div>
                    </div>
                </div>

                {/* Status Pesanan Section (The one user liked) */}
                <div
                    onClick={() => navigate('/customer/order-confirmation')}
                    className="flex items-center gap-4 p-5 cursor-pointer active:bg-gray-50 transition-all duration-200 group"
                >
                    <div className="p-3 rounded-2xl group-active:scale-90 transition-transform bg-orange-50 text-orange-500">
                        <Icon name="ShoppingBag" className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <span className="block font-extrabold text-gray-800 tracking-tight">Status Pesanan</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Lacak pesanan aktif Anda</span>
                    </div>
                    <Icon name="ChevronRight" className="w-4 h-4 text-gray-300" />
                </div>
            </div>


            {/* Banners Carousel */}
            <section className="mt-8 px-4 overflow-x-auto hide-scrollbar flex gap-4 pb-4 snap-x">
                {banners.map((banner) => (
                    <div key={banner.id} className={`${banner.color_class} min-w-[280px] h-36 rounded-2xl p-4 text-white flex flex-col justify-between shadow-md snap-center hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden`}>
                        <div className="z-10 relative">
                            <h3 className="font-bold text-xl">{banner.title}</h3>
                            <p className="text-sm opacity-90">{banner.subtitle}</p>
                        </div>
                        <div className="self-end bg-white/20 p-2 rounded-full z-10">
                            <Icon name="ArrowRight" className="w-5 h-5" />
                        </div>
                        {/* Decorative Icon */}
                        <Icon name={banner.icon_name} className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
                    </div>
                ))}
            </section>

            {/* Categories */}
            <section className="mt-2 px-4">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="font-bold text-lg text-gray-800">Kategori</h3>
                    <Link to="/customer/menu" className="text-sm text-green-600 font-semibold">Lihat Semua</Link>
                </div>
                <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-2">
                    {/* All Category */}
                    <Link to="/customer/menu" className="flex flex-col items-center gap-2 min-w-[64px] cursor-pointer group">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100 group-hover:bg-green-100 transition-colors">
                            <Icon name="LayoutGrid" className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-600 text-center truncate w-full">Semua</span>
                    </Link>
                    {/* Dynamic Categories */}
                    {categories.map((cat) => (
                        <Link to={`/customer/menu?category=${cat.id}`} key={cat.id} className="flex flex-col items-center gap-2 min-w-[64px] cursor-pointer group">
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-gray-100 transition-colors">
                                <Icon name="Coffee" className="w-6 h-6 text-gray-500" />
                                {/* Ideally category has icon, fallback to Coffee */}
                            </div>
                            <span className="text-xs font-medium text-gray-600 text-center truncate w-full">{cat.name}</span>
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
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1">{menu.name}</h4>
                                <div className="flex justify-between items-end mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 line-through">Rp {parseFloat(menu.price * 1.1).toLocaleString()}</span>
                                        <span className="font-bold text-green-600 text-sm">{formatCurrency(menu.price)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                        <Icon name="Star" className="w-3 h-3 text-yellow-400 fill-current" />
                                        <span>4.8</span>
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
