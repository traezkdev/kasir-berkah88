import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    Platform,
    Share,
    ActivityIndicator,
    Alert,
    StatusBar,
    useWindowDimensions
} from 'react-native';
import { X, Printer, Share2, CheckCircle2, ShoppingCart, MessageSquare, Zap, ShieldCheck, Download, Copy, User, Phone, MapPin, AlertCircle, XCircle, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from '../utils/safeArea';
import apiService, { API_URL } from '../api/apiService';
// import { useToast } from '../context/ToastContext';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing'; // Import Sharing
import BluetoothPrinter from '../utils/BluetoothPrinter';
import PrinterSelectionModal from './PrinterSelectionModal';
import { getReceiptTheme } from './ReceiptThemes';

const { width } = Dimensions.get('window');

const ReceiptModal = ({ visible, onClose, transaction }) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [settings, setSettings] = useState({
        restaurant_name: 'Berkah 88',
        restaurant_slogan: 'Kasir Pintar & Berkah',
        restaurant_url: 'www.berkah88.id',
    });
    const [logoUrl, setLogoUrl] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [mobileReceiptUiVersion, setMobileReceiptUiVersion] = useState('1');
    // const { showToast } = useToast();
    const [localToast, setLocalToast] = useState({ visible: false, message: '', type: 'success' });

    // Aktifkan tema berdasarkan versi yang dipilih admin
    const { styles: t, colors: tc } = useMemo(
        () => getReceiptTheme(mobileReceiptUiVersion),
        [mobileReceiptUiVersion]
    );

    const showToast = (message, type = 'success') => {
        setLocalToast({ visible: true, message, type });
        setTimeout(() => setLocalToast(prev => ({ ...prev, visible: false })), 3000);
    };
    const [showPrinterModal, setShowPrinterModal] = useState(false);
    const receiptRef = React.useRef();

    useEffect(() => {
        if (visible) {
            fetchSettings();
        }
    }, [visible]);

    const handleSaveImage = async () => {
        try {
            setIsSaving(true);

            if (Platform.OS === 'web') {
                const html2canvas = require('html2canvas');
                // Pada React Native Web, ref.current adalah elemen DOM
                const canvas = await html2canvas(receiptRef.current, {
                    backgroundColor: '#FFFFFF', // Set White background explicit for download
                    scale: 2 // Higher resolution
                });

                const uri = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `struk-${transaction.id}.png`;
                link.href = uri;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Native Logic
                const { captureRef } = require('react-native-view-shot');
                const MediaLibrary = require('expo-media-library');

                // Request permission
                const { status } = await MediaLibrary.requestPermissionsAsync();

                if (status !== 'granted') {
                    showToast('Mohon izinkan akses galeri untuk menyimpan struk.', 'error');
                    setIsSaving(false);
                    return;
                }

                const uri = await captureRef(receiptRef, {
                    format: 'png',
                    quality: 1,
                    result: 'tmpfile',
                    backgroundColor: '#FFFFFF'
                });

                await MediaLibrary.saveToLibraryAsync(uri);
                showToast('Struk berhasil disimpan ke galeri!', 'success');
            }
        } catch (error) {
            console.error('Error saving receipt:', error);
            showToast('Terjadi kesalahan saat menyimpan struk.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConnectAndPrint = async () => {
        try {
            const isConnected = await BluetoothPrinter.isConnected();
            if (!isConnected) {
                setShowPrinterModal(true);
                return;
            }

            await executePrint();
        } catch (error) {
            console.error('Print trigger error:', error);
            showToast('Gagal memproses cetak.', 'error');
        }
    };

    const executePrint = async () => {
        try {
            // Siapkan Data Print
            const printData = [];
            const restaurantName = settings.restaurant_name || 'BERKAH 88';
            const restaurantSlogan = settings.restaurant_slogan || 'Kasir Pintar & Berkah';
            const restaurantUrl = settings.restaurant_url || 'www.berkah88.id';

            printData.push({ text: restaurantName.toUpperCase(), align: 'center', bold: true, size: 'large' });
            if (restaurantSlogan) printData.push({ text: restaurantSlogan, align: 'center', bold: false, size: 'normal' });
            printData.push({ text: '--------------------------------', align: 'center' });

            printData.push({ text: `ID: ${transaction.id}`, align: 'left' });
            printData.push({ text: `Waktu: ${formatDateFull(transaction.timestamp)}`, align: 'left' });
            printData.push({ text: `Kasir: ${transaction.cashier_name || transaction.seller_name || 'System'}`, align: 'left' });
            printData.push({ text: '--------------------------------', align: 'center' });

            if (transaction.customer_name || transaction.customer_phone || transaction.customer_address) {
                printData.push({ text: 'PELANGGAN:', align: 'left', bold: true });
                if (transaction.customer_name) printData.push({ text: `Nama  : ${transaction.customer_name}`, align: 'left' });
                if (transaction.customer_phone) printData.push({ text: `Telp  : ${transaction.customer_phone}`, align: 'left' });
                if (transaction.customer_address) printData.push({ text: `Alamat: ${transaction.customer_address}`, align: 'left' });
                printData.push({ text: '--------------------------------', align: 'center' });
            }

            const paymentMethodText = transaction.payment_method === 'employee_meal'
                ? 'MAKAN KARYAWAN'
                : (transaction.payment_method === 'cash' || transaction.payment_method === 'tunai' || transaction.payment_method === 'Tunai')
                    ? 'TUNAI'
                    : (transaction.payment_method === 'transfer' || transaction.payment_method === 'TRANSFER')
                        ? 'QRIS'
                        : (transaction.payment_method || 'TUNAI').toUpperCase();

            printData.push({ text: `METODE: ${paymentMethodText}`, align: 'left' });
            printData.push({ text: 'STATUS: LUNAS', align: 'left' });
            printData.push({ text: '--------------------------------', align: 'center' });

            // Calculate subtotals like website
            const subtotalBeforeAllDiscounts = transaction.items.reduce((sum, item) => {
                const originalBasePrice = Number(item.basePrice || item.price) || 0;
                const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
                const pricePerUnitBeforeDiscount = originalBasePrice + optionAdjustment;
                return sum + (pricePerUnitBeforeDiscount * (Number(item.quantity || item.qty) || 0));
            }, 0);

            const subtotalAfterItemDiscounts = transaction.items.reduce((sum, item) => {
                const pricePerUnit = Number(item.price) || 0;
                const itemDiscount = Number(item.discount) || 0;
                const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
                const effectivePriceWithOptions = item.basePrice
                    ? pricePerUnit
                    : (itemDiscount > 0 ? (pricePerUnit * (1 - itemDiscount / 100)) + optionAdjustment : pricePerUnit + optionAdjustment);
                return sum + (effectivePriceWithOptions * (Number(item.quantity || item.qty) || 0));
            }, 0);

            // Items
            transaction.items.forEach(item => {
                const qtyVal = Number(item.quantity || item.qty) || 1;
                const originalBasePrice = Number(item.basePrice || item.price) || 0;
                const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
                const originalPricePerUnit = originalBasePrice + optionAdjustment;

                printData.push({ text: item.name.substring(0, 32), align: 'left', bold: true });
                printData.push({
                    text: BluetoothPrinter.formatColumns(`${qtyVal} x ${originalPricePerUnit.toLocaleString('id-ID')}`, (qtyVal * originalPricePerUnit).toLocaleString('id-ID')),
                    align: 'left'
                });

                if (item.notes || item.catatan) {
                    printData.push({ text: ` + Catatan: ${item.notes || item.catatan}`, align: 'left' });
                }
                if (item.options && Array.isArray(item.options) && item.options.length > 0) {
                    item.options.forEach(opt => {
                        const priceAdjustment = Number(opt.price_adjustment) || 0;
                        printData.push({ text: ` + ${opt.name}${priceAdjustment > 0 ? ` (+Rp ${priceAdjustment.toLocaleString('id-ID')})` : ''}`, align: 'left' });
                    });
                }
            });

            printData.push({ text: '--------------------------------', align: 'center' });

            // Subtotal
            printData.push({
                text: BluetoothPrinter.formatColumns('SUBTOTAL', `Rp ${Number(subtotalBeforeAllDiscounts).toLocaleString("id-ID")}`),
                align: 'left'
            });

            // Item Discounts
            const itemsDiscountAmount = subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts;
            if (itemsDiscountAmount > 0) {
                printData.push({
                    text: BluetoothPrinter.formatColumns('DISKON ITEM', `-Rp ${itemsDiscountAmount.toLocaleString("id-ID")}`),
                    align: 'left'
                });
            }

            // Promo Discount
            const promoDiscountAmount = Number(transaction.promo_discount) || 0;
            if (promoDiscountAmount > 0) {
                printData.push({
                    text: BluetoothPrinter.formatColumns('DISKON PROMO', `-Rp ${promoDiscountAmount.toLocaleString("id-ID")}`),
                    align: 'left'
                });
            }

            // Manual Discount
            const manualDiscountAmount = Number(transaction.manual_discount) || 0;
            if (manualDiscountAmount > 0) {
                printData.push({
                    text: BluetoothPrinter.formatColumns('DISKON TRANS', `-Rp ${manualDiscountAmount.toLocaleString("id-ID")}`),
                    align: 'left'
                });
            }

            // PPN
            const ppnAmount = Number(transaction.ppn) || 0;
            if (ppnAmount > 0) {
                printData.push({
                    text: BluetoothPrinter.formatColumns('PPN/TAX', `Rp ${ppnAmount.toLocaleString("id-ID")}`),
                    align: 'left'
                });
            }

            printData.push({ text: '--------------------------------', align: 'center' });

            // Total
            printData.push({
                text: BluetoothPrinter.formatColumns('TOTAL', `Rp ${Number(transaction.total).toLocaleString("id-ID")}`),
                align: 'left',
                bold: true
            });

            // Cash details
            const methodAttr = (transaction.payment_method || 'tunai').toLowerCase();
            const cashValue = Number(transaction.cash_paid || transaction.cashPaid || 0);
            if ((methodAttr === 'tunai' || methodAttr === 'cash') && cashValue > 0) {
                printData.push({ text: '--------------------------------', align: 'center' });
                printData.push({
                    text: BluetoothPrinter.formatColumns('BAYAR', `Rp ${cashValue.toLocaleString("id-ID")}`),
                    align: 'left'
                });
                printData.push({
                    text: BluetoothPrinter.formatColumns('KEMBALI', `Rp ${Number(transaction.change || 0).toLocaleString("id-ID")}`),
                    align: 'left'
                });
            }

            if (transaction.catatan || transaction.notes) {
                printData.push({ text: '--------------------------------', align: 'center' });
                printData.push({ text: 'CATATAN TRANSAKSI:', align: 'left' });
                printData.push({ text: `"${transaction.catatan || transaction.notes}"`, align: 'left' });
            }

            printData.push({ text: '--------------------------------', align: 'center' });
            printData.push({ text: 'TERIMA KASIH', align: 'center', bold: true });
            if (settings.owner_phone) printData.push({ text: `WA: ${settings.owner_phone}`, align: 'center' });
            printData.push({ text: restaurantUrl, align: 'center' });

            await BluetoothPrinter.printReceipt(printData);
            await BluetoothPrinter.cut();

            // Buka laci uang khusus untuk metode tunai/cash
            if (methodAttr === 'tunai' || methodAttr === 'cash') {
                if (BluetoothPrinter.openCashDrawer) {
                    await BluetoothPrinter.openCashDrawer();
                }
            }

            showToast('Sedang mencetak struk...', 'success');
        } catch (error) {
            console.error('Print error:', error);
            showToast('Gagal mencetak struk. Pastikan printer menyala.', 'error');
        }
    };

    const fetchSettings = async () => {
        try {
            const [resSettings, logoRes, uiVersionRes] = await Promise.all([
                apiService.get('/api/restaurant-settings'),
                apiService.get('/api/settings/logo'),
                apiService.get('/api/settings/mobile_receipt_ui_version').catch(() => ({ data: null }))
            ]);

            if (resSettings.data && resSettings.data.data) {
                setSettings(resSettings.data.data);
            }

            if (logoRes.data && logoRes.data.data?.logo_url) {
                const url = logoRes.data.data.logo_url;
                setLogoUrl(url.startsWith('/public') ? `${API_URL}${url}` : url);
            }

            // Ambil versi UI struk mobile dari settings
            if (uiVersionRes?.data?.data?.value) {
                setMobileReceiptUiVersion(uiVersionRes.data.data.value);
            }
        } catch (error) {
            console.error('Error fetching receipt settings:', error);
        }
    };

    if (!transaction) return null;

    const formatDateFull = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'numeric', year: 'numeric'
        }) + ', ' + date.toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).replace(/\./g, ':');
    };

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

    const handleShareImage = async () => {
        try {
            if (Platform.OS === 'web') {
                // Web Share API
                if (navigator.share) {
                    await handleShareText(); // Fallback to text share for web simplicity or implement blob share
                } else {
                    showToast('Fitur share tidak didukung di browser ini.', 'info');
                }
                return;
            }

            // Native Share Image
            const { captureRef } = require('react-native-view-shot');
            const uri = await captureRef(receiptRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile',
                backgroundColor: '#FFFFFF'
            });

            if (!(await Sharing.isAvailableAsync())) {
                showToast('Fitur sharing tidak tersedia di perangkat ini.', 'error');
                return;
            }

            await Sharing.shareAsync(uri);
        } catch (error) {
            console.error('Error sharing receipt:', error);
            showToast('Terjadi kesalahan saat membagikan struk.', 'error');
        }
    };

    const handleShareText = async () => {
        const message = getReceiptText();
        try {
            await Share.share({ message });
        } catch (error) {
            console.error(error);
        }
    };

    const getReceiptText = () => {
        const centerText = (text, width = 32) => {
            const padding = Math.max(0, Math.floor((width - text.length) / 2));
            return ' '.repeat(padding) + text;
        };

        const restaurantName = settings.restaurant_name || 'BERKAH 88';
        const restaurantSlogan = settings.restaurant_slogan || '';
        const restaurantUrl = settings.restaurant_url || 'www.berkah88.id';

        let text = `${centerText(restaurantName.toUpperCase())}\n`;
        if (restaurantSlogan) text += `${centerText(restaurantSlogan)}\n`;
        text += `--------------------------------\n`;
        text += `ID: ${transaction.id}\n`;
        text += `Waktu: ${formatDateFull(transaction.timestamp)}\n`;
        text += `Kasir: ${transaction.cashier_name || transaction.seller_name || 'System'}\n`;
        text += `--------------------------------\n`;

        // Customer Info Section
        if (transaction.customer_name || transaction.customer_phone || transaction.customer_address) {
            text += `PENERIMA / PELANGGAN:\n`;
            if (transaction.customer_name) text += ` Nama  : ${transaction.customer_name}\n`;
            if (transaction.customer_phone) text += ` Telp  : ${transaction.customer_phone}\n`;
            if (transaction.customer_address) text += ` Alamat: ${transaction.customer_address}\n`;
            text += `--------------------------------\n`;
        }

        const paymentMethodText = transaction.payment_method === 'employee_meal'
            ? 'MAKAN KARYAWAN'
            : (transaction.payment_method === 'cash' || transaction.payment_method === 'tunai' || transaction.payment_method === 'Tunai')
                ? 'TUNAI'
                : (transaction.payment_method === 'transfer' || transaction.payment_method === 'TRANSFER')
                    ? 'QRIS'
                    : (transaction.payment_method || 'TUNAI').toUpperCase();

        text += `Metode Bayar: ${paymentMethodText}\n`;
        text += `Status: LUNAS\n`;
        text += `--------------------------------\n`;

        // Calculate subtotals like website
        const subtotalBeforeAllDiscounts = transaction.items.reduce((sum, item) => {
            const originalBasePrice = Number(item.basePrice || item.price) || 0;
            const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
            const pricePerUnitBeforeDiscount = originalBasePrice + optionAdjustment;
            return sum + (pricePerUnitBeforeDiscount * (Number(item.quantity || item.qty) || 0));
        }, 0);

        const subtotalAfterItemDiscounts = transaction.items.reduce((sum, item) => {
            const pricePerUnit = Number(item.price) || 0;
            const itemDiscount = Number(item.discount) || 0; // percentage
            const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;

            const effectivePriceWithOptions = item.basePrice
                ? pricePerUnit
                : (itemDiscount > 0 ? (pricePerUnit * (1 - itemDiscount / 100)) + optionAdjustment : pricePerUnit + optionAdjustment);

            return sum + (effectivePriceWithOptions * (Number(item.quantity || item.qty) || 0));
        }, 0);

        transaction.items.forEach(item => {
            text += `${item.name.substring(0, 32)}\n`;
            const qtyVal = Number(item.quantity || item.qty) || 1;

            const originalBasePrice = Number(item.basePrice || item.price) || 0;
            const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
            const originalPricePerUnit = originalBasePrice + optionAdjustment;

            const subtotalLine = (originalPricePerUnit * qtyVal).toLocaleString("id-ID");
            const qtyPrice = `${qtyVal} x ${originalPricePerUnit.toLocaleString("id-ID")}`;
            const spaces = 32 - qtyPrice.length - subtotalLine.length;
            text += `${qtyPrice}${" ".repeat(Math.max(1, spaces))}${subtotalLine}\n`;

            if (item.notes || item.catatan) {
                text += ` + Catatan: ${item.notes || item.catatan}\n`;
            }
            if (item.options && Array.isArray(item.options) && item.options.length > 0) {
                item.options.forEach(opt => {
                    const priceAdjustment = Number(opt.price_adjustment) || 0;
                    text += ` + ${opt.name}${priceAdjustment > 0 ? ` (+Rp ${priceAdjustment.toLocaleString('id-ID')})` : ''}\n`;
                });
            }
        });

        text += `--------------------------------\n`;

        // Subtotal
        const subtotalLabel = "SUBTOTAL";
        const subtotalValue = `Rp ${Number(subtotalBeforeAllDiscounts).toLocaleString("id-ID")}`;
        text += `${subtotalLabel}${" ".repeat(Math.max(1, 32 - subtotalLabel.length - subtotalValue.length))}${subtotalValue}\n`;

        // Item Discounts
        const itemsDiscountAmount = subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts;
        if (itemsDiscountAmount > 0) {
            const discLabel = "DISKON ITEM";
            const discValue = `-Rp ${itemsDiscountAmount.toLocaleString("id-ID")}`;
            text += `${discLabel}${" ".repeat(Math.max(1, 32 - discLabel.length - discValue.length))}${discValue}\n`;
        }

        // Promo Discount
        const promoDiscountAmount = Number(transaction.promo_discount) || 0;
        if (promoDiscountAmount > 0) {
            const promoDiscLabel = "DISKON PROMO";
            const promoDiscVal = `-Rp ${promoDiscountAmount.toLocaleString("id-ID")}`;
            text += `${promoDiscLabel}${" ".repeat(Math.max(1, 32 - promoDiscLabel.length - promoDiscVal.length))}${promoDiscVal}\n`;
        }

        // Manual Discount
        const manualDiscountAmount = Number(transaction.manual_discount) || 0;
        if (manualDiscountAmount > 0) {
            const manualDiscLabel = "DISKON TRANSAKSI";
            const manualDiscVal = `-Rp ${manualDiscountAmount.toLocaleString("id-ID")}`;
            text += `${manualDiscLabel}${" ".repeat(Math.max(1, 32 - manualDiscLabel.length - manualDiscVal.length))}${manualDiscVal}\n`;
        }

        // PPN
        const ppnAmount = Number(transaction.ppn) || 0;
        if (ppnAmount > 0) {
            const ppnLabel = "PPN/TAX";
            const ppnVal = `Rp ${ppnAmount.toLocaleString("id-ID")}`;
            text += `${ppnLabel}${" ".repeat(Math.max(1, 32 - ppnLabel.length - ppnVal.length))}${ppnVal}\n`;
        }

        text += `--------------------------------\n`;

        // Total
        const totalLabel = "TOTAL";
        const totalValue = `Rp ${Number(transaction.total).toLocaleString("id-ID")}`;
        text += `${totalLabel}${" ".repeat(Math.max(1, 32 - totalLabel.length - totalValue.length))}${totalValue}\n`;

        // Cash details
        const method = (transaction.payment_method || 'tunai').toLowerCase();
        const cashValue = Number(transaction.cash_paid || transaction.cashPaid || 0);
        if ((method === 'tunai' || method === 'cash') && cashValue > 0) {
            text += `--------------------------------\n`;
            const bayarLabel = "BAYAR";
            const bayarVal = `Rp ${cashValue.toLocaleString("id-ID")}`;
            text += `${bayarLabel}${" ".repeat(Math.max(1, 32 - bayarLabel.length - bayarVal.length))}${bayarVal}\n`;

            const kembaliLabel = "KEMBALI";
            const kembaliVal = `Rp ${Number(transaction.change || 0).toLocaleString("id-ID")}`;
            text += `${kembaliLabel}${" ".repeat(Math.max(1, 32 - kembaliLabel.length - kembaliVal.length))}${kembaliVal}\n`;
        }

        if (Number(transaction.points_used || 0) > 0) {
            text += `--------------------------------\n`;
            const pointsLabel = "DISKON POIN";
            const pointsVal = `-${formatCurrency(transaction.points_used)}`;
            text += `${pointsLabel}${" ".repeat(Math.max(1, 32 - pointsLabel.length - pointsVal.length))}${pointsVal}\n`;
        }


        if (transaction.catatan || transaction.notes) {
            text += `--------------------------------\n`;
            text += `CATATAN TRANSAKSI:\n`;
            text += `"${transaction.catatan || transaction.notes}"\n`;
        }

        text += `--------------------------------\n`;
        text += `${centerText('TERIMA KASIH')}\n`;
        if (settings.owner_phone) text += `${centerText(`WA: ${settings.owner_phone}`)}\n`;
        text += `${centerText(restaurantUrl)}`;

        return text;
    };

    const handleCopyText = async () => {
        const message = getReceiptText();
        try {
            if (Platform.OS === 'web') {
                await navigator.clipboard.writeText(message);
            } else {
                const { Clipboard } = require('react-native');
                Clipboard.setString(message);
            }
            showToast('Teks struk berhasil disalin!', 'success');
        } catch (error) {
            console.error('Copy error:', error);
            showToast('Gagal menyalin teks.', 'error');
        }
    };

    // Calculations for UI display
    const items = transaction.items || [];
    const subtotalBeforeAllDiscounts = items.reduce((sum, item) => {
        const originalBasePrice = Number(item.basePrice || item.price) || 0;
        const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
        const pricePerUnitBeforeDiscount = originalBasePrice + optionAdjustment;
        return sum + (pricePerUnitBeforeDiscount * (Number(item.quantity || item.qty) || 0));
    }, 0);

    const subtotalAfterItemDiscounts = items.reduce((sum, item) => {
        const itemDiscount = Number(item.discount) || 0;
        const basePrice = Number(item.basePrice || item.price) || 0;
        const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;

        const priceAfterDiscount = itemDiscount > 0
            ? Math.round(basePrice * (1 - (itemDiscount / 100)))
            : basePrice;

        return sum + ((priceAfterDiscount + optionAdjustment) * (Number(item.quantity || item.qty) || 0));
    }, 0);

    const itemsDiscountAmount = subtotalBeforeAllDiscounts - subtotalAfterItemDiscounts;
    const manualDiscountAmount = Number(transaction.manual_discount) || 0;
    const ppnAmount = Number(transaction.ppn) || 0;
    const ppnRate = itemsDiscountAmount > 0 || manualDiscountAmount > 0 ? (ppnAmount / (subtotalAfterItemDiscounts - manualDiscountAmount)) : (ppnAmount / subtotalBeforeAllDiscounts);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={[
                styles.modalContainer,
                {
                    height: height,
                }
            ]}>
                <StatusBar
                    barStyle={mobileReceiptUiVersion === '2' ? 'light-content' : 'dark-content'}
                    backgroundColor={tc.background}
                />
                <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 10), height: 60 + insets.top }]}>
                    <Text style={styles.topHeaderText}>Bukti Transaksi</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerPrintBtn} onPress={handleConnectAndPrint}>
                            <Printer size={18} color="#1E40AF" />
                            <Text style={styles.headerPrintText}>Cetak</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} style={styles.closeHeaderBtn}>
                            <X size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.modalScrollContainer, { backgroundColor: tc.background }]}>
                    <ScrollView
                        style={[styles.scrollBody, { backgroundColor: tc.background }]}
                        showsVerticalScrollIndicator={false}
                        decelerationRate="fast"
                        scrollEventThrottle={16}
                        contentContainerStyle={styles.scrollBodyContent}
                    >
                        <View style={t.receiptBody} ref={receiptRef} collapsable={false}>
                            <View style={t.receiptHeader}>
                                <View style={[
                                    t.logoContainer,
                                    logoUrl && {
                                        backgroundColor: 'transparent',
                                        elevation: 0,
                                        shadowOpacity: 0,
                                        borderWidth: 0
                                    }
                                ]}>
                                    {logoUrl ? (
                                        <Image source={{ uri: logoUrl }} style={t.logoImage} />
                                    ) : (
                                        <View style={t.logoPlaceholder}>
                                            <Text style={t.logoText}>{settings.restaurant_name.charAt(0)}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={t.restaurantName}>{settings.restaurant_name}</Text>
                                <Text style={t.restaurantSlogan}>{settings.restaurant_slogan.toUpperCase()}</Text>

                                <View style={t.dividerRow}>
                                    <View style={t.dividerLine} />
                                    <View style={t.dividerDot} />
                                    <View style={t.dividerLine} />
                                </View>
                            </View>

                            <View style={t.infoBar}>
                                <View>
                                    <Text style={t.infoLabel}>ID REFERENSI</Text>
                                    <View style={t.idRow}>
                                        <View style={t.activeDot} />
                                        <Text style={t.idValue}>#{transaction.id.toString().slice(-6).toUpperCase()}</Text>
                                    </View>
                                </View>
                                <View style={t.infoRight}>
                                    <Text style={t.infoLabel}>WAKTU</Text>
                                    <Text style={t.dateValue}>{formatDate(transaction.timestamp)}</Text>
                                </View>
                            </View>

                            <View style={t.sectionHeader}>
                                <View style={t.sectionTitleRow}>
                                    <ShoppingCart size={14} color={tc.iconColorCart} />
                                    <Text style={t.sectionTitle}>DETAIL PEMBELIAN</Text>
                                </View>
                                <View style={t.itemCountBadge}>
                                    <Text style={t.itemCountText}>{(transaction.items || []).length} ITEM</Text>
                                </View>
                            </View>

                            {/* Customer Info Section */}
                            {(transaction.customer_name || transaction.customer_phone || transaction.customer_address) && (
                                <View style={t.customerSection}>
                                    <Text style={t.customerSectionTitle}>Penerima / Pelanggan:</Text>
                                    {transaction.customer_name && (
                                        <View style={t.customerInfoRow}>
                                            <User size={12} color={tc.iconColorCustomer} />
                                            <Text style={t.customerInfoText}>{transaction.customer_name}</Text>
                                        </View>
                                    )}
                                    {transaction.customer_name && (transaction.customer_phone || transaction.customer_address) && <View style={t.customerInfoDivider} />}
                                    {transaction.customer_phone && (
                                        <View style={t.customerInfoRow}>
                                            <Phone size={12} color={tc.iconColorCustomer} />
                                            <Text style={t.customerInfoText}>{transaction.customer_phone}</Text>
                                        </View>
                                    )}
                                    {transaction.customer_phone && transaction.customer_address && <View style={t.customerInfoDivider} />}
                                    {transaction.customer_address && (
                                        <View style={t.customerInfoRow}>
                                            <MapPin size={12} color={tc.iconColorCustomer} />
                                            <Text style={t.customerInfoText}>{transaction.customer_address}</Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            <View style={t.itemsContainer}>
                                {(transaction.items || []).map((item, index) => (
                                    <View key={index} style={t.itemRow}>
                                        <View style={t.itemLeft}>
                                            <View style={t.itemIndicator} />
                                            <View>
                                                <View style={t.itemNameRow}>
                                                    <Text style={t.itemName}>{item.name}</Text>
                                                    <View style={t.itemQtyBadge}>
                                                        <Text style={t.itemQtyText}>x{item.quantity || item.qty}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={t.itemRight}>
                                            <Text style={t.itemSublabel}>Subtotal</Text>
                                            <Text style={t.itemPriceText}>{formatCurrency(item.price * (item.quantity || item.qty))}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={t.summaryCard}>
                                <View style={t.summaryGlow} />
                                <View style={t.summaryContent}>
                                    <View style={t.summaryRow}>
                                        <Text style={t.summaryLabel}>Subtotal</Text>
                                        <Text style={t.summaryValue}>{formatCurrency(subtotalBeforeAllDiscounts)}</Text>
                                    </View>

                                    {itemsDiscountAmount > 0 && (
                                        <View style={t.summaryRow}>
                                            <Text style={t.summaryLabel}>Diskon Item</Text>
                                            <Text style={t.summaryValue}>-{formatCurrency(itemsDiscountAmount)}</Text>
                                        </View>
                                    )}

                                    {Number(transaction.promo_discount || 0) > 0 && (
                                        <View style={t.summaryRow}>
                                            <Text style={t.summaryLabel}>Diskon Promo</Text>
                                            <Text style={[t.summaryValue, { color: tc.accentColor }]}>-{formatCurrency(transaction.promo_discount)}</Text>
                                        </View>
                                    )}

                                    {manualDiscountAmount > 0 && (
                                        <View style={t.summaryRow}>
                                            <Text style={t.summaryLabel}>Diskon Transaksi</Text>
                                            <Text style={t.summaryValue}>-{formatCurrency(manualDiscountAmount)}</Text>
                                        </View>
                                    )}

                                    {ppnAmount > 0 && (
                                        <View style={t.summaryRow}>
                                            <Text style={t.summaryLabel}>PPN ({(ppnRate * 100).toFixed(0)}%)</Text>
                                            <Text style={t.summaryValue}>{formatCurrency(ppnAmount)}</Text>
                                        </View>
                                    )}

                                    {/* Additional Payment Info for Cash */}
                                    {((transaction.payment_method || '').toLowerCase() === 'tunai' || (transaction.payment_method || '').toLowerCase() === 'cash') && (
                                        <>
                                            <View style={t.summaryRow}>
                                                <Text style={t.summaryLabel}>Uang Dibayar</Text>
                                                <Text style={t.summaryValue}>{formatCurrency(transaction.cash_paid || transaction.cashPaid || 0)}</Text>
                                            </View>
                                            <View style={t.summaryRow}>
                                                <Text style={t.summaryLabel}>Kembalian</Text>
                                                <Text style={t.summaryValue}>{formatCurrency(transaction.change || 0)}</Text>
                                            </View>
                                        </>
                                    )}

                                    {Number(transaction.points_used || 0) > 0 && (
                                        <View style={t.summaryRow}>
                                            <Text style={t.summaryLabel}>Diskon Poin</Text>
                                            <Text style={t.summaryValue}>-{formatCurrency(transaction.points_used)}</Text>
                                        </View>
                                    )}
                                    <View style={t.thickDivider} />
                                    <View style={t.totalSection}>
                                        <Text style={t.totalLabel}>TOTAL TAGIHAN</Text>
                                        <View style={t.totalValueRow}>
                                            <Text style={t.rpLabel}>Rp</Text>
                                            <Text style={t.totalFinalValue}>{formatCurrency(transaction.total).replace('Rp', '').trim()}</Text>
                                        </View>
                                        <View style={t.successBadge}>
                                            <CheckCircle2 size={12} color={mobileReceiptUiVersion === '2' ? '#0F172A' : '#FFFFFF'} strokeWidth={3} />
                                            <Text style={t.successText}>PEMBAYARAN BERHASIL</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={t.paymentPill}>
                                <View style={t.pillPart}>
                                    <Text style={t.pillLabel}>METODE</Text>
                                    <Text style={t.pillValue}>{(transaction.payment_method === 'transfer' || transaction.payment_method === 'TRANSFER') ? 'QRIS' : (transaction.payment_method || 'Tunai').toUpperCase()}</Text>
                                </View>
                                <View style={[t.pillPart, t.pillBorder]}>
                                    <Text style={t.pillLabel}>STATUS</Text>
                                    <ShieldCheck size={14} color={tc.iconColorStatus} />
                                </View>
                            </View>

                            {(transaction.catatan || transaction.notes) && (
                                <View style={t.notesContainer}>
                                    <View style={t.notesHeader}>
                                        <MessageSquare size={10} color={tc.iconColorCustomer} />
                                        <Text style={t.notesLabel}>CATATAN TRANSAKSI</Text>
                                    </View>
                                    <Text style={t.notesText}>"{transaction.catatan || transaction.notes}"</Text>
                                </View>
                            )}

                            <View style={t.receiptFooter}>
                                <View style={t.footerDecoration}>
                                    <Zap size={12} color={tc.iconColorFooter} fill={tc.iconColorFooter} />
                                </View>
                                <Text style={t.footerMainText}>TERIMA KASIH</Text>
                                <Text style={t.footerSubText}>SEMOGA BERKAH</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                <View style={[styles.actionFooter, { paddingBottom: getSafeBottomPadding(insets) }]}>
                    <TouchableOpacity style={styles.actionBtnOutline} onPress={handleShareImage}>
                        <Share2 size={18} color="#64748B" />
                        <Text style={styles.actionBtnTextOutline}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnCopy} onPress={handleCopyText}>
                        <Copy size={18} color="#EA580C" />
                        <Text style={styles.actionBtnTextCopy}>Teks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtnPrimary, isSaving && { opacity: 0.7 }]}
                        onPress={handleSaveImage}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Download size={18} color="#FFFFFF" />
                        )}
                        <Text style={styles.actionBtnTextPrimary}>
                            {isSaving ? '...' : 'Unduh'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View >

            <PrinterSelectionModal
                visible={showPrinterModal}
                onClose={() => setShowPrinterModal(false)}
                onSelect={() => {
                    showToast('Printer terhubung!', 'success');
                    executePrint();
                }}
            />
            {/* Local Toast UI */}
            {
                localToast.visible && (
                    <View style={[styles.toastContainer, { borderLeftColor: localToast.type === 'error' ? '#EF4444' : (localToast.type === 'warning' ? '#F59E0B' : '#10B981') }]}>
                        <View style={styles.toastContent}>
                            <View style={styles.iconArea}>
                                {localToast.type === 'error' ? <XCircle size={24} color="#EF4444" /> :
                                    localToast.type === 'warning' ? <AlertCircle size={24} color="#F59E0B" /> :
                                        <CheckCircle2 size={24} color="#10B981" />}
                            </View>
                            <View style={styles.textArea}>
                                <Text style={styles.toastTitle}>{localToast.type.toUpperCase()}</Text>
                                <Text style={styles.toastMessage}>{localToast.message}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setLocalToast(prev => ({ ...prev, visible: false }))} style={styles.closeBtn}>
                                <X size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            }
        </Modal >
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#F8FAFC',
        flex: 1,
        width: '100%',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    topHeaderText: {
        color: '#1E293B',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeHeaderBtn: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerPrintBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    headerPrintText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1E40AF',
    },
    scrollBody: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalScrollContainer: {
        flex: 1,
    },
    scrollBodyContent: {
        paddingBottom: 20,
    },
    receiptBody: {
        padding: 24,
    },
    receiptHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#148FEA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#148FEA',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 15,
            },
            android: { elevation: 10 },
            web: { boxShadow: '0px 10px 15px rgba(20, 143, 234, 0.2)' }
        })
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
    },
    logoPlaceholder: {
        alignItems: 'center',
    },
    logoText: {
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: '900',
        fontStyle: 'italic',
    },
    restaurantName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    restaurantSlogan: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
        marginTop: 4,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 40,
        marginTop: 15,
        opacity: 0.3,
    },
    dividerLine: {
        flex: 1,
        height: 1.5,
        backgroundColor: '#94A3B8',
    },
    dividerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#94A3B8',
        marginHorizontal: 8,
    },
    infoBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 30,
    },
    infoLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    idRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    idValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    dateValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    infoRight: {
        alignItems: 'flex-end',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: 1,
    },
    itemCountBadge: {
        backgroundColor: 'rgba(20, 143, 234, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    itemCountText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#148FEA',
    },
    itemsContainer: {
        marginBottom: 24,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    itemLeft: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    itemIndicator: {
        width: 4,
        height: 24,
        backgroundColor: '#138FEA',
        borderRadius: 4,
        marginRight: 12,
    },
    itemNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    itemQtyBadge: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    itemQtyText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    itemRight: {
        alignItems: 'flex-end',
    },
    itemSublabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    itemPriceText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    summaryCard: {
        position: 'relative',
        marginBottom: 24,
    },
    summaryGlow: {
        position: 'absolute',
        inset: 0,
        backgroundColor: '#148FEA',
        opacity: 0.05,
        borderRadius: 24,
    },
    summaryContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: { elevation: 2 },
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.05)' }
        })
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    pointLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: 'bold',
    },
    summaryValue: {
        fontSize: 12,
        color: '#1E293B',
        fontWeight: '900',
    },
    thickDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        width: '100%',
        marginVertical: 15,
    },
    totalSection: {
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 3,
        marginBottom: 8,
    },
    totalValueRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
    },
    rpLabel: {
        fontSize: 14,
        color: '#148FEA',
        fontWeight: '900',
        marginTop: 4,
    },
    totalFinalValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -1,
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 15,
        gap: 6,
    },
    successText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    paymentPill: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#1E293B',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        alignSelf: 'center',
        marginBottom: 30,
    },
    pillPart: {
        paddingHorizontal: 12,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    pillBorder: {
        borderLeftWidth: 1,
        borderLeftColor: '#334155',
    },
    pillLabel: {
        fontSize: 7,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    pillValue: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    receiptFooter: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    footerMainText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    footerSubText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginTop: 4,
    },
    actionFooter: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 12,
        zIndex: 999,
        elevation: 25,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: { elevation: 25 },
            web: { boxShadow: '0px -10px 20px rgba(0,0,0,0.1)' }
        })
    },
    actionBtnOutline: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        gap: 8,
    },
    actionBtnTextOutline: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
    },
    actionBtnCopy: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FFEDD5',
        gap: 6,
    },
    actionBtnTextCopy: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#EA580C',
    },
    actionBtnPrimary: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#148FEA',
        gap: 8,
    },
    actionBtnTextPrimary: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    actionBtnPrint: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        gap: 8,
    },
    actionBtnTextPrint: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1E40AF',
    },
    // Customer Section Styles
    customerSection: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    customerSectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    customerInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    customerInfoText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    customerInfoDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 8,
    },
    // Notes Section Styles
    notesContainer: {
        backgroundColor: '#F8FAFC',
        padding: 14,
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 25,
        marginHorizontal: 10,
    },
    notesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 6,
    },
    notesLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
    },
    notesText: {
        fontSize: 12,
        color: '#475569',
        fontStyle: 'italic',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 18,
    },
    // Local Toast Styles
    toastContainer: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 999999, // High z-index inside Modal
        elevation: 50,
        borderLeftWidth: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        // Android elevation hack
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconArea: {
        marginRight: 12,
    },
    textArea: {
        flex: 1,
    },
    toastTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 2,
    },
    toastMessage: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    closeBtn: {
        padding: 4,
    }
});

export default ReceiptModal;
