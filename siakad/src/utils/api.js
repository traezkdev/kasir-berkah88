import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor untuk menyisipkan token di setiap request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('siakad_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor untuk menangani response, terutama jika token expired
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Jika backend mengirimkan sinyal expired
            const isExpired = error.response.data.expired;

            if (isExpired) {
                toast.error("Sesi Anda telah berakhir. Silakan login kembali.");

                // Bersihkan localStorage
                localStorage.removeItem('siakad_token');
                localStorage.removeItem('siakad_user');

                // Redirect ke login menggunakan window.location karena di luar context React Router
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
