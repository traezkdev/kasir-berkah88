const axios = require('axios');

/**
 * Mengirim notifikasi push menggunakan Expo Push Service
 * @param {Array|string} pushTokens - Satu atau lebih Expo Push Token
 * @param {string} title - Judul notifikasi
 * @param {string} body - Isi pesan notifikasi
 * @param {object} data - Data tambahan (opsional)
 */
const sendExpoPushNotification = async (pushTokens, title, body, data = {}) => {
    if (!pushTokens || (Array.isArray(pushTokens) && pushTokens.length === 0)) {
        return;
    }

    const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];

    // Filter token yang valid (harus mulai dengan ExponentPushToken atau ExpoPushToken)
    const validTokens = tokens.filter(token =>
        token && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
    );

    if (validTokens.length === 0) return;

    const messages = validTokens.map(token => {
        const type = data.type || 'default';
        let channelId = 'default';

        if (type === 'incoming_call') channelId = 'calls';
        else if (type === 'orders' || type === 'new_order') channelId = 'orders';

        return {
            to: token,
            sound: 'default',
            title: title,
            body: body,
            data: data,
            priority: 'high',
            channelId: channelId,
        };
    });

    try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send', messages, {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        });

        console.log('Expo Push Sent:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending Expo Push Notification:', error.response ? error.response.data : error.message);
    }
};

module.exports = { sendExpoPushNotification };
