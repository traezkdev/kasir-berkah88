import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
    RefreshControl,
    Platform,
    Animated,
    Easing,
    StatusBar,
    AppState,
    Image,
    Linking
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
    Bell,
    Briefcase,
    TrendingUp,
    ShieldCheck
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SellerOrderCard from '../../components/SellerOrderCard';
import OrderDetailModal from '../../components/OrderDetailModal';
import { useChat } from '../../context/ChatContext';
import { useOrderNotification } from '../../context/OrderNotificationContext';

const SellerDashboard = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [stats, setStats] = useState({
        activeBanners: 0,
        featuredItems: 0,
        totalItems: 0,
        categories: 0
    });
    const [banners, setBanners] = useState([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const [isOpen, setIsOpen] = useState(true);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardRunningText, setDashboardRunningText] = useState('');
    const [dashboardRunningTextEnabled, setDashboardRunningTextEnabled] = useState(true);
    const [dashboardWatermarkEnabled, setDashboardWatermarkEnabled] = useState(true);
    const [dashboardWatermarkUrl, setDashboardWatermarkUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const { unreadCount } = useChat();
    const { refreshTrigger } = useOrderNotification();

    // Modal State
    const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [showBannerModal, setShowBannerModal] = useState(false);

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
            const [bannersRes, menuRes, catRes, ordersRes, allSettingsRes] = await Promise.all([
                apiService.get('/api/banners/all'),
                apiService.get('/api/menu-items?limit=1000'),
                apiService.get('/api/categories'),
                apiService.get('/api/orders?status=pending'),
                apiService.get('/api/all-settings')
            ]);

            setStats({
                activeBanners: bannersRes.data.data ? bannersRes.data.data.filter(b => b.is_active).length : 0,
                featuredItems: menuRes.data.data ? menuRes.data.data.filter(m => m.is_featured).length : 0,
                totalItems: menuRes.data.data ? menuRes.data.data.length : 0,
                categories: catRes.data.data ? catRes.data.data.length : 0
            });

            setPendingOrders(ordersRes.data.data || []);
            setDashboardRunningText(allSettingsRes.data.data?.dashboard_running_text || '');
            setDashboardRunningTextEnabled(allSettingsRes.data.data?.dashboard_running_text_enabled !== '0');
            setDashboardWatermarkEnabled(allSettingsRes.data.data?.dashboard_watermark_enabled !== '0');
            setDashboardWatermarkUrl(allSettingsRes.data.data?.dashboard_watermark_url || '');
            setLogoUrl(allSettingsRes.data.data?.logo_url || '');
            
            // Fetch Internal Seller Banners (Notifications)
            const activeBannersRes = await apiService.get('/api/seller-banners');
            setBanners(activeBannersRes.data.data || []);
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
    }, [fetchData, refreshTrigger]); // Added refreshTrigger dependency

    // Removed redundant AppState listener, now handled by OrderNotificationContext's refreshTrigger

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

    const handleOpenLink = async (url) => {
        if (!url) return;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                showToast('Tidak bisa membuka link ini', 'error');
            }
        } catch (error) {
            showToast('Gagal membuka link', 'error');
        }
    };

    const renderBannerSlider = () => {
        if (banners.length === 0) return null;

        const BannerContent = (
            <View style={styles.bannerContainer}>
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(e) => {
                        const slide = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
                        if (activeSlide !== slide) setActiveSlide(slide);
                    }}
                    scrollEventThrottle={16}
                    style={styles.bannerScrollView}
                >
                    {banners.map((banner, index) => (
                        <TouchableOpacity 
                            key={banner.id} 
                            activeOpacity={0.9}
                            style={[
                                styles.bannerSlide, 
                                { width: width - 40 }
                            ]}
                            onPress={() => {
                                setSelectedBanner(banner);
                                setShowBannerModal(true);
                            }}
                        >
                            <Image
                                source={{ uri: `${API_URL}${banner.image_url}` }}
                                style={styles.bannerImage}
                                resizeMode="cover"
                            />
                            {(banner.title || banner.subtitle) && (
                                <View style={styles.bannerOverlay}>
                                    <Text numberOfLines={1} style={styles.bannerTitle}>{banner.title}</Text>
                                    <Text numberOfLines={2} style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                {banners.length > 1 && (
                    <View style={styles.paginationDots}>
                        {banners.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    activeSlide === index ? styles.activeDot : styles.inactiveDot
                                ]}
                            />
                        ))}
                    </View>
                )}
            </View>
        );

        return (
            <View style={[styles.sectionWrapper, { marginTop: 25, marginBottom: 10 }]}>
                 <View style={[styles.section, { overflow: 'hidden' }]}>
                    {dashboardWatermarkEnabled && dashboardWatermarkUrl ? (
                        <ImageBackground
                            source={{ uri: `${API_URL}${dashboardWatermarkUrl}` }}
                            style={{ width: '100%', height: '100%' }}
                            imageStyle={{ opacity: 0.1, resizeMode: 'cover' }}
                        >
                            {BannerContent}
                        </ImageBackground>
                    ) : BannerContent}
                 </View>
            </View>
        );
    };

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
                {/* Background Logo Decoration (Wrapped to prevent clipping statusCard) */}
                {dashboardWatermarkEnabled && (
                    <View style={styles.headerDecoration}>
                        <Image
                            source={
                                dashboardWatermarkUrl
                                    ? { uri: `${API_URL}${dashboardWatermarkUrl}` }
                                    : logoUrl
                                        ? { uri: `${API_URL}${logoUrl}` }
                                        : require('../../../assets/logo.png')
                            }
                            style={styles.headerBgLogo}
                            resizeMode="contain"
                        />
                    </View>
                )}
                <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                        <View style={styles.roleBadge}>
                            <Store size={14} color="#FFFFFF" />
                            <Text style={styles.roleText}>Kerongkongan berkah 88</Text>
                        </View>
                        <Text style={styles.welcomeText} numberOfLines={1} ellipsizeMode="tail">Halo, {user?.name}!</Text>
                        <Text style={styles.subtitleText} numberOfLines={1} ellipsizeMode="tail">Pantau tokomu hari ini</Text>
                        {dashboardRunningTextEnabled && dashboardRunningText ? (
                            <View style={styles.runningTextContainer}>
                                <Text style={styles.runningText} numberOfLines={2} ellipsizeMode="tail">
                                    {dashboardRunningText}
                                </Text>
                            </View>
                        ) : null}
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
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: Platform.select({
                            web: (dashboardRunningTextEnabled && dashboardRunningText) ? 280 : 230,
                            default: (dashboardRunningTextEnabled && dashboardRunningText) ? 305 : 255
                        })
                    }
                ]}
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
                <View style={styles.statsWrapper}>
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
                </View>

                {/* Quick Actions */}
                <View style={[styles.sectionWrapper, { marginTop: 25 }]}>
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
                                { label: 'Audit', icon: ShieldCheck, color: '#F59E0B', bgColor: '#FFFBEB', target: 'Auditor' },
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
                            {user?.role === 'admin' && (
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
                </View>

                {/* Seller Notification Slider (Separate from Customer Promos) */}
                {renderBannerSlider()}

                {/* Pending Orders */}
                <View style={[styles.sectionWrapper, { marginTop: 25 }]}>
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

            {/* Banner Detail Modal */}
            {selectedBanner && (
                <View 
                    style={[
                        StyleSheet.absoluteFill, 
                        { 
                            backgroundColor: 'rgba(0,0,0,0.7)', 
                            zIndex: 9999, 
                            display: showBannerModal ? 'flex' : 'none',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 20
                        }
                    ]}
                >
                    <View style={styles.bannerDetailCard}>
                        <View style={styles.bannerDetailImageContainer}>
                            <Image
                                source={{ uri: `${API_URL}${selectedBanner.image_url}` }}
                                style={styles.bannerDetailImage}
                                resizeMode="cover"
                            />
                            <TouchableOpacity 
                                style={styles.closeBannerBtn}
                                onPress={() => setShowBannerModal(false)}
                            >
                                <XCircle size={30} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.bannerDetailContent}>
                            <Text style={styles.bannerDetailTitle}>{selectedBanner.title}</Text>
                            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                                <Text style={styles.bannerDetailSubtitle}>{selectedBanner.subtitle}</Text>
                            </ScrollView>
                            
                            {selectedBanner.link_url && (
                                <TouchableOpacity 
                                    style={styles.bannerLinkBtn}
                                    onPress={() => handleOpenLink(selectedBanner.link_url)}
                                >
                                    <Text style={styles.bannerLinkText}>Lihat Selengkapnya</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity 
                                style={styles.bannerActionBtn}
                                onPress={() => setShowBannerModal(false)}
                            >
                                <Text style={styles.bannerActionText}>Tutup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E40AF', // Changed from '#F8FAFC' to '#1E40AF'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#1E40AF',
        paddingBottom: 80,
        paddingHorizontal: '6%',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                transform: [{ translateZ: 0 }], // Force clipping on Web
            }
        })
    },
    headerBgLogo: {
        position: 'absolute',
        bottom: -20,
        right: -20,
        width: 150,
        height: 150,
        opacity: 0.15,
        transform: [{ rotate: '-15deg' }],
    },
    scrollContent: {
        paddingTop: 240, // Tinggi header + floating card
        paddingBottom: 30,
        backgroundColor: '#F8FAFC', // Ensure content area is gray
        minHeight: '100%', // Ensure it fills screen
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 15,
    },
    headerLeft: {
        flex: 1,
        marginRight: 15,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
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
    runningTextContainer: {
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FBBF24',
        alignSelf: 'flex-start',
    },
    runningText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconBtn: {
        minWidth: 45,
        minHeight: 45,
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
        left: '5%',
        right: '5%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: '5%',
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        minHeight: 85,
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
        minWidth: 110,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    toggleBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    statsWrapper: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 0,
        marginTop: Platform.select({ web: 30, default: 40 }),
        borderRadius: 0,
        paddingBottom: 25,
        paddingTop: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
    },
    statItem: {
        width: '47%',
        marginHorizontal: '1.5%',
        marginVertical: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        minHeight: 80,
        ...Platform.select({
            web: {
                transform: [{ translateZ: 0 }], // Force clipping on Web for statDecor
                boxShadow: '0px 2px 8px rgba(0,0,0,0.05)'
            }
        })
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
    sectionWrapper: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 0,
        borderRadius: 0,
        paddingBottom: 15,
        paddingTop: 15,
    },
    section: {
        paddingHorizontal: '5%',
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
        flex: 1,
        minWidth: '22%',
        maxWidth: '25%',
        marginBottom: 20,
    },
    actionIcon: {
        minWidth: 60,
        minHeight: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
        textAlign: 'center',
    },
    // Banner Styles
    bannerContainer: {
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        height: 170,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerScrollView: {
        borderRadius: 15,
        width: '100%',
    },
    bannerSlide: {
        height: 170,
        borderRadius: 15,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F1F5F9',
        borderRadius: 15,
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)', // Sleek dark midnight overlay
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    bannerTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    bannerSubtitle: {
        color: '#CBD5E1',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    paginationDots: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    activeDot: {
        backgroundColor: '#FFFFFF',
        width: 15,
    },
    inactiveDot: {
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    // Banner Detail Modal Styles
    bannerDetailCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    bannerDetailImageContainer: {
        width: '100%',
        height: 220,
        position: 'relative',
    },
    bannerDetailImage: {
        width: '100%',
        height: '100%',
    },
    closeBannerBtn: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    bannerDetailContent: {
        padding: 24,
    },
    bannerDetailTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    bannerDetailSubtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: '#64748B',
        fontWeight: '500',
    },
    bannerActionBtn: {
        backgroundColor: '#1E40AF',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    bannerActionText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    bannerLinkBtn: {
        backgroundColor: '#EFF6FF',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    bannerLinkText: {
        color: '#1E40AF',
        fontWeight: 'bold',
        fontSize: 14,
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
