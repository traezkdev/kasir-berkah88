/* eslint-disable no-undef */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import apiService, { API_URL } from '../api/apiService';
import { useAuth } from './AuthContext';

// We'll use these but check for existence and platform
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { io } from 'socket.io-client';

const OrderNotificationContext = createContext();

// Configure notification behavior for mobile only
try {
    if (Platform.OS !== 'web' && Notifications && typeof Notifications.setNotificationHandler === 'function') {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    }
} catch (error) {
    console.warn('OrderNotification: Notifications setup inhibited:', error);
}

export const OrderNotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSync, setLastSync] = useState(null);
    const [newOrder, setNewOrder] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const soundRef = useRef(null);
    const pollingInterval = useRef(null);
    const socketRef = useRef(null);
    const isMounted = useRef(true);

    const previousOrdersRef = useRef([]);

    const loadSound = async () => {
        if (Platform.OS === 'web' || !Audio || !Audio.Sound) return;
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' }
            );
            if (isMounted.current) soundRef.current = sound;
        } catch (error) {
            console.warn('Failed to load notification sound:', error);
        }
    };

    const playNotificationSound = async () => {
        if (Platform.OS === 'web' || !soundRef.current) return;
        try {
            await soundRef.current.replayAsync();
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    };

    const sendLocalNotification = async (title, body, data = {}) => {
        if (Platform.OS === 'web' || !Notifications || !Notifications.scheduleNotificationAsync) return;
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: title,
                    body: body,
                    data: data,
                },
                trigger: null,
            });
        } catch (error) {
            console.error('Error sending local notification:', error);
        }
    };

    // Seller Logic: Check for new pending orders
    const fetchPendingCount = useCallback(async () => {
        const currentUser = user;
        if (!currentUser || !['admin', 'penjual', 'owner'].includes(currentUser.role)) return;

        try {
            const response = await apiService.get('/api/orders?status=pending&limit=1');
            const data = response.data;
            const count = data.pagination?.totalItems || 0;

            if (isMounted.current) {
                if (count > pendingCount) {
                    playNotificationSound();
                    if (data.data && data.data.length > 0) {
                        const latestOrder = data.data[0];
                        sendLocalNotification(
                            "Pesanan Baru Masuk! 🛍️",
                            `Ada pesanan baru #${latestOrder.id} senilai Rp ${new Intl.NumberFormat('id-ID').format(latestOrder.total)}`,
                            { orderId: latestOrder.id }
                        );
                        setNewOrder(latestOrder);
                        setShowPopup(true);
                    }
                    setRefreshTrigger(prev => prev + 1);
                } else if (count < pendingCount) {
                    setRefreshTrigger(prev => prev + 1);
                }

                setPendingCount(count);
                setLastSync(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch pending orders count:', error);
        }
    }, [pendingCount, user]);

    // Customer Logic: Check for order status updates
    const checkCustomerNotifications = useCallback(async () => {
        const currentUser = user;
        if (!currentUser) return;
        // Only customers or logged in users who aren't exclusively sellers might care? 
        // Actually, sellers might also want status updates if they follow their own orders?
        // But the prompt says "Admin/User: all, Pelanggan: their own".

        try {
            const response = await apiService.get('/api/orders?limit=10');
            if (response.data && response.data.data && isMounted.current) {
                const currentOrders = response.data.data;
                const prevOrders = previousOrdersRef.current;

                if (prevOrders.length > 0) {
                    currentOrders.forEach((order) => {
                        const prevOrder = prevOrders.find(o => o.id === order.id);
                        if (prevOrder && prevOrder.status !== order.status) {
                            playNotificationSound();
                            let title = `Update Pesanan #${order.id}`;
                            let body = `Status pesanan Anda berubah menjadi ${order.status}.`;

                            if (order.status === 'accepted') {
                                title = "Pesanan Diterima! 👨‍🍳";
                                body = "Yeay! Pesanan Anda telah diterima dan sedang disiapkan.";
                            } else if (order.status === 'rejected') {
                                title = "Pesanan Ditolak ❌";
                                body = "Maaf, pesanan Anda tidak dapat diproses saat ini.";
                            } else if (order.status === 'completed') {
                                title = "Pesanan Selesai ✅";
                                body = "Pesanan Anda telah selesai. Terima kasih telah berbelanja!";
                            }
                            sendLocalNotification(title, body, { orderId: order.id });
                        }
                    });
                }
                previousOrdersRef.current = currentOrders;
            }
        } catch (error) {
            console.error('Failed to check customer notifications:', error);
        }
    }, [user]);

    const registerForPushNotifications = async () => {
        if (Platform.OS === 'web' || !Notifications || !Notifications.getPermissionsAsync) return;

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') return;

            const tokenResponse = await Notifications.getExpoPushTokenAsync({
                projectId: '62f9fb68-21b9-4aca-9206-5ed3e86b51b1' // Match projectId from app.json
            });
            const token = tokenResponse.data;
            console.log('Mobile Push Token:', token);

            if (user && isMounted.current) {
                const res = await apiService.post('/api/users/push-token', { pushToken: token });
                console.log('Push token registration response:', res.data);
            }

            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }
        } catch (error) {
            console.warn('Push registration error:', error);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        if (Platform.OS !== 'web') {
            loadSound();
            if (user) registerForPushNotifications();

            // Handle notification that arrives while app is open
            const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
                console.log('Notification received in foreground:', notification);
            });

            // Handle notification interaction (click)
            const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data;
                console.log('Notification clicked:', data);
            });

            // Re-register if token changes
            const tokenSubscription = Notifications.addPushTokenListener(newToken => {
                console.log('Push token changed while running:', newToken.data);
                if (user) {
                    apiService.post('/api/users/push-token', { pushToken: newToken.data })
                        .catch(e => console.error('Token re-registration failed:', e));
                }
            });

            return () => {
                foregroundSubscription.remove();
                responseSubscription.remove();
                tokenSubscription.remove();
            };
        }

        return () => {
            isMounted.current = false;
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, [user]);

    useEffect(() => {
        if (user) {
            if (['admin', 'penjual', 'owner', 'kasir'].includes(user.role)) {
                fetchPendingCount();
                pollingInterval.current = setInterval(fetchPendingCount, 8000); // 8s untuk response lebih cepat
            } else {
                checkCustomerNotifications();
                pollingInterval.current = setInterval(checkCustomerNotifications, 8000);
            }
        }

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [user, fetchPendingCount, checkCustomerNotifications]);

    // Socket.io initialization with better reconnection
    useEffect(() => {
        if (!user || !io) return;

        const socket = io(API_URL, {
            transports: ['websocket', 'polling'], // Fallback ke polling jika websocket gagal
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: true
        });

        socket.on('connect', () => {
            console.log('Socket.io connected:', socket.id);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                // Server memutuskan koneksi, reconnect manual
                socket.connect();
            }
        });

        socket.on('new_order', (order) => {
            if (isMounted.current && ['admin', 'penjual', 'owner', 'kasir'].includes(user.role)) {
                console.log('New order received via socket:', order.id);
                playNotificationSound();
                setNewOrder(order);
                setShowPopup(true);
                setRefreshTrigger(prev => prev + 1);
                // Fetch ulang untuk memastikan data sinkron
                fetchPendingCount();
            }
        });

        socket.on('order_update', (data) => {
            if (isMounted.current) {
                console.log('Order update received via socket:', data);
                setRefreshTrigger(prev => prev + 1);
                if (user.role === 'pelanggan') {
                    checkCustomerNotifications();
                } else {
                    fetchPendingCount();
                }
            }
        });

        socketRef.current = socket;

        return () => {
            if (socket) {
                socket.removeAllListeners();
                socket.disconnect();
            }
        };
    }, [user, checkCustomerNotifications, fetchPendingCount]);

    const closePopup = () => setShowPopup(false);

    return (
        <OrderNotificationContext.Provider value={{
            pendingCount,
            fetchPendingCount,
            lastSync,
            newOrder,
            showPopup,
            closePopup,
            refreshTrigger
        }}>
            {children}
        </OrderNotificationContext.Provider>
    );
};

export const useOrderNotification = () => useContext(OrderNotificationContext);
export default OrderNotificationContext;
