import { Platform } from 'react-native';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { API_URL } from '../config/api';
import { getToken } from './auth';

// Konfigurasi tampilan notifikasi saat aplikasi terbuka (foreground)
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        const data = notification.request.content.data;
        // Panggilan masuk: tampilkan selalu, termasuk saat app aktif
        const isCall = data?.channelId === 'calls' || data?.type === 'incoming_call';
        return {
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: !isCall, // Badge hanya untuk pesan
            shouldShowAlert: true,   // Tambahan: force alert di iOS
        };
    },
});

// Helper: cek apakah platform didukung (tidak web)
const isSupported = () => Platform.OS !== 'web';

// Daftarkan dan buat semua channel notifikasi Android
const setupAndroidChannels = async () => {
    if (Platform.OS !== 'android') return;

    // Channel untuk pesan masuk
    await Notifications.setNotificationChannelAsync('messages', {
        name: 'Pesan Masuk',
        description: 'Notifikasi untuk pesan chat baru',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
    });

    // Channel khusus panggilan - Prioritas MAXIMUM agar muncul di lockscreen
    await Notifications.setNotificationChannelAsync('calls', {
        name: 'Panggilan Masuk',
        description: 'Notifikasi untuk panggilan suara dan video masuk',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 500, 500, 500, 500],
        lightColor: '#25D366',
        enableVibrate: true,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
        enableLights: true,
        bypassDnd: true, // Lewati mode senyap untuk panggilan
    });

    // Pertahankan channel 'default' untuk kompatibilitas mundur
    await Notifications.setNotificationChannelAsync('default', {
        name: 'Umum',
        importance: Notifications.AndroidImportance.DEFAULT,
        showBadge: true,
    });

    console.log('[Notifications] Android channels berhasil dibuat.');
};

export const registerForPushNotificationsAsync = async () => {
    if (!isSupported()) {
        console.log('[Notifications] Platform web tidak didukung, dilewati.');
        return null;
    }

    try {
        console.log('[Notifications] Memulai pendaftaran token...');

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Izin notifikasi ditolak pengguna.');
            return null;
        }

        // Siapkan semua channel Android
        await setupAndroidChannels();

        // Dapatkan Token FCM perangkat
        const tokenResponse = await Notifications.getDevicePushTokenAsync();
        const token = tokenResponse.data;

        console.log('[Notifications] Token FCM:', token ? 'Berhasil didapat' : 'Gagal');

        if (token) {
            await saveTokenToServer(token);
        }
        return token;
    } catch (error) {
        console.log('[Notifications] Error saat pendaftaran:', error.message);
        return null;
    }
};

const saveTokenToServer = async (token) => {
    try {
        const authToken = await getToken();
        if (!authToken) {
            console.log('[Notifications] Skip simpan token: User belum login');
            return;
        }

        await axios.post(`${API_URL}/users/fcm-token`, { token }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('[Notifications] Token FCM berhasil disinkron ke server');
    } catch (error) {
        console.log('[Notifications] Gagal simpan token ke server:', error.message);
    }
};

/**
 * Setup listener notifikasi.
 * @param {Function} onCallNotification - Callback dipanggil saat notifikasi panggilan masuk diklik.
 *   Menerima payload: { callerId, callerName, callerAvatar, callType }
 */
export const setupNotificationListeners = (onCallNotification) => {
    if (!isSupported()) return null;

    try {
        // Listener: User mengklik notifikasi (saat app di background/killed)
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log('[Notifications] Notifikasi diklik:', data);

            // Jika notifikasi panggilan diklik, panggil callback untuk navigasi
            if ((data?.type === 'incoming_call' || data?.channelId === 'calls') && onCallNotification) {
                onCallNotification({
                    callerId: data.callerId,
                    callerName: data.callerName,
                    callerAvatar: data.callerAvatar,
                    callType: data.callType || 'audio',
                });
            }
        });

        // Listener: Notifikasi diterima saat app aktif di foreground
        const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
            const data = notification.request.content.data;
            console.log('[Notifications] Notifikasi diterima di foreground:', data?.type);
        });

        console.log('[Notifications] Listeners berhasil dipasang.');

        // Kembalikan fungsi cleanup untuk dipanggil di useEffect
        return () => {
            responseSubscription.remove();
            foregroundSubscription.remove();
        };
    } catch (error) {
        console.log('[Notifications] Error saat setup listener:', error.message);
        return null;
    }
};

