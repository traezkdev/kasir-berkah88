import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    RefreshControl
} from 'react-native';
import {
    ChevronLeft,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    Slash,
    ShoppingBag
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import SellerOrderCard from '../../components/SellerOrderCard';

const OrderManagement = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    const fetchOrders = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const response = await apiService.get(`/api/orders?status=${activeTab}&limit=50`);
            setOrders(response.data.data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders(true);
    };

    const handleUpdateStatus = async (orderId, status) => {
        try {
            await apiService.put(`/api/orders/${orderId}/status`, { status });
            fetchOrders(true);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const tabs = [
        { id: 'pending', label: 'Baru', icon: Clock },
        { id: 'accepted', label: 'Diterima', icon: CheckCircle },
        { id: 'rejected', label: 'Ditolak', icon: XCircle },
        { id: 'cancelled', label: 'Batal', icon: Slash },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Pesanan</Text>
                <TouchableOpacity onPress={() => fetchOrders()} style={styles.headerAction}>
                    <RefreshCw size={20} color="#1E293B" className={loading ? 'animate-spin' : ''} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <FlatList
                    data={tabs}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsList}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <TouchableOpacity
                                onPress={() => setActiveTab(item.id)}
                                style={[styles.tab, isActive && styles.activeTab]}
                            >
                                <Icon size={16} color={isActive ? '#FFFFFF' : '#64748B'} />
                                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{item.label}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Content */}
            {loading && !refreshing ? (
                <View style={styles.loadingArea}>
                    <ActivityIndicator size="large" color="#138FEA" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.contentList}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyArea}>
                            <ShoppingBag size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Tidak ada pesanan {tabs.find(t => t.id === activeTab).label.toLowerCase()}</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <SellerOrderCard
                            order={item}
                            onAccept={activeTab === 'pending' ? () => handleUpdateStatus(item.id, 'accepted') : null}
                            onReject={activeTab === 'pending' ? () => handleUpdateStatus(item.id, 'rejected') : null}
                        />
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    headerAction: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        backgroundColor: '#FFFFFF',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tabsList: {
        paddingHorizontal: 20,
        gap: 12,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeTab: {
        backgroundColor: '#1E40AF',
        borderColor: '#1E40AF',
    },
    tabLabel: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    activeTabLabel: {
        color: '#FFFFFF',
    },
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentList: {
        padding: 20,
    },
    emptyArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: 'bold',
    }
});

export default OrderManagement;
