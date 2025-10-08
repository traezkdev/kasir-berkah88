import React, { useState, useEffect, useCallback } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import authFetch from '../../utils/authFetch';
import OrderCard from './components/OrderCard';

const OrderConfirmationPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');

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
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const response = await authFetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const res = await response.json();
            if (!response.ok) {
                throw new Error(res.error || `Gagal mengubah status pesanan.`);
            }
            
            alert(res.message || 'Status pesanan berhasil diubah.');
            // Refresh the list after updating
            fetchOrders();

        } catch (err) {
            console.error("Error updating order status:", err);
            alert(err.message);
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
                        onAccept={() => handleUpdateStatus(order.id, 'accepted')}
                        onReject={() => handleUpdateStatus(order.id, 'rejected')}
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
        </div>
    );
};

export default OrderConfirmationPage;
