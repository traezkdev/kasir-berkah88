const OneSignal = require('onesignal-node');

// Inisialisasi client OneSignal
// Gantilah ONESIGNAL_APP_ID dan ONESIGNAL_API_KEY di file .env Anda
const client = new OneSignal.Client(
    process.env.ONESIGNAL_APP_ID || 'YOUR_APP_ID',
    process.env.ONESIGNAL_API_KEY || 'YOUR_REST_API_KEY'
);

/**
 * Mengirim notifikasi push ke user tertentu atau semua user
 * @param {string} message - Isi pesan notifikasi
 * @param {string} heading - Judul notifikasi
 * @param {object} data - Data tambahan
 * @param {Array} userIds - List External User IDs (opsional)
 */
const sendPushNotification = async (message, heading = 'Kasir Berkah 88', data = {}, userIds = null) => {
    const notification = {
        contents: {
            'en': message,
            'id': message,
        },
        headings: {
            'en': heading,
            'id': heading,
        },
        data: data,
    };

    if (userIds && userIds.length > 0) {
        // Kirim ke user tertentu berdasarkan ID eksternal mereka
        notification.include_external_user_ids = userIds.map(id => id.toString());
    } else {
        // Kirim ke semua user jika tidak ada userIds
        notification.included_segments = ['All'];
    }

    try {
        const response = await client.createNotification(notification);
        console.log('OneSignal Push Sent:', response.body);
        return response;
    } catch (e) {
        console.error('OneSignal Error:', e);
    }
};

module.exports = { sendPushNotification };
