import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useCart } from '../context/CartContext';

const CustomerMenu = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { id } = useParams();
    const { addToCart, updateQuantity, getItemQuantity, cartTotal, cartCount } = useCart();

    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

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
            if (item) setSelectedItem(item);
        } else if (!id) {
            setSelectedItem(null);
        }
    }, [id, menus]);

    useEffect(() => {
        fetchMenus();
    }, [searchTerm, selectedCategory, categories]);

    const fetchInitialData = async () => {
        try {
            const catRes = await authFetch(`${import.meta.env.VITE_API_URL}/api/categories`);
            const catData = await catRes.json();
            if (catData.data) setCategories(catData.data);
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
        navigate('/customer/menu');
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-32">
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
                            <div key={menu.id} onClick={() => navigate(`/customer/menu/${menu.id}`)} className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm cursor-pointer">
                                <div className="w-24 h-24 bg-gray-100 rounded-lg shrink-0 overflow-hidden relative">
                                    {menu.image_url ? (
                                        <img src={`${import.meta.env.VITE_API_URL}${menu.image_url}`} alt={menu.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Icon name="Image" className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">{menu.name}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{menu.description || 'Tidak ada deskripsi'}</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="font-bold text-gray-900">{formatCurrency(menu.price)}</span>
                                        {qty > 0 && (
                                            <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                {qty}x
                                            </div>
                                        )}
                                        {qty === 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); addToCart(menu); }}
                                                className="bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-green-100 transition-colors"
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
                            <p className="text-lg font-bold text-green-600 mb-4">{formatCurrency(selectedItem.price)}</p>
                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                {selectedItem.description || 'Menu lezat yang disiapkan spesial untuk Anda. Rasakan kenikmatan di setiap gigitan.'}
                            </p>

                            {/* Additional Info / Options Placeholder */}
                            <div className="space-y-3">
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600 text-sm">Kategori</span>
                                    <span className="font-medium text-gray-900 text-sm capitalize">{categories.find(c => c.id == selectedItem.category)?.name || selectedItem.category || '-'}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600 text-sm">Stok Tersedia</span>
                                    <span className="font-medium text-gray-900 text-sm">{selectedItem.stock} Porsi</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="p-4 border-t border-gray-100 bg-white">
                            {getItemQuantity(selectedItem.id) === 0 ? (
                                <button
                                    onClick={() => { addToCart(selectedItem); handleCloseDetail(); }}
                                    className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all"
                                >
                                    Tambah ke Keranjang - {formatCurrency(selectedItem.price)}
                                </button>
                            ) : (
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 bg-gray-100 rounded-xl p-1">
                                        <button onClick={() => updateQuantity(selectedItem.id, -1)} className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
                                            <Icon name="Minus" className="w-4 h-4" />
                                        </button>
                                        <span className="font-bold text-lg min-w-[20px] text-center">{getItemQuantity(selectedItem.id)}</span>
                                        <button onClick={() => updateQuantity(selectedItem.id, 1)} className="w-10 h-10 bg-green-600 text-white rounded-lg shadow-green-200 flex items-center justify-center active:scale-95 transition-transform">
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
