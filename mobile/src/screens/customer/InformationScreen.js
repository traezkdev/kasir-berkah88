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
import { ChevronLeft, Info, Calendar, ChevronRight, ShoppingBag, Sparkles, Clock, Bell } from 'lucide-react-native';
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
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
                }
                showsVerticalScrollIndicator={false}
            >
                {infos.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Info size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>Belum ada informasi terbaru.</Text>
                    </View>
                ) : (
                    infos.map((info, index) => {
                        const infoTimestamp = new Date(info.created_at).getTime();
                        const isNew = lastSeenId < infoTimestamp;
                        return (
                            <TouchableOpacity
                                key={info.id}
                                style={styles.infoCard}
                                activeOpacity={0.8}
                                onPress={() => {
                                    setSelectedInfo(info);
                                    setShowDetail(true);
                                }}
                            >
                                <View style={styles.cardHeader}>
                                    {info.image_url ? (
                                        <View style={styles.thumbnailWrapper}>
                                            <Image
                                                source={{ uri: `${API_URL}${info.image_url}` }}
                                                style={styles.thumbnail}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    ) : (
                                        <View style={styles.iconPlaceholder}>
                                            <Bell size={24} color="#6366F1" />
                                        </View>
                                    )}

                                    <View style={styles.mainContent}>
                                        <View style={styles.topRow}>
                                            <View style={styles.metaBadge}>
                                                <Clock size={10} color="#6366F1" />
                                                <Text style={styles.metaDate}>{formatDate(info.created_at).split(' pukul ')[0]}</Text>
                                            </View>
                                            {isNew && (
                                                <View style={styles.dotBadge}>
                                                    <View style={styles.redDot} />
                                                    <Text style={styles.redDotText}>BARU</Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text style={styles.infoTitle} numberOfLines={1}>{info.title}</Text>
                                        <Text style={styles.infoContent} numberOfLines={2}>
                                            {info.content}
                                        </Text>

                                        {info.link_type === 'product' && (
                                            <View style={styles.compactAction}>
                                                <ShoppingBag size={12} color="#10B981" />
                                                <Text style={styles.compactActionText}>Lihat Produk</Text>
                                                <ChevronRight size={12} color="#10B981" />
                                            </View>
                                        )}
                                    </View>
                                </View>
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
                footer={selectedInfo?.link_type === 'product' && (
                    <TouchableOpacity
                        style={styles.modalActionBtn}
                        onPress={() => handleAction(selectedInfo)}
                        activeOpacity={0.8}
                    >
                        <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={styles.modalActionBtnText}>Pesan Sekarang</Text>
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
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        marginBottom: 8, // Beri jarak sedikit agar bg terlihat
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    cardHeader: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    thumbnailWrapper: {
        width: 80,
        height: 80,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    iconPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 18,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    metaDate: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '700',
    },
    dotBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    redDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
    },
    redDotText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#EF4444',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 4,
    },
    infoContent: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        fontWeight: '500',
    },
    compactAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
    },
    compactActionText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#10B981',
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
