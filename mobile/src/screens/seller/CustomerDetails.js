import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    StatusBar,
    FlatList,
    RefreshControl
} from 'react-native';
import {
    ChevronLeft,
    User,
    Phone,
    MapPin,
    History,
    ShoppingBag,
    TrendingUp,
    Calendar,
    ArrowRight,
    ChevronRight,
    RefreshCw,
    Mail
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import OrderDetailModal from '../../components/OrderDetailModal';
import ReceiptModal from '../../components/ReceiptModal';

const CustomerDetails = ({ navigation, route }) => {
    const { customerName, customerPhone, customerAddress, customerEmail: initialEmail } = route.params;
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [stats, setStats] = useState({
        totalSpent: 0,
        totalOrders: 0
    });
    const [points, setPoints] = useState(0);
    const [customerEmail, setCustomerEmail] = useState(initialEmail || '');
    const [refreshing, setRefreshing] = useState(false);

    // Pagination for transactions
    const [txPage, setTxPage] = useState(1);
    const [txTotalPages, setTxTotalPages] = useState(1);
    const [txTotalItems, setTxTotalItems] = useState(0);
    const [txTotalAmount, setTxTotalAmount] = useState(0);
    const [txLoading, setTxLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Modal states
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const fetchData = useCallback(async (pageNum = 1) => {
        if (pageNum === 1) setLoading(true);
        else setTxLoading(true);

        try {
            // Fetch Transactions by customer name (Paginated: 10 per page)
            const txRes = await apiService.get(`/api/transactions?search=${customerName}&page=${pageNum}&limit=10`);
            if (txRes.data && txRes.data.message === 'success') {
                const txData = txRes.data.data || [];
                const parsedTx = txData.map(t => ({
                    ...t,
                    items: typeof t.items === 'string' ? JSON.parse(t.items || '[]') : (t.items || [])
                }));

                if (pageNum === 1) {
                    setTransactions(parsedTx);
                } else {
                    setTransactions(prev => [...prev, ...parsedTx]);
                }

                const pagin = txRes.data.pagination;
                setTxTotalPages(pagin.totalPages || 1);
                setTxTotalItems(pagin.totalItems || 0);
                setTxTotalAmount(pagin.totalAmount || 0);
                setTxPage(pageNum);
                setHasMore(pageNum < pagin.totalPages);
            }

            // Fetch Active Orders (Stay with limited search for now)
            const orderRes = await apiService.get(`/api/orders?search=${customerName}&limit=20`);
            const allOrders = orderRes.data.data || [];
            const parsedOrders = allOrders.map(o => ({
                ...o,
                items: typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || [])
            }));

            const filteredOrders = parsedOrders.filter(o =>
                (o.customer_name && o.customer_name.toLowerCase() === customerName.toLowerCase()) ||
                (o.customer_phone && customerPhone && o.customer_phone === customerPhone)
            ).filter(o => ['pending', 'accepted'].includes(o.status));
            setActiveOrders(filteredOrders);

            // Fetch Customer Points (if registered)
            try {
                const searchQ = customerPhone || customerName;
                if (searchQ && searchQ.length > 2) {
                    const userRes = await apiService.get(`/api/customers/search?query=${searchQ}`);
                    if (userRes.data.data && userRes.data.data.length > 0) {
                        const match = userRes.data.data.find(u =>
                            (customerPhone && u.phone === customerPhone) ||
                            (u.name.toLowerCase() === customerName.toLowerCase())
                        );
                        if (match) {
                            setPoints(match.points || 0);
                            if (match.email) setCustomerEmail(match.email);
                        }
                    }
                }
            } catch (err) {
                console.log('Error fetching user points:', err);
            }

        } catch (error) {
            console.error('Error fetching customer details:', error);
        } finally {
            setLoading(false);
            setTxLoading(false);
            setRefreshing(false);
        }
    }, [customerName, customerPhone]);

    const handleLoadMore = () => {
        if (!txLoading && hasMore && !loading) {
            fetchData(txPage + 1);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(val || 0);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const getStatusLabel = (status) => {
        const map = {
            'pending': 'MENUNGGU',
            'accepted': 'DIPROSES',
            'ready': 'SIAP',
            'completed': 'SELESAI',
            'cancelled': 'DIBATALKAN'
        };
        return map[status?.toLowerCase()] || status?.toUpperCase();
    };

    const renderHeader = () => (
        <View style={styles.headerContent}>
            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <User size={40} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text style={styles.customerNameText}>{customerName}</Text>

                <View style={styles.contactInfo}>
                    <View style={styles.infoBadge}>
                        <Phone size={14} color="#138FEA" />
                        <Text style={styles.infoBadgeText}>{customerPhone || '-'}</Text>
                    </View>
                    {points > 0 && (
                        <View style={[styles.infoBadge, { backgroundColor: '#DCFCE7' }]}>
                            <Text style={[styles.infoBadgeText, { color: '#166534' }]}>{Math.floor(points)} Poin</Text>
                        </View>
                    )}
                    <View style={[styles.infoBadge, { backgroundColor: '#F1F5F9' }]}>
                        <Mail size={14} color="#64748B" />
                        <Text style={[styles.infoBadgeText, { color: '#64748B' }]}>{customerEmail || 'No Email'}</Text>
                    </View>
                </View>

                <View style={styles.addressBox}>
                    <MapPin size={16} color="#94A3B8" />
                    <Text style={styles.addressText}>{customerAddress || 'Alamat tidak tersedia'}</Text>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={[styles.statIconBg, { backgroundColor: '#F0F9FF' }]}>
                        <TrendingUp size={20} color="#138FEA" />
                    </View>
                    <Text style={styles.statLabel}>TOTAL BELANJA</Text>
                    <Text style={styles.statValue}>{formatCurrency(txTotalAmount)}</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.statIconBg, { backgroundColor: '#F0FDF4' }]}>
                        <ShoppingBag size={20} color="#10B981" />
                    </View>
                    <Text style={styles.statLabel}>JUMLAH PESANAN</Text>
                    <Text style={styles.statValue}>{txTotalItems}x</Text>
                </View>
            </View>

            {/* Active Orders Section */}
            {activeOrders.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Pesanan Aktif</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{activeOrders.length}</Text>
                        </View>
                    </View>
                    {activeOrders.map((order) => (
                        <TouchableOpacity
                            key={order.id}
                            style={styles.orderItem}
                            activeOpacity={0.7}
                            onPress={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                            }}
                        >
                            <View style={styles.orderLeft}>
                                <View style={styles.orderStatusDot} />
                                <View>
                                    <Text style={styles.orderId}>Pesanan #{order.id}</Text>
                                    <Text style={styles.orderStatus}>{getStatusLabel(order.status || 'Pending')}</Text>
                                </View>
                            </View>
                            <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
                <History size={18} color="#64748B" />
            </View>
        </View>
    );

    const renderTxItem = ({ item: tx }) => (
        <TouchableOpacity
            key={tx.id}
            style={styles.txRow}
            activeOpacity={0.7}
            onPress={() => {
                setSelectedTx(tx);
                setShowReceiptModal(true);
            }}
        >
            <View style={styles.txLeft}>
                <View style={styles.txIcon}>
                    <Calendar size={14} color="#64748B" />
                </View>
                <View>
                    <Text style={styles.txId}>#{tx.id}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.timestamp)}</Text>
                </View>
            </View>
            <View style={styles.txRight}>
                <Text style={styles.txAmount}>{formatCurrency(tx.total)}</Text>
                <ArrowRight size={14} color="#CBD5E1" />
            </View>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!txLoading) return <View style={{ height: 40 }} />;
        return (
            <View style={styles.txLoadingFooter}>
                <ActivityIndicator size="small" color="#138FEA" />
                <Text style={styles.txLoadingText}>Memuat lebih banyak...</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil Pelanggan</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && txPage === 1 ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#138FEA" />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTxItem}
                    keyExtractor={item => item.id.toString()}
                    ListHeaderComponent={renderHeader}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>Belum ada riwayat transaksi</Text>
                        </View>
                    }
                    contentContainerStyle={styles.listContent}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Modals */}
            {selectedOrder && (
                <OrderDetailModal
                    visible={showOrderModal}
                    onClose={() => setShowOrderModal(false)}
                    order={selectedOrder}
                />
            )}

            {selectedTx && (
                <ReceiptModal
                    visible={showReceiptModal}
                    onClose={() => setShowReceiptModal(false)}
                    transaction={selectedTx}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 24,
        ...Platform.select({
            android: { elevation: 4 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }
        })
    },
    avatar: {
        width: 80,
        height: 80,
        backgroundColor: '#138FEA',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    customerNameText: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    contactInfo: {
        flexDirection: 'column',
        gap: 10,
        marginBottom: 20,
        width: '100%',
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 10,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    infoBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#138FEA',
    },
    addressBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        gap: 12,
        width: '100%',
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        color: '#64748B',
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 30,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    countBadge: {
        backgroundColor: '#1E40AF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    countText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    orderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    orderStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F59E0B',
    },
    orderId: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    orderStatus: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
    },
    orderTotal: {
        fontSize: 14,
        fontWeight: '900',
        color: '#148FEA',
    },
    txRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F8FAFC',
    },
    txLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    txIcon: {
        width: 32,
        height: 32,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    txId: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    txDate: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    txRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    txAmount: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    emptyBox: {
        backgroundColor: '#FFFFFF',
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    emptyText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    headerContent: {
        marginBottom: 10,
    },
    txLoadingFooter: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    txLoadingText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: 'bold',
    },
});

export default CustomerDetails;
