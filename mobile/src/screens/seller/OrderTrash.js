
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Dimensions,
    RefreshControl,
    StatusBar,
    Alert,
    Modal
} from 'react-native';
import {
    ChevronLeft,
    RotateCcw,
    Trash2,
    AlertTriangle,
    ShoppingBag,
    User,
    Calendar
} from 'lucide-react-native';
import apiService from '../../api/apiService';

const { width } = Dimensions.get('window');

const OrderTrash = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmType, setConfirmType] = useState('restore'); // 'restore' or 'delete'
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const fetchTrashedOrders = async () => {
        try {
            setLoading(true);
            const response = await apiService.get('/api/orders/trash');
            if (response.data && response.data.message === 'success') {
                const parsed = response.data.data.map(o => ({
                    ...o,
                    items: typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || [])
                }));
                setOrders(parsed);
            }
        } catch (error) {
            console.error('Fetch trashed orders error:', error);
            Alert.alert("Error", "Gagal mengambil data sampah pesanan.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTrashedOrders();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTrashedOrders();
    }, []);

    const handleRestore = (id) => {
        setSelectedOrderId(id);
        setConfirmType('restore');
        setShowConfirmModal(true);
    };

    const handlePermanentDelete = (id) => {
        setSelectedOrderId(id);
        setConfirmType('delete');
        setShowConfirmModal(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedOrderId) return;

        try {
            setLoading(true);
            if (confirmType === 'restore') {
                const response = await apiService.put(`/api/orders/${selectedOrderId}/restore`);
                if (response.data && response.data.message === 'restored') {
                    setShowConfirmModal(false);
                    fetchTrashedOrders();
                }
            } else {
                const response = await apiService.delete(`/api/orders/${selectedOrderId}/permanent`);
                if (response.data && response.data.message === 'permanently_deleted') {
                    setShowConfirmModal(false);
                    fetchTrashedOrders();
                }
            }
        } catch (error) {
            console.error(`${confirmType} error:`, error);
            Alert.alert("Error", `Gagal ${confirmType === 'restore' ? 'memulihkan' : 'menghapus'} pesanan.`);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerInfo}>
                    <View style={styles.orderIdContainer}>
                        <ShoppingBag size={14} color="#1E40AF" strokeWidth={3} />
                        <Text style={styles.cardId}>PESANAN #{item.id}</Text>
                    </View>
                    <View style={styles.dateInfo}>
                        <Calendar size={12} color="#94A3B8" />
                        <Text style={styles.cardDate}>{formatDate(item.deleted_at)}</Text>
                    </View>
                </View>
                <View style={styles.trashBadge}>
                    <Text style={styles.trashBadgeText}>TERHAPUS</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.customerRow}>
                <View style={styles.customerAvatar}>
                    <User size={16} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View style={styles.customerInfo}>
                    <Text style={styles.customerLabel}>Pelanggan</Text>
                    <Text style={styles.customerName}>{item.customer_name || 'Pelanggan Umum'}</Text>
                </View>
            </View>

            <View style={styles.itemsList}>
                {item.items.slice(0, 3).map((prod, idx) => (
                    <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>• {prod.name}</Text>
                        <Text style={styles.itemQty}>x{prod.quantity || prod.qty || 1}</Text>
                    </View>
                ))}
                {item.items.length > 3 && (
                    <Text style={styles.moreItemsText}>+ {item.items.length - 3} item lainnya</Text>
                )}
            </View>

            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.totalLabel}>TOTAL PESANAN</Text>
                    <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.restoreBtn}
                        onPress={() => handleRestore(item.id)}
                        activeOpacity={0.7}
                    >
                        <RotateCcw size={18} color="#059669" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handlePermanentDelete(item.id)}
                        activeOpacity={0.7}
                    >
                        <Trash2 size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Sampah Pesanan</Text>
                    <Text style={styles.headerSubtitle}>Daftar pesanan yang dibuang</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#1E40AF" />
                    <Text style={styles.loaderText}>Memuat data...</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E40AF']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Trash2 size={48} color="#E2E8F0" />
                            </View>
                            <Text style={styles.emptyTitle}>Tong Sampah Kosong</Text>
                            <Text style={styles.emptySubtitle}>Tidak ada pesanan yang dihapus.</Text>
                        </View>
                    }
                />
            )}

            {/* Confirmation Modal */}
            <Modal visible={showConfirmModal} transparent animationType="fade">
                <View style={styles.confirmOverlay}>
                    <View style={styles.confirmCard}>
                        <View style={[styles.confirmIconBg, { backgroundColor: confirmType === 'restore' ? '#ECFDF5' : '#FEF2F2' }]}>
                            {confirmType === 'restore' ? (
                                <RotateCcw size={32} color="#059669" />
                            ) : (
                                <AlertTriangle size={32} color="#DC2626" />
                            )}
                        </View>
                        <Text style={styles.confirmTitle}>
                            {confirmType === 'restore' ? 'Pulihkan Pesanan?' : 'Hapus Permanen?'}
                        </Text>
                        <Text style={styles.confirmSubtitle}>
                            {confirmType === 'restore'
                                ? `Pesanan #${selectedOrderId} akan dikembalikan ke manajemen pesanan utama.`
                                : `Pesanan #${selectedOrderId} akan dihapus selamanya dari sistem. Tindakan ini tidak dapat dibatalkan.`
                            }
                        </Text>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={styles.confirmCancelBtn}
                                onPress={() => setShowConfirmModal(false)}
                                disabled={loading}
                            >
                                <Text style={styles.confirmCancelText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmDeleteBtn, { backgroundColor: confirmType === 'restore' ? '#059669' : '#DC2626' }]}
                                onPress={handleConfirmAction}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmDeleteText}>
                                        {confirmType === 'restore' ? 'Ya, Pulihkan' : 'Ya, Hapus'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#1E40AF',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 60,
        paddingBottom: 25,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 8px 16px rgba(0,0,0,0.05)' },
            android: { elevation: 3 },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            }
        })
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerInfo: {
        flex: 1,
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    cardId: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1E40AF',
        letterSpacing: 0.5,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardDate: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '700',
    },
    trashBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    trashBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#DC2626',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
        borderStyle: 'dashed',
        borderRadius: 1,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 14,
    },
    customerAvatar: {
        width: 32,
        height: 32,
        backgroundColor: '#3B82F6',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerInfo: {
        marginLeft: 10,
    },
    customerLabel: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    customerName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    itemsList: {
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
        flex: 1,
    },
    itemQty: {
        fontSize: 13,
        color: '#1E40AF',
        fontWeight: '900',
        marginLeft: 10,
    },
    moreItemsText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '700',
        marginTop: 4,
        fontStyle: 'italic',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    restoreBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#ECFDF5',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    deleteBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#FEF2F2',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    confirmCard: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxWidth: 360,
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 20px 40px rgba(0,0,0,0.2)' },
            android: { elevation: 12 }
        })
    },
    confirmIconBg: {
        width: 72,
        height: 72,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 10,
    },
    confirmSubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
        fontWeight: '600',
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmCancelBtn: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmCancelText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#64748B',
    },
    confirmDeleteBtn: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmDeleteText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});

export default OrderTrash;
