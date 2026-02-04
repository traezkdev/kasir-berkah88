import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    Dimensions,
    Platform,
    StatusBar,
    RefreshControl,
    Animated
} from 'react-native';
import {
    Search,
    ShoppingBag,
    Bell,
    MessageCircle,
    Zap,
    TrendingUp,
    Package,
    Sparkles,
    PlusCircle,
    History,
    ChevronRight,
    LayoutGrid,
    Coffee,
    Star,
    Plus,
    XCircle
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useCart } from '../../context/CartContext';
import { useChat } from '../../context/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CustomerDashboard = ({ navigation }) => {
    const { user } = useAuth();
    const { isOpen, ignoreStock } = useAppSettings();
    const { cartCount } = useCart();
    const { unreadCount } = useChat();

    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [banners, setBanners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orderNotificationCount, setOrderNotificationCount] = useState(0);
    const [latestOrder, setLatestOrder] = useState(null);
    const [scrolled, setScrolled] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setIsLoading(true);
        try {
            // Fetch Banners
            const bannerRes = await apiService.get('/api/banners');
            if (bannerRes.data.data) setBanners(bannerRes.data.data);

            // Fetch Categories
            const catRes = await apiService.get('/api/categories');
            if (catRes.data.data) setCategories(catRes.data.data.slice(0, 5));

            // Fetch Recommended Menus (Top 6)
            const menuRes = await apiService.get('/api/menu-items?limit=6');
            if (menuRes.data.data) setMenus(menuRes.data.data);

            // Fetch Orders to count active ones for notification
            const ordersRes = await apiService.get('/api/orders?limit=10');
            if (ordersRes.data.data) {
                const currentOrders = ordersRes.data.data;
                const seenOrderStatesRaw = await AsyncStorage.getItem('seenOrderStates');
                const seenOrderStates = JSON.parse(seenOrderStatesRaw || '{}');

                const unreadOrders = currentOrders.filter(order => {
                    // Completed orders are never notifications
                    if (order.status === 'completed') return false;

                    // Pending orders are always notifications until processed
                    if (order.status === 'pending') return true;

                    // For Rejected/Cancelled: automatically clear after 24 hours
                    if (['rejected', 'cancelled'].includes(order.status)) {
                        const orderTime = new Date(order.updated_at || order.created_at).getTime();
                        const oneDay = 24 * 60 * 60 * 1000;
                        if (Date.now() - orderTime > oneDay) return false;
                    }

                    // Check if status changed since last seen
                    if (['accepted', 'rejected', 'cancelled'].includes(order.status)) {
                        const lastSeenStatus = seenOrderStates[order.id];
                        return lastSeenStatus !== order.status;
                    }
                    return false;
                });
                setOrderNotificationCount(unreadOrders.length);

                // Set latest active order (pending or accepted)
                const activeOrders = currentOrders.filter(o => ['pending', 'accepted'].includes(o.status));
                if (activeOrders.length > 0) {
                    setLatestOrder(activeOrders[0]);
                } else {
                    setLatestOrder(null);
                }
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const pollInterval = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(pollInterval);
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return 'Selamat Pagi';
        if (hour >= 11 && hour < 15) return 'Selamat Siang';
        if (hour >= 15 && hour < 19) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    const compactHeaderTranslateY = scrollY.interpolate({
        inputRange: [100, 150],
        outputRange: [-100, 0],
        extrapolate: 'clamp'
    });

    if (isLoading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#059669" />

            {/* Compact Header on Scroll */}
            <Animated.View style={[styles.compactHeader, { transform: [{ translateY: compactHeaderTranslateY }] }]}>
                <View style={styles.compactHeaderContent}>
                    <TouchableOpacity
                        style={styles.compactSearch}
                        onPress={() => navigation.navigate('Menu')}
                    >
                        <Search size={16} color="#94A3B8" />
                        <Text style={styles.compactSearchText}>Cari menu favorit...</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('ChatScreen')}>
                        <View>
                            <MessageCircle size={20} color="#64748B" />
                            {unreadCount > 0 && (
                                <View style={[styles.statusBadge, { top: -6, right: -6, width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 }]}>
                                    <Text style={[styles.statusBadgeText, { fontSize: 7 }]}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <Animated.ScrollView
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.mainHeader}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greetingText}>{getGreeting()},</Text>
                            <Text style={styles.userName}>{user?.name || 'Pelanggan'}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.notificationBtn}
                            onPress={() => navigation.navigate('ChatScreen')}
                        >
                            <View>
                                <MessageCircle size={22} color="#FFFFFF" />
                                {unreadCount > 0 && (
                                    <View style={[styles.statusBadge, { top: -5, right: -5 }]}>
                                        <Text style={styles.statusBadgeText}>{unreadCount}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {!isOpen && (
                        <View style={styles.closedBanner}>
                            <XCircle size={18} color="#FFFFFF" />
                            <View style={styles.closedBannerText}>
                                <Text style={styles.closedTitle}>Maaf, Toko Sedang Tutup</Text>
                                <Text style={styles.closedSubtitle}>Kamu tetap bisa melihat menu, tapi belum bisa pesan.</Text>
                            </View>
                        </View>
                    )}

                    {/* Search Bar */}
                    <TouchableOpacity
                        style={styles.searchBar}
                        onPress={() => navigation.navigate('Menu')}
                    >
                        <Search size={20} color="#94A3B8" />
                        <Text style={styles.searchText}>Mau makan apa hari ini?</Text>
                    </TouchableOpacity>

                    {/* Quick Shortcuts */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shortcutsScroll}>
                        {[
                            { label: 'Sedang Promo', icon: Zap, color: '#FBBF24' },
                            { label: 'Paling Laris', icon: TrendingUp, color: '#F43F5E' },
                            { label: 'Paket Hemat', icon: Package, color: '#0EA5E9' },
                            { label: 'Terbaru', icon: Sparkles, color: '#6366F1' }
                        ].map((chip, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.shortcutChip}
                                onPress={() => navigation.navigate('Menu', { filter: chip.label })}
                            >
                                <View style={[styles.chipIconWrap, { backgroundColor: chip.color }]}>
                                    <chip.icon size={12} color="#FFFFFF" />
                                </View>
                                <Text style={styles.chipText}>{chip.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Floating Action Card */}
                <View style={styles.actionCard}>
                    <View style={styles.saldoRow}>
                        <View>
                            <Text style={styles.saldoLabel}>BERKAHPAY</Text>
                            <Text style={styles.saldoValue}>Rp 0</Text>
                        </View>
                        <View style={styles.saldoActions}>
                            <TouchableOpacity style={styles.saldoBtn}>
                                <View style={styles.saldoIconWrap}>
                                    <PlusCircle size={20} color="#10B981" />
                                </View>
                                <Text style={styles.saldoBtnText}>TOP UP</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saldoBtn}>
                                <View style={[styles.saldoIconWrap, { backgroundColor: '#EFF6FF' }]}>
                                    <History size={20} color="#3B82F6" />
                                </View>
                                <Text style={styles.saldoBtnText}>RIWAYAT</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.orderStatusBtn}
                        onPress={() => navigation.navigate('Orders')}
                    >
                        <View style={styles.statusIconWrap}>
                            <ShoppingBag size={24} color="#F97316" />
                            {orderNotificationCount > 0 && (
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusBadgeText}>{orderNotificationCount}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.statusContent}>
                            <Text style={styles.statusTitle}>Status Pesanan</Text>
                            <Text style={styles.statusSubtitle}>LACAK PESANAN AKTIF ANDA</Text>
                        </View>
                        {latestOrder ? (
                            <TouchableOpacity
                                style={styles.detailBtn}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    navigation.navigate('OrderDetails', { orderId: latestOrder.id });
                                }}
                            >
                                <Text style={styles.detailBtnText}>Lihat Detail</Text>
                                <ChevronRight size={14} color="#059669" />
                            </TouchableOpacity>
                        ) : (
                            <ChevronRight size={18} color="#CBD5E1" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Banners */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTag}>PROMO SPESIAL</Text>
                    <View style={styles.scrolledHint}>
                        <Text style={styles.hintText}>Geser</Text>
                        <ChevronRight size={12} color="#94A3B8" />
                    </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled snapToInterval={width * 0.9 + 16} deaccelerationRate="fast">
                    {banners.map((banner) => (
                        <TouchableOpacity
                            key={banner.id}
                            style={[
                                styles.bannerCard,
                                {
                                    backgroundColor: banner.color_class === 'bg-green-600' ? '#059669' :
                                        banner.color_class === 'bg-blue-600' ? '#2563EB' :
                                            banner.color_class === 'bg-purple-600' ? '#9333EA' : '#059669'
                                }
                            ]}
                        >
                            <View style={styles.bannerInfo}>
                                <Text style={styles.bannerTitle}>{banner.title}</Text>
                                <Text style={styles.bannerSubTitle}>{banner.subtitle}</Text>
                                <View style={styles.promoBadge}>
                                    <Text style={styles.promoBadgeText}>AMBIL PROMO</Text>
                                </View>
                            </View>
                            {/* Decorative Icon Background */}
                            <Sparkles size={120} color="rgba(255,255,255,0.1)" style={styles.bannerDecor} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Categories */}
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionTag}>KATEGORI</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                    <TouchableOpacity
                        style={styles.categoryItem}
                        onPress={() => navigation.navigate('Menu')}
                    >
                        <View style={styles.categoryIconWrap}>
                            <LayoutGrid size={28} color="#059669" />
                        </View>
                        <Text style={styles.categoryLabel}>SEMUA</Text>
                    </TouchableOpacity>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.categoryItem}
                            onPress={() => navigation.navigate('Menu', { categoryId: cat.id })}
                        >
                            <View style={[styles.categoryIconWrap, { backgroundColor: '#F8FAFC' }]}>
                                <Coffee size={28} color="#64748B" />
                            </View>
                            <Text style={styles.categoryLabel}>{cat.name.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Recommendations */}
                <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationTitle}>Rekomendasi Pilihan</Text>
                </View>
                <View style={styles.menuGrid}>
                    {menus.map((menu) => {
                        const isOutOfStock = !ignoreStock && menu.stock <= 0;
                        return (
                            <TouchableOpacity
                                key={menu.id}
                                style={[
                                    styles.menuCard,
                                    (!isOpen || isOutOfStock) && styles.menuCardClosed,
                                    isOutOfStock && styles.menuCardOutOfStock
                                ]}
                                onPress={() => isOpen && !isOutOfStock && navigation.navigate('Menu', { itemId: menu.id })}
                                disabled={!isOpen || (isOutOfStock && !isOpen)}
                            >
                                <View style={styles.menuImageContainer}>
                                    {menu.image_url ? (
                                        <Image
                                            source={{ uri: `${API_URL}${menu.image_url}` }}
                                            style={styles.menuImage}
                                            onError={(e) => {
                                                console.log(`Image 404 for ${menu.name}`);
                                            }}
                                        />
                                    ) : (
                                        <View style={styles.menuImagePlaceholder}>
                                            <Package size={30} color="#CBD5E1" />
                                        </View>
                                    )}
                                    {menu.discount > 0 && (
                                        <View style={styles.discountBadge}>
                                            <Zap size={10} color="#FFFFFF" fill="#FFFFFF" />
                                            <Text style={styles.discountText}>PROMO {parseFloat(menu.discount).toFixed(0)}%</Text>
                                        </View>
                                    )}
                                    {isOutOfStock && (
                                        <View style={styles.outOfStockBadge}>
                                            <Text style={styles.outOfStockText}>HABIS</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.quickAddBtn, isOutOfStock && { opacity: 0.5 }]}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            if (isOpen && !isOutOfStock) {
                                                navigation.navigate('Menu', { itemId: menu.id });
                                            }
                                        }}
                                        disabled={!isOpen || isOutOfStock}
                                    >
                                        <Plus size={16} color={isOutOfStock ? "#94A3B8" : "#059669"} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.menuInfo}>
                                    <Text style={[styles.menuName, isOutOfStock && styles.textMuted]} numberOfLines={2}>{menu.name}</Text>
                                    <View style={styles.menuFooter}>
                                        <View>
                                            {menu.discount > 0 ? (
                                                <>
                                                    <Text style={styles.oldPrice}>{formatCurrency(menu.price)}</Text>
                                                    <Text style={styles.newPrice}>{formatCurrency(Math.round(menu.price * (1 - menu.discount / 100)))}</Text>
                                                </>
                                            ) : (
                                                <Text style={styles.newPrice}>{formatCurrency(menu.price)}</Text>
                                            )}
                                        </View>
                                        <View style={styles.ratingWrap}>
                                            <Star size={10} color="#FBBF24" fill="#FBBF24" />
                                            <Text style={styles.ratingVal}>{menu.average_rating ? parseFloat(menu.average_rating).toFixed(1) : '0.0'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Footer Padding */}
                <View style={{ height: 100 }} />
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    compactHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 100,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    compactHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    compactSearch: {
        flex: 1,
        height: 40,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    compactSearchText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    mainHeader: {
        backgroundColor: '#059669',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
        paddingBottom: 80,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greetingText: {
        fontSize: 14,
        color: '#D1FAE5',
        fontWeight: '500',
    },
    userName: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: '900',
    },
    notificationBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    closedBannerText: {
        flex: 1,
    },
    closedTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    closedSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 9,
        fontWeight: '500',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        height: 54,
        borderRadius: 27,
        paddingHorizontal: 20,
        marginBottom: 16,
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' },
            android: { elevation: 5 }
        })
    },
    searchText: {
        marginLeft: 12,
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '500',
    },
    shortcutsScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    shortcutChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    chipIconWrap: {
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    chipText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: -50,
        borderRadius: 30,
        ...Platform.select({
            web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.08)' },
            android: { elevation: 10 }
        }),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    saldoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    saldoLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    saldoValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -1,
    },
    saldoActions: {
        flexDirection: 'row',
        gap: 16,
    },
    saldoBtn: {
        alignItems: 'center',
        gap: 4,
    },
    saldoIconWrap: {
        width: 42,
        height: 42,
        backgroundColor: '#ECFDF5',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    saldoBtnText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#64748B',
    },
    orderStatusBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
        backgroundColor: '#FFFFFF',
    },
    statusIconWrap: {
        width: 50,
        height: 50,
        backgroundColor: '#FFF7ED',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    statusBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
    },
    statusContent: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    statusSubtitle: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    detailBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#059669',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 32,
        marginBottom: 16,
    },
    sectionTag: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
    },
    scrolledHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    hintText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
    },
    bannerCard: {
        width: width * 0.9,
        height: 160,
        borderRadius: 30,
        marginLeft: 20,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    bannerInfo: {
        flex: 1,
        zIndex: 1,
        justifyContent: 'space-between',
    },
    bannerTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1,
        lineHeight: 28,
    },
    bannerSubTitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 'bold',
        marginTop: 4,
    },
    promoBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginTop: 12,
    },
    promoBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    bannerDecor: {
        position: 'absolute',
        bottom: -20,
        right: -20,
        transform: [{ rotate: '15deg' }],
    },
    categoriesScroll: {
        paddingHorizontal: 12,
        paddingBottom: 4,
    },
    categoryItem: {
        alignItems: 'center',
        marginHorizontal: 8,
        width: 80,
    },
    categoryIconWrap: {
        width: 64,
        height: 64,
        backgroundColor: '#ECFDF5',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    categoryLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#64748B',
        textAlign: 'center',
    },
    recommendationHeader: {
        paddingHorizontal: 20,
        marginTop: 32,
        marginBottom: 16,
    },
    recommendationTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    menuCard: {
        width: (width - 40) / 2,
        backgroundColor: '#FFFFFF',
        margin: 4,
        marginBottom: 16,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
            android: { elevation: 3 }
        })
    },
    menuCardClosed: {
        opacity: 0.6,
    },
    menuImageContainer: {
        width: '100%',
        height: width / 2 - 40,
        backgroundColor: '#F8FAFC',
    },
    menuImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    menuImagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    discountBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '900',
    },
    quickAddBtn: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 34,
        height: 34,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.1)' },
            android: { elevation: 2 }
        })
    },
    menuInfo: {
        padding: 12,
    },
    menuName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
        lineHeight: 18,
        height: 36,
    },
    menuFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 8,
    },
    oldPrice: {
        fontSize: 9,
        color: '#94A3B8',
        textDecorationLine: 'line-through',
    },
    newPrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#059669',
    },
    ratingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 3,
    },
    ratingVal: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748B',
    },
    menuCardOutOfStock: {
        opacity: 0.6,
    },
    outOfStockBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },
    textMuted: {
        color: '#94A3B8',
    }
});

export default CustomerDashboard;
