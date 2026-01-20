import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';

const CustomerOrderConfirmation = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    const fetchOrders = useCallback(async (pageNum = 1) => {
        try {
            if (pageNum === 1) setIsLoading(true);
            const response = await authFetch(`${API_URL}/api/orders?page=${pageNum}&limit=5`);
            const result = await response.json();

            if (result.message === 'success') {
                const newOrders = result.data;
                if (pageNum === 1) {
                    setOrders(newOrders);
                } else {
                    setOrders(prev => [...prev, ...newOrders]);
                }

                // Assuming default limit is 5 as requested in fetch
                setHasMore(newOrders.length === 5); // If we got full limit, assume more might exist (simple check)
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
    }, [fetchOrders]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return { label: 'Menunggu', icon: 'Clock', color: 'text-yellow-500', bg: 'bg-yellow-50' };
            case 'accepted':
                return { label: 'Diterima', icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' };
            case 'rejected':
                return { label: 'Ditolak', icon: 'XCircle', color: 'text-red-600', bg: 'bg-red-50' };
            default:
                return { label: status, icon: 'Info', color: 'text-gray-500', bg: 'bg-gray-50' };
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
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 pb-16 text-white rounded-b-[2.5rem] shadow-lg mb-[-40px]">
                <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => navigate('/customer/dashboard')} className="p-2 bg-white/20 rounded-full">
                        <Icon name="ArrowLeft" className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-2xl font-black tracking-tight">Status Pesanan</h1>
                </div>
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
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 font-bold">{item.name} <span className="text-gray-400 ml-1">x{item.quantity}</span></span>
                                            <span className="text-gray-900 font-black">{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">METODE PEMBAYARAN</p>
                                        <p className="text-sm font-black uppercase text-gray-800">{order.payment_method || 'TUNAI'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pembayaran</p>
                                        <p className="text-lg font-black text-green-600">{formatCurrency(order.total)}</p>
                                    </div>
                                    <button
                                        className="bg-gray-50 text-gray-400 p-3 rounded-xl active:scale-90 transition-all ml-4"
                                        onClick={() => fetchOrders()}
                                    >
                                        <Icon name="RefreshCw" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}

                {orders.length > 0 && hasMore && (
                    <button
                        onClick={() => fetchOrders(page + 1)}
                        className="w-full py-4 bg-white rounded-2xl text-green-600 font-bold text-sm shadow-sm border border-green-100 hover:bg-green-50 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        <span>Muat Lebih Banyak</span>
                        <Icon name="ChevronDown" className="w-4 h-4" />
                    </button>
                )}

                {/* Info Card */}
                <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-100 overflow-hidden relative">
                    <div className="relative z-10">
                        <h3 className="font-black text-lg mb-1">Butuh Bantuan?</h3>
                        <p className="text-blue-100 text-xs font-medium opacity-90 leading-relaxed mb-4">Jika pesanan Anda mengalami kendala, hubungi layanan pelanggan kami.</p>
                        <button className="bg-white text-blue-600 font-black py-2 px-6 rounded-full text-xs shadow-lg active:scale-95 transition-all">
                            Hubungi Kami
                        </button>
                    </div>
                    <Icon name="HelpCircle" className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-500/30 rotate-12" />
                </div>
            </div>
        </div>
    );
};

export default CustomerOrderConfirmation;
