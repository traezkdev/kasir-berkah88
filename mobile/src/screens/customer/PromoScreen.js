import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar,
    ImageBackground,
    ActivityIndicator,
    Alert,
    Clipboard,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Ticket,
    Truck,
    Clock,
    Zap,
    Gift,
    ChevronRight,
    Star,
    Sparkles,
    CheckCircle2,
    Tags,
    Percent,
    Wallet,
    Copy,
    Info,
    ShoppingBag,
    Bell,
    Home,
    Search,
    ClipboardList,
    User
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';

const { width } = Dimensions.get('window');

const PromoScreen = ({ navigation }) => {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [codeModalVisible, setCodeModalVisible] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState(null);
    const [copied, setCopied] = useState(false);

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('data:') || url.startsWith('http')) return url;
        return `${API_URL}${url}`;
    };

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        try {
            const response = await apiService.get('/api/customer/promos');
            if (response.data && response.data.data) {
                setPromos(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching promos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimPress = (item) => {
        if (item.code) {
            setSelectedPromo(item);
            setCodeModalVisible(true);
            setCopied(false);
        } else {
            // Logic for "PAKAI" if no code (e.g. go to menu)
            navigation.navigate('MainTabs', { screen: 'Menu' });
        }
    };

    const copyToClipboard = () => {
        if (selectedPromo?.code) {
            Clipboard.setString(selectedPromo.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getIcon = (iconName, color) => {
        const props = { size: 24, color: '#FFFFFF' };
        switch (iconName) {
            case 'Truck': return <Truck {...props} />;
            case 'Zap': return <Zap {...props} />;
            case 'Gift': return <Gift {...props} />;
            case 'Percent': return <Percent {...props} />;
            case 'Wallet': return <Wallet {...props} />;
            case 'Tags': return <Tags {...props} />;
            default: return <Ticket {...props} />;
        }
    };

    const renderVoucher = (item) => (
        <View key={item.id} style={styles.voucherCard}>
            <View style={[styles.voucherLeft, { backgroundColor: item.color || '#059669' }]}>
                {getIcon(item.icon, item.color)}
            </View>
            <View style={styles.voucherRight}>
                <View style={styles.voucherHeader}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.voucherTitleRow}>
                            <Text style={styles.voucherTitle} numberOfLines={1}>{item.title}</Text>
                            <View style={[styles.discountBadge, { backgroundColor: (item.color || '#059669') + '15' }]}>
                                <Text style={[styles.discountBadgeText, { color: item.color || '#059669' }]}>
                                    {item.discount_type === 'percentage' ? `${item.discount_value}% OFF` : `Potongan Rp ${parseFloat(item.discount_value).toLocaleString('id-ID')}`}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.voucherDesc} numberOfLines={2}>{item.description}</Text>
                    </View>
                </View>
                <View style={styles.voucherFooter}>
                    <View style={styles.expiryRow}>
                        <Clock size={12} color="#94A3B8" />
                        <Text style={styles.expiryText}>{item.expiry || 'Tanpa Batas'}</Text>
                    </View>
                    {item.min_purchase > 0 && (
                        <View style={styles.minPurchaseBadge}>
                            <Text style={styles.minPurchaseText}>Min. Beli: Rp {parseFloat(item.min_purchase).toLocaleString('id-ID')}</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => handleClaimPress(item)}
                    >
                        <Text style={styles.claimBtnText}>{item.code ? 'KODE' : 'PAKAI'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {/* Ticket Cutout Effect */}
            <View style={styles.cutoutTop} />
            <View style={styles.cutoutBottom} />
        </View>
    );

    const renderCampaign = (item) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.campaignCard, { backgroundColor: item.color || '#059669' }]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Menu' })}
            activeOpacity={0.9}
        >
            <View style={styles.campaignContent}>
                <View style={styles.campaignIconBox}>
                    {getIcon(item.icon, '#FFFFFF')}
                </View>

                <View style={styles.campaignMain}>
                    <Text style={styles.campaignTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.campaignSubtitle} numberOfLines={2}>{item.description}</Text>

                    <View style={styles.campaignMeta}>
                        <View style={styles.activePill}>
                            <Zap size={10} color={item.color || '#059669'} fill={item.color || '#059669'} />
                            <Text style={[styles.activePillText, { color: item.color || '#059669' }]}>AKTIF</Text>
                        </View>
                        {item.min_purchase > 0 && (
                            <Text style={styles.campaignMinPurchase}>
                                • Min. Rp {parseFloat(item.min_purchase).toLocaleString('id-ID')}
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.campaignBenefit}>
                    <View style={styles.benefitCircle}>
                        <Text style={[styles.benefitValue, { color: item.color || '#059669' }]}>
                            {item.discount_type === 'percentage'
                                ? `${parseFloat(item.discount_value).toFixed(0)}%`
                                : '!!!'}
                        </Text>
                        <Text style={[styles.benefitLabel, { color: item.color || '#059669' }]}>OFF</Text>
                    </View>
                </View>
            </View>

            {/* Decorative Element */}
            <View style={styles.decorCircle} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Promo & Penawaran</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.backBtn}>
                    <Bell size={24} color="#1E293B" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <View style={{ paddingVertical: 100, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#059669" />
                        <Text style={{ marginTop: 15, color: '#94A3B8' }}>Memuat promo terbaru...</Text>
                    </View>
                ) : (
                    <>
                        {/* Hero section - Dynamic from promos with is_hero flag */}
                        {promos.filter(p => p.is_hero).length > 0 && (
                            <ImageBackground
                                source={{ uri: getImageUrl(promos.find(p => p.is_hero)?.image_url) || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop' }}
                                style={styles.heroSection}
                                imageStyle={{ borderRadius: 30 }}
                            />
                        )}

                        {/* Voucher Section */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Ticket size={20} color="#059669" />
                                <Text style={styles.sectionTitle}>Voucer Berkah88</Text>
                            </View>
                        </View>
                        <View style={styles.voucherList}>
                            {promos.filter(p => p.code && !p.is_hero).length > 0 ? (
                                promos.filter(p => p.code && !p.is_hero).map(renderVoucher)
                            ) : (
                                <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20 }}>
                                    <Ticket size={48} color="#D1D5DB" />
                                    <Text style={{ marginTop: 10, color: '#94A3B8', textAlign: 'center' }}>Belum ada voucer aktif saat ini.</Text>
                                </View>
                            )}
                        </View>

                        {/* Ongoing Campaigns Section */}
                        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                            <View style={styles.sectionTitleRow}>
                                <Zap size={20} color="#FBBF24" />
                                <Text style={styles.sectionTitle}>Kampanye Sedang Berlangsung</Text>
                            </View>
                        </View>

                        <View style={{ gap: 16 }}>
                            {promos.filter(p => !p.code && !p.is_hero).length > 0 ? (
                                promos.filter(p => !p.code && !p.is_hero).map(renderCampaign)
                            ) : (
                                <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                    <Zap size={32} color="#D1D5DB" />
                                    <Text style={{ marginTop: 8, color: '#94A3B8', fontSize: 13 }}>Belum ada kampanye aktif hari ini.</Text>
                                </View>
                            )}
                        </View>

                        {/* Promo Tips Card */}
                        <View style={styles.tipsCard}>
                            <View style={styles.tipsIconWrap}>
                                <Star size={30} color="#FFFFFF" fill="#FFFFFF" />
                            </View>
                            <View style={styles.tipsContent}>
                                <Text style={styles.tipsTitle}>Tips Hemat Berkah!</Text>
                                <Text style={styles.tipsDesc}>Kumpulkan poin setiap belanja untuk ditukarkan dengan potongan harga langsung di pesanan berikutnya.</Text>
                                <TouchableOpacity
                                    style={styles.pointsLink}
                                    onPress={() => navigation.navigate('PointsHistory')}
                                >
                                    <Text style={styles.pointsLinkText}>Cek Poin Sekarang</Text>
                                    <ChevronRight size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>

            {/* Promo Code Popup Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={codeModalVisible}
                onRequestClose={() => setCodeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={[styles.modalHeaderIcon, { backgroundColor: (selectedPromo?.color || '#059669') + '15' }]}>
                            <Gift size={32} color={selectedPromo?.color || '#059669'} />
                        </View>

                        <Text style={styles.modalTitle}>{selectedPromo?.title}</Text>
                        <Text style={styles.modalSubtitle}>Salin kode di bawah ini untuk digunakan saat pembayaran.</Text>

                        <View style={styles.codeContainer}>
                            <Text style={styles.codeText}>{selectedPromo?.code}</Text>
                            <TouchableOpacity
                                style={[styles.copyIconBtn, copied && { backgroundColor: '#10B981' }]}
                                onPress={copyToClipboard}
                            >
                                {copied ? <CheckCircle2 size={20} color="#FFFFFF" /> : <Copy size={20} color="#64748B" />}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.promoDetailInfo}>
                            <View style={styles.detailRow}>
                                <Info size={14} color="#94A3B8" />
                                <Text style={styles.detailText}>
                                    {selectedPromo?.discount_type === 'percentage'
                                        ? `Diskon ${selectedPromo.discount_value}%`
                                        : `Potongan Rp ${parseFloat(selectedPromo?.discount_value || 0).toLocaleString('id-ID')}`}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <ShoppingBag size={14} color="#94A3B8" />
                                <Text style={styles.detailText}>Min. Pembelian Rp {parseFloat(selectedPromo?.min_purchase || 0).toLocaleString('id-ID')}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.closeModalBtn, { backgroundColor: selectedPromo?.color || '#059669' }]}
                            onPress={() => setCodeModalVisible(false)}
                        >
                            <Text style={styles.closeModalText}>Alhamdulillah, Terima Kasih</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Set to white to match header
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    scrollContent: {
        padding: 20,
    },
    heroSection: {
        height: 200,
        marginBottom: 30,
        justifyContent: 'flex-end',
    },
    heroOverlay: {
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 30,
        height: '100%',
        justifyContent: 'flex-end',
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(5, 150, 105, 0.9)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 10,
        gap: 6,
    },
    heroBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    heroSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        lineHeight: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    seeAllText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#059669',
    },
    voucherList: {
        gap: 16,
    },
    voucherCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        minHeight: 110,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.03)' },
            android: { elevation: 3 }
        })
    },
    voucherLeft: {
        width: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    voucherRight: {
        flex: 1,
        padding: 12,
        paddingLeft: 15,
        justifyContent: 'center',
    },
    voucherHeader: {
        marginBottom: 8,
    },
    voucherTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
        flex: 1,
        marginRight: 6,
    },
    voucherDesc: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
        lineHeight: 14,
    },
    voucherFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    expiryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expiryText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
    },
    claimBtn: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginLeft: 'auto',
    },
    claimBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1E293B',
    },
    cutoutTop: {
        position: 'absolute',
        top: -8,
        left: 62,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cutoutBottom: {
        position: 'absolute',
        bottom: -8,
        left: 62,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    campaignCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 16,
        ...Platform.select({
            web: { boxShadow: '0px 8px 20px rgba(0,0,0,0.15)' },
            android: { elevation: 6 }
        })
    },
    campaignContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    campaignIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    campaignMain: {
        flex: 1,
    },
    campaignTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    campaignSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
        lineHeight: 16,
    },
    campaignMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    activePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    activePillText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    campaignMinPurchase: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '700',
    },
    campaignBenefit: {
        paddingLeft: 15,
    },
    benefitCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' },
            android: { elevation: 3 }
        })
    },
    benefitValue: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -1,
    },
    benefitLabel: {
        fontSize: 9,
        fontWeight: '900',
        marginTop: -4,
    },
    decorCircle: {
        position: 'absolute',
        right: -20,
        top: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: -1,
    },
    tipsCard: {
        backgroundColor: '#059669',
        marginVertical: 30,
        borderRadius: 30,
        padding: 25,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    tipsIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipsContent: {
        flex: 1,
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    tipsDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
        lineHeight: 18,
    },
    pointsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    pointsLinkText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textDecorationLine: 'underline',
    },
    voucherTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    discountBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    discountBadgeText: {
        fontSize: 10,
        fontWeight: '900',
    },
    minPurchaseBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    minPurchaseText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748B',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        width: '100%',
        maxWidth: 340,
        padding: 24,
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.2)' },
            android: { elevation: 10 }
        })
    },
    modalHeaderIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    codeText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: 2,
    },
    copyIconBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    promoDetailInfo: {
        width: '100%',
        gap: 10,
        marginBottom: 30,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    closeModalBtn: {
        width: '100%',
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeModalText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    activeNavLabel: {
        color: '#059669',
        fontWeight: '900',
        marginTop: 2,
    }
});

export default PromoScreen;
