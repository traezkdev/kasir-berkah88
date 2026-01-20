import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';

const SellerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activeBanners: 0,
        featuredItems: 0,
        totalItems: 0,
        categories: 0
    });
    const [featuredMenus, setFeaturedMenus] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Penjual');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        const fetchAllData = async () => {
            try {
                const storedName = localStorage.getItem('username');
                if (storedName) setUserName(storedName);

                // Fetch Banners
                const bannerRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/banners/all`);
                const bannerData = await bannerRes.json();
                const activeBanners = bannerData.data ? bannerData.data.filter(b => b.is_active).length : 0;

                // Fetch Menu Items
                const menuRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/menu-items?limit=1000`);
                const menuData = await menuRes.json();
                const totalItems = menuData.data ? menuData.data.length : 0;
                const featured = menuData.data ? menuData.data.filter(m => m.is_featured) : [];

                // Fetch Categories
                const catRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/categories`);
                const catData = await catRes.json();
                const categories = catData.data ? catData.data.length : 0;

                setStats({
                    activeBanners,
                    featuredItems: featured.length,
                    totalItems,
                    categories
                });
                setFeaturedMenus(featured.slice(0, 4));
            } catch (error) {
                console.error("Error fetching seller dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="pb-24 -mx-4 -mt-4 lg:-mx-10 lg:-mt-10 overflow-x-hidden">
            {/* Floating Top Nav (App Bar feel) */}
            <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'} lg:hidden`}>
                <div className="px-6 flex justify-between items-center">
                    <span className={`font-bold transition-colors ${scrolled ? 'text-gray-800' : 'text-white text-xl'}`}>
                        {scrolled ? 'Seller Center' : ''}
                    </span>
                    <div className="flex gap-3">
                        <button className={`p-2 rounded-full ${scrolled ? 'bg-gray-100 text-gray-600' : 'bg-white/20 text-white'}`}>
                            <Icon name="Bell" size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Header Section */}
            {/* Header Section */}
            <header className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 pt-16 pb-24 px-6 lg:pt-10 rounded-b-[2.5rem] shadow-xl relative z-10">
                {/* Decorative background shapes (contained to avoid clipping stats) */}
                <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-20%] left-[-5%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <Icon name="Store" className="text-white w-5 h-5" />
                            </div>
                            <span className="text-blue-100 font-bold text-sm tracking-wider uppercase">Seller Manager</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Halo, {userName}!</h1>
                        <p className="text-blue-100/80 font-medium mt-1">Siap untuk kelola tokomu hari ini?</p>
                    </div>

                    <button
                        onClick={() => window.open('/customer/dashboard', '_blank')}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all self-start md:self-center"
                    >
                        <Icon name="Eye" size={18} />
                        Pratinjau Toko
                    </button>
                </div>

                {/* Main Stats Card (Floating) - Added z-20 to stay on top */}
                <div className="absolute left-6 right-6 bottom-[-60px] bg-white rounded-3xl p-6 shadow-2xl flex justify-between items-center border border-gray-50 z-20">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Status Toko</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-lg font-black text-gray-800 tracking-tight">Online & Aktif</span>
                        </div>
                    </div>
                    <div className="h-10 w-[1px] bg-gray-100 mx-2"></div>
                    <div className="flex-1 grid grid-cols-2 gap-4 ml-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400">Total Produk</span>
                            <span className="text-xl font-black text-blue-600 leading-none">{stats.totalItems}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400">Featured</span>
                            <span className="text-xl font-black text-orange-500 leading-none">{stats.featuredItems}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="mt-20 px-6 space-y-10">
                {/* Quick Actions Grid */}
                <section>
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">Aksi Cepat</h2>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: 'Kelola Banner', icon: 'Image', color: 'bg-blue-50 text-blue-600', path: '/seller/banners' },
                            { label: 'Tambah Menu', icon: 'PlusCircle', color: 'bg-green-50 text-green-600', path: '/seller/menu-management' },
                            { label: 'Kategori', icon: 'LayoutGrid', color: 'bg-indigo-50 text-indigo-600', path: '/seller/menu-management' },
                            { label: 'Statistik', icon: 'BarChart3', color: 'bg-purple-50 text-purple-600', path: '/dashboard-v2' }
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(action.path)}
                                className="flex flex-col items-center gap-3 group"
                            >
                                <div className={`w-16 h-16 ${action.color} rounded-[1.5rem] flex items-center justify-center shadow-sm group-hover:scale-110 group-active:scale-95 transition-all duration-300`}>
                                    <Icon name={action.icon} size={24} />
                                </div>
                                <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Featured Items List (Native style) */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">Menu Unggulan</h2>
                        <button onClick={() => navigate('/seller/menu-management')} className="text-blue-600 font-bold text-sm">Lihat Semua</button>
                    </div>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : featuredMenus.length > 0 ? (
                        <div className="space-y-4">
                            {featuredMenus.map((menu) => (
                                <div
                                    key={menu.id}
                                    className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]"
                                    onClick={() => navigate('/seller/menu-management')}
                                >
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                                        {menu.image_url ? (
                                            <img src={`${import.meta.env.VITE_API_URL}${menu.image_url}`} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Icon name="Utensils" size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-800 truncate">{menu.name}</h4>
                                        <p className="text-sm text-gray-400 font-medium">{formatCurrency(menu.price)}</p>
                                    </div>
                                    <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        Featured
                                    </div>
                                    <Icon name="ChevronRight" size={20} className="text-gray-300" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-10 text-center">
                            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
                                <Icon name="Coffee" size={24} />
                            </div>
                            <p className="text-gray-400 font-medium">Belum ada menu unggulan.<br />Tandai menu terbaikmu!</p>
                        </div>
                    )}
                </section>

                {/* Promo Tips Banner */}
                <section className="bg-orange-50 rounded-[2rem] p-8 border border-orange-100 flex items-center gap-6 relative overflow-hidden">
                    <div className="flex-1 relative z-10">
                        <span className="text-orange-600 font-black text-xs uppercase tracking-widest mb-2 block">Seller Tips</span>
                        <h3 className="text-lg font-black text-orange-900 mb-2">Tarik lebih banyak pembeli!</h3>
                        <p className="text-orange-800/70 text-sm font-medium">Gunakan foto produk yang berkualitas tinggi dan aktifkan banner promo untuk meningkatkan penjualan hingga 30%.</p>
                    </div>
                    <div className="bg-orange-500 text-white p-4 rounded-3xl shadow-xl transform rotate-12 relative z-10">
                        <Icon name="Zap" size={32} />
                    </div>
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-orange-200/30 rounded-full blur-2xl"></div>
                </section>
            </main>
        </div>
    );
};

export default SellerDashboard;

