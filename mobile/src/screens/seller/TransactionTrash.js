
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Modal,
    Pressable,
    Animated
} from 'react-native';
import {
    ChevronLeft,
    RotateCcw,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Receipt
} from 'lucide-react-native';
import apiService from '../../api/apiService';

const { width } = Dimensions.get('window');

const TransactionTrash = ({ navigation }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showPremiumConfirm, setShowPremiumConfirm] = useState(false);
    const [confirmType, setConfirmType] = useState('restore'); // 'restore' or 'delete'
    const [selectedTxId, setSelectedTxId] = useState(null);

    const fetchTrashedTransactions = async () => {
        try {
            setLoading(true);
            const response = await apiService.get('/api/transactions/trash');
            if (response.data && response.data.message === 'success') {
                const parsed = response.data.data.map(t => ({
                    ...t,
                    items: typeof t.items === 'string' ? JSON.parse(t.items || '[]') : (t.items || [])
                }));
                setTransactions(parsed);
            }
        } catch (error) {
            console.error('Fetch trashed transactions error:', error);
            Alert.alert("Error", "Gagal mengambil data sampah.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTrashedTransactions();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTrashedTransactions();
    }, []);

    const handleRestore = (id) => {
        setSelectedTxId(id);
        setConfirmType('restore');
        setShowPremiumConfirm(true);
    };

    const handlePermanentDelete = (id) => {
        setSelectedTxId(id);
        setConfirmType('delete');
        setShowPremiumConfirm(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedTxId) return;

        try {
            setLoading(true);
            let response;
            if (confirmType === 'restore') {
                response = await apiService.put(`/api/transactions/${selectedTxId}/restore`);
                if (response.data && response.data.message === 'restored') {
                    setShowPremiumConfirm(false);
                    fetchTrashedTransactions();
                }
            } else {
                response = await apiService.delete(`/api/transactions/${selectedTxId}/permanent`);
                if (response.data && response.data.message === 'permanently deleted') {
                    setShowPremiumConfirm(false);
                    fetchTrashedTransactions();
                }
            }
        } catch (error) {
            console.error(`${confirmType} error:`, error);
            Alert.alert("Error", `Gagal ${confirmType === 'restore' ? 'memulihkan' : 'menghapus'} transaksi.`);
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
                <View>
                    <Text style={styles.cardId}>#{item.id}</Text>
                    <Text style={styles.cardDate}>{formatDate(item.deleted_at)} (Dihapus)</Text>
                </View>
                <View style={styles.trashBadge}>
                    <Text style={styles.trashBadgeText}>SAMPAH</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.itemsList}>
                {item.items.map((prod, idx) => (
                    <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>{prod.name}</Text>
                        <Text style={styles.itemQty}>x{prod.qty || prod.quantity || 1}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.restoreBtn}
                        onPress={() => handleRestore(item.id)}
                    >
                        <RotateCcw size={18} color="#059669" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handlePermanentDelete(item.id)}
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
                    <Text style={styles.headerTitle}>Tong Sampah</Text>
                    <Text style={styles.headerSubtitle}>Transaksi yang telah dihapus</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#1E40AF" />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E40AF']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <AlertTriangle size={64} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Tong sampah kosong</Text>
                        </View>
                    }
                />
            )}

            {/* Premium Confirmation Modal */}
            <Modal visible={showPremiumConfirm} transparent animationType="fade">
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
                            {confirmType === 'restore' ? 'Pulihkan Transaksi?' : 'Hapus Permanen?'}
                        </Text>
                        <Text style={styles.confirmSubtitle}>
                            {confirmType === 'restore'
                                ? `Transaksi #${selectedTxId} akan dikembalikan ke daftar riwayat penjualan utama.`
                                : `Transaksi #${selectedTxId} akan dihapus selamanya dari sistem. Tindakan ini tidak dapat dibatalkan.`
                            }
                        </Text>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={styles.confirmCancelBtn}
                                onPress={() => setShowPremiumConfirm(false)}
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 25,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: 'bold',
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
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardId: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: 'bold',
    },
    trashBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trashBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#DC2626',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    itemsList: {
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 13,
        color: '#475569',
        fontWeight: 'bold',
        flex: 1,
    },
    itemQty: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
    },
    totalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
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
        width: 40,
        height: 40,
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    confirmCard: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxWidth: 340,
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    confirmIconBg: {
        width: 64,
        height: 64,
        backgroundColor: '#FEF2F2',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    confirmSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        fontWeight: 'bold',
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmCancelBtn: {
        flex: 1,
        height: 54,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmCancelText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#64748B',
    },
    confirmDeleteBtn: {
        flex: 1,
        height: 54,
        borderRadius: 18,
        backgroundColor: '#DC2626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmDeleteText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});

export default TransactionTrash;
