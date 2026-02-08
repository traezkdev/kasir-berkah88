import React, { useState, useEffect, useCallback } from 'react';
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
    FlatList,
    RefreshControl
} from 'react-native';
import {
    ArrowLeft,
    ShoppingBag,
    Clock,
    CheckCircle2,
    XCircle,
    Slash,
    Info,
    MessageCircle,
    RefreshCcw,
    ChevronRight,
    Search
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const OrderHistory = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchOrders = useCallback(async (pageNum = 1, isRefresh = false) => {
        if (!isRefresh && pageNum === 1) setIsLoading(true);
        try {
            const response = await apiService.get(`/api/orders?page=${pageNum}&limit=10`);
            const result = response.data;

            if (result.message === 'success') {
                const newOrders = result.data;
                if (pageNum === 1) {
                    setOrders(newOrders);
                } else {
                    setOrders(prev => [...prev, ...newOrders]);
                }
                setHasMore(newOrders.length === 10);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(1);
    }, [fetchOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders(1, true);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return { label: 'Baru', icon: Clock, color: '#F59E0B', bg: '#FFFBEB' };
            case 'accepted':
                return { label: 'Diproses', icon: ShoppingBag, color: '#138FEA', bg: '#EFF6FF' };
            case 'ready':
                return { label: 'Siap Diambil', icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5' };
            case 'rejected':
                return { label: 'Ditolak', icon: XCircle, color: '#EF4444', bg: '#FEF2F2' };
            case 'cancelled':
                return { label: 'Batal', icon: Slash, color: '#64748B', bg: '#F8FAFC' };
            case 'completed':
                return { label: 'Selesai', icon: CheckCircle2, color: '#059669', bg: '#ECFDF5' };
            default:
                return { label: status, icon: Info, color: '#64748B', bg: '#F8FAFC' };
        }
    };

    const renderOrderItem = ({ item }) => {
        const status = getStatusInfo(item.status);
        const orderItems = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.statusIconWrap, { backgroundColor: status.bg }]}>
                            <status.icon size={20} color={status.color} />
                        </View>
                        <View>
                            <Text style={styles.orderId}>ID PESANAN #{item.id}</Text>
                            <Text style={[styles.statusLabel, { color: status.color }]}>{status.label.toUpperCase()}</Text>
                        </View>
                    </View>
                    <Text style={styles.orderTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>

                <View style={styles.cardBody}>
                    {orderItems.slice(0, 2).map((oi, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemName} numberOfLines={1}>{oi.name}</Text>
                            <Text style={styles.itemQty}>x{oi.quantity}</Text>
                        </View>
                    ))}
                    {orderItems.length > 2 && (
                        <Text style={styles.moreItems}>+{orderItems.length - 2} item lainnya</Text>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.totalLabel}>TOTAL PEMBAYARAN</Text>
                        <Text style={styles.totalValue}>{formatCurrency(item.total_amount || item.total)}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                    >
                        <Text style={styles.detailBtnText}>Lihat Detail</Text>
                        <ChevronRight size={14} color="#059669" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={20} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pesanan Saya</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <RefreshCcw size={18} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loadingArea}>
                    <ActivityIndicator size="large" color="#059669" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
                    ListEmptyComponent={
                        <View style={styles.emptyArea}>
                            <ShoppingBag size={60} color="#E2E8F0" />
                            <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
                            <Text style={styles.emptySubtitle}>Anda belum melakukan pemesanan apapun hari ini.</Text>
                            <TouchableOpacity
                                style={styles.orderNowBtn}
                                onPress={() => navigation.navigate('Menu')}
                            >
                                <Text style={styles.orderNowText}>Pesan Sekarang</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    onEndReached={() => {
                        if (hasMore && !isLoading) {
                            fetchOrders(page + 1);
                        }
                    }}
                    onEndReachedThreshold={0.5}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' },
            android: { elevation: 3 }
        })
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderId: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    statusLabel: {
        fontSize: 13,
        fontWeight: '900',
    },
    orderTime: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    cardBody: {
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F8FAFC',
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
        flex: 1,
    },
    itemQty: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    moreItems: {
        fontSize: 11,
        color: '#94A3B8',
        fontStyle: 'italic',
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 2,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#059669',
    },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    detailBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#059669',
    },
    emptyArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    orderNowBtn: {
        backgroundColor: '#059669',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 18,
    },
    orderNowText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
    }
});

export default OrderHistory;
