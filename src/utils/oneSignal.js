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
            },
            // Konfigurasi eksplisit untuk Service Worker
            serviceWorkerPath: "OneSignalSDKWorker.js",
            serviceWorkerParam: { scope: "/" }
        });

        console.log("OneSignal Berhasil Diinisialisasi");

        // Pancing popup muncul jika belum berlangganan
        let isEnabled = false;
        if (typeof OneSignal.User?.PushSubscription?.optedIn !== 'undefined') {
            isEnabled = OneSignal.User.PushSubscription.optedIn;
        } else if (typeof OneSignal.isPushNotificationsEnabled === 'function') {
            isEnabled = await OneSignal.isPushNotificationsEnabled();
        }

        if (!isEnabled) {
            await OneSignal.showSlidedownPrompt();
        }

    } catch (error) {
        // Abaikan error "already initialized" yang mungkin muncul di development (HMR)
        if (error.message && error.message.includes("already initialized")) {
            return;
        }

        // Tangani error Domain Mismatch (biasanya di localhost)
        if (error.message && error.message.includes("Can only be used on")) {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isLocalhost) {
                console.warn("OneSignal: Domain mismatch terdeteksi di localhost. Fitur notifikasi push tidak akan aktif di environment development kecuali dikonfigurasi di dashboard OneSignal.");
            } else {
                console.error("OneSignal Domain Error:", error.message);
            }
            return;
        }

        console.error("OneSignal Init Error:", error);
    }
};

/**
 * Menghubungkan OneSignal dengan user ID aplikasi
 * @param {string} userId - ID User dari aplikasi kita
 */
export const setOneSignalUser = async (userId) => {
    if (!userId) return;

    try {
        // Tunggu inisialisasi selesai jika perlu
        if (!OneSignal.initialized) {
            await initOneSignal();
        }

        const userIdStr = userId.toString();

        // OneSignal Web SDK v16+ menggunakan login()
        if (typeof OneSignal.login === 'function') {
            await OneSignal.login(userIdStr);
            console.log("OneSignal: User logged in with ID", userIdStr);
        }
        // Versi lama menggunakan setExternalUserId()
        else if (typeof OneSignal.setExternalUserId === 'function') {
            await OneSignal.setExternalUserId(userIdStr);
            console.log("OneSignal: External User ID set to", userIdStr);
        } else {
            console.warn("OneSignal: Tidak dapat menemukan metode login atau setExternalUserId. Versi SDK mungkin tidak sesuai.");
        }
    } catch (error) {
        // Jangan biarkan error OneSignal menghentikan proses login aplikasi
        console.warn("OneSignal Login Error (Abaikan jika di localhost):", error);
    }
};
