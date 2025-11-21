import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationHeader from '../../components/ui/NavigationHeader';

import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import authFetch from '../../utils/authFetch';
import OrderCard from './components/OrderCard';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Button from '../../components/ui/Button'; // Import Button

const OrderConfirmationPage = ({ headerTitle }) => {
    const { theme } = useTheme();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [modalState, setModalState] = useState({ isOpen: false, orderId: null, action: null, title: '', message: '', type: null, isBulk: false }); // Added isBulk
    const [notification, setNotification] = useState(null); // New state for notification

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, 3000); // Hide after 3 seconds
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

            // Ekstrak hanya ID dari setiap item
            const itemIds = parsedItems.map(item => item.id);

            const response = await authFetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus, items: parsedItems }), // Mengirim array item lengkap
            });

            const res = await response.json();
            if (!response.ok) {
                throw new Error(res.error || `Gagal mengubah status pesanan.`);
            }
            
            showNotification(res.message || 'Status pesanan berhasil diubah.', 'success');
            fetchOrders(); // Refresh the list after updating

        } catch (err) {
            console.error("Error updating order status:", err);
            showNotification(`Error: ${err.message}`, 'error');
        } finally {
            closeConfirmationModal(); // Always close modal after action
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
            handleBulkDeleteOrders(modalState.orderId); // orderId here is actually the status for bulk delete
        }
    };

    const filteredOrders = orders.filter(order => order.status === activeTab);

    const renderContent = () => {
        if (loading) {
            return <p className="text-center py-10">Memuat pesanan...</p>;
        }
        if (error) {
            return <p className="text-center py-10 text-red-500">Error: {error}</p>;
        }
        if (filteredOrders.length === 0) {
            return <p className="text-center py-10 text-gray-500">Tidak ada pesanan dengan status '{activeTab}'.</p>;
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
            {theme === 'default' && <NavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle} />}
            {notification && (
                <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-[1002] ${
                    notification.type === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                }`}>
                    {notification.message}
                </div>
            )}
            <div className={`${theme === 'default' ? 'pt-20' : ''}`}>
                <div className={`container mx-auto ${theme === 'default' ? 'px-4' : ''} lg:px-6 space-y-6 py-4 pb-20`}>
                    <BreadcrumbNavigation className="mb-4" />
                    <div className="bg-card p-6 rounded-lg shadow-lg">
                        <h1 className="text-2xl font-bold mb-4">Manajemen Pesanan Masuk</h1>
                        <div className="border-b border-border mb-4">
                            <nav className="-mb-px flex justify-around">
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'pending' 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                                    }`}>
                                    Menunggu Konfirmasi
                                </button>
                                <button
                                    onClick={() => setActiveTab('accepted')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'accepted' 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                                    }`}>
                                    Diterima
                                </button>
                                <button
                                    onClick={() => setActiveTab('rejected')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'rejected' 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                                    }`}>
                                    Ditolak
                                </button>
                            </nav>
                        </div>
                        {(activeTab === 'pending' || activeTab === 'rejected' || activeTab === 'accepted') && filteredOrders.length > 0 && (
                            <div className="flex justify-end mb-4">
                                <Button
                                    variant="destructive"
                                    onClick={() => openConfirmationModal(activeTab, 'delete', true)}
                                >
                                    Hapus Semua {activeTab === 'pending' ? 'Menunggu Konfirmasi' : (activeTab === 'rejected' ? 'Ditolak' : 'Diterima')}
                                </Button>
                            </div>
                        )}
                        <div>
                            {renderContent()}
                        </div>
                    </div>
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
