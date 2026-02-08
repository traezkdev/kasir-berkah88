import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    Dimensions
} from 'react-native';
import {
    LayoutDashboard,
    ShoppingBag,
    ShoppingCart,
    Utensils,
    History,
    BarChart3,
    Image as ImageIcon,
    User,
    Gift,
    MessageCircle,
    UserCircle,
    Code,
    ChevronLeft,
    TrendingDown,
    Wallet,
    Calculator,
    ClipboardCheck,
    Ticket
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const MENU_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, color: '#3B82F6', bgColor: '#EFF6FF', target: 'Dashboard' },
    { label: 'Pesanan', icon: ShoppingBag, color: '#6366F1', bgColor: '#EEF2FF', target: 'Pesanan' },
    { label: 'Jual (POS)', icon: ShoppingCart, color: '#10B981', bgColor: '#ECFDF5', target: 'Jual' },
    { label: 'Katalog', icon: Utensils, color: '#F59E0B', bgColor: '#FFFBEB', target: 'Katalog' },
    { label: 'Riwayat', icon: History, color: '#8B5CF6', bgColor: '#F5F3FF', target: 'Transaksi' },
    { label: 'Kategori', icon: BarChart3, color: '#A855F7', bgColor: '#FAF5FF', target: 'CategoryManagement' },
    { label: 'Banner', icon: ImageIcon, color: '#EC4899', bgColor: '#FDF2F8', target: 'Banners' },
    { label: 'Promo', icon: Ticket, color: '#059669', bgColor: '#ECFDF5', target: 'PromoManagement' },
    { label: 'Pelanggan', icon: User, color: '#14B8A6', bgColor: '#F0FDFA', target: 'CustomerManagement' },
    { label: 'Poin & Loyalty', icon: Gift, color: '#F97316', bgColor: '#FFF7ED', target: 'PointManagement' },
    { label: 'Pengeluaran', icon: TrendingDown, color: '#EF4444', bgColor: '#FEF2F2', target: 'ExpenseManagement' },
    { label: 'Lapak Deposit', icon: Wallet, color: '#138FEA', bgColor: '#E0F2FE', target: 'LapakDeposit' },
    { label: 'Rekonsiliasi', icon: Calculator, color: '#F59E0B', bgColor: '#FFFBEB', target: 'CashReconciliation' },
    { label: 'Laporan Bisnis', icon: BarChart3, color: '#10B981', bgColor: '#ECFDF5', target: 'BusinessReports' },
    { label: 'Laporan Harian', icon: ClipboardCheck, color: '#10B981', bgColor: '#ECFDF5', target: 'DailyReport' },
    { label: 'Chat', icon: MessageCircle, color: '#0EA5E9', bgColor: '#F0F9FF', target: 'ChatScreen' },
    { label: 'Profil Saya', icon: UserCircle, color: '#475569', bgColor: '#F1F5F9', target: 'ProfileScreen' },
    { label: 'Tentang App', icon: Code, color: '#64748B', bgColor: '#F8FAFC', target: 'DeveloperCreditsScreen' },
];

const SellerMenu = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Semua Menu</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.sectionTitle}>Menu Utama</Text>
                <View style={styles.grid}>
                    {MENU_ITEMS.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => {
                                const tabs = ['Dashboard', 'Pesanan', 'Jual', 'Katalog', 'Transaksi'];
                                if (tabs.includes(item.target)) {
                                    navigation.navigate('MainTabs', { screen: item.target });
                                } else {
                                    navigation.navigate(item.target);
                                }
                            }}
                        >
                            <View style={[styles.iconWrap, { backgroundColor: item.bgColor }]}>
                                <item.icon size={28} color={item.color} />
                            </View>
                            <Text style={styles.menuLabel} numberOfLines={2}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Kasir Berkah88 v1.0.0</Text>
                    <Text style={styles.footerSubtext}>© 2024 Berkah88 Team</Text>
                </View>
            </ScrollView>
        </View>
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 20,
        letterSpacing: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 24,
    },
    menuItem: {
        width: (width - 60) / 4, // 4 items per row with gaps
        alignItems: 'center',
    },
    iconWrap: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    menuLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#334155',
        textAlign: 'center',
        lineHeight: 16,
    },
    footer: {
        marginTop: 60,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    footerSubtext: {
        fontSize: 10,
        color: '#CBD5E1',
        marginTop: 4,
    }
});

export default SellerMenu;
