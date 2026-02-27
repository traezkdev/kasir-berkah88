import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPlus, FiMinus, FiShoppingCart, FiAlertCircle, FiTrash2, FiChevronLeft,
    FiHome, FiCheckCircle, FiSearch, FiPackage, FiZap, FiMapPin, FiUser, FiInfo, FiArrowLeft, FiShoppingBag
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa6';
import AppImage from '../../components/AppImage';
import Icon from '../../components/AppIcon';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const GuestCheckout = () => {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [globalIgnoreStock, setGlobalIgnoreStock] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        const savedCustomerName = localStorage.getItem('guest_customer_name');
        const savedCustomerAddress = localStorage.getItem('guest_customer_address');
        if (savedCustomerName) setCustomerName(savedCustomerName);
        if (savedCustomerAddress) setCustomerAddress(savedCustomerAddress);

        const token = localStorage.getItem('token');
        if (token) setIsLoggedIn(true);

        fetchInitialData();
    }, []);

    // Auto-save logic with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('guest_customer_name', customerName);
            localStorage.setItem('guest_customer_address', customerAddress);
        }, 1000);
        return () => clearTimeout(timer);
    }, [customerName, customerAddress]);

    const fetchInitialData = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || '';
            const [menuRes, settingsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/guest/menu-items`),
                fetch(`${API_BASE_URL}/api/restaurant-settings`)
            ]);

            if (!menuRes.ok) throw new Error(`Gagal memuat menu. Status: ${menuRes.status}`);

            const menuData = await menuRes.json();
            setMenuItems(menuData.data);

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                if (settingsData.message === 'success') {
                    setGlobalIgnoreStock(!!settingsData.data.ignore_stock);
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (item) => {
        setCart(prev => {
            const currentQty = prev[item.id] || 0;
            if (!globalIgnoreStock && item.stock !== null && currentQty >= item.stock) {
                alert(`Maaf, stok ${item.name} sudah tidak mencukupi.`);
                return prev;
            }
            return { ...prev, [item.id]: currentQty + 1 };
        });
    };

    const handleRemoveFromCart = (item) => {
        setCart(prev => {
            const newQuantity = (prev[item.id] || 0) - 1;
            if (newQuantity <= 0) {
                const newCart = { ...prev };
                delete newCart[item.id];
                return newCart;
            }
            return { ...prev, [item.id]: newQuantity };
        });
    };

    const handleClearCart = () => {
        setShowClearConfirm(true);
    };

    const calculateTotal = useMemo(() => {
        return Object.entries(cart).reduce((total, [itemId, quantity]) => {
            const item = menuItems.find(m => m.id.toString() === itemId.toString());
            if (!item) return total;
            const discountedPrice = item.price * (1 - (item.discount || 0));
            return total + (discountedPrice * quantity);
        }, 0);
    }, [cart, menuItems]);

    const totalItems = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

    const handleCheckout = async () => {
        if (totalItems === 0) {
            setValidationError('Keranjang belanja Anda kosong!');
            return;
        }
        if (!customerName.trim() || !customerAddress.trim()) {
            setValidationError('Mohon isi Nama dan Alamat Anda.');
            return;
        }

        setValidationError('');
        setIsSubmitting(true);

        const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
            const item = menuItems.find(m => m.id.toString() === itemId.toString());
            return item ? { id: item.id, name: item.name, price: item.price, quantity, discount: item.discount } : null;
        }).filter(Boolean);

        const orderData = {
            customer_name: customerName,
            customer_address: customerAddress,
            items: orderItems,
            total: calculateTotal,
        };

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) throw new Error('Gagal mengirim pesanan. Silakan coba lagi.');

            // Detailed WhatsApp Message
            let msg = `*Pesan Baru (Guest Checkout)*\n\n`;
            msg += `👤 *Nama:* ${customerName}\n`;
            msg += `📍 *Alamat:* ${customerAddress}\n`;
            msg += `-----------------------------------\n`;
            msg += "*Daftar Pesanan:*\n";

            orderItems.forEach(item => {
                const discountPct = (item.discount || 0) * 100;
                const finalPrice = item.price * (1 - (item.discount || 0));
                const itemTotal = finalPrice * item.quantity;

                msg += `- ${item.quantity}x ${item.name}`;
                if (discountPct > 0) msg += ` (Disc ${discountPct.toFixed(0)}%)`;
                msg += ` (Rp ${itemTotal.toLocaleString('id-ID')})\n`;
            });

            msg += `-----------------------------------\n`;
            msg += `💰 *Total Akhir: Rp ${calculateTotal.toLocaleString('id-ID')}*\n\n`;
            msg += "Mohon segera diproses ya, terima kasih! 🙏";

            const waNumber = "6285864875536";
            window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');

            // Clear cart after success
            setCart({});
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = useMemo(() => {
        const unique = ['Semua', ...new Set(menuItems.map(item => item.category?.trim().toLowerCase()))].filter(Boolean);
        return unique.map(cat => {
            if (cat === 'semua') return 'Semua';
            // Mencari casing original dari menuItems agar tampilannya bagus
            const original = menuItems.find(m => m.category?.toLowerCase() === cat)?.category;
            return original || cat.charAt(0).toUpperCase() + cat.slice(1);
        });
    }, [menuItems]);

    const filteredMenu = useMemo(() => {
        let filtered = menuItems;
        if (activeCategory !== 'Semua') {
            filtered = filtered.filter(item => item.category?.toLowerCase() === activeCategory.toLowerCase());
        }
        if (searchTerm) {
            filtered = filtered.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return filtered;
    }, [menuItems, activeCategory, searchTerm]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
                <div className="w-12 h-12 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <p className="text-emerald-600 font-bold tracking-widest text-xs uppercase">Menyiapkan Menu Berkah...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
            {/* Header: Desktop specific (Split view friendly) */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[60] transition-colors">
                <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                            <FiArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight uppercase">Pesan Delivery</h1>
                            <p className="text-emerald-600 dark:text-emerald-400 text-xs font-black tracking-[0.2em] uppercase">Tamu Berkah 88</p>
                        </div>
                    </div>

                    <div className="flex-grow max-w-xl mx-12 hidden md:block">
                        <div className="relative group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Cari menu favoritmu di sini..."
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-gray-800 dark:text-white text-sm font-bold focus:bg-white dark:focus:bg-gray-800 focus:border-emerald-500/30 focus:outline-none transition-all placeholder:text-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <DarkModeToggle />
                        <div className="relative p-2 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer lg:hidden">
                            <FiShoppingCart size={24} />
                            {totalItems > 0 && (
                                <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                                    {totalItems}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-4 lg:px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT PANEL: Menu Catalog */}
                    <div className="flex-grow lg:w-[65%]">
                        {/* Sticky Categories on Left Panel Top */}
                        <div className="sticky top-20 z-40 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md py-4 mb-8 -mx-4 px-4">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-widest uppercase whitespace-nowrap transition-all border-2 ${activeCategory === cat
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-none'
                                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800 hover:border-emerald-500'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredMenu.map(item => {
                                    const qty = cart[item.id] || 0;
                                    const isOutOfStock = !globalIgnoreStock && item.stock !== null && item.stock <= 0;
                                    const discount = item.discount || 0;
                                    const priceAfterDiscount = item.price * (1 - discount);

                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            key={item.id}
                                            className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300"
                                        >
                                            <div className="aspect-[4/3] bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
                                                <AppImage
                                                    src={item.image_url ? `${import.meta.env.VITE_API_URL}${item.image_url}` : "/assets/images/no_image.png"}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                {discount > 0 && (
                                                    <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-lg uppercase tracking-tight">
                                                        Hemat {Math.round(discount * 100)}%
                                                    </div>
                                                )}
                                                {isOutOfStock && (
                                                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center">
                                                        <span className="text-white text-[10px] font-black tracking-[0.3em] uppercase bg-gray-900/80 px-4 py-2 rounded-xl">Habis</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-5 flex flex-col flex-grow">
                                                <div className="mb-4">
                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest block mb-1">{item.category || 'Berkah 88'}</span>
                                                    <h4 className="font-black text-gray-900 dark:text-white text-base line-clamp-2 leading-tight h-10 uppercase tracking-tight">{item.name}</h4>
                                                </div>

                                                <div className="mb-6">
                                                    {discount > 0 && (
                                                        <span className="text-xs text-gray-400 line-through block mb-0.5">Rp {item.price.toLocaleString('id-ID')}</span>
                                                    )}
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">
                                                            Rp {priceAfterDiscount.toLocaleString('id-ID')}
                                                        </span>
                                                        <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                                                            Stok: {globalIgnoreStock ? '∞' : item.stock}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-2">
                                                    {qty > 0 ? (
                                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-[1.2rem] p-1.5 flex items-center justify-between border border-emerald-100 dark:border-emerald-800 shadow-inner">
                                                            <button
                                                                onClick={() => handleRemoveFromCart(item)}
                                                                className="w-10 h-10 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all"
                                                            >
                                                                <FiMinus size={18} strokeWidth={3} />
                                                            </button>
                                                            <span className="font-black text-base text-emerald-600 dark:text-emerald-400">{qty}</span>
                                                            <button
                                                                disabled={!globalIgnoreStock && qty >= item.stock}
                                                                onClick={() => handleAddToCart(item)}
                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all ${(!globalIgnoreStock && qty >= item.stock) ? 'bg-gray-100 dark:bg-gray-800 text-gray-300' : 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400'
                                                                    }`}
                                                            >
                                                                <FiPlus size={18} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            disabled={isOutOfStock}
                                                            onClick={() => handleAddToCart(item)}
                                                            className={`w-full py-4 rounded-[1.2rem] font-black text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 uppercase ${isOutOfStock
                                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                                                : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-0.5'
                                                                }`}
                                                        >
                                                            <FiPlus size={20} strokeWidth={3} />
                                                            Tambah
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {filteredMenu.length === 0 && (
                            <div className="py-32 flex flex-col items-center gap-6 bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-300">
                                    <FiPackage size={40} />
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-900 dark:text-white font-black text-xl uppercase tracking-tighter">Menu Belum Tersedia</p>
                                    <p className="text-gray-400 font-medium">Hapus filter atau cari dengan kata kunci lain</p>
                                </div>
                                <button onClick={() => { setSearchTerm(''); setActiveCategory('Semua'); }} className="text-emerald-600 font-bold uppercase text-xs tracking-widest hover:underline">Reset Semua Filter</button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL: Checkout Sidebar */}
                    <div className="lg:w-[35%] lg:sticky lg:top-28 lg:h-[calc(100vh-140px)]">
                        <div className="h-full overflow-y-auto no-scrollbar space-y-6 pr-2">

                            {/* Delivery Info Card */}
                            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                                            <FiMapPin size={20} />
                                        </div>
                                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Detail Pengiriman</h3>
                                    </div>
                                    <AnimatePresence>
                                        {(customerName && customerAddress) && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                <FiCheckCircle size={20} className="text-emerald-500" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Nama Penerima</label>
                                        <div className="relative group">
                                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Nama Lengkap Anda"
                                                className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-emerald-500/30 transition-all outline-none"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Alamat Lengkap</label>
                                        <div className="relative group">
                                            <FiMapPin className="absolute left-4 top-5 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                            <textarea
                                                placeholder="Tuliskan alamat pengiriman secara detail..."
                                                rows="3"
                                                className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-emerald-500/30 transition-all outline-none resize-none"
                                                value={customerAddress}
                                                onChange={(e) => setCustomerAddress(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cart Summary Card */}
                            <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                            <FiShoppingBag size={20} />
                                        </div>
                                        <h3 className="font-black uppercase tracking-tight">Ringkasan Pesanan</h3>
                                    </div>
                                    {totalItems > 0 && (
                                        <button onClick={handleClearCart} className="p-2 text-white/40 hover:text-red-400 transition-colors" title="Kosongkan">
                                            <FiTrash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-60 overflow-y-auto no-scrollbar mb-8 space-y-4">
                                    {totalItems === 0 ? (
                                        <div className="py-6 text-center text-white/30 italic text-sm font-medium">Keranjang masih kosong</div>
                                    ) : (
                                        Object.entries(cart).map(([itemId, quantity]) => {
                                            const item = menuItems.find(m => m.id.toString() === itemId.toString());
                                            if (!item) return null;
                                            const finalPrice = item.price * (1 - (item.discount || 0));
                                            return (
                                                <div key={itemId} className="flex justify-between items-center group">
                                                    <div className="flex-grow">
                                                        <p className="font-bold text-sm tracking-tight line-clamp-1">{item.name}</p>
                                                        <p className="text-[10px] text-white/40 font-black tracking-widest uppercase">{quantity}x @ Rp {finalPrice.toLocaleString('id-ID')}</p>
                                                    </div>
                                                    <p className="font-black text-emerald-400 text-sm ml-4">
                                                        Rp {(finalPrice * quantity).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40 text-xs font-black uppercase tracking-widest">Total Produk</span>
                                        <span className="font-bold">{totalItems} Item</span>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-white/10 pt-4">
                                        <div>
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Pembayaran</p>
                                            <p className="text-3xl font-black text-emerald-400 leading-none tracking-tighter">
                                                Rp {calculateTotal.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={isSubmitting || totalItems === 0}
                                    className="w-full mt-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-emerald-900/50 transform active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group"
                                >
                                    {isSubmitting ? (
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FaWhatsapp size={22} className="group-hover:scale-110 transition-transform" />
                                            <span className="tracking-[0.2em] text-sm font-black uppercase">Konfirmasi Order</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {validationError && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-500 p-5 rounded-3xl flex items-center gap-4"
                                >
                                    <FiAlertCircle size={24} className="shrink-0" />
                                    <p className="text-xs font-black uppercase tracking-tight leading-tight">{validationError}</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Navigation Indicator (Only visible if small screens) */}
            <div className="lg:hidden h-24"></div>

            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={() => {
                    setCart({});
                    setShowClearConfirm(false);
                }}
                title="Kosongkan Keranjang"
                message="Bismillah, apakah Anda yakin ingin menghapus semua item dari keranjang?"
                confirmText="Ya, Hapus Semua"
                cancelText="Batal"
                isDestructive={true}
            />
        </div>
    );
};

export default GuestCheckout;
