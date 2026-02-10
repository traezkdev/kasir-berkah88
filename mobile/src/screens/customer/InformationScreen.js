import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Info, Calendar, ChevronRight, ShoppingBag, Sparkles, Clock, Bell, Tag } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { API_URL } from '../../api/apiService';
import BottomModalTemplate from '../../components/templates/BottomModalTemplate';

const { width } = Dimensions.get('window');

const InformationScreen = ({ navigation }) => {
    const [infos, setInfos] = useState([]);
    const [lastSeenId, setLastSeenId] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedInfo, setSelectedInfo] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const fetchInfos = async () => {
        try {
            const res = await apiService.get('/api/information?limit=100');
            if (res.data.data) {
                setInfos(res.data.data);

                // Get last seen timestamp before updating it
                const savedTimestampRaw = await AsyncStorage.getItem('@last_seen_info_timestamp');
                if (savedTimestampRaw) {
                    const savedTimestamp = parseInt(savedTimestampRaw);
                    setLastSeenId(savedTimestamp); // We'll use this to compare timestamps
                }

                // Mark as seen - save the timestamp of the latest info
                if (res.data.data.length > 0) {
                    const latestTimestamp = new Date(res.data.data[0].created_at).getTime();
                    await AsyncStorage.setItem('@last_seen_info_timestamp', latestTimestamp.toString());
                }
            }
        } catch (error) {
            console.error('Error fetching information:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchInfos();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchInfos();
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const handleAction = (info) => {
        if (info.link_type === 'product' && info.link_value) {
            setShowDetail(false);
            navigation.navigate('Menu', { itemId: info.link_value });
        } else if (info.link_type === 'promo') {
            setShowDetail(false);
            // Navigate to Promo tab in MainTabs to show navbar
            navigation.navigate('MainTabs', { screen: 'Promo' });
        }
    };

    if (isLoading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pusat Informasi</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingVertical: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
                }
                showsVerticalScrollIndicator={false}
            >
                {infos.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <View style={styles.emptyIconBackground}>
                                <Sparkles size={48} color="#10B981" />
                            </View>
                            {/* Floating elements for effect */}
                            <View style={[styles.minifloater, { top: 0, right: -10, backgroundColor: '#FEF3C7' }]}>
                                <Tag size={16} color="#D97706" />
                            </View>
                            <View style={[styles.minifloater, { bottom: 0, left: -10, backgroundColor: '#DBEAFE' }]}>
                                <Bell size={16} color="#2563EB" />
                            </View>
                        </View>
                        <Text style={styles.emptyTitle}>Belum Ada Kabar Baru</Text>
                        <Text style={styles.emptySubtitle}>
                            Saat ini belum ada informasi promo atau pengumuman penting untukmu. Cek lagi nanti ya!
                        </Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} activeOpacity={0.8}>
                            <Text style={styles.refreshButtonText}>Muat Ulang</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    infos.map((info, index) => {
                        const infoTimestamp = new Date(info.created_at).getTime();
                        const isNew = lastSeenId < infoTimestamp;
                        return (
                            <TouchableOpacity
                                key={info.id}
                                style={styles.infoCard}
                                activeOpacity={0.9}
                                onPress={() => {
                                    setSelectedInfo(info);
                                    setShowDetail(true);
                                }}
                            >
                                {/* Header Date & Status */}
                                <View style={styles.cardHeaderTop}>
                                    <View style={styles.metaBadge}>
                                        <Clock size={12} color="#2563EB" />
                                        <Text style={styles.metaDate}>{formatDate(info.created_at).split(' pukul ')[0]}</Text>
                                    </View>
                                    {isNew && (
                                        <View style={styles.newBadge}>
                                            <View style={styles.redDot} />
                                            <Text style={styles.newBadgeText}>BARU</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Main Image */}
                                {info.image_url && (
                                    <View style={styles.imageContainer}>
                                        <Image
                                            source={{ uri: `${API_URL}${info.image_url}` }}
                                            style={styles.cardImage}
                                            resizeMode="cover"
                                        />
                                    </View>
                                )}

                                {/* Title & Content */}
                                <Text style={styles.infoTitle} numberOfLines={2}>{info.title}</Text>
                                <View style={styles.contentWrapper}>
                                    <Text style={styles.infoContent} numberOfLines={3}>
                                        {info.content}
                                    </Text>
                                </View>

                                {/* Footer Action */}
                                {info.link_type !== 'none' && (
                                    <View style={styles.footerAction}>
                                        {info.link_type === 'promo' ? (
                                            <View style={[styles.actionBadge, { backgroundColor: '#FEF3C7' }]}>
                                                <Tag size={12} color="#D97706" />
                                                <Text style={[styles.actionText, { color: '#D97706' }]}>Lihat Promo</Text>
                                            </View>
                                        ) : (
                                            <View style={[styles.actionBadge, { backgroundColor: '#DCFCE7' }]}>
                                                <ShoppingBag size={12} color="#15803D" />
                                                <Text style={[styles.actionText, { color: '#15803D' }]}>Lihat Produk</Text>
                                            </View>
                                        )}
                                        <View style={styles.actionArrow}>
                                            <ChevronRight size={16} color="#94A3B8" />
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            <BottomModalTemplate
                visible={showDetail}
                onClose={() => setShowDetail(false)}
                title="Detail Informasi"
                height="85%"
                footer={(selectedInfo?.link_type === 'product' || selectedInfo?.link_type === 'promo') && (
                    <TouchableOpacity
                        style={[styles.modalActionBtn, selectedInfo?.link_type === 'promo' && { backgroundColor: '#F59E0B' }]}
                        onPress={() => handleAction(selectedInfo)}
                        activeOpacity={0.8}
                    >
                        {selectedInfo?.link_type === 'product' ? (
                            <>
                                <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={styles.modalActionBtnText}>Pesan Sekarang</Text>
                            </>
                        ) : (
                            <>
                                <Tag size={18} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={styles.modalActionBtnText}>Lihat Promo</Text>
                            </>
                        )}
                        <ChevronRight size={18} color="#FFFFFF" strokeWidth={3} />
                    </TouchableOpacity>
                )}
            >
                {selectedInfo && (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.modalContent}>
                        {selectedInfo.image_url && (
                            <Image
                                source={{ uri: `${API_URL}${selectedInfo.image_url}` }}
                                style={styles.modalImage}
                                resizeMode="cover"
                            />
                        )}

                        <View style={styles.modalBody}>
                            <View style={styles.modalMetaRow}>
                                <View style={styles.modalMetaItem}>
                                    <Calendar size={14} color="#6366F1" />
                                    <Text style={styles.modalMetaText}>{formatDate(selectedInfo.created_at)}</Text>
                                </View>
                            </View>

                            <Text style={styles.modalTitle}>{selectedInfo.title}</Text>
                            <View style={styles.contentDivider} />
                            <Text style={styles.modalInfoContent}>{selectedInfo.content}</Text>

                            {/* Spacing for footer */}
                            <View style={{ height: 40 }} />
                        </View>
                    </ScrollView>
                )}
            </BottomModalTemplate>
        </SafeAreaView>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
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
        backgroundColor: '#F8FAFC', // Putih gelap (Off-white)
    },
    emptyContainer: {
        marginTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        position: 'relative',
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
        width: 100,
        height: 100,
    },
    emptyIconBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    minifloater: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    refreshButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    refreshButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    metaDate: {
        fontSize: 10,
        color: '#2563EB',
        fontWeight: '700',
    },
    newBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 100,
    },
    redDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
    },
    newBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#EF4444',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F8FAFC',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
        lineHeight: 24,
    },
    contentWrapper: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    infoContent: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
        fontWeight: '500',
    },
    footerAction: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
        borderStyle: 'dashed', // Note: dashed border style works on iOS, Android needs specific impl or just solid
    },
    actionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    actionText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Modal Styles
    modalContent: {
        flex: 1,
    },
    modalImage: {
        width: '100%',
        height: 250,
        borderRadius: 24,
        marginBottom: 20,
    },
    modalBody: {
        paddingHorizontal: 4,
    },
    modalMetaRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    modalMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    modalMetaText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '800',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        lineHeight: 32,
        marginBottom: 16,
    },
    contentDivider: {
        height: 4,
        width: 40,
        backgroundColor: '#10B981',
        borderRadius: 2,
        marginBottom: 20,
    },
    modalInfoContent: {
        fontSize: 16,
        color: '#475569',
        lineHeight: 26,
        fontWeight: '500',
    },
    modalActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#10B981',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    modalActionBtnText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        textAlign: 'center',
        marginHorizontal: 10,
    }
});

export default InformationScreen;
