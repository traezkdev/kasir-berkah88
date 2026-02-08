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
    Alert
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
    Wallet
} from 'lucide-react-native';
import apiService from '../../api/apiService';

const { width } = Dimensions.get('window');

const PromoScreen = ({ navigation }) => {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => item.code && Alert.alert('Kode Promo', `Gunakan kode: ${item.code}`)}
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Promo & Penawaran</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <View style={{ paddingVertical: 100, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#059669" />
                        <Text style={{ marginTop: 15, color: '#94A3B8' }}>Memuat promo terbaru...</Text>
                    </View>
                ) : (
                    <>
                        {/* Hero section */}
                        <ImageBackground
                            source={{ uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop' }}
                            style={styles.heroSection}
                            imageStyle={{ borderRadius: 30 }}
                        >
                            <View style={styles.heroOverlay}>
                                <View style={styles.heroBadge}>
                                    <Sparkles size={14} color="#FFFFFF" fill="#FFFFFF" />
                                    <Text style={styles.heroBadgeText}>SPESIAL PENJUALAN TERBAIK</Text>
                                </View>
                                <Text style={styles.heroTitle}>Makan Enak, Dompet Happy!</Text>
                                <Text style={styles.heroSubtitle}>Temukan berbagai penawaran menarik khusus untuk kamu hari ini.</Text>
                            </View>
                        </ImageBackground>

                        {/* Voucher Section */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Ticket size={20} color="#059669" />
                                <Text style={styles.sectionTitle}>Voucer Berkah88</Text>
                            </View>
                        </View>
                        <View style={styles.voucherList}>
                            {promos.length > 0 ? (
                                promos.map(renderVoucher)
                            ) : (
                                <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20 }}>
                                    <Ticket size={48} color="#D1D5DB" />
                                    <Text style={{ marginTop: 10, color: '#94A3B8', textAlign: 'center' }}>Belum ada promo aktif saat ini. Cek lagi nanti ya!</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}

                {/* Ongoing Campaigns */}
                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                    <View style={styles.sectionTitleRow}>
                        <Zap size={20} color="#FBBF24" />
                        <Text style={styles.sectionTitle}>Kampanye Sedang Berlangsung</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.campaignCard}>
                    <View style={styles.campaignContent}>
                        <View style={styles.campaignInfo}>
                            <Text style={styles.campaignTitle}>Pesta Gajian Berkah</Text>
                            <Text style={styles.campaignSubtitle}>Diskon s.d 50% untuk menu pilihan. Setiap tanggal 25-30!</Text>
                            <View style={styles.activeIndicator}>
                                <CheckCircle2 size={12} color="#10B981" />
                                <Text style={styles.activeText}>Sedang Aktif</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="#CBD5E1" />
                    </View>
                </TouchableOpacity>

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
            </ScrollView>
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
        ...Platform.select({
            web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' },
            android: { elevation: 5 }
        })
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
        height: 100,
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
        padding: 15,
        justifyContent: 'space-between',
    },
    voucherTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    voucherDesc: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    voucherFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
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
        backgroundColor: '#F8FAFC',
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
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    campaignCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.03)' },
            android: { elevation: 2 }
        })
    },
    campaignContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    campaignInfo: {
        flex: 1,
    },
    campaignTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    campaignSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
        lineHeight: 18,
    },
    activeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 10,
        gap: 4,
    },
    activeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#059669',
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
    }
});

export default PromoScreen;
