import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useCart } from '../context/CartContext';
import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { motion, AnimatePresence } from 'framer-motion';

const DesktopMenu = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { id } = useParams();
    const { addToCart, updateQuantity, getCartId, getVariantQuantity, cartTotal, cartCount } = useCart();
    const { isOpen } = useAppSettings();

    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (id && menus.length > 0) {
            const item = menus.find(m => m.id == id);
            if (item) {
                setSelectedItem(item);
                setSelectedOptions([]);
                fetchReviews(item.id);
            }
        } else if (!id) {
            setSelectedItem(null);
        }
    }, [id, menus]);

    useEffect(() => {
        setSelectedCategory(searchParams.get('category') || 'all');
    }, [searchParams]);

    useEffect(() => {
        fetchMenus();
    }, [searchTerm, selectedCategory, categories, searchParams]);

    const fetchInitialData = async () => {
        try {
            const catRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/categories`);
            const catData = await catRes.json();
            if (catData.data) {
                const visibleCategories = catData.data.filter(c => c.is_visible !== 0 && c.is_visible !== false);
                setCategories(visibleCategories);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMenus = async () => {
        setLoading(true);
        try {
            let url = `${import.meta.env.VITE_API_URL}/api/menu-items?limit=100`;
            if (selectedCategory !== 'all') {
                const cat = categories.find(c => c.id == selectedCategory);
                if (cat) url += `&category=${encodeURIComponent(cat.name)}`;
            }

            const res = await authFetch(url);
            const data = await res.json();
            let items = data.data || [];

            const filter = searchParams.get('filter');
            if (filter) {
                if (filter === 'sedang_promo') items = items.filter(i => i.discount > 0);
                else if (filter === 'paling_laris') items = items.sort((a, b) => (parseFloat(b.average_rating) || 0) - (parseFloat(a.average_rating) || 0));
                else if (filter === 'terbaru') items = items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }

            if (searchTerm) {
                items = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
            }
            setMenus(items);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (menuItemId) => {
        setReviewsLoading(true);
        try {
            const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/menu-reviews/${menuItemId}`);
            const data = await res.json();
            if (data.message === 'success') setReviews(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleCategoryClick = (catId) => {
        if (catId === 'all') searchParams.delete('category');
        else searchParams.set('category', catId);
        setSearchParams(searchParams);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const handleCloseDetail = () => {
        setSelectedItem(null);
        navigate('/customer/menu');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <main className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-12 gap-8">
                {/* Sidebar Filter */}
                <aside className="col-span-3 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Kategori Menu</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleCategoryClick('all')}
                                className={`w-full text-left px-5 py-3.5 rounded-2xl font-black text-sm uppercase tracking-tight transition-all flex items-center justify-between group ${selectedCategory === 'all' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <span>Semua Menu</span>
                                <Icon name="ChevronRight" className={`w-4 h-4 transition-transform ${selectedCategory === 'all' ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className={`w-full text-left px-5 py-3.5 rounded-2xl font-black text-sm uppercase tracking-tight transition-all flex items-center justify-between group ${selectedCategory == cat.id ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span>{cat.name}</span>
                                    <Icon name="ChevronRight" className={`w-4 h-4 transition-transform ${selectedCategory == cat.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Urutkan Berdasarkan</h3>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'sedang_promo', label: 'Diskon', icon: 'Zap' },
                                { id: 'paling_laris', label: 'Terlaris', icon: 'Star' },
                                { id: 'terbaru', label: 'Terbaru', icon: 'Clock' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => {
                                        if (searchParams.get('filter') === filter.id) searchParams.delete('filter');
                                        else searchParams.set('filter', filter.id);
                                        setSearchParams(searchParams);
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${searchParams.get('filter') === filter.id ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-orange-200'}`}
                                >
                                    <Icon name={filter.icon} size={14} />
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!isOpen && (
                        <div className="bg-rose-600 rounded-[2rem] p-6 text-white text-center shadow-xl shadow-rose-600/20 border-4 border-white dark:border-slate-800">
                            <Icon name="XCircle" className="w-10 h-10 mx-auto mb-3" />
                            <h4 className="font-black text-lg mb-1">TOKO TUTUP</h4>
                            <p className="text-xs font-bold text-rose-100 leading-relaxed">Saat ini kami sedang beristirahat. Silakan cek menu, tapi pemesanan belum tersedia.</p>
                        </div>
                    )}
                </aside>

                {/* Main Content Area */}
                <div className="col-span-9 space-y-8">
                    {/* Search Header Desktop */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-6">
                        <div className="flex-1 relative">
                            <Icon name="Search" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari menu favoritmu di sini..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border-transparent focus:border-green-500 focus:ring-0 rounded-2xl py-4 pl-14 pr-6 text-slate-700 dark:text-white font-bold transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Koleksi</p>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{menus.length} <span className="text-green-600 text-sm">Varian Rasa</span></span>
                        </div>
                    </div>

                    {/* Menu Grid */}
                    {loading ? (
                        <div className="grid grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-[4/5] bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse" />)}
                        </div>
                    ) : menus.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border border-slate-100 dark:border-slate-800">
                            <Icon name="SearchX" className="w-20 h-20 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Menu tidak ditemukan</h3>
                            <button onClick={() => { setSearchTerm(''); handleCategoryClick('all'); }} className="mt-4 text-green-600 font-black text-sm hover:underline">Reset Pencarian</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-8">
                            {menus.map((menu) => (
                                <motion.div
                                    layout
                                    whileHover={{ y: -8 }}
                                    key={menu.id}
                                    onClick={() => isOpen && navigate(`/customer/menu/${menu.id}`)}
                                    className={`group bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:border-green-100 dark:hover:border-green-900 flex flex-col ${!isOpen ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="aspect-square rounded-[2rem] overflow-hidden mb-5 relative bg-slate-50 dark:bg-slate-800">
                                        {menu.image_url ? (
                                            <img src={`${import.meta.env.VITE_API_URL}${menu.image_url}`} alt={menu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Icon name="Image" size={48} /></div>
                                        )}
                                        {menu.discount > 0 && (
                                            <div className="absolute top-4 left-4 z-10 bg-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">-{parseFloat(menu.discount).toFixed(0)}% OFF</div>
                                        )}
                                        <button className="absolute bottom-4 right-4 bg-green-600 text-white p-4 rounded-2xl shadow-xl hover:bg-green-700 active:scale-90 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-300">
                                            <Icon name="Plus" size={20} />
                                        </button>
                                    </div>
                                    <div className="flex-1 px-1">
                                        <h4 className="font-black text-slate-800 dark:text-white text-xl leading-tight mb-2 line-clamp-2">{menu.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider mb-5">
                                            <Icon name="Star" className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                            <span>{parseFloat(menu.average_rating || 5).toFixed(1)}</span>
                                            <span className="opacity-30">|</span>
                                            <span>Terjual 100+</span>
                                        </div>
                                        <div className="mt-auto flex items-end justify-between">
                                            <div className="flex flex-col">
                                                {menu.discount > 0 ? (
                                                    <>
                                                        <span className="text-xs text-slate-400 line-through font-bold">{formatCurrency(menu.price)}</span>
                                                        <span className="text-2xl font-black text-green-600 tracking-tighter">{formatCurrency(Math.round(menu.price * (1 - menu.discount / 100)))}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-2xl font-black text-green-600 tracking-tighter">{formatCurrency(menu.price)}</span>
                                                )}
                                            </div>
                                            {getVariantQuantity(menu.id, []) > 0 && (
                                                <div className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 font-black text-xs px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                                                    {getVariantQuantity(menu.id, [])}x Dalam Keranjang
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Summary Bar for Cart */}
            {cartCount > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
                    <div onClick={() => navigate('/customer/cart')} className="bg-green-600 text-white pl-8 pr-4 py-4 rounded-[2rem] shadow-2xl flex items-center gap-10 cursor-pointer hover:bg-green-700 hover:-translate-y-1 transition-all group active:scale-95">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-widest opacity-70">Total Pesanan</span>
                            <span className="text-xl font-black tracking-tight">{formatCurrency(cartTotal)}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 h-10 w-[1px]" />
                            <div className="bg-white text-green-600 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg group-hover:pr-8 transition-all">
                                {cartCount} Item
                                <Icon name="ArrowRight" className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Desktop Menu Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md" onClick={handleCloseDetail}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex border border-white/20 dark:border-slate-800"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Left: Image Section */}
                            <div className="w-1/2 bg-slate-100 dark:bg-slate-800 relative group overflow-hidden">
                                {selectedItem.image_url ? (
                                    <img src={`${import.meta.env.VITE_API_URL}${selectedItem.image_url}`} alt={selectedItem.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Icon name="Image" size={120} /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <button onClick={handleCloseDetail} className="absolute top-8 left-8 bg-white/50 backdrop-blur-md p-4 rounded-2xl hover:bg-white transition-all active:scale-90 shadow-xl">
                                    <Icon name="ArrowLeft" className="text-slate-800" />
                                </button>
                                {selectedItem.discount > 0 && (
                                    <div className="absolute top-8 right-8 bg-rose-600 text-white font-black px-6 py-2 rounded-full text-sm shadow-2xl">HEMAT {parseFloat(selectedItem.discount).toFixed(0)}%</div>
                                )}
                            </div>

                            {/* Right: Info & Actions */}
                            <div className="w-1/2 flex flex-col h-full bg-white dark:bg-slate-900">
                                <div className="p-12 overflow-y-auto flex-1 space-y-8 scrollbar-hide">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-[10px] font-black bg-green-100 dark:bg-green-900/40 text-green-600 px-3 py-1 rounded-full uppercase tracking-widest">{categories.find(c => c.id == selectedItem.category)?.name || 'Menu Utama'}</span>
                                            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs"><Icon name="Star" size={14} className="fill-current" /> {parseFloat(selectedItem.average_rating || 5).toFixed(1)}</div>
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4">{selectedItem.name}</h2>
                                        <p className="text-slate-500 font-medium leading-relaxed">{selectedItem.description || 'Nikmati kelezatan menu pilihan dari Berkah88 yang disiapkan dengan bahan-bahan segar setiap harinya. Cita rasa otentik yang akan membuat Anda ketagihan.'}</p>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] flex items-center justify-between border border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Harga Per Porsi</span>
                                            <div className="flex items-center gap-3">
                                                {selectedItem.discount > 0 && <span className="text-sm text-slate-400 line-through font-bold">{formatCurrency(selectedItem.price)}</span>}
                                                <span className="text-3xl font-black text-green-600 tracking-tighter">{formatCurrency(Math.round(selectedItem.discount > 0 ? selectedItem.price * (1 - selectedItem.discount / 100) : selectedItem.price))}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Status Stok</span>
                                            <p className="text-slate-800 dark:text-white font-black">{selectedItem.stock} Tersedia</p>
                                        </div>
                                    </div>

                                    {/* Options / Varian */}
                                    {selectedItem.options && selectedItem.options.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Pilih Varian (Wajib)</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {selectedItem.options.map(opt => {
                                                    const isSelected = selectedOptions.some(o => o.id === opt.id);
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setSelectedOptions([opt])}
                                                            className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${isSelected ? 'border-green-600 bg-green-50 dark:bg-green-600/10' : 'border-slate-100 dark:border-slate-800 hover:border-green-200'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                                                                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                                </div>
                                                                <span className={`font-black tracking-tight ${isSelected ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>{opt.name}</span>
                                                            </div>
                                                            <span className="font-bold text-slate-400">+{formatCurrency(opt.price_adjustment)}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reviews Section */}
                                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Ulasan Pelanggan</h3>
                                            <span className="text-[10px] font-black text-green-600">{reviews.length} Ulasan</span>
                                        </div>

                                        {reviewsLoading ? (
                                            <div className="animate-pulse space-y-4">
                                                <div className="h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full" />
                                            </div>
                                        ) : reviews.length > 0 ? (
                                            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                                                {reviews.map((rv, idx) => (
                                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{rv.username}</p>
                                                            <div className="flex gap-0.5"><Icon name="Star" size={10} className="text-amber-400 fill-current" /> <span className="text-[10px] font-bold text-amber-600">{rv.rating}</span></div>
                                                        </div>
                                                        <p className="text-xs text-slate-500 italic">"{rv.comment}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada ulasan untuk menu ini</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Desktop Modal Action Footer */}
                                <div className="p-12 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-8">
                                    {getVariantQuantity(selectedItem.id, selectedOptions) === 0 ? (
                                        <button
                                            disabled={!isOpen || (selectedItem.options?.length > 0 && selectedOptions.length === 0)}
                                            onClick={() => {
                                                addToCart(selectedItem, 1, selectedOptions);
                                            }}
                                            className="flex-1 bg-green-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-green-600/20 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-sm disabled:opacity-50"
                                        >
                                            <Icon name="ShoppingBag" />
                                            Masukkan ke Keranjang
                                        </button>
                                    ) : (
                                        <div className="flex-1 flex items-center gap-6">
                                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-3xl flex items-center gap-6">
                                                <button
                                                    onClick={() => {
                                                        const cartId = getCartId(selectedItem.id, selectedOptions);
                                                        if (cartId) updateQuantity(cartId, -1);
                                                    }}
                                                    className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-400 hover:text-red-500 hover:shadow-md transition-all active:scale-90 flex items-center justify-center"
                                                >
                                                    <Icon name="Minus" />
                                                </button>
                                                <span className="text-2xl font-black text-slate-900 dark:text-white min-w-[30px] text-center tracking-tighter">{getVariantQuantity(selectedItem.id, selectedOptions)}</span>
                                                <button
                                                    onClick={() => {
                                                        const cartId = getCartId(selectedItem.id, selectedOptions);
                                                        if (cartId) updateQuantity(cartId, 1);
                                                    }}
                                                    className="w-14 h-14 bg-green-600 text-white rounded-2xl shadow-xl shadow-green-600/20 flex items-center justify-center active:scale-90 transition-all"
                                                >
                                                    <Icon name="Plus" />
                                                </button>
                                            </div>
                                            <button onClick={handleCloseDetail} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-3xl hover:opacity-90 active:scale-95 transition-all text-sm uppercase tracking-widest">
                                                Simpan Pesanan
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DesktopMenu;
