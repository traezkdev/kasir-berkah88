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

        // Perhitungan biaya
        const pointsDiscount = parseFloat(order.points_used || 0);
        const promoDiscount = parseFloat(order.promo_discount || 0);
        const finalTotal = parseFloat(order.total || 0);

        // Menghitung subtotal kotor (sebelum diskon poin & promo)
        const subtotalGross = finalTotal + pointsDiscount + promoDiscount;

        const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

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
                            <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Rincian Pesanan:</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                ${items.map(item => {
                const discText = item.discount > 0 ? `<br/><span style="color: #ef4444; font-size: 12px;">(Disc. ${item.discount}${item.discount <= 100 ? '%' : ''})</span>` : '';
                return `
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                                            <strong>${item.name}</strong> x${item.quantity}${discText}
                                        </td>
                                        <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">${formatCurrency(item.subtotal)}</td>
                                    </tr>
                                    `;
            }).join('')}
                            </table>
                            
                            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                                <tr>
                                    <td style="padding: 4px 0; font-size: 14px;">Subtotal</td>
                                    <td style="text-align: right; padding: 4px 0; font-size: 14px;">${formatCurrency(subtotalGross)}</td>
                                </tr>
                                ${pointsDiscount > 0 ? `
                                <tr style="color: #ef4444; font-size: 14px;">
                                    <td style="padding: 4px 0;">Diskon Poin</td>
                                    <td style="text-align: right; padding: 4px 0;">-${formatCurrency(pointsDiscount)}</td>
                                </tr>` : ''}
                                ${promoDiscount > 0 ? `
                                <tr style="color: #ef4444; font-size: 14px;">
                                    <td style="padding: 4px 0;">Kupon Promo</td>
                                    <td style="text-align: right; padding: 4px 0;">-${formatCurrency(promoDiscount)}</td>
                                </tr>` : ''}
                                <tr style="border-top: 2px solid #ddd; font-size: 16px;">
                                    <td style="padding: 10px 0; font-weight: bold;">TOTAL AKHIR</td>
                                    <td style="text-align: right; padding: 10px 0; font-weight: bold; color: #059669;">${formatCurrency(finalTotal)}</td>
                                </tr>
                            </table>

                            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 13px;">
                                <p style="margin: 4px 0;"><strong>Metode Pembayaran:</strong> ${order.payment_method || 'Tunai'}</p>
                                <p style="margin: 4px 0;"><strong>Catatan:</strong> ${order.note || '-'}</p>
                            </div>
                        </div>

                        <p><strong>Info Pelanggan:</strong><br/>
                        Telp: ${order.customer_phone || '-'}<br/>
                        Alamat: ${order.customer_address || '-'}</p>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${frontendUrl}/seller/orders" style="background-color: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Kelola Pesanan</a>
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
                    statusTitle = 'Pesanan Kamu Diterima';
                    statusMsg = 'Hore! Pesanan kamu sudah kami terima dan lagi disiapkan nih. Ditunggu ya!';
                    break;
                case 'rejected':
                    statusTitle = 'Pesanan Belum Bisa Diproses';
                    statusMsg = 'Yah, maaf banget ya, pesanan kamu belum bisa kami proses sekarang. Dana atau poin kamu sudah dikembalikan otomatis kok.';
                    headerColor = '#DC2626';
                    break;
                case 'cancelled':
                    statusTitle = 'Pesanan Dibatalkan';
                    statusMsg = 'Pesanan kamu sudah berhasil dibatalkan nih. Sampai jumpa di pesanan berikutnya ya!';
                    headerColor = '#4B5563';
                    break;
                case 'completed':
                    statusTitle = 'Pesanan Sudah Selesai';
                    statusMsg = 'Pesanan kamu sudah selesai nih! Makasih banyak ya sudah jajan di Berkah 88. Semoga suka sama pesanannya!';
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
                        <p>Halo <strong>${order.customer_username || order.customer_name}</strong>,</p>
                        <p>${statusMsg}</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Ringkasan Pembayaran:</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr>
                                    <td style="padding: 6px 0;">Total Pesanan</td>
                                    <td style="text-align: right; padding: 6px 0;">${formatCurrency(subtotalGross)}</td>
                                </tr>
                                ${pointsDiscount > 0 ? `
                                <tr style="color: #ef4444;">
                                    <td style="padding: 4px 0;">Diskon Poin</td>
                                    <td style="text-align: right; padding: 4px 0;">-${formatCurrency(pointsDiscount)}</td>
                                </tr>` : ''}
                                ${promoDiscount > 0 ? `
                                <tr style="color: #ef4444;">
                                    <td style="padding: 4px 0;">Diskon Kupon</td>
                                    <td style="text-align: right; padding: 4px 0;">-${formatCurrency(promoDiscount)}</td>
                                </tr>` : ''}
                                <tr style="border-top: 1px solid #ddd; font-size: 15px;">
                                    <td style="padding: 10px 0; font-weight: bold;">Total Bayar</td>
                                    <td style="text-align: right; padding: 10px 0; font-weight: bold; color: ${headerColor};">${formatCurrency(finalTotal)}</td>
                                </tr>
                            </table>
                            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 12px;">
                                <strong>Metode Pembayaran:</strong> ${order.payment_method || 'Tunai'}
                            </div>
                        </div>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${frontendUrl}/orders" style="background-color: ${headerColor}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Pantau Pesanan</a>
                        </div>
                    </div>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; color: #888; font-size: 12px;">
                        © 2026 Kasir Berkah 88 - Jajan Enak, Hati Senang!
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
