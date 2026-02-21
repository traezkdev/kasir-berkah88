import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import authFetch from '../../../utils/authFetch';
import { useCart } from '../context/CartContext';
import Icon from '../../../components/AppIcon';
import qrisImage from '../../../assets/images/qris.jpeg';
import { motion, AnimatePresence } from 'framer-motion';

const DesktopCart = () => {
    const navigate = useNavigate();
    const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [userData, setUserData] = useState(null);
    const [usePoints, setUsePoints] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [customerPhone, setCustomerPhone] = useState(localStorage.getItem('last_customer_phone') || '');
    const [customerAddress, setCustomerAddress] = useState(localStorage.getItem('last_customer_address') || '');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [showQRIS, setShowQRIS] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await authFetch(`${API_URL}/api/user/profile`);
            const result = await response.json();
            if (result.message === 'success') {
                const data = result.data;
                setUserData(data);
                if (!customerPhone && data.phone) setCustomerPhone(data.phone);
                if (!customerAddress && data.address) setCustomerAddress(data.address);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const validatePromo = async () => {
        if (!promoCode.trim()) return;
        setIsValidatingPromo(true);
        try {
            const response = await authFetch(`${API_URL}/api/promos/validate`, {
                method: 'POST',
                body: JSON.stringify({ code: promoCode.trim(), total: cartTotal })
            });
            const result = await response.json();
            if (result.data) {
                setAppliedPromo(result.data);
                toast.success('Promo berhasil diterapkan!');
            } else {
                toast.error(result.error || "Gagal menerapkan promo");
                setAppliedPromo(null);
            }
        } catch (error) {
            toast.error("Gagal menerapkan promo");
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
        if (!customerPhone || !customerAddress) {
            toast.error("Nomor WhatsApp dan Alamat wajib diisi!");
            return;
        }

        setIsCheckingOut(true);
        try {
            const payload = {
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    options: item.selectedOptions || []
                })),
                payment_method: paymentMethod === 'cash' ? 'Tunai' : 'Transfer',
                notes: notes,
                customer_address: customerAddress,
                customer_phone: customerPhone,
                customer_name: userData?.username || 'Pelanggan',
                pointsUsed: usePoints ? pointsToUse : 0,
                promoId: appliedPromo ? appliedPromo.id : null
            };

            const response = await authFetch(`${API_URL}/api/orders`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                localStorage.setItem('last_customer_phone', customerPhone);
                localStorage.setItem('last_customer_address', customerAddress);
                toast.success('Pesanan berhasil dibuat!');
                clearCart();
                if (paymentMethod === 'cash') navigate('/customer/order-confirmation');
                else setShowQRIS(true);
            }
        } catch (error) {
            toast.error("Gagal membuat pesanan");
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent pb-20 overflow-x-hidden">
            <main className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-12 gap-12">
                {/* Left Side: Cart Items */}
                <div className="col-span-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Keranjang <span className="text-green-600">Belanja</span></h1>
                            <p className="text-slate-400 font-medium font-sans">Anda memiliki {cart.length} item unik dalam keranjang rasa Anda.</p>
                        </div>
                        {cart.length > 0 && (
                            <button onClick={() => window.confirm('Kosongkan keranjang?') && clearCart()} className="px-6 py-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900">
                                <Icon name="Trash2" size={16} />
                                Kosongkan
                            </button>
                        )}
                    </div>

                    {cart.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-24 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                            <Icon name="ShoppingBag" size={80} className="text-slate-100 dark:text-slate-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest leading-none mb-2">Keranjang Masih Kosong</h3>
                            <p className="text-slate-400 font-medium mb-8">Mulailah petualangan rasa dengan memilih menu favorit Anda.</p>
                            <button onClick={() => navigate('/customer/menu')} className="bg-green-600 text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-green-600/20 active:scale-95 transition-all">Lihat Semua Menu</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <motion.div layout key={item.cartId || item.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-6 group hover:shadow-xl transition-all">
                                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] overflow-hidden shrink-0">
                                        {item.image_url ? (
                                            <img src={`${API_URL}${item.image_url}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Icon name="Image" size={32} /></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-xl text-slate-800 dark:text-white mb-1">{item.name}</h4>
                                        {item.selectedOptions?.length > 0 && (
                                            <p className="text-xs text-slate-400 font-medium mb-3">{item.selectedOptions.map(o => o.name).join(', ')}</p>
                                        )}
                                        <span className="text-green-600 font-black text-lg tracking-tight">{formatCurrency(item.price)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <button onClick={() => updateQuantity(item.cartId || item.id, -1)} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all active:scale-90"><Icon name="Minus" size={16} /></button>
                                        <span className="w-8 text-center font-black text-slate-800 dark:text-white">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.cartId || item.id, 1)} className="w-10 h-10 rounded-xl bg-green-600 shadow-lg shadow-green-600/20 flex items-center justify-center text-white active:scale-90 transition-all"><Icon name="Plus" size={16} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.cartId || item.id)} className="p-4 text-slate-300 hover:text-rose-500 transition-all group-hover:bg-rose-50 dark:group-hover:bg-rose-950 rounded-2xl"><Icon name="Trash2" size={20} /></button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Checkout Summary */}
                <div className="col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 sticky top-32">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Ringkasan <span className="text-green-600">Checkout</span></h2>

                        {/* Delivery Fields */}
                        <div className="space-y-6 mb-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">WhatsApp Pelanggan</label>
                                <div className="relative">
                                    <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08xxxxxxxx" className="w-full bg-slate-50 dark:bg-slate-800 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 px-6 text-slate-800 dark:text-white font-bold transition-all outline-none" />
                                    <Icon name="Phone" className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Alamat Lengkap</label>
                                <div className="relative">
                                    <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Blok, No Rumah, RT/RW..." className="w-full bg-slate-50 dark:bg-slate-800 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl p-6 text-slate-800 dark:text-white font-bold transition-all outline-none min-h-[100px] resize-none" />
                                    <Icon name="MapPin" className="absolute right-6 bottom-6 w-5 h-5 text-slate-300" />
                                </div>
                            </div>
                        </div>

                        {/* Payments & Promos */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600"><Icon name="Coins" size={20} /></div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800 dark:text-white">Gunakan Poin</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Tersedia: {formatCurrency(points)}</p>
                                    </div>
                                </div>
                                <button onClick={() => setUsePoints(!usePoints)} className={`w-12 h-6 rounded-full transition-all relative ${usePoints ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${usePoints ? 'right-1' : 'left-1'}`} /></button>
                            </div>
                            <div className="h-[1px] bg-slate-100 dark:bg-slate-700" />
                            <div className="space-y-1">
                                <div className="relative">
                                    <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="KODE PROMO" className="w-full bg-white dark:bg-slate-900 border-transparent focus:border-green-500 rounded-xl py-3 px-4 text-xs font-black tracking-widest uppercase outline-none" />
                                    <button onClick={validatePromo} className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white text-[10px] font-black px-4 py-1.5 rounded-lg">CEK</button>
                                </div>
                                {appliedPromo && <p className="text-[10px] text-green-600 font-black uppercase text-center mt-1">✓ {appliedPromo.title} AKTIF!</p>}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="space-y-3 mb-10">
                            <div className="flex justify-between text-slate-400 font-bold text-sm"><span>Subtotal</span><span>{formatCurrency(cartTotal)}</span></div>
                            {pointsToUse > 0 && <div className="flex justify-between text-rose-500 font-bold text-sm"><span>Poin Digunakan</span><span>-{formatCurrency(pointsToUse)}</span></div>}
                            {promoDiscountAmount > 0 && <div className="flex justify-between text-rose-500 font-bold text-sm"><span>Diskon Promo</span><span>-{formatCurrency(promoDiscountAmount)}</span></div>}
                            <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-4" />
                            <div className="flex justify-between items-end">
                                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Bayar</p><p className="text-4xl font-black text-green-600 tracking-tighter leading-none">{formatCurrency(finalTotal)}</p></div>
                                <div className="bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-green-100 dark:border-green-800">Hemat {formatCurrency(pointsToUse + promoDiscountAmount)}</div>
                            </div>
                        </div>

                        {/* Payment Method Desktop */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <button onClick={() => setPaymentMethod('cash')} className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${paymentMethod === 'cash' ? 'border-green-600 bg-green-50 dark:bg-green-950/30 text-green-600' : 'border-slate-50 dark:border-slate-800 text-slate-400'}`}>TUNAI / COD</button>
                            <button onClick={() => setPaymentMethod('transfer')} className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${paymentMethod === 'transfer' ? 'border-green-600 bg-green-50 dark:bg-green-950/30 text-green-600' : 'border-slate-50 dark:border-slate-800 text-slate-400'}`}>QRIS / TRANSFER</button>
                        </div>

                        <button onClick={handleCheckout} disabled={isCheckingOut || cart.length === 0} className="w-full bg-slate-900 dark:bg-green-600 text-white font-black py-6 rounded-[2.5rem] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-lg uppercase tracking-widest flex items-center justify-center gap-4 disabled:opacity-50 disabled:scale-100">
                            {isCheckingOut ? <Icon name="Loader2" className="animate-spin" /> : <Icon name="ArrowRightCircle" size={24} />}
                            BUAT PESANAN
                        </button>
                    </div>
                </div>
            </main>

            {/* QRIS Modal Desktop */}
            <AnimatePresence>
                {showQRIS && (
                    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-950 rounded-[4rem] p-16 shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full text-center relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-green-600 via-emerald-400 to-green-600" />
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Menunggu <span className="text-green-600">Terbayar</span></h2>
                            <p className="text-slate-400 font-medium mb-12">Lakukan pembayaran menggunakan QRIS di bawah ini untuk mengonfirmasi pesanan Anda.</p>

                            <div className="flex gap-12 items-center justify-center">
                                <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl relative group">
                                    <img src={qrisImage} alt="QRIS" className="w-64 h-auto rounded-2xl" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors cursor-pointer rounded-[3rem]" />
                                </div>
                                <div className="text-left space-y-6 max-w-xs">
                                    <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-3xl border border-green-100 dark:border-green-800">
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Total Nominal</p>
                                        <p className="text-3xl font-black text-green-700 dark:text-green-400 tracking-tighter">{formatCurrency(finalTotal)}</p>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed italic">✓ Link pembayaran otomatis dikirim ke WhatsApp Anda.<br />✓ Pesanan diproses setelah status terkonfirmasi.</p>
                                    <button onClick={() => navigate('/customer/order-confirmation')} className="w-full bg-slate-900 dark:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl hover:-translate-y-1 transition-all">SAYA SUDAH BAYAR</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DesktopCart;
