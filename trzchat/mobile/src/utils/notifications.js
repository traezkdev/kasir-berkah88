import { Platform } from 'react-native';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { API_URL } from '../config/api';
import { getToken } from './auth';

// Konfigurasi bagaimana notifikasi ditampilkan saat aplikasi terbuka (foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// Fungsi pembantu untuk cek dukungan platform
const isSupported = () => {
    return Platform.OS !== 'web';
};

export const registerForPushNotificationsAsync = async () => {
    if (!isSupported()) {
        console.log('[Notifications] Platform tidak didukung (Web), dilewati.');
        return null;
    }

    try {
        console.log('[Notifications] Memulai pendaftaran token...');

        if (!Device.isDevice) {
            console.log('[Notifications] Perhatian: Harus menggunakan perangkat fisik untuk push notifications.');
            // Tetap lanjut untuk mencoba mendapatkan token jika ini adalah dev client di device
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Izin notifikasi ditolak oleh pengguna.');
            return null;
        }

        // Pastikan channel android sudah siap
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Pesan Masuk',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6366F1',
                enableVibrate: true,
                showBadge: true,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            });
        }

        // Dapatkan Project ID dari config untuk stabilitas di Expo Dev Client
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;

        // Dapatkan Token FCM Asli untuk backend firebase-admin
        const tokenResponse = await Notifications.getDevicePushTokenAsync();
        const token = tokenResponse.data;

        console.log('[Notifications] Token FCM didapatkan:', token ? 'Berhasil' : 'Gagal');

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
        console.log('[Notifications] Token FCM berhasil sinkron ke server');
    } catch (error) {
        console.log('[Notifications] Gagal kirim token ke server:', error.message);
    }
};

export const setupNotificationListeners = () => {
    if (!isSupported()) return null;

    try {
        // Listener untuk notifikasi yang diklik (Saat aplikasi di background/killed dan dibuka via notif)
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log('[Notifications] Aktivitas: Notifikasi diklik', data);
        });

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'Pesan Masuk',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6366F1',
                enableVibrate: true,
                showBadge: true,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            }).catch(err => console.log('[Notifications] Gagal buat channel:', err.message));
        }

        return subscription;
    } catch (error) {
        console.log('[Notifications] Error saat setup listener:', error.message);
        return null;
    }
};

