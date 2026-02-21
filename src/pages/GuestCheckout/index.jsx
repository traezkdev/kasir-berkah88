import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPlus, FiMinus, FiShoppingCart, FiAlertCircle, FiTrash2, FiChevronLeft,
    FiHome, FiCheckCircle, FiSearch, FiPackage, FiZap, FiMapPin, FiUser, FiInfo, FiArrowLeft
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

            // Detailed WhatsApp Message following Mobile version
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

    const categories = useMemo(() => ['Semua', ...new Set(menuItems.map(item => item.category))].filter(Boolean), [menuItems]);

    const filteredMenu = useMemo(() => {
        let filtered = menuItems;
        if (activeCategory !== 'Semua') {
            filtered = filtered.filter(item => item.category === activeCategory);
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
                <p className="text-emerald-600 font-bold">Menyiapkan Menu Berkah...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header: Following Mobile Design */}
            <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 pt-5 pb-10 rounded-b-[2rem] text-white shadow-lg sticky top-0 z-50">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-all">
                            <FiArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-black leading-tight">Pesan Delivery</h1>
                            <p className="text-emerald-100 text-xs font-semibold">Tamu Berkah 88</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FiShoppingCart size={24} />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-emerald-600">
                                    {totalItems}
                                </span>
                            )}
                        </div>
                        <DarkModeToggle />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group max-w-2xl mx-auto mb-6">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Cari menu favoritmu..."
                        className="w-full bg-white rounded-2xl py-3 pl-11 pr-4 text-gray-800 text-sm font-bold shadow-sm border-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Categories Scroll */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat
                                ? 'bg-white text-emerald-600 shadow-md'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Main Content Area */}
                    <div className="lg:col-span-12">
                        {/* Delivery Info Section: Match Mobile's ListHeaderComponent */}
                        <div className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <FiInfo className="text-emerald-600" size={18} />
                                <h3 className="font-extrabold text-[#1E293B]">Informasi Pengiriman</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="relative">
                                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Nama Lengkap Anda"
                                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-[#1E293B] focus:border-emerald-500 focus:ring-0 transition-all"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <FiMapPin className="absolute left-3.5 top-4 text-gray-400" size={18} />
                                    <textarea
                                        placeholder="Alamat Pengiriman Lengkap"
                                        rows="2"
                                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-[#1E293B] focus:border-emerald-500 focus:ring-0 transition-all resize-none"
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Validation Error */}
                        <AnimatePresence>
                            {validationError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100"
                                >
                                    <FiAlertCircle size={16} />
                                    {validationError}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Menu Categories Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-sm font-extrabold text-[#1E293B] uppercase tracking-wider">
                                {activeCategory === 'Semua' ? 'Semua Menu' : activeCategory}
                            </h2>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{filteredMenu.length} Item</span>
                        </div>

                        {/* Menu Grid: Match Mobile's 2 column numColumns */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredMenu.map(item => {
                                const qty = cart[item.id] || 0;
                                const isOutOfStock = !globalIgnoreStock && item.stock !== null && item.stock <= 0;
                                const discount = item.discount || 0;
                                const priceAfterDiscount = item.price * (1 - discount);

                                return (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all"
                                    >
                                        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                            <AppImage
                                                src={item.image_url ? `${import.meta.env.VITE_API_URL}${item.image_url}` : "/assets/images/no_image.png"}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {discount > 0 && (
                                                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg">
                                                    -{Math.round(discount * 100)}%
                                                </div>
                                            )}
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <span className="text-white text-xs font-black tracking-widest">HABIS</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3 flex flex-col flex-grow">
                                            <h4 className="font-bold text-[#1E293B] text-[13px] line-clamp-2 leading-tight h-8 mb-1">{item.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold mb-2">{item.category || 'Lainnya'}</p>

                                            <div className="mb-3">
                                                {discount > 0 && (
                                                    <p className="text-[10px] text-gray-400 line-through leading-none mb-0.5">Rp {item.price.toLocaleString('id-ID')}</p>
                                                )}
                                                <div className="flex justify-between items-end">
                                                    <p className="font-extrabold text-emerald-600 text-sm leading-none">
                                                        Rp {priceAfterDiscount.toLocaleString('id-ID')}
                                                    </p>
                                                    <div className="bg-[#F1F5F9] px-1.5 py-0.5 rounded-md">
                                                        <span className="text-[9px] font-bold text-[#64748B]">
                                                            Stok: {globalIgnoreStock ? '∞' : item.stock}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                {qty > 0 ? (
                                                    <div className="bg-[#ECFDF5] rounded-full p-1 flex items-center justify-between border border-[#D1FAE5]">
                                                        <button
                                                            onClick={() => handleRemoveFromCart(item)}
                                                            className="w-8 h-8 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-all"
                                                        >
                                                            <FiMinus size={14} strokeWidth={3} />
                                                        </button>
                                                        <span className="font-black text-sm text-emerald-600">{qty}</span>
                                                        <button
                                                            disabled={!globalIgnoreStock && qty >= item.stock}
                                                            onClick={() => handleAddToCart(item)}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-all ${(!globalIgnoreStock && qty >= item.stock) ? 'bg-gray-100 text-gray-300' : 'bg-white text-emerald-600'
                                                                }`}
                                                        >
                                                            <FiPlus size={14} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        disabled={isOutOfStock}
                                                        onClick={() => handleAddToCart(item)}
                                                        className={`w-full py-2.5 rounded-full font-black text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${isOutOfStock
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
                                                            }`}
                                                    >
                                                        <FiPlus size={16} strokeWidth={3} />
                                                        TAMBAH
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {filteredMenu.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <FiInfo size={48} className="text-gray-200" />
                                <p className="text-gray-400 font-bold">Menu belum tersedia</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Bar: Sticky Fixed Layout match Mobile */}
            {totalItems > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] z-[60]">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Pembayaran</p>
                                <p className="text-xl font-black text-emerald-600 leading-none">Rp {calculateTotal.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleClearCart}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <FiTrash2 size={14} />
                                    <span className="text-[10px] font-black uppercase">Hapus</span>
                                </button>
                                <div className="bg-emerald-50 px-3 py-1.5 rounded-lg">
                                    <span className="text-emerald-600 text-[10px] font-extrabold">{totalItems} Item</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-200 transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <FaWhatsapp size={20} />
                                    <span className="tracking-widest text-sm">PESAN VIA WHATSAPP</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={() => {
                    setCart({});
                    setShowClearConfirm(false);
                }}
                title="Kosongkan Keranjang"
                message="Bismillah, apakah Anda yakin ingin menghapus semua item dari keranjang?"
                confirmText="Ya, Hapus"
                cancelText="Batal"
                isDestructive={true}
            />
        </div>
    );
};

export default GuestCheckout;
