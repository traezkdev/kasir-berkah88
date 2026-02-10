import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    Platform,
    Animated,
    Easing,
    StatusBar,
    AppState
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Store,
    Package,
    Star,
    ShoppingBag,
    BarChart3,
    MessageCircle,
    ShoppingCart,
    PlusCircle,
    History,
    CheckCircle,
    XCircle,
    PlayCircle,
    ChevronRight,
    Clock,
    User,
    Gift,
    Image as ImageIcon,
    TrendingDown,
    Wallet,
    Calculator,
    ClipboardCheck,
    Ticket,
    Bell
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SellerOrderCard from '../../components/SellerOrderCard';
import OrderDetailModal from '../../components/OrderDetailModal';
import { useChat } from '../../context/ChatContext';

const { width } = Dimensions.get('window');

const SellerDashboard = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [stats, setStats] = useState({
        activeBanners: 0,
        featuredItems: 0,
        totalItems: 0,
        categories: 0
    });
    const [isOpen, setIsOpen] = useState(true);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { unreadCount } = useChat();

    // Modal State
    const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Animation for unread badge
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (unreadCount > 0) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [unreadCount]);

    const fetchData = useCallback(async () => {
        try {
            // Fetch Shop Status
            const settingsRes = await apiService.get('/api/restaurant-settings');
            setIsOpen(settingsRes.data.data.is_open === 1);

            // Fetch Stats (We'll combine multiple requests like the web version)
            const [bannersRes, menuRes, catRes, ordersRes] = await Promise.all([
                apiService.get('/api/banners/all'),
                apiService.get('/api/menu-items?limit=1000'),
                apiService.get('/api/categories'),
                apiService.get('/api/orders?status=pending')
            ]);

            setStats({
                activeBanners: bannersRes.data.data ? bannersRes.data.data.filter(b => b.is_active).length : 0,
                featuredItems: menuRes.data.data ? menuRes.data.data.filter(m => m.is_featured).length : 0,
                totalItems: menuRes.data.data ? menuRes.data.data.length : 0,
                categories: catRes.data.data ? catRes.data.data.length : 0
            });

            setPendingOrders(ordersRes.data.data || []);
        } catch (error) {
            console.error('Error fetching seller data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Polling like web
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                console.log('App has come to the foreground! Refreshing data...');
                fetchData();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const toggleShopStatus = async () => {
        const newStatus = !isOpen;
        try {
            await apiService.patch('/api/restaurant-settings/status', { is_open: newStatus });
            setIsOpen(newStatus);
            showToast(`Toko telah ${newStatus ? 'dibuka' : 'ditutup'}`, 'success');
        } catch (error) {
            showToast('Gagal mengubah status toko', 'error');
        }
    };

    const handleUpdateStatus = useCallback(async (orderId, status) => {
        try {
            await apiService.put(`/api/orders/${orderId}/status`, { status });
            showToast(`Pesanan telah ${status === 'accepted' ? 'diterima' : 'ditolak'}`, 'success');
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.error || 'Gagal memperbarui status pesanan', 'error');
        }
    }, [showToast, fetchData]);

    const handleViewDetail = useCallback((order) => {
        setSelectedOrderForDetail(order);
        setShowDetailModal(true);
    }, []);

    const handleAccept = useCallback((orderId) => {
        handleUpdateStatus(orderId, 'accepted');
    }, [handleUpdateStatus]);

    const handleReject = useCallback((orderId) => {
        handleUpdateStatus(orderId, 'rejected');
    }, [handleUpdateStatus]);

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#138FEA" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
            {/* Fixed Gradient Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <View>
                        <View style={styles.roleBadge}>
                            <Store size={14} color="#FFFFFF" />
                            <Text style={styles.roleText}>Kerongkongan berkah 88</Text>
                        </View>
                        <Text style={styles.welcomeText}>Halo, {user?.name}!</Text>
                        <Text style={styles.subtitleText}>Pantau tokomu hari ini</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => navigation.navigate('ChatScreen')}
                        >
                            <MessageCircle size={22} color="#FFFFFF" />
                            {unreadCount > 0 && (
                                <Animated.View style={[
                                    styles.unreadBadge,
                                    { transform: [{ scale: pulseAnim }] }
                                ]}>
                                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                                </Animated.View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                            onPress={() => navigation.navigate('ProfileScreen')}
                        >
                            <User size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Floating Shop Status Card */}
                <View style={styles.statusCard}>
                    <View>
                        <Text style={styles.statusLabel}>STATUS TOKO</Text>
                        <View style={styles.statusValueRow}>
                            <View style={[styles.statusDot, { backgroundColor: isOpen ? '#22C55E' : '#EF4444' }]} />
                            <Text style={[styles.statusValue, { color: isOpen ? '#1E293B' : '#EF4444' }]}>
                                {isOpen ? 'Online & Aktif' : 'Toko Tutup'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={toggleShopStatus}
                        style={[styles.toggleBtn, { backgroundColor: isOpen ? '#FEF2F2' : '#F0FDF4', borderColor: isOpen ? '#FEE2E2' : '#DCFCE7' }]}
                    >
                        <Text style={[styles.toggleBtnText, { color: isOpen ? '#EF4444' : '#22C55E' }]}>
                            {isOpen ? 'Tutup Toko' : 'Buka Toko'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        progressViewOffset={200}
                        colors={['#1E40AF']}
                    />
                }
                showsVerticalScrollIndicator={false}
            >

                {/* Quick Stats */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statItem, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                        <View style={styles.statContent}>
                            <View style={[styles.statIcon, { backgroundColor: '#FFFFFF' }]}><Package size={22} color="#3B82F6" /></View>
                            <View>
                                <Text style={[styles.statNum, { color: '#1E3A8A' }]}>{stats.totalItems}</Text>
                                <Text style={[styles.statLabel, { color: '#3B82F6' }]}>Produk</Text>
                            </View>
                        </View>
                        <View style={styles.statDecor}>
                            <Package size={60} color="#3B82F6" opacity={0.2} />
                        </View>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
                        <View style={styles.statContent}>
                            <View style={[styles.statIcon, { backgroundColor: '#FFFFFF' }]}><Star size={22} color="#F97316" /></View>
                            <View>
                                <Text style={[styles.statNum, { color: '#7C2D12' }]}>{stats.featuredItems}</Text>
                                <Text style={[styles.statLabel, { color: '#F97316' }]}>Unggulan</Text>
                            </View>
                        </View>
                        <View style={styles.statDecor}>
                            <Star size={60} color="#F97316" opacity={0.2} />
                        </View>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
                        <View style={styles.statContent}>
                            <View style={[styles.statIcon, { backgroundColor: '#FFFFFF' }]}><ShoppingBag size={22} color="#22C55E" /></View>
                            <View>
                                <Text style={[styles.statNum, { color: '#14532D' }]}>{pendingOrders.length}</Text>
                                <Text style={[styles.statLabel, { color: '#22C55E' }]}>Pesanan</Text>
                            </View>
                        </View>
                        <View style={styles.statDecor}>
                            <ShoppingBag size={60} color="#22C55E" opacity={0.2} />
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.statItem, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}
                        onPress={() => navigation.navigate('CategoryManagement')}
                    >
                        <View style={styles.statContent}>
                            <View style={[styles.statIcon, { backgroundColor: '#FFFFFF' }]}><BarChart3 size={22} color="#A855F7" /></View>
                            <View>
                                <Text style={[styles.statNum, { color: '#581C87' }]}>{stats.categories}</Text>
                                <Text style={[styles.statLabel, { color: '#A855F7' }]}>Kategori</Text>
                            </View>
                        </View>
                        <View style={styles.statDecor}>
                            <BarChart3 size={60} color="#A855F7" opacity={0.2} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SellerMenu')}>
                            <Text style={styles.viewAll}>Lainnya</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.actionGrid}>
                        {[
                            { label: 'Laporan', icon: ClipboardCheck, color: '#10B981', bgColor: '#ECFDF5', target: 'DailyReport' },
                            { label: 'Chat', icon: MessageCircle, color: '#3B82F6', bgColor: '#EFF6FF', target: 'ChatScreen' },
                            { label: 'Jual', icon: ShoppingCart, color: '#FFFFFF', bgColor: '#138FEA', target: 'Jual' },
                            { label: 'Informasi', icon: Bell, color: '#F59E0B', bgColor: '#FFFBEB', target: 'ManageInformation' },
                            { label: 'Rekon', icon: Calculator, color: '#6366F1', bgColor: '#F5F3FF', target: 'CashReconciliation' },
                            { label: 'Pengeluaran', icon: TrendingDown, color: '#EF4444', bgColor: '#FEF2F2', target: 'ExpenseManagement' },
                        ].map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.actionItem}
                                onPress={() => navigation.navigate(action.target)}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                                    <action.icon size={25} color={action.color} />
                                </View>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                        {(user?.role === 'admin' || user?.role === 'owner') && (
                            <TouchableOpacity
                                style={styles.actionItem}
                                onPress={() => navigation.navigate('PromoManagement')}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                                    <Ticket size={25} color="#059669" />
                                </View>
                                <Text style={styles.actionLabel}>Promo</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('Transaksi')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}>
                                <History size={25} color="#8B5CF6" />
                            </View>
                            <Text style={styles.actionLabel}>Riwayat</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Pending Orders */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Pesanan Baru</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Pesanan')}>
                            <Text style={styles.viewAll}>Lihat Semua</Text>
                        </TouchableOpacity>
                    </View>

                    {pendingOrders.length > 0 ? (
                        pendingOrders.slice(0, 3).map((order) => (
                            <SellerOrderCard
                                key={order.id}
                                order={order}
                                onAccept={handleAccept}
                                onReject={handleReject}
                                onViewDetail={handleViewDetail}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <CheckCircle size={40} color="#22C55E" />
                            <Text style={styles.emptyTitle}>Semua Aman!</Text>
                            <Text style={styles.emptyBody}>Belum ada pesanan baru yang menunggu.</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Order Detail Modal */}
            {selectedOrderForDetail && (
                <OrderDetailModal
                    visible={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    order={selectedOrderForDetail}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#1E40AF',
        paddingBottom: 80,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    scrollContent: {
        paddingTop: 240, // Tinggi header + floating card
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 15,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    roleText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 6,
        letterSpacing: 1,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subtitleText: {
        fontSize: 14,
        color: '#BFDBFE',
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    iconBtn: {
        width: 45,
        height: 45,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    unreadBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#EF4444',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#1E40AF',
    },
    unreadBadgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    statusCard: {
        position: 'absolute',
        bottom: -40,
        left: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.1)' },
            android: { elevation: 8 }
        })
    },
    statusLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    statusValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    toggleBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    toggleBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    statsGrid: {
        marginTop: 35,
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
    },
    statItem: {
        width: (width - 50) / 2,
        backgroundColor: '#FFFFFF',
        margin: 5,
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
    },
    statContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    statDecor: {
        position: 'absolute',
        bottom: -15,
        right: -15,
        zIndex: 0,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statNum: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    statLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    section: {
        marginTop: 25,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    viewAll: {
        fontSize: 14,
        color: '#138FEA',
        fontWeight: '600',
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionItem: {
        alignItems: 'center',
        width: (width - 40) / 4,
        marginBottom: 20,
    },
    actionIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    orderCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    orderIdGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderId: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginLeft: 6,
    },
    orderTime: {
        fontSize: 12,
        color: '#94A3B8',
    },
    custName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    itemsSummary: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 12,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    orderTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    btnRow: {
        flexDirection: 'row',
        gap: 8,
    },
    btnSmallReject: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    btnSmallTextReject: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    btnSmallAccept: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#3B82F6',
    },
    btnSmallTextAccept: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    emptyCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DCFCE7',
        borderStyle: 'dashed',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#166534',
        marginTop: 12,
    },
    emptyBody: {
        fontSize: 13,
        color: '#15803D',
        textAlign: 'center',
        marginTop: 4,
    }
});

export default SellerDashboard;
