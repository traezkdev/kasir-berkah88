import { Platform, NativeModules } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/api';
import { getToken } from './auth';

// Cek apakah native module ExpoPushTokenManager tersedia
// Jika tidak ada (Expo Go / web), semua fungsi notifikasi akan dilewati
const isNativeNotificationSupported = () => {
    return Platform.OS !== 'web' && !!NativeModules.ExpoPushTokenManager;
};

export const registerForPushNotificationsAsync = async () => {
    if (!isNativeNotificationSupported()) {
        console.log('[Notifications] Native module tidak tersedia, dilewati.');
        return null;
    }

    try {
        const Notifications = require('expo-notifications');
        const Device = require('expo-device');

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

        const tokenResponse = await Notifications.getExpoPushTokenAsync({
            projectId: 'd6c9dda3-051f-48a7-a7d1-8c1b786a6764',
        });
        const token = tokenResponse.data;
        console.log('[Notifications] Token FCM:', token);

        if (token) {
            await saveTokenToServer(token);
        }
        return token;
    } catch (error) {
        console.log('[Notifications] Error (dilewati):', error.message);
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
    if (!isNativeNotificationSupported()) {
        console.log('[Notifications] Native module tidak tersedia, listener dilewati.');
        return null;
    }

    try {
        const Notifications = require('expo-notifications');

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
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
