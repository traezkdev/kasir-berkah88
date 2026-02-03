import React, { useState, useEffect, useMemo } from 'react';
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
    Modal
} from 'react-native';
import {
    ChevronLeft,
    History,
    RefreshCw,
    Search,
    Wallet,
    Receipt,
    TrendingUp,
    Calendar,
    ChevronRight,
    X,
    MapPin
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import ReceiptModal from '../../components/ReceiptModal';

const { width } = Dimensions.get('window');

const TransactionHistory = ({ navigation }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTx, setSelectedTx] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const fetchTransactions = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const response = await apiService.get('/api/transactions?limit=1000');
            if (response.data && response.data.message === 'success') {
                const parsedData = response.data.data.map(t => ({
                    ...t,
                    timestamp: new Date(t.timestamp),
                    items: typeof t.items === 'string' ? JSON.parse(t.items || '[]') : (t.items || [])
                }));
                // Sort newest first
                parsedData.sort((a, b) => b.timestamp - a.timestamp);
                setTransactions(parsedData);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions(true);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [transactions, searchTerm]);

    const stats = useMemo(() => {
        const total = filteredTransactions.reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0);
        const count = filteredTransactions.length;
        return { total, count };
    }, [filteredTransactions]);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.txCard}
            onPress={() => setSelectedTx(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View>
                    <View style={styles.idBadge}>
                        <Text style={styles.idText}>#{item.id}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                </View>
                <View style={[styles.methodBadge, { backgroundColor: item.payment_method === 'cash' ? '#F0FDF4' : '#EFF6FF' }]}>
                    <Text style={[styles.methodText, { color: item.payment_method === 'cash' ? '#166534' : '#1E40AF' }]}>
                        {(item.payment_method || 'Tunai').toUpperCase()}
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
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Native Fixed Header Bar */}
            <View style={styles.topNavbar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
                    <Text style={styles.headerSubtitle}>{stats.count} Transaksi tercatat</Text>
                </View>
            </View>

            <View style={styles.heroArea}>
                {/* Blue Hero Background */}
                <View style={styles.heroBackground}>
                    <View style={styles.statsContainer}>
                        <View style={styles.mainStat}>
                            <View>
                                <Text style={styles.statLabel}>TOTAL PENDAPATAN</Text>
                                <Text style={styles.statValue}>{formatCurrency(stats.total)}</Text>
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
                        placeholder="Cari transaksi..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholderTextColor="#94A3B8"
                    />
                </View>
                <TouchableOpacity style={styles.datePickerBtn}>
                    <Calendar size={18} color="#64748B" />
                    <Text style={styles.dateLabel}>Filter Tanggal</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading && !refreshing ? (
                <View style={styles.loadingArea}>
                    <ActivityIndicator size="large" color="#1E40AF" />
                </View>
            ) : (
                <FlatList
                    data={filteredTransactions}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.emptyArea}>
                            <Receipt size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Belum ada riwayat transaksi</Text>
                        </View>
                    }
                />
            )}

            {/* Detail Modal Overlay */}
            <Modal
                visible={!!selectedTx}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedTx(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Detail Transaksi</Text>
                                <Text style={styles.modalId}>#{selectedTx?.id}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedTx(null)} style={styles.closeBtn}>
                                <X size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1 }}>
                            <FlatList
                                data={selectedTx?.items || []}
                                keyExtractor={(_, i) => i.toString()}
                                style={styles.modalScroll}
                                ListHeaderComponent={() => (
                                    <View style={styles.txInfoCard}>
                                        <View style={styles.txInfoRow}>
                                            <Text style={styles.txInfoLabel}>Waktu</Text>
                                            <Text style={styles.txInfoValue}>{selectedTx ? formatDate(selectedTx.timestamp) : ''}</Text>
                                        </View>
                                        <View style={styles.txInfoRow}>
                                            <Text style={styles.txInfoLabel}>Metode Pembayaran</Text>
                                            <Text style={[styles.txInfoValue, { color: '#1E40AF', fontWeight: '900' }]}>{(selectedTx?.payment_method || 'Tunai').toUpperCase()}</Text>
                                        </View>
                                    </View>
                                )}
                                renderItem={({ item }) => (
                                    <View style={styles.modalItemRow}>
                                        <View style={styles.modalItemLeft}>
                                            <View style={styles.modalQtyBadge}>
                                                <Text style={styles.modalQtyText}>x{item.qty || item.quantity || 1}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.modalItemName}>{item.name}</Text>
                                                <Text style={styles.modalItemPrice}>@{formatCurrency(item.price)}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.modalItemSubtotal}>{formatCurrency(item.price * (item.qty || item.quantity || 1))}</Text>
                                    </View>
                                )}
                                ListFooterComponent={() => (
                                    <View style={styles.modalFooter}>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.grandTotalLabel}>Total Bayar</Text>
                                            <Text style={styles.grandTotalValue}>{selectedTx ? formatCurrency(selectedTx.total) : '0'}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.printBtn}
                                            onPress={() => setShowReceipt(true)}
                                        >
                                            <Receipt size={20} color="#FFFFFF" />
                                            <Text style={styles.printBtnText}>Cetak Struk</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Receipt Preview Modal */}
            <ReceiptModal
                visible={showReceipt}
                onClose={() => setShowReceipt(false)}
                transaction={selectedTx}
            />
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    topNavbar: {
        backgroundColor: '#1E40AF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    heroArea: {
        backgroundColor: '#F8FAFC',
    },
    heroBackground: {
        backgroundColor: '#1E40AF',
        paddingBottom: 60, // Sesuaikan padding agar proporsional
        paddingHorizontal: 20,
        borderBottomLeftRadius: 48,
        borderBottomRightRadius: 48,
        marginTop: -1,
        position: 'relative', // Penting untuk koordinat kartu melayang
    },
    statsContainer: {
        position: 'absolute',
        bottom: -35, // Membuat kartu berada di tengah antara biru dan putih
        left: 20,
        right: 20,
        zIndex: 20, // Memastikan berada di atas filter section
    },
    filterSection: {
        marginTop: 55, // Memberikan ruang agar tidak tertutup kartu melayang
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
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.03)' },
            android: { elevation: 2 }
        })
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
    modalOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalId: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginTop: 2,
    },
    closeBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#F1F5F9',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScroll: {
        paddingHorizontal: 24,
    },
    txInfoCard: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        marginTop: 16,
        marginBottom: 24,
    },
    txInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    txInfoLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    txInfoValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    modalItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    modalQtyBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 12,
    },
    modalQtyText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#1E40AF',
    },
    modalItemName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalItemPrice: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    modalItemSubtotal: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
        marginLeft: 10,
    },
    modalFooter: {
        paddingVertical: 24,
        borderTopWidth: 1,
        borderColor: '#F1F5F9',
        marginTop: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    grandTotalValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E40AF',
    },
    printBtn: {
        backgroundColor: '#1E40AF',
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 30,
    },
    printBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    }
});

export default TransactionHistory;
