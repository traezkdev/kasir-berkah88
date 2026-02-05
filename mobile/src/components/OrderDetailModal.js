import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    StatusBar
} from 'react-native';
import {
    X,
    User,
    MapPin,
    Wallet,
    ShoppingBag,
    Clipboard,
    MessageCircle,
    Package,
    Calendar,
    Hash,
    Clock,
    CreditCard
} from 'lucide-react-native';
import { useToast } from '../context/ToastContext';

const { width } = Dimensions.get('window');

const OrderDetailModal = ({ visible, onClose, order }) => {
    const { showToast } = useToast();

    if (!order) return null;

    const parsedItems = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? JSON.parse(order.items) : []);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(val || 0);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric'
        }) + ' • ' + date.toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <StatusBar barStyle="dark-content" backgroundColor="rgba(0,0,0,0.5)" />

                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>Detail Pesanan</Text>
                            <View style={styles.orderIdContainer}>
                                <Hash size={12} color="#64748B" />
                                <Text style={styles.orderIdText}>{order.id}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#1E293B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalScrollContainer}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollBody}
                            bounces={true}
                            overScrollMode="always"
                        >
                            {/* Status Badge */}
                            <View style={styles.statusSection}>
                                <View style={styles.statusBadge}>
                                    <Clock size={14} color="#1E40AF" />
                                    <Text style={styles.statusText}>{(order.status || 'PENDING').toUpperCase()}</Text>
                                </View>
                                <Text style={styles.timestamp}>{formatDate(order.created_at || new Date())}</Text>
                            </View>

                            {/* Customer Info Card */}
                            <View style={styles.sectionCard}>
                                <View style={styles.sectionHeader}>
                                    <User size={18} color="#1E40AF" />
                                    <Text style={styles.sectionLabel}>INFORMASI PELANGGAN</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoName}>{order.customer_name || 'Pelanggan'}</Text>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.infoLine}>
                                    <MapPin size={16} color="#94A3B8" />
                                    <View style={styles.infoValueContainer}>
                                        <Text style={styles.infoValueTitle}>Alamat Pengiriman</Text>
                                        <Text style={styles.infoValueText}>{order.customer_address || 'Ambil di Toko'}</Text>
                                    </View>
                                </View>

                                <View style={styles.infoLine}>
                                    <CreditCard size={16} color="#94A3B8" />
                                    <View style={styles.infoValueContainer}>
                                        <Text style={styles.infoValueTitle}>Metode Pembayaran</Text>
                                        <Text style={styles.infoValueText}>{(order.payment_method || 'TUNAI').toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Order Items Section */}
                            <View style={[styles.sectionCard, { marginTop: 16 }]}>
                                <View style={styles.sectionHeader}>
                                    <Package size={18} color="#1E40AF" />
                                    <Text style={styles.sectionLabel}>RINGKASAN PESANAN</Text>
                                </View>

                                {parsedItems.map((item, index) => {
                                    const qty = Number(item.quantity || item.qty) || 0;
                                    const originalBasePrice = Number(item.basePrice || item.price) || 0;
                                    const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((sum, opt) => sum + (Number(opt.price_adjustment) || 0), 0) : 0;
                                    const originalPricePerUnit = originalBasePrice + optionAdjustment;

                                    return (
                                        <View key={index} style={styles.itemRow}>
                                            <View style={styles.itemQtyContainer}>
                                                <Text style={styles.itemQty}>{qty}x</Text>
                                            </View>
                                            <View style={styles.itemMain}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemPrice}>{formatCurrency(originalPricePerUnit)}</Text>
                                            </View>
                                            <Text style={styles.itemTotal}>{formatCurrency(originalPricePerUnit * qty)}</Text>
                                        </View>
                                    );
                                })}

                                <View style={styles.totalDivider} />

                                {(() => {
                                    // Logic Perhitungan
                                    const subtotalGross = parsedItems.reduce((sum, item) => {
                                        const qty = Number(item.quantity || item.qty) || 0;
                                        const originalBasePrice = Number(item.basePrice || item.price) || 0;
                                        const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;
                                        return sum + ((originalBasePrice + optionAdjustment) * qty);
                                    }, 0);

                                    const subtotalNetItems = parsedItems.reduce((sum, item) => {
                                        const qty = Number(item.quantity || item.qty) || 0;
                                        const itemPrice = Number(item.price) || 0;
                                        const itemDiscount = Number(item.discount) || 0;
                                        const optionAdjustment = Array.isArray(item.options) ? item.options.reduce((optSum, opt) => optSum + (Number(opt.price_adjustment) || 0), 0) : 0;

                                        const effectivePrice = item.basePrice
                                            ? itemPrice
                                            : (itemDiscount > 0 ? (itemPrice * (1 - itemDiscount / 100)) + optionAdjustment : itemPrice + optionAdjustment);

                                        return sum + (effectivePrice * qty);
                                    }, 0);

                                    const itemDiscountAmount = subtotalGross - subtotalNetItems;
                                    const manualDiscount = Number(order.manual_discount || 0);
                                    const ppnAmount = Number(order.ppn || 0);

                                    return (
                                        <>
                                            <View style={styles.totalRow}>
                                                <Text style={styles.totalLabel}>Subtotal</Text>
                                                <Text style={styles.totalValue}>{formatCurrency(subtotalGross)}</Text>
                                            </View>

                                            {itemDiscountAmount > 0 && (
                                                <View style={styles.totalRow}>
                                                    <Text style={[styles.totalLabel, { color: '#EF4444' }]}>Diskon Item</Text>
                                                    <Text style={[styles.totalValue, { color: '#EF4444' }]}>-{formatCurrency(itemDiscountAmount)}</Text>
                                                </View>
                                            )}

                                            {manualDiscount > 0 && (
                                                <View style={styles.totalRow}>
                                                    <Text style={[styles.totalLabel, { color: '#EF4444' }]}>Diskon Tambahan</Text>
                                                    <Text style={[styles.totalValue, { color: '#EF4444' }]}>-{formatCurrency(manualDiscount)}</Text>
                                                </View>
                                            )}

                                            {ppnAmount > 0 && (
                                                <View style={styles.totalRow}>
                                                    <Text style={styles.totalLabel}>Pajak/PPN</Text>
                                                    <Text style={styles.totalValue}>{formatCurrency(ppnAmount)}</Text>
                                                </View>
                                            )}

                                            <View style={[styles.totalRow, { marginTop: 12 }]}>
                                                <Text style={styles.grandTotalLabel}>TOTAL BAYAR</Text>
                                                <Text style={styles.grandTotalValue}>{formatCurrency(Number(order.total))}</Text>
                                            </View>
                                        </>
                                    );
                                })()}
                            </View>

                            {/* Logistics info or note if applicable */}
                            {order.note && (
                                <View style={styles.noteBox}>
                                    <Text style={styles.noteTitle}>Catatan Pesanan:</Text>
                                    <Text style={styles.noteContent}>"{order.note}"</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.closePrimaryBtn}
                            onPress={onClose}
                        >
                            <Text style={styles.closePrimaryBtnText}>Tutup</Text>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    orderIdText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    scrollBody: {
        padding: 24,
        flexGrow: 1,
    },
    modalScrollContainer: {
        flex: 1,
    },
    statusSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1E40AF',
        letterSpacing: 0.5,
    },
    timestamp: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
            android: { elevation: 2 }
        })
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    infoName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    infoLine: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    infoValueContainer: {
        flex: 1,
    },
    infoValueTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    infoValueText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#334155',
        lineHeight: 20,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemQtyContainer: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 12,
    },
    itemQty: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1E40AF',
    },
    itemMain: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    itemPrice: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    totalDivider: {
        height: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 1,
        marginVertical: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    totalValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: 'bold',
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E40AF',
    },
    noteBox: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#FFFBEB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    noteTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#B45309',
        marginBottom: 4,
    },
    noteContent: {
        fontSize: 14,
        color: '#92400E',
        fontStyle: 'italic',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
        zIndex: 999,
        elevation: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 20,
                borderTopWidth: 0,
            },
            web: {
                boxShadow: '0px -15px 30px rgba(0,0,0,0.08)',
                borderTopWidth: 0,
            }
        })
    },
    closePrimaryBtn: {
        flex: 1,
        backgroundColor: '#1E293B',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    closePrimaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    }
});

export default OrderDetailModal;
