import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useChat } from '../../../contexts/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';

const DesktopOrderDetails = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const { setActiveChat, setActiveOrder } = useChat();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;

    const fetchOrderDetail = async () => {
        try {
            const response = await authFetch(`${API_URL}/api/orders/${orderId}`);
            const result = await response.json();
            if (result.data) setOrder(result.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetail();
        const interval = setInterval(fetchOrderDetail, 15000);
        return () => clearInterval(interval);
    }, [orderId]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending': return { label: 'MENUNGGU KONFIRMASI', color: 'text-amber-500', bg: 'bg-amber-50', icon: 'Clock', desc: 'Pesanan Anda sedang dalam antrean untuk dikonfirmasi oleh staf kami.' };
            case 'accepted': return { label: 'SEDANG DIPROSES', color: 'text-blue-500', bg: 'bg-blue-50', icon: 'ShoppingBag', desc: 'Pesanan Anda telah diterima dan sedang dalam tahap penyiapan rasa terbaik.' };
            case 'ready': return { label: 'PESANAN SIAP AMBIL', color: 'text-green-500', bg: 'bg-green-50', icon: 'Zap', desc: 'Yeay! Pesanan sudah siap. Silakan ambil di outlet Berkah88 sekarang.' };
            case 'completed': return { label: 'PESANAN SELESAI', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'CheckCircle2', desc: 'Nikmati hidangan Anda! Terima kasih telah mempercayakan rasa pada kami.' };
            case 'rejected': return { label: 'PESANAN DITOLAK', color: 'text-red-500', bg: 'bg-red-50', icon: 'XCircle', desc: 'Maaf, karena kendala teknis kami tidak dapat memproses pesanan ini.' };
            case 'cancelled': return { label: 'DIBATALKAN', color: 'text-slate-400', bg: 'bg-slate-50', icon: 'Slash', desc: 'Pesanan ini telah dibatalkan atas permintaan Anda atau sistem.' };
            default: return { label: 'MEMPROSES...', color: 'text-slate-400', bg: 'bg-slate-50', icon: 'RefreshCw', desc: 'Sedang memperbarui informasi pesanan Anda...' };
        }
    };

    const handleChatWithSeller = async () => {
        try {
            const res = await authFetch(`${API_URL}/api/messages/contacts`);
            const data = await res.json();
            if (data.data && data.data.length > 0) {
                const staff = data.data.find(c => c.role === 'admin') || data.data[0];
                setActiveChat({ user_id: staff.id, ...staff });
                if (order) setActiveOrder(order);
                navigate('/customer/chat');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-transparent flex items-center justify-center">
            <Icon name="Loader2" className="w-12 h-12 text-green-600 animate-spin" />
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center">
            <Icon name="Inbox" size={80} className="text-slate-100 mb-6" />
            <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Detail Tidak Ditemukan</h2>
            <button onClick={() => navigate('/customer/order-confirmation')} className="mt-8 bg-green-600 text-white px-8 py-3 rounded-xl font-black">KEMBALI KE RIWAYAT</button>
        </div>
    );

    const sInfo = getStatusInfo(order.status);

    return (
        <div className="min-h-screen bg-transparent pb-20">
            <main className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-12 gap-12">
                {/* Left Side: Order Status & Details */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* Header Action */}
                    <header className="flex items-center gap-6">
                        <button onClick={() => navigate('/customer/order-confirmation')} className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-green-600 transition-all active:scale-90">
                            <Icon name="ArrowLeft" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Detail <span className="text-green-600">Pesanan</span></h1>
                            <p className="text-slate-400 font-medium font-sans">ID Transaksi Berkah: #{order.id}</p>
                        </div>
                    </header>

                    {/* Status Hero Desktop */}
                    <div className={`${sInfo.bg} rounded-[3rem] p-12 border border-white dark:border-slate-800 shadow-sm flex items-center gap-10 overflow-hidden relative group`}>
                        <div className={`${sInfo.color} w-32 h-32 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex items-center justify-center shrink-0`}>
                            <Icon name={sInfo.icon} size={64} className={order.status === 'pending' || order.status === 'accepted' ? 'animate-pulse' : ''} />
                        </div>
                        <div className="flex-1 space-y-3 relative z-10">
                            <h2 className={`text-3xl font-black tracking-tight ${sInfo.color}`}>{sInfo.label}</h2>
                            <p className="text-slate-500 font-medium text-lg max-w-xl">{sInfo.desc}</p>
                            <div className="flex items-center gap-6 pt-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Icon name="Clock" size={14} /> {new Date(order.created_at).toLocaleString('id-ID')}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Icon name="CreditCard" size={14} /> {order.payment_method === 'cash' ? 'BAYAR TUNAI / COD' : 'PEMBAYARAN CASHLESS'}</span>
                            </div>
                        </div>
                        {/* Decoration */}
                        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/40 dark:bg-black/5 rounded-full" />
                    </div>

                    {/* Order Items Table-style */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 px-2 flex items-center gap-3">
                            <Icon name="ShoppingBag" className="text-green-600" />
                            Rincian Item Pesanan
                        </h3>
                        <div className="space-y-4">
                            {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center font-black text-green-600 text-lg shadow-sm">{item.quantity}x</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 dark:text-white">{item.name}</h4>
                                        {item.options?.length > 0 && <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{item.options.map(o => o.name).join(', ')}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{formatCurrency(item.price * item.quantity)}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Item</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Total & Actions */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl text-white space-y-8 sticky top-32">
                        <h2 className="text-2xl font-black tracking-tight">Capaian <span className="text-green-500">Nilai</span></h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-slate-400 font-bold text-sm">
                                <span>Subtotal Pesanan</span>
                                <span>{formatCurrency((parseFloat(order.total) || 0) + (parseFloat(order.points_used) || 0) + (parseFloat(order.promo_discount) || 0))}</span>
                            </div>
                            {order.points_used > 0 && <div className="flex justify-between items-center text-rose-400 font-bold text-sm"><span>Potongan Poin</span><span>-{formatCurrency(order.points_used)}</span></div>}
                            {order.promo_discount > 0 && <div className="flex justify-between items-center text-rose-400 font-bold text-sm"><span>Diskon Promo</span><span>-{formatCurrency(order.promo_discount)}</span></div>}
                            <div className="h-px bg-white/10 my-6" />
                            <div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Total Dibayarkan</p>
                                <p className="text-5xl font-black text-green-500 tracking-tighter">{formatCurrency(order.total)}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6">
                            <button onClick={handleChatWithSeller} className="w-full bg-white text-slate-900 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-green-500 hover:text-white active:scale-95 shadow-xl shadow-green-600/10 uppercase tracking-widest text-xs">
                                <Icon name="MessageCircle" />
                                Hubungi Penjual
                            </button>
                            {order.status === 'pending' && (
                                <button onClick={() => setShowCancelModal(true)} className="w-full bg-white/10 hover:bg-rose-600 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all text-white active:scale-95 text-xs uppercase tracking-widest">
                                    <Icon name="XCircle" />
                                    Batalkan Pesanan
                                </button>
                            )}
                        </div>

                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-1">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Alamat Pengiriman</p>
                            <p className="text-xs font-medium text-slate-300 leading-relaxed italic">"{order.customer_address || 'Tidak ada alamat tercatat'}"</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Cancel Modal Desktop */}
            <AnimatePresence>
                {showCancelModal && (
                    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-950 rounded-[3rem] p-16 max-w-xl w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800">
                            <div className="w-24 h-24 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500">
                                <Icon name="XCircle" size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Batalkan Pesanan Berkah?</h2>
                            <p className="text-slate-400 font-medium mb-12 leading-relaxed px-4">Kami menyayangkan jika Anda harus membatalkan ini. Apakah ada yang bisa kami bantu sebelum pesanan ini dibatalkan secara permanen?</p>
                            <div className="flex flex-col gap-4">
                                <button onClick={async () => {
                                    try {
                                        await authFetch(`${API_URL}/api/orders/${orderId}/status`, {
                                            method: 'PUT',
                                            body: JSON.stringify({ status: "cancelled" })
                                        });
                                        fetchOrderDetail(); setShowCancelModal(false);
                                        toast.success("Pesanan dibatalkan");
                                    } catch (e) { toast.error("Gagal membatalkan"); }
                                }} className="w-full py-6 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all uppercase tracking-widest text-xs">YA, BATALKAN PESANAN</button>
                                <button onClick={() => setShowCancelModal(false)} className="w-full py-6 bg-slate-50 dark:bg-slate-800 text-slate-400 font-black rounded-2xl transition-all uppercase tracking-widest text-xs">TIDAK, SAYA INGIN LANJUT</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DesktopOrderDetails;
