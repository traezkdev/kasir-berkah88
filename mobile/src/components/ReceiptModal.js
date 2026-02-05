import React, { useState, useEffect } from 'react';
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
    StatusBar
} from 'react-native';
import { X, Printer, Share2, CheckCircle2, ShoppingCart, MessageSquare, Zap, ShieldCheck, Download, Copy } from 'lucide-react-native';
import apiService, { API_URL } from '../api/apiService';
import { useToast } from '../context/ToastContext';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing'; // Import Sharing

const { width } = Dimensions.get('window');

const ReceiptModal = ({ visible, onClose, transaction }) => {
    const [settings, setSettings] = useState({
        restaurant_name: 'Berkah 88',
        restaurant_slogan: 'Kasir Pintar & Berkah',
        restaurant_url: 'www.berkah88.id',
    });
    const [logoUrl, setLogoUrl] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();
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

    const fetchSettings = async () => {
        try {
            const [resSettings, logoRes] = await Promise.all([
                apiService.get('/api/restaurant-settings'),
                apiService.get('/api/settings/logo')
            ]);

            if (resSettings.data && resSettings.data.data) {
                setSettings(resSettings.data.data);
            }

            if (logoRes.data && logoRes.data.data?.logo_url) {
                const url = logoRes.data.data.logo_url;
                setLogoUrl(url.startsWith('/public') ? `${API_URL}${url}` : url);
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
        text += `${centerText(restaurantSlogan)}\n`;
        text += `--------------------------------\n`;
        text += `ID: ${transaction.id}\n`;
        text += `Tanggal: ${formatDateFull(transaction.timestamp)}\n`;
        text += `Kasir: ${transaction.cashier_name || transaction.seller_name || 'SISTEM'}\n`;

        const paymentMethodText = transaction.payment_method === 'employee_meal'
            ? 'MAKAN KARYAWAN'
            : (transaction.payment_method === 'cash' || transaction.payment_method === 'tunai' || transaction.payment_method === 'Tunai')
                ? 'TUNAI'
                : (transaction.payment_method || 'TUNAI').toUpperCase();
        text += `Metode: ${paymentMethodText}\n`;
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

            // Gunakan harga ASLI (sebelum diskon) untuk rincian per item
            const originalBasePrice = Number(item.basePrice || item.price) || 0;
            const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
            const originalPricePerUnit = originalBasePrice + optionAdjustment;

            const subtotalLine = (originalPricePerUnit * qtyVal).toLocaleString("id-ID");
            const qtyPrice = `${qtyVal} x ${originalPricePerUnit.toLocaleString("id-ID")}`;
            const spaces = 32 - qtyPrice.length - subtotalLine.length;
            text += `${qtyPrice}${" ".repeat(Math.max(1, spaces))}${subtotalLine}\n`;

            if (item.notes || item.catatan) {
                text += ` + ${item.notes || item.catatan}\n`;
            }
            if (item.options && Array.isArray(item.options) && item.options.length > 0) {
                item.options.forEach(opt => text += ` + ${opt.name}\n`);
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

        // Manual Discount
        const manualDiscountAmount = Number(transaction.manual_discount) || 0;
        if (manualDiscountAmount > 0) {
            const manualDiscLabel = "DISKON TAMBAHAN";
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
        if (((transaction.payment_method || 'tunai').toLowerCase() === 'tunai' || (transaction.payment_method || 'tunai').toLowerCase() === 'cash') && (transaction.cash_paid || transaction.cashPaid) > 0) {
            text += `--------------------------------\n`;
            const bayarLabel = "BAYAR";
            const bayarVal = `Rp ${Number(transaction.cash_paid || transaction.cashPaid || 0).toLocaleString("id-ID")}`;
            text += `${bayarLabel}${" ".repeat(Math.max(1, 32 - bayarLabel.length - bayarVal.length))}${bayarVal}\n`;

            const kembaliLabel = "KEMBALI";
            const kembaliVal = `Rp ${Number(transaction.change || 0).toLocaleString("id-ID")}`;
            text += `${kembaliLabel}${" ".repeat(Math.max(1, 32 - kembaliLabel.length - kembaliVal.length))}${kembaliVal}\n`;
        }

        if (transaction.catatan || transaction.notes) {
            text += `--------------------------------\n`;
            text += `CATATAN:\n`;
            text += `"${transaction.catatan || transaction.notes}"\n`;
        }

        text += `--------------------------------\n`;
        text += `${centerText('TERIMA KASIH')}\n`;
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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.topHeader}>
                    <Text style={styles.topHeaderText}>Bukti Transaksi</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeHeaderBtn}>
                        <X size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollBody}
                    showsVerticalScrollIndicator={false}
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                >
                    <View style={[styles.receiptBody, { backgroundColor: '#FFFFFF' }]} ref={receiptRef} collapsable={false}>
                        <View style={[styles.receiptHeader, { backgroundColor: '#FFFFFF' }]}>
                            <View style={[
                                styles.logoContainer,
                                logoUrl && {
                                    backgroundColor: 'transparent',
                                    elevation: 0,
                                    shadowOpacity: 0,
                                    borderWidth: 0
                                }
                            ]}>
                                {logoUrl ? (
                                    <Image source={{ uri: logoUrl }} style={styles.logoImage} />
                                ) : (
                                    <View style={styles.logoPlaceholder}>
                                        <Text style={styles.logoText}>{settings.restaurant_name.charAt(0)}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.restaurantName}>{settings.restaurant_name}</Text>
                            <Text style={styles.restaurantSlogan}>{settings.restaurant_slogan.toUpperCase()}</Text>

                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <View style={styles.dividerDot} />
                                <View style={styles.dividerLine} />
                            </View>
                        </View>

                        <View style={styles.infoBar}>
                            <View>
                                <Text style={styles.infoLabel}>ID REFERENSI</Text>
                                <View style={styles.idRow}>
                                    <View style={styles.activeDot} />
                                    <Text style={styles.idValue}>#{transaction.id.toString().slice(-6).toUpperCase()}</Text>
                                </View>
                            </View>
                            <View style={styles.infoRight}>
                                <Text style={styles.infoLabel}>WAKTU</Text>
                                <Text style={styles.dateValue}>{formatDate(transaction.timestamp)}</Text>
                            </View>
                        </View>

                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <ShoppingCart size={14} color="#1E40AF" />
                                <Text style={styles.sectionTitle}>DETAIL PEMBELIAN</Text>
                            </View>
                            <View style={styles.itemCountBadge}>
                                <Text style={styles.itemCountText}>{(transaction.items || []).length} ITEM</Text>
                            </View>
                        </View>

                        <View style={styles.itemsContainer}>
                            {(transaction.items || []).map((item, index) => (
                                <View key={index} style={styles.itemRow}>
                                    <View style={styles.itemLeft}>
                                        <View style={styles.itemIndicator} />
                                        <View>
                                            <View style={styles.itemNameRow}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <View style={styles.itemQtyBadge}>
                                                    <Text style={styles.itemQtyText}>x{item.quantity || item.qty}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.itemRight}>
                                        <Text style={styles.itemSublabel}>Subtotal</Text>
                                        <Text style={styles.itemPriceText}>{formatCurrency(item.price * (item.quantity || item.qty))}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.summaryCard}>
                            <View style={styles.summaryGlow} />
                            <View style={styles.summaryContent}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Harga Dasar</Text>
                                    <Text style={styles.summaryValue}>{formatCurrency(transaction.total - (transaction.ppn || 0))}</Text>
                                </View>
                                <View style={styles.thickDivider} />
                                <View style={styles.totalSection}>
                                    <Text style={styles.totalLabel}>TOTAL TAGIHAN</Text>
                                    <View style={styles.totalValueRow}>
                                        <Text style={styles.rpLabel}>Rp</Text>
                                        <Text style={styles.totalFinalValue}>{formatCurrency(transaction.total).replace('Rp', '').trim()}</Text>
                                    </View>
                                    <View style={styles.successBadge}>
                                        <CheckCircle2 size={12} color="#FFFFFF" strokeWidth={3} />
                                        <Text style={styles.successText}>PEMBAYARAN BERHASIL</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.paymentPill}>
                            <View style={styles.pillPart}>
                                <Text style={styles.pillLabel}>METODE</Text>
                                <Text style={styles.pillValue}>{(transaction.payment_method || 'Tunai').toUpperCase()}</Text>
                            </View>
                            <View style={[styles.pillPart, styles.pillBorder]}>
                                <Text style={styles.pillLabel}>STATUS</Text>
                                <ShieldCheck size={14} color="#10B981" />
                            </View>
                        </View>

                        <View style={styles.receiptFooter}>
                            <View style={styles.footerDecoration}>
                                <Zap size={12} color="#E2E8F0" fill="#E2E8F0" />
                            </View>
                            <Text style={styles.footerMainText}>TERIMA KASIH</Text>
                            <Text style={styles.footerSubText}>SEMOGA BERKAH</Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.actionFooter}>
                    <TouchableOpacity style={styles.actionBtnOutline} onPress={handleShareImage}>
                        <Share2 size={18} color="#64748B" />
                        <Text style={styles.actionBtnTextOutline}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnCopy} onPress={handleCopyText}>
                        <Copy size={18} color="#EA580C" />
                        <Text style={styles.actionBtnTextCopy}>Salin Teks</Text>
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
            </View>
        </Modal>
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
        flexDirection: 'column',
        zIndex: 9999, // Super high z-index to overlay everything
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : (Platform.OS === 'ios' ? 50 : 25),
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
    scrollBody: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingLeft: 4,
    },
    itemLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    itemIndicator: {
        width: 2,
        height: '100%',
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginRight: 10,
    },
    itemNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    itemQtyBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    itemQtyText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
    },
    itemRight: {
        alignItems: 'flex-end',
    },
    itemSublabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94A3B8',
        marginBottom: 2,
    },
    itemPriceText: {
        fontSize: 14,
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
        paddingBottom: Platform.OS === 'ios' ? 35 : 25, // Increased padding for safety
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
});

export default ReceiptModal;
