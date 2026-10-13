import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gunakan alamat IP komputer Anda jika mengetes di HP asli (Expo Go)
// Contoh: http://192.168.1.5:4000
const localUrl = process.env.EXPO_PUBLIC_API_URL_LOCAL || 'http://localhost:4000';
const prodUrl = process.env.EXPO_PUBLIC_API_URL_PROD || 'https://api.kberkah88.my.id';

// === PILIH URL API DI SINI ===
export const API_URL = __DEV__ ? localUrl : prodUrl; // Auto (Lokal saat dev, Prod saat build)
// export const API_URL = prodUrl;                         // Paksa Production (Untuk Debugging)
// export const API_URL = localUrl;                        // Paksa Lokal (Gunakan IP komputer jika di HP asli)
// =============================

const apiService = axios.create({
    baseURL: API_URL,
    timeout: 15000, // 15 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Listener registry for 401 errors
let onUnauthorized = () => { };
export const setOnUnauthorized = (callback) => {
    onUnauthorized = callback;
};

// Interceptor untuk menambahkan token ke setiap request
apiService.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Jika data adalah FormData, hapus Content-Type default (application/json)
        // agar browser/Axios otomatis menyetel multipart/form-data beserta boundary yang valid!
        if (config.data instanceof FormData || (config.data && typeof config.data.append === 'function')) {
            if (config.headers) {
                if (typeof config.headers.delete === 'function') {
                    config.headers.delete('Content-Type');
                    config.headers.delete('content-type');
                }
                delete config.headers['Content-Type'];
                delete config.headers['content-type'];
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor untuk menangani error response (terutama 401 Unauthorized)
apiService.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            console.log('Session expired (401). clearing credentials...');
            await AsyncStorage.multiRemove(['userToken', 'userRole', 'userData']);
            onUnauthorized(); // Notify the app to logout
        } else if (error.code === 'ECONNABORTED') {
            console.log('Request timeout');
        }
        return Promise.reject(error);
    }
);

export default apiService;
