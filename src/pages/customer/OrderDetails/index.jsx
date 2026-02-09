import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useChat } from '../../../contexts/ChatContext';

const CustomerOrderDetails = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const { setActiveChat, setIsOpen, setActiveOrder } = useChat();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    const fetchOrderDetail = async () => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        try {
            const response = await authFetch(`${API_URL}/api/orders/${orderId}`);
            const result = await response.json();
            if (result.data) {
                setOrder(result.data);
            }
        } catch (error) {
            console.error("Error fetching order:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetail();
        // Poll for status updates every 15 seconds
        const interval = setInterval(fetchOrderDetail, 15000);
        return () => clearInterval(interval);
    }, [orderId]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    const handleCancelOrder = () => {
        setShowCancelModal(true);
    };

    const confirmCancelOrder = async () => {
        setShowCancelModal(false);
        try {
            setLoading(true);
            const response = await authFetch(`${API_URL}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: "cancelled" })
            });
            if (response.ok) {
                alert("Pesanan berhasil dibatalkan");
                fetchOrderDetail();
            } else {
                alert("Gagal membatalkan pesanan. Silakan coba lagi.");
                setLoading(false);
            }
        } catch (error) {
            console.error("Error cancelling order:", error);
            alert("Gagal membatalkan pesanan. Silakan coba lagi.");
            setLoading(false);
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
            console.error("Error starting chat:", error);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'BARU',
                    color: '#F59E0B',
                    bg: '#FFFBEB',
                    icon: 'Clock',
                    desc: 'Pesanan Anda sedang dikirim ke penjual. Mohon tunggu sebentar ya.'
                };
            case 'accepted':
                return {
                    label: 'SEDANG DIPROSES',
                    color: '#138FEA',
                    bg: '#EFF6FF',
                    icon: 'ShoppingBag',
                    desc: 'Yeay! Pesanan Anda telah diterima dan sedang disiapkan.'
                };
            case 'ready':
                return {
                    label: 'SIAP DIAMBIL',
                    color: '#10B981',
                    bg: '#ECFDF5',
                    icon: 'ShoppingBag',
                    desc: 'Pesanan Anda sudah siap! Silakan ambil di toko.'
                };
            case 'rejected':
                return {
                    label: 'PESANAN DITOLAK',
                    color: '#EF4444',
                    bg: '#FEF2F2',
                    icon: 'XCircle',
                    desc: 'Maaf, penjual tidak dapat menerima pesanan Anda saat ini.'
                };
            case 'cancelled':
                return {
                    label: 'PESANAN BATAL',
                    color: '#64748B',
                    bg: '#F8FAFC',
                    icon: 'XCircle',
                    desc: 'Pesanan ini telah dibatalkan.'
                };
            case 'completed':
                return {
                    label: 'PESANAN SELESAI',
                    color: '#059669',
                    bg: '#ECFDF5',
                    icon: 'CheckCircle2',
                    desc: 'Terima kasih! Pesanan Anda telah selesai. Sampai jumpa lagi!'
                };
            default:
                return {
                    label: 'STATUS TIDAK DIKETAHUI',
                    color: '#94A3B8',
                    bg: '#F8FAFC',
                    icon: 'Info',
                    desc: 'Sedang memperbarui status pesanan Anda...'
                };
        }
    };

    if (loading && !order) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold text-sm">Memuat Detail Pesanan...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
                <Icon name="Search" className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold text-base mb-6">Pesanan tidak ditemukan</p>
                <button
                    onClick={() => navigate('/customer/dashboard')}
                    className="bg-green-600 text-white font-black py-3.5 px-6 rounded-2xl"
                >
                    Kembali ke Beranda
                </button>
            </div>
        );
    }

    const sInfo = getStatusInfo(order.status);

    return (
        <div className="min-h-screen bg-white pb-6">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white fixed top-0 left-0 right-0 z-50">
                <button
                    onClick={() => navigate('/customer/order-confirmation')}
                    className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"
                >
                    <Icon name="ArrowLeft" className="w-5 h-5 text-gray-800" />
                </button>
                <h1 className="text-lg font-black text-gray-800">Konfirmasi Pesanan</h1>
                <button
                    onClick={fetchOrderDetail}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                >
                    <Icon name="RefreshCw" className="w-4.5 h-4.5 text-gray-400" />
                </button>
            </div>

            <div className="overflow-y-auto pt-[72px]">
                {/* Status Hero */}
                <div className="flex flex-col items-center p-10 m-5 rounded-[2.2rem]" style={{ backgroundColor: sInfo.bg }}>
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg"
                        style={{ backgroundColor: sInfo.color }}
                    >
                        <Icon name={sInfo.icon} className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-lg font-black mb-2.5" style={{ color: sInfo.color, letterSpacing: '0.05em' }}>
                        {sInfo.label}
                    </h2>
                    <p className="text-[13px] text-gray-500 text-center leading-5 px-2.5">
                        {sInfo.desc}
                    </p>
                </div>

                {/* Order Meta */}
                <div className="px-5 mb-6">
                    <div className="flex bg-gray-50 rounded-3xl p-5 border border-gray-100">
                        <div className="flex-1 text-center">
                            <p className="text-[9px] font-black text-gray-400 tracking-widest mb-1">ID PESANAN</p>
                            <p className="text-[15px] font-black text-gray-800">#{order.id}</p>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="flex-1 text-center">
                            <p className="text-[9px] font-black text-gray-400 tracking-widest mb-1">WAKTU</p>
                            <p className="text-[15px] font-black text-gray-800">
                                {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items Summary */}
                <div className="px-5 mb-6">
                    <div className="flex items-center gap-2.5 mb-4">
                        <Icon name="ShoppingBag" className="w-4.5 h-4.5 text-gray-800" />
                        <h3 className="text-base font-black text-gray-800">Ringkasan Pesanan</h3>
                    </div>

                    <div className="bg-white rounded-[1.75rem] p-6 border border-gray-100 shadow-sm">
                        {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start mb-4">
                                <div className="flex flex-1 gap-3">
                                    <p className="text-sm font-black text-green-600 min-w-[24px]">{item.quantity}x</p>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                        {(item.options || []).length > 0 && (
                                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                {item.options.map(o => o.name).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm font-black text-gray-800">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                        ))}

                        <div className="h-px bg-gray-100 my-4"></div>

                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[13px] text-gray-500 font-bold">Subtotal</p>
                            <p className="text-[15px] font-black text-gray-800">
                                {formatCurrency((parseFloat(order.total) || 0) + (parseFloat(order.points_used) || 0) + (parseFloat(order.promo_discount) || 0))}
                            </p>
                        </div>
                        {order.points_used > 0 && (
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[13px] text-sky-600 font-bold">Potongan Poin</p>
                                <p className="text-[13px] text-sky-600 font-black">-{formatCurrency(parseFloat(order.points_used) || 0)}</p>
                            </div>
                        )}
                        {order.promo_discount > 0 && (
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[13px] text-green-600 font-bold">Diskon Promo</p>
                                <p className="text-[13px] text-green-600 font-black">-{formatCurrency(parseFloat(order.promo_discount) || 0)}</p>
                            </div>
                        )}
                        <div className="flex justify-between items-center mt-3 mb-2">
                            <p className="text-[13px] text-gray-500 font-bold">Total Bayar</p>
                            <p className="text-lg font-black text-green-600">{formatCurrency(parseFloat(order.total) || 0)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-[13px] text-gray-500 font-bold">Metode Pembayaran</p>
                            <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
                                {order.payment_method === 'cash' ? 'Tunai' : (order.payment_method === 'transfer' ? 'Transfer Bank' : order.payment_method)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Card */}
                <div className="bg-gray-800 mx-5 mt-5 mb-5 rounded-[1.875rem] p-6">
                    <h3 className="text-white text-lg font-black mb-1.5">Butuh bantuan?</h3>
                    <p className="text-white/60 text-xs leading-[18px] mb-5">
                        Hubungi penjual jika Anda memiliki pertanyaan terkait pesanan Anda.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleChatWithSeller}
                            className="w-full h-[54px] bg-green-600 rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
                        >
                            <Icon name="MessageCircle" className="w-5 h-5 text-white" />
                            <span className="text-white text-[15px] font-black">Tanya Penjual</span>
                        </button>

                        {order.status === 'pending' && (
                            <button
                                onClick={handleCancelOrder}
                                className="w-full h-[54px] bg-red-500 rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
                            >
                                <Icon name="XCircle" className="w-5 h-5 text-white" />
                                <span className="text-white text-[15px] font-black">Batalkan Pesanan</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>



            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
                    <div className="bg-white w-full max-w-md rounded-[1.875rem] p-6 flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <Icon name="XCircle" className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-2">Batalkan Pesanan?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6 leading-[22px]">
                            Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="w-full space-y-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="w-full h-[54px] bg-gray-100 rounded-2xl flex items-center justify-center"
                            >
                                <span className="text-gray-500 text-base font-black">Tidak, Kembali</span>
                            </button>
                            <button
                                onClick={confirmCancelOrder}
                                className="w-full h-[54px] bg-red-500 rounded-2xl flex items-center justify-center"
                            >
                                <span className="text-white text-base font-black">Ya, Batalkan</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerOrderDetails;
