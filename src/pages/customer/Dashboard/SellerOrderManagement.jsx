import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { jwtDecode } from 'jwt-decode';
import SellerOrderCard from './components/SellerOrderCard';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';

const SellerOrderManagement = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [scrolled, setScrolled] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [modalState, setModalState] = useState({ isOpen: false, orderId: null, action: null, title: '', message: '', isDestructive: false });

    const fetchOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            // Fetch orders with current active filter status
            const response = await authFetch(`/api/orders?status=${activeTab}&limit=50`);
            const data = await response.json();
            if (response.ok) {
                setOrders(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Gagal memuat pesanan");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role);
            } catch (e) {
                console.error(e);
            }
        }

        fetchOrders();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchOrders]);

    const handleUpdateStatus = async (orderId, newStatus, ignoreStock = false) => {
        try {
            const response = await authFetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, ignoreStock }),
            });

            const res = await response.json();
            if (!response.ok) {
                if (res.error?.includes('masalah stok') && newStatus === 'accepted') {
                    setModalState({
                        isOpen: true,
                        orderId,
                        action: 'accepted_ignore_stock',
                        title: 'Stok Tidak Mencukupi',
                        message: `${res.error}\n\nApakah Anda yakin stok di sini kosong? Transaksi tetap berjalan jika ya.`,
                        isDestructive: true
                    });
                    return;
                }
                throw new Error(res.error || 'Gagal mengubah status');
            }

            toast.success(res.message || 'Status pesanan diperbarui');
            fetchOrders();
            setModalState({ isOpen: false, orderId: null, action: null, title: '', message: '', isDestructive: false });
        } catch (err) {
            toast.error(err.message);
        }
    };

    const tabs = [
        { id: 'pending', label: 'Baru', icon: 'Clock', color: 'text-yellow-500', bg: 'bg-yellow-50' },
        { id: 'accepted', label: 'Diterima', icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'rejected', label: 'Ditolak', icon: 'XCircle', color: 'text-red-500', bg: 'bg-red-50' },
        { id: 'cancelled', label: 'Batal', icon: 'Slash', color: 'text-gray-400', bg: 'bg-gray-50' },
    ];

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="pb-10 animate-in fade-in duration-500 -mx-4 -mt-4 lg:-mx-10 lg:-mt-10">
            {/* Top Bar Floating (Mobile) */}
            <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'} lg:hidden`}>
                <div className="px-6 flex items-center justify-between">
                    <button onClick={() => navigate('/seller/dashboard')} className={`p-2 rounded-xl ${scrolled ? 'bg-gray-100 text-gray-800' : 'bg-white/20 text-white'}`}>
                        <Icon name="ChevronLeft" size={24} />
                    </button>
                    <span className={`font-black tracking-tight ${scrolled ? 'text-gray-800' : 'text-white text-lg'}`}>Pesanan</span>
                    <div className="flex gap-2">
                        {userRole === 'admin' && (
                            <button
                                onClick={() => navigate('/main-dashboard')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${scrolled ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-white/20 text-white border border-white/30'}`}
                            >
                                <Icon name="ArrowLeft" size={14} />
                                Admin
                            </button>
                        )}
                        <button onClick={() => fetchOrders()} className={`p-2 rounded-xl ${scrolled ? 'bg-gray-100 text-gray-800' : 'bg-white/20 text-white'}`}>
                            <Icon name="RefreshCw" size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Premium Header */}
            <header className="bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-500 pt-16 pb-12 px-6 lg:pt-10 rounded-b-[2.5rem] shadow-xl relative z-10">
                <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-20%] left-[-5%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => navigate('/seller/dashboard')} className="hidden lg:flex p-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-all mr-2">
                                <Icon name="ChevronLeft" size={20} />
                            </button>
                            <span className="text-blue-100 font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full">Order Management</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Manajemen Pesanan</h1>
                        <p className="text-blue-100/80 font-medium mt-1">Kelola semua pesanan pelanggan di satu tempat secara real-time.</p>
                    </div>

                    <button
                        onClick={() => fetchOrders()}
                        className="flex bg-white text-indigo-700 px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all items-center justify-center gap-3"
                    >
                        <Icon name="RefreshCw" size={20} className={isLoading ? 'animate-spin' : ''} />
                        Segarkan Data
                    </button>
                </div>
            </header>

            <div className="px-4 lg:px-10 mt-10">
                {/* Tabs Navigation */}
                <div className="bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm flex gap-2 mb-8 overflow-x-auto hide-scrollbar sticky top-4 z-30">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] font-black transition-all whitespace-nowrap ${isActive
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                    }`}
                            >
                                <Icon name={tab.icon} size={18} className={isActive ? 'text-white' : tab.color} />
                                <span className="text-xs uppercase tracking-wider">{tab.label}</span>
                                {orders.length > 0 && isActive && (
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{orders.length}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Orders Content */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-white rounded-[2rem] border border-gray-100 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : orders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.map((order) => (
                            <div key={order.id} className="relative group">
                                <SellerOrderCard
                                    order={order}
                                    onAccept={activeTab === 'pending' ? () => setModalState({
                                        isOpen: true, orderId: order.id, action: 'accepted', title: 'Terima Pesanan', message: 'Apakah Anda yakin ingin menerima pesanan ini?', isDestructive: false
                                    }) : null}
                                    onReject={activeTab === 'pending' ? () => setModalState({
                                        isOpen: true, orderId: order.id, action: 'rejected', title: 'Tolak Pesanan', message: 'Apakah Anda yakin ingin menolak pesanan ini?', isDestructive: true
                                    }) : null}
                                />
                                {/* Overlay info for non-pending orders since card UI is pending-focused */}
                                {activeTab !== 'pending' && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className={`${tabs.find(t => t.id === activeTab).bg} ${tabs.find(t => t.id === activeTab).color} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/50 shadow-sm shadow-gray-200/20`}>
                                            {tabs.find(t => t.id === activeTab).label}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-100 flex flex-col items-center max-w-2xl mx-auto shadow-sm">
                        <div className={`w-24 h-24 ${tabs.find(t => t.id === activeTab).bg} rounded-full flex items-center justify-center mb-6 shadow-sm`}>
                            <Icon name={tabs.find(t => t.id === activeTab).icon} size={48} className={tabs.find(t => t.id === activeTab).color} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Tidak Ada Pesanan {tabs.find(t => t.id === activeTab).label}</h3>
                        <p className="text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">
                            {activeTab === 'pending'
                                ? "Saat ini tidak ada pesanan baru yang masuk. Silakan tunggu atau promosikan menu Anda!"
                                : `Belum ada riwayat pesanan dengan status ${tabs.find(t => t.id === activeTab).label.toLowerCase()}.`}
                        </p>
                    </div>
                )}

                <ConfirmationModal
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState({ ...modalState, isOpen: false })}
                    onConfirm={() => {
                        if (modalState.action === 'accepted_ignore_stock') {
                            handleUpdateStatus(modalState.orderId, 'accepted', true);
                        } else {
                            handleUpdateStatus(modalState.orderId, modalState.action);
                        }
                    }}
                    title={modalState.title}
                    message={modalState.message}
                    isDestructive={modalState.isDestructive}
                />
            </div>
        </div>
    );
};

export default SellerOrderManagement;
