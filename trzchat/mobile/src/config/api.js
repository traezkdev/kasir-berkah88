const FORCE_PROD = true; // Ubah ke true untuk paksa pakai API produksi saat debug dan false untuk pakai API lokal

const BASE_URL = (__DEV__ && !FORCE_PROD)
    ? 'http://192.168.1.2:5000'
    : 'https://api2.inviteshare.my.id';

export const API_URL = `${BASE_URL}/api`;
export const SOCKET_URL = BASE_URL;
export const IS_PROD = BASE_URL.startsWith('https');

// Helper untuk memperbaiki URL yang salah dari database (localhost/127.0.0.1)
export const fixUrl = (url) => {
    if (!url) return url;
    let fixedUrl = url;
    if (fixedUrl.includes('localhost') || fixedUrl.includes('127.0.0.1')) {
        fixedUrl = fixedUrl.replace(/http:\/\/localhost:5000|http:\/\/127.0.0.1:5000/g, BASE_URL);
    }
    // Jika path diawali dengan /, tambahkan BASE_URL
    if (fixedUrl.startsWith('/')) {
        fixedUrl = `${BASE_URL}${fixedUrl}`;
    }
    // Force HTTPS in production for Android compatibility
    if (IS_PROD && fixedUrl.startsWith('http://')) {
        fixedUrl = fixedUrl.replace('http://', 'https://');
    }
    return fixedUrl;
};
