import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    RefreshControl,
    Platform
} from 'react-native';
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
    Clock
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import SellerOrderCard from '../../components/SellerOrderCard';

const { width } = Dimensions.get('window');

const SellerDashboard = ({ navigation }) => {
    const { user } = useAuth();
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

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const toggleShopStatus = async () => {
        const newStatus = !isOpen;
        try {
            await apiService.patch('/api/restaurant-settings/status', { is_open: newStatus });
            setIsOpen(newStatus);
            Alert.alert('Sukses', `Toko telah ${newStatus ? 'dibuka' : 'ditutup'}`);
        } catch (error) {
            Alert.alert('Eror', 'Gagal mengubah status toko');
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        try {
            await apiService.put(`/api/orders/${orderId}/status`, { status });
            Alert.alert('Berhasil', `Pesanan telah ${status === 'accepted' ? 'diterima' : 'ditolak'}.`);
            fetchData();
        } catch (error) {
            Alert.alert('Eror', error.response?.data?.error || 'Gagal memperbarui status pesanan.');
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#138FEA" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
        >
            {/* Gradient Header Mockup */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <View style={styles.roleBadge}>
                            <Store size={14} color="#FFFFFF" />
                            <Text style={styles.roleText}>SELLER CENTER</Text>
                        </View>
                        <Text style={styles.welcomeText}>Halo, {user?.name}!</Text>
                        <Text style={styles.subtitleText}>Pantau tokomu hari ini</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <MessageCircle size={22} color="#FFFFFF" />
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

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}><Package size={20} color="#3B82F6" /></View>
                    <Text style={styles.statNum}>{stats.totalItems}</Text>
                    <Text style={styles.statLabel}>Produk</Text>
                </View>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}><Star size={20} color="#F97316" /></View>
                    <Text style={styles.statNum}>{stats.featuredItems}</Text>
                    <Text style={styles.statLabel}>Unggulan</Text>
                </View>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}><ShoppingBag size={20} color="#22C55E" /></View>
                    <Text style={styles.statNum}>{pendingOrders.length}</Text>
                    <Text style={styles.statLabel}>Pesanan</Text>
                </View>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#FAF5FF' }]}><BarChart3 size={20} color="#A855F7" /></View>
                    <Text style={styles.statNum}>{stats.categories}</Text>
                    <Text style={styles.statLabel}>Kategori</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aksi Cepat</Text>
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('Pesanan')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F1F5F9' }]}><ShoppingBag size={24} color="#64748B" /></View>
                        <Text style={styles.actionLabel}>Pesanan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('Jual')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#2563EB' }]}><ShoppingCart size={24} color="#FFFFFF" /></View>
                        <Text style={styles.actionLabel}>Jual</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('Katalog')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F1F5F9' }]}><PlusCircle size={24} color="#64748B" /></View>
                        <Text style={styles.actionLabel}>Katalog</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('Transaksi')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F1F5F9' }]}><History size={24} color="#64748B" /></View>
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
                            onAccept={() => handleUpdateStatus(order.id, 'accepted')}
                            onReject={() => handleUpdateStatus(order.id, 'rejected')}
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
        paddingTop: 40,
        paddingBottom: 80,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
        marginTop: 60,
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
    },
    statItem: {
        width: (width - 60) / 2,
        backgroundColor: '#FFFFFF',
        margin: 7,
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statNum: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    statLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
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
        marginBottom: 15,
    },
    viewAll: {
        fontSize: 14,
        color: '#138FEA',
        fontWeight: '600',
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionItem: {
        alignItems: 'center',
        width: (width - 40) / 4,
    },
    actionIcon: {
        width: 55,
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.05)' },
            android: { elevation: 2 }
        })
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
