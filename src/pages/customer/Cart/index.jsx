import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    ChevronLeft,
    Trash2,
    Minus,
    Plus,
    X,
    Ticket,
    Coins,
    MapPin,
    Phone,
    StickyNote,
    Check,
    CreditCard,
    QrCode
} from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import qrisImage from '../../../assets/images/qris.jpeg';

const CartPage = () => {
    const navigate = useNavigate();
    const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [userData, setUserData] = useState(null);
    const [usePoints, setUsePoints] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [showQRIS, setShowQRIS] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);
    const [showQRPreview, setShowQRPreview] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchProfile();
        // Load some data from localStorage to simulate AsyncStorage
        const savedPhone = localStorage.getItem('last_customer_phone');
        const savedAddress = localStorage.getItem('last_customer_address');
        if (savedPhone) setCustomerPhone(savedPhone);
        if (savedAddress) setCustomerAddress(savedAddress);
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoadingProfile(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.message === 'success') {
                const data = response.data.data;
                setUserData(data);
                // Only set if not already set by localStorage
                if (!customerPhone && data.phone) setCustomerPhone(data.phone);
                if (!customerAddress && data.address) setCustomerAddress(data.address);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const validatePromo = async () => {
        if (!promoCode.trim()) return;
        setIsValidatingPromo(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/promos/validate`,
                { code: promoCode.trim(), total: cartTotal },
                { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
            );

            if (response.data.data) {
                setAppliedPromo(response.data.data);
                toast.success('Promo berhasil diterapkan!');
            }
        } catch (error) {
            console.error("Promo error:", error);
            const errMsg = error.response?.data?.error || "Gagal menerapkan promo";
            toast.error(errMsg);
            setAppliedPromo(null);
        } finally {
            setIsValidatingPromo(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const points = userData?.points || 0;
    const pointsToUse = usePoints ? Math.min(points, cartTotal) : 0;

    let promoDiscountAmount = 0;
    if (appliedPromo) {
        if (appliedPromo.discount_type === 'percentage') {
            promoDiscountAmount = (cartTotal * parseFloat(appliedPromo.discount_value)) / 100;
        } else {
            promoDiscountAmount = parseFloat(appliedPromo.discount_value);
        }
    }

    const finalTotal = Math.max(0, cartTotal - pointsToUse - promoDiscountAmount);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!customerPhone) {
            toast.error("Nomor WhatsApp wajib diisi!");
            return;
        }
        if (!customerAddress) {
            toast.error("Alamat pengiriman wajib diisi!");
            return;
        }

        setIsCheckingOut(true);
        const token = localStorage.getItem('token');

        try {
            const payload = {
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    options: item.selectedOptions || []
                })),
                payment_method: paymentMethod === 'cash' ? 'Tunai' : (paymentMethod === 'transfer' ? 'Transfer' : paymentMethod),
                notes: notes,
                customer_address: customerAddress,
                customer_phone: customerPhone,
                customer_name: userData?.username || userData?.name || 'Pelanggan',
                pointsUsed: usePoints ? pointsToUse : 0,
                promoId: appliedPromo ? appliedPromo.id : null
            };

            const response = await axios.post(`${API_URL}/api/orders`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.message) {
                // Save phone and address for next time
                localStorage.setItem('last_customer_phone', customerPhone);
                localStorage.setItem('last_customer_address', customerAddress);

                toast.success('Pesanan berhasil dibuat!');
                clearCart();

                if (paymentMethod === 'cash') {
                    navigate('/customer/order-confirmation');
                } else {
                    setShowQRIS(true);
                }
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            toast.error(error.response?.data?.error || "Gagal membuat pesanan");
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-0 font-sans max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
            {/* Header Fixed - Sync with App Version */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 fixed top-0 left-0 right-0 w-full max-w-md mx-auto z-[100] flex items-center justify-between backdrop-blur-md bg-white/90">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center active:scale-95 transition-all text-[#1E293B]"
                >
                    <ChevronLeft size={20} />
                </button>

                <h1 className="font-bold text-[#1E293B] text-base">Keranjang Saya</h1>

                <button
                    onClick={() => {
                        if (cart.length > 0 && window.confirm('Hapus semua item di keranjang?')) {
                            clearCart();
                        }
                    }}
                    disabled={cart.length === 0}
                    className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all text-[#94A3B8] disabled:opacity-30"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Spacer for Fixed Header */}
            <div className="h-[64px]"></div>

            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center pt-20">
                    <div className="w-24 h-24 bg-white rounded-3xl mb-8 flex items-center justify-center shadow-sm border border-gray-50">
                        <Trash2 className="w-12 h-12 text-gray-200" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1E293B] mb-2">Keranjang masih kosong</h2>
                    <p className="text-[#64748B] mb-8 max-w-xs text-sm">Yuk cari makanan kesukaanmu dan mulai buat pesanan!</p>
                    <button
                        onClick={() => navigate('/customer/menu')}
                        className="bg-green-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95 w-full"
                    >
                        Mulai Pesan
                    </button>
                </div>
            ) : (
                <div className="pb-0">
                    {/* Cart Items */}
                    <div className="px-4 py-4 divide-y divide-gray-100">
                        {cart.map((item) => {
                            const priceAfterDiscount = item.discount > 0 ? Math.round(parseFloat(item.price) * (1 - (item.discount / 100))) : parseFloat(item.price);
                            const optionsTotal = (item.selectedOptions || []).reduce((acc, opt) => acc + (parseFloat(opt.price_adjustment) || 0), 0);
                            const unitPrice = priceAfterDiscount + optionsTotal;
                            const uniqueId = item.cartId || item.id;

                            return (
                                <div key={uniqueId} className="py-4 flex gap-4 bg-white px-4 rounded-2xl border border-gray-50 shadow-sm mb-3">
                                    <div className="w-20 h-20 bg-[#F1F5F9] rounded-2xl shrink-0 overflow-hidden border border-gray-100">
                                        {item.image_url ? (
                                            <img src={`${API_URL}${item.image_url}`} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <X size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-[#1E293B] text-sm line-clamp-1">{item.name}</h4>
                                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                    <p className="text-[10px] text-[#64748B] font-medium leading-tight mt-0.5">
                                                        {item.selectedOptions.map(o => o.name).join(', ')}
                                                    </p>
                                                )}
                                                <p className="text-sm font-bold text-green-600 mt-1">{formatCurrency(unitPrice)}</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(uniqueId)}
                                                className="text-[#94A3B8] hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex justify-end items-center gap-3">
                                            <button
                                                onClick={() => updateQuantity(uniqueId, -1)}
                                                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-[#1E293B] active:bg-[#F1F5F9] transition-all"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(uniqueId, 1)}
                                                className="w-8 h-8 rounded-xl bg-green-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-sm shadow-green-100"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Points Section */}
                    <div className="mx-4 mt-2 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center shadow-sm">
                                    <Coins className="text-yellow-600" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-[#1E293B]">Gunakan Poin</p>
                                    <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider">Saldo: {formatCurrency(points).replace('Rp', '').trim()} Poin</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setUsePoints(!usePoints)}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative shrink-0 ${usePoints ? 'bg-green-600 shadow-lg shadow-green-200' : 'bg-[#E2E8F0]'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${usePoints ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Promo Code Section */}
                    <div className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Ticket className="text-green-600" size={18} />
                            <p className="text-sm font-bold text-[#1E293B]">Kode Promo</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    placeholder="Masukkan kode promo"
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600 transition-all font-medium"
                                />
                                {appliedPromo && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                                        <Check size={16} />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={validatePromo}
                                disabled={isValidatingPromo || !promoCode.trim()}
                                className="bg-green-600 text-white px-5 rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-green-100"
                            >
                                {isValidatingPromo ? '...' : 'Cek'}
                            </button>
                        </div>
                        {appliedPromo && (
                            <div className="mt-3 flex items-center justify-between text-xs bg-green-50 border border-green-100 p-3 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-700 font-bold">{appliedPromo.title}</span>
                                </div>
                                <button
                                    onClick={() => setAppliedPromo(null)}
                                    className="text-red-500 font-extrabold uppercase tracking-tighter hover:bg-white px-2 py-1 rounded-lg transition-all"
                                >
                                    Hapus
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Delivery Form */}
                    <div className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="text-green-600" size={18} />
                            <p className="text-sm font-bold text-[#1E293B]">Informasi Pengiriman</p>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Nomor WhatsApp</label>
                            </div>
                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="0812xxxxxxxx"
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600 transition-all font-medium"
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Alamat Pengiriman</label>
                            </div>
                            <textarea
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                placeholder="Jalan, Blok, No Rumah, dll..."
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600 transition-all font-medium h-24 resize-none"
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <StickyNote className="w-3.5 h-3.5 text-[#64748B]" />
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Catatan Tambahan</label>
                            </div>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Contoh: Sambal dipisah, dll"
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-[#1E293B] mb-4">Pilih Pembayaran</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 ${paymentMethod === 'cash' ? 'border-green-600 bg-green-50' : 'border-[#F1F5F9] text-[#64748B] hover:border-gray-200'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'cash' ? 'bg-green-600 text-white' : 'bg-[#F1F5F9]'}`}>
                                    <CreditCard size={20} />
                                </div>
                                <span className={`text-xs font-bold ${paymentMethod === 'cash' ? 'text-green-700' : 'text-[#64748B]'}`}>Tunai</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('qris')}
                                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 ${paymentMethod === 'qris' ? 'border-green-600 bg-green-50' : 'border-[#F1F5F9] text-[#64748B] hover:border-gray-200'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'qris' ? 'bg-green-600 text-white' : 'bg-[#F1F5F9]'}`}>
                                    <QrCode size={20} />
                                </div>
                                <span className={`text-xs font-bold ${paymentMethod === 'qris' ? 'text-green-700' : 'text-[#64748B]'}`}>QRIS</span>
                            </button>
                        </div>
                    </div>

                    {/* QRIS Display Section (Visible when QRIS is selected) */}
                    {paymentMethod === 'qris' && (
                        <div className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col items-center">
                                <p className="text-sm font-bold text-[#1E293B] mb-4 w-full">Scan WhatsApp QRIS</p>
                                <div className="relative group">
                                    <div
                                        onClick={() => setShowQRPreview(true)}
                                        className="w-48 h-64 bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 p-2 cursor-pointer transition-transform active:scale-95"
                                    >
                                        <img src={qrisImage} alt="QRIS Berkah88" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-all">
                                            <QrCode className="text-white opacity-0 group-hover:opacity-100" size={32} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowQRPreview(true)}
                                        className="absolute -bottom-2 -right-2 bg-green-600 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-all"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="mt-6 w-full flex gap-3">
                                    <a
                                        href={qrisImage}
                                        download="QRIS_Berkah88.jpeg"
                                        className="flex-1 bg-[#F1F5F9] text-[#1E293B] py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    >
                                        <QrCode size={14} />
                                        Unduh QRIS
                                    </a>
                                </div>
                                <p className="mt-3 text-[10px] text-[#64748B] text-center font-medium">Klik gambar untuk memperbesar</p>
                            </div>
                        </div>
                    )}

                    {/* Payment Summary Details */}
                    <div className="mx-4 mt-4 mb-24 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                        <h3 className="text-sm font-bold text-[#1E293B] mb-4">Ringkasan Pembayaran</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#64748B] font-medium">Subtotal</span>
                                <span className="text-[#1E293B] font-bold">{formatCurrency(cartTotal)}</span>
                            </div>

                            {pointsToUse > 0 && (
                                <div className="flex justify-between items-center text-sm animate-in slide-in-from-right-4 duration-300">
                                    <span className="text-[#64748B] font-medium flex items-center gap-1.5">
                                        <Coins size={14} className="text-yellow-600" /> Penggunaan Poin
                                    </span>
                                    <span className="text-red-500 font-bold">-{formatCurrency(pointsToUse)}</span>
                                </div>
                            )}

                            {promoDiscountAmount > 0 && (
                                <div className="flex justify-between items-center text-sm animate-in slide-in-from-right-4 duration-300">
                                    <span className="text-[#64748B] font-medium flex items-center gap-1.5">
                                        <Ticket size={14} className="text-green-600" /> Diskon Promo
                                    </span>
                                    <span className="text-red-500 font-bold">-{formatCurrency(promoDiscountAmount)}</span>
                                </div>
                            )}

                            <div className="pt-4 border-t border-dashed border-[#E2E8F0] flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-widest mb-1">Total Akhir</p>
                                    <p className="text-2xl font-black text-green-600 tracking-tighter leading-none">{formatCurrency(finalTotal)}</p>
                                </div>
                                <div className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-100">
                                    Hemat {formatCurrency(pointsToUse + promoDiscountAmount)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Button Fixed Bottom */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 max-w-md mx-auto z-50">
                        <button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-base shadow-xl shadow-green-200 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {isCheckingOut ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Buat Pesanan Sekarang</span>
                                    <Check size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* QRIS Modal */}
            {showQRIS && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQRIS(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-green-600 p-6 text-white text-center">
                            <h3 className="text-xl font-bold">Pembayaran QRIS</h3>
                            <p className="text-sm text-green-100 opacity-80">Scan untuk menyelesaikan pesanan</p>
                        </div>
                        <div className="p-8 flex flex-col items-center">
                            <div className="w-64 h-64 bg-gray-50 rounded-3xl p-4 border-2 border-dashed border-gray-200 flex items-center justify-center">
                                {/* Simulated QR Code */}
                                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center relative shadow-inner">
                                    <QrCode size={180} strokeWidth={1.5} className="text-gray-800" />
                                    <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                                        <div className="bg-gray-800 text-white text-[10px] font-bold px-3 py-1 rounded-full border-4 border-white">
                                            BERKAH88
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 w-full space-y-3">
                                <div className="flex justify-between items-center px-4 py-3 bg-[#F8FAFC] rounded-2xl">
                                    <span className="text-xs font-bold text-[#64748B]">Total Bayar</span>
                                    <span className="text-lg font-black text-green-600">{formatCurrency(finalTotal)}</span>
                                </div>
                                <button
                                    onClick={() => navigate('/customer/order-confirmation')}
                                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-green-100"
                                >
                                    Saya Sudah Bayar
                                </button>
                                <button
                                    onClick={() => setShowQRIS(false)}
                                    className="w-full text-gray-400 text-sm font-bold py-2"
                                >
                                    Nanti Saja
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QRIS Full Preview Modal */}
            {showQRPreview && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowQRPreview(false)}></div>
                    <div className="relative w-full max-w-sm animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setShowQRPreview(false)}
                            className="absolute -top-12 right-0 text-white/70 hover:text-white p-2"
                        >
                            <X size={28} />
                        </button>
                        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                            <img src={qrisImage} alt="QRIS Full" className="w-full h-auto" />
                            <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                                <a
                                    href={qrisImage}
                                    download="QRIS_Berkah88.jpeg"
                                    className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all"
                                >
                                    Simpan ke Galeri
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
