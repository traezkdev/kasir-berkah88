import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    StatusBar,
    RefreshControl
} from 'react-native';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar } from 'lucide-react-native';
import apiService from '../../api/apiService';

const PointsHistory = ({ navigation }) => {
    const [history, setHistory] = useState([]);
    const [points, setPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchData = useCallback(async (targetPage = 1, isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else if (targetPage === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            // Fetch current points
            if (targetPage === 1) {
                const pointsRes = await apiService.get('/api/customer/points');
                if (pointsRes.data.data) setPoints(pointsRes.data.data.points);
            }

            // Fetch points history with pagination
            const historyRes = await apiService.get(`/api/customer/points/history?page=${targetPage}&limit=10`);
            const newData = historyRes.data.data || [];
            const pagination = historyRes.data.pagination;

            if (targetPage === 1) {
                setHistory(newData);
            } else {
                setHistory(prev => [...prev, ...newData]);
            }

            if (pagination) {
                setHasMore(pagination.currentPage < pagination.totalPages);
                setPage(pagination.currentPage);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching points data:", error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        fetchData(1, true);
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore && !isLoading && !refreshing) {
            fetchData(page + 1);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('id-ID', options);
    };

    const renderItem = ({ item }) => (
        <View style={styles.historyItem}>
            <View style={[
                styles.iconWrap,
                { backgroundColor: item.type === 'earn' ? '#ECFDF5' : '#FEF2F2' }
            ]}>
                {item.type === 'earn' ? (
                    <TrendingUp size={20} color="#10B981" />
                ) : (
                    <TrendingDown size={20} color="#EF4444" />
                )}
            </View>
            <View style={styles.historyContent}>
                <Text style={styles.historyDesc}>{item.description || 'Transaksi'}</Text>
                <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                {item.transaction_id && (
                    <Text style={styles.historyTrxId}>ID: {item.transaction_id}</Text>
                )}
            </View>
            <Text style={[
                styles.historyAmount,
                { color: item.type === 'earn' ? '#10B981' : '#EF4444' }
            ]}>
                {item.type === 'earn' ? '+' : '-'}{new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(item.amount)}
            </Text>
        </View>
    );

    const renderFooter = () => {
        if (!isLoadingMore) return <View style={{ height: 100 }} />;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.footerLoaderText}>Memuat lebih banyak...</Text>
            </View>
        );
    };

    const renderEmpty = () => {
        if (isLoading) return null;
        return (
            <View style={styles.emptyState}>
                <Calendar size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>Belum ada riwayat poin</Text>
                <Text style={styles.emptySubtext}>Mulai belanja untuk mendapatkan poin!</Text>
            </View>
        );
    };

    if (isLoading && page === 1 && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#059669" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Riwayat Poin</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Points Card */}
            <View style={styles.pointsCard}>
                <Text style={styles.pointsLabel}>TOTAL POIN ANDA</Text>
                <Text style={styles.pointsValue}>{new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(points)}</Text>
                <Text style={styles.pointsSubtitle}>Poin Berkah 88</Text>
            </View>

            {/* History List */}
            <View style={styles.historyListContainer}>
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
                    }
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </View>
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
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: '#059669',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    pointsCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    pointsLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    pointsValue: {
        fontSize: 48,
        fontWeight: '900',
        color: '#059669',
        letterSpacing: -2,
    },
    pointsSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 4,
    },
    historyListContainer: {
        flex: 1,
        marginTop: 24,
    },
    listContent: {
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyContent: {
        flex: 1,
    },
    historyDesc: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    historyDate: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    historyTrxId: {
        fontSize: 10,
        color: '#CBD5E1',
        fontWeight: '600',
        marginTop: 2,
    },
    historyAmount: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerLoaderText: {
        fontSize: 12,
        color: '#94A3B8',
        marginLeft: 8,
        fontWeight: '600',
    },
});

export default PointsHistory;
