import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

class BluetoothPrinterService {
    async printReceipt(settings, transaction) {
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        };

        const formatCurrency = (val) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency', currency: 'IDR', minimumFractionDigits: 0
            }).format(val || 0);
        };

        const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; font-size: 14px; width: 300px; margin: auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .restaurant-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
              .restaurant-slogan { font-size: 12px; margin-bottom: 10px; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
              .item-row { margin-bottom: 10px; }
              .item-header { font-weight: bold; margin-bottom: 3px; }
              .item-detail { display: flex; justify-content: space-between; font-size: 13px; }
              .total-section { margin-top: 15px; }
              .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; margin-bottom: 5px; }
              .total-row-minor { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; }
              @media print {
                body { width: 100%; padding: 0; margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="restaurant-name">${settings.restaurant_name}</div>
              <div class="restaurant-slogan">${settings.restaurant_slogan}</div>
              <div class="divider"></div>
            </div>

            <div class="info-row">
              <span>No: ${transaction.id}</span>
              <span>${formatDate(transaction.timestamp)}</span>
            </div>
            <div class="divider"></div>

            ${(transaction.items || []).map(item => `
              <div class="item-row">
                <div class="item-header">${item.name}</div>
                <div class="item-detail">
                  <span>${item.quantity || item.qty} x ${formatCurrency(item.price).replace('Rp', '').trim()}</span>
                  <span>${formatCurrency((item.quantity || item.qty) * item.price).replace('Rp', '').trim()}</span>
                </div>
              </div>
            `).join('')}

            <div class="divider"></div>

            <div class="total-section">
              <div class="total-row">
                <span>TOTAL</span>
                <span>${formatCurrency(transaction.total)}</span>
              </div>
              <div class="total-row-minor">
                <span>BAYAR</span>
                <span>${formatCurrency(transaction.cash_paid || transaction.cashPaid || transaction.total)}</span>
              </div>
              <div class="total-row-minor">
                <span>KEMBALI</span>
                <span>${formatCurrency(transaction.change || 0)}</span>
              </div>
            </div>

            <div class="divider"></div>
            <div class="header" style="margin-top: 10px;">
                <strong>METODE: ${(transaction.payment_method || 'Tunai').toUpperCase()}</strong>
            </div>

            <div class="footer">
              <div>TERIMA KASIH</div>
              <div>SEMOGA BERKAH</div>
              <div style="margin-top: 5px;">${settings.restaurant_url}</div>
            </div>
          </body>
        </html>
        `;

        try {
            if (Platform.OS === 'web') {
                await Print.printAsync({ html });
            } else {
                const { uri } = await Print.printToFileAsync({ html, width: 302, height: 600 });
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) {
            console.error('Print error:', error);
            throw error;
        }
    }

    // Dummy methods for compatibility with current ReceiptModal.js
    async requestPermissions() { return true; }
    async enableBluetooth() { return true; }
    async isConnected() { return true; }
    async scanDevices() { return []; }
    async connectDevice() { return true; }
}

export default new BluetoothPrinterService();
