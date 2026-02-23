import { Platform, NativeModules } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/api';
import { getToken } from './auth';

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
        const Notifications = require('expo-notifications');
        const Device = require('expo-device');

        console.log('[Notifications] Memulai pendaftaran...');

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (!Device.isDevice) {
            console.log('[Notifications] Harus menggunakan perangkat fisik.');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Izin notifikasi ditolak.');
            return null;
        }

        // Ganti getExpoPushTokenAsync dengan getDevicePushTokenAsync untuk mendapatkan FCM Token asli
        // karena backend menggunakan firebase-admin (messaging().send)
        const tokenResponse = await Notifications.getDevicePushTokenAsync();
        const token = tokenResponse.data;

        console.log('[Notifications] Token FCM Asli:', token);

        if (token) {
            await saveTokenToServer(token);
        }
        return token;
    } catch (error) {
        console.log('[Notifications] Error saat register:', error.message);
        return null;
    }
};

const saveTokenToServer = async (token) => {
    try {
        const authToken = await getToken();
        if (!authToken) return;

        await axios.post(`${API_URL}/users/fcm-token`, { token }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('[Notifications] Token FCM berhasil disimpan ke server');
    } catch (error) {
        console.log('[Notifications] Gagal simpan token ke server:', error.message);
    }
};

export const setupNotificationListeners = () => {
    if (!isSupported()) {
        console.log('[Notifications] Web tidak mendukung listener native, dilewati.');
        return null;
    }

    try {
        const Notifications = require('expo-notifications');

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });

        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log('[Notifications] Notifikasi diklik:', data);
        });

        return subscription;
    } catch (error) {
        console.log('[Notifications] Error setup listener (dilewati):', error.message);
        return null;
    }
};
