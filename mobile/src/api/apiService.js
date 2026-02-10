import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gunakan alamat IP komputer Anda jika mengetes di HP asli (Expo Go)
// Contoh: http://192.168.1.5:4000
const localUrl = process.env.EXPO_PUBLIC_API_URL_LOCAL || 'http://localhost:4000';
const prodUrl = process.env.EXPO_PUBLIC_API_URL_PROD || 'https://api.inviteshare.my.id';

export const API_URL = __DEV__ ? localUrl : prodUrl;

const apiService = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor untuk menambahkan token ke setiap request
apiService.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
            console.log('Session expired (401). Clearing token...');
            // Token kedaluwarsa atau tidak valid
            await AsyncStorage.multiRemove(['userToken', 'userRole', 'userData']);

            // Opsional: Anda bisa menambahkan event emitter di sini untuk memberitahu AuthContext agar logout
            // Tapi menghapus token biasanya cukup untuk request berikutnya gagal dan diredirect di splash/login check
        }
        return Promise.reject(error);
    }
);

export default apiService;
