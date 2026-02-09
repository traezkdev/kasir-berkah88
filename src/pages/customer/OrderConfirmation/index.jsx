import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useChat } from '../../../contexts/ChatContext';

const CustomerOrderConfirmation = () => {
    const navigate = useNavigate();
    const { setActiveChat, setIsOpen, setActiveOrder } = useChat();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
    const [submittingRating, setSubmittingRating] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
            console.error("Error starting chat:", error);
        }
    };

    const fetchOrders = useCallback(async (pageNum = 1) => {
        try {
            if (pageNum === 1) setIsLoading(true);
            const response = await authFetch(`${API_URL}/api/orders?page=${pageNum}&limit=10`);
            const result = await response.json();

            if (result.message === 'success') {
                const newOrders = result.data;
                if (pageNum === 1) {
                    setOrders(newOrders);
                } else {
                    setOrders(prev => [...prev, ...newOrders]);
                }
                setHasMore(newOrders.length === 10);
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

        // Socket.io Realtime Implementation
        const socket = io(API_URL, {
            transports: ['websocket'],
            forceNew: true
        });

        socket.on('order_update', (data) => {
            console.log('Realtime Order Update (Customer Tracking):', data);
            fetchOrders(1);
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchOrders, API_URL]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return { label: 'Baru', icon: 'Clock', color: 'text-yellow-500', bg: 'bg-yellow-50' };
            case 'accepted':
                return { label: 'Diproses', icon: 'ShoppingBag', color: 'text-blue-500', bg: 'bg-blue-50' };
            case 'ready':
                return { label: 'Siap Diambil', icon: 'CheckCircle', color: 'text-green-500', bg: 'bg-green-50' };
            case 'rejected':
                return { label: 'Ditolak', icon: 'XCircle', color: 'text-red-500', bg: 'bg-red-50' };
            case 'cancelled':
                return { label: 'Batal', icon: 'Slash', color: 'text-gray-400', bg: 'bg-gray-50' };
            case 'completed':
                return { label: 'Selesai', icon: 'CheckCircle', color: 'text-emerald-600', bg: 'bg-emerald-50' };
            default:
                return { label: status, icon: 'Info', color: 'text-gray-500', bg: 'bg-gray-50' };
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;
        try {
            const response = await authFetch(`${API_URL}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' })
            });
            if (response.ok) {
                fetchOrders(1);
            } else {
                const error = await response.json();
                alert(error.error || "Gagal membatalkan pesanan");
            }
        } catch (error) {
            console.error("Error cancelling order:", error);
            alert("Terjadi kesalahan koneksi saat membatalkan pesanan");
        }
    };

    const handleOpenRatingModal = (order) => {
        setSelectedOrderForRating(order);
        setIsRatingModalOpen(true);
    };

    const handleSubmitRating = async (menuItemId, rating, comment) => {
        try {
            setSubmittingRating(true);
            const response = await authFetch(`${API_URL}/api/menu-reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    menu_item_id: menuItemId,
                    order_id: selectedOrderForRating.id,
                    rating,
                    comment
                })
            });
            return response.ok;
        } catch (error) {
            console.error("Error submitting rating:", error);
            return false;
        } finally {
            setSubmittingRating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 pb-24">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold">Memuat pesanan Anda...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* Fixed Header */}
            <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-8 ${scrolled ? 'bg-white shadow-md py-5' : 'bg-transparent py-8'}`}>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/customer/dashboard')} className={`p-2 rounded-full transition-colors ${scrolled ? 'bg-gray-100' : 'bg-white/20'}`}>
                        <Icon name="ArrowLeft" className={`w-5 h-5 ${scrolled ? 'text-gray-800' : 'text-white'}`} />
                    </button>
                    <h1 className={`text-2xl font-black tracking-tight transition-colors ${scrolled ? 'text-gray-800' : 'text-white'}`}>Status Pesanan</h1>
                </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 pt-20 pb-16 text-white rounded-b-[2.5rem] shadow-lg mb-[-40px]">
                <p className="text-green-100 text-xs font-medium opacity-80 uppercase tracking-widest ml-12">Lacak Pesanan Anda Secara Real-time</p>
            </div>

            <div className="px-5 space-y-4 relative z-10">
                {orders.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-10 text-center shadow-xl shadow-gray-200/50 border border-white">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icon name="ShoppingBag" className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">Belum ada pesanan</h3>
                        <p className="text-gray-400 text-sm font-medium mb-8">Anda belum melakukan pemesanan apapun hari ini.</p>
                        <button
                            onClick={() => navigate('/customer/menu')}
                            className="bg-green-600 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-green-100 active:scale-95 transition-all"
                        >
                            Pesan Sekarang
                        </button>
                    </div>
                ) : (
                    orders.map((order) => {
                        const status = getStatusInfo(order.status);
                        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

                        return (
                            <div key={order.id} className="bg-white rounded-[2rem] p-5 shadow-xl shadow-gray-200/40 border border-white group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`${status.bg} ${status.color} p-3 rounded-2xl`}>
                                            <Icon name={status.icon} className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ID PESANAN #{order.id}</p>
                                            <h4 className={`text-sm font-black uppercase ${status.color}`}>{status.label}</h4>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 font-bold">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    {items.slice(0, 2).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 font-bold">{item.name} <span className="text-gray-400 ml-1">x{item.quantity}</span></span>
                                            <span className="text-gray-900 font-black">{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                    {items.length > 2 && (
                                        <p className="text-[11px] text-gray-400 italic mt-2">+{items.length - 2} item lainnya</p>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-dashed border-gray-100 space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">METODE PEMBAYARAN</p>
                                            <p className="text-sm font-black uppercase text-gray-800">{order.payment_method || 'TUNAI'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                                            <p className="text-lg font-black text-green-600">{formatCurrency(order.total)}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {order.status === 'pending' && (
                                            <button
                                                className="flex-1 bg-red-50 text-red-500 font-extrabold py-3 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-wider border border-red-100"
                                                onClick={() => handleCancelOrder(order.id)}
                                            >
                                                Batalkan
                                            </button>
                                        )}
                                        <button
                                            className={`${order.status === 'pending' ? 'px-4' : 'flex-1'} bg-blue-50 text-blue-500 py-3 rounded-2xl active:scale-90 transition-all border border-blue-100 flex items-center justify-center gap-2`}
                                            onClick={() => handleChatWithSeller(order)}
                                        >
                                            <Icon name="MessageCircle" className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Chat</span>
                                        </button>
                                        <button
                                            className="bg-gray-50 text-gray-400 p-3 rounded-2xl active:scale-90 transition-all border border-gray-100"
                                            onClick={() => fetchOrders(page)}
                                        >
                                            <Icon name="RefreshCw" className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/customer/order-details/${order.id}`)}
                                            className={`${order.status === 'completed' ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 bg-green-50 text-green-600 py-3 rounded-2xl active:scale-95 transition-all border border-green-100`}
                                        >
                                            <span className="text-[11px] font-black uppercase tracking-wider">Detail</span>
                                            <Icon name="ChevronRight" className="w-3.5 h-3.5" />
                                        </button>

                                        {order.status === 'completed' && (
                                            <button
                                                onClick={() => handleOpenRatingModal(order)}
                                                className="flex-1 flex items-center justify-center gap-2 bg-amber-50 text-amber-600 py-3 rounded-2xl active:scale-95 transition-all border border-amber-100 shadow-sm shadow-amber-100/30 animate-in zoom-in-95 duration-500"
                                            >
                                                <Icon name="Star" className="w-3.5 h-3.5 fill-current" />
                                                <span className="text-[11px] font-black uppercase tracking-wider">Beri Rating</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {orders.length > 0 && hasMore && (
                    <button
                        onClick={() => fetchOrders(page + 1)}
                        className="w-full py-4 bg-white rounded-2xl text-green-600 font-bold text-sm"
                    >
                        Muat Lebih Banyak
                    </button>
                )}

                <div className="bg-blue-600 rounded-[2rem] p-6 text-white overflow-hidden relative">
                    <div className="relative z-10">
                        <h3 className="font-black text-lg mb-1">Butuh Bantuan?</h3>
                        <p className="text-blue-100 text-xs font-medium opacity-90 leading-relaxed mb-4">Jika pesanan Anda mengalami kendala, hubungi layanan pelanggan kami melalui chat.</p>
                        <button
                            onClick={() => handleChatWithSeller()}
                            className="bg-white text-blue-600 font-black py-2 px-6 rounded-full text-xs"
                        >
                            Chat Sekarang
                        </button>
                    </div>
                </div>
            </div>

            {isRatingModalOpen && selectedOrderForRating && (
                <RatingModal
                    order={selectedOrderForRating}
                    onClose={() => setIsRatingModalOpen(false)}
                    onSubmit={handleSubmitRating}
                    submitting={submittingRating}
                />
            )}
        </div>
    );
};

const RatingModal = ({ order, onClose, onSubmit, submitting }) => {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const [ratedItems, setRatedItems] = useState({});
    const [loadingExisting, setLoadingExisting] = useState(true);

    useEffect(() => {
        const fetchExistingReviews = async () => {
            try {
                const itemIds = items.map(i => i.id).join(',');
                const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/my-reviews?menu_item_ids=${itemIds}`);
                const result = await res.json();

                if (result.message === 'success' && result.data.length > 0) {
                    const existingData = {};
                    result.data.forEach(rev => {
                        existingData[rev.menu_item_id] = {
                            rating: rev.rating,
                            comment: rev.comment || '',
                            submitted: true,
                            isEdit: true
                        };
                    });
                    setRatedItems(prev => ({ ...prev, ...existingData }));
                }
            } catch (err) {
                console.error("Error fetching existing reviews:", err);
            } finally {
                setLoadingExisting(false);
            }
        };
        fetchExistingReviews();
    }, [order.id]);

    const handleRate = (itemId, rating) => {
        setRatedItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], rating, submitted: false, isEdit: prev[itemId]?.isEdit || false }
        }));
    };

    const handleComment = (itemId, comment) => {
        setRatedItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], comment, submitted: false, isEdit: prev[itemId]?.isEdit || false }
        }));
    };

    const submitItem = async (item) => {
        const itemRating = ratedItems[item.id];
        if (!itemRating || !itemRating.rating) {
            alert("Harap pilih bintang terlebih dahulu!");
            return;
        }

        const success = await onSubmit(item.id, itemRating.rating, itemRating.comment || '');
        if (success) {
            setRatedItems(prev => ({
                ...prev,
                [item.id]: { ...prev[item.id], submitted: true }
            }));
        } else {
            alert("Gagal mengirim ulasan.");
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 h-full">
            <div className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Beri Ulasan</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pesanan #{order.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
                        <Icon name="X" className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-1 pb-4 custom-scrollbar">
                    {loadingExisting ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memuat Ulasan...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {items.map((item, idx) => {
                                const state = ratedItems[item.id] || { rating: 0, comment: '', submitted: false };
                                return (
                                    <div key={idx} className={`space-y-4 pb-6 border-b border-gray-50 last:border-0 transition-all ${state.submitted ? 'bg-green-50/30 rounded-[2rem] p-4 -mx-2' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                                                <Icon name="Utensils" className="w-6 h-6 text-gray-300" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-extrabold text-gray-800 text-sm">{item.name}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    {state.submitted ? 'Ulasan Terkirim' : 'Pilih Bintang & Komentar'}
                                                </p>
                                            </div>
                                            {state.submitted && (
                                                <div className="flex items-center gap-1 text-green-600 font-black text-[10px] uppercase bg-white px-3 py-1.5 rounded-full shadow-sm">
                                                    <Icon name="Check" className="w-3 h-3" />
                                                    <span>Terkirim</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-center gap-3 py-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    onClick={() => handleRate(item.id, star)}
                                                    className={`transition-all duration-300 ${state.rating >= star ? 'scale-125' : 'grayscale opacity-30 hover:opacity-100'}`}
                                                >
                                                    <Icon name="Star" className={`w-8 h-8 ${state.rating >= star ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            placeholder="Tulis ulasan Anda (Opsional)..."
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-2xl p-4 text-xs text-gray-700 font-bold transition-all outline-none min-h-[80px]"
                                            value={state.comment}
                                            onChange={(e) => handleComment(item.id, e.target.value)}
                                        />
                                        {!state.submitted && (
                                            <button
                                                onClick={() => submitItem(item)}
                                                disabled={!state.rating || submitting}
                                                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-200/50 transition-all active:scale-95 text-xs uppercase tracking-widest"
                                            >
                                                {submitting ? 'Mengirim...' : (state.isEdit ? 'Simpan Perubahan' : 'Kirim Ulasan')}
                                            </button>
                                        )}
                                        {state.submitted && (
                                            <button
                                                onClick={() => setRatedItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], submitted: false } }))}
                                                className="w-full bg-gray-100 text-gray-600 font-black py-3 rounded-xl transition-all active:scale-95 text-[10px] uppercase tracking-widest"
                                            >
                                                Edit Ulasan
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-gray-900 text-white font-black py-4 rounded-2xl"
                >
                    Selesai
                </button>
            </div>
        </div>
    );
};

export default CustomerOrderConfirmation;
