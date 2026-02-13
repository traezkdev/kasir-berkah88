import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    RefreshControl,
    Platform,
    StatusBar,
    Image,
    KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Star,
    Trash2,
    Edit2,
    MessageCircle,
    User,
    Calendar,
    Save,
    X
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';

const ReviewManagement = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [editValues, setEditValues] = useState({ rating: 0, comment: '' });

    const fetchReviews = useCallback(async () => {
        try {
            console.log('Fetching reviews...');
            const response = await apiService.get('/api/reviews');
            console.log('Reviews response:', response.data);
            setReviews(response.data.data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            showToast('Gagal mengambil data review', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchReviews();
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Hapus Review",
            "Apakah Anda yakin ingin menghapus review ini?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiService.delete(`/api/reviews/${id}`);
                            showToast('Review berhasil dihapus', 'success');
                            fetchReviews();
                        } catch (error) {
                            console.error('Error deleting review:', error);
                            showToast('Gagal menghapus review', 'error');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (review) => {
        setSelectedReview(review);
        setEditValues({
            rating: review.rating,
            comment: review.comment
        });
        setEditModalVisible(true);
    };

    const submitEdit = async () => {
        if (!selectedReview) return;

        // Simple Validation
        if (editValues.rating < 1 || editValues.rating > 5) {
            showToast('Rating harus antara 1 dan 5', 'error');
            return;
        }

        try {
            await apiService.put(`/api/reviews/${selectedReview.id}`, {
                rating: editValues.rating,
                comment: editValues.comment
            });
            showToast('Review berhasil diperbarui', 'success');
            setEditModalVisible(false);
            fetchReviews();
        } catch (error) {
            console.error('Error updating review:', error);
            showToast('Gagal memperbarui review', 'error');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <User size={20} color="#64748B" />
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.customer_name || 'Pelanggan'}</Text>
                        <Text style={styles.dateText}>
                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </Text>
                    </View>
                </View>
                <View style={styles.ratingBadge}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>

            <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Menu:</Text>
                <Text style={styles.menuName}>{item.menu_name || 'Item dihapus'}</Text>
            </View>

            <View style={styles.commentContainer}>
                <MessageCircle size={16} color="#94A3B8" style={{ marginTop: 2, marginRight: 8 }} />
                <Text style={styles.commentText}>{item.comment || '-'}</Text>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#E2E8F0' }]}
                    onPress={() => handleEdit(item)}
                >
                    <Edit2 size={16} color="#3B82F6" />
                    <Text style={[styles.actionText, { color: '#3B82F6' }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Trash2 size={16} color="#EF4444" />
                    <Text style={[styles.actionText, { color: '#EF4444' }]}>Hapus</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Review</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#138FEA" />
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#138FEA']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MessageCircle size={60} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>Belum ada review</Text>
                            <Text style={styles.emptySubtitle}>Review pelanggan akan muncul di sini</Text>
                        </View>
                    }
                />
            )}

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Review</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Rating (1-5)</Text>
                            <View style={styles.ratingInputContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => setEditValues({ ...editValues, rating: star })}
                                    >
                                        <Star
                                            size={32}
                                            color={star <= editValues.rating ? "#F59E0B" : "#E2E8F0"}
                                            fill={star <= editValues.rating ? "#F59E0B" : "none"}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Komentar</Text>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                numberOfLines={4}
                                value={editValues.comment}
                                onChangeText={(text) => setEditValues({ ...editValues, comment: text })}
                                placeholder="Tulis komentar..."
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={submitEdit}
                            >
                                <Save size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={styles.saveBtnText}>Simpan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#64748B',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    dateText: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#B45309',
        marginLeft: 4,
    },
    menuInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    menuLabel: {
        fontSize: 12,
        color: '#64748B',
        marginRight: 4,
    },
    menuName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
        flex: 1,
    },
    commentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    commentText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 10,
    },
    ratingInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    textArea: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#334155',
        minHeight: 100,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    saveBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#138FEA',
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    }
});

export default ReviewManagement;
