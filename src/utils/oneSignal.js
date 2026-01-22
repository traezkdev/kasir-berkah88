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
        return;
    }

    try {
        await OneSignal.init({
            appId: appId,
            safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
                enable: false,
            },
            // Tambahkan konfigurasi prompt
            promptOptions: {
                slidedown: {
                    prompts: [
                        {
                            type: "push",
                            autoPrompt: true,
                            text: {
                                actionMessage: "Kami ingin mengirimkan notifikasi untuk pesanan baru dan laporan harian.",
                                acceptButton: "Izinkan",
                                cancelButton: "Nanti Saja",
                            },
                            delay: {
                                pageViews: 1,
                                timeDelay: 5,
                            }
                        }
                    ]
                }
            },
            welcomeNotification: {
                title: "Kasir Berkah 88",
                message: "Terima kasih telah mengaktifkan notifikasi!",
            }
        });

        console.log("OneSignal Berhasil Diinisialisasi");

        // Pancing popup muncul jika belum berlangganan
        if (!OneSignal.isPushNotificationsEnabled()) {
            await OneSignal.showSlidedownPrompt();
        }

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
