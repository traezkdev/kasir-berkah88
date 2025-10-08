import React, { useState, useEffect, useCallback } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import authFetch from '../../utils/authFetch';
import OrderCard from './components/OrderCard';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const OrderConfirmationPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [modalState, setModalState] = useState({ isOpen: false, orderId: null, action: null, title: '', message: '', type: null }); // type: 'confirm' or 'success' or 'error'

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await authFetch('/api/orders');
            if (!response.ok) {
                throw new Error('Gagal memuat daftar pesanan.');
            }
            const data = await response.json();
            console.log("Fetched orders data:", data.data);
            setOrders(data.data || []);
        } catch (err) {
            setError(err.message);
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
                body: JSON.stringify({ status: newStatus, menuItems: parsedItems }),
            });

            const res = await response.json();
            if (!response.ok) {
                throw new Error(res.error || `Gagal mengubah status pesanan.`);
            }
            
            setModalState({ isOpen: true, title: 'Sukses!', message: res.message || 'Status pesanan berhasil diubah.', type: 'success' });
            fetchOrders(); // Refresh the list after updating

        } catch (err) {
            console.error("Error updating order status:", err);
            setModalState({ isOpen: true, title: 'Error!', message: err.message, type: 'error' });
        } finally {
            // For confirmation type, modal closes after action. For success/error, it stays open until user closes.
            if (modalState.type === 'confirm') {
                setModalState({ isOpen: false, orderId: null, action: null, title: '', message: '', type: null });
            }
        }
    };

    const openConfirmationModal = (orderId, action) => {
        const title = action === 'accepted' ? 'Konfirmasi Terima Pesanan' : 'Konfirmasi Tolak Pesanan';
        const message = action === 'accepted' 
            ? 'Apakah Anda yakin ingin MENERIMA pesanan ini? Stok akan dikurangi dan pesanan akan masuk ke laporan transaksi.'
            : 'Apakah Anda yakin ingin MENOLAK pesanan ini? Aksi ini tidak dapat dibatalkan.';
        setModalState({ isOpen: true, orderId, action, title, message, type: 'confirm' });
    };

    const closeConfirmationModal = () => {
        setModalState({ isOpen: false, orderId: null, action: null, title: '', message: '', type: null });
    };

    const handleConfirmAction = () => {
        if (modalState.orderId && modalState.action) {
            handleUpdateStatus(modalState.orderId, modalState.action);
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
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 pt-24">
            <NavigationHeader title="Konfirmasi Pesanan" />
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Manajemen Pesanan Masuk</h1>
                
                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'pending' 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}>
                            Menunggu Konfirmasi
                        </button>
                        <button
                            onClick={() => setActiveTab('accepted')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'accepted' 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}>
                            Diterima
                        </button>
                        <button
                            onClick={() => setActiveTab('rejected')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'rejected' 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}>
                            Ditolak
                        </button>
                    </nav>
                </div>

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
                isDestructive={modalState.action === 'rejected'}
            />
        </div>
    );
};

export default OrderConfirmationPage;
