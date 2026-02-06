import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
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

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setIsLoading(true);
        try {
            // Fetch current points
            const pointsRes = await apiService.get('/api/customer/points');
            if (pointsRes.data.data) setPoints(pointsRes.data.data.points);

            // Fetch points history
            const historyRes = await apiService.get('/api/customer/points/history');
            if (historyRes.data.data) setHistory(historyRes.data.data);
        } catch (error) {
            console.error("Error fetching points data:", error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('id-ID', options);
    };

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
                <Text style={styles.pointsValue}>{new Intl.NumberFormat('id-ID').format(points)}</Text>
                <Text style={styles.pointsSubtitle}>Poin BERKAHPAY</Text>
            </View>

            {/* History List */}
            <ScrollView
                style={styles.historyList}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {history.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Calendar size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>Belum ada riwayat poin</Text>
                        <Text style={styles.emptySubtext}>Mulai belanja untuk mendapatkan poin!</Text>
                    </View>
                ) : (
                    history.map((item) => (
                        <View key={item.id} style={styles.historyItem}>
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
                                {item.type === 'earn' ? '+' : '-'}{new Intl.NumberFormat('id-ID').format(item.amount)}
                            </Text>
                        </View>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
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
    historyList: {
        flex: 1,
        marginTop: 24,
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
});

export default PointsHistory;
