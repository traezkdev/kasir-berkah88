import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useChat } from '../../../contexts/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';

const DesktopOrderConfirmation = () => {
    const navigate = useNavigate();
    const { setActiveChat, setActiveOrder } = useChat();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
    const [submittingRating, setSubmittingRating] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || '';

    const fetchOrders = useCallback(async (pageNum = 1) => {
        try {
            if (pageNum === 1) setIsLoading(true);
            const response = await authFetch(`${API_URL}/api/orders?page=${pageNum}&limit=12`);
            const result = await response.json();

            if (result.message === 'success') {
                const newOrders = result.data;
                if (pageNum === 1) {
                    setOrders(newOrders);
                } else {
                    setOrders(prev => [...prev, ...newOrders]);
                }
                setHasMore(newOrders.length === 12);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchOrders(1);
        const socket = io(API_URL, { transports: ['websocket'], forceNew: true });
        socket.on('order_update', () => fetchOrders(1));
        const pollInterval = setInterval(() => fetchOrders(1), 30000);
        return () => { socket.disconnect(); clearInterval(pollInterval); };
    }, [fetchOrders, API_URL]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending': return { label: 'MENUNGGU', icon: 'Clock', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
            case 'accepted': return { label: 'DIPROSES', icon: 'ShoppingBag', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
            case 'ready': return { label: 'SIAP AMBIL', icon: 'Zap', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' };
            case 'completed': return { label: 'SELESAI', icon: 'CheckCircle2', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
            case 'rejected': return { label: 'DITOLAK', icon: 'XCircle', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
            case 'cancelled': return { label: 'BATAL', icon: 'Slash', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' };
            default: return { label: status, icon: 'Info', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
        }
    };

    const handleChatWithSeller = async (order = null) => {
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

    return (
        <div className="min-h-screen bg-transparent pb-12 overflow-x-hidden">
            <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                {/* Header Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-green-600 font-black text-xs uppercase tracking-[0.3em]">
                            <Icon name="Activity" size={16} />
                            Real-time Tracking
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Riwayat <span className="text-green-600">Pesanan</span></h1>
                        <p className="text-slate-400 font-medium">Lacak status pesanan Anda dan beri ulasan untuk setiap rasa yang Anda nikmati.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => fetchOrders(1)} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl text-slate-400 hover:text-green-600 transition-all border border-transparent hover:border-green-100">
                            <Icon name="RefreshCw" className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={() => navigate('/customer/menu')} className="bg-green-600 text-white font-black px-8 py-5 rounded-[2rem] shadow-xl shadow-green-600/20 hover:bg-green-700 active:scale-95 transition-all flex items-center gap-3">
                            <Icon name="Plus" className="w-5 h-5" />
                            PESAN LAGI
                        </button>
                    </div>
                </div>

                {/* Orders Content */}
                {isLoading && page === 1 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse shadow-sm" />)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-24 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icon name="ShoppingBag" size={48} className="text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Belum ada pesanan</h3>
                        <p className="text-slate-400 mt-2 font-medium">Mulailah petualangan rasa Anda dengan memesan menu favorit kami.</p>
                        <button onClick={() => navigate('/customer/menu')} className="mt-8 bg-green-600 text-white font-black px-10 py-4 rounded-2xl shadow-lg">Buka Menu</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {orders.map((order) => {
                            const status = getStatusInfo(order.status);
                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);

                            return (
                                <motion.div
                                    layout
                                    key={order.id}
                                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-8 hover:shadow-xl transition-all group"
                                >
                                    {/* Status Icon Large */}
                                    <div className={`${status.bg} ${status.color} w-24 h-24 rounded-[2rem] border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center shrink-0`}>
                                        <Icon name={status.icon} size={40} />
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID #{order.id}</span>
                                            <span className={`${status.bg} ${status.color} ${status.border} border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter`}>{status.label}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white truncate">
                                            {items.map(i => i.name).join(', ')}
                                        </h4>
                                        <div className="flex items-center gap-6 mt-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu</span>
                                                <span className="font-bold text-slate-600 dark:text-slate-300">{new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Metode</span>
                                                <span className="font-black text-slate-800 dark:text-slate-200 uppercase">{order.payment_method || 'Tunai'}</span>
                                            </div>
                                            <div className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</span>
                                                <span className="text-xl font-black text-green-600 tracking-tight">{formatCurrency(order.total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Vertical */}
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/customer/order-details/${order.id}`)}
                                                className="flex-1 px-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 dark:border-slate-800 text-center"
                                            >
                                                Lihat Detail
                                            </button>
                                            <button
                                                onClick={() => handleChatWithSeller(order)}
                                                className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100"
                                            >
                                                <Icon name="MessageCircle" size={20} />
                                            </button>
                                        </div>
                                        {order.status === 'completed' && (
                                            <button
                                                onClick={() => { setSelectedOrderForRating(order); setIsRatingModalOpen(true); }}
                                                className="w-full py-4 bg-amber-500 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Icon name="Star" className="w-4 h-4 fill-current" />
                                                BERI ULASAN
                                            </button>
                                        )}
                                        {order.status === 'pending' && (
                                            <button className="w-full py-4 bg-red-50 text-red-500 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl border border-red-100 hover:bg-red-100 transition-all">
                                                BATALKAN
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                        {hasMore && (
                            <button
                                onClick={() => fetchOrders(page + 1)}
                                className="w-full py-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-slate-400 font-black text-xs uppercase tracking-[0.3em] hover:text-green-600 transition-all"
                            >
                                Muat Pesanan Lainnya
                            </button>
                        )}
                    </div>
                )}
            </main>

            {/* Rating Modal Desktop Placeholder - For completeness, usually reusable or separate */}
            {isRatingModalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                        <button onClick={() => setIsRatingModalOpen(false)} className="absolute top-8 right-8 p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                            <Icon name="X" />
                        </button>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Beri Ulasan</h2>
                        <p className="text-slate-400 mb-8 font-medium">Bantu kami meningkatkan kualitas dengan memberikan rating untuk pesanan #{selectedOrderForRating?.id}.</p>

                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                            {(typeof selectedOrderForRating?.items === 'string' ? JSON.parse(selectedOrderForRating.items) : (selectedOrderForRating?.items || [])).map((item, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-lg text-slate-800 dark:text-white">{item.name}</h4>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(s => <Icon key={s} name="Star" className="w-8 h-8 text-slate-200 cursor-pointer hover:text-amber-400 transition-colors" />)}
                                        </div>
                                    </div>
                                    <textarea className="w-full bg-white dark:bg-slate-800 border-transparent focus:border-amber-400 rounded-3xl p-6 text-sm font-bold min-h-[100px]" placeholder="Bagaimana rasanya? (Opsional)..." />
                                    <button className="w-full bg-amber-500 text-white font-black py-4 rounded-2xl shadow-lg">Kirim Ulasan Item Ini</button>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setIsRatingModalOpen(false)} className="w-full mt-10 bg-slate-900 dark:bg-slate-800 text-white font-black py-5 rounded-[2rem]">SELESAI</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesktopOrderConfirmation;
