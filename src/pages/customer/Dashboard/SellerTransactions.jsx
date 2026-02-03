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
    const [scrolled, setScrolled] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        fetchData();
        const storedName = localStorage.getItem('username');
        if (storedName) setUserName(storedName);

        return () => window.removeEventListener('scroll', handleScroll);
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
            // Normalize discount: jika > 1, anggap dalam format persentase (50), konversi ke desimal (0.50)
            const discountDecimal = item.discount > 1 ? item.discount / 100 : item.discount;
            const priceAfterDiscount = item.discount > 0 ? parseFloat(item.price) * (1 - discountDecimal) : parseFloat(item.price);
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
        <div className="pb-24 -mx-4 -mt-4 lg:mx-0 lg:mt-0 lg:pb-10 lg:static">
            {/* Mobile Sticky Header (Fixed at Root) */}
            <div className="fixed top-0 left-0 right-0 z-50 lg:hidden">
                <div className={`absolute inset-0 bg-white transition-opacity duration-200 ease-in-out ${scrolled ? 'opacity-100 shadow-sm' : 'opacity-0'}`} />
                <div className={`relative z-10 px-6 flex justify-between items-center transition-all duration-200 ease-in-out ${scrolled ? 'py-3 text-gray-800' : 'py-5 text-white'}`}>
                    <button onClick={() => navigate('/seller/dashboard')} className={`p-2 rounded-xl scale-110 active:scale-95 transition-all ${scrolled ? 'bg-gray-100 text-gray-600' : 'bg-white/20 text-white'}`}>
                        <Icon name="ChevronLeft" size={24} />
                    </button>
                    <span className={`font-black tracking-tight flex-1 text-center transition-opacity duration-300 ${scrolled ? 'opacity-100 text-gray-800' : 'opacity-0 text-white'}`}>
                        Kasir
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/seller/transaction-history')}
                            className={`p-2 rounded-xl flex-shrink-0 active:scale-95 transition-all ${scrolled ? 'bg-gray-100 text-gray-600' : 'bg-white/20 text-white'}`}
                        >
                            <Icon name="History" size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop UI */}
            <div className="hidden lg:block">
                <header className="bg-white rounded-[2rem] p-8 shadow-sm border border-indigo-50/50 mb-8 flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Icon name="ShoppingCart" size={20} /></div>
                            <span className="text-indigo-600 font-bold text-sm uppercase tracking-wider">Transaksi Baru</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Kasir Penjual</h1>
                        <p className="text-gray-500 font-medium">Pilih menu untuk memulai transaksi penjualan.</p>
                    </div>
                    <div className="relative z-10 flex gap-4">
                        <button
                            onClick={() => navigate('/seller/transaction-history')}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Icon name="History" size={18} />
                            Riwayat
                        </button>
                    </div>
                </header>
            </div>

            {/* Mobile UI */}
            <div className="lg:hidden">
                <header className="bg-gradient-to-br from-indigo-800 via-blue-700 to-indigo-600 pt-24 pb-10 px-6 rounded-b-[2.5rem] shadow-xl relative z-10 mb-6">
                    <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] pointer-events-none">
                        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-100 font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">Transaksi Baru</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Kasir Penjual</h1>
                        <p className="text-blue-100/80 font-medium mt-1">Pilih menu untuk memulai transaksi.</p>
                    </div>
                </header>
            </div>

            <main className="px-6 space-y-6">
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
                        {filteredItems.map((item) => {
                            const itemQty = cart.filter(cit => cit.id === item.id).reduce((sum, cit) => sum + cit.quantity, 0);

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white rounded-2xl md:rounded-[2rem] p-3 md:p-5 border shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group relative overflow-hidden cursor-pointer ${itemQty > 0 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}
                                    onClick={() => handleItemClick(item)}
                                >
                                    {/* Quantity Badge */}
                                    {itemQty > 0 && (
                                        <div className="absolute top-2 left-2 md:top-3 md:left-3 z-[20] bg-blue-600 text-white min-w-[28px] md:min-w-[32px] h-7 md:h-8 px-1.5 md:px-2 flex items-center justify-center rounded-full text-xs md:text-sm font-black shadow-lg shadow-blue-300 animate-scale-up">
                                            {itemQty}
                                        </div>
                                    )}

                                    {/* Featured Badge - Kanan Atas Card */}
                                    {item.is_featured === 1 && (
                                        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 bg-gradient-to-r from-orange-500 to-orange-600 text-white w-7 h-7 md:w-8 md:h-8 rounded-full text-sm md:text-base font-black shadow-lg shadow-orange-200 flex items-center justify-center">
                                            ⭐
                                        </div>
                                    )}

                                    <div className="flex gap-3 md:gap-5">
                                        {/* Image */}
                                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 border md:border-2 border-gray-100 shadow-sm relative">
                                            {/* Discount Badge - Overlay pada Foto */}
                                            {item.discount > 0 && (
                                                <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] md:text-xs font-black px-2 md:px-2.5 py-0.5 md:py-1 rounded-full shadow-lg shadow-red-900/50 uppercase z-10">
                                                    -{item.discount > 1 ? Math.round(item.discount) : Math.round(item.discount * 100)}%
                                                </div>
                                            )}

                                            {item.image_url ? (
                                                <img
                                                    src={`${apiUrl}${item.image_url}`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                    <Icon name="Image" size={28} className="md:w-9 md:h-9" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col justify-between py-0.5 md:py-1 overflow-hidden min-h-[80px] md:min-h-[112px]">
                                            <div className="space-y-0.5 md:space-y-1.5">
                                                <span className="text-[10px] md:text-[11px] font-black text-indigo-500 uppercase tracking-widest block truncate">
                                                    {item.category}
                                                </span>
                                                <h3 className="font-black text-gray-900 text-base md:text-xl leading-tight line-clamp-2">
                                                    {item.name}
                                                </h3>
                                                <p className="text-blue-600 font-black text-lg md:text-2xl tracking-tight">
                                                    {formatCurrency(item.price)}
                                                </p>
                                            </div>

                                            {/* Stock Info */}
                                            <div className="flex items-center gap-1.5 md:gap-2 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-100">
                                                <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${item.stock > 0 ? 'bg-green-500 shadow-sm shadow-green-200' : 'bg-red-500 shadow-sm shadow-red-200'}`} />
                                                <span className="text-[10px] md:text-xs font-bold text-gray-500">
                                                    Stok: <span className={`font-black ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.stock}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
                <div className="fixed inset-0 z-[999] flex items-end lg:items-center justify-center p-0 lg:p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsCartOpen(false)}
                    ></div>
                    <div
                        className="relative z-10 bg-white w-full max-w-xl rounded-t-[2.5rem] lg:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-slide-up lg:animate-scale-up max-h-[92vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
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

                        <div className="px-6 py-4 bg-white border-t border-gray-100 space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-gray-500 font-bold text-sm">Total Pembayaran</span>
                                <span className="text-xl font-black text-blue-700 tracking-tight">{formatCurrency(totalCartPrice)}</span>
                            </div>
                            <button
                                onClick={handleProcessPayment}
                                disabled={isProcessing}
                                className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-blue-200 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {isProcessing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Icon name="CheckCircle" size={16} />
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
