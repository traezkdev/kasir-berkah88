import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    TextInput,
    Dimensions,
    RefreshControl,
    Modal,
    Pressable,
    Animated,
    StatusBar
} from 'react-native';
import {
    ChevronLeft,
    History,
    RefreshCw,
    Search,
    Wallet,
    Calendar,
    ChevronRight,
    X,
    MapPin,
    Download,
    TrendingUp,
    Receipt,
    Banknote,
    QrCode,
    CreditCard,
    User,
    ArrowRight,
    MessageSquare
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../../api/apiService';
import ReceiptModal from '../../components/ReceiptModal';
import EditTransactionModal from './EditTransactionModal';
import TransactionDetailModal from './TransactionDetailModal';
import ModernLoader from '../../components/ModernLoader';
import { useOrderNotification } from '../../context/OrderNotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';
import { Trash2, AlertTriangle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TransactionCard = React.memo(({ item, setSelectedTx, formatDate, formatCurrency }) => {
    const scale = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.98,
            useNativeDriver: Platform.OS !== 'web',
            speed: 50,
            bounciness: 4
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: Platform.OS !== 'web',
            speed: 50,
            bounciness: 4
        }).start();
    };

    const getMethodIcon = () => {
        const method = (item.payment_method || '').toLowerCase();
        if (method.includes('transfer')) return <QrCode size={120} color="#3B82F6" />;
        if (method.includes('cash') || method.includes('tunai')) return <Banknote size={120} color="#22C55E" />;
        if (method.includes('qris')) return <QrCode size={120} color="#3B82F6" />;
        return <CreditCard size={120} color="#3B82F6" />;
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => setSelectedTx(item)}
        >
            <Animated.View style={[styles.txCard, { transform: [{ scale }] }]}>
                {/* Background Icon */}
                <View style={styles.cardBgIcon}>
                    {getMethodIcon()}
                </View>

                <View style={styles.cardHeader}>
                    <View>
                        <View style={styles.idBadge}>
                            <Text style={styles.idText}>#{item.id}</Text>
                        </View>
                        <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                    </View>
                    <View style={[styles.methodBadge, { backgroundColor: (item.payment_method?.toLowerCase() === 'cash' || item.payment_method?.toLowerCase() === 'tunai') ? '#F0FDF4' : '#EFF6FF' }]}>
                        <Text style={[styles.methodText, { color: (item.payment_method?.toLowerCase() === 'cash' || item.payment_method?.toLowerCase() === 'tunai') ? '#166534' : '#1E40AF' }]}>
                            {item.payment_method?.toLowerCase() === 'transfer' ? 'QRIS' : (item.payment_method || 'Tunai').toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.itemsPreview}>
                    {item.items.slice(0, 2).map((prod, idx) => (
                        <View key={idx} style={styles.previewRow}>
                            <Text style={styles.previewName} numberOfLines={1}>{prod.name}</Text>
                            <Text style={styles.previewQty}>x{prod.qty || prod.quantity || 1}</Text>
                        </View>
                    ))}
                    {item.items.length > 2 && (
                        <Text style={styles.moreItemsText}>+ {item.items.length - 2} item lainnya</Text>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.totalLabel}>Total Bayar</Text>
                    <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
                </View>
            </Animated.View>
        </Pressable>
    );
});

const TransactionHistory = ({ navigation }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const { refreshTrigger } = useOrderNotification();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedTx, setSelectedTx] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    // Helper to get local date string (YYYY-MM-DD)
    const getLocalDateString = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(getLocalDateString()); // Default ke hari ini (Local Time)
    const [showFilterModal, setShowFilterModal] = useState(false);

    const fetchTransactions = useCallback(async (pageNum = 1, isRefresh = false, search = '', date = null) => {
        if (pageNum === 1 && !isRefresh) setLoading(true);
        if (pageNum > 1) setLoadingMore(true);

        try {
            let url = `/api/transactions?page=${pageNum}&limit=10&search=${search}`;
            if (date) {
                url += `&startDate=${date}&endDate=${date}`;
            }
            const response = await apiService.get(url);
            if (response.data && response.data.message === 'success') {
                const newData = response.data.data.map(t => ({
                    ...t,
                    timestamp: new Date(t.timestamp),
                    items: typeof t.items === 'string' ? JSON.parse(t.items || '[]') : (t.items || [])
                }));

                if (pageNum === 1) {
                    setTransactions(newData);
                } else {
                    setTransactions(prev => [...prev, ...newData]);
                }

                const pagination = response.data.pagination;
                setTotalPages(pagination.totalPages);
                setTotalItems(pagination.totalItems);
                setTotalAmount(pagination.totalAmount || 0);
                setHasMore(pageNum < pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, []);

    // Real-time update listener
    useEffect(() => {
        // Refresh data when a new order/transaction is detected globally via Socket
        if (refreshTrigger > 0) {
            console.log('Real-time update: Refreshing transactions...');
            fetchTransactions(1, true, debouncedSearch, selectedDate);
        }
    }, [refreshTrigger]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch when focused or when search/date changes
    useFocusEffect(
        useCallback(() => {
            setPage(1);
            fetchTransactions(1, false, debouncedSearch, selectedDate);
        }, [debouncedSearch, selectedDate, fetchTransactions])
    );

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchTransactions(1, true, debouncedSearch, selectedDate);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchTransactions(nextPage, false, debouncedSearch, selectedDate);
        }
    };

    const formatCurrency = useCallback((val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    }, []);

    const formatDate = useCallback((date) => {
        if (!date) return '-';
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }, []);

    const confirmDeleteAction = async () => {
        if (!selectedTx) return;
        try {
            setLoading(true);
            const response = await apiService.delete(`/api/transactions/${selectedTx.id}`);
            if (response.data && response.data.message === 'deleted') {
                setShowDeleteConfirm(false);
                setSelectedTx(null);
                fetchTransactions(1, true, debouncedSearch, selectedDate);
            } else {
                Alert.alert("Gagal", "Gagal menghapus transaksi.");
            }
        } catch (error) {
            console.error('Delete transaction error:', error);
            Alert.alert("Error", "Terjadi kesalahan saat menghapus data.");
        } finally {
            setLoading(false);
        }
    };



    const renderItem = useCallback(({ item }) => (
        <TransactionCard
            item={item}
            setSelectedTx={setSelectedTx}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
        />
    ), [formatDate, formatCurrency]);

    const handleDeleteTransaction = (tx) => {
        setShowDeleteConfirm(true);
    };

    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 20 }} />;
        return (
            <View style={styles.loaderFooter}>
                <ActivityIndicator size="small" color="#1E40AF" />
                <Text style={styles.loaderText}>Memuat lebih banyak...</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
            {/* Native Fixed Header Bar */}
            <View style={styles.topNavbar}>
                <View style={styles.headerTitleArea}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
                        <Text style={styles.headerSubtitle}>{totalItems} Transaksi tercatat</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                        onPress={onRefresh}
                        style={styles.refreshBtn}
                        disabled={refreshing || loading}
                    >
                        {refreshing || loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <RefreshCw size={20} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                    {isAdmin && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('TransactionTrash')}
                            style={[styles.refreshBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                        >
                            <Trash2 size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.heroArea}>
                {/* Blue Hero Background */}
                <View style={styles.heroBackground}>
                    <View style={styles.statsContainer}>
                        <View style={styles.mainStat}>
                            <View>
                                <Text style={styles.statLabel}>TOTAL PENDAPATAN</Text>
                                <Text style={styles.statValue}>{formatCurrency(totalAmount)}</Text>
                            </View>
                            <View style={styles.statIconContainer}>
                                <TrendingUp size={24} color="#FFFFFF" />
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Filter Section */}
            <View style={styles.filterSection}>
                <View style={styles.searchBar}>
                    <Search size={18} color="#94A3B8" />
                    <TextInput
                        placeholder="Cari ID atau Menu..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholderTextColor="#94A3B8"
                    />
                </View>
                <TouchableOpacity
                    style={[styles.datePickerBtn, selectedDate && styles.datePickerBtnActive]}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Calendar size={18} color={selectedDate ? "#FFFFFF" : "#64748B"} />
                    <Text style={[styles.dateLabel, selectedDate && styles.dateLabelActive]}>
                        {selectedDate ? selectedDate : "Filter Tanggal"}
                    </Text>
                    {selectedDate && (
                        <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.clearDateBtn}>
                            <X size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading && transactions.length === 0 ? (
                <ModernLoader type="list" />
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E40AF']} />}
                    renderItem={renderItem}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={
                        <View style={styles.emptyArea}>
                            <Receipt size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Belum ada riwayat transaksi</Text>
                        </View>
                    }
                />
            )}

            {/* Detail Modal Overlay */}
            <TransactionDetailModal
                visible={!!selectedTx}
                transaction={selectedTx}
                onClose={() => setSelectedTx(null)}
                onEdit={() => setShowEditModal(true)}
                onPrint={() => setShowReceipt(true)}
                onDelete={() => handleDeleteTransaction(selectedTx)}
                isAdmin={isAdmin}
                navigation={navigation}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
            />

            {/* Premium Delete Confirmation Modal */}
            <Modal visible={showDeleteConfirm} transparent animationType="fade">
                <View style={styles.confirmOverlay}>
                    <View style={styles.confirmCard}>
                        <View style={styles.confirmIconBg}>
                            <AlertTriangle size={32} color="#DC2626" />
                        </View>
                        <Text style={styles.confirmTitle}>Hapus Transaksi?</Text>
                        <Text style={styles.confirmSubtitle}>
                            Transaksi <Text style={{ color: '#1E293B', fontWeight: '900' }}>#{selectedTx?.id}</Text> akan dipindahkan ke tempat sampah. Anda dapat memulihkannya nanti di menu utama jika diperlukan.
                        </Text>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={styles.confirmCancelBtn}
                                onPress={() => setShowDeleteConfirm(false)}
                                disabled={loading}
                            >
                                <Text style={styles.confirmCancelText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmDeleteBtn}
                                onPress={confirmDeleteAction}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmDeleteText}>Ya, Hapus</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {showReceipt && (
                <ReceiptModal
                    visible={showReceipt}
                    onClose={() => setShowReceipt(false)}
                    transaction={selectedTx}
                />
            )}

            {showEditModal && (
                <EditTransactionModal
                    visible={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    transaction={selectedTx}
                    onSave={() => {
                        fetchTransactions(1, true, debouncedSearch, selectedDate);
                        setSelectedTx(null);
                    }}
                />
            )}

            {/* Date Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowFilterModal(false)}
                >
                    <Animated.View style={styles.filterModalContent}>
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle}>Pilih Rentang Waktu</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.filterOptions}>
                            <TouchableOpacity
                                style={[styles.filterOption, !selectedDate && styles.filterOptionActive]}
                                onPress={() => {
                                    setSelectedDate(null);
                                    setShowFilterModal(false);
                                }}
                            >
                                <History size={20} color={!selectedDate ? "#1E40AF" : "#64748B"} />
                                <Text style={[styles.filterOptionText, !selectedDate && styles.filterOptionTextActive]}>Semua Waktu</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.filterOption, selectedDate === getLocalDateString() && styles.filterOptionActive]}
                                onPress={() => {
                                    setSelectedDate(getLocalDateString());
                                    setShowFilterModal(false);
                                }}
                            >
                                <Calendar size={20} color={selectedDate === getLocalDateString() ? "#1E40AF" : "#64748B"} />
                                <Text style={[styles.filterOptionText, selectedDate === getLocalDateString() && styles.filterOptionTextActive]}>Hari Ini</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.filterOption, selectedDate === getLocalDateString(new Date(Date.now() - 86400000)) && styles.filterOptionActive]}
                                onPress={() => {
                                    setSelectedDate(getLocalDateString(new Date(Date.now() - 86400000)));
                                    setShowFilterModal(false);
                                }}
                            >
                                <Calendar size={20} color={selectedDate === getLocalDateString(new Date(Date.now() - 86400000)) ? "#1E40AF" : "#64748B"} />
                                <Text style={[styles.filterOptionText, selectedDate === getLocalDateString(new Date(Date.now() - 86400000)) && styles.filterOptionTextActive]}>Kemarin</Text>
                            </TouchableOpacity>

                            <View style={styles.filterDivider} />

                            <Text style={styles.filterSubLabel}>Bulan Ini</Text>

                            <TouchableOpacity
                                style={styles.filterOption}
                                onPress={() => {
                                    setSelectedDate(getLocalDateString());
                                    setShowFilterModal(false);
                                }}
                            >
                                <TrendingUp size={20} color="#64748B" />
                                <Text style={styles.filterOptionText}>Kembali ke Hari Ini</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#BFDBFE',
        fontWeight: 'bold',
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    mainStat: {
        backgroundColor: '#1E3A8A', // Solid Indigo/Blue
        padding: 20,
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3B82F6',
        ...Platform.select({
            web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' },
            android: { elevation: 8 }
        })
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#93C5FD',
        letterSpacing: 1,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    statIconContainer: {
        width: 50,
        height: 50,
        backgroundColor: '#2563EB',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
            },
            android: { elevation: 4 },
            web: { boxShadow: '0px 4px 5px rgba(0,0,0,0.2)' }
        })
    },
    topNavbar: {
        backgroundColor: '#1E40AF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : (Platform.OS === 'ios' ? 50 : 25),
        paddingBottom: 20,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    headerTitleArea: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    refreshBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroArea: {
        backgroundColor: '#F8FAFC',
    },
    heroBackground: {
        backgroundColor: '#1E40AF',
        paddingBottom: 60,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 48,
        borderBottomRightRadius: 48,
        marginTop: -1,
        position: 'relative',
    },
    statsContainer: {
        position: 'absolute',
        bottom: -35,
        left: 20,
        right: 20,
        zIndex: 20,
    },
    filterSection: {
        marginTop: 55,
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    datePickerBtn: {
        width: 140,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    datePickerBtnActive: {
        backgroundColor: '#1E40AF',
        borderColor: '#1E40AF',
    },
    dateLabelActive: {
        color: '#FFFFFF',
    },
    clearDateBtn: {
        marginLeft: 4,
        padding: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    filterModalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    filterTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    filterOptions: {
        gap: 12,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    filterOptionActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#1E40AF',
    },
    filterOptionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    filterOptionTextActive: {
        color: '#1E40AF',
    },
    filterDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 8,
    },
    filterSubLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 20,
    },
    txCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden', // Penting agar icon latar belakang tidak keluar kartu
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.03)' },
            android: { elevation: 2 }
        })
    },
    cardBgIcon: {
        position: 'absolute',
        right: -20,
        top: -20,
        opacity: 0.08,
        transform: [{ rotate: '-15deg' }],
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    idBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    idText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
    },
    dateText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginTop: 6,
    },
    methodBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    methodText: {
        fontSize: 10,
        fontWeight: '900',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
        borderStyle: 'dashed',
    },
    itemsPreview: {
        marginBottom: 15,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    previewName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#475569',
        flex: 1,
    },
    previewQty: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#94A3B8',
    },
    moreItemsText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#3B82F6',
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
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
    },
    loaderFooter: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    loaderText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: 'bold',
    },
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    confirmCard: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxWidth: 340,
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    confirmIconBg: {
        width: 64,
        height: 64,
        backgroundColor: '#FEF2F2',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    confirmSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        fontWeight: 'bold',
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmCancelBtn: {
        flex: 1,
        height: 54,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmCancelText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#64748B',
    },
    confirmDeleteBtn: {
        flex: 1,
        height: 54,
        borderRadius: 18,
        backgroundColor: '#DC2626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmDeleteText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});

export default TransactionHistory;
