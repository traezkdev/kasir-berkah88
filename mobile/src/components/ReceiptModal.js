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
    Share
} from 'react-native';
import { X, Printer, Share2, Copy, CheckCircle2, ShoppingCart, Tag, MessageSquare, Zap, ShieldCheck } from 'lucide-react-native';
import apiService, { API_URL } from '../api/apiService';

const { width, height } = Dimensions.get('window');

const ReceiptModal = ({ visible, onClose, transaction }) => {
    const [settings, setSettings] = useState({
        restaurant_name: 'Berkah 88',
        restaurant_slogan: 'Kasir Pintar & Berkah',
        restaurant_url: 'www.berkah88.id',
    });
    const [logoUrl, setLogoUrl] = useState(null);

    useEffect(() => {
        if (visible) {
            fetchSettings();
        }
    }, [visible]);

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

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    const handleShareText = async () => {
        const centerText = (text, w = 32) => {
            const padding = Math.max(0, Math.floor((w - text.length) / 2));
            return ' '.repeat(padding) + text;
        };

        let message = `*${settings.restaurant_name.toUpperCase()}*\n`;
        message += `${settings.restaurant_slogan}\n`;
        message += `--------------------------\n`;
        message += `ID: ${transaction.id}\n`;
        message += `Tanggal: ${formatDate(transaction.timestamp)}\n`;
        message += `--------------------------\n`;

        transaction.items.forEach(item => {
            message += `${item.name} x${item.quantity || item.qty}\n`;
            message += `Rp ${formatCurrency(item.price)} -> Rp ${formatCurrency(item.price * (item.quantity || item.qty))}\n`;
        });

        message += `--------------------------\n`;
        message += `*TOTAL: ${formatCurrency(transaction.total)}*\n`;
        message += `Bayar: ${formatCurrency(transaction.cash_paid || transaction.cashPaid || transaction.total)}\n`;
        message += `Kembali: ${formatCurrency(transaction.change || 0)}\n`;
        message += `--------------------------\n`;
        message += `Terima Kasih!\n${settings.restaurant_url}`;

        try {
            await Share.share({
                message: message,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header Bagian Atas (Biru seperti Web) */}
                    <View style={styles.topHeader}>
                        <Text style={styles.topHeaderText}>Bukti Transaksi</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeHeaderBtn}>
                            <X size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
                        <View style={styles.receiptBody}>
                            {/* Logo & Nama Toko */}
                            <View style={styles.receiptHeader}>
                                <View style={styles.logoContainer}>
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

                                {/* Divider Estetik */}
                                <View style={styles.dividerRow}>
                                    <View style={styles.dividerLine} />
                                    <View style={styles.dividerDot} />
                                    <View style={styles.dividerLine} />
                                </View>
                            </View>

                            {/* Info Bar */}
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

                            {/* Item List */}
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
                                                {item.options && (
                                                    <View style={styles.optionsList}>
                                                        {JSON.parse(typeof item.options === 'string' ? item.options : '[]').map((opt, i) => (
                                                            <View key={i} style={styles.optionBadge}>
                                                                <Text style={styles.optionText}>{opt.name}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.itemRight}>
                                            <Text style={styles.itemSublabel}>Subtotal</Text>
                                            <Text style={styles.itemPriceText}>{formatCurrency(item.price * (item.quantity || item.qty))}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Summary Detail */}
                            <View style={styles.summaryCard}>
                                <View style={styles.summaryGlow} />
                                <View style={styles.summaryContent}>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Harga Dasar</Text>
                                        <Text style={styles.summaryValue}>{formatCurrency(transaction.total - (transaction.ppn || 0))}</Text>
                                    </View>
                                    {transaction.ppn > 0 && (
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>PPN (Tax)</Text>
                                            <Text style={styles.summaryValue}>{formatCurrency(transaction.ppn)}</Text>
                                        </View>
                                    )}

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

                            {/* Payment Info */}
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

                            {/* Catatan */}
                            {transaction.catatan && (
                                <View style={styles.noteArea}>
                                    <View style={styles.noteHeader}>
                                        <MessageSquare size={14} color="#D97706" />
                                        <Text style={styles.noteTitle}>CATATAN PESANAN</Text>
                                    </View>
                                    <Text style={styles.noteText}>"{transaction.catatan}"</Text>
                                </View>
                            )}

                            {/* Footer */}
                            <View style={styles.receiptFooter}>
                                <View style={styles.footerDecoration}>
                                    <Zap size={12} color="#E2E8F0" fill="#E2E8F0" />
                                </View>
                                <Text style={styles.footerMainText}>TERIMA KASIH</Text>
                                <Text style={styles.footerSubText}>SAMPAI JUMPA KEMBALI!</Text>
                                <Text style={styles.footerUrl}>{settings.restaurant_url}</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Bottom Actions */}
                    <View style={styles.actionFooter}>
                        <TouchableOpacity style={styles.actionBtnOutline} onPress={handleShareText}>
                            <Share2 size={20} color="#64748B" />
                            <Text style={styles.actionBtnTextOutline}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnPrimary}>
                            <Printer size={20} color="#FFFFFF" />
                            <Text style={styles.actionBtnTextPrimary}>Cetak Struk</Text>
                        </TouchableOpacity>
                    </View>
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
        height: '92%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#148FEA',
    },
    topHeaderText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeHeaderBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    scrollBody: {
        flex: 1,
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
        shadowColor: '#148FEA',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
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
    optionsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
        gap: 4,
    },
    optionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    optionText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#4338CA',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
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
    noteArea: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FEF3C7',
        borderRadius: 20,
        padding: 16,
        marginBottom: 30,
    },
    noteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    noteTitle: {
        fontSize: 9,
        fontWeight: '900',
        color: '#D97706',
        letterSpacing: 1,
    },
    noteText: {
        fontSize: 12,
        color: '#92400E',
        fontStyle: 'italic',
        fontWeight: '500',
    },
    receiptFooter: {
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        borderStyle: 'dashed',
    },
    footerDecoration: {
        position: 'absolute',
        top: -7,
        alignSelf: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
    },
    footerMainText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: 2,
    },
    footerSubText: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginTop: 4,
    },
    footerUrl: {
        fontSize: 8,
        color: '#CBD5E1',
        fontWeight: '900',
        letterSpacing: 4,
        marginTop: 15,
    },
    actionFooter: {
        padding: 24,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    actionBtnOutline: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 10,
    },
    actionBtnTextOutline: {
        fontSize: 14,
        fontWeight: '900',
        color: '#64748B',
    },
    actionBtnPrimary: {
        flex: 1.5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        backgroundColor: '#1E40AF',
        gap: 10,
    },
    actionBtnTextPrimary: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});

export default ReceiptModal;
