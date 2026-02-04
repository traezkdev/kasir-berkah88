import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authFetch from '../utils/authFetch';
import NewOrderPopup from '../components/ui/NewOrderPopup';
import { jwtDecode } from 'jwt-decode';

const OrderNotificationContext = createContext();

export const OrderNotificationProvider = ({ children }) => {
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSync, setLastSync] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [latestOrder, setLatestOrder] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role);
            } catch (e) {
                console.error("Error decoding token in NotificationContext:", e);
            }
        }
    }, []);

    const fetchLatestOrder = async () => {
        try {
            const response = await authFetch('/api/orders?status=pending&limit=1');
            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    setLatestOrder(data.data[0]);
                    setIsPopupOpen(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch latest order:', error);
        }
    };

    const fetchPendingCount = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        let currentRole = userRole;
        if (!currentRole) {
            try {
                const decoded = jwtDecode(token);
                currentRole = decoded.role;
                setUserRole(currentRole);
            } catch (e) {
                return;
            }
        }

        // Jangan proses untuk pelanggan
        if (currentRole === 'pelanggan') return;

        try {
            const response = await authFetch('/api/orders?status=pending&limit=1');
            if (response.ok) {
                const data = await response.json();
                const count = data.pagination?.totalItems || 0;

                // Jika jumlah pesanan bertambah
                if (count > pendingCount) {
                    // Bunyikan suara
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                    audio.play().catch(e => {
                        if (e.name !== 'NotAllowedError') {
                            console.warn('Audio playback failed:', e);
                        }
                    });

                    // Tampilkan Popup jika role sesuai
                    if (['admin', 'penjual', 'owner'].includes(currentRole)) {
                        fetchLatestOrder();
                    }
                }

                setPendingCount(count);
                setLastSync(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch pending orders count:', error);
        }
    }, [pendingCount, userRole]);

    useEffect(() => {
        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 30000); // Sync every 30 seconds
        return () => clearInterval(interval);
    }, [fetchPendingCount]);

    return (
        <OrderNotificationContext.Provider value={{ pendingCount, fetchPendingCount, lastSync }}>
            {children}
            <NewOrderPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                orderData={latestOrder}
                userRole={userRole}
            />
        </OrderNotificationContext.Provider>
    );
};

export const useOrderNotification = () => {
    const context = useContext(OrderNotificationContext);
    if (!context) {
        throw new Error('useOrderNotification must be used within an OrderNotificationProvider');
    }
    return context;
};

export default OrderNotificationContext;
