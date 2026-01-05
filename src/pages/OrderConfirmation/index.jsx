import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationHeader from '../../components/ui/NavigationHeader';
import Icon from '../../components/AppIcon';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import authFetch from '../../utils/authFetch';
import OrderCard from './components/OrderCard';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Button from '../../components/ui/Button';

const OrderConfirmationPage = ({ headerTitle }) => {
    const { theme } = useTheme();
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

    const handleUpdateStatus = async (orderId, newStatus) => {
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
                body: JSON.stringify({ status: newStatus, items: parsedItems }),
            });

            const res = await response.json();
            if (!response.ok) {
                throw new Error(res.error || `Gagal mengubah status pesanan.`);
            }

            showNotification(res.message || 'Status pesanan berhasil diubah.', 'success');
            fetchOrders();

        } catch (err) {
            console.error("Error updating order status:", err);
            showNotification(`Error: ${err.message}`, 'error');
        } finally {
            closeConfirmationModal();
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
                    <OrderCard
                        key={order.id}
                        order={order}
                        onAccept={() => openConfirmationModal(order.id, 'accepted')}
                        onReject={() => openConfirmationModal(order.id, 'rejected')}
                        onDelete={() => openConfirmationModal(order.id, 'delete')}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
            {theme === 'default' && <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} />}

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

            <div className={`${theme === 'default' ? 'pt-20' : ''}`}>
                <div className={`container mx-auto ${theme === 'default' ? 'px-4' : ''} lg:px-6 space-y-6 py-4 pb-20`}>
                    <BreadcrumbNavigation className="mb-4" />

                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 mb-6 border border-primary/20">
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

                    {/* Main Content Card */}
                    <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
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

                        {/* Content Area */}
                        <div className="p-6">
                            {renderContent()}
                        </div>
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
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
