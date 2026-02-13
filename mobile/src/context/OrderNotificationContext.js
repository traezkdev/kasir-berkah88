/* eslint-disable no-undef */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import apiService, { API_URL } from '../api/apiService';
import { useAuth } from './AuthContext';

// We'll use these but check for existence and platform
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { io } from 'socket.io-client';

const OrderNotificationContext = createContext();

// Available notification sounds
export const NOTIFICATION_SOUNDS = [
    { id: 'default', name: 'Standard Chime', source: { uri: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' } },
    { id: 'bell', name: 'Reception Bell', source: { uri: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' } },
    { id: 'modern', name: 'Digital Alert', source: { uri: 'https://assets.mixkit.co/active_storage/sfx/2205/2205-preview.mp3' } },
    { id: 'urgent', name: 'Triple Beep', source: { uri: 'https://assets.mixkit.co/active_storage/sfx/2350/2350-preview.mp3' } },
    { id: 'zte', name: 'ZTE Alert', source: require('../../assets/alert-sound-for-zte.mp3') },
];

const STORAGE_KEY = '@notification_sound_id';

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
    const [onlineUsers, setOnlineUsers] = useState([]); // Store online user objects {userId, role}
    const [selectedSoundId, setSelectedSoundId] = useState('default');
    const [socket, setSocket] = useState(null);
    const soundRef = useRef(null);
    const pollingInterval = useRef(null);
    const isMounted = useRef(true);

    const previousOrdersRef = useRef([]);

    // Load sound preference on mount
    useEffect(() => {
        const loadPreference = async () => {
            try {
                const savedId = await AsyncStorage.getItem(STORAGE_KEY);
                if (savedId) setSelectedSoundId(savedId);
            } catch (e) {
                console.error('Failed to load sound preference', e);
            }
        };
        loadPreference();
    }, []);

    const loadSound = async (soundId = selectedSoundId) => {
        if (Platform.OS === 'web') return;

        try {
            // Unload previous sound if exists
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const soundConfig = NOTIFICATION_SOUNDS.find(s => s.id === soundId) || NOTIFICATION_SOUNDS[0];
            const { sound } = await Audio.Sound.createAsync(soundConfig.source);

            if (isMounted.current) {
                soundRef.current = sound;
            }
        } catch (error) {
            console.warn('Failed to load notification sound:', error);
        }
    };

    const changeNotificationSound = async (soundId) => {
        setSelectedSoundId(soundId);
        await AsyncStorage.setItem(STORAGE_KEY, soundId);
        await loadSound(soundId);
        // Play once for preview
        if (soundRef.current) {
            try {
                await soundRef.current.replayAsync();
            } catch (error) {
                console.warn('Error playing preview sound:', error);
            }
        }
    };

    const playNotificationSound = async () => {
        if (Platform.OS === 'web') return;

        if (!soundRef.current) {
            await loadSound();
        }

        try {
            if (soundRef.current) {
                await soundRef.current.replayAsync();
            }
        } catch (error) {
            console.warn('Error playing sound:', error);
            await loadSound();
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
        if (!currentUser || !['admin', 'penjual', 'owner', 'kasir', 'seller'].includes(currentUser.role)) return;

        try {
            const response = await apiService.get('/api/orders?status=pending&limit=1');
            const data = response.data;
            const count = data.pagination?.totalItems || 0;

            if (isMounted.current) {
                // Gunakan functional update untuk menghindari dependensi pada pendingCount
                setPendingCount(prevCount => {
                    if (count > prevCount) {
                        playNotificationSound();
                        if (data.data && data.data.length > 0) {
                            const latestOrder = data.data[0];
                            sendLocalNotification(
                                "Pesanan Baru Masuk! 🛍️",
                                `Ada pesanan baru #${latestOrder.id} senilai Rp ${new Intl.NumberFormat('id-ID').format(latestOrder.total)}`,
                                { type: 'new_order', orderId: latestOrder.id }
                            );
                            setNewOrder(latestOrder);
                            setShowPopup(true);
                        }
                        setRefreshTrigger(t => t + 1);
                    } else if (count < prevCount) {
                        setRefreshTrigger(t => t + 1);
                    }
                    return count;
                });
                setLastSync(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch pending orders count:', error);
        }
    }, [user]); // Hanya bergantung pada user

    // Customer Logic: Check for order status updates
    const checkCustomerNotifications = useCallback(async () => {
        const currentUser = user;
        if (!currentUser) return;

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
                                body = "Pesanan Anda telah selesai dan akan segera diantar.";
                            }
                            sendLocalNotification(title, body, { type: 'order_status', orderId: order.id });
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
            console.log('--- Memulai Registrasi Push Token ---');
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('Izin notifikasi ditolak!');
                return;
            }

            const tokenResponse = await Notifications.getExpoPushTokenAsync({
                projectId: '62f9fb68-21b9-4aca-9206-5ed3e86b51b1'
            });
            const token = tokenResponse.data;
            console.log('Mobile Push Token Berhasil Didapat:', token);

            if (user) {
                try {
                    const res = await apiService.post('/api/users/push-token', { pushToken: token });
                    console.log('Token berhasil didaftarkan ke Database Server:', res.data);
                } catch (sendError) {
                    console.error('Gagal mengirim token ke server:', sendError.message);
                }
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('orders', {
                    name: 'Pesanan Baru',
                    description: 'Notifikasi untuk pesanan baru yang masuk',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                    enableVibrate: true,
                    showBadge: true,
                });

                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Umum',
                    importance: Notifications.AndroidImportance.DEFAULT,
                });
            }
        } catch (error) {
            console.warn('Error sistem registrasi push:', error);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        if (Platform.OS !== 'web') {
            loadSound();
            if (user) registerForPushNotifications();

            const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
                console.log('Notification received in foreground:', notification);
            });

            const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data;
                console.log('Notification clicked handled:', data);

                if (data) {
                    const { navigationRef } = require('../navigation/navigationRef');
                    if (navigationRef.isReady()) {
                        if (data.type === 'info') {
                            if (data.link_type === 'product' && data.link_value) {
                                navigationRef.navigate('Menu', { itemId: data.link_value });
                            } else {
                                navigationRef.navigate('InformationScreen');
                            }
                        } else if (data.type === 'chat') {
                            navigationRef.navigate('ChatScreen', {
                                senderId: data.senderId,
                                orderId: data.orderId
                            });
                        } else if ((data.type === 'order_status' || data.type === 'new_order') && data.orderId) {
                            navigationRef.navigate('OrderDetails', { orderId: data.orderId });
                        } else if (data.orderId && !data.type) {
                            // Fallback for legacy or other notifications
                            navigationRef.navigate('OrderDetails', { orderId: data.orderId });
                        }
                    }
                }
            });

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
                soundRef.current.unloadAsync().catch(() => { });
            }
        };
    }, [user]);

    useEffect(() => {
        if (user) {
            if (['admin', 'penjual', 'owner', 'kasir', 'seller'].includes(user.role)) {
                fetchPendingCount();
                pollingInterval.current = setInterval(fetchPendingCount, 8000); // 8s polling as safe backup
            } else {
                checkCustomerNotifications();
                pollingInterval.current = setInterval(checkCustomerNotifications, 8000);
            }
        }

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [user, fetchPendingCount, checkCustomerNotifications]);

    // Handle AppState changes to reconnect socket when app returns to foreground
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active') {
                console.log('[App] App kembali aktif, mengecek koneksi socket...');
                if (socket && !socket.connected) {
                    socket.connect();
                }

                // Beri jeda sedikit agar sistem internet HP siap sebelum menembak API
                setTimeout(() => {
                    if (user) {
                        setRefreshTrigger(prev => prev + 1);
                        if (['admin', 'penjual', 'owner', 'kasir', 'seller'].includes(user.role)) {
                            fetchPendingCount();
                        } else {
                            checkCustomerNotifications();
                        }
                    }
                }, 800);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, [socket, user, fetchPendingCount, checkCustomerNotifications]);

    // Socket.io initialization - Stabilized for Production
    useEffect(() => {
        if (!user || !io) return;

        // Gunakan ID yang stabil
        const activeUserId = user.id || user.userId;
        if (!activeUserId) return;

        console.log(`[Socket] Mencoba terhubung ke: ${API_URL} untuk user: ${activeUserId}`);
        const newSocket = io(API_URL, {
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: true,
            autoConnect: true
        });

        newSocket.on('connect', () => {
            console.log('[Socket] Terhubung! ID:', newSocket.id);
            newSocket.emit('user_connected', { userId: activeUserId, role: user.role });
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('[Socket] Terhubung kembali setelah', attemptNumber, 'percobaan');
            setRefreshTrigger(prev => prev + 1);
            if (user && ['admin', 'penjual', 'owner', 'kasir', 'seller'].includes(user.role)) {
                fetchPendingCount();
            } else if (user) {
                checkCustomerNotifications();
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('[Socket] Koneksi Error:', error.message);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[Socket] Terputus:', reason);
            if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
                newSocket.connect();
            }
        });

        newSocket.on('online_users', (users) => {
            console.log('[Socket] Online users updated:', users.length);
            if (isMounted.current) setOnlineUsers(users);
        });

        newSocket.on('user_status', ({ userId, role, status }) => {
            if (isMounted.current) {
                setOnlineUsers(prev => {
                    if (status === 'online') {
                        const otherUsers = prev.filter(u => String(u.userId) !== String(userId));
                        return [...otherUsers, { userId, role }];
                    } else {
                        return prev.filter(u => String(u.userId) !== String(userId));
                    }
                });
            }
        });

        newSocket.on('new_order', (order) => {
            if (isMounted.current && ['admin', 'penjual', 'owner', 'kasir', 'seller'].includes(user.role)) {
                // Selalu refresh data jika ada update pesanan baru
                setRefreshTrigger(prev => prev + 1);
                fetchPendingCount();

                // Jangan tampilkan popup jika ini adalah transaksi langsung dari POS (kasir jual)
                // ATAU jika pesanan ini dibuat oleh user yang sama (misal Owner tes order sendiri)
                if (order.is_transaction || String(order.user_id) === String(activeUserId)) {
                    console.log('[Socket] Transaksi POS atau Pesanan Sendiri, melewati popup.');
                    return;
                }

                playNotificationSound();
                setNewOrder(order);
                setShowPopup(true);
            }
        });

        newSocket.on('order_update', (data) => {
            if (isMounted.current) {
                setRefreshTrigger(prev => prev + 1);
                if (user.role === 'pelanggan') {
                    checkCustomerNotifications();
                } else {
                    fetchPendingCount();
                }
            }
        });

        newSocket.on('new_message', (message) => {
            if (!isMounted.current || !activeUserId) return;

            const myId = String(activeUserId);
            const senderId = String(message.sender_id);

            console.log(`[Socket] New Message Packet: From ${senderId} to ${message.receiver_id}. My ID: ${myId}`);

            // Validasi ketat: Jangan notif jika pengirim adalah saya sendiri
            if (senderId === myId) {
                console.log('[Socket] Pesan dari diri sendiri, abaikan notifikasi.');
                return;
            }

            const amISeller = ['admin', 'owner', 'penjual', 'kasir', 'seller'].includes(user.role);
            const isToMe = String(message.receiver_id) === myId;
            const isFromCustomer = message.sender_role === 'pelanggan' || message.sender_role === 'user';

            let shouldNotify = false;

            // Logika notifikasi:
            // 1. Jika pesan ditujukan langsung ke saya (Receiver ID match)
            // 2. ATAU saya seller, dan pesan dari customer (Broadcast style chat)
            if (isToMe) {
                shouldNotify = true;
            } else if (amISeller && isFromCustomer) {
                // Pastikan tidak ganda jika receiver_id sudah cocok
                if (!isToMe) shouldNotify = true;
            }

            if (shouldNotify) {
                playNotificationSound();
                sendLocalNotification(
                    `Pesan dari ${message.sender_name || (isFromCustomer ? 'Pelanggan' : 'Admin')}`,
                    message.message || '[Gambar]',
                    { type: 'chat', senderId: message.sender_id, orderId: message.order_id }
                );
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            setSocket(null);
        };
    }, [user?.id, user?.role, fetchPendingCount, checkCustomerNotifications]);

    const closePopup = () => setShowPopup(false);

    return (
        <OrderNotificationContext.Provider value={{
            pendingCount,
            fetchPendingCount,
            lastSync,
            newOrder,
            showPopup,
            closePopup,
            refreshTrigger,
            onlineUsers,
            selectedSoundId,
            changeNotificationSound,
            playNotificationSound,
            socket
        }}>
            {children}
        </OrderNotificationContext.Provider>
    );
};

export const useOrderNotification = () => useContext(OrderNotificationContext);
export default OrderNotificationContext;
