import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationHeader from '../../components/ui/NavigationHeader';
import Icon from '../../components/AppIcon';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import authFetch from '../../utils/authFetch';
import OrderCard from './components/OrderCard';
import MobileOrderCard from './components/MobileOrderCard';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Button from '../../components/ui/Button';
import AdminMobileHeader from '../../components/ui/AdminMobileHeader';
import { useOrderNotification } from '../../contexts/OrderNotificationContext';

const OrderConfirmationPage = ({ headerTitle }) => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { fetchPendingCount } = useOrderNotification();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [modalState, setModalState] = useState({ isOpen: false, orderId: null, action: null, title: '', message: '', type: null, isBulk: false });
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await authFetch('/api/orders');
            if (!response.ok) {
                throw new Error('Gagal memuat daftar pesanan.');
            }
            const data = await response.json();

            setOrders(data.data || []);
            fetchPendingCount();
        } catch (err) {
            setError(err.message);
            showNotification(`Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleUpdateStatus = async (orderId, newStatus, ignoreStock = false) => {
        try {
            const orderToUpdate = orders.find(order => order.id === orderId);
            if (!orderToUpdate) {
                throw new Error('Order not found.');
            }

            let parsedItems = orderToUpdate.items;
            if (typeof orderToUpdate.items === 'string') {
                try {
                    parsedItems = JSON.parse(orderToUpdate.items);
                } catch (e) {
                    console.error("Failed to parse order items:", e);
                    throw new Error("Invalid order items data.");
                }
            }

            const response = await authFetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus, items: parsedItems, ignoreStock }),
            });

            const res = await response.json();
            if (!response.ok) {
                throw new Error(res.error || `Gagal mengubah status pesanan.`);
            }

            showNotification(res.message || 'Status pesanan berhasil diubah.', 'success');
            fetchOrders();
            closeConfirmationModal();

        } catch (err) {
            console.error("Error updating order status:", err);

            // Check if error is related to stock
            if (err.message.includes('masalah stok') && newStatus === 'accepted') {
                setModalState({
                    isOpen: true,
                    orderId,
                    action: 'accepted_ignore_stock',
                    title: 'Konfirmasi Stok Kosong',
                    message: `${err.message}\n\nApakah Anda yakin stok di sini kosong? Jika Anda yakin, transaksi akan tetap berjalan dan pengecekan stok akan diabaikan.`,
                    type: 'confirm',
                    isDestructive: true,
                    isBulk: false
                });
            } else {
                showNotification(`Error: ${err.message}`, 'error');
                closeConfirmationModal();
            }
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            const response = await authFetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
            });
            const res = await response.json();
            if (!response.ok) {
                throw new Error(res.error || 'Gagal menghapus pesanan.');
            }
            showNotification(res.message || 'Pesanan berhasil dihapus.', 'success');
            fetchOrders();
        } catch (err) {
            console.error("Error deleting order:", err);
            showNotification(`Error: ${err.message}`, 'error');
        } finally {
            closeConfirmationModal();
        }
    };

    const handleBulkDeleteOrders = async (statusToDelete) => {
        try {
            const response = await authFetch(`/api/orders/status/${statusToDelete}`, {
                method: 'DELETE',
            });
            const res = await response.json();
            if (!response.ok) {
                throw new Error(res.error || `Gagal menghapus pesanan dengan status ${statusToDelete}.`);
            }
            showNotification(res.message || `${res.changes} pesanan dengan status '${statusToDelete}' berhasil dihapus.`, 'success');
            fetchOrders();
        } catch (err) {
            console.error("Error bulk deleting orders:", err);
            showNotification(`Error: ${err.message}`, 'error');
        } finally {
            closeConfirmationModal();
        }
    };

    const openConfirmationModal = (orderId, action, isBulk = false) => {
        let title = '';
        let message = '';
        let isDestructive = false;

        if (action === 'accepted') {
            title = 'Konfirmasi Terima Pesanan';
            message = 'Apakah Anda yakin ingin MENERIMA pesanan ini? Stok akan dikurangi dan pesanan akan masuk ke laporan transaksi.';
        } else if (action === 'rejected') {
            title = 'Konfirmasi Tolak Pesanan';
            message = 'Apakah Anda yakin ingin MENOLAK pesanan ini? Aksi ini tidak dapat dibatalkan.';
            isDestructive = true;
        } else if (action === 'delete' && !isBulk) {
            title = 'Konfirmasi Hapus Pesanan';
            message = 'Apakah Anda yakin ingin MENGHAPUS pesanan ini? Aksi ini tidak dapat dibatalkan.';
            isDestructive = true;
        } else if (action === 'delete' && isBulk) {
            const statusMap = {
                pending: 'Menunggu Konfirmasi',
                rejected: 'Ditolak',
                accepted: 'Diterima'
            };
            title = `Konfirmasi Hapus Semua Pesanan ${statusMap[orderId] || ''}`;
            message = `Apakah Anda yakin ingin MENGHAPUS SEMUA pesanan dengan status '${statusMap[orderId]}'? Aksi ini tidak dapat dibatalkan.`;
            isDestructive = true;
        }

        setModalState({ isOpen: true, orderId, action, title, message, type: 'confirm', isDestructive, isBulk });
    };

    const closeConfirmationModal = () => {
        setModalState({ isOpen: false, orderId: null, action: null, title: '', message: '', type: null, isBulk: false });
    };

    const handleConfirmAction = () => {
        if (modalState.action === 'accepted' || modalState.action === 'rejected') {
            handleUpdateStatus(modalState.orderId, modalState.action);
        } else if (modalState.action === 'accepted_ignore_stock') {
            handleUpdateStatus(modalState.orderId, 'accepted', true);
        } else if (modalState.action === 'delete' && !modalState.isBulk) {
            handleDeleteOrder(modalState.orderId);
        } else if (modalState.action === 'delete' && modalState.isBulk) {
            handleBulkDeleteOrders(modalState.orderId);
        }
    };

    const filteredOrders = orders.filter(order => order.status === activeTab);

    // Count orders by status
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const acceptedCount = orders.filter(o => o.status === 'accepted').length;
    const rejectedCount = orders.filter(o => o.status === 'rejected').length;

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-text-secondary">Memuat pesanan...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <Icon name="AlertCircle" size={32} className="text-destructive" />
                    </div>
                    <p className="text-destructive font-semibold mb-2">Terjadi Kesalahan</p>
                    <p className="text-text-secondary text-sm">{error}</p>
                </div>
            );
        }
        if (filteredOrders.length === 0) {
            const emptyStates = {
                pending: {
                    icon: 'Clock',
                    title: 'Belum Ada Pesanan Baru',
                    description: 'Pesanan yang masuk akan muncul di sini',
                    color: 'text-yellow-500'
                },
                accepted: {
                    icon: 'CheckCircle',
                    title: 'Belum Ada Pesanan Diterima',
                    description: 'Pesanan yang Anda terima akan muncul di sini',
                    color: 'text-success'
                },
                rejected: {
                    icon: 'XCircle',
                    title: 'Belum Ada Pesanan Ditolak',
                    description: 'Pesanan yang Anda tolak akan muncul di sini',
                    color: 'text-destructive'
                }
            };
            const state = emptyStates[activeTab] || emptyStates.pending;

            return (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className={`w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4 ${state.color}`}>
                        <Icon name={state.icon} size={40} />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">{state.title}</h3>
                    <p className="text-text-secondary text-sm">{state.description}</p>
                </div>
            );
        }
        return (
            <div className="space-y-4">
                {filteredOrders.map(order => (
                    <React.Fragment key={order.id}>
                        <div className="hidden lg:block">
                            <OrderCard
                                order={order}
                                onAccept={() => openConfirmationModal(order.id, 'accepted')}
                                onReject={() => openConfirmationModal(order.id, 'rejected')}
                                onDelete={() => openConfirmationModal(order.id, 'delete')}
                            />
                        </div>
                        <div className="lg:hidden">
                            <MobileOrderCard
                                order={order}
                                onAccept={() => openConfirmationModal(order.id, 'accepted')}
                                onReject={() => openConfirmationModal(order.id, 'rejected')}
                                onDelete={() => openConfirmationModal(order.id, 'delete')}
                            />
                        </div>
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
            {theme === 'default' && <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} hideMobileHeader={true} />}

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 right-4 p-4 rounded-lg shadow-2xl z-[1002] flex items-center gap-3 animate-slide-in-right max-w-md ${notification.type === 'success'
                    ? 'bg-success text-success-foreground border-l-4 border-success'
                    : 'bg-destructive text-destructive-foreground border-l-4 border-destructive'
                    }`}>
                    <Icon
                        name={notification.type === 'success' ? 'CheckCircle' : 'AlertCircle'}
                        size={20}
                        className="flex-shrink-0"
                    />
                    <p className="text-sm font-medium">{notification.message}</p>
                </div>
            )}

            <main className={`${theme === 'default' ? 'pt-0 lg:pt-16' : ''} pb-24 lg:pb-8`}>
                {theme === 'default' && (
                    <AdminMobileHeader
                        title="Daftar Pesanan"
                        subtitle={pendingCount > 0 ? `${pendingCount} Pesanan Baru` : 'Monitoring'}
                        badgeText="Update Real-time"
                        stickyTitle={headerTitle || 'Konfirmasi Pesanan'}
                        decorativeIcon="ShoppingBag"
                        actions={[
                            {
                                label: 'Hapus Riwayat',
                                icon: 'Trash2',
                                onClick: () => openConfirmationModal(activeTab, 'delete', true)
                            }
                        ]}
                    />
                )}

                <div className={`container mx-auto ${theme === 'default' ? 'px-4' : ''} lg:px-6 space-y-6 py-4 pb-20`}>
                    <div className="hidden lg:block">
                        <BreadcrumbNavigation className="mb-4" />
                    </div>

                    {/* Stats Summary - Mobile Only (Floating Cards) */}
                    <div className="lg:hidden grid grid-cols-3 gap-3 !-mt-16 relative z-20 mb-2">
                        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] p-4 shadow-sm border border-yellow-100/50 dark:border-yellow-900/20 flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center text-yellow-500 mb-2">
                                <Icon name="Clock" size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1">Menunggu</span>
                            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{pendingCount}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] p-4 shadow-sm border border-green-100/50 dark:border-green-900/20 flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-500 mb-2">
                                <Icon name="CheckCircle" size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1">Diterima</span>
                            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{acceptedCount}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] p-4 shadow-sm border border-red-100/50 dark:border-red-900/20 flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500 mb-2">
                                <Icon name="XCircle" size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1">Ditolak</span>
                            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{rejectedCount}</p>
                        </div>
                    </div>

                    {/* Header Section - Desktop Only */}
                    <div className="hidden lg:block bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 mb-6 border border-primary/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                                <Icon name="ShoppingBag" size={24} className="text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Manajemen Pesanan</h1>
                                <p className="text-text-secondary text-sm mt-1">Kelola pesanan masuk dari pelanggan</p>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon name="Clock" size={16} className="text-yellow-500" />
                                    <span className="text-xs text-text-secondary">Menunggu</span>
                                </div>
                                <p className="text-2xl font-bold text-text-primary">{pendingCount}</p>
                            </div>
                            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon name="CheckCircle" size={16} className="text-success" />
                                    <span className="text-xs text-text-secondary">Diterima</span>
                                </div>
                                <p className="text-2xl font-bold text-text-primary">{acceptedCount}</p>
                            </div>
                            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon name="XCircle" size={16} className="text-destructive" />
                                    <span className="text-xs text-text-secondary">Ditolak</span>
                                </div>
                                <p className="text-2xl font-bold text-text-primary">{rejectedCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area - Tabs & List */}
                    <div className="lg:hidden mt-4">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm flex gap-2 mb-6 overflow-x-auto hide-scrollbar sticky top-4 z-30">
                            {[
                                { id: 'pending', label: 'Baru', icon: 'Clock', color: 'blue', count: pendingCount },
                                { id: 'accepted', label: 'Diterima', icon: 'CheckCircle', color: 'green', count: acceptedCount },
                                { id: 'rejected', label: 'Ditolak', icon: 'XCircle', color: 'red', count: rejectedCount }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] font-black transition-all whitespace-nowrap active:scale-95 ${activeTab === tab.id
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 dark:shadow-none'
                                            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <Icon
                                        name={tab.icon}
                                        size={18}
                                        className={activeTab === tab.id ? 'text-white' : `text-${tab.color}-600`}
                                    />
                                    <span className="text-xs uppercase tracking-wider">{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span className={`${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700'} px-2 py-0.5 rounded-full text-[10px]`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Content Card */}
                    <div className="hidden lg:block bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                        {/* Tab Navigation */}
                        <div className="border-b border-border bg-muted/30 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                            <nav className="flex min-w-max sm:min-w-0">
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`flex-1 min-w-[140px] sm:min-w-0 py-4 px-4 text-sm font-medium transition-all relative ${activeTab === 'pending'
                                        ? 'text-primary bg-card'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-muted/50'
                                        }`}>
                                    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                        <Icon name="Clock" size={18} />
                                        <span className="hidden sm:inline">Menunggu Konfirmasi</span>
                                        <span className="sm:hidden">Menunggu</span>
                                        {pendingCount > 0 && (
                                            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                                {pendingCount}
                                            </span>
                                        )}
                                    </div>
                                    {activeTab === 'pending' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('accepted')}
                                    className={`flex-1 min-w-[120px] sm:min-w-0 py-4 px-4 text-sm font-medium transition-all relative ${activeTab === 'accepted'
                                        ? 'text-primary bg-card'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-muted/50'
                                        }`}>
                                    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                        <Icon name="CheckCircle" size={18} />
                                        <span>Diterima</span>
                                        {acceptedCount > 0 && (
                                            <span className="bg-success text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                                {acceptedCount}
                                            </span>
                                        )}
                                    </div>
                                    {activeTab === 'accepted' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('rejected')}
                                    className={`flex-1 min-w-[120px] sm:min-w-0 py-4 px-4 text-sm font-medium transition-all relative ${activeTab === 'rejected'
                                        ? 'text-primary bg-card'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-muted/50'
                                        }`}>
                                    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                        <Icon name="XCircle" size={18} />
                                        <span>Ditolak</span>
                                        {rejectedCount > 0 && (
                                            <span className="bg-destructive text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                                {rejectedCount}
                                            </span>
                                        )}
                                    </div>
                                    {activeTab === 'rejected' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                                    )}
                                </button>
                            </nav>
                        </div>

                        {/* Bulk Delete Button */}
                        {filteredOrders.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-4 bg-muted/20 border-b border-border">
                                <p className="text-sm text-text-secondary text-center sm:text-left">
                                    Menampilkan <span className="font-semibold text-text-primary">{filteredOrders.length}</span> pesanan
                                </p>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openConfirmationModal(activeTab, 'delete', true)}
                                    iconName="Trash2"
                                    className="w-full sm:w-auto"
                                >
                                    Hapus Semua
                                </Button>
                            </div>
                        )}

                        {/* Desktop Content Area */}
                        <div className="p-6">
                            {renderContent()}
                        </div>
                    </div>

                    {/* Mobile Content Area */}
                    <div className="lg:hidden">
                        {filteredOrders.length > 0 && activeTab !== 'pending' && (
                            <div className="mb-4">
                                <button
                                    onClick={() => openConfirmationModal(activeTab, 'delete', true)}
                                    className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/20 active:scale-95 transition-all"
                                >
                                    <Icon name="Trash2" size={14} />
                                    Hapus Semua Riwayat {activeTab === 'accepted' ? 'Diterima' : 'Ditolak'}
                                </button>
                            </div>
                        )}
                        {renderContent()}
                    </div>

                    {/* Confirmation Modal */}
                    <ConfirmationModal
                        isOpen={modalState.isOpen}
                        onClose={closeConfirmationModal}
                        onConfirm={handleConfirmAction}
                        title={modalState.title}
                        message={modalState.message}
                        isDestructive={modalState.isDestructive}
                    />
                </div>
            </main>
        </div>
    );
};

export default OrderConfirmationPage;
