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

const sendNewsBroadcastEmail = async (info, customers) => {
    try {
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:4028').split(',')[0].trim();
        const subject = `📢 Kabar Berkah: ${info.title}`;

        // Base API URL to fetch images from backend
        // Priority: 1. API_URL env, 2. Derive from frontendUrl (Localhost fallback), 3. Hardcoded default from mobile config
        let apiUrl = process.env.API_URL;

        if (!apiUrl) {
            if (frontendUrl.includes('localhost')) {
                apiUrl = 'http://localhost:4000';
            } else {
                // Gunakan default yang ada di mobile/src/api/apiService.js sebagai fallback terakhir
                apiUrl = 'https://api.inviteshare.my.id';
            }
        }

        // Clean API URL from trailing slash
        const baseApiUrl = apiUrl.replace(/\/$/, '');

        // Prepare image URL
        let infoImageUrl = null;
        if (info.image_url) {
            if (info.image_url.startsWith('http')) {
                infoImageUrl = info.image_url;
            } else {
                // Ensure image path starts with single slash
                const cleanImagePath = info.image_url.startsWith('/') ? info.image_url : `/${info.image_url}`;
                infoImageUrl = `${baseApiUrl}${cleanImagePath}`;
            }
        }

        // Prepare content: Convert newlines to <br/> for better email client compatibility
        const formattedContent = info.content ? info.content.replace(/\n/g, '<br/>') : '';

        const htmlTemplate = (customerName) => `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1E293B; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Kabar Berkah Terbaru!</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-weight: 500;">Jangan sampai ketinggalan info menarik hari ini</p>
                </div>
                
                ${infoImageUrl ? `
                <div style="width: 100%; text-align: center; background-color: #f8fafc;">
                    <img src="${infoImageUrl}" alt="${info.title}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">
                </div>
                ` : ''}

                <div style="padding: 30px;">
                    <h2 style="margin-top: 10px; color: #0F172A; font-size: 22px; font-weight: 700; border-left: 4px solid #10B981; padding-left: 15px;">${info.title}</h2>
                    <p style="color: #64748B; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                        Halo <strong>${customerName}</strong>,
                    </p>
                    <div style="color: #334155; font-size: 16px; line-height: 1.7;">${formattedContent}</div>
                    
                    <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                        <a href="${frontendUrl}" style="background-color: #10B981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);">Buka Aplikasi</a>
                    </div>
                </div>

                <div style="background-color: #F8FAFC; padding: 25px; text-align: center; border-top: 1px solid #E2E8F0;">
                    <p style="margin: 0; color: #94A3B8; font-size: 14px; font-weight: 600;">© 2026 Kasir Berkah 88</p>
                    <p style="margin: 5px 0 0 0; color: #CBD5E1; font-size: 12px;">Jajan Enak, Hati Senang!</p>
                </div>
            </div>
        `;

        // Send to all customers with email
        for (const customer of customers) {
            if (customer.email) {
                await sendEmail(customer.email, subject, htmlTemplate(customer.username || 'Pelanggan Setia'));
            }
        }
        return { success: true };
    } catch (error) {
        console.error('Error in sendNewsBroadcastEmail:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendOrderEmailNotification, sendNewsBroadcastEmail };
