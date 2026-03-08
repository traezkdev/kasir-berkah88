import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
    RefreshControl,
    Animated,
    Image,
    Platform,
    StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    LayoutDashboard,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    ChevronRight,
    PieChart,
    BarChart3,
    Settings,
    Bell,
    LogOut,
    Ticket,
    FileText,
    CreditCard,
    Database,
    ArrowRight,
    Briefcase,
    ShieldCheck,
    AlertTriangle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService, { API_URL } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const OwnerDashboard = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Stats State
    const [stats, setStats] = useState({
        today: {
            revenue: 0,
            profit: 0,
            transactions: 0,
            topItems: [],
            payments: []
        },
        yesterday: {
            revenue: 0,
            profit: 0
        }
    });
    const [auditStatus, setAuditStatus] = useState({ accurate: true, diff: 0 });

    // Helper: Format Currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const fetchDashboardData = useCallback(async () => {
        try {
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const yesterdayDate = new Date(now.getTime() - 86400000);
            const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

            // 1. Get Today's Data
            const todayRes = await apiService.get(`/api/analytics/breakdown?startDate=${today}&endDate=${today}`);
            const tData = todayRes.data.data || {};

            // 2. Get Yesterday's Data for comparison
            const yesterdayRes = await apiService.get(`/api/analytics/breakdown?startDate=${yesterday}&endDate=${yesterday}`);
            const yData = yesterdayRes.data.data || {};

            setStats({
                today: {
                    revenue: tData.summary?.totalRevenue || 0,
                    profit: tData.summary?.netIncome || 0,
                    transactions: tData.sales?.totalTransactions || 0,
                    topItems: (tData.sales?.topSellingItems || []).slice(0, 3),
                    payments: tData.sales?.paymentMethods || []
                },
                yesterday: {
                    revenue: yData.summary?.totalRevenue || 0,
                    profit: yData.summary?.netIncome || 0
                }
            });

            // 3. Get Audit Accuracy
            const auditRes = await apiService.get(`/api/audit/calculate-accuracy?startDate=${today}&endDate=${today}`);
            const aData = auditRes.data.data || {};
            setAuditStatus({
                accurate: Math.abs(aData.difference || 0) <= 100,
                diff: aData.difference || 0
            });

        } catch (error) {
            console.error('Error fetching owner dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error(error);
        }
    };

    // Helper to calculate percentage growth
    const getGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#349BE5" />
                <Text style={styles.loadingText}>Menyiapkan Insight Bisnis...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Fixed Header Content */}
            <View style={styles.fixedHeaderArea}>
                <View
                    style={[styles.header, { paddingTop: (insets.top || 0) + 10, backgroundColor: '#349BE5' }]}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.headerGreeting}>Halo, {user?.name}</Text>
                            <Text style={styles.headerDate}>
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
                            <LogOut size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.fixedCardContainer}>
                    <View style={styles.mainStatsCard}>
                        <View style={styles.mainStatRow}>
                            <View style={styles.mainStatItem}>
                                <Text style={styles.mainStatLabel}>OMZET HARI INI</Text>
                                <Text style={styles.mainStatValue}>{formatCurrency(stats.today.revenue)}</Text>
                                <View style={styles.growthRow}>
                                    <TrendingUp size={10} color={stats.today.revenue >= stats.yesterday.revenue ? '#10B981' : '#EF4444'} />
                                    <Text style={[styles.growthText, { color: stats.today.revenue >= stats.yesterday.revenue ? '#10B981' : '#EF4444' }]}>
                                        {Math.abs(getGrowth(stats.today.revenue, stats.yesterday.revenue)).toFixed(1)}% dari kemarin
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.vDivider} />
                            <View style={styles.mainStatItem}>
                                <Text style={styles.mainStatLabel}>LABA BERSIH</Text>
                                <Text style={[styles.mainStatValue, { color: stats.today.profit >= 0 ? '#10B981' : '#EF4444' }]}>
                                    {formatCurrency(stats.today.profit)}
                                </Text>
                                <View style={styles.growthRow}>
                                    <Text style={styles.growthSubText}>Estimasi Real-time</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('BusinessMoney')}
                            style={styles.summaryFooter}
                        >
                            <Text style={styles.summaryFooterText}>Lihat Arus Kas Bisnis</Text>
                            <ArrowRight size={14} color="#349BE5" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#349BE5']} />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.bodyContent, { paddingBottom: 40 }]}>
                    {/* Audit Status Banner */}
                    <TouchableOpacity
                        style={[styles.auditBanner, { backgroundColor: auditStatus.accurate ? '#ECFDF5' : '#FEF2F2' }]}
                        onPress={() => navigation.navigate('Auditor')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.auditIconBox, { backgroundColor: auditStatus.accurate ? '#D1FAE5' : '#FEE2E2' }]}>
                            {auditStatus.accurate ? <ShieldCheck size={20} color="#10B981" /> : <AlertTriangle size={20} color="#EF4444" />}
                        </View>
                        <View style={styles.auditInfo}>
                            <Text style={styles.auditTitle}>Status Audit Sistem</Text>
                            <Text style={[styles.auditSubtitle, { color: auditStatus.accurate ? '#059669' : '#B91C1C' }]}>
                                {auditStatus.accurate ? 'Data Terverifikasi Akurat' : `Selisih: ${formatCurrency(auditStatus.diff)}`}
                            </Text>
                        </View>
                        <ChevronRight size={18} color={auditStatus.accurate ? '#10B981' : '#EF4444'} />
                    </TouchableOpacity>

                    {/* Insights Section */}
                    <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Breakdown Data</Text>
                    <View style={styles.insightGrid}>
                        {/* Transaction Methods */}
                        <View style={styles.insightCard}>
                            <View style={styles.insightHeader}>
                                <PieChart size={16} color="#349BE5" />
                                <Text style={styles.insightTitle}>Metode Bayar</Text>
                            </View>
                            {stats.today.payments.length > 0 ? (
                                stats.today.payments.map((p, idx) => (
                                    <View key={idx} style={styles.paymentRow}>
                                        <Text style={styles.paymentName}>{p.payment_method || 'Tunai'}</Text>
                                        <Text style={styles.paymentVal}>{p.count} trx</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyInsight}>Belum ada data</Text>
                            )}
                        </View>

                        {/* Top Selling Today */}
                        <View style={styles.insightCard}>
                            <View style={styles.insightHeader}>
                                <BarChart3 size={16} color="#349BE5" />
                                <Text style={styles.insightTitle}>Menu Terlaris</Text>
                            </View>
                            {stats.today.topItems.length > 0 ? (
                                stats.today.topItems.map((item, idx) => (
                                    <View key={idx} style={styles.topItemRow}>
                                        <Text style={styles.topItemName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.topItemQty}>{item.quantity} porsi</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyInsight}>Belum ada data</Text>
                            )}
                        </View>
                    </View>

                    {/* Quick Access Grid (Buttons Style) */}
                    <View style={styles.sectionHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={styles.sectionTitle}>Akses Cepat</Text>
                            <View style={styles.sectionBadge}>
                                <Text style={styles.sectionBadgeText}>{stats.today.transactions} Transaksi</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AllFeatures')}
                            style={styles.seeAllBtn}
                        >
                            <Text style={styles.seeAllText}>Lihat Semua</Text>
                            <ChevronRight size={14} color="#349BE5" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.buttonGrid}>
                        <QuickButton
                            icon={BarChart3}
                            label="Laporan"
                            color="#3B82F6"
                            onPress={() => navigation.navigate('Bisnis')}
                        />
                        <QuickButton
                            icon={Briefcase}
                            label="Uang"
                            color="#10B981"
                            onPress={() => navigation.navigate('BusinessMoney')}
                        />
                        <QuickButton
                            icon={CreditCard}
                            label="Kas"
                            color="#349BE5"
                            onPress={() => navigation.navigate('CashReconciliation')}
                        />
                        <QuickButton
                            icon={Database}
                            label="Data"
                            color="#8B5CF6"
                            onPress={() => navigation.navigate('DatabaseManagement')}
                        />
                        <QuickButton
                            icon={ShieldCheck}
                            label="Audit"
                            color="#F59E0B"
                            onPress={() => navigation.navigate('Auditor')}
                        />
                    </View>

                    {/* Management Section */}
                    <Text style={styles.sectionTitle}>Manajemen Sistem</Text>
                    <View style={styles.managementList}>
                        <ListButton
                            icon={LayoutDashboard}
                            label="Manajemen Kategori & Menu"
                            onPress={() => navigation.navigate('CategoryManagement')}
                        />
                        <ListButton
                            icon={Ticket}
                            label="Program Promo & Diskon"
                            onPress={() => navigation.navigate('PromoManagement')}
                        />
                        <ListButton
                            icon={Bell}
                            label="Pengumuman & Informasi"
                            onPress={() => navigation.navigate('ManageInformation')}
                        />
                        <ListButton
                            icon={Settings}
                            label="Pengaturan Keamanan & Akun"
                            onPress={() => navigation.navigate('Profil')}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

// Sub-components for better structure
const QuickButton = ({ icon: Icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.quickIconBox, { backgroundColor: color + '15' }]}>
            <Icon size={24} color={color} />
        </View>
        <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
);

const ListButton = ({ icon: Icon, label, onPress }) => (
    <TouchableOpacity style={styles.listBtn} onPress={onPress} activeOpacity={0.6}>
        <View style={styles.listBtnLeft}>
            <View style={styles.listIconBox}>
                <Icon size={20} color="#64748B" />
            </View>
            <Text style={styles.listLabel}>{label}</Text>
        </View>
        <ChevronRight size={18} color="#CBD5E1" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
        zIndex: 10,
        overflow: 'visible',
    },
    scrollContent: {
        flexGrow: 1,
        overflow: 'visible',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
    },
    loadingText: {
        marginTop: 12,
        color: '#349BE5',
        fontSize: 14,
        fontWeight: 'bold',
    },
    header: {
        paddingBottom: 110,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: '#349BE5',
    },
    fixedHeaderArea: {
        backgroundColor: '#F8FAFC',
        zIndex: 10,
    },
    fixedCardContainer: {
        paddingHorizontal: 20,
        marginTop: -90,
        paddingBottom: 15,
        backgroundColor: 'transparent',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    headerGreeting: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
    },
    headerDate: {
        color: '#E1F5FE',
        fontSize: 12,
        marginTop: 2,
        fontWeight: '600',
    },
    iconBtn: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainStatsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 10,
    },
    mainStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    mainStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    vDivider: {
        width: 1,
        height: 45,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 15,
    },
    mainStatLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 8,
    },
    mainStatValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    growthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    growthText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    growthSubText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
    },
    summaryFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    summaryFooterText: {
        color: '#349BE5',
        fontSize: 12,
        fontWeight: '800',
    },
    bodyContent: {
        paddingHorizontal: 20,
        paddingTop: 0,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 15,
        marginTop: 25,
    },
    insightGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    insightCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    insightTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    paymentName: {
        fontSize: 11,
        color: '#1E293B',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    paymentVal: {
        fontSize: 11,
        color: '#349BE5',
        fontWeight: '800',
    },
    topItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    topItemName: {
        fontSize: 11,
        color: '#1E293B',
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    topItemQty: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '800',
    },
    emptyInsight: {
        fontSize: 10,
        color: '#94A3B8',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    sectionBadge: {
        backgroundColor: '#E1F5FE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 10,
    },
    sectionBadgeText: {
        fontSize: 10,
        color: '#0284C7',
        fontWeight: '900',
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 10,
    },
    seeAllText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#349BE5',
    },
    buttonGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    quickBtn: {
        alignItems: 'center',
        width: '22%',
    },
    quickIconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#475569',
    },
    managementList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    listBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 16,
    },
    listBtnLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    listIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    auditBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginTop: 15,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    auditIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    auditInfo: {
        flex: 1,
    },
    auditTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    auditSubtitle: {
        fontSize: 14,
        fontWeight: '900',
        marginTop: 2,
    }
});

export default OwnerDashboard;
