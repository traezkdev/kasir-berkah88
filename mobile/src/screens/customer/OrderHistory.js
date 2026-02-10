import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    SafeAreaView,
    FlatList,
    RefreshControl,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from '../../utils/safeArea';
import {
    ArrowLeft,
    ShoppingBag,
    Clock,
    CheckCircle2,
    XCircle,
    Slash,
    Info,
    MessageCircle,
    RefreshCcw,
    ChevronRight,
    Search,
    Star,
    Utensils,
    Check,
    X as XIcon
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const OrderHistory = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
    const [submittingRating, setSubmittingRating] = useState(false);
    const insets = useSafeAreaInsets();

    const fetchOrders = useCallback(async (pageNum = 1, isRefresh = false) => {
        if (!isRefresh && pageNum === 1) setIsLoading(true);
        try {
            const response = await apiService.get(`/api/orders?page=${pageNum}&limit=10`);
            const result = response.data;

            if (result.message === 'success') {
                const newOrders = result.data;
                if (pageNum === 1) {
                    setOrders(newOrders);
                } else {
                    setOrders(prev => [...prev, ...newOrders]);
                }
                setHasMore(newOrders.length === 10);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(1);
    }, [fetchOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders(1, true);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return { label: 'Baru', icon: Clock, color: '#F59E0B', bg: '#FFFBEB' };
            case 'accepted':
                return { label: 'Diproses', icon: ShoppingBag, color: '#138FEA', bg: '#EFF6FF' };
            case 'ready':
                return { label: 'Siap Diambil', icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5' };
            case 'rejected':
                return { label: 'Ditolak', icon: XCircle, color: '#EF4444', bg: '#FEF2F2' };
            case 'cancelled':
                return { label: 'Batal', icon: Slash, color: '#64748B', bg: '#F8FAFC' };
            case 'completed':
                return { label: 'Selesai', icon: CheckCircle2, color: '#059669', bg: '#ECFDF5' };
            default:
                return { label: status, icon: Info, color: '#64748B', bg: '#F8FAFC' };
        }
    };

    const handleOpenRatingModal = (order) => {
        setSelectedOrderForRating(order);
        setIsRatingModalOpen(true);
    };

    const handleSubmitRating = async (menuItemId, rating, comment) => {
        try {
            setSubmittingRating(true);
            const response = await apiService.post('/api/menu-reviews', {
                menu_item_id: menuItemId,
                order_id: selectedOrderForRating.id,
                rating,
                comment
            });
            return response.status === 200 || response.status === 201;
        } catch (error) {
            console.error("Error submitting rating:", error);
            return false;
        } finally {
            setSubmittingRating(false);
        }
    };

    const renderOrderItem = ({ item }) => {
        const status = getStatusInfo(item.status);
        const orderItems = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.statusIconWrap, { backgroundColor: status.bg }]}>
                            <status.icon size={20} color={status.color} />
                        </View>
                        <View>
                            <Text style={styles.orderId}>ID PESANAN #{item.id}</Text>
                            <Text style={[styles.statusLabel, { color: status.color }]}>{status.label.toUpperCase()}</Text>
                        </View>
                    </View>
                    <Text style={styles.orderTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>

                <View style={styles.cardBody}>
                    {orderItems.slice(0, 2).map((oi, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemName} numberOfLines={1}>{oi.name}</Text>
                            <Text style={styles.itemQty}>x{oi.quantity}</Text>
                        </View>
                    ))}
                    {orderItems.length > 2 && (
                        <Text style={styles.moreItems}>+{orderItems.length - 2} item lainnya</Text>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.totalLabel}>TOTAL PEMBAYARAN</Text>
                        <Text style={styles.totalValue}>{formatCurrency(item.total_amount || item.total)}</Text>
                    </View>
                    <View style={styles.footerActions}>
                        <TouchableOpacity
                            style={styles.detailBtn}
                            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                        >
                            <Text style={styles.detailBtnText}>Detail</Text>
                            <ChevronRight size={12} color="#059669" />
                        </TouchableOpacity>

                        {item.status === 'completed' && (
                            <TouchableOpacity
                                style={styles.ratingBtn}
                                onPress={() => handleOpenRatingModal(item)}
                            >
                                <Star size={12} color="#D97706" fill="#D97706" />
                                <Text style={styles.ratingBtnText}>Rating</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={20} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pesanan Saya</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <RefreshCcw size={18} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loadingArea}>
                    <ActivityIndicator size="large" color="#059669" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
                    ListEmptyComponent={
                        <View style={styles.emptyArea}>
                            <ShoppingBag size={60} color="#E2E8F0" />
                            <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
                            <Text style={styles.emptySubtitle}>Anda belum melakukan pemesanan apapun hari ini.</Text>
                            <TouchableOpacity
                                style={styles.orderNowBtn}
                                onPress={() => navigation.navigate('Menu')}
                            >
                                <Text style={styles.orderNowText}>Pesan Sekarang</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    onEndReached={() => {
                        if (hasMore && !isLoading) {
                            fetchOrders(page + 1);
                        }
                    }}
                    onEndReachedThreshold={0.5}
                />
            )}

            <RatingModal
                visible={isRatingModalOpen}
                order={selectedOrderForRating}
                onClose={() => setIsRatingModalOpen(false)}
                onSubmit={handleSubmitRating}
                submitting={submittingRating}
                insets={insets}
            />
        </SafeAreaView>
    );
};

const RatingModal = ({ visible, order, onClose, onSubmit, submitting, insets }) => {
    const items = typeof order?.items === 'string' ? JSON.parse(order.items) : (order?.items || []);
    const [ratedItems, setRatedItems] = useState({});
    const [loadingExisting, setLoadingExisting] = useState(true);

    useEffect(() => {
        if (visible && order) {
            const fetchExistingReviews = async () => {
                try {
                    const itemIds = items.map(i => i.id).join(',');
                    const response = await apiService.get(`/api/my-reviews?menu_item_ids=${itemIds}`);

                    if (response.data.message === 'success' && response.data.data.length > 0) {
                        const existingData = {};
                        response.data.data.forEach(rev => {
                            existingData[rev.menu_item_id] = {
                                rating: rev.rating,
                                comment: rev.comment || '',
                                submitted: true,
                                isEdit: true
                            };
                        });
                        setRatedItems(prev => ({ ...prev, ...existingData }));
                    }
                } catch (err) {
                    console.error("Error fetching existing reviews:", err);
                } finally {
                    setLoadingExisting(false);
                }
            };
            fetchExistingReviews();
        }
    }, [visible, order?.id]);

    const handleRate = (itemId, rating) => {
        setRatedItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], rating, submitted: false, isEdit: prev[itemId]?.isEdit || false }
        }));
    };

    const handleComment = (itemId, comment) => {
        setRatedItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], comment, submitted: false, isEdit: prev[itemId]?.isEdit || false }
        }));
    };

    const submitItem = async (item) => {
        const itemRating = ratedItems[item.id];
        if (!itemRating || !itemRating.rating) {
            alert("Harap pilih bintang terlebih dahulu!");
            return;
        }

        const success = await onSubmit(item.id, itemRating.rating, itemRating.comment || '');
        if (success) {
            setRatedItems(prev => ({
                ...prev,
                [item.id]: { ...prev[item.id], submitted: true }
            }));
        } else {
            alert("Gagal mengirim ulasan.");
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.modalContent, { paddingBottom: getSafeBottomPadding(insets) }]}
                >
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Beri Ulasan</Text>
                            <Text style={styles.modalSubtitle}>Pesanan #{order?.id}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <XIcon size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {loadingExisting ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#F59E0B" />
                                <Text style={{ marginTop: 12, color: '#94A3B8', fontWeight: 'bold', fontSize: 12 }}>Memuat Ulasan...</Text>
                            </View>
                        ) : (
                            items.map((item, idx) => {
                                const state = ratedItems[item.id] || { rating: 0, comment: '', submitted: false };
                                return (
                                    <View key={idx} style={[styles.reviewItem, state.submitted && styles.submittedItem]}>
                                        <View style={styles.itemInfoHeader}>
                                            <View style={styles.itemIconWrap}>
                                                <Utensils size={20} color="#CBD5E1" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.reviewItemName}>{item.name}</Text>
                                                <Text style={styles.reviewItemSub}>
                                                    {state.submitted ? 'Ulasan Anda Telah Terkirim' : 'Pilih Bintang & Komentar'}
                                                </Text>
                                            </View>
                                            {state.submitted && (
                                                <View style={styles.submittedBadge}>
                                                    <Check size={12} color="#059669" />
                                                    <Text style={styles.submittedText}>Terkirim</Text>
                                                </View>
                                            )}
                                        </View>

                                        {!state.submitted ? (
                                            <>
                                                <View style={styles.starContainer}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <TouchableOpacity
                                                            key={star}
                                                            onPress={() => handleRate(item.id, star)}
                                                            style={styles.starBtn}
                                                        >
                                                            <Star
                                                                size={32}
                                                                color={state.rating >= star ? '#F59E0B' : '#E2E8F0'}
                                                                fill={state.rating >= star ? '#F59E0B' : 'transparent'}
                                                            />
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                                <TextInput
                                                    style={styles.commentInput}
                                                    placeholder="Tulis ulasan Anda (Opsional)..."
                                                    multiline
                                                    placeholderTextColor="#94A3B8"
                                                    value={state.comment}
                                                    onChangeText={(text) => handleComment(item.id, text)}
                                                />
                                                <TouchableOpacity
                                                    style={[styles.submitItemBtn, !state.rating && styles.disabledBtn]}
                                                    onPress={() => submitItem(item)}
                                                    disabled={!state.rating || submitting}
                                                >
                                                    {submitting ? (
                                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                                    ) : (
                                                        <Text style={styles.submitItemBtnText}>
                                                            {state.isEdit ? 'Simpan Perubahan' : 'Kirim Ulasan'}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.editUlasanBtn}
                                                onPress={() => setRatedItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], submitted: false } }))}
                                            >
                                                <Text style={styles.editUlasanBtnText}>EDIT ULASAN</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.modalFinalBtn} onPress={onClose}>
                        <Text style={styles.modalFinalBtnText}>Selesai</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' },
            android: { elevation: 3 }
        })
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderId: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    statusLabel: {
        fontSize: 13,
        fontWeight: '900',
    },
    orderTime: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    cardBody: {
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F8FAFC',
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
        flex: 1,
    },
    itemQty: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    moreItems: {
        fontSize: 11,
        color: '#94A3B8',
        fontStyle: 'italic',
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 2,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#059669',
    },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    detailBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#059669',
    },
    emptyArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    orderNowBtn: {
        backgroundColor: '#059669',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 18,
    },
    orderNowText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
    },
    footerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    ratingBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    ratingBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#D97706',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '85%',
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    closeBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        flex: 1,
    },
    reviewItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    submittedItem: {
        opacity: 0.6,
        backgroundColor: '#F8FAFC',
    },
    itemInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    itemIconWrap: {
        width: 44,
        height: 44,
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewItemName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    reviewItemSub: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    submittedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    submittedText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#059669',
        textTransform: 'uppercase',
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
    },
    starBtn: {
        padding: 4,
    },
    commentInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 15,
        padding: 12,
        fontSize: 13,
        color: '#1E293B',
        height: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
        fontWeight: '600',
    },
    submitItemBtn: {
        backgroundColor: '#F59E0B',
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitItemBtnText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
    },
    disabledBtn: {
        backgroundColor: '#E2E8F0',
        shadowOpacity: 0,
        elevation: 0,
    },
    modalFinalBtn: {
        backgroundColor: '#1E293B',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    modalFinalBtnText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 16,
    },
    editUlasanBtn: {
        backgroundColor: '#F1F5F9',
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    editUlasanBtnText: {
        color: '#64748B',
        fontWeight: '900',
        fontSize: 11,
        letterSpacing: 1,
    }
});

export default OrderHistory;
