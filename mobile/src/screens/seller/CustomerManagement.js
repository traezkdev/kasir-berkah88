import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Platform,
    StatusBar,
    RefreshControl
} from 'react-native';
import {
    ChevronLeft,
    Search,
    User,
    ShoppingBag,
    Coins,
    Banknote,
    MapPin,
    Calendar,
    Phone,
    MessageCircle
} from 'lucide-react-native';
import { useChat } from '../../context/ChatContext';
import apiService, { API_URL } from '../../api/apiService';
import { useToast } from '../../context/ToastContext';
import ModernLoader from '../../components/ModernLoader';

const CustomerManagement = ({ navigation }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const { showToast } = useToast();
    const { setActiveChat } = useChat();

    // Debounce search
    const [query, setQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(searchText);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText]);

    const fetchCustomers = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const response = await apiService.get(`/api/customers?search=${query}`);
            setCustomers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
            showToast('Gagal memuat data pelanggan', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [query]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCustomers(true);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(val || 0);
    };

    const handleChat = (item) => {
        setActiveChat({
            user_id: item.id,
            username: item.username,
            avatar_url: item.avatar_url,
            role: 'pelanggan'
        });
        navigation.navigate('ChatScreen');
    };

    const renderCustomerCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CustomerDetails', {
                customerName: item.username,
                customerPhone: item.phone,
                customerAddress: item.address,
                customerId: item.id
            })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.username || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.customerName}>{item.username}</Text>
                    <View style={styles.phoneRow}>
                        <Phone size={12} color="#64748B" />
                        <Text style={styles.customerPhone}>{item.phone || 'No Phone'}</Text>
                    </View>
                </View>
                <View style={styles.pointsBadge}>
                    <Coins size={12} color="#D97706" fill="#D97706" />
                    <Text style={styles.pointsText}>{new Intl.NumberFormat('id-ID').format(item.points || 0)}</Text>
                </View>
                <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => handleChat(item)}
                >
                    <MessageCircle size={16} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Belanja</Text>
                    <View style={styles.statValueRow}>
                        <ShoppingBag size={14} color="#64748B" />
                        <Text style={styles.statValue}>{formatCurrency(item.total_spent)}</Text>
                    </View>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Order</Text>
                    <View style={styles.statValueRow}>
                        <Calendar size={14} color="#64748B" />
                        <Text style={styles.statValue}>{item.total_orders || 0}x</Text>
                    </View>
                </View>
            </View>

            {item.address && (
                <View style={styles.addressBox}>
                    <MapPin size={12} color="#94A3B8" />
                    <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Pelanggan</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari nama atau no. HP..."
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholderTextColor="#94A3B8"
                    />
                </View>
            </View>

            {/* Content */}
            {loading && !refreshing && customers.length === 0 ? (
                <ModernLoader type="list" />
            ) : (
                <FlatList
                    data={customers}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderCustomerCard}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <User size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Tidak ada pelanggan ditemukan</Text>
                        </View>
                    }
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
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
    searchContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        height: 44,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
    },
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' },
            android: { elevation: 2 }
        })
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E40AF',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    customerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    customerPhone: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    pointsText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#B45309',
    },
    chatBtn: {
        backgroundColor: '#138FEA',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        color: '#94A3B8',
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#334155',
    },
    verticalDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 16,
    },
    addressBox: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 8,
        borderRadius: 8,
        gap: 6,
    },
    addressText: {
        fontSize: 11,
        color: '#64748B',
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: '#94A3B8',
        marginTop: 16,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CustomerManagement;
