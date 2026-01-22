import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { toast } from 'react-hot-toast';
import OptionSelectionModal from '../../sales-transaction-processing/components/OptionSelectionModal';

const SellerTransactions = () => {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [userName, setUserName] = useState('Penjual');

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchData();
        const storedName = localStorage.getItem('username');
        if (storedName) setUserName(storedName);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [menuRes, catRes] = await Promise.all([
                authFetch(`${apiUrl}/api/menu-items/all`),
                authFetch(`${apiUrl}/api/categories`)
            ]);

            const menuData = await menuRes.json();
            const catData = await catRes.json();

            if (menuRes.ok) setMenuItems(menuData.data || []);
            if (catRes.ok) setCategories(catData.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Gagal memuat data menu");
        } finally {
            setIsLoading(false);
        }
    };

    const getCartItemId = (item, options) => {
        if (!options || options.length === 0) return item.id;
        const optionIds = options.map(o => o.id).sort().join('-');
        return `${item.id}-${optionIds}`;
    };

    const handleItemClick = (item) => {
        if (item.options && item.options.length > 0) {
            setSelectedItemForOptions(item);
            setIsOptionsModalOpen(true);
        } else {
            addToCart(item, []);
        }
    };

    const addToCart = (item, selectedOptions = []) => {
        setCart(prevCart => {
            const cartItemId = getCartItemId(item, selectedOptions);
            const existingItem = prevCart.find(i => i.cartItemId === cartItemId);

            const optionPriceAdjustment = selectedOptions.reduce((sum, opt) => sum + (opt.price_adjustment || 0), 0);
            const priceAfterDiscount = item.discount > 0 ? parseFloat(item.price) * (1 - item.discount) : parseFloat(item.price);
            const finalPrice = priceAfterDiscount + optionPriceAdjustment;

            if (existingItem) {
                return prevCart.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
            } else {
                return [...prevCart, {
                    ...item,
                    cartItemId,
                    quantity: 1,
                    selectedOptions,
                    basePrice: parseFloat(item.price),
                    finalPrice,
                }];
            }
        });
        toast.success(`${item.name} ditambahkan`);
    };

    const updateQuantity = (cartItemId, delta) => {
        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.cartItemId === cartItemId) {
                    const newQty = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const clearCart = () => {
        setCart([]);
        toast.success("Pesanan dikosongkan");
    };

    const removeItemFromCart = (cartItemId) => {
        setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
    };

    const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalCartPrice = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const handleProcessPayment = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        const transaction = {
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.finalPrice,
                basePrice: item.basePrice,
                discount: item.discount,
                options: item.selectedOptions.map(opt => ({ name: opt.name, price_adjustment: opt.price_adjustment }))
            })),
            total: totalCartPrice,
            ppn: 0,
            isEmployeeMeal: false,
            payment_method: 'tunai',
            ignoreStock: true, 
            cashPaid: totalCartPrice,
            change: 0,
            manual_discount: 0,
            catatan: '',
        };

        try {
            const response = await authFetch(`${apiUrl}/api/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction),
            });

            const result = await response.json();
            if (response.ok) {
                toast.success("Transaksi Berhasil!");
                setCart([]);
                setIsCartOpen(false);
                navigate('/seller/receipt', { state: { transaction: result.data } });
            } else {
                toast.error(result.error || "Gagal memproses transaksi");
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Terjadi kesalahan koneksi");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="pb-24 -mx-4 -mt-4 lg:-mx-10 lg:-mt-10 overflow-x-hidden animate-fade-in" style={{ maxWidth: '100vw' }}>
           
            <header className="bg-gradient-to-br from-indigo-800 via-blue-700 to-indigo-600 pt-16 pb-10 px-6 lg:pt-10 rounded-b-[2.5rem] shadow-xl relative z-10">
                <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => navigate(-1)} className="hidden lg:flex p-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-all mr-2">
                                <Icon name="ChevronLeft" size={20} />
                            </button>
                            <span className="text-blue-100 font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">Transaksi Baru</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Kasir Penjual</h1>
                        <p className="text-blue-100/80 font-medium mt-1">Pilih menu untuk memulai transaksi.</p>
                    </div>
                </div>
            </header>

            <main className="px-6 mt-8 space-y-6">
                <section className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm p-2 flex items-center gap-3 border border-gray-50 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <div className="p-2 text-gray-400">
                            <Icon name="Search" size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari menu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700 placeholder:text-gray-300"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['Semua', ...categories.map(c => c.name)].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${activeCategory === cat
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105'
                                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-44 bg-gray-50 rounded-[2rem] animate-pulse" />)}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map((item) => (
                            <div 
                                key={item.id} 
                                className="bg-white rounded-[2rem] p-4 border border-gray-50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative overflow-hidden"
                                onClick={() => handleItemClick(item)}
                            >
                                {item.is_featured === 1 && (
                                    <div className="absolute top-4 right-4 z-10 bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                                        Featured
                                    </div>
                                )}
                                 {item.discount > 0 && (
                                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-black px-2.5 py-1.5 rounded-full shadow-lg shadow-red-200 uppercase">
                                        -{item.discount * 100}%
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-50">
                                        {item.image_url ? (
                                            <img
                                                src={`${apiUrl}${item.image_url}`}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                <Icon name="Image" size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1 overflow-hidden">
                                        <div>
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block truncate">{item.category}</span>
                                            <h3 className="font-black text-gray-800 text-lg leading-tight truncate">{item.name}</h3>
                                            <p className="text-blue-600 font-black text-xl mt-1 tracking-tight truncate">{formatCurrency(item.price)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className={`w-2 h-2 rounded-full ${item.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-[11px] font-bold text-gray-500">Stok: <span className={item.stock > 0 ? 'text-gray-800' : 'text-red-500'}>{item.stock}</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-blue-200">
                            <Icon name="Pizza" size={40} />
                        </div>
                        <h3 className="text-xl font-black text-gray-800">Menu tidak ditemukan</h3>
                        <p className="text-gray-400 font-medium max-w-xs mx-auto text-sm mt-1 px-4">Coba cari dengan kata kunci lain.</p>
                    </div>
                )}
            </main>

            {cart.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50 pb-16">
                    <div
                        onClick={() => setIsCartOpen(true)}
                        className="bg-blue-600 p-4 rounded-2xl shadow-2xl shadow-blue-300 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="bg-white/20 p-3 rounded-xl">
                                    <Icon name="ShoppingBag" className="text-white" size={20} />
                                </div>
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-blue-600">
                                    {totalCartItems}
                                </span>
                            </div>
                            <div className="text-white">
                                <p className="font-bold text-lg leading-none">{formatCurrency(totalCartPrice)}</p>
                            </div>
                        </div>
                        <div className="text-white font-bold text-xs uppercase tracking-widest">
                            Lihat Pesanan
                        </div>
                    </div>
                </div>
            )}

            {isCartOpen && (
                <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 lg:p-4">
                     <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>
                    <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] lg:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-slide-up lg:animate-scale-up max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Detail Pesanan</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Lengkapi Transaksi</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={clearCart} title="Kosongkan Pesanan" className="p-3 bg-red-100 hover:bg-red-200 rounded-2xl transition-all text-red-500">
                                    <Icon name="Trash2" size={20} />
                                </button>
                                <button onClick={() => setIsCartOpen(false)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all text-gray-500">
                                    <Icon name="X" size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-5 bg-gray-50/50">
                            {cart.map(item => (
                                <div key={item.cartItemId} className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border">
                                        {item.image_url && <img src={`${apiUrl}${item.image_url}`} className="w-full h-full object-cover" alt="" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 leading-tight">{item.name}</h4>
                                        {item.selectedOptions.length > 0 && (
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {item.selectedOptions.map(o => o.name).join(', ')}
                                            </p>
                                        )}
                                        <p className="text-blue-600 font-black text-sm mt-1">{formatCurrency(item.finalPrice * item.quantity)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-full border">
                                        <button onClick={() => updateQuantity(item.cartItemId, -1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm"><Icon name="Minus" size={14} /></button>
                                        <span className="font-black text-sm w-5 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.cartItemId, 1)} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200"><Icon name="Plus" size={14} /></button>
                                    </div>
                                    <button onClick={() => removeItemFromCart(item.cartItemId)} className="w-11 h-11 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                                        <Icon name="Trash2" size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                         <div className="px-8 py-6 bg-white border-t border-gray-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-bold">Total Pembayaran</span>
                                <span className="text-3xl font-black text-blue-700 tracking-tight">{formatCurrency(totalCartPrice)}</span>
                            </div>
                            <button
                                onClick={handleProcessPayment}
                                disabled={isProcessing}
                                className="w-full bg-blue-700 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-blue-200 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {isProcessing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Icon name="CheckCircle" size={18} />
                                        Konfirmasi & Proses
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <OptionSelectionModal
                isOpen={isOptionsModalOpen}
                onClose={() => setIsOptionsModalOpen(false)}
                item={selectedItemForOptions}
                onAddToCartWithOptions={(item, options) => {
                    addToCart(item, options);
                    setIsOptionsModalOpen(false);
                }}
            />
        </div>
    );
};

export default SellerTransactions;
