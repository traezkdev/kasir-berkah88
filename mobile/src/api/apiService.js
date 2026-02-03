import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gunakan alamat IP komputer Anda jika mengetes di HP asli (Expo Go)
// Contoh: http://192.168.1.5:4000
const localUrl = process.env.EXPO_PUBLIC_API_URL_LOCAL || 'http://localhost:4000';
const prodUrl = process.env.EXPO_PUBLIC_API_URL_PROD || 'https://api.berkah88.id';

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

export default apiService;
