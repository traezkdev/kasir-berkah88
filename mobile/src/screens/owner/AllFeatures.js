import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    BarChart3,
    DollarSign,
    FileText,
    CreditCard,
    Utensils,
    Ticket,
    Bell,
    Database,
    Settings,
    Code,
    LayoutDashboard,
    Wallet,
    TrendingUp,
    Briefcase
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const FeatureItem = ({ icon: Icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.featureItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconContainer, { backgroundColor: color + '14' }]}>
            <Icon size={24} color={color} strokeWidth={2} />
        </View>
        <Text style={styles.featureLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
);

const SectionTitle = ({ title }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionLine} />
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const OwnerAllFeatures = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    const menuGroups = [
        {
            title: "Laporan & Analitik",
            items: [
                { id: 'BusinessReports', label: "Laporan Bisnis", icon: BarChart3, color: "#3B82F6" },
                { id: 'FinancialReport', label: "Laporan Keuangan", icon: DollarSign, color: "#10B981" },
                { id: 'DailyReport', label: "Laporan Harian", icon: FileText, color: "#349BE5" },
                { id: 'CashReconciliation', label: "Rekonsiliasi Kas", icon: CreditCard, color: "#6366F1" },
            ]
        },
        {
            title: "Manajemen Toko",
            items: [
                { id: 'BusinessMoney', label: "Uang Bisnis", icon: Briefcase, color: "#349BE5" },
                { id: 'LapakDeposit', label: "Lapak Deposit", icon: Wallet, color: "#EF4444" },
                { id: 'ExpenseManagement', label: "Pengeluaran", icon: TrendingUp, color: "#8B5CF6" },
                { id: 'CategoryManagement', label: "Menu & Kategori", icon: Utensils, color: "#EC4899" },
                { id: 'PromoManagement', label: "Promo & Diskon", icon: Ticket, color: "#F97316" },
                { id: 'ManageInformation', label: "Pengumuman", icon: Bell, color: "#06B6D4" },
            ]
        },
        {
            title: "Sistem & Pengaturan",
            items: [
                { id: 'DatabaseManagement', label: "Basis Data", icon: Database, color: "#475569" },
                { id: 'Profil', label: "Profil Akun", icon: Settings, color: "#14B8A6" },
                { id: 'DeveloperCreditsScreen', label: "Kredit Dev", icon: Code, color: "#6D28D9" },
            ]
        }
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View
                style={[styles.header, { paddingTop: (insets.top || 0) + 10, backgroundColor: '#349BE5' }]}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Semua Fitur</Text>
                        <Text style={styles.headerSubtitle}>Navigasi Ruang Owner</Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {menuGroups.map((group, gIndex) => (
                    <View key={gIndex} style={styles.section}>
                        <SectionTitle title={group.title} />
                        <View style={styles.grid}>
                            {group.items.map((item, iIndex) => (
                                <FeatureItem
                                    key={iIndex}
                                    icon={item.icon}
                                    label={item.label}
                                    color={item.color}
                                    onPress={() => navigation.navigate(item.id)}
                                />
                            ))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={styles.dashboardBtn}
                    onPress={() => navigation.navigate('OwnerDashboard')}
                >
                    <View style={[styles.dashboardGradient, { backgroundColor: '#349BE5' }]}>
                        <LayoutDashboard size={20} color="#FFFFFF" />
                        <Text style={styles.dashboardBtnText}>Kembali ke Beranda</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        backgroundColor: '#349BE5',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#E1F5FE',
        fontWeight: '600',
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 10,
    },
    sectionLine: {
        width: 4,
        height: 18,
        backgroundColor: '#349BE5',
        borderRadius: 2,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    featureItem: {
        width: (width - 40) / 4,
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
        textAlign: 'center',
    },
    dashboardBtn: {
        marginTop: 10,
        borderRadius: 18,
        overflow: 'hidden',
    },
    dashboardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        gap: 10,
    },
    dashboardBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    }
});

export default OwnerAllFeatures;
