import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useCart } from '../context/CartContext';
import { useAppSettings } from '../../../contexts/AppSettingsContext';

const CustomerMenu = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { id } = useParams();
    const { addToCart, updateQuantity, getItemQuantity, getVariantQuantity, getCartId, cartTotal, cartCount } = useCart();
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
        // Find item if ID param exists and menus are loaded
        if (id && menus.length > 0) {
            const item = menus.find(m => m.id == id);
            if (item) {
                setSelectedItem(item);
                setSelectedOptions([]);
                fetchReviews(item.id);
            }
        } else if (!id) {
            setSelectedItem(null);
            setReviews([]);
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
            // fetchMenus will be triggered by useEffect when categories update
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMenus = async () => {
        setLoading(true);
        try {
            let url = `${import.meta.env.VITE_API_URL}/api/menu-items?limit=100`;
            if (selectedCategory !== 'all') {
                let filterValue = selectedCategory;

                // Jika selectedCategory adalah angka (ID), coba cari nama kategorinya
                // Karena database menu_items menyimpan Nama Kategori, bukan ID
                const cat = categories.find(c => c.id == selectedCategory);
                if (cat) {
                    filterValue = cat.name;
                }

                url += `&category=${encodeURIComponent(filterValue)}`;
            }

            const res = await authFetch(url);
            const data = await res.json();

            let items = data.data || [];

            // Apply filter from searchParams
            const filter = searchParams.get('filter');
            if (filter) {
                if (filter === 'sedang_promo') {
                    items = items.filter(i => i.discount > 0);
                } else if (filter === 'paling_laris') {
                    items = items.sort((a, b) => (parseFloat(b.average_rating) || 0) - (parseFloat(a.average_rating) || 0));
                } else if (filter === 'terbaru') {
                    items = items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                } else if (filter === 'paket_hemat') {
                    items = items.filter(i =>
                        (i.name && i.name.toLowerCase().includes('paket')) ||
                        (i.category && i.category.toLowerCase().includes('paket'))
                    );
                }
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
            if (data.message === 'success') {
                setReviews(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleCategoryClick = (catId) => {
        setSelectedCategory(catId);
        if (catId === 'all') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', catId);
        }
        setSearchParams(searchParams);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const handleCloseDetail = () => {
        setSelectedItem(null);
        setSelectedOptions([]);
        navigate('/customer/menu');
    };

    const toggleOption = (option) => {
        // Legacy toggle, keeping just in case or removing if sure. 
        // User requested single select required.
        // Updated UI uses setSelectedOptions directly.
        // Removing this function.
    };

    // Check validity
    const isOptionValid = !selectedItem?.options?.length || selectedOptions.length > 0;

    return (
        <div className="bg-gray-50 min-h-screen pb-32">
            {/* ... (Header code unchanged) ... */}
            {/* Fixed Header Container */}
            <div className="fixed top-0 left-0 right-0 z-30 w-full max-w-md mx-auto bg-white shadow-sm">
                {/* Search Header */}
                <div className="p-4 pb-2">
                    <div className="relative">
                        <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari makanan & minuman..."
                            className="w-full bg-gray-100 rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories Filter */}
                <div className="py-2 border-b border-gray-100">
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4">
                        <button
                            onClick={() => handleCategoryClick('all')}
                            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === 'all'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Semua
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.id)}
                                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory == cat.id
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Spacer for Fixed Header */}
            <div className="h-32"></div>

            {!isOpen && (
                <div className="px-4 mt-2">
                    <div className="bg-red-500/90 backdrop-blur-md text-white p-3 rounded-2xl flex items-center gap-3 shadow-lg border border-red-400/50 animate-pulse">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Icon name="XCircle" className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Toko Sedang Tutup</p>
                            <p className="text-[10px] opacity-90 font-medium">Maaf, saat ini kami tidak menerima pesanan.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Menu List */}
            <div className="p-4 space-y-4">
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 animate-pulse">
                            <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                    ))
                ) : menus.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <Icon name="SearchX" className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Menu tidak ditemukan</p>
                    </div>
                ) : (
                    menus.map(menu => {
                        const qty = getItemQuantity(menu.id);
                        return (
                            <div
                                key={menu.id}
                                onClick={() => isOpen && navigate(`/customer/menu/${menu.id}`)}
                                className={`flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all ${!isOpen ? 'opacity-75 grayscale-[0.5] cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}`}
                            >
                                <div className="w-24 h-24 bg-gray-100 rounded-lg shrink-0 overflow-hidden relative">
                                    {menu.image_url ? (
                                        <img src={`${import.meta.env.VITE_API_URL}${menu.image_url}`} alt={menu.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Icon name="Image" className="w-8 h-8" />
                                        </div>
                                    )}
                                    {menu.discount > 0 && (
                                        <div className="absolute top-1 left-1 bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm z-10">
                                            {parseFloat(menu.discount).toFixed(0)}% OFF
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800 text-sm">{menu.name}</h4>
                                            {menu.total_reviews > 0 && (
                                                <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                                                    <Icon name="Star" className="w-3 h-3 fill-current" />
                                                    <span>{parseFloat(menu.average_rating).toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{menu.description || 'Tidak ada deskripsi'}</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="flex flex-col">
                                            {menu.discount > 0 && <span className="text-[10px] text-gray-400 line-through leading-none">{formatCurrency(menu.price)}</span>}
                                            <span className="font-bold text-gray-900 leading-none">{formatCurrency(Math.round(menu.discount > 0 ? menu.price * (1 - menu.discount / 100) : menu.price))}</span>
                                        </div>
                                        {qty > 0 && (
                                            <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                {qty}x
                                            </div>
                                        )}
                                        {qty === 0 && (
                                            <button
                                                disabled={!isOpen}
                                                onClick={(e) => { e.stopPropagation(); navigate(`/customer/menu/${menu.id}`); }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${!isOpen ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}
                                            >
                                                Tambah
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Detail Modal Overlay */}
            {selectedItem && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={handleCloseDetail}>
                    <div className="bg-white w-full max-w-md h-[85vh] sm:h-auto sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                        {/* Image Header */}
                        <div className="h-64 bg-gray-200 relative shrink-0">
                            {selectedItem.image_url ? (
                                <img src={`${import.meta.env.VITE_API_URL}${selectedItem.image_url}`} alt={selectedItem.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Icon name="Image" className="w-16 h-16" />
                                </div>
                            )}
                            <button onClick={handleCloseDetail} className="absolute top-4 left-4 bg-white/50 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors">
                                <Icon name="ArrowLeft" className="w-6 h-6 text-gray-800" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem.name}</h2>
                            <div className="flex items-center gap-2 mb-4">
                                {selectedItem.discount > 0 && <span className="text-sm text-gray-400 line-through">{formatCurrency(selectedItem.price)}</span>}
                                <p className="text-lg font-bold text-green-600">{formatCurrency(Math.round(selectedItem.discount > 0 ? selectedItem.price * (1 - selectedItem.discount / 100) : selectedItem.price))}</p>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                {selectedItem.description || 'Menu lezat yang disiapkan spesial untuk Anda. Rasakan kenikmatan di setiap gigitan.'}
                            </p>

                            {/* Options / Toppings */}
                            {selectedItem.options && selectedItem.options.length > 0 && (
                                <div className="mt-6 mb-4">
                                    <h3 className="font-bold text-gray-800 text-sm mb-3">Pilihan (Wajib Pilih Satu)</h3>
                                    <div className="space-y-3">
                                        {selectedItem.options.map((opt) => {
                                            const isSelected = selectedOptions.some(o => o.id === opt.id);
                                            return (
                                                <div
                                                    key={opt.id}
                                                    onClick={() => setSelectedOptions([opt])}
                                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-green-200'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
                                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                        </div>
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{opt.name}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700">
                                                        +{formatCurrency(opt.price_adjustment)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Additional Info */}
                            <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between py-2 text-sm">
                                    <span className="text-gray-500">Kategori</span>
                                    <span className="font-medium text-gray-900 capitalize">{categories.find(c => c.id == selectedItem.category)?.name || selectedItem.category || '-'}</span>
                                </div>
                                <div className="flex justify-between py-2 text-sm border-t border-gray-50">
                                    <span className="text-gray-500">Stok Tersedia</span>
                                    <span className="font-medium text-gray-900">{selectedItem.stock} Porsi</span>
                                </div>
                            </div>

                            {/* Reviews Section */}
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-black text-gray-900 text-lg tracking-tight">Ulasan Pelanggan</h3>
                                    {selectedItem.total_reviews > 0 && (
                                        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                            <Icon name="Star" className="w-4 h-4 text-amber-500 fill-current" />
                                            <span className="text-sm font-black text-amber-700">{parseFloat(selectedItem.average_rating).toFixed(1)}</span>
                                            <span className="text-xs text-amber-400 font-bold">({selectedItem.total_reviews})</span>
                                        </div>
                                    )}
                                </div>

                                {reviewsLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="animate-pulse space-y-2">
                                                <div className="h-4 bg-gray-100 rounded w-1/4" />
                                                <div className="h-4 bg-gray-50 rounded w-full" />
                                            </div>
                                        ))}
                                    </div>
                                ) : reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map((rv, idx) => (
                                            <div key={idx} className="group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-black text-[10px]">
                                                            {rv.username?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-gray-800 text-xs leading-none mb-1">{rv.username}</p>
                                                            <div className="flex gap-0.5">
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <Icon
                                                                        key={star}
                                                                        name="Star"
                                                                        className={`w-2.5 h-2.5 ${star <= rv.rating ? 'text-amber-400 fill-current' : 'text-gray-200'}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">
                                                        {new Date(rv.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                {rv.comment && (
                                                    <p className="text-sm text-gray-600 font-medium pl-10 leading-relaxed italic">
                                                        "{rv.comment}"
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-100">
                                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                            <Icon name="MessageSquare" className="w-6 h-6 text-gray-200" />
                                        </div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada ulasan</p>
                                        <p className="text-[10px] text-gray-300 font-medium mt-1">Jadilah yang pertama mencoba!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="p-4 border-t border-gray-100 bg-white pb-8 sm:pb-4">
                            {getVariantQuantity(selectedItem.id, selectedOptions) === 0 ? (
                                <button
                                    onClick={() => {
                                        addToCart(selectedItem, 1, selectedOptions);
                                    }}
                                    disabled={selectedItem.options && selectedItem.options.length > 0 && selectedOptions.length === 0}
                                    className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all flex justify-between px-6 ${selectedItem.options && selectedItem.options.length > 0 && selectedOptions.length === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                        : 'bg-green-600 text-white shadow-green-200 hover:bg-green-700 active:scale-95'
                                        }`}
                                >
                                    <span>Tambah ke Keranjang</span>
                                    <span>{formatCurrency(Math.round((selectedItem.discount > 0 ? selectedItem.price * (1 - selectedItem.discount / 100) : selectedItem.price) + selectedOptions.reduce((acc, opt) => acc + (parseFloat(opt.price_adjustment) || 0), 0)))}</span>
                                </button>
                            ) : (
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 bg-gray-100 rounded-xl p-1">
                                        <button
                                            onClick={() => {
                                                const cartId = getCartId(selectedItem.id, selectedOptions);
                                                if (cartId) updateQuantity(cartId, -1);
                                            }}
                                            className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-700 active:scale-95 transition-transform"
                                        >
                                            <Icon name="Minus" className="w-4 h-4" />
                                        </button>
                                        <span className="font-bold text-lg min-w-[20px] text-center">{getVariantQuantity(selectedItem.id, selectedOptions)}</span>
                                        <button
                                            onClick={() => {
                                                const cartId = getCartId(selectedItem.id, selectedOptions);
                                                if (cartId) updateQuantity(cartId, 1);
                                            }}
                                            className="w-10 h-10 bg-green-600 text-white rounded-lg shadow-green-200 flex items-center justify-center active:scale-95 transition-transform"
                                        >
                                            <Icon name="Plus" className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button onClick={handleCloseDetail} className="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-xl text-center shadow-lg shadow-green-200 hover:bg-green-700">
                                        Simpan
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Cart Notification */}
            {cartCount > 0 && !selectedItem && (
                <div onClick={() => navigate('/customer/cart')} className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 cursor-pointer animate-slide-up">
                    <div className="bg-green-600 text-white p-4 rounded-xl shadow-lg flex justify-between items-center hover:bg-green-700 transition-colors">
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">{cartCount} Item</span>
                            <span className="text-xs opacity-90 text-green-100">Estimasi total: {formatCurrency(cartTotal)}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-sm">
                            Ke Keranjang
                            <Icon name="ArrowRight" className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerMenu;
