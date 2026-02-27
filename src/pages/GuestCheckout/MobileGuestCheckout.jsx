import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPlus, FiMinus, FiShoppingCart, FiAlertCircle, FiTrash2,
    FiSearch, FiPackage, FiMapPin, FiUser, FiArrowLeft, FiShoppingBag, FiX
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa6';
import AppImage from '../../components/AppImage';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const MobileGuestCheckout = () => {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [globalIgnoreStock, setGlobalIgnoreStock] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showCartDrawer, setShowCartDrawer] = useState(false);

    useEffect(() => {
        const savedCustomerName = localStorage.getItem('guest_customer_name');
        const savedCustomerAddress = localStorage.getItem('guest_customer_address');
        if (savedCustomerName) setCustomerName(savedCustomerName);
        if (savedCustomerAddress) setCustomerAddress(savedCustomerAddress);

        fetchInitialData();
    }, []);

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

            if (!menuRes.ok) throw new Error(`Gagal memuat menu.`);

            const menuData = await menuRes.json();
            setMenuItems(menuData.data);

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                if (settingsData.message === 'success') {
                    setGlobalIgnoreStock(!!settingsData.data.ignore_stock);
                }
            }
        } catch (err) {
            console.error(err);
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

            if (!response.ok) throw new Error('Gagal mengirim pesanan.');

            let msg = `*Pesan Baru (Guest Checkout - Mobile)*\n\n`;
            msg += `👤 *Nama:* ${customerName}\n`;
            msg += `📍 *Alamat:* ${customerAddress}\n`;
            msg += `-----------------------------------\n`;
            msg += "*Daftar Pesanan:*\n";

            orderItems.forEach(item => {
                const finalPrice = item.price * (1 - (item.discount || 0));
                msg += `- ${item.quantity}x ${item.name} (Rp ${(finalPrice * item.quantity).toLocaleString('id-ID')})\n`;
            });

            msg += `-----------------------------------\n`;
            msg += `💰 *Total Akhir: Rp ${calculateTotal.toLocaleString('id-ID')}*\n\n`;
            msg += "Mohon segera diproses ya, terima kasih! 🙏";

            const waNumber = "6285864875536";
            window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');

            setCart({});
            setShowCartDrawer(false);
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
                <div className="w-10 h-10 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">Memuat Menu...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500 pb-24">
            {/* Mobile Sticky Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[60] px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400">
                            <FiArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Delivery</h1>
                            <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Berkah 88 Mobile</p>
                        </div>
                    </div>
                    <DarkModeToggle />
                </div>

                {/* Search Bar Mobile */}
                <div className="relative group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cari menu..."
                        className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {/* Categories Mobile */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-4 sticky top-[120px] z-50 bg-gray-50/50 dark:bg-gray-950/50 backdrop-blur-sm">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-5 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase whitespace-nowrap transition-all border-2 ${activeCategory === cat
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200 dark:shadow-none'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Menu List Mobile */}
            <main className="px-4 py-2 grid grid-cols-2 gap-3">
                {filteredMenu.map(item => {
                    const qty = cart[item.id] || 0;
                    const isOutOfStock = !globalIgnoreStock && item.stock !== null && item.stock <= 0;
                    const discount = item.discount || 0;
                    const priceAfterDiscount = item.price * (1 - discount);

                    return (
                        <div key={item.id} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                            <div className="aspect-square relative overflow-hidden">
                                <AppImage
                                    src={item.image_url ? `${import.meta.env.VITE_API_URL}${item.image_url}` : "/assets/images/no_image.png"}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                                {discount > 0 && (
                                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg uppercase">
                                        -{Math.round(discount * 100)}%
                                    </div>
                                )}
                                {isOutOfStock && (
                                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center">
                                        <span className="text-white text-[8px] font-black uppercase tracking-[0.2em] bg-gray-900/60 px-3 py-1 rounded-lg">Habis</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-3 flex flex-col flex-grow">
                                <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase leading-tight line-clamp-2 h-7 mb-1">{item.name}</h4>
                                <div className="mt-auto">
                                    <p className="text-emerald-600 dark:text-emerald-400 text-[13px] font-black">Rp {priceAfterDiscount.toLocaleString('id-ID')}</p>
                                    {discount > 0 && <p className="text-[9px] text-gray-400 line-through">Rp {item.price.toLocaleString('id-ID')}</p>}

                                    <div className="mt-3">
                                        {qty > 0 ? (
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-1 flex items-center justify-between">
                                                <button onClick={() => handleRemoveFromCart(item)} className="w-7 h-7 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm"><FiMinus size={14} /></button>
                                                <span className="text-xs font-black text-emerald-600">{qty}</span>
                                                <button onClick={() => handleAddToCart(item)} className="w-7 h-7 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm"><FiPlus size={14} /></button>
                                            </div>
                                        ) : (
                                            <button
                                                disabled={isOutOfStock}
                                                onClick={() => handleAddToCart(item)}
                                                className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 ${isOutOfStock ? 'bg-gray-100 text-gray-300' : 'bg-emerald-600 text-white'}`}
                                            >
                                                <FiPlus size={12} />Tambah
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* Floating Cart Button Mobile */}
            <AnimatePresence>
                {totalItems > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-4 right-4 z-[100]"
                    >
                        <button
                            onClick={() => setShowCartDrawer(true)}
                            className="w-full bg-gray-900 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                                    <FiShoppingBag size={22} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5">{totalItems} Item Berkah</p>
                                    <p className="font-black text-emerald-400 tracking-tight leading-none text-xl">Rp {calculateTotal.toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pr-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Checkout</span>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <FiPlus className="rotate-45" />
                                </div>
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Drawer Mobile */}
            <AnimatePresence>
                {showCartDrawer && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCartDrawer(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 rounded-t-[3rem] z-[160] max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col p-6 pb-12 shadow-2xl"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-8 shrink-0" />

                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Checkout Berkah</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setShowClearConfirm(true)} className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl" title="Kosongkan">
                                        <FiTrash2 size={20} />
                                    </button>
                                    <button onClick={() => setShowCartDrawer(false)} className="p-3 text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-2xl" title="Tutup">
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Section Detail Pengiriman */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 mb-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Penerima</label>
                                    <div className="relative">
                                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Nama Lengkap"
                                            className="w-full bg-white dark:bg-gray-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold border-none outline-none dark:text-white"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat Lengkap</label>
                                    <div className="relative">
                                        <FiMapPin className="absolute left-4 top-4 text-gray-300" size={16} />
                                        <textarea
                                            rows="2"
                                            placeholder="Alamat Detail"
                                            className="w-full bg-white dark:bg-gray-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold border-none outline-none resize-none dark:text-white"
                                            value={customerAddress}
                                            onChange={(e) => setCustomerAddress(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Ringkasan Item */}
                            <div className="space-y-4 mb-8">
                                {Object.entries(cart).map(([itemId, quantity]) => {
                                    const item = menuItems.find(m => m.id.toString() === itemId.toString());
                                    if (!item) return null;
                                    const finalPrice = item.price * (1 - (item.discount || 0));
                                    return (
                                        <div key={itemId} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-3xl">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                                                <AppImage src={item.image_url ? `${import.meta.env.VITE_API_URL}${item.image_url}` : "/assets/images/no_image.png"} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-xs font-black uppercase text-gray-900 dark:text-white leading-tight mb-1">{item.name}</p>
                                                <p className="text-[10px] font-black text-emerald-600">Rp {finalPrice.toLocaleString('id-ID')}</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-1 rounded-xl">
                                                <button onClick={() => handleRemoveFromCart(item)} className="w-6 h-6 flex items-center justify-center text-gray-400"><FiMinus size={12} /></button>
                                                <span className="text-[10px] font-black dark:text-white">{quantity}</span>
                                                <button onClick={() => handleAddToCart(item)} className="w-6 h-6 flex items-center justify-center text-gray-400"><FiPlus size={12} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {validationError && (
                                <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-tight mb-4 text-center">
                                    {validationError}
                                </div>
                            )}

                            {/* Total and Submit */}
                            <div className="mt-auto border-t border-gray-100 dark:border-gray-800 pt-6 space-y-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pembayaran</p>
                                        <p className="text-2xl font-black text-emerald-600 leading-none">Rp {calculateTotal.toLocaleString('id-ID')}</p>
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400">{totalItems} Item</p>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={isSubmitting}
                                    className="w-full bg-emerald-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FaWhatsapp size={20} />
                                            <span className="text-sm uppercase tracking-widest font-black">Konfirmasi Order</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={() => {
                    setCart({});
                    setShowClearConfirm(false);
                    setShowCartDrawer(false);
                }}
                title="Kosongkan"
                message="Hapus semua pesanan Anda?"
                confirmText="Ya, Hapus"
                cancelText="Batal"
                isDestructive={true}
            />
        </div>
    );
};

export default MobileGuestCheckout;
