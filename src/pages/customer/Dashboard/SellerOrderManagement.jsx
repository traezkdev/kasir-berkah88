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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

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

    // Reset pagination when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
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

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = orders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(orders.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="pb-10 animate-in fade-in duration-500 lg:static -mx-4 -mt-4 lg:mx-0 lg:mt-0">
            {/* Desktop UI */}
            <div className="hidden lg:block pb-10">
                <header className="bg-white rounded-[2rem] p-8 shadow-sm border border-indigo-50/50 mb-8 flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Icon name="ShoppingBag" size={20} /></div>
                            <span className="text-indigo-600 font-bold text-sm uppercase tracking-wider">Order Management</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Manajemen Pesanan</h1>
                        <p className="text-gray-500 font-medium">Kelola status dan proses pesanan pelanggan.</p>
                    </div>
                    <div className="relative z-10 flex gap-4">
                        <button onClick={() => fetchOrders()} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                            <Icon name="RefreshCw" size={18} className={isLoading ? 'animate-spin' : ''} /> Segarkan
                        </button>
                    </div>
                </header>

                {/* Desktop Tabs */}
                <div className="flex gap-4 mb-8">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                    }`}
                            >
                                <Icon name={tab.icon} size={18} />
                                <span>{tab.label}</span>
                                {orders.length > 0 && isActive && (
                                    <span className="bg-white/20 text-white px-2 py-0.5 rounded-lg text-xs ml-1">{orders.length}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Desktop Content */}
                {isLoading ? (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-white rounded-[2rem] border border-gray-100 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : orders.length > 0 ? (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
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
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] p-16 text-center border-dashed border-2 border-gray-200">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Icon name={tabs.find(t => t.id === activeTab).icon} size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada pesanan {tabs.find(t => t.id === activeTab).label.toLowerCase()}</h3>
                        <p className="text-gray-500">Belum ada data untuk ditampilkan di kategori ini.</p>
                    </div>
                )}
            </div>

            {/* Mobile UI */}
            <div className="lg:hidden pb-24">
                {/* Mobile Sticky Header */}
                <div className="fixed top-0 left-0 right-0 z-50 lg:hidden">
                    <div className={`absolute inset-0 bg-white transition-opacity duration-200 ease-in-out ${scrolled ? 'opacity-100 shadow-sm' : 'opacity-0'}`} />
                    <div className={`relative z-10 px-6 flex items-center justify-between transition-all duration-200 ease-in-out ${scrolled ? 'py-3 text-gray-800' : 'py-5 text-white'}`}>
                        <button onClick={() => navigate('/seller/dashboard')} className={`p-2 rounded-xl transition-all ${scrolled ? 'bg-gray-100 text-gray-800' : 'bg-white/20 text-white'}`}>
                            <Icon name="ChevronLeft" size={24} />
                        </button>
                        <span className={`font-black tracking-tight transition-all duration-200 ${scrolled ? 'text-gray-800' : 'text-white text-lg'}`}>Pesanan</span>
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
                            <button onClick={() => fetchOrders()} className={`p-2 rounded-xl transition-all ${scrolled ? 'bg-gray-100 text-gray-800' : 'bg-white/20 text-white'}`}>
                                <Icon name="RefreshCw" size={20} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Gradient Header */}
                <header className="bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-500 pt-24 pb-16 px-10 rounded-b-[3.5rem] shadow-xl relative z-10 mb-6 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden rounded-b-[3.5rem] pointer-events-none">
                        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-[-20%] left-[-5%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-100 font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full">Order Management</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Manajemen<br />Pesanan</h1>
                        <p className="text-blue-100/80 font-medium mt-1">Kelola semua pesanan pelanggan di satu tempat.</p>
                    </div>
                </header>

                <div className="px-8">
                    {/* Mobile Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                        }`}
                                >
                                    <Icon name={tab.icon} size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Mobile Content */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 bg-white rounded-[2rem] border border-gray-100 animate-pulse shadow-sm" />
                            ))}
                        </div>
                    ) : orders.length > 0 ? (
                        <div className="space-y-4">
                            {currentItems.map((order) => (
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
                                </div>
                            ))}

                            {/* Mobile Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 pt-4 pb-8">
                                    <button
                                        onClick={() => {
                                            paginate(Math.max(1, currentPage - 1));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        disabled={currentPage === 1}
                                        className={`p-3 rounded-2xl transition-all shadow-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 active:scale-95 shadow-blue-100'}`}
                                    >
                                        <Icon name="ChevronLeft" size={20} />
                                    </button>

                                    <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 text-sm font-black text-gray-800 tracking-tighter">
                                        {currentPage} <span className="text-gray-300 mx-1">/</span> {totalPages}
                                    </div>

                                    <button
                                        onClick={() => {
                                            paginate(Math.min(totalPages, currentPage + 1));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        disabled={currentPage === totalPages}
                                        className={`p-3 rounded-2xl transition-all shadow-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 active:scale-95 shadow-blue-100'}`}
                                    >
                                        <Icon name="ChevronRight" size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] p-10 text-center border-dashed border-2 border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Icon name={tabs.find(t => t.id === activeTab).icon} size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Kosong</h3>
                            <p className="text-xs text-gray-500">Tidak ada pesanan di sini.</p>
                        </div>
                    )}
                </div>
            </div>

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
    );
};

export default SellerOrderManagement;
