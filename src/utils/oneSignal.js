import OneSignal from 'react-onesignal';

/**
 * Inisialisasi OneSignal
 */
export const initOneSignal = async () => {
    // Hindari inisialisasi ganda
    if (OneSignal.initialized) {
        return;
    }

    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

    // Jangan inisialisasi jika App ID masih default atau kosong
    if (!appId || appId === "YOUR_APP_ID") {
        console.warn("OneSignal App ID belum dikonfigurasi di .env");
        return;
    }

    try {
        await OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
                enable: false,
            },
            welcomeNotification: {
                title: "Kasir Berkah 88",
                message: "Terima kasih telah mengaktifkan notifikasi!",
            }
        });
        console.log("OneSignal Berhasil Diinisialisasi");
    } catch (error) {
        // Abaikan error "already initialized" yang mungkin muncul di development (HMR)
        if (error.message && error.message.includes("already initialized")) {
            return;
        }
        console.error("OneSignal Init Error:", error);
    }
};

/**
 * Menghubungkan OneSignal dengan user ID aplikasi
 * @param {string} userId - ID User dari aplikasi kita
 */
export const setOneSignalUser = (userId) => {
    if (userId) {
        OneSignal.setExternalUserId(userId.toString());
    }
};
