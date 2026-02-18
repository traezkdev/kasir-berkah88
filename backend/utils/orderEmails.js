const sendEmail = require('./mailer');
const db = require('../database');

/**
 * Send email notification for order related events
 * @param {number} orderId - ID of the order
 * @param {string} type - Type of notification ('new_order', 'status_update')
 * @param {string} status - Current status of the order
 */
const sendOrderEmailNotification = async (orderId, type, status = null) => {
    try {
        // Fetch order details
        const [orderRows] = await db.query(`
            SELECT o.*, u.email as customer_email, u.username as customer_username 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            WHERE o.id = ?
        `, [orderId]);

        if (orderRows.length === 0) return { success: false, error: 'Order not found' };

        const order = orderRows[0];
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        const totalAmount = parseFloat(order.total || 0);
        const totalFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount);

        // Get primary frontend URL from potentially comma-separated list
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

        // --- 1. Notification for NEW ORDER (Send to Sellers/Admin) ---
        if (type === 'new_order') {
            const [sellers] = await db.query("SELECT email FROM users WHERE role IN ('admin', 'owner', 'penjual', 'kasir') AND email IS NOT NULL");

            if (sellers.length === 0) return { success: true, message: 'No sellers with email found' };

            const subject = `🔔 Pesanan Baru Masuk! - #${orderId}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">Pesanan Baru!</h1>
                        <p style="margin: 5px 0 0 0;">ID Pesanan: #${orderId}</p>
                    </div>
                    <div style="padding: 20px;">
                        <p>Halo Tim Berkah 88,</p>
                        <p>Ada pesanan baru masuk dari <strong>${order.customer_name}</strong>.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Detail Pesanan:</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                ${items.map(item => `
                                    <tr>
                                        <td style="padding: 5px 0;">${item.name} x${item.quantity}</td>
                                        <td style="text-align: right; padding: 5px 0;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.subtotal)}</td>
                                    </tr>
                                `).join('')}
                                <tr style="border-top: 2px solid #ddd;">
                                    <td style="padding: 10px 0; font-weight: bold;">TOTAL</td>
                                    <td style="text-align: right; padding: 10px 0; font-weight: bold; color: #059669;">${totalFormatted}</td>
                                </tr>
                            </table>
                        </div>

                        <p><strong>Info Pelanggan:</strong><br/>
                        Nama: ${order.customer_name}<br/>
                        Telp: ${order.customer_phone || '-'}<br/>
                        Alamat: ${order.customer_address || '-'}</p>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${frontendUrl}/seller/orders" style="background-color: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Lihat Daftar Pesanan</a>
                        </div>
                    </div>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; color: #888; font-size: 12px;">
                        © 2026 Kasir Berkah 88 - Aplikasi POS Amanah
                    </div>
                </div>
            `;

            // Send to all sellers
            for (const seller of sellers) {
                await sendEmail(seller.email, subject, html);
            }
            return { success: true };
        }

        // --- 2. Notification for STATUS UPDATE (Send to Customer) ---
        if (type === 'status_update' && order.customer_email) {
            let statusTitle = '';
            let statusMsg = '';
            let headerColor = '#059669';

            switch (status) {
                case 'accepted':
                    statusTitle = 'Pesanan Diterima';
                    statusMsg = 'Kabar baik! Pesanan Anda telah diterima dan sekarang sedang kami siapkan. Mohon ditunggu ya!';
                    break;
                case 'rejected':
                    statusTitle = 'Pesanan Ditolak';
                    statusMsg = 'Mohon maaf, pesanan Anda tidak dapat kami proses saat ini. Dana/Poin (jika ada) telah dikembalikan ke akun Anda.';
                    headerColor = '#DC2626';
                    break;
                case 'cancelled':
                    statusTitle = 'Pesanan Dibatalkan';
                    statusMsg = 'Pesanan Anda telah berhasil dibatalkan sesuai permintaan.';
                    headerColor = '#4B5563';
                    break;
                case 'completed':
                    statusTitle = 'Pesanan Selesai';
                    statusMsg = 'Alhamdulillah, pesanan Anda telah selesai. Terima kasih telah berbelanja di Berkah 88! Semoga berkah.';
                    break;
                default:
                    return { success: false, error: 'Invalid status for email' };
            }

            const subject = `📦 Update Pesanan Berkah 88 - ${statusTitle} (#${orderId})`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: ${headerColor}; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">${statusTitle}</h1>
                        <p style="margin: 5px 0 0 0;">ID Pesanan: #${orderId}</p>
                    </div>
                    <div style="padding: 20px;">
                        <p>Assalamu’alaikum <strong>${order.customer_username || order.customer_name}</strong>,</p>
                        <p>${statusMsg}</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Ringkasan Pesanan:</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 5px 0;">Status Saat Ini:</td>
                                    <td style="text-align: right; padding: 5px 0; font-weight: bold; color: ${headerColor};">${status.toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0;">Total Bayar:</td>
                                    <td style="text-align: right; padding: 5px 0; font-weight: bold;">${totalFormatted}</td>
                                </tr>
                            </table>
                        </div>

                        <p style="font-size: 14px; color: #666;">Anda dapat memantau status pesanan kapan saja melalui aplikasi atau website kami.</p>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${frontendUrl}/orders" style="background-color: ${headerColor}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Lihat Riwayat Pesanan</a>
                        </div>
                    </div>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; color: #888; font-size: 12px;">
                        © 2026 Kasir Berkah 88 - Jajan Enak, Hati Tenang, Hidup Berkah
                    </div>
                </div>
            `;

            await sendEmail(order.customer_email, subject, html);
            return { success: true };
        }

        return { success: false, error: 'Condition not met (e.g. no customer email)' };
    } catch (error) {
        console.error('Error in sendOrderEmailNotification:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendOrderEmailNotification };
