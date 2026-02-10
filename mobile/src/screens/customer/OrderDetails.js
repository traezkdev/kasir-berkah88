import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Platform,
    StatusBar,
    SafeAreaView,
    Alert,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from '../../utils/safeArea';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    ShoppingBag,
    MessageCircle,
    ChevronRight,
    Search,
    RefreshCcw,
    XCircle,
    Info
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';

const { width } = Dimensions.get('window');

const OrderDetails = ({ navigation, route }) => {
    const { orderId } = route.params || {};
    const insets = useSafeAreaInsets();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showCancelModal, setShowCancelModal] = useState(false);

    const fetchOrderDetail = async () => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        try {
            const response = await apiService.get(`/api/orders/${orderId}`);
            if (response.data.data) {
                setOrder(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching order:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetail();
        // Poll for status updates every 15 seconds
        const interval = setInterval(fetchOrderDetail, 15000);
        return () => clearInterval(interval);
    }, [orderId]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    const handleCancelOrder = () => {
        setShowCancelModal(true);
    };

    const confirmCancelOrder = async () => {
        setShowCancelModal(false);
        try {
            setLoading(true);
            await apiService.put(`/api/orders/${orderId}/status`, { status: "cancelled" });
            Alert.alert("Berhasil", "Pesanan berhasil dibatalkan");
            fetchOrderDetail();
        } catch (error) {
            console.error("Error cancelling order:", error);
            Alert.alert("Gagal", "Gagal membatalkan pesanan. Silakan coba lagi.");
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'BARU',
                    color: '#F59E0B',
                    bg: '#FFFBEB',
                    icon: Clock,
                    desc: 'Pesanan Anda sedang dikirim ke penjual. Mohon tunggu sebentar ya.'
                };
            case 'accepted':
                return {
                    label: 'SEDANG DIPROSES',
                    color: '#138FEA',
                    bg: '#EFF6FF',
                    icon: ShoppingBag,
                    desc: 'Yeay! Pesanan Anda telah diterima dan sedang disiapkan.'
                };
            case 'ready':
                return {
                    label: 'SIAP DIAMBIL',
                    color: '#10B981',
                    bg: '#ECFDF5',
                    icon: ShoppingBag,
                    desc: 'Pesanan Anda sudah siap! Silakan ambil di toko.'
                };
            case 'rejected':
                return {
                    label: 'PESANAN DITOLAK',
                    color: '#EF4444',
                    bg: '#FEF2F2',
                    icon: XCircle,
                    desc: 'Maaf, penjual tidak dapat menerima pesanan Anda saat ini.'
                };
            case 'cancelled':
                return {
                    label: 'PESANAN BATAL',
                    color: '#64748B',
                    bg: '#F8FAFC',
                    icon: XCircle,
                    desc: 'Pesanan ini telah dibatalkan.'
                };
            case 'completed':
                return {
                    label: 'PESANAN SELESAI',
                    color: '#059669',
                    bg: '#ECFDF5',
                    icon: CheckCircle2,
                    desc: 'Terima kasih! Pesanan Anda telah selesai. Sampai jumpa lagi!'
                };
            default:
                return {
                    label: 'STATUS TIDAK DIKETAHUI',
                    color: '#94A3B8',
                    bg: '#F8FAFC',
                    icon: Info,
                    desc: 'Sedang memperbarui status pesanan Anda...'
                };
        }
    };

    if (loading && !order) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingArea}>
                    <ActivityIndicator size="large" color="#059669" />
                    <Text style={styles.loadingText}>Memuat Detail Pesanan...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyArea}>
                    <Search size={50} color="#E2E8F0" />
                    <Text style={styles.emptyText}>Pesanan tidak ditemukan</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.homeBtn}>
                        <Text style={styles.homeBtnText}>Kembali ke Beranda</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const sInfo = getStatusInfo(order.status);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.backBtn}>
                    <ArrowLeft size={20} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Konfirmasi Pesanan</Text>
                <TouchableOpacity onPress={() => fetchOrderDetail()} style={styles.refreshBtn}>
                    <RefreshCcw size={18} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status Hero */}
                <View style={[styles.statusHero, { backgroundColor: sInfo.bg }]}>
                    <View style={[styles.statusIconWrap, { backgroundColor: sInfo.color }]}>
                        <sInfo.icon size={40} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.statusLabel, { color: sInfo.color }]}>{sInfo.label}</Text>
                    <Text style={styles.statusDesc}>{sInfo.desc}</Text>
                </View>

                {/* Order Meta */}
                <View style={styles.section}>
                    <View style={styles.metaBox}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>ID PESANAN</Text>
                            <Text style={styles.metaValue}>#{order.id}</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>WAKTU</Text>
                            <Text style={styles.metaValue}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                    </View>
                </View>

                {/* Items Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ShoppingBag size={18} color="#1E293B" />
                        <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
                    </View>

                    <View style={styles.itemsBox}>
                        {(order.items || []).map((item, idx) => (
                            <View key={idx} style={styles.orderItem}>
                                <View style={styles.itemMain}>
                                    <Text style={styles.itemQty}>{item.quantity}x</Text>
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        {(item.options || []).length > 0 && (
                                            <Text style={styles.itemOptions}>
                                                {item.options.map(o => o.name).join(', ')}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <Text style={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
                            </View>
                        ))}

                        <View style={styles.priceDivider} />

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={[styles.summaryLabel, { color: '#1E293B', fontSize: 15, fontWeight: '900' }]}>{formatCurrency((parseFloat(order.total) || 0) + (parseFloat(order.points_used) || 0) + (parseFloat(order.promo_discount) || 0))}</Text>
                        </View>
                        {order.points_used > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: '#0284C7' }]}>Potongan Poin</Text>
                                <Text style={[styles.summaryLabel, { color: '#0284C7', fontWeight: '900', fontSize: 13 }]}>-{formatCurrency(parseFloat(order.points_used) || 0)}</Text>
                            </View>
                        )}
                        {order.promo_discount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: '#059669' }]}>Diskon Promo</Text>
                                <Text style={[styles.summaryLabel, { color: '#059669', fontWeight: '900', fontSize: 13 }]}>-{formatCurrency(parseFloat(order.promo_discount) || 0)}</Text>
                            </View>
                        )}
                        <View style={[styles.summaryRow, { marginTop: 12 }]}>
                            <Text style={styles.summaryLabel}>Total Bayar</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(parseFloat(order.total) || 0)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Metode Pembayaran</Text>
                            <Text style={styles.paymentMethod}>
                                {order.payment_method === 'cash' ? 'Tunai' : (order.payment_method === 'transfer' ? 'Transfer Bank' : order.payment_method)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Card */}
                <View style={styles.actionCard}>
                    <Text style={styles.cardTitle}>Butuh bantuan?</Text>
                    <Text style={styles.cardDesc}>Hubungi penjual jika Anda memiliki pertanyaan terkait pesanan Anda.</Text>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.chatBtn}
                            onPress={() => navigation.navigate('ChatScreen')}
                        >
                            <MessageCircle size={20} color="#FFFFFF" />
                            <Text style={styles.chatBtnText}>Tanya Penjual</Text>
                        </TouchableOpacity>

                        {order.status === 'pending' && (
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={handleCancelOrder}
                            >
                                <XCircle size={20} color="#FFFFFF" />
                                <Text style={styles.cancelBtnText}>Batalkan Pesanan</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: getSafeBottomPadding(insets) }]}>
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.navigate('MainTabs')}
                >
                    <Text style={styles.primaryBtnText}>Kembali ke Beranda</Text>
                </TouchableOpacity>
            </View>

            {/* Custom Cancel Confirmation Modal */}
            <Modal
                transparent={true}
                visible={showCancelModal}
                animationType="fade"
                onRequestClose={() => setShowCancelModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconWrap}>
                            <XCircle size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.modalTitle}>Batalkan Pesanan?</Text>
                        <Text style={styles.modalDesc}>
                            Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setShowCancelModal(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>Tidak, Kembali</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnConfirm}
                                onPress={confirmCancelOrder}
                            >
                                <Text style={styles.modalBtnConfirmText}>Ya, Batalkan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginBottom: 24,
    },
    homeBtn: {
        backgroundColor: '#059669',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 18,
    },
    homeBtnText: {
        color: '#FFFFFF',
        fontWeight: '900',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    statusHero: {
        alignItems: 'center',
        padding: 40,
        margin: 20,
        borderRadius: 35,
    },
    statusIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...Platform.select({
            web: { boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' },
            android: { elevation: 8 }
        })
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 10,
    },
    statusDesc: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 10,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    metaBox: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    metaItem: {
        flex: 1,
        alignItems: 'center',
    },
    metaLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    metaDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#E2E8F0',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    itemsBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' },
            android: { elevation: 3 }
        })
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    itemMain: {
        flexDirection: 'row',
        flex: 1,
        gap: 12,
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '900',
        color: '#059669',
        minWidth: 24,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    itemOptions: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    priceDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: 'bold',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#059669',
    },
    paymentMethod: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1E293B',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    actionCard: {
        backgroundColor: '#1E293B',
        margin: 20,
        borderRadius: 30,
        padding: 24,
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 6,
    },
    cardDesc: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 20,
    },
    chatBtn: {
        backgroundColor: '#059669',
        height: 54,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    chatBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    primaryBtn: {
        backgroundColor: '#F1F5F9',
        height: 58,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: '900',
    },
    actionButtons: {
        gap: 12,
    },
    cancelBtn: {
        backgroundColor: '#EF4444',
        height: 54,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    cancelBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderRadius: 30,
        padding: 24,
        alignItems: 'center',
    },
    modalIconWrap: {
        width: 64,
        height: 64,
        backgroundColor: '#FEF2F2',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    modalDesc: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalActions: {
        width: '100%',
        gap: 12,
    },
    modalBtnConfirm: {
        backgroundColor: '#EF4444',
        height: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBtnConfirmText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    modalBtnCancel: {
        backgroundColor: '#F1F5F9',
        height: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBtnCancelText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '900',
    },
});

export default OrderDetails;
