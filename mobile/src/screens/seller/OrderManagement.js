import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    RefreshControl,
    StatusBar,
    Alert,
    Modal
} from 'react-native';
import {
    ChevronLeft,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    Slash,
    ShoppingBag,
    Trash2,
    AlertTriangle
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import SellerOrderCard from '../../components/SellerOrderCard';
import ReceiptModal from '../../components/ReceiptModal';
import OrderDetailModal from '../../components/OrderDetailModal';
import { useConfirm } from '../../context/ConfirmContext';
import { useOrderNotification } from '../../context/OrderNotificationContext';
import { useToast } from '../../context/ToastContext';

const OrderManagement = ({ navigation, route }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState(route.params?.status || 'pending');
    const { confirm } = useConfirm();
    const { refreshTrigger } = useOrderNotification();
    const { showToast } = useToast();

    // Delete State
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [showDeleteSingleConfirm, setShowDeleteSingleConfirm] = useState(false);
    const [selectedOrderToDelete, setSelectedOrderToDelete] = useState(null);

    // Efek untuk menangkap perubahan status dari navigasi luar (misal: dari Chat)
    useEffect(() => {
        if (route.params?.status) {
            setActiveTab(route.params.status);
        }
    }, [route.params?.status]);

    // Receipt & Detail Modal State
    const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

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
    }, [fetchOrders, refreshTrigger]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders(true);
    };

    const handleUpdateStatus = useCallback(async (orderId, status, forceIgnoreStock = false) => {
        try {
            await apiService.put(`/api/orders/${orderId}/status`, {
                status,
                ignoreStock: forceIgnoreStock
            });
            showToast('Status berhasil diperbarui', 'success');
            fetchOrders(true);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Gagal memperbarui status';

            // Handle Stock Validation Error - Auto Retry with Ignore Stock
            if (status === 'accepted' && !forceIgnoreStock && (errorMsg.includes('stok') || errorMsg.includes('Stok'))) {
                console.log('Stock validation failed, auto-retrying with ignoreStock...');
                return handleUpdateStatus(orderId, status, true);
            }

            showToast(errorMsg, 'error');
            console.error('Error updating status:', error);
        }
    }, [showToast, fetchOrders]);

    const handleViewReceipt = (order) => {
        // Tetap simpan ini jika nanti ingin mencetak struk dari sini
        const transactionFormat = {
            id: order.id,
            timestamp: order.created_at,
            items: typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []),
            total: order.total,
            payment_method: order.payment_method || 'TRANSFER',
            seller_name: order.customer_name,
            notes: order.note || order.customer_address,
            cash_paid: order.total,
            change: 0
        };
        setSelectedOrderForReceipt(transactionFormat);
        setShowReceiptModal(true);
    };

    const handleViewDetail = useCallback((order) => {
        setSelectedOrderForDetail(order);
        setShowDetailModal(true);
    }, []);

    const handleAccept = useCallback((orderId) => {
        handleUpdateStatus(orderId, 'accepted');
    }, [handleUpdateStatus]);

    const handleComplete = useCallback((orderId) => {
        handleUpdateStatus(orderId, 'completed');
    }, [handleUpdateStatus]);

    const handleReject = useCallback((orderId) => {
        handleUpdateStatus(orderId, 'rejected');
    }, [handleUpdateStatus]);


    // Delete Functions
    const confirmDeleteAllAction = async () => {
        try {
            setLoading(true);
            const response = await apiService.delete('/api/orders/delete-all/confirm');
            if (response.data && response.data.message === 'deleted_all') {
                setShowDeleteAllConfirm(false);
                fetchOrders(true);
                Alert.alert("Berhasil", `Berhasil menghapus ${response.data.count} pesanan ke sampah.`);
            } else {
                Alert.alert("Info", "Tidak ada pesanan yang dihapus.");
                setShowDeleteAllConfirm(false);
            }
        } catch (error) {
            console.error('Delete all orders error:', error);
            Alert.alert("Error", "Gagal menghapus semua pesanan.");
            setShowDeleteAllConfirm(false);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDeleteSingle = (order) => {
        setSelectedOrderToDelete(order);
        setShowDeleteSingleConfirm(true);
    };

    const confirmDeleteSingleAction = async () => {
        if (!selectedOrderToDelete) return;
        try {
            setLoading(true);
            const response = await apiService.delete(`/api/orders/${selectedOrderToDelete.id}`);
            if (response.data && response.data.message === 'deleted') {
                setShowDeleteSingleConfirm(false);
                setSelectedOrderToDelete(null);
                // Remove from list immediately
                setOrders(prev => prev.filter(o => o.id !== selectedOrderToDelete.id));
                showToast('Pesanan berhasil dihapus', 'success');
            }
        } catch (error) {
            console.error('Delete order error:', error);
            showToast('Gagal menghapus pesanan', 'error');
            setShowDeleteSingleConfirm(false);
        } finally {
            setLoading(false);
        }
    };

    const renderOrderItem = useCallback(({ item }) => (
        <SellerOrderCard
            order={item}
            onViewDetail={handleViewDetail}
            onAccept={activeTab === 'pending' ? handleAccept : null}
            onComplete={activeTab === 'accepted' ? handleComplete : null}
            onReject={(activeTab === 'pending' || activeTab === 'accepted') ? handleReject : null}
            onDelete={handleDeleteSingle}
        />
    ), [activeTab, handleViewDetail, handleAccept, handleComplete, handleReject]);

    const tabs = [
        { id: 'pending', label: 'Baru', icon: Clock },
        { id: 'accepted', label: 'Diproses', icon: ShoppingBag },
        { id: 'completed', label: 'Selesai', icon: CheckCircle },
        { id: 'rejected', label: 'Ditolak', icon: XCircle },
        { id: 'cancelled', label: 'Batal', icon: Slash },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Pesanan</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('OrderTrash')} style={[styles.headerAction, { backgroundColor: '#F1F5F9' }]}>
                        <Trash2 size={20} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => fetchOrders()} style={styles.headerAction}>
                        <RefreshCw size={20} color="#1E293B" className={loading ? 'animate-spin' : ''} />
                    </TouchableOpacity>
                </View>
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
                    renderItem={renderOrderItem}
                />
            )}

            {/* Receipt Modal */}
            {selectedOrderForReceipt && (
                <ReceiptModal
                    visible={showReceiptModal}
                    onClose={() => setShowReceiptModal(false)}
                    transaction={selectedOrderForReceipt}
                />
            )}

            {/* Order Detail Modal (Modern Card View) */}
            {selectedOrderForDetail && (
                <OrderDetailModal
                    visible={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    order={selectedOrderForDetail}
                />
            )}

            {/* Delete Single Confirmation Modal */}
            <Modal visible={showDeleteSingleConfirm} transparent animationType="fade">
                <View style={styles.confirmOverlay}>
                    <View style={styles.confirmCard}>
                        <View style={styles.confirmIconBg}>
                            <AlertTriangle size={32} color="#DC2626" />
                        </View>
                        <Text style={styles.confirmTitle}>Hapus Pesanan?</Text>
                        <Text style={styles.confirmSubtitle}>
                            Pesanan dari <Text style={{ fontWeight: '900', color: '#1E293B' }}>{selectedOrderToDelete?.customer_name}</Text> akan dipindahkan ke sampah.
                        </Text>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={styles.confirmCancelBtn}
                                onPress={() => setShowDeleteSingleConfirm(false)}
                                disabled={loading}
                            >
                                <Text style={styles.confirmCancelText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmDeleteBtn}
                                onPress={confirmDeleteSingleAction}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.confirmDeleteText}>Hapus</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


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
    },
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    confirmCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' },
            android: { elevation: 10 }
        })
    },
    confirmIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center'
    },
    confirmSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%'
    },
    confirmCancelBtn: {
        flex: 1,
        height: 48,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    confirmCancelText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B'
    },
    confirmDeleteBtn: {
        flex: 1,
        height: 48,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    confirmDeleteText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF'
    }
});

export default OrderManagement;
